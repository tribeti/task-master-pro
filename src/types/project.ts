export interface Board {
  id: number;
  title: string;
  progress?: number;
  color?: string;
  tag?: string | null;
  team?: number;
  description?: string | null;
  owner_id?: string;
  is_private?: boolean;
}

export interface Project {
  id: string;
  title: string;
  description: string | null;
  is_private: boolean;
  created_at: string;
  owner_id: string;
  color: string;
  tag: string | null;
}

export interface Label {
  id: number;
  name: string;
  color_hex: string;
  board_id: number;
}

export interface TaskLabel {
  task_id: number;
  label_id: number;
  labels?: Label;
}

export interface KanbanTask extends Task {
  labels?: Label[];
}

export interface KanbanColumn {
  id: number;
  title: string;
  position: number;
  board_id: number;
}

export interface Task {
  id: number;
  title: string;
  description: string | null;
  deadline: string | null;
  priority: "Low" | "Medium" | "High";
  position: number;
  column_id: number;
  assignee_id: string | null;
}

export interface Comment {
  id: number;
  content: string;
  created_at: string;
  task_id: number;
  user_id: string;
}

export interface BoardMember {
  user_id: string;
  role: string;
  joined_at: string;
  display_name: string;
  avatar_url: string | null;
}

export interface JoinedBoard extends Board {
  member_role: string;
}
