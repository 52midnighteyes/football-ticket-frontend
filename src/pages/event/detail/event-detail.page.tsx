import { useEffect, useMemo, useState, type ReactNode } from "react";
import { ArrowRightIcon, CalendarDaysIcon, MapPinIcon, TicketIcon } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router";
import { getEventByIdentifier } from "@/api/event/event.api";
import type { IEvent, ITicketType } from "@/api/event/event.interface";
import { Button } from "@/components/ui/button";
import EventBanner from "@/components/event-banner";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";
import {
  formatRupiah,
  formatTransactionDateTime,
  getTransactionErrorMessage,
  isEventPurchasable,
} from "@/pages/transaction/transaction.utils";
import { useAuthStore } from "@/store/auth.store";

export default function EventDetailPage() {
  const { eventIdentifier } = useParams<{ eventIdentifier: string }>();
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const [event, setEvent] = useState<IEvent | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selectedTicketTypeId, setSelectedTicketTypeId] = useState("");

  useEffect(() => {
    if (!eventIdentifier) {
      setIsLoading(false);
      setErrorMessage("We couldn't figure out which event you wanted to view.");
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
          setEvent(null);
          setErrorMessage("We couldn't load that event anymore.");
          return;
        }

        setEvent(response.data);
      } catch (error) {
        if (isCancelled) {
          return;
        }

        setEvent(null);
        setErrorMessage(getTransactionErrorMessage(error));
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
  }, [eventIdentifier]);

  const ticketTypes = useMemo(
    () =>
      (event?.ticketTypes ?? []).filter(
        (ticketType) => ticketType.isActive !== false,
      ),
    [event?.ticketTypes],
  );

  const selectedTicketType =
    ticketTypes.find((ticketType) => ticketType.id === selectedTicketTypeId) ??
    null;

  useEffect(() => {
    const firstAvailableTicket =
      ticketTypes.find((ticketType) => ticketType.isSoldOut !== true) ??
      ticketTypes[0];

    setSelectedTicketTypeId(firstAvailableTicket?.id ?? "");
  }, [ticketTypes]);

  const isCustomerBlocked = user?.role === "ORGANIZER";
  const isPurchasable = isEventPurchasable(event);
  const isContinueDisabled =
    !event ||
    !selectedTicketType ||
    selectedTicketType.isSoldOut === true ||
    !isPurchasable ||
    isCustomerBlocked;

  const checkoutHref =
    event && selectedTicketType
      ? `/transactions/checkout/${event.slug || event.id}?ticketTypeId=${selectedTicketType.id}`
      : "/";

  if (isLoading) {
    return (
      <PageShell>
        <div className="flex items-center gap-3 rounded-2xl border border-border bg-card px-5 py-4 shadow-sm">
          <Spinner />
          <p className="text-sm text-muted-foreground">Loading event details...</p>
        </div>
      </PageShell>
    );
  }

  if (!event || errorMessage) {
    return (
      <PageShell>
        <Card className="mx-auto max-w-2xl border-destructive/20 bg-card shadow-lg">
          <CardHeader>
            <CardTitle>Event unavailable</CardTitle>
            <CardDescription>
              {errorMessage ?? "We couldn't load that event right now."}
            </CardDescription>
          </CardHeader>
          <CardFooter className="justify-start">
            <Button asChild variant="outline">
              <Link to="/">Back to home</Link>
            </Button>
          </CardFooter>
        </Card>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <div className="mx-auto grid w-full max-w-7xl gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-6">
          <Card className="gap-0 overflow-hidden border-border/80 bg-card pt-0 shadow-xl shadow-primary/5">
            <EventBanner
              src={event.bannerUrl}
              alt={event.name}
              placeholder="Match artwork unavailable"
            />

            <CardHeader className="gap-4 px-5 py-5 md:px-6">
              <div className="flex flex-wrap items-center gap-3 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
                <span>Event overview</span>
                {event.status !== "PUBLISHED" ? (
                  <>
                    <span className="h-1.5 w-1.5 rounded-full bg-primary/40" />
                    <span>{event.status}</span>
                  </>
                ) : null}
              </div>
              <CardTitle className="line-clamp-2 break-words text-3xl font-semibold tracking-tight md:text-4xl">
                {event.name}
              </CardTitle>
              <p className="max-w-3xl line-clamp-3 break-words text-sm leading-7 text-muted-foreground">
                {event.description}
              </p>
            </CardHeader>

            <CardContent className="px-5 pb-5 md:px-6">
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                <EventFact
                  icon={<MapPinIcon className="h-4 w-4" />}
                  label="Venue"
                  value={event.venue}
                />
                <EventFact
                  icon={<CalendarDaysIcon className="h-4 w-4" />}
                  label="Kick-off"
                  value={formatTransactionDateTime(event.startAt)}
                />
                <EventFact
                  icon={<TicketIcon className="h-4 w-4" />}
                  label="Address"
                  value={event.address}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/80 bg-card shadow-sm">
            <CardHeader className="gap-2 px-5 py-5 md:px-6">
              <CardTitle className="text-xl">Choose your ticket</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 px-5 pb-5 md:grid-cols-2 md:px-6">
              {ticketTypes.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border/80 bg-muted/30 px-4 py-5 text-sm text-muted-foreground">
                  No ticket types are available for this event yet.
                </div>
              ) : null}

              {ticketTypes.map((ticketType) => {
                const isSelected = ticketType.id === selectedTicketTypeId;
                const isSoldOut = ticketType.isSoldOut === true;

                return (
                  <button
                    key={ticketType.id}
                    type="button"
                    onClick={() => setSelectedTicketTypeId(ticketType.id)}
                    disabled={isSoldOut}
                    className={`group rounded-[1.35rem] border px-4 py-4 text-left transition ${
                      isSelected
                        ? "border-primary bg-linear-to-br from-primary/6 via-card to-accent/8 shadow-sm"
                        : "border-border bg-card hover:border-primary/35 hover:bg-muted/20"
                    } disabled:cursor-not-allowed disabled:opacity-55`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 space-y-2">
                        <p className="line-clamp-2 break-words text-lg font-semibold leading-tight">
                          {ticketType.name}
                        </p>
                        <p className="text-xl font-semibold text-primary">
                          {formatRupiah(ticketType.price)}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Quota {ticketType.quota}
                        </p>
                      </div>
                      <span
                        className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${
                          isSoldOut
                            ? "border border-border bg-background text-muted-foreground"
                            : isSelected
                              ? "bg-primary text-primary-foreground"
                              : "bg-accent/10 text-accent"
                        }`}
                      >
                        {isSoldOut ? "Sold out" : isSelected ? "Selected" : "Ready"}
                      </span>
                    </div>
                  </button>
                );
              })}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-5 xl:sticky xl:top-28 xl:self-start">
          <Card className="border-border/80 bg-card shadow-lg shadow-primary/5">
            <CardHeader className="gap-2 px-5 py-5 md:px-6">
              <CardTitle className="text-xl">Selected ticket</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 px-5 pb-5 md:px-6">
              <SelectedTicketPreview ticketType={selectedTicketType} />
            </CardContent>
            <Separator />
            <CardFooter className="flex-col items-stretch gap-3 border-t-0 bg-transparent px-5 py-4 md:px-6">
              {isCustomerBlocked ? (
                <Button className="w-full" disabled>
                  Customer checkout only
                </Button>
              ) : user ? (
                <Button
                  type="button"
                  className="w-full"
                  disabled={isContinueDisabled}
                  onClick={() => navigate(checkoutHref)}
                >
                  Continue to transaction
                  <ArrowRightIcon className="ml-2 h-4 w-4" />
                </Button>
              ) : (
                <Button
                  type="button"
                  className="w-full"
                  disabled={!selectedTicketType || !isPurchasable}
                  onClick={() => navigate("/login")}
                >
                  Login to continue
                  <ArrowRightIcon className="ml-2 h-4 w-4" />
                </Button>
              )}
              <p className="text-sm leading-6 text-muted-foreground">
                {!isPurchasable
                  ? "This event can no longer be purchased because it is unavailable or the kick-off time has started."
                  : "You can still go back and change your ticket before creating the transaction."}
              </p>
            </CardFooter>
          </Card>
        </div>
      </div>
    </PageShell>
  );
}

function PageShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(210,82,32,0.12),_transparent_35%),linear-gradient(180deg,_rgba(245,247,244,1)_0%,_rgba(236,241,236,1)_100%)] px-6 pt-28 pb-12 lg:px-16">
      {children}
    </div>
  );
}

function EventFact({
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
      <p className="mt-2 line-clamp-3 break-words text-sm font-semibold leading-6">
        {value}
      </p>
    </div>
  );
}

function SelectedTicketPreview({
  ticketType,
}: {
  ticketType: ITicketType | null;
}) {
  if (!ticketType) {
    return (
      <div className="rounded-2xl border border-dashed border-border/80 bg-muted/25 px-4 py-4 text-sm text-muted-foreground">
        Choose a ticket type to unlock the transaction step.
      </div>
    );
  }

  return (
    <div className="rounded-[1.4rem] border border-primary/15 bg-linear-to-br from-primary/6 via-card to-accent/8 px-4 py-4">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
        Ready to continue
      </p>
      <p className="mt-2 line-clamp-2 break-words text-lg font-semibold leading-tight">
        {ticketType.name}
      </p>
      <div className="mt-4 flex items-end justify-between gap-3">
        <span className="text-sm text-muted-foreground">Quota {ticketType.quota}</span>
        <span className="text-lg font-semibold text-primary">
          {formatRupiah(ticketType.price)}
        </span>
      </div>
    </div>
  );
}
