import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { fetchWithTimeout } from "@/utils/fetch-utils";

// Recursively convert Atlassian Document Format (ADF) to plain text
const extractADFText = (node: any): string => {
  if (!node) return "";
  if (node.type === "text" && node.text) return node.text;
  if (Array.isArray(node.content)) return node.content.map(extractADFText).join(" ");
  return "";
};

export async function POST(request: NextRequest) {
  // ── Auth guard ──
  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ error: "Lỗi kết nối cơ sở dữ liệu." }, { status: 500 });

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { platform, credentials, projects } = body;

  // ── Input validation ──
  if (!platform || !credentials || !credentials.token || !Array.isArray(projects) || projects.length === 0) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }
  if (!["github", "trello", "jira"].includes(platform)) {
    return NextResponse.json({ error: "Platform not supported" }, { status: 400 });
  }
  if (platform === "trello" && !credentials.key) {
    return NextResponse.json({ error: "Missing Trello API Key" }, { status: 400 });
  }
  if (platform === "jira" && (!credentials.domain || !credentials.email)) {
    return NextResponse.json({ error: "Missing Jira domain or email" }, { status: 400 });
  }

  // Validate and normalise Jira domain once, before the loop
  let jiraDomain = "";
  if (platform === "jira") {
    const raw = credentials.domain as string;
    try {
      const url = new URL(raw.startsWith("http") ? raw : `https://${raw}`);
      if (!url.hostname.endsWith(".atlassian.net")) {
        return NextResponse.json({ error: "Domain Jira không hợp lệ. Domain phải kết thúc bằng '.atlassian.net'" }, { status: 400 });
      }
      jiraDomain = url.origin;
    } catch {
      return NextResponse.json({ error: "Domain Jira không hợp lệ." }, { status: 400 });
    }
  }

  const importedBoards: any[] = [];
  const failedProjects: { name: string; error: string }[] = [];
  const warnings: { name: string; message: string }[] = [];
  let totalTasks = 0;

  for (const project of projects) {
    let remoteColumns: { id: string; title: string; position: number }[] = [];
    let remoteTasks: { col_id: string; title: string; description: string; position: number }[] = [];

    // ── Fetch remote data ──
    try {
      if (platform === "github") {
        const fetchItems = async (cursor: string | null) => {
          const query = `
            query getProjectData($projectId: ID!, $cursor: String) {
              node(id: $projectId) {
                ... on ProjectV2 {
                  fields(first: 50) {
                    nodes {
                      ... on ProjectV2SingleSelectField {
                        id
                        name
                        options { id name }
                      }
                    }
                  }
                  items(first: 100, after: $cursor) {
                    nodes {
                      id
                      content {
                        ... on Issue { title body }
                        ... on PullRequest { title body }
                        ... on DraftIssue { title body }
                      }
                      fieldValues(first: 20) {
                        nodes {
                          ... on ProjectV2ItemFieldSingleSelectValue {
                            optionId
                            field { ... on ProjectV2SingleSelectField { name } }
                          }
                        }
                      }
                    }
                    pageInfo { hasNextPage endCursor }
                  }
                }
              }
            }
          `;
          const res = await fetchWithTimeout("https://api.github.com/graphql", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${credentials.token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ query, variables: { projectId: project.id, cursor } }),
          });
          if (!res.ok) throw new Error(`GitHub trả lỗi ${res.status}`);
          const { data, errors } = await res.json();
          if (errors && errors.length > 0) throw new Error(errors[0].message);
          return data.node;
        };

        let hasNextPage = true;
        let cursor: string | null = null;
        let pageCount = 0;

        while (hasNextPage && pageCount < 10) {
          const projectData = await fetchItems(cursor);
          if (!projectData) throw new Error("Không tìm thấy dự án GitHub");

          if (pageCount === 0) {
            const statusField = projectData.fields.nodes.find((f: any) => f.name === "Status");
            if (!statusField) throw new Error("Dự án GitHub không có cột 'Status'");
            remoteColumns = statusField.options.map((opt: any, idx: number) => ({
              id: opt.id,
              title: opt.name,
              position: idx,
            }));
          }

          const pageTasks = projectData.items.nodes.map((item: any, idx: number) => {
            const statusValue = item.fieldValues.nodes.find((fv: any) => fv.field?.name === "Status");
            const content = item.content || {};
            return {
              col_id: statusValue?.optionId || remoteColumns[0]?.id,
              title: content.title || "Untitled Item",
              description: content.body ? String(content.body).substring(0, 2000) : "",
              position: remoteTasks.length + idx,
            };
          });

          remoteTasks.push(...pageTasks);
          hasNextPage = projectData.items.pageInfo.hasNextPage;
          cursor = projectData.items.pageInfo.endCursor;
          pageCount++;
        }
      } else if (platform === "trello") {
        const [listsRes, cardsRes] = await Promise.all([
          fetchWithTimeout(`https://api.trello.com/1/boards/${project.id}/lists?key=${credentials.key}&token=${credentials.token}`),
          fetchWithTimeout(`https://api.trello.com/1/boards/${project.id}/cards?key=${credentials.key}&token=${credentials.token}`),
        ]);
        if (!listsRes.ok) throw new Error(`Trello trả lỗi ${listsRes.status} khi lấy danh sách cột`);
        if (!cardsRes.ok) throw new Error(`Trello trả lỗi ${cardsRes.status} khi lấy danh sách thẻ`);

        const [lists, cards] = await Promise.all([listsRes.json(), cardsRes.json()]);
        remoteColumns = lists.map((l: any, idx: number) => ({ id: l.id, title: l.name, position: idx }));
        remoteTasks = cards.map((c: any, idx: number) => ({
          col_id: c.idList,
          title: c.name,
          description: c.desc ? String(c.desc).substring(0, 2000) : "",
          position: idx,
        }));
      } else if (platform === "jira") {
        const auth = Buffer.from(`${credentials.email}:${credentials.token}`).toString("base64");

        const statusesRes = await fetchWithTimeout(`${jiraDomain}/rest/api/3/project/${project.id}/statuses`, {
          headers: { Authorization: `Basic ${auth}` },
        });
        if (!statusesRes.ok) throw new Error(`Jira trả lỗi ${statusesRes.status} khi lấy trạng thái`);
        
        const statuses = await statusesRes.json();
        const allStatusesMap = new Map<string, any>();
        if (Array.isArray(statuses)) {
          statuses.forEach((issueType: any) => {
            if (Array.isArray(issueType.statuses)) {
              issueType.statuses.forEach((s: any) => {
                if (!allStatusesMap.has(s.id)) {
                  allStatusesMap.set(s.id, s);
                }
              });
            }
          });
        }
        
        remoteColumns = Array.from(allStatusesMap.values()).map((s: any, idx: number) => ({
          id: s.id,
          title: s.name,
          position: idx,
        }));

        // Paginate Jira issues (default page size = 50, maxResults capped by Jira)
        let startAt = 0;
        const PAGE_SIZE = 100;
        while (true) {
          const jql = encodeURIComponent(`project="${project.id}" ORDER BY created ASC`);
          const searchRes = await fetchWithTimeout(
            `${jiraDomain}/rest/api/3/search?jql=${jql}&maxResults=${PAGE_SIZE}&startAt=${startAt}`,
            { headers: { Authorization: `Basic ${auth}` } }
          );
          if (!searchRes.ok) throw new Error(`Jira trả lỗi ${searchRes.status} khi lấy danh sách issue (startAt: ${startAt})`);

          const search = await searchRes.json();
          if (!search.issues || search.issues.length === 0) break;

          const mapped = search.issues.map((issue: any, idx: number) => {
            let desc = "";
            try {
              if (issue.fields.description) desc = extractADFText(issue.fields.description);
            } catch { /* ignore */ }
            return {
              col_id: issue.fields.status?.id,
              title: issue.fields.summary,
              description: String(desc).substring(0, 2000),
              position: remoteTasks.length + idx,
            };
          });
          remoteTasks.push(...mapped);

          const total: number = search.total ?? 0;
          startAt += search.issues.length;
          if (startAt >= total || search.issues.length < PAGE_SIZE) break;
        }
      }
    } catch (err: any) {
      console.error(`Lỗi kéo dữ liệu từ ${platform} (${project.name}):`, err);
      failedProjects.push({ name: project.name, error: err.message || "Lỗi không xác định" });
      continue;
    }

    // ── Guard: skip empty projects ──
    if (remoteColumns.length === 0 && remoteTasks.length === 0) {
      console.warn(`Dự án "${project.name}" không có dữ liệu. Bỏ qua.`);
      failedProjects.push({ name: project.name, error: "Dự án không có dữ liệu (cột hoặc thẻ)" });
      continue;
    }

    // ── Guard: tasks without columns would all be dropped → skip the whole project ──
    if (remoteTasks.length > 0 && remoteColumns.length === 0) {
      console.warn(`Dự án "${project.name}" có task nhưng không có column. Bỏ qua để tránh import rỗng.`);
      failedProjects.push({ name: project.name, error: "Dự án có thẻ nhưng không tìm thấy cột tương ứng" });
      continue;
    }

    // ── Transactional per-project write ──
    try {
      const { data: boardData, error: boardError } = await supabase
        .from("boards")
        .insert([{
          title: project.name,
          description: project.description || null,
          is_private: true,
          owner_id: user.id,
          tag: "Imported",
          color: platform === "trello" ? "#28B8FA" : platform === "jira" ? "#A78BFA" : "#FF8B5E",
        }])
        .select()
        .single();

      if (boardError || !boardData) {
        throw new Error(`Lỗi tạo board: ${boardError?.message}`);
      }

      const columnsToInsert = remoteColumns.map((c) => ({
        board_id: boardData.id,
        title: c.title,
        position: c.position,
      }));

      const { data: insertedColumns, error: colError } = await supabase
        .from("columns")
        .insert(columnsToInsert)
        .select();

      if (colError || !insertedColumns) {
        // Rollback orphan board
        await supabase.from("boards").delete().eq("id", boardData.id);
        throw new Error(`Lỗi tạo columns: ${colError?.message}`);
      }

      // Map remote column id → new db column id
      const colMap: Record<string, number> = {};
      remoteColumns.forEach((remoteCol) => {
        const insertedCol = insertedColumns.find(
          (c) => c.title === remoteCol.title && c.position === remoteCol.position
        );
        if (insertedCol) colMap[remoteCol.id] = insertedCol.id;
      });

      if (remoteTasks.length > 0) {
        const validTasks = remoteTasks.filter((t) => colMap[t.col_id] !== undefined);
        const skippedCount = remoteTasks.length - validTasks.length;
        
        if (skippedCount > 0) {
          console.warn(`Dự án "${project.name}": Bỏ qua ${skippedCount} thẻ do không khớp cột.`);
          warnings.push({ 
            name: project.name, 
            message: `Đã bỏ qua ${skippedCount} thẻ không tìm thấy cột tương ứng.` 
          });
        }

        const tasksToInsert = validTasks.map((t) => ({
          column_id: colMap[t.col_id],
          title: t.title,
          description: t.description || null,
          position: t.position,
        }));

        if (tasksToInsert.length > 0) {
          const { error: taskError } = await supabase.from("tasks").insert(tasksToInsert);
          if (taskError) {
            // Rollback board (columns will cascade)
            await supabase.from("boards").delete().eq("id", boardData.id);
            throw new Error(`Lỗi tạo tasks: ${taskError.message}`);
          }
          totalTasks += tasksToInsert.length;
        }
      }

      importedBoards.push(boardData);
    } catch (err: any) {
      console.error(`Lỗi ghi dữ liệu cho ${project.name}:`, err);
      failedProjects.push({ name: project.name, error: err.message || "Lỗi cơ sở dữ liệu" });
    }
  }

  if (importedBoards.length === 0 && projects.length > 0) {
    return NextResponse.json({ 
      success: false, 
      error: "Không thể import bất kỳ dự án nào.", 
      failedProjects 
    }, { status: 500 });
  }

  return NextResponse.json({ 
    success: true, 
    partialSuccess: failedProjects.length > 0 || warnings.length > 0,
    importedBoards, 
    failedProjects,
    warnings,
    totalTasks 
  });
}
