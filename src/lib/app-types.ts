export type ModerationState =
  | "pending"
  | "approved"
  | "rejected"
  | "needs_human_review"
  | "error";

export type Profile = {
  id: string;
  published_username: string | null;
  pending_username: string | null;
  moderation_state: ModerationState;
  moderation_revision: number;
  moderation_reason: string | null;
  moderation_updated_at: string;
};

export type ResourceDocument = {
  id: string;
  slug: string;
  title: string;
  summary: string;
  content: string;
  access_mode: "authenticated" | "explicit";
  version: string;
  document_size: string;
  updated_at: string;
};

export type VisibleMember = {
  account_id: string;
  username: string;
  published_at: string;
};
