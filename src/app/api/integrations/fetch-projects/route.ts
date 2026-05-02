import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { platform, credentials } = await request.json();

    if (!platform || !credentials || !credentials.token) {
      return NextResponse.json({ error: "Thiếu thông tin xác thực" }, { status: 400 });
    }

    let projects = [];

    if (platform === "github") {
      const res = await fetch("https://api.github.com/user/repos?per_page=100&sort=updated", {
        headers: { Authorization: `Bearer ${credentials.token}` }
      });
      
      if (!res.ok) throw new Error("Token GitHub không hợp lệ hoặc hết hạn");
      
      const data = await res.json();
      projects = data.map((repo: any) => ({
        id: repo.id.toString(),
        name: repo.full_name,
        description: repo.description || "Không có mô tả"
      }));
    } else if (platform === "trello") {
      if (!credentials.key) throw new Error("Thiếu Trello API Key");
      
      const res = await fetch(`https://api.trello.com/1/members/me/boards?key=${credentials.key}&token=${credentials.token}`);
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
      if (!domain.startsWith("http")) domain = `https://${domain}`;
      
      const res = await fetch(`${domain}/rest/api/3/project`, {
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
