import type { ModerationState } from "@/lib/app-types";
import type { ModerationDecision } from "@/modules/moderation-classifier/parse";

export function moderationStateForDecision(
  decision: ModerationDecision["decision"] | "provider_error",
): ModerationState {
  switch (decision) {
    case "approve":
      return "approved";
    case "reject":
      return "rejected";
    case "human_review":
      return "needs_human_review";
    case "provider_error":
      return "error";
  }
}
