import { createClient } from "npm:@supabase/supabase-js@2.112.3";
import { z } from "npm:zod@4.4.3";

const decisionSchema = z.object({
  decision: z.enum(["approve", "reject", "human_review"]),
  reason: z.string().trim().min(1).max(240),
});

type Decision = z.infer<typeof decisionSchema>;

type ModerationJob = {
  job_id: string;
  account_id: string;
  revision: number;
  username_snapshot: string;
};

function extractJson(raw: string): string {
  const trimmed = raw.trim();
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  return fenced?.[1] ?? trimmed;
}

async function classifyUsername(username: string): Promise<Decision> {
  const apiKey = Deno.env.get("SILICONFLOW_API_KEY");
  const model = Deno.env.get("SILICONFLOW_MODEL");

  if (!apiKey || !model) {
    throw new Error("模型环境变量未配置");
  }

  const response = await fetch(
    "https://api.siliconflow.cn/v1/chat/completions",
    {
      method: "POST",
      headers: {
        authorization: `Bearer ${apiKey}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model,
        temperature: 0.1,
        max_tokens: 180,
        messages: [
          {
            role: "system",
            content:
              "你是社区用户名审核器。只输出 JSON，不要 Markdown。" +
              '格式为 {"decision":"approve|reject|human_review","reason":"简短中文原因"}。' +
              "包含仇恨、骚扰、色情、暴力威胁、冒充官方或明显违法含义时 reject；" +
              "存在双关、语境不足或难以确认时 human_review；其他情况 approve。",
          },
          {
            role: "user",
            content: `审核用户名：${JSON.stringify(username)}`,
          },
        ],
      }),
      signal: AbortSignal.timeout(15_000),
    },
  );

  if (!response.ok) {
    throw new Error(`SiliconFlow HTTP ${response.status}`);
  }

  const payload = await response.json();
  const content = payload?.choices?.[0]?.message?.content;
  if (typeof content !== "string") {
    throw new Error("模型未返回文本内容");
  }

  return decisionSchema.parse(JSON.parse(extractJson(content)));
}

Deno.serve(async (request) => {
  if (request.method !== "POST") {
    return Response.json({ error: "method_not_allowed" }, { status: 405 });
  }

  const workerSecret = Deno.env.get("MODERATION_WORKER_SECRET");
  if (
    !workerSecret ||
    request.headers.get("x-worker-secret") !== workerSecret
  ) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceRoleKey) {
    return Response.json({ error: "supabase_env_missing" }, { status: 500 });
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
  const owner = crypto.randomUUID();
  const startedAt = Date.now();
  const processed: Array<{
    jobId: string;
    result: string;
  }> = [];

  const { data: acquired, error: leaseError } = await supabase.rpc(
    "acquire_worker_lease",
    {
      p_owner: owner,
      p_lease_seconds: 90,
    },
  );

  if (leaseError) {
    return Response.json(
      { error: "lease_failed", detail: leaseError.message },
      { status: 500 },
    );
  }

  if (!acquired) {
    return Response.json({ status: "busy", processed }, { status: 202 });
  }

  try {
    while (processed.length < 10 && Date.now() - startedAt < 22_000) {
      const { data, error } = await supabase.rpc(
        "claim_next_moderation_job",
        {
          p_visibility_timeout: 120,
        },
      );

      if (error) {
        throw new Error(`领取审核任务失败：${error.message}`);
      }

      const job = (data?.[0] ?? null) as ModerationJob | null;
      if (!job) break;

      let decision: Decision["decision"] | "provider_error";
      let reason: string;

      try {
        const result = await classifyUsername(job.username_snapshot);
        decision = result.decision;
        reason = result.reason;
      } catch (error) {
        decision = "provider_error";
        reason =
          error instanceof Error ? error.message.slice(0, 240) : "审核服务错误";
      }

      const { data: completion, error: completionError } = await supabase.rpc(
        "complete_moderation_job",
        {
          p_job_id: job.job_id,
          p_decision: decision,
          p_reason: reason,
        },
      );

      if (completionError) {
        throw new Error(`提交审核结果失败：${completionError.message}`);
      }

      processed.push({
        jobId: job.job_id,
        result: String(completion),
      });
    }

    return Response.json({ status: "ok", processed });
  } catch (error) {
    return Response.json(
      {
        status: "error",
        processed,
        error: error instanceof Error ? error.message : "unknown_error",
      },
      { status: 500 },
    );
  } finally {
    await supabase.rpc("release_worker_lease", { p_owner: owner });
  }
});
