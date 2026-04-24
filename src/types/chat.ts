export interface ChatMessage {
  id: string;
  board_id: number;
  sender_id: string;
  content: string;
  created_at: string;
  updated_at?: string;
  is_edited: boolean;
  users?: {
    display_name: string | null;
    avatar_url: string | null;
  } | null;
}

export interface PresenceState {
  user_id: string;
  display_name: string | null;
  is_typing: boolean;
  last_typed?: string;
}
