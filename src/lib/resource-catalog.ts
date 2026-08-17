import type { ResourceDocument } from "@/lib/app-types";

export const resourceCatalog: ResourceDocument[] = [
  {
    id: "resource-a",
    slug: "a",
    title: "资源 A：项目需求文档",
    summary: "所有登录用户均可查看的产品需求摘要。",
    content:
      "Gatehouse 资源 A 包含项目背景、核心用户流程和公开验收标准。该资源用于验证默认登录授权。",
    access_mode: "authenticated",
    version: "v2.1",
    document_size: "1.2 MB",
    updated_at: "2026-08-16T09:15:00Z",
  },
  {
    id: "resource-b",
    slug: "b",
    title: "资源 B：内部风险报告",
    summary: "仅向显式授权账号开放的内部风险评估。",
    content:
      "Gatehouse 资源 B 包含审核失败模式、授权风险和内部处置建议。普通登录用户默认无权访问。",
    access_mode: "explicit",
    version: "v1.0",
    document_size: "842 KB",
    updated_at: "2026-08-16T10:30:00Z",
  },
];
