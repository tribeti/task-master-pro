import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

const mockRemoteData: Record<string, any> = {
  "tr-1": {
    name: "Website Redesign",
    description: "Bảng quản lý dự án thiết kế lại website",
    columns: [
      { id: "col1", title: "To Do", position: 0 },
      { id: "col2", title: "In Progress", position: 1 },
      { id: "col3", title: "Done", position: 2 }
    ],
    tasks: [
      { col_id: "col1", title: "Thiết kế Homepage", description: "Design Figma cho trang chủ", position: 0 },
      { col_id: "col1", title: "Thiết kế About Page", description: "Cập nhật thông tin công ty", position: 1 },
      { col_id: "col2", title: "Setup Next.js", description: "Khởi tạo project Next.js và Tailwind CSS", position: 0 },
      { col_id: "col3", title: "Lấy yêu cầu KH", description: "Xong requirement specs", position: 0 }
    ]
  },
  "tr-2": {
    name: "Marketing Campaign",
    description: "Chiến dịch Q3/2026",
    columns: [
      { id: "c1", title: "Ideas", position: 0 },
      { id: "c2", title: "Executing", position: 1 }
    ],
    tasks: [
      { col_id: "c1", title: "Nghiên cứu đối thủ", description: "Tập hợp các quảng cáo của đối thủ", position: 0 },
      { col_id: "c2", title: "Chạy Ads Facebook", description: "Ngân sách 5tr", position: 0 }
    ]
  },
  "tr-3": {
    name: "Product Roadmap",
    description: "Kế hoạch phát triển sản phẩm",
    columns: [
      { id: "c1", title: "Q3", position: 0 },
      { id: "c2", title: "Q4", position: 1 }
    ],
    tasks: [
      { col_id: "c1", title: "Ra mắt tính năng Import", description: "Import Trello/Jira", position: 0 }
    ]
  },
  "ji-1": {
    name: "Task Master Pro (TMP)",
    description: "Dự án phát triển phần mềm quản lý",
    columns: [
      { id: "jc1", title: "Backlog", position: 0 },
      { id: "jc2", title: "In Development", position: 1 },
      { id: "jc3", title: "QA", position: 2 }
    ],
    tasks: [
      { col_id: "jc1", title: "TMP-1: Setup DB", description: "Cấu hình Supabase", position: 0 },
      { col_id: "jc2", title: "TMP-2: Authentication", description: "Sử dụng NextAuth hoặc Supabase Auth", position: 0 }
    ]
  },
  "ji-2": {
    name: "Mobile App (MOB)",
    description: "Ứng dụng di động iOS/Android",
    columns: [
      { id: "mc1", title: "Sprint 1", position: 0 },
      { id: "mc2", title: "Sprint 2", position: 1 }
    ],
    tasks: [
      { col_id: "mc1", title: "MOB-1: UI Login", description: "Màn hình đăng nhập", position: 0 },
      { col_id: "mc2", title: "MOB-2: Tích hợp API", description: "Kết nối backend", position: 0 }
    ]
  },
  "gh-1": {
    name: "tamcu/task-master-pro",
    description: "Repository chính của dự án",
    columns: [
      { id: "gc1", title: "Open Issues", position: 0 },
      { id: "gc2", title: "In Progress", position: 1 },
      { id: "gc3", title: "Closed", position: 2 }
    ],
    tasks: [
      { col_id: "gc1", title: "Bug: Header overlap", description: "Header đang đè lên content ở mobile", position: 0 },
      { col_id: "gc2", title: "Feature: Import", description: "Đang làm tính năng import data", position: 0 }
    ]
  },
  "gh-2": {
    name: "facebook/react",
    description: "Thư viện ReactJS",
    columns: [
      { id: "rc1", title: "Issues", position: 0 }
    ],
    tasks: [
      { col_id: "rc1", title: "Investigate hydration error", description: "Check server/client mismatch", position: 0 }
    ]
  }
};

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    if (!supabase) return NextResponse.json({ error: "Lỗi kết nối cơ sở dữ liệu." }, { status: 500 });

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { platform, token, projects } = await request.json();

    if (!platform || !token || !Array.isArray(projects) || projects.length === 0) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const importedBoards = [];
    let totalTasks = 0;

    // Lặp qua từng project để import
    for (const project of projects) {
      const mockProject = mockRemoteData[project.id];
      if (!mockProject) continue; // Nếu không tìm thấy mock data

      // 1. Tạo Board (AC 3.1 & AC 3.2)
      const { data: boardData, error: boardError } = await supabase
        .from("boards")
        .insert([
          {
            title: mockProject.name,
            description: mockProject.description || null,
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
      if (mockProject.columns && mockProject.columns.length > 0) {
        const columnsToInsert = mockProject.columns.map((c: any) => ({
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

        // Tạo map: mock_column_id -> new_db_column_id
        const colMap: Record<string, number> = {};
        mockProject.columns.forEach((mockCol: any) => {
          const insertedCol = insertedColumns.find((c) => c.title === mockCol.title && c.position === mockCol.position);
          if (insertedCol) {
            colMap[mockCol.id] = insertedCol.id;
          }
        });

        // 3. Tạo Tasks (AC 3.4)
        if (mockProject.tasks && mockProject.tasks.length > 0) {
          const tasksToInsert = mockProject.tasks
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
