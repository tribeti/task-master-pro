import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    if (!supabase) return NextResponse.json({ error: "Lỗi kết nối cơ sở dữ liệu." }, { status: 500 });

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { platform, credentials, projects } = await request.json();

    if (!platform || !credentials || !credentials.token || !Array.isArray(projects) || projects.length === 0) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const importedBoards = [];
    let totalTasks = 0;

    // Lặp qua từng project để import
    for (const project of projects) {
      let remoteColumns: any[] = [];
      let remoteTasks: any[] = [];

      try {
        if (platform === "github") {
          const issuesRes = await fetch(`https://api.github.com/repos/${project.name}/issues?state=all&per_page=100`, {
            headers: { Authorization: `Bearer ${credentials.token}` }
          });
          if (issuesRes.ok) {
            const issues = await issuesRes.json();
            remoteColumns = [
              { id: "open", title: "Open", position: 0 },
              { id: "closed", title: "Closed", position: 1 }
            ];
            remoteTasks = issues.filter((i: any) => !i.pull_request).map((issue: any, idx: number) => ({
              col_id: issue.state === "closed" ? "closed" : "open",
              title: issue.title,
              description: issue.body ? String(issue.body).substring(0, 2000) : "",
              position: idx
            }));
          }
        } else if (platform === "trello") {
          const listsRes = await fetch(`https://api.trello.com/1/boards/${project.id}/lists?key=${credentials.key}&token=${credentials.token}`);
          if (listsRes.ok) {
            const lists = await listsRes.json();
            remoteColumns = lists.map((l: any, idx: number) => ({ id: l.id, title: l.name, position: idx }));
          }
          const cardsRes = await fetch(`https://api.trello.com/1/boards/${project.id}/cards?key=${credentials.key}&token=${credentials.token}`);
          if (cardsRes.ok) {
            const cards = await cardsRes.json();
            remoteTasks = cards.map((c: any, idx: number) => ({
              col_id: c.idList,
              title: c.name,
              description: c.desc ? String(c.desc).substring(0, 2000) : "",
              position: idx
            }));
          }
        } else if (platform === "jira") {
          const auth = Buffer.from(`${credentials.email}:${credentials.token}`).toString("base64");
          let domain = credentials.domain;
          if (!domain.startsWith("http")) domain = `https://${domain}`;
          
          const statusesRes = await fetch(`${domain}/rest/api/3/project/${project.id}/statuses`, {
            headers: { Authorization: `Basic ${auth}` }
          });
          if (statusesRes.ok) {
            const statuses = await statusesRes.json();
            if (statuses && statuses.length > 0) {
              remoteColumns = statuses[0].statuses.map((s: any, idx: number) => ({ id: s.id, title: s.name, position: idx }));
            }
          }

          const jql = encodeURIComponent(`project=${project.id}`);
          const searchRes = await fetch(`${domain}/rest/api/3/search?jql=${jql}&maxResults=100`, {
            headers: { Authorization: `Basic ${auth}` }
          });
          if (searchRes.ok) {
            const search = await searchRes.json();
            if (search.issues) {
              remoteTasks = search.issues.map((issue: any, idx: number) => {
                let desc = "";
                try {
                  desc = issue.fields.description?.content?.[0]?.content?.[0]?.text || "";
                } catch(e) {}
                return {
                  col_id: issue.fields.status?.id,
                  title: issue.fields.summary,
                  description: String(desc).substring(0, 2000),
                  position: idx
                };
              });
            }
          }
        }
      } catch (err) {
        console.error(`Lỗi kéo dữ liệu từ ${platform}:`, err);
      }

      // AC 5.1: Validate dự án trống
      if (remoteColumns.length === 0 && remoteTasks.length === 0) {
        return NextResponse.json({ error: `Dự án nguồn "${project.name}" không có dữ liệu để import` }, { status: 400 });
      }

      // 1. Tạo Board (AC 3.1 & AC 3.2)
      const { data: boardData, error: boardError } = await supabase
        .from("boards")
        .insert([
          {
            title: project.name,
            description: project.description || null,
            is_private: true, // AC 3.2
            owner_id: user.id, // AC 3.2
            tag: "Imported",
            color: platform === "trello" ? "#28B8FA" : platform === "jira" ? "#A78BFA" : "#FF8B5E"
          }
        ])
        .select()
        .single();

      if (boardError || !boardData) {
        console.error("Lỗi tạo board:", boardError);
        continue;
      }
      importedBoards.push(boardData);

      // 2. Tạo Columns (AC 3.3)
      if (remoteColumns.length > 0) {
        const columnsToInsert = remoteColumns.map((c: any) => ({
          board_id: boardData.id,
          title: c.title,
          position: c.position
        }));

        const { data: insertedColumns, error: colError } = await supabase
          .from("columns")
          .insert(columnsToInsert)
          .select();

        if (colError || !insertedColumns) {
          console.error("Lỗi tạo columns:", colError);
          continue;
        }

        // Tạo map: remote_column_id -> new_db_column_id
        const colMap: Record<string, number> = {};
        remoteColumns.forEach((remoteCol: any) => {
          const insertedCol = insertedColumns.find((c) => c.title === remoteCol.title && c.position === remoteCol.position);
          if (insertedCol) {
            colMap[remoteCol.id] = insertedCol.id;
          }
        });

        // 3. Tạo Tasks (AC 3.4)
        if (remoteTasks.length > 0) {
          const tasksToInsert = remoteTasks
            .filter((t: any) => colMap[t.col_id] !== undefined)
            .map((t: any) => ({
              column_id: colMap[t.col_id],
              title: t.title,
              description: t.description || null,
              position: t.position
            }));

          if (tasksToInsert.length > 0) {
            const { error: taskError } = await supabase
              .from("tasks")
              .insert(tasksToInsert);
            
            if (taskError) {
              console.error("Lỗi tạo tasks:", taskError);
            } else {
              totalTasks += tasksToInsert.length;
            }
          }
        }
      }
    }

    return NextResponse.json({ success: true, importedBoards, totalTasks });
  } catch (error: any) {
    console.error("Import error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
