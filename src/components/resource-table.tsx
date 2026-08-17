import {
  FileText,
  LockKeyhole,
  MoveRight,
  UnlockKeyhole,
} from "lucide-react";
import Link from "next/link";

import type { ResourceDocument } from "@/lib/app-types";

export function ResourceTable({
  resources,
  grantedSlugs,
}: {
  resources: ResourceDocument[];
  grantedSlugs: Set<string>;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[680px] border-collapse text-left">
        <caption className="sr-only">资源访问状态</caption>
        <thead>
          <tr className="border-b border-[#dce1df] text-xs uppercase text-[#626a67]">
            <th className="px-3 py-3 font-semibold" scope="col">
              资源
            </th>
            <th className="px-3 py-3 font-semibold" scope="col">
              版本
            </th>
            <th className="px-3 py-3 font-semibold" scope="col">
              访问状态
            </th>
            <th className="px-3 py-3 text-right font-semibold" scope="col">
              打开
            </th>
          </tr>
        </thead>
        <tbody>
          {resources.map((resource) => {
            const granted = grantedSlugs.has(resource.slug);
            return (
              <tr key={resource.id} className="border-b border-[#eef1f0]">
                <td className="px-3 py-4">
                  <div className="flex items-start gap-3">
                    <span className="grid size-10 shrink-0 place-items-center rounded-[5px] border border-[#dce1df] bg-[#f7f8f8]">
                      <FileText
                        aria-hidden="true"
                        className={`size-5 ${
                          resource.slug === "a"
                            ? "text-[#087f68]"
                            : "text-[#dc3f4c]"
                        }`}
                      />
                    </span>
                    <span>
                      <span className="block font-semibold">{resource.title}</span>
                      <span className="mt-1 block text-sm text-[#626a67]">
                        {resource.summary}
                      </span>
                    </span>
                  </div>
                </td>
                <td className="px-3 py-4 text-sm text-[#626a67]">
                  {resource.version}
                  <span className="ml-2">{resource.document_size}</span>
                </td>
                <td className="px-3 py-4">
                  <span
                    className={`inline-flex items-center gap-2 text-sm font-semibold ${
                      granted ? "text-[#087f68]" : "text-[#dc3f4c]"
                    }`}
                  >
                    {granted ? (
                      <UnlockKeyhole aria-hidden="true" className="size-4" />
                    ) : (
                      <LockKeyhole aria-hidden="true" className="size-4" />
                    )}
                    {granted ? "可访问" : "默认禁止"}
                  </span>
                </td>
                <td className="px-3 py-4 text-right">
                  <Link
                    href={`/resources/${resource.slug}`}
                    className="inline-flex min-h-10 items-center gap-2 rounded-[5px] px-3 text-sm font-semibold text-[#087f68] hover:bg-[#e7f5f0]"
                  >
                    查看
                    <MoveRight aria-hidden="true" className="size-4" />
                  </Link>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
