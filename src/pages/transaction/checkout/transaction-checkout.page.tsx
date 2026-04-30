import { useEffect, useMemo, useState, type ReactNode } from "react";
import { CircleCheckBigIcon, ReceiptTextIcon } from "lucide-react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router";
import { getEventByIdentifier } from "@/api/event/event.api";
import type { IEvent } from "@/api/event/event.interface";
import type { ITransaction } from "@/api/transaction/transaction.interface";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { useAuthStore } from "@/store/auth.store";
import { TransactionCheckout } from "@/pages/transaction/components/transaction-checkout";
import {
  formatRupiah,
  getTransactionErrorMessage,
  isEventPurchasable,
} from "@/pages/transaction/transaction.utils";

export default function TransactionCheckoutPage() {
  const { eventIdentifier } = useParams<{ eventIdentifier: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const isHydrated = useAuthStore((state) => state.isHydrated);
  const [event, setEvent] = useState<IEvent | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [completedTransaction, setCompletedTransaction] =
    useState<ITransaction | null>(null);

  const selectedTicketTypeId = searchParams.get("ticketTypeId")?.trim() ?? "";

  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    if (!user) {
      navigate("/login", { replace: true });
      return;
    }

    if (!eventIdentifier) {
      setIsLoading(false);
      setErrorMessage("We couldn't figure out which event you wanted to buy.");
      return;
    }

    let isCancelled = false;

    const loadEvent = async () => {
      try {
        setIsLoading(true);
        setErrorMessage(null);
        const response = await getEventByIdentifier(eventIdentifier);

        if (isCancelled) {
          return;
        }

        if (!response.data) {
          setErrorMessage("We couldn't load that event anymore.");
          setEvent(null);
          return;
        }

        setEvent(response.data);
      } catch (error) {
        if (isCancelled) {
          return;
        }

        setErrorMessage(getTransactionErrorMessage(error));
        setEvent(null);
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    };

    void loadEvent();

    return () => {
      isCancelled = true;
    };
  }, [eventIdentifier, isHydrated, navigate, user]);

  const selectedTicketType = useMemo(
    () =>
      (event?.ticketTypes ?? []).find(
        (ticketType) =>
          ticketType.id === selectedTicketTypeId &&
          ticketType.isActive !== false,
      ) ?? null,
    [event?.ticketTypes, selectedTicketTypeId],
  );

  function handleTransactionCreated(transaction: ITransaction) {
    if (transaction.status === "DONE") {
      setCompletedTransaction(transaction);
      return;
    }

    if (transaction.status === "WAITING_FOR_PAYMENT") {
      navigate(`/transactions?tab=ongoing&highlight=${transaction.id}`, {
        replace: true,
      });
      return;
    }

    navigate(
      `/transactions?tab=history&status=${transaction.status}&highlight=${transaction.id}`,
      {
        replace: true,
      },
    );
  }

  if (!isHydrated || isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(210,82,32,0.13),_transparent_40%),linear-gradient(180deg,_rgba(245,247,244,1)_0%,_rgba(236,241,236,1)_100%)] px-6 pt-28 pb-12">
        <div className="flex items-center gap-3 rounded-2xl border border-border bg-card px-5 py-4 shadow-sm">
          <Spinner />
          <p className="text-sm text-muted-foreground">Loading checkout...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  if (user.role !== "CUSTOMER") {
    return (
      <PageShell>
        <Card className="mx-auto max-w-2xl border-border bg-card shadow-lg">
          <CardHeader>
            <CardTitle>Customer checkout only</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              This purchase flow is currently designed for customer accounts.
            </p>
            <Button asChild>
              <Link to="/">Back to home</Link>
            </Button>
          </CardContent>
        </Card>
      </PageShell>
    );
  }

  if (completedTransaction) {
    return (
      <PageShell>
        <Card className="mx-auto max-w-3xl border-border bg-card shadow-xl shadow-accent/10">
          <CardHeader className="gap-3 text-center">
            <div className="mx-auto rounded-full bg-accent/10 p-4 text-accent">
              <CircleCheckBigIcon className="h-8 w-8" />
            </div>
            <CardTitle className="text-3xl">Purchase completed</CardTitle>
            <p className="text-sm text-muted-foreground">
              Your checkout finished successfully and no extra payment is needed.
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 rounded-3xl border border-border/80 bg-muted/25 p-5 sm:grid-cols-2">
              <SuccessStat
                label="Final amount"
                value={formatRupiah(completedTransaction.finalAmount)}
              />
              <SuccessStat
                label="Voucher discount"
                value={formatRupiah(completedTransaction.voucherAmount)}
              />
              <SuccessStat
                label="Coupon discount"
                value={formatRupiah(completedTransaction.couponAmount)}
              />
              <SuccessStat
                label="Points discount"
                value={formatRupiah(completedTransaction.pointsAmount)}
              />
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Button asChild size="lg">
                <Link to="/transactions?tab=history&status=DONE">
                  <ReceiptTextIcon className="mr-2 h-4 w-4" />
                  View transaction history
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link to="/">Back to home</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </PageShell>
    );
  }

  if (!event || errorMessage) {
    return (
      <PageShell>
        <Card className="mx-auto max-w-2xl border-destructive/20 bg-card shadow-lg">
          <CardHeader>
            <CardTitle>Checkout unavailable</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {errorMessage ?? "We couldn't load that event right now."}
            </p>
            <Button asChild variant="outline">
              <Link to="/">Back to home</Link>
            </Button>
          </CardContent>
        </Card>
      </PageShell>
    );
  }

  if (!isEventPurchasable(event)) {
    return (
      <PageShell>
        <Card className="mx-auto max-w-2xl border-border bg-card shadow-lg">
          <CardHeader>
            <CardTitle>Checkout unavailable</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              This event is no longer purchasable because it is unavailable or
              the kick-off time has started.
            </p>
            <Button asChild variant="outline">
              <Link to={`/event/${event.slug || event.id}`}>Back to event page</Link>
            </Button>
          </CardContent>
        </Card>
      </PageShell>
    );
  }

  if (!selectedTicketType) {
    return (
      <PageShell>
        <Card className="mx-auto max-w-2xl border-border/80 bg-card shadow-lg">
          <CardHeader>
            <CardTitle>Select a ticket first</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Choose a ticket type on the event page before continuing to the
              transaction step.
            </p>
            <Button asChild>
              <Link to={`/event/${event.slug || event.id}`}>Back to event page</Link>
            </Button>
          </CardContent>
        </Card>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <div className="mx-auto w-full max-w-7xl space-y-6">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">
            Secure transaction
          </p>
          <h2 className="text-4xl font-semibold tracking-tight">
            Review your football ticket transaction
          </h2>
          <p className="max-w-3xl text-sm text-muted-foreground">
            Your ticket is already selected. This step is only for reviewing the
            order, applying discounts, and creating the transaction.
          </p>
        </div>

        <TransactionCheckout
          event={event}
          selectedTicketTypeId={selectedTicketTypeId}
          onTransactionCreated={handleTransactionCreated}
        />
      </div>
    </PageShell>
  );
}

function PageShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(210,82,32,0.13),_transparent_40%),linear-gradient(180deg,_rgba(245,247,244,1)_0%,_rgba(236,241,236,1)_100%)] px-6 pt-28 pb-12 lg:px-16">
      {children}
    </div>
  );
}

function SuccessStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border/80 bg-card px-4 py-4">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-2 text-lg font-semibold">{value}</p>
    </div>
  );
}
