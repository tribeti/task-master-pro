export interface Board {
  id: number;
  title: string;
  progress?: number;
  color?: string;
  tag?: string;
  team?: number;
  description?: string;
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

export interface User {
  id: string;
  email: string;
  display_name: string;
  avatar_url: string;
}
