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
  /**
   * Client-only field. Set on optimistic messages and retained after the DB
   * row is merged so the realtime INSERT handler can deduplicate even if the
   * id-swap races with the incoming event. Never sent to or stored in the DB.
   */
  _tempId?: string;
}

export interface PresenceState {
  user_id: string;
  display_name: string | null;
  is_typing: boolean;
  last_typed?: string;
}
