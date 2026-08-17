import {
  CircleAlert,
  CircleCheck,
  Clock3,
  SearchCheck,
  XCircle,
} from "lucide-react";

import type { ModerationState } from "@/lib/app-types";

const statusConfig = {
  pending: {
    label: "等待模型审核",
    detail: "任务已进入队列",
    className: "text-[#a46506]",
    icon: Clock3,
  },
  approved: {
    label: "审核通过",
    detail: "用户名可以公开展示",
    className: "text-[#087f68]",
    icon: CircleCheck,
  },
  rejected: {
    label: "审核拒绝",
    detail: "该候选名称不会公开",
    className: "text-[#dc3f4c]",
    icon: XCircle,
  },
  needs_human_review: {
    label: "等待人工审核",
    detail: "暂不自动处理该候选名称",
    className: "text-[#a46506]",
    icon: SearchCheck,
  },
  error: {
    label: "审核服务出错",
    detail: "可以联系管理员或重新审核",
    className: "text-[#dc3f4c]",
    icon: CircleAlert,
  },
} satisfies Record<
  ModerationState,
  {
    label: string;
    detail: string;
    className: string;
    icon: typeof Clock3;
  }
>;

export function ModerationStatus({ state }: { state: ModerationState }) {
  const config = statusConfig[state];
  const Icon = config.icon;

  return (
    <span className={`inline-flex items-center gap-2 ${config.className}`}>
      <Icon aria-hidden="true" className="size-4" />
      <span>
        <span className="font-semibold">{config.label}</span>
        <span className="ml-2 hidden text-sm text-[#626a67] sm:inline">
          {config.detail}
        </span>
      </span>
    </span>
  );
}
