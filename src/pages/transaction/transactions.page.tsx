import { useEffect, type ReactNode } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import { ArrowRightIcon, Clock3Icon, HistoryIcon } from "lucide-react";
import type { TransactionStatus } from "@/api/transaction/transaction.interface";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuthStore } from "@/store/auth.store";
import { OngoingTransactions } from "@/pages/transaction/components/ongoing-transactions";
import { TransactionHistory } from "@/pages/transaction/components/transaction-history";
import { useTransactions } from "@/pages/transaction/hooks/use-transactions";

const ongoingStatuses = new Set<TransactionStatus>([
  "WAITING_FOR_PAYMENT",
  "WAITING_FOR_ADMIN_CONFIRMATION",
]);

const historyOnlyStatuses = new Set<TransactionStatus>([
  "DONE",
  "REJECTED",
  "EXPIRED",
  "CANCELED",
]);

const allowedStatuses = new Set<TransactionStatus>([
  "WAITING_FOR_PAYMENT",
  "WAITING_FOR_ADMIN_CONFIRMATION",
  "DONE",
  "REJECTED",
  "EXPIRED",
  "CANCELED",
]);

export default function TransactionsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const isHydrated = useAuthStore((state) => state.isHydrated);
  const currentTab = searchParams.get("tab") === "history" ? "history" : "ongoing";
  const rawStatus = searchParams.get("status");
  const highlightedTransactionId = searchParams.get("highlight");
  const historyStatus =
    rawStatus && allowedStatuses.has(rawStatus as TransactionStatus)
      ? (rawStatus as TransactionStatus)
      : undefined;

  const ongoingTransactionsState = useTransactions(undefined, currentTab === "ongoing");
  const historyAllTransactionsState = useTransactions(
    undefined,
    currentTab === "history" && !historyStatus,
  );
  const historyFilteredTransactionsState = useTransactions(
    historyStatus,
    currentTab === "history" && Boolean(historyStatus),
  );

  const ongoingTransactions = ongoingTransactionsState.transactions.filter(
    (transaction) => ongoingStatuses.has(transaction.status),
  );

  const historyTransactions = historyStatus
    ? historyFilteredTransactionsState.transactions
    : historyAllTransactionsState.transactions.filter((transaction) =>
        historyOnlyStatuses.has(transaction.status),
      );

  const historyIsLoading = historyStatus
    ? historyFilteredTransactionsState.isLoading
    : historyAllTransactionsState.isLoading;

  const historyErrorMessage = historyStatus
    ? historyFilteredTransactionsState.errorMessage
    : historyAllTransactionsState.errorMessage;

  const reloadHistoryTransactions = historyStatus
    ? historyFilteredTransactionsState.reload
    : historyAllTransactionsState.reload;

  useEffect(() => {
    if (isHydrated && !user) {
      navigate("/login", { replace: true });
    }
  }, [isHydrated, navigate, user]);

  if (!isHydrated) {
    return (
      <PageShell>
        <Card className="mx-auto max-w-2xl border-border bg-card shadow-sm">
          <CardContent className="py-8 text-sm text-muted-foreground">
            Loading your transaction space...
          </CardContent>
        </Card>
      </PageShell>
    );
  }

  if (!user) {
    return null;
  }

  if (user.role !== "CUSTOMER") {
    return (
      <PageShell>
        <Card className="mx-auto max-w-2xl border-border bg-card shadow-lg">
          <CardContent className="space-y-4 py-8">
            <div className="space-y-2">
              <h2 className="text-2xl font-semibold">Customer purchases only</h2>
              <p className="text-sm text-muted-foreground">
                This section is currently focused on customer transaction flows.
              </p>
            </div>
            <Button asChild>
              <Link to="/">Back to home</Link>
            </Button>
          </CardContent>
        </Card>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <div className="mx-auto w-full max-w-7xl space-y-8">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-end">
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">
              Transactions
            </p>
            <h2 className="text-4xl font-semibold tracking-tight">
              Stay on top of every matchday purchase
            </h2>
            <p className="max-w-3xl text-sm text-muted-foreground">
              Track payments in progress, watch expiry countdowns, and revisit
              every finished order from one focused place.
            </p>
          </div>

          <Card className="border-border/80 bg-card shadow-lg shadow-primary/5">
            <CardContent className="flex items-center justify-between gap-4 py-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  Quick action
                </p>
                <p className="mt-2 text-lg font-semibold">Need another ticket?</p>
                <p className="text-sm text-muted-foreground">
                  Browse published matches and start a fresh checkout.
                </p>
              </div>
              <Button asChild>
                <Link to="/">
                  Browse events
                  <ArrowRightIcon className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-wrap gap-2">
          <TabButton
            icon={<Clock3Icon className="h-4 w-4" />}
            label="Ongoing"
            active={currentTab === "ongoing"}
            onClick={() => setTransactionTab("ongoing", setSearchParams)}
          />
          <TabButton
            icon={<HistoryIcon className="h-4 w-4" />}
            label="History"
            active={currentTab === "history"}
            onClick={() => setTransactionTab("history", setSearchParams)}
          />
        </div>

        {currentTab === "ongoing" ? (
          <OngoingTransactions
            transactions={ongoingTransactions}
            isLoading={ongoingTransactionsState.isLoading}
            errorMessage={ongoingTransactionsState.errorMessage}
            highlightedTransactionId={highlightedTransactionId}
            onRetry={() => void ongoingTransactionsState.reload()}
          />
        ) : (
          <TransactionHistory
            transactions={historyTransactions}
            status={historyStatus}
            isLoading={historyIsLoading}
            errorMessage={historyErrorMessage}
            highlightedTransactionId={highlightedTransactionId}
            onRetry={() => void reloadHistoryTransactions()}
            onStatusChange={(status) =>
              setHistoryStatus(status, setSearchParams, highlightedTransactionId)
            }
          />
        )}
      </div>
    </PageShell>
  );
}

function PageShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(34,94,52,0.12),_transparent_38%),linear-gradient(180deg,_rgba(245,247,244,1)_0%,_rgba(236,241,236,1)_100%)] px-6 pt-28 pb-12 lg:px-16">
      {children}
    </div>
  );
}

function TabButton({
  icon,
  label,
  active,
  onClick,
}: {
  icon: ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition ${
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-card hover:border-primary/35"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

function setTransactionTab(
  tab: "ongoing" | "history",
  setSearchParams: ReturnType<typeof useSearchParams>[1],
) {
  const nextParams = new URLSearchParams();
  nextParams.set("tab", tab);
  setSearchParams(nextParams);
}

function setHistoryStatus(
  status: TransactionStatus | undefined,
  setSearchParams: ReturnType<typeof useSearchParams>[1],
  highlightedTransactionId: string | null,
) {
  const nextParams = new URLSearchParams();
  nextParams.set("tab", "history");

  if (status) {
    nextParams.set("status", status);
  }

  if (highlightedTransactionId) {
    nextParams.set("highlight", highlightedTransactionId);
  }

  setSearchParams(nextParams);
}
