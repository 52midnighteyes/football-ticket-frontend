import { ArrowRightIcon, RefreshCcwIcon } from "lucide-react";
import type { IEnrichedTransaction } from "@/api/transaction/transaction.interface";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TransactionRecordCard } from "@/pages/transaction/components/transaction-record-card";

interface OngoingTransactionsProps {
  transactions: IEnrichedTransaction[];
  isLoading: boolean;
  errorMessage: string | null;
  highlightedTransactionId?: string | null;
  onRetry: () => void;
}

export function OngoingTransactions({
  transactions,
  isLoading,
  errorMessage,
  highlightedTransactionId = null,
  onRetry,
}: OngoingTransactionsProps) {
  if (isLoading) {
    return (
      <div className="grid gap-4">
        {Array.from({ length: 2 }).map((_, index) => (
          <div
            key={`ongoing-loading-${index}`}
            className="h-72 animate-pulse rounded-3xl border border-border bg-muted/30"
          />
        ))}
      </div>
    );
  }

  if (errorMessage) {
    return (
      <Card className="border-destructive/20 bg-destructive/5 shadow-none">
        <CardHeader>
          <CardTitle className="text-destructive">
            We couldn't load your ongoing transactions
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
    );
  }

  if (transactions.length === 0) {
    return (
        <Card className="border-dashed border-border/80 bg-card shadow-none">
        <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
          <div className="rounded-full bg-accent/10 p-3 text-accent">
            <ArrowRightIcon className="h-5 w-5" />
          </div>
          <div className="space-y-1">
            <p className="text-lg font-semibold">No active transaction right now</p>
            <p className="text-sm text-muted-foreground">
              Waiting payment and waiting confirmation orders will appear here
              automatically.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-5">
      {transactions.map((transaction) => (
        <TransactionRecordCard
          key={transaction.id}
          transaction={transaction}
          highlighted={transaction.id === highlightedTransactionId}
          onTransactionUpdated={onRetry}
        />
      ))}
    </div>
  );
}
