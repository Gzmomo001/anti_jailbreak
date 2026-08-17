import { ShieldCheck } from "lucide-react";

export function BrandMark({ compact = false }: { compact?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2 font-bold text-[#151817]">
      <span className="grid size-8 place-items-center rounded-[6px] bg-[#e7f5f0] text-[#087f68]">
        <ShieldCheck aria-hidden="true" className="size-5" strokeWidth={2.2} />
      </span>
      {compact ? null : <span className="text-lg">Gatehouse</span>}
    </span>
  );
}
