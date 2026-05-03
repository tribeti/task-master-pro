import { NextRequest, NextResponse } from "next/server";

const fetchWithTimeout = async (url: string, options: RequestInit = {}, timeoutMs = 15000) => {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(id);
    return response;
  } catch (error: any) {
    clearTimeout(id);
    if (error.name === 'AbortError') {
      throw new Error(`Kết nối bị gián đoạn (timeout sau ${timeoutMs}ms)`);
    }
    throw error;
  }
};

export async function POST(request: NextRequest) {
  try {
    const { platform, credentials } = await request.json();

    if (!platform || !credentials || !credentials.token) {
      return NextResponse.json({ error: "Thiếu thông tin xác thực" }, { status: 400 });
    }

    let projects = [];

    if (platform === "github") {
      let page = 1;
      let hasMore = true;
      while (hasMore) {
        const res = await fetchWithTimeout(`https://api.github.com/user/repos?per_page=100&page=${page}&sort=updated`, {
          headers: { Authorization: `Bearer ${credentials.token}` }
        });
        
        if (!res.ok) {
          if (page === 1) throw new Error("Token GitHub không hợp lệ hoặc hết hạn");
          break;
        }
        
        const data = await res.json();
        if (!Array.isArray(data) || data.length === 0) {
          hasMore = false;
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
      }
    } else if (platform === "trello") {
      if (!credentials.key) throw new Error("Thiếu Trello API Key");
      
      const res = await fetchWithTimeout(`https://api.trello.com/1/members/me/boards?key=${credentials.key}&token=${credentials.token}`);
      if (!res.ok) throw new Error("Trello Key hoặc Token không hợp lệ");
      
      const data = await res.json();
      projects = data.map((board: any) => ({
        id: board.id,
        name: board.name,
        description: board.desc || "Không có mô tả"
      }));
    } else if (platform === "jira") {
      if (!credentials.domain || !credentials.email) throw new Error("Thiếu Domain hoặc Email Jira");
      
      const auth = Buffer.from(`${credentials.email}:${credentials.token}`).toString("base64");
      let domain = credentials.domain;
      try {
        const url = new URL(domain.startsWith("http") ? domain : `https://${domain}`);
        if (!url.hostname.endsWith(".atlassian.net")) {
          throw new Error("Domain Jira không hợp lệ. Domain phải kết thúc bằng '.atlassian.net'");
        }
        domain = url.origin;
      } catch (e: any) {
        throw new Error(e.message || "Domain Jira không hợp lệ.");
      }
      
      const res = await fetchWithTimeout(`${domain}/rest/api/3/project`, {
        headers: { Authorization: `Basic ${auth}` }
      });
      if (!res.ok) throw new Error("Jira Domain, Email hoặc Token không hợp lệ");
      
      const data = await res.json();
      projects = data.map((project: any) => ({
        id: project.id,
        name: project.name,
        description: project.description || `Key: ${project.key}`
      }));
    } else {
      return NextResponse.json({ error: "Nền tảng không được hỗ trợ" }, { status: 400 });
    }

    return NextResponse.json({ projects });
  } catch (error: any) {
    console.error("Fetch projects error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
