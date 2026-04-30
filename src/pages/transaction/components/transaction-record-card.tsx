import {
  CalendarDaysIcon,
  Clock3Icon,
  MapPinIcon,
  ReceiptTextIcon,
  TicketIcon,
} from "lucide-react";
import type { ReactNode } from "react";
import type { IEnrichedTransaction } from "@/api/transaction/transaction.interface";
import EventBanner from "@/components/event-banner";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTransactionCountdown } from "@/pages/transaction/hooks/use-transaction-countdown";
import { UploadPaymentProofDialog } from "@/pages/transaction/components/upload-payment-proof-dialog";
import {
  formatRupiah,
  formatTransactionDateTime,
  getTransactionStatusMeta,
} from "@/pages/transaction/transaction.utils";

interface TransactionRecordCardProps {
  transaction: IEnrichedTransaction;
  highlighted?: boolean;
  onTransactionUpdated?: () => Promise<void> | void;
}

export function TransactionRecordCard({
  transaction,
  highlighted = false,
  onTransactionUpdated,
}: TransactionRecordCardProps) {
  const statusMeta = getTransactionStatusMeta(transaction.status);
  const hasActiveCountdown =
    transaction.status === "WAITING_FOR_PAYMENT" ||
    transaction.status === "WAITING_FOR_ADMIN_CONFIRMATION";
  const countdown = useTransactionCountdown(
    transaction.expiredAt,
    hasActiveCountdown,
  );
  const canUploadPaymentProof =
    Boolean(onTransactionUpdated) && transaction.status === "WAITING_FOR_PAYMENT";
  const showsCountdownDeadline = hasActiveCountdown;
  const deadlineTitle =
    transaction.status === "WAITING_FOR_PAYMENT"
      ? "Pay before"
      : "Review window";
  const deadlineCaption =
    transaction.status === "WAITING_FOR_PAYMENT"
      ? "Initial 2-hour payment deadline"
      : "Organizer follow-up within 3 hours after proof upload";

  return (
    <Card
      className={`gap-0 overflow-hidden border-border/80 bg-card py-0 shadow-sm transition ${
        highlighted ? "ring-2 ring-primary/40" : ""
      }`}
    >
      <div className="grid gap-0 lg:grid-cols-[220px_1fr]">
        <EventBanner
          src={transaction.eventSummary.bannerUrl}
          alt={transaction.eventSummary.name}
          placeholder="Match banner unavailable"
          className="min-h-48 lg:min-h-full lg:aspect-auto"
        />

        <div className="flex flex-col">
          <CardHeader className="gap-4 border-b border-border/70 px-5 py-5">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
              <div className="min-w-0 space-y-3">
                <Badge variant={statusMeta.badgeVariant} className="w-fit">
                  {statusMeta.label}
                </Badge>
                <CardTitle className="line-clamp-2 break-words text-xl font-semibold leading-tight sm:text-2xl">
                  {transaction.eventSummary.name}
                </CardTitle>
                <div className="flex flex-col gap-2 text-sm text-muted-foreground sm:flex-row sm:flex-wrap sm:items-start sm:gap-4">
                  <span className="flex min-w-0 items-start gap-1.5">
                    <MapPinIcon className="h-4 w-4" />
                    <span className="line-clamp-2 break-words">
                      {transaction.eventSummary.venue}
                    </span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <CalendarDaysIcon className="h-4 w-4" />
                    {formatTransactionDateTime(transaction.eventSummary.startAt)}
                  </span>
                </div>
              </div>

              {showsCountdownDeadline ? (
                <div
                  className={`w-full rounded-2xl border px-4 py-3 text-left xl:w-auto xl:min-w-56 xl:text-right ${statusMeta.toneClassName}`}
                >
                  <p className="text-xs font-semibold uppercase tracking-[0.18em]">
                    {deadlineTitle}
                  </p>
                  <p className="mt-2 text-xl font-semibold">
                    {countdown.label}
                  </p>
                  <p className="mt-1 text-xs text-current/80">{deadlineCaption}</p>
                  <p className="mt-2 text-xs text-current/80">
                    Expires {formatTransactionDateTime(transaction.expiredAt)}
                  </p>
                </div>
              ) : null}
            </div>
          </CardHeader>

          <CardContent className="grid gap-5 px-5 py-5 lg:grid-cols-[minmax(0,1fr)_260px]">
            <div className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                <InfoPill
                  icon={<TicketIcon className="h-4 w-4" />}
                  label="Ticket type"
                  value={transaction.ticketTypeName}
                />
                <InfoPill
                  icon={<ReceiptTextIcon className="h-4 w-4" />}
                  label="Created at"
                  value={formatTransactionDateTime(transaction.createdAt)}
                />
                <InfoPill
                  icon={<TicketIcon className="h-4 w-4" />}
                  label="Quantity"
                  value={String(transaction.selectedItem?.quantity ?? 1)}
                />
                {transaction.status === "WAITING_FOR_ADMIN_CONFIRMATION" &&
                transaction.paymentProofUploadedAt ? (
                  <InfoPill
                    icon={<ReceiptTextIcon className="h-4 w-4" />}
                    label="Proof uploaded"
                    value={formatTransactionDateTime(
                      transaction.paymentProofUploadedAt,
                    )}
                  />
                ) : null}
                {transaction.status !== "WAITING_FOR_PAYMENT" ? (
                  <InfoPill
                    icon={<Clock3Icon className="h-4 w-4" />}
                    label="Status note"
                    value={statusMeta.description}
                  />
                ) : null}
              </div>
            </div>

            <div className="space-y-4">
              <div className="rounded-2xl border border-primary/12 bg-linear-to-br from-primary/5 via-card to-accent/8 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  Breakdown
                </p>
                <div className="mt-4 space-y-3 text-sm">
                  <BreakdownRow label="Total amount" value={transaction.totalAmount} />
                  <BreakdownRow
                    label="Voucher discount"
                    value={transaction.voucherAmount}
                    negative
                  />
                  <BreakdownRow
                    label="Coupon discount"
                    value={transaction.couponAmount}
                    negative
                  />
                  <BreakdownRow
                    label="Points discount"
                    value={transaction.pointsAmount}
                    negative
                  />
                  <div className="border-t border-border/80 pt-3">
                    <BreakdownRow
                      label="Final amount"
                      value={transaction.finalAmount}
                      emphasized
                    />
                  </div>
                </div>
              </div>

              {canUploadPaymentProof ? (
                <div className="rounded-2xl border border-border/80 bg-card p-4 shadow-sm">
                  <p className="text-sm font-semibold text-foreground">
                    Send your transfer proof
                  </p>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    Upload your bank transfer receipt before the initial payment deadline
                    ends. After the upload succeeds, this order moves to admin
                    confirmation and the proof can no longer be re-uploaded.
                  </p>
                  <div className="mt-4">
                    <UploadPaymentProofDialog
                      transaction={transaction}
                      onUploaded={onTransactionUpdated!}
                    />
                  </div>
                </div>
              ) : null}

              {transaction.status === "WAITING_FOR_ADMIN_CONFIRMATION" ? (
                <div className="rounded-2xl border border-primary/15 bg-primary/6 p-4 shadow-sm">
                  <p className="text-sm font-semibold text-primary">
                    Payment proof submitted
                  </p>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    This transfer proof is already locked for admin review. Re-upload is
                    disabled in this status, and the latest `expiredAt` above is the new
                    organizer follow-up deadline.
                  </p>
                </div>
              ) : null}
            </div>
          </CardContent>
        </div>
      </div>
    </Card>
  );
}

function InfoPill({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-border/80 bg-muted/20 px-4 py-3">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
        {icon}
        {label}
      </div>
      <p className="mt-2 line-clamp-3 break-words text-sm font-semibold leading-6 text-foreground">
        {value}
      </p>
    </div>
  );
}

function BreakdownRow({
  label,
  value,
  negative = false,
  emphasized = false,
}: {
  label: string;
  value: number;
  negative?: boolean;
  emphasized?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <span
        className={`min-w-0 break-words ${emphasized ? "font-semibold" : "text-muted-foreground"}`}
      >
        {label}
      </span>
      <span
        className={`shrink-0 text-right ${emphasized ? "text-lg font-semibold text-primary" : "font-semibold"}`}
      >
        {negative ? "-" : ""}
        {formatRupiah(value)}
      </span>
    </div>
  );
}
