import { z } from "zod";

const moderationDecisionSchema = z.object({
  decision: z.enum(["approve", "reject", "human_review"]),
  reason: z.string().trim().min(1).max(240),
});

export type ModerationDecision = z.infer<typeof moderationDecisionSchema>;

function extractJson(raw: string): string {
  const trimmed = raw.trim();
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  return fenced?.[1] ?? trimmed;
}

export function parseModerationDecision(raw: string): ModerationDecision {
  const payload = JSON.parse(extractJson(raw)) as unknown;
  return moderationDecisionSchema.parse(payload);
}
