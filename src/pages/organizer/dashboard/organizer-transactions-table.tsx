import { useMemo, useState } from "react";
import {
  ChevronDownIcon,
  ExternalLinkIcon,
  ImageIcon,
  Loader2Icon,
  RefreshCcwIcon,
} from "lucide-react";
import { toast } from "sonner";
import { updateTransactionStatus } from "@/api/transaction/transaction.api";
import type {
  IOrganizerTransaction,
  TransactionStatus,
  ITransactionStatusUpdateParams,
} from "@/api/transaction/transaction.interface";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Spinner } from "@/components/ui/spinner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useTransactionCountdown } from "@/pages/transaction/hooks/use-transaction-countdown";
import {
  formatRupiah,
  formatTransactionDateTime,
  getTransactionErrorMessage,
  getTransactionStatusMeta,
} from "@/pages/transaction/transaction.utils";

interface OrganizerTransactionsTableProps {
  transactions: IOrganizerTransaction[];
  isLoading: boolean;
  errorMessage: string | null;
  onRetry: () => Promise<void> | void;
}

const reviewActions: Array<{
  label: string;
  value: ITransactionStatusUpdateParams["status"];
}> = [
  { label: "Approve as done", value: "DONE" },
  { label: "Reject transaction", value: "REJECTED" },
];

function getStatusLabel(status: TransactionStatus) {
  return getTransactionStatusMeta(status).label;
}

function getStatusChipClassName(status: TransactionStatus) {
  return `inline-flex max-w-full items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${getTransactionStatusMeta(status).toneClassName}`;
}

