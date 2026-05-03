import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { fetchWithTimeout } from "@/utils/fetch-utils";

export async function POST(request: NextRequest) {
  // ── Auth guard: block anonymous proxy abuse ──
  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.json({ error: "Lỗi kết nối cơ sở dữ liệu." }, { status: 500 });
  }
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { platform, credentials } = body;

  // ── Input validation ──
  if (!platform || !credentials || !credentials.token) {
    return NextResponse.json({ error: "Thiếu thông tin xác thực" }, { status: 400 });
  }
  if (platform === "trello" && !credentials.key) {
    return NextResponse.json({ error: "Thiếu Trello API Key" }, { status: 400 });
  }
  if (platform === "jira" && (!credentials.domain || !credentials.email)) {
    return NextResponse.json({ error: "Thiếu Domain hoặc Email Jira" }, { status: 400 });
  }
  if (!["github", "trello", "jira"].includes(platform)) {
    return NextResponse.json({ error: "Nền tảng không được hỗ trợ" }, { status: 400 });
  }

  try {
    let projects: any[] = [];

    const handleUpstreamError = async (res: Response, platformName: string) => {
      if (res.ok) return;
      const status = res.status;
      let message = `${platformName} trả lỗi ${status}`;
      
      if (status === 401 || status === 403) {
        message = `Thông tin xác thực ${platformName} không hợp lệ hoặc không đủ quyền truy cập (yêu cầu 'read:project' đối với GitHub)`;
      } else if (status === 429) {
        message = `Đang bị giới hạn yêu cầu (Rate limit) từ ${platformName}. Vui lòng thử lại sau.`;
      } else if (status >= 500) {
        message = `Dịch vụ ${platformName} đang gặp sự cố. Vui lòng thử lại sau.`;
      }
      
      throw Object.assign(new Error(message), { status });
    };

    if (platform === "github") {
      // ── Pagination Helper for GitHub GraphQL ──
      const fetchGitHub = async (query: string, variables: any) => {
        const res = await fetchWithTimeout("https://api.github.com/graphql", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${credentials.token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ query, variables }),
        });
        await handleUpstreamError(res, "GitHub");
        const json = await res.json();
        if (json.errors && json.errors.length > 0) {
          throw new Error(`GitHub GraphQL Error: ${json.errors[0].message}`);
        }
        return json.data;
      };

      // 1. Fetch personal projects
      let hasNextPage = true;
      let after: string | null = null;
      let pageCount = 0;
      while (hasNextPage && pageCount < 10) {
        const data = await fetchGitHub(`
          query($after: String) {
            viewer {
              projectsV2(first: 50, after: $after) {
                nodes { id title shortDescription }
                pageInfo { hasNextPage endCursor }
              }
            }
          }
        `, { after });
        
        const p2 = data.viewer.projectsV2;
        projects.push(...p2.nodes.map((p: any) => ({
          id: p.id,
          name: p.title,
          description: p.shortDescription || "GitHub Project (Personal)",
        })));
        
        hasNextPage = p2.pageInfo.hasNextPage;
        after = p2.pageInfo.endCursor;
        pageCount++;
      }

      // 2. Fetch organization projects
      let orgHasNextPage = true;
      let orgAfter: string | null = null;
      let orgPageCount = 0;
      while (orgHasNextPage && orgPageCount < 10) {
        const data = await fetchGitHub(`
          query($after: String) {
            viewer {
              organizations(first: 20, after: $after) {
                nodes {
                  projectsV2(first: 50) {
                    nodes { id title shortDescription }
                  }
                }
                pageInfo { hasNextPage endCursor }
              }
            }
          }
        `, { after: orgAfter });

        data.viewer.organizations.nodes.forEach((org: any) => {
          projects.push(...org.projectsV2.nodes.map((p: any) => ({
            id: p.id,
            name: p.title,
            description: p.shortDescription || "GitHub Project (Org)",
          })));
        });

        orgHasNextPage = data.viewer.organizations.pageInfo.hasNextPage;
        orgAfter = data.viewer.organizations.pageInfo.endCursor;
        orgPageCount++;
      }
    } else if (platform === "trello") {
      const res = await fetchWithTimeout(
        `https://api.trello.com/1/members/me/boards?key=${credentials.key}&token=${credentials.token}`
      );
      await handleUpstreamError(res, "Trello");
      
      const data = await res.json();
      projects = data.map((board: any) => ({
        id: board.id,
        name: board.name,
        description: board.desc || "Không có mô tả",
      }));
    } else if (platform === "jira") {
      const auth = Buffer.from(`${credentials.email}:${credentials.token}`).toString("base64");
      let domain = credentials.domain as string;
      
      try {
        const url = new URL(domain.startsWith("http") ? domain : `https://${domain}`);
        if (!url.hostname.endsWith(".atlassian.net")) {
          throw new Error("Domain Jira không hợp lệ. Domain phải kết thúc bằng '.atlassian.net'");
        }
        domain = url.origin;
      } catch (e: any) {
        throw Object.assign(new Error(e.message || "Domain Jira không hợp lệ."), { status: 400 });
      }

      const res = await fetchWithTimeout(`${domain}/rest/api/3/project`, {
        headers: { Authorization: `Basic ${auth}` },
      });
      await handleUpstreamError(res, "Jira");
      
      const data = await res.json();
      projects = data.map((project: any) => ({
        id: project.id,
        name: project.name,
        description: project.description || `Key: ${project.key}`,
      }));
    }

    return NextResponse.json({ projects });
  } catch (error: any) {
    console.error("Fetch projects error:", error);
    // Preserve explicit client-error status codes; everything else is 500
    const status = typeof error.status === "number" && error.status < 500 ? error.status : 500;
    return NextResponse.json({ error: error.message || "Internal server error" }, { status });
  }
}
