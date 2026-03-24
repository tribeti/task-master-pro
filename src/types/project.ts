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
