import type { ReactNode } from "react";

interface InfoRowProps {
  label: string;
  value: ReactNode;
  className?: string;
}

export default function InfoRow({ label, value, className }: InfoRowProps) {
  return (
    <div
      className={`rounded-2xl border border-border/70 bg-background/80 px-4 py-4 shadow-sm ${className ?? ""}`}
    >
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
        {label}
      </p>
      <div className="mt-2 break-words text-sm font-semibold leading-6 text-foreground">
        {value}
      </div>
    </div>
  );
}
