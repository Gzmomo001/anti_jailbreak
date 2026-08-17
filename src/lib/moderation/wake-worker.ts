import "server-only";

export async function wakeModerationWorker(accessToken: string): Promise<void> {
  const url = process.env.SUPABASE_EDGE_FUNCTION_URL;
  const secret = process.env.MODERATION_WORKER_SECRET;

  if (!url || !secret) {
    return;
  }

  const response = await fetch(url, {
    method: "POST",
    headers: {
      authorization: `Bearer ${accessToken}`,
      "content-type": "application/json",
      "x-worker-secret": secret,
    },
    body: JSON.stringify({ source: "next-after" }),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Moderation worker wake-up failed: ${response.status}`);
  }
}
