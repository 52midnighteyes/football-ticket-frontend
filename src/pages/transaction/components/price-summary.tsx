import { ShieldCheckIcon } from "lucide-react";
import type { ITicketType } from "@/api/event/event.interface";
import type { ITransactionCheckoutEstimate } from "@/api/transaction/transaction.interface";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatRupiah } from "@/pages/transaction/transaction.utils";

interface PriceSummaryProps {
  estimate: ITransactionCheckoutEstimate;
  selectedTicketType: ITicketType | null;
  useAllPoints: boolean;
}

export function PriceSummary({
  estimate,
  selectedTicketType,
  useAllPoints,
}: PriceSummaryProps) {
  return (
    <Card className="border-border/80 bg-card shadow-lg shadow-primary/5">
      <CardHeader className="gap-2">
        <CardTitle className="text-xl">Price summary</CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="rounded-2xl border border-primary/12 bg-linear-to-br from-primary/5 via-card to-accent/8 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Selected ticket
          </p>
          <p className="mt-2 line-clamp-2 break-words text-base font-semibold leading-6">
            {selectedTicketType?.name ?? "Choose a ticket type"}
          </p>
          <p className="text-sm text-muted-foreground">Quantity fixed at 1</p>
        </div>

        <div className="space-y-3 text-sm">
          <SummaryRow label="Base price" value={estimate.basePrice} />
          <SummaryRow
            label="Voucher discount"
            value={estimate.voucherDiscount}
            negative
          />
          <SummaryRow
            label="Coupon discount"
            value={estimate.couponDiscount}
            negative
          />
          <SummaryRow
            label="Points discount"
            value={estimate.pointsDiscount}
            negative
            muted={!useAllPoints}
          />
        </div>

        <div className="rounded-2xl bg-linear-to-r from-primary to-accent px-4 py-4 text-primary-foreground">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary-foreground/80">
            Final amount
          </p>
          <p className="mt-2 text-3xl font-semibold">
            {formatRupiah(estimate.finalAmount)}
          </p>
        </div>

        <div className="flex items-start gap-3 rounded-2xl border border-accent/20 bg-accent/8 px-4 py-3 text-sm text-accent">
          <ShieldCheckIcon className="mt-0.5 h-4 w-4 shrink-0" />
          <p className="leading-6">
            Voucher, coupon, and points can stack. If the final amount becomes
            zero, the backend may complete the transaction instantly.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

function SummaryRow({
  label,
  value,
  negative = false,
  muted = false,
}: {
  label: string;
  value: number;
  negative?: boolean;
  muted?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className={muted ? "text-muted-foreground" : "text-foreground"}>
        {label}
      </span>
      <span className="font-semibold">
        {negative ? "-" : ""}
        {formatRupiah(value)}
      </span>
    </div>
  );
}
