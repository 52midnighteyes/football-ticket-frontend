import type { ReactNode } from "react";

interface InfoRowProps {
  label: string;
  value: ReactNode;
  className?: string;
}

export default function InfoRow({ label, value, className }: InfoRowProps) {
  return (
    <div
      className={`rounded-xl border border-border bg-muted/30 px-4 py-3 ${className ?? ""}`}
    >
      <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 break-words text-sm font-semibold leading-6 text-foreground">
        {value}
      </p>
    </div>
  );
}
