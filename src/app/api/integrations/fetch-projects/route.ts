import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

const fetchWithTimeout = async (url: string, options: RequestInit = {}, timeoutMs = 15000) => {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(id);
    return response;
  } catch (error: any) {
    clearTimeout(id);
    if (error.name === "AbortError") {
      throw new Error(`Kết nối bị gián đoạn (timeout sau ${timeoutMs / 1000}s)`);
    }
    throw error;
  }
};

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

    if (platform === "github") {
      // Paginate fully – fail hard if any page fails so the list is never silently truncated
      let page = 1;
      while (true) {
        const res = await fetchWithTimeout(
          `https://api.github.com/user/repos?per_page=100&page=${page}&sort=updated`,
          { headers: { Authorization: `Bearer ${credentials.token}` } }
        );

        if (!res.ok) {
          if (page === 1) {
            // First page failure = invalid token → client error
            const status = res.status === 401 ? 401 : 400;
            throw Object.assign(new Error("Token GitHub không hợp lệ hoặc hết hạn"), { status });
          }
          // Subsequent page failure = upstream error → propagate so caller knows list is incomplete
          throw new Error(`GitHub trả lỗi ${res.status} khi lấy trang ${page}. Danh sách repo có thể chưa đầy đủ.`);
        }

        const data = await res.json();
<<<<<<< HEAD
        if (!Array.isArray(data) || data.length === 0) break;

        projects.push(
          ...data.map((repo: any) => ({
            id: repo.id.toString(),
            name: repo.full_name,
            description: repo.description || "Không có mô tả",
          }))
        );

        if (data.length < 100 || page >= 10) break; // safety cap: 1 000 repos
        page++;
=======
        if (!Array.isArray(data) || data.length === 0) {
          break;
        }
        
        projects.push(...data.map((repo: any) => ({
          id: repo.id.toString(),
          name: repo.full_name,
          description: repo.description || "Không có mô tả"
        })));
        
        if (data.length < 100 || page >= 10) { // Limit to 10 pages for safety
          hasMore = false;
        } else {
          page++;
        }
>>>>>>> d65d75a95ad528ba96eae02d0e7c1b5b3002b02f
      }
    } else if (platform === "trello") {
      const res = await fetchWithTimeout(
        `https://api.trello.com/1/members/me/boards?key=${credentials.key}&token=${credentials.token}`
      );
      if (!res.ok) {
        throw Object.assign(new Error("Trello Key hoặc Token không hợp lệ"), { status: 400 });
      }
      const data = await res.json();
      projects = data.map((board: any) => ({
        id: board.id,
        name: board.name,
        description: board.desc || "Không có mô tả",
      }));
    } else if (platform === "jira") {
      const auth = Buffer.from(`${credentials.email}:${credentials.token}`).toString("base64");
      let domain = credentials.domain as string;
      const url = new URL(domain.startsWith("http") ? domain : `https://${domain}`);
      if (!url.hostname.endsWith(".atlassian.net")) {
        throw Object.assign(new Error("Domain Jira không hợp lệ. Domain phải kết thúc bằng '.atlassian.net'"), { status: 400 });
      }
      domain = url.origin;

      const res = await fetchWithTimeout(`${domain}/rest/api/3/project`, {
        headers: { Authorization: `Basic ${auth}` },
      });
      if (!res.ok) {
        throw Object.assign(new Error("Jira Domain, Email hoặc Token không hợp lệ"), { status: 400 });
      }
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