export function OrganizerTransactionsTable({
  transactions,
  isLoading,
  errorMessage,
  onRetry,
}: OrganizerTransactionsTableProps) {
  if (isLoading) {
    return (
      <div className="flex items-center gap-3 py-8 text-sm text-muted-foreground">
        <Spinner className="h-4 w-4" />
        Loading organizer transactions...
      </div>
    );
  }

  if (errorMessage) {
    return (
      <Card className="border-destructive/20 bg-destructive/5 shadow-none">
        <CardHeader>
          <CardTitle className="text-destructive">
            We couldn't load organizer transactions
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">{errorMessage}</p>
          <Button
            type="button"
            variant="outline"
            onClick={() => void onRetry()}
          >
            <RefreshCcwIcon className="mr-2 h-4 w-4" />
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (transactions.length === 0) {
    return (
      <div className="flex flex-col gap-3 py-6">
        <h3 className="text-lg font-semibold text-foreground">
          No transactions found
        </h3>
        <p className="text-sm text-muted-foreground">
          Try a different status or search term to see more review items.
        </p>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="px-6 py-4">Event</TableHead>
          <TableHead className="py-4">Transaction status</TableHead>
          <TableHead className="py-4">Price</TableHead>
          <TableHead className="py-4">Payment proof</TableHead>
          <TableHead className="px-6 py-4">Expired timer</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {transactions.map((transaction) => (
          <OrganizerTransactionRow
            key={transaction.id}
            transaction={transaction}
            onStatusUpdated={onRetry}
          />
        ))}
      </TableBody>
    </Table>
  );
}

function OrganizerTransactionRow({
  transaction,
  onStatusUpdated,
}: {
  transaction: IOrganizerTransaction;
  onStatusUpdated: () => Promise<void> | void;
}) {
  const hasActiveCountdown =
    transaction.status === "WAITING_FOR_PAYMENT" ||
    transaction.status === "WAITING_FOR_ADMIN_CONFIRMATION";
  const countdown = useTransactionCountdown(
    transaction.expiredAt,
    hasActiveCountdown,
  );
  const [selectResetKey, setSelectResetKey] = useState(0);
  const [pendingStatus, setPendingStatus] = useState<
    ITransactionStatusUpdateParams["status"] | null
  >(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isProofOpen, setIsProofOpen] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const isReviewable = transaction.status === "WAITING_FOR_ADMIN_CONFIRMATION";

  const buyerName = useMemo(() => {
    const fullName =
      `${transaction.user?.firstName ?? ""} ${transaction.user?.lastName ?? ""}`.trim();
    return fullName || transaction.user?.email || "Buyer unavailable";
  }, [
    transaction.user?.email,
    transaction.user?.firstName,
    transaction.user?.lastName,
  ]);

  const deadlineCaption =
    transaction.status === "WAITING_FOR_PAYMENT"
      ? "Waiting for customer payment"
      : transaction.status === "WAITING_FOR_ADMIN_CONFIRMATION"
        ? "Organizer review window"
        : "Final transaction state";
  const selectedItem = transaction.transactionItems[0];
  const ticketTypeLabel =
    selectedItem?.ticketType?.name ??
    (selectedItem?.quantity
      ? `${selectedItem.quantity} ticket checkout`
      : "Ticket type unavailable");

  async function handleConfirmStatusUpdate() {
    if (!pendingStatus) {
      return;
    }

    try {
      setIsUpdatingStatus(true);
      const response = await updateTransactionStatus(transaction.id, {
        status: pendingStatus,
      });
      toast.success(
        response.message ||
          `Transaction marked as ${pendingStatus.toLowerCase()}.`,
      );
      setIsConfirmOpen(false);
      setPendingStatus(null);
      await onStatusUpdated();
    } catch (error) {
      toast.error(getTransactionErrorMessage(error));
    } finally {
      setIsUpdatingStatus(false);
    }
  }

  return (
    <>
      <TableRow>
        <TableCell className="px-6 py-4">
          <div className="flex max-w-52 flex-col gap-1">
            <p
              title={transaction.event?.name ?? transaction.eventId}
              className="line-clamp-2 break-words font-medium text-foreground"
            >
              {transaction.event?.name ?? "Event unavailable"}
            </p>
            <p
              title={buyerName}
              className="truncate text-xs text-muted-foreground"
            >
              {buyerName}
            </p>
          </div>
        </TableCell>

        <TableCell className="py-4">
          <div className="flex max-w-56 flex-col gap-2">
            <DropdownMenu key={selectResetKey}>
              <DropdownMenuTrigger asChild disabled={isUpdatingStatus}>
                <button
                  type="button"
                  className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 text-left text-sm transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <div className="flex min-w-0 items-center gap-2">
                    <span
                      className={getStatusChipClassName(transaction.status)}
                      title={getStatusLabel(transaction.status)}
                    >
                      <span className="truncate">
                        {getStatusLabel(transaction.status)}
                      </span>
                    </span>
                  </div>
                  <ChevronDownIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
                </button>
              </DropdownMenuTrigger>

              <DropdownMenuContent align="start" className="w-72">
                <DropdownMenuLabel>Current status</DropdownMenuLabel>
                <div className="px-2 py-1">
                  <span className={getStatusChipClassName(transaction.status)}>
                    <span className="truncate">
                      {getStatusLabel(transaction.status)}
                    </span>
                  </span>
                </div>

                <DropdownMenuSeparator />

                {isReviewable ? (
                  <>
                    <DropdownMenuLabel>Set status to</DropdownMenuLabel>
                    {reviewActions.map((action) => (
                      <DropdownMenuItem
                        key={action.value}
                        onClick={() => {
                          setPendingStatus(action.value);
                          setIsConfirmOpen(true);
                          setSelectResetKey((currentValue) => currentValue + 1);
                        }}
                        variant={
                          action.value === "REJECTED"
                            ? "destructive"
                            : "default"
                        }
                      >
                        <span className={getStatusChipClassName(action.value)}>
                          <span className="truncate">{action.label}</span>
                        </span>
                      </DropdownMenuItem>
                    ))}
                  </>
                ) : (
                  <DropdownMenuItem disabled>
                    Status locked after this transaction stage
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </TableCell>

        <TableCell className="py-4">
          <div className="flex max-w-40 flex-col gap-1 text-sm">
            <span
              className="truncate font-semibold text-foreground"
              title={formatRupiah(transaction.finalAmount)}
            >
              {formatRupiah(transaction.finalAmount)}
            </span>
            {transaction.finalAmount !== transaction.totalAmount ? (
              <span
                className="truncate text-muted-foreground"
                title={`From ${formatRupiah(transaction.totalAmount)}`}
              >
                From {formatRupiah(transaction.totalAmount)}
              </span>
            ) : (
              <span className="truncate text-muted-foreground">
                1 ticket checkout
              </span>
            )}
          </div>
        </TableCell>

        <TableCell className="py-4">
          {transaction.paymentProofUrl ? (
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => setIsProofOpen(true)}
            >
              <ImageIcon className="mr-2 h-4 w-4" />
              View proof
            </Button>
          ) : (
            <span className="text-sm text-muted-foreground">No proof yet</span>
          )}
        </TableCell>

        <TableCell className="px-6 py-4">
          <div className="flex max-w-44 flex-col gap-1 text-sm">
            <span
              className="truncate font-semibold text-foreground"
              title={countdown.label}
            >
              {countdown.label}
            </span>
            <span
              className="line-clamp-2 break-words text-muted-foreground"
              title={deadlineCaption}
            >
              {deadlineCaption}
            </span>
            <span
              className="truncate text-xs text-muted-foreground"
              title={formatTransactionDateTime(transaction.expiredAt)}
            >
              {formatTransactionDateTime(transaction.expiredAt)}
            </span>
          </div>
        </TableCell>
      </TableRow>

      <Dialog
        open={isProofOpen}
        onOpenChange={(nextOpen) => {
          setIsProofOpen(nextOpen);
        }}
      >
        <DialogContent className="max-h-[calc(100vh-1rem)] gap-0 overflow-hidden p-0 sm:max-w-2xl">
          <div className="max-h-[calc(100vh-1rem)] overflow-y-auto p-4 sm:p-6">
            <DialogHeader>
              <DialogTitle>Payment proof</DialogTitle>
              <DialogDescription className="leading-6">
                Review the uploaded transfer receipt before accepting or
                rejecting this transaction.
              </DialogDescription>
            </DialogHeader>

            <div className="mt-4 space-y-4">
              <div className="grid gap-3 rounded-2xl border border-border/70 bg-muted/20 p-4 sm:grid-cols-2 lg:grid-cols-3">
                <MetaBlock
                  label="Event"
                  value={transaction.event?.name ?? "Event unavailable"}
                />
                <MetaBlock label="Buyer" value={buyerName} />
                <MetaBlock
                  label="Total transaction"
                  value={formatRupiah(transaction.finalAmount)}
                />
                <MetaBlock label="Ticket type" value={ticketTypeLabel} />
                <MetaBlock
                  label="Uploaded at"
                  value={formatTransactionDateTime(
                    transaction.paymentProofUploadedAt,
                  )}
                />
                <MetaBlock
                  label="Review deadline"
                  value={formatTransactionDateTime(transaction.expiredAt)}
                />
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-muted-foreground">
                  The image stays fully visible in a scrollable area so receipt
                  details do not get cropped on odd ratios.
                </p>
                <Button asChild type="button" size="sm" variant="outline">
                  <a
                    href={transaction.paymentProofUrl ?? "#"}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <ExternalLinkIcon className="mr-2 h-4 w-4" />
                    Open full image
                  </a>
                </Button>
              </div>

              <div className="overflow-hidden rounded-3xl border border-border/80 bg-muted/20">
                <div className="max-h-[min(52vh,28rem)] overflow-auto p-3 sm:max-h-[min(58vh,34rem)] sm:p-4">
                  <div className="flex min-h-[14rem] min-w-full items-start justify-center sm:min-h-[18rem]">
                    <img
                      src={transaction.paymentProofUrl ?? undefined}
                      alt={`${transaction.event?.name ?? "Transaction"} payment proof`}
                      className="h-auto w-full rounded-2xl object-contain shadow-sm"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={isConfirmOpen}
        onOpenChange={(nextOpen) => {
          setIsConfirmOpen(nextOpen);
          if (!nextOpen && !isUpdatingStatus) {
            setPendingStatus(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm transaction status change</DialogTitle>
            <DialogDescription className="leading-6">
              This transaction will be marked as{" "}
              <span className="font-semibold text-foreground">
                {pendingStatus === "DONE"
                  ? "DONE"
                  : pendingStatus === "REJECTED"
                    ? "REJECTED"
                    : "selected"}
              </span>
              . After this is submitted, the status can no longer be changed and
              backend follow-up processes will start immediately.
            </DialogDescription>
          </DialogHeader>

          <div className="rounded-2xl border border-border/70 bg-muted/20 p-4 text-sm">
            <p className="font-medium text-foreground">
              Are you sure with your choice?
            </p>
            <p className="mt-2 leading-6 text-muted-foreground">
              Double-check the payment proof and transaction details before
              continuing.
            </p>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={isUpdatingStatus}
              onClick={() => {
                setIsConfirmOpen(false);
                setPendingStatus(null);
                setSelectResetKey((currentValue) => currentValue + 1);
              }}
            >
              Cancel
            </Button>
            <Button
              type="button"
              disabled={!pendingStatus || isUpdatingStatus}
              onClick={() => void handleConfirmStatusUpdate()}
              className={
                pendingStatus === "REJECTED"
                  ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  : ""
              }
            >
              {isUpdatingStatus ? (
                <>
                  <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                `Confirm ${pendingStatus === "DONE" ? "done" : "rejected"}`
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function MetaBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
        {label}
      </p>
      <p className="break-words text-sm font-medium leading-6 text-foreground">
        {value}
      </p>
    </div>
  );
}
