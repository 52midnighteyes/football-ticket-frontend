import { RefreshCcwIcon } from "lucide-react";
import type {
  IEnrichedTransaction,
  TransactionStatus,
} from "@/api/transaction/transaction.interface";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TransactionRecordCard } from "@/pages/transaction/components/transaction-record-card";

const historyStatuses: Array<{
  label: string;
  value?: TransactionStatus;
}> = [
  { label: "All" },
  { label: "Waiting for payment", value: "WAITING_FOR_PAYMENT" },
  {
    label: "Waiting for confirmation",
    value: "WAITING_FOR_ADMIN_CONFIRMATION",
  },
  { label: "Done", value: "DONE" },
  { label: "Rejected", value: "REJECTED" },
  { label: "Expired", value: "EXPIRED" },
  { label: "Canceled", value: "CANCELED" },
];

interface TransactionHistoryProps {
  transactions: IEnrichedTransaction[];
  status?: TransactionStatus;
  isLoading: boolean;
  errorMessage: string | null;
  highlightedTransactionId?: string | null;
  onRetry: () => void;
  onStatusChange: (status?: TransactionStatus) => void;
}

export function TransactionHistory({
  transactions,
  status,
  isLoading,
  errorMessage,
  highlightedTransactionId = null,
  onRetry,
  onStatusChange,
}: TransactionHistoryProps) {
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-2">
        {historyStatuses.map((item) => {
          const isActive = item.value === status || (!item.value && !status);

          return (
            <button
              key={item.label}
              type="button"
              onClick={() => onStatusChange(item.value)}
              className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                isActive
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card hover:border-primary/35"
              }`}
            >
              {item.label}
            </button>
          );
        })}
      </div>

      {isLoading ? (
        <div className="grid gap-4">
          {Array.from({ length: 3 }).map((_, index) => (
            <div
              key={`history-loading-${index}`}
              className="h-72 animate-pulse rounded-3xl border border-border bg-muted/30"
            />
          ))}
        </div>
      ) : null}

      {!isLoading && errorMessage ? (
        <Card className="border-destructive/20 bg-destructive/5 shadow-none">
          <CardHeader>
            <CardTitle className="text-destructive">
              We couldn't load your transaction history
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">{errorMessage}</p>
            <Button type="button" variant="outline" onClick={onRetry}>
              <RefreshCcwIcon className="mr-2 h-4 w-4" />
              Retry
            </Button>
          </CardContent>
        </Card>
      ) : null}

      {!isLoading && !errorMessage && transactions.length === 0 ? (
        <Card className="border-dashed border-border/80 bg-card shadow-none">
          <CardContent className="py-10 text-center">
            <p className="text-lg font-semibold">No transactions found</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Try a different status filter or create a new purchase from the
              home page.
            </p>
          </CardContent>
        </Card>
      ) : null}

      {!isLoading && !errorMessage && transactions.length > 0 ? (
        <div className="grid gap-5">
          {transactions.map((transaction) => (
            <TransactionRecordCard
              key={transaction.id}
              transaction={transaction}
              highlighted={transaction.id === highlightedTransactionId}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
