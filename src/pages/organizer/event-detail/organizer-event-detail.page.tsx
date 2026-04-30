import { useEffect, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router";
import axios from "axios";
import {
  ArrowLeftIcon,
  CalendarDaysIcon,
  CheckCircle2Icon,
  ScanLineIcon,
  MapPinIcon,
  TicketIcon,
  UsersIcon,
} from "lucide-react";
import { toast } from "sonner";
import { getEventByIdentifier } from "@/api/event/event.api";
import type {
  EventStatus,
  IEvent,
  IPaginatedResponse,
  ITicketType,
} from "@/api/event/event.interface";
import {
  checkInTicket,
  getTickets,
  getTicketAttendanceStats,
} from "@/api/ticket/ticket.api";
import type {
  ITicket,
  ITicketAttendanceStats,
  ITicketCheckInResult,
} from "@/api/ticket/ticket.interface";
import { getOrganizerTransactions } from "@/api/transaction/transaction.api";
import type {
  IOrganizerTransaction,
  TransactionStatus,
} from "@/api/transaction/transaction.interface";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { OrganizerTransactionsTable } from "@/pages/organizer/dashboard/organizer-transactions-table";
import {
  formatRupiah,
  formatTransactionDateTime,
  getTransactionErrorMessage,
} from "@/pages/transaction/transaction.utils";
import { useAuthStore } from "@/store/auth.store";

const PAGE_SIZE = 10;
const ALL_TRANSACTION_STATUS = "ALL_TRANSACTION_STATUS";
const ALL_ATTENDANCE = "ALL_ATTENDANCE";

type AttendanceFilter = typeof ALL_ATTENDANCE | "CHECKED_IN" | "NOT_CHECKED_IN";

const transactionStatusOptions: Array<{
  label: string;
  value: TransactionStatus;
}> = [
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

function buildPaginationItems(currentPage: number, totalPages: number) {
  if (totalPages <= 5) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  if (currentPage <= 3) {
    return [1, 2, 3, 4, "ellipsis-end", totalPages] as const;
  }

  if (currentPage >= totalPages - 2) {
    return [
      1,
      "ellipsis-start",
      totalPages - 3,
      totalPages - 2,
      totalPages - 1,
      totalPages,
    ] as const;
  }

  return [
    1,
    "ellipsis-start",
    currentPage - 1,
    currentPage,
    currentPage + 1,
    "ellipsis-end",
    totalPages,
  ] as const;
}

function getPageFromSearchParams(value: string | null) {
  if (!value) {
    return 1;
  }

  const parsedValue = Number(value);

  if (!Number.isInteger(parsedValue) || parsedValue < 1) {
    return 1;
  }

  return parsedValue;
}

function getTransactionStatusFromSearchParams(value: string | null) {
  if (
    value &&
    transactionStatusOptions.some(
      (statusOption) => statusOption.value === value,
    )
  ) {
    return value as TransactionStatus;
  }

  return ALL_TRANSACTION_STATUS;
}

function getAttendanceFilterFromSearchParams(
  value: string | null,
): AttendanceFilter {
  if (value === "CHECKED_IN" || value === "NOT_CHECKED_IN") {
    return value;
  }

  return ALL_ATTENDANCE;
}

function createSearchParamsWithUpdates(
  searchParams: URLSearchParams,
  updates: Record<string, string | null>,
) {
  const nextSearchParams = new URLSearchParams(searchParams);

  Object.entries(updates).forEach(([key, value]) => {
    if (!value) {
      nextSearchParams.delete(key);
      return;
    }

    nextSearchParams.set(key, value);
  });

  return nextSearchParams;
}

function getEventStatusVariant(status: EventStatus) {
  if (status === "PUBLISHED") {
    return "default";
  }

  if (status === "COMPLETED") {
    return "secondary";
  }

  if (status === "CANCELED") {
    return "destructive";
  }

  return "outline";
}

function getTicketDisplayName(ticket: ITicket) {
  const firstName = ticket.user?.firstName ?? ticket.transaction?.user?.firstName ?? "";
  const lastName = ticket.user?.lastName ?? ticket.transaction?.user?.lastName ?? "";
  const fullName = `${firstName} ${lastName}`.trim();

  if (fullName) {
    return fullName;
  }

  return (
    ticket.user?.email ??
    ticket.transaction?.user?.email ??
    "Attendee unavailable"
  );
}

function getTicketPaidAmount(ticket: ITicket) {
  if (typeof ticket.transaction?.finalAmount === "number") {
    return ticket.transaction.finalAmount;
  }

  if (typeof ticket.transaction?.totalAmount === "number") {
    return ticket.transaction.totalAmount;
  }

  if (typeof ticket.transactionItem?.subtotal === "number") {
    return ticket.transactionItem.subtotal;
  }

  if (typeof ticket.transactionItem?.price === "number") {
    return ticket.transactionItem.price;
  }

  return null;
}

export default function OrganizerEventDetailPage() {
  const { eventIdentifier } = useParams<{ eventIdentifier: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const isHydrated = useAuthStore((state) => state.isHydrated);
  const user = useAuthStore((state) => state.user);

  const [event, setEvent] = useState<IEvent | null>(null);
  const [ticketStats, setTicketStats] = useState<ITicketAttendanceStats | null>(
    null,
  );
  const [transactions, setTransactions] = useState<IOrganizerTransaction[]>([]);
  const [tickets, setTickets] = useState<ITicket[]>([]);
  const [eventErrorMessage, setEventErrorMessage] = useState<string | null>(
    null,
  );
  const [transactionErrorMessage, setTransactionErrorMessage] = useState<
    string | null
  >(null);
  const [ticketErrorMessage, setTicketErrorMessage] = useState<string | null>(
    null,
  );
  const [isLoadingEvent, setIsLoadingEvent] = useState(true);
  const [isLoadingTransactions, setIsLoadingTransactions] = useState(true);
  const [isLoadingTickets, setIsLoadingTickets] = useState(true);
  const [checkInCode, setCheckInCode] = useState("");
  const [isCheckingInTicket, setIsCheckingInTicket] = useState(false);
  const [checkInSuccessMessage, setCheckInSuccessMessage] = useState<
    string | null
  >(null);
  const [lastCheckedInTicket, setLastCheckedInTicket] =
    useState<ITicketCheckInResult | null>(null);
  const [pendingReviewTotal, setPendingReviewTotal] = useState(0);

  const selectedTransactionStatus = getTransactionStatusFromSearchParams(
    searchParams.get("transactionStatus"),
  );
  const selectedAttendanceFilter = getAttendanceFilterFromSearchParams(
    searchParams.get("attendance"),
  );
  const currentTransactionPage = getPageFromSearchParams(
    searchParams.get("transactionPage"),
  );
  const currentTicketPage = getPageFromSearchParams(searchParams.get("ticketPage"));

  const [transactionPaginationMeta, setTransactionPaginationMeta] = useState<
    IPaginatedResponse<IOrganizerTransaction[]>["meta"]
  >({
    page: 1,
    limit: PAGE_SIZE,
    total: 0,
    totalPages: 1,
  });
  const [ticketPaginationMeta, setTicketPaginationMeta] = useState<
    IPaginatedResponse<ITicket[]>["meta"]
  >({
    page: 1,
    limit: PAGE_SIZE,
    total: 0,
    totalPages: 1,
  });

  const isAllowedRole = !!user && ["ORGANIZER", "ADMIN"].includes(user.role);

  const updateSearchParams = (updates: Record<string, string | null>) => {
    setSearchParams(createSearchParamsWithUpdates(searchParams, updates));
  };

  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    if (!user) {
      navigate("/login");
      return;
    }

    if (!isAllowedRole) {
      navigate("/", { replace: true });
      return;
    }

    if (!eventIdentifier) {
      setIsLoadingEvent(false);
      setEventErrorMessage("We couldn't figure out which event to open.");
      return;
    }

    let isMounted = true;

    const loadEventSummary = async () => {
      try {
        setIsLoadingEvent(true);
        setEventErrorMessage(null);

        const eventResponse = await getEventByIdentifier(eventIdentifier);

        if (!isMounted) {
          return;
        }

        const nextEvent = eventResponse.data ?? null;

        if (!nextEvent) {
          setEvent(null);
          setTicketStats(null);
          setEventErrorMessage("We couldn't load that event anymore.");
          return;
        }

        if (user.role === "ORGANIZER" && nextEvent.organizerId !== user.id) {
          setEvent(null);
          setTicketStats(null);
          setEventErrorMessage("You don't have access to this organizer event.");
          return;
        }

        const statsResponse = await getTicketAttendanceStats(nextEvent.id);

        if (!isMounted) {
          return;
        }

        setEvent(nextEvent);
        setTicketStats(statsResponse.data ?? null);
      } catch (error) {
        if (!isMounted) {
          return;
        }

        setEvent(null);
        setTicketStats(null);
        setEventErrorMessage(getTransactionErrorMessage(error));
      } finally {
        if (isMounted) {
          setIsLoadingEvent(false);
        }
      }
    };

    void loadEventSummary();

    return () => {
      isMounted = false;
    };
  }, [eventIdentifier, isAllowedRole, isHydrated, navigate, user]);

  useEffect(() => {
    if (!isHydrated || !user || !isAllowedRole || !event?.id) {
      return;
    }

    let isMounted = true;

    const loadTransactions = async () => {
      try {
        setIsLoadingTransactions(true);
        setTransactionErrorMessage(null);

        const [transactionsResponse, pendingResponse] = await Promise.all([
          getOrganizerTransactions({
            eventId: event.id,
            page: currentTransactionPage,
            limit: PAGE_SIZE,
            status:
              selectedTransactionStatus === ALL_TRANSACTION_STATUS
                ? undefined
                : selectedTransactionStatus,
          }),
          getOrganizerTransactions({
            eventId: event.id,
            page: 1,
            limit: 1,
            status: "WAITING_FOR_ADMIN_CONFIRMATION",
          }),
        ]);

        if (!isMounted) {
          return;
        }

        setTransactions(transactionsResponse.data ?? []);
        setTransactionPaginationMeta(transactionsResponse.meta);
        setPendingReviewTotal(pendingResponse.meta.total);
      } catch (error) {
        if (!isMounted) {
          return;
        }

        const message = axios.isAxiosError(error)
          ? error.response?.data?.message ??
            "Failed to load organizer transactions"
          : "Failed to load organizer transactions";
        setTransactionErrorMessage(message);
      } finally {
        if (isMounted) {
          setIsLoadingTransactions(false);
        }
      }
    };

    void loadTransactions();

    return () => {
      isMounted = false;
    };
  }, [
    currentTransactionPage,
    event?.id,
    isAllowedRole,
    isHydrated,
    selectedTransactionStatus,
    user,
  ]);

  useEffect(() => {
    if (!isHydrated || !user || !isAllowedRole || !event?.id) {
      return;
    }

    let isMounted = true;

    const loadTickets = async () => {
      try {
        setIsLoadingTickets(true);
        setTicketErrorMessage(null);

        const response = await getTickets({
          eventId: event.id,
          page: currentTicketPage,
          limit: PAGE_SIZE,
          checkedIn:
            selectedAttendanceFilter === ALL_ATTENDANCE
              ? undefined
              : selectedAttendanceFilter === "CHECKED_IN",
        });

        if (!isMounted) {
          return;
        }

        setTickets(response.data ?? []);
        setTicketPaginationMeta(response.meta);
      } catch (error) {
        if (!isMounted) {
          return;
        }

        const message = axios.isAxiosError(error)
          ? error.response?.data?.message ?? "Failed to load attendee tickets"
          : "Failed to load attendee tickets";
        setTicketErrorMessage(message);
      } finally {
        if (isMounted) {
          setIsLoadingTickets(false);
        }
      }
    };

    void loadTickets();

    return () => {
      isMounted = false;
    };
  }, [
    currentTicketPage,
    event?.id,
    isAllowedRole,
    isHydrated,
    selectedAttendanceFilter,
    user,
  ]);

  if (!isHydrated) {
    return (
      <div className="min-h-screen bg-muted/30 px-6 pt-28 pb-10 lg:px-20">
        <Card className="mx-auto w-full max-w-6xl border-border shadow-sm">
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">
              Loading event dashboard...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!user || !isAllowedRole) {
    return null;
  }

  const ticketTypes = event?.ticketTypes ?? [];
  const totalSeatQuota = ticketTypes.reduce(
    (total, ticketType) => total + ticketType.quota,
    0,
  );
  const totalIssuedTickets = ticketStats?.totalTickets ?? 0;
  const remainingSeats = Math.max(totalSeatQuota - totalIssuedTickets, 0);
  const checkedInTickets = ticketStats?.totalCheckedInTickets ?? 0;
  const attendanceRate = ticketStats?.attendancePercentage ?? 0;
  const hasMultipleTransactionPages = transactionPaginationMeta.totalPages > 1;
  const hasMultipleTicketPages = ticketPaginationMeta.totalPages > 1;
  const transactionPaginationItems = buildPaginationItems(
    currentTransactionPage,
    transactionPaginationMeta.totalPages,
  );
  const ticketPaginationItems = buildPaginationItems(
    currentTicketPage,
    ticketPaginationMeta.totalPages,
  );

  const reloadTransactions = async () => {
    if (!event?.id) {
      return;
    }

    try {
      const [transactionsResponse, pendingResponse] = await Promise.all([
        getOrganizerTransactions({
          eventId: event.id,
          page: currentTransactionPage,
          limit: PAGE_SIZE,
          status:
            selectedTransactionStatus === ALL_TRANSACTION_STATUS
              ? undefined
              : selectedTransactionStatus,
        }),
        getOrganizerTransactions({
          eventId: event.id,
          page: 1,
          limit: 1,
          status: "WAITING_FOR_ADMIN_CONFIRMATION",
        }),
      ]);

      setTransactions(transactionsResponse.data ?? []);
      setTransactionPaginationMeta(transactionsResponse.meta);
      setPendingReviewTotal(pendingResponse.meta.total);
    } catch (error) {
      toast.error(getTransactionErrorMessage(error));
    }
  };

  const reloadTickets = async () => {
    if (!event?.id) {
      return;
    }

    try {
      const response = await getTickets({
        eventId: event.id,
        page: currentTicketPage,
        limit: PAGE_SIZE,
        checkedIn:
          selectedAttendanceFilter === ALL_ATTENDANCE
            ? undefined
            : selectedAttendanceFilter === "CHECKED_IN",
      });

      setTickets(response.data ?? []);
      setTicketPaginationMeta(response.meta);
    } catch (error) {
      toast.error(getTransactionErrorMessage(error));
    }
  };

  const reloadTicketStats = async () => {
    if (!event?.id) {
      return;
    }

    try {
      const response = await getTicketAttendanceStats(event.id);
      setTicketStats(response.data ?? null);
    } catch (error) {
      toast.error(getTransactionErrorMessage(error));
    }
  };

  const handleTicketCheckIn = async (submittedCode: string) => {
    const normalizedCode = submittedCode.trim();

    if (!normalizedCode) {
      toast.error("Ticket code is required");
      return;
    }

    try {
      setIsCheckingInTicket(true);
      setCheckInSuccessMessage(null);
      const response = await checkInTicket(normalizedCode);
      const checkedInTicket = response.data ?? null;

      if (checkedInTicket && event?.id && checkedInTicket.event.id !== event.id) {
        toast.error("This ticket belongs to a different event.");
        return;
      }

      setLastCheckedInTicket(checkedInTicket);
      setCheckInCode("");
      setCheckInSuccessMessage(
        response.message ?? "Ticket checked in successfully",
      );
      toast.success(response.message ?? "Ticket checked in successfully");
      await Promise.all([reloadTickets(), reloadTicketStats()]);
    } catch (error) {
      setCheckInSuccessMessage(null);
      toast.error(getTransactionErrorMessage(error));
    } finally {
      setIsCheckingInTicket(false);
    }
  };

  return (
    <div className="min-h-screen bg-muted/30 px-6 pt-28 pb-10 lg:px-20">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <div className="flex items-center justify-between gap-3">
          <Button asChild variant="outline" size="sm">
            <Link to="/dashboard">
              <ArrowLeftIcon className="mr-2 h-4 w-4" />
              Back to dashboard
            </Link>
          </Button>
        </div>

        {isLoadingEvent ? (
          <Card className="border-border bg-card shadow-sm">
            <CardContent className="flex items-center gap-3 py-8 text-sm text-muted-foreground">
              <Spinner className="h-4 w-4" />
              Loading event overview...
            </CardContent>
          </Card>
        ) : eventErrorMessage || !event ? (
          <Card className="border-destructive/20 bg-card shadow-sm">
            <CardHeader>
              <CardTitle className="text-destructive">Event unavailable</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                {eventErrorMessage ?? "We couldn't load this organizer event."}
              </p>
              <Button asChild variant="outline" size="sm">
                <Link to="/dashboard">Return to dashboard</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            <Card className="overflow-hidden border-border bg-card shadow-sm">
              <CardContent className="flex flex-col gap-6 p-6">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center gap-3">
                      <Badge variant={getEventStatusVariant(event.status)}>
                        {event.status}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {event.slug}
                      </span>
                    </div>

                    <div className="space-y-2">
                      <h1 className="text-3xl font-semibold tracking-tight text-foreground">
                        {event.name}
                      </h1>
                      <p className="max-w-3xl text-sm leading-7 text-muted-foreground">
                        {event.description}
                      </p>
                    </div>
                  </div>

                  <Button asChild size="sm">
                    <Link to={`/event/update/${event.id}`}>Update event</Link>
                  </Button>
                </div>

                <div className="grid gap-3 md:grid-cols-3">
                  <InfoTile
                    icon={<CalendarDaysIcon className="h-4 w-4" />}
                    label="Schedule"
                    value={formatTransactionDateTime(event.startAt)}
                    caption={`Ends ${formatTransactionDateTime(event.endAt)}`}
                  />
                  <InfoTile
                    icon={<MapPinIcon className="h-4 w-4" />}
                    label="Venue"
                    value={event.venue}
                    caption={event.address}
                  />
                  <InfoTile
                    icon={<UsersIcon className="h-4 w-4" />}
                    label="Need review"
                    value={String(pendingReviewTotal)}
                    caption="Transactions waiting for organizer confirmation"
                  />
                </div>

              </CardContent>
            </Card>

            <Card
              className={`border shadow-sm transition-colors ${
                checkInSuccessMessage
                  ? "border-emerald-300 bg-emerald-50/50"
                  : "border-border bg-card"
              }`}
            >
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ScanLineIcon
                    className={`h-5 w-5 ${
                      checkInSuccessMessage ? "text-emerald-600" : "text-primary"
                    }`}
                  />
                  Verify ticket check-in
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-5">
                <div
                  className={`rounded-2xl border p-4 transition-colors ${
                    checkInSuccessMessage
                      ? "border-emerald-300 bg-emerald-50/80"
                      : "border-border/70 bg-background/70"
                  }`}
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                    <div className="space-y-1">
                      <div
                        className={`flex items-center gap-2 text-sm font-semibold ${
                          checkInSuccessMessage ? "text-emerald-700" : "text-foreground"
                        }`}
                      >
                        <ScanLineIcon
                          className={`h-4 w-4 ${
                            checkInSuccessMessage ? "text-emerald-600" : "text-primary"
                          }`}
                        />
                        Gate verification
                      </div>
                      <p
                        className={`text-sm leading-6 ${
                          checkInSuccessMessage
                            ? "text-emerald-800/90"
                            : "text-muted-foreground"
                        }`}
                      >
                        Enter a ticket code from the attendee gate. The docs say
                        only valid `DONE` tickets that have not been used can be
                        checked in.
                      </p>
                      {checkInSuccessMessage ? (
                        <div className="mt-2 inline-flex w-fit items-center gap-2 rounded-full border border-emerald-300 bg-white/80 px-3 py-1 text-xs font-semibold text-emerald-700">
                          <CheckCircle2Icon className="h-3.5 w-3.5" />
                          {checkInSuccessMessage}
                        </div>
                      ) : null}
                    </div>

                    <form
                      className="flex w-full flex-col gap-3 md:max-w-xl md:flex-row"
                      onSubmit={(event) => {
                        event.preventDefault();
                        void handleTicketCheckIn(checkInCode);
                      }}
                    >
                      <Input
                        value={checkInCode}
                        onChange={(nextEvent) =>
                          setCheckInCode(nextEvent.target.value.toUpperCase())
                        }
                        placeholder="Enter ticket code"
                        className="h-10 bg-background"
                        disabled={isCheckingInTicket}
                      />
                      <Button
                        type="submit"
                        className="h-10 md:min-w-40"
                        disabled={isCheckingInTicket || checkInCode.trim().length === 0}
                      >
                        {isCheckingInTicket ? "Verifying..." : "Verify ticket"}
                      </Button>
                    </form>
                  </div>
                </div>

                <div className="rounded-2xl border border-border/70 bg-muted/20 p-4">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="space-y-1">
                      <p
                        className={`text-xs font-semibold uppercase tracking-[0.16em] ${
                          lastCheckedInTicket ? "text-accent" : "text-muted-foreground"
                        }`}
                      >
                        Latest verified attendee
                      </p>
                      {lastCheckedInTicket ? (
                        <>
                          <p className="text-base font-semibold text-foreground">
                            {`${lastCheckedInTicket.user.firstName} ${lastCheckedInTicket.user.lastName}`.trim()}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {lastCheckedInTicket.user.email}
                          </p>
                        </>
                      ) : (
                        <p className="text-sm leading-6 text-muted-foreground">
                          Verified attendee details will appear here after a
                          successful ticket check-in.
                        </p>
                      )}
                    </div>

                    {lastCheckedInTicket ? (
                      <div className="grid gap-3 sm:grid-cols-3">
                        <TicketMeta
                          label="Ticket"
                          value={lastCheckedInTicket.ticketType.name}
                        />
                        <TicketMeta
                          label="Code"
                          value={lastCheckedInTicket.code}
                        />
                        <TicketMeta
                          label="Checked in"
                          value={formatTransactionDateTime(
                            lastCheckedInTicket.checkedInAt,
                          )}
                        />
                      </div>
                    ) : null}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border bg-card shadow-sm">
              <CardHeader>
                <CardTitle>Ticket overview</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-5">
                <div className="grid gap-3 md:grid-cols-4">
                  <MetricTile
                    icon={<TicketIcon className="h-4 w-4" />}
                    label="Ticket types"
                    value={String(ticketTypes.length)}
                    caption="Configured seat categories for this event"
                  />
                  <MetricTile
                    icon={<UsersIcon className="h-4 w-4" />}
                    label="Issued tickets"
                    value={String(totalIssuedTickets)}
                    caption="Tickets created from approved transactions"
                  />
                  <MetricTile
                    icon={<CheckCircle2Icon className="h-4 w-4" />}
                    label="Checked in"
                    value={String(checkedInTickets)}
                    caption={`${attendanceRate}% attendance rate`}
                  />
                  <MetricTile
                    icon={<CalendarDaysIcon className="h-4 w-4" />}
                    label="Remaining seats"
                    value={String(remainingSeats)}
                    caption={`From total quota ${totalSeatQuota}`}
                  />
                </div>

                <div className="grid gap-3 lg:grid-cols-2">
                  {ticketTypes.map((ticketType) => (
                    <TicketTypeCard key={ticketType.id} ticketType={ticketType} />
                  ))}

                  {ticketTypes.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-border/70 bg-muted/20 px-4 py-5 text-sm text-muted-foreground">
                      This event doesn't have any ticket types yet.
                    </div>
                  ) : null}
                </div>
              </CardContent>
            </Card>

            <Card className="border-border bg-card shadow-sm">
              <CardContent className="flex flex-col gap-5 p-6">
                <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                  <div className="space-y-1">
                    <h2 className="text-lg font-semibold text-foreground">
                      Transaction approval
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      Review and approve transactions for this event only.
                    </p>
                  </div>

                  <div className="flex w-full flex-col gap-2 md:w-56">
                    <span className="text-sm font-medium text-foreground">
                      Status
                    </span>
                    <Select
                      value={selectedTransactionStatus}
                      onValueChange={(value) =>
                        updateSearchParams({
                          transactionStatus:
                            value === ALL_TRANSACTION_STATUS ? null : value,
                          transactionPage: null,
                        })
                      }
                      disabled={isLoadingTransactions}
                    >
                      <SelectTrigger className="h-10 w-full bg-background">
                        <SelectValue placeholder="All statuses" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={ALL_TRANSACTION_STATUS}>
                          All statuses
                        </SelectItem>
                        {transactionStatusOptions.map((status) => (
                          <SelectItem key={status.value} value={status.value}>
                            {status.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <OrganizerTransactionsTable
                  transactions={transactions}
                  isLoading={isLoadingTransactions}
                  errorMessage={transactionErrorMessage}
                  onRetry={reloadTransactions}
                />

                {!isLoadingTransactions &&
                !transactionErrorMessage &&
                transactions.length > 0 ? (
                  <ListPagination
                    currentPage={currentTransactionPage}
                    totalPages={transactionPaginationMeta.totalPages}
                    hasMultiplePages={hasMultipleTransactionPages}
                    items={transactionPaginationItems}
                    onPageChange={(page) =>
                      updateSearchParams({
                        transactionPage: page <= 1 ? null : String(page),
                      })
                    }
                  />
                ) : null}
              </CardContent>
            </Card>

            <Card className="border-border bg-card shadow-sm">
              <CardContent className="flex flex-col gap-5 p-6">
                <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                  <div className="space-y-1">
                    <h2 className="text-lg font-semibold text-foreground">
                      Attendee tickets
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      Track issued tickets and who has already checked in.
                    </p>
                  </div>

                  <div className="flex w-full flex-col gap-2 md:w-56">
                    <span className="text-sm font-medium text-foreground">
                      Attendance
                    </span>
                    <Select
                      value={selectedAttendanceFilter}
                      onValueChange={(value) =>
                        updateSearchParams({
                          attendance: value === ALL_ATTENDANCE ? null : value,
                          ticketPage: null,
                        })
                      }
                      disabled={isLoadingTickets}
                    >
                      <SelectTrigger className="h-10 w-full bg-background">
                        <SelectValue placeholder="All attendance" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={ALL_ATTENDANCE}>
                          All attendance
                        </SelectItem>
                        <SelectItem value="CHECKED_IN">Checked in</SelectItem>
                        <SelectItem value="NOT_CHECKED_IN">
                          Not checked in
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <AttendeeTicketTable
                  tickets={tickets}
                  isLoading={isLoadingTickets}
                  errorMessage={ticketErrorMessage}
                  onRetry={reloadTickets}
                />

                {!isLoadingTickets && !ticketErrorMessage && tickets.length > 0 ? (
                  <ListPagination
                    currentPage={currentTicketPage}
                    totalPages={ticketPaginationMeta.totalPages}
                    hasMultiplePages={hasMultipleTicketPages}
                    items={ticketPaginationItems}
                    onPageChange={(page) =>
                      updateSearchParams({
                        ticketPage: page <= 1 ? null : String(page),
                      })
                    }
                  />
                ) : null}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}

function InfoTile({
  icon,
  label,
  value,
  caption,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  caption: string;
}) {
  return (
    <div className="rounded-2xl border border-border/70 bg-muted/20 p-4">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
        {icon}
        {label}
      </div>
      <p className="mt-3 text-base font-semibold text-foreground">{value}</p>
      <p className="mt-1 text-sm leading-6 text-muted-foreground">{caption}</p>
    </div>
  );
}

function MetricTile({
  icon,
  label,
  value,
  caption,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  caption: string;
}) {
  return (
    <div className="flex w-full items-start gap-3 rounded-2xl border border-border/70 bg-muted/20 p-4">
      <div className="rounded-full bg-primary/10 p-2 text-primary">{icon}</div>
      <div className="flex flex-col gap-1">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="text-2xl font-semibold text-foreground">{value}</p>
        <p className="text-sm leading-6 text-muted-foreground">{caption}</p>
      </div>
    </div>
  );
}

function TicketTypeCard({ ticketType }: { ticketType: ITicketType }) {
  return (
    <div className="rounded-2xl border border-border/70 bg-muted/20 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="font-semibold text-foreground">{ticketType.name}</p>
          <p className="text-sm text-muted-foreground">
            {formatRupiah(ticketType.price)}
          </p>
        </div>
        <Badge variant={ticketType.isSoldOut ? "secondary" : "outline"}>
          {ticketType.isSoldOut ? "Sold out" : "Open"}
        </Badge>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <TicketMeta label="Quota" value={String(ticketType.quota)} />
        <TicketMeta
          label="Active"
          value={ticketType.isActive === false ? "No" : "Yes"}
        />
      </div>
    </div>
  );
}

function TicketMeta({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border/60 bg-background/80 px-3 py-3">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 text-sm font-semibold text-foreground">{value}</p>
    </div>
  );
}

function AttendeeTicketTable({
  tickets,
  isLoading,
  errorMessage,
  onRetry,
}: {
  tickets: ITicket[];
  isLoading: boolean;
  errorMessage: string | null;
  onRetry: () => Promise<void> | void;
}) {
  if (isLoading) {
    return (
      <div className="flex items-center gap-3 py-8 text-sm text-muted-foreground">
        <Spinner className="h-4 w-4" />
        Loading attendee tickets...
      </div>
    );
  }

  if (errorMessage) {
    return (
      <Card className="border-destructive/20 bg-destructive/5 shadow-none">
        <CardHeader>
          <CardTitle className="text-destructive">
            We couldn't load attendee tickets
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">{errorMessage}</p>
          <Button type="button" variant="outline" onClick={() => void onRetry()}>
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (tickets.length === 0) {
    return (
      <div className="flex flex-col gap-3 py-6">
        <h3 className="text-lg font-semibold text-foreground">
          No attendee tickets found
        </h3>
        <p className="text-sm text-muted-foreground">
          Try a different attendance filter or wait for approved transactions to
          issue tickets.
        </p>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="px-6 py-4">Attendee</TableHead>
          <TableHead className="py-4">Ticket</TableHead>
          <TableHead className="py-4">Quantity</TableHead>
          <TableHead className="py-4">Total paid</TableHead>
          <TableHead className="px-6 py-4">Attendance</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {tickets.map((ticket) => {
          const attendeeName = getTicketDisplayName(ticket);
          const ticketTypeName =
            ticket.transactionItem?.ticketType?.name ?? "Ticket type unavailable";
          const paidAmount = getTicketPaidAmount(ticket);
          const quantity = ticket.transactionItem?.quantity ?? 1;

          return (
            <TableRow key={ticket.id}>
              <TableCell className="px-6 py-4">
                <div className="flex max-w-52 flex-col gap-1">
                  <p className="truncate font-medium text-foreground">
                    {attendeeName}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {ticket.user?.email ??
                      ticket.transaction?.user?.email ??
                      "No email"}
                  </p>
                </div>
              </TableCell>
              <TableCell className="py-4">
                <div className="flex max-w-52 flex-col gap-1 text-sm">
                  <span className="truncate font-medium text-foreground">
                    {ticketTypeName}
                  </span>
                  <span className="truncate text-xs text-muted-foreground">
                    {ticket.code}
                  </span>
                </div>
              </TableCell>
              <TableCell className="py-4 text-sm text-foreground">
                {quantity}
              </TableCell>
              <TableCell className="py-4">
                <div className="flex flex-col gap-1 text-sm">
                  <span className="font-medium text-foreground">
                    {paidAmount === null ? "-" : formatRupiah(paidAmount)}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    Transaction {ticket.transaction?.status ?? "unknown"}
                  </span>
                </div>
              </TableCell>
              <TableCell className="px-6 py-4">
                <div className="flex max-w-48 flex-col gap-1 text-sm">
                  <span
                    className={
                      ticket.checkedInAt
                        ? "font-medium text-accent"
                        : "font-medium text-muted-foreground"
                    }
                  >
                    {ticket.checkedInAt ? "Checked in" : "Not checked in"}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {ticket.checkedInAt
                      ? formatTransactionDateTime(ticket.checkedInAt)
                      : "Attendance pending"}
                  </span>
                </div>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}

function ListPagination({
  currentPage,
  totalPages,
  hasMultiplePages,
  items,
  onPageChange,
}: {
  currentPage: number;
  totalPages: number;
  hasMultiplePages: boolean;
  items: readonly (number | "ellipsis-start" | "ellipsis-end")[] | number[];
  onPageChange: (page: number) => void;
}) {
  return (
    <div className="flex flex-col gap-3 border-t border-border/70 pt-4 md:flex-row md:items-center md:justify-between">
      <p className="text-sm text-muted-foreground">
        Page {currentPage} of {totalPages}
      </p>

      <Pagination className="mx-0 w-auto justify-start md:justify-end">
        <PaginationContent>
          {hasMultiplePages ? (
            <PaginationItem>
              <PaginationLink
                href="#"
                size="default"
                onClick={(event) => {
                  event.preventDefault();

                  if (currentPage === 1) {
                    return;
                  }

                  onPageChange(1);
                }}
                className={
                  currentPage === 1 ? "pointer-events-none opacity-50" : ""
                }
              >
                First
              </PaginationLink>
            </PaginationItem>
          ) : null}

          {hasMultiplePages ? (
            <PaginationItem>
              <PaginationPrevious
                href="#"
                onClick={(event) => {
                  event.preventDefault();

                  if (currentPage === 1) {
                    return;
                  }

                  onPageChange(currentPage - 1);
                }}
                className={
                  currentPage === 1 ? "pointer-events-none opacity-50" : ""
                }
              />
            </PaginationItem>
          ) : null}

          {(hasMultiplePages ? items : [1]).map((item, index) =>
            typeof item === "number" ? (
              <PaginationItem key={item}>
                <PaginationLink
                  href="#"
                  isActive={currentPage === item}
                  onClick={(event) => {
                    event.preventDefault();
                    onPageChange(item);
                  }}
                >
                  {item}
                </PaginationLink>
              </PaginationItem>
            ) : (
              <PaginationItem key={`${item}-${index}`}>
                <PaginationEllipsis />
              </PaginationItem>
            ),
          )}

          {hasMultiplePages ? (
            <PaginationItem>
              <PaginationNext
                href="#"
                onClick={(event) => {
                  event.preventDefault();

                  if (currentPage === totalPages) {
                    return;
                  }

                  onPageChange(currentPage + 1);
                }}
                className={
                  currentPage === totalPages
                    ? "pointer-events-none opacity-50"
                    : ""
                }
              />
            </PaginationItem>
          ) : null}

          {hasMultiplePages ? (
            <PaginationItem>
              <PaginationLink
                href="#"
                size="default"
                onClick={(event) => {
                  event.preventDefault();

                  if (currentPage === totalPages) {
                    return;
                  }

                  onPageChange(totalPages);
                }}
                className={
                  currentPage === totalPages
                    ? "pointer-events-none opacity-50"
                    : ""
                }
              >
                Last
              </PaginationLink>
            </PaginationItem>
          ) : null}
        </PaginationContent>
      </Pagination>
    </div>
  );
}
