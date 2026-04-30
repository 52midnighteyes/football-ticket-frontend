import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import axios from "axios";
import {
  CalendarDaysIcon,
  ClipboardCheckIcon,
  ListChecksIcon,
  MapPinIcon,
  SearchIcon,
} from "lucide-react";
import { toast } from "sonner";
import { getCategories, getEvents } from "@/api/event/event.api";
import type {
  EventStatus,
  ICategory,
  IEvent,
  IPaginatedResponse,
} from "@/api/event/event.interface";
import { getOrganizerTransactions } from "@/api/transaction/transaction.api";
import type {
  IOrganizerTransaction,
  TransactionStatus,
} from "@/api/transaction/transaction.interface";
import { OrganizerRevenueChart } from "@/pages/organizer/dashboard/organizer-revenue-chart";
import { OrganizerTransactionsTable } from "@/pages/organizer/dashboard/organizer-transactions-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
import { useDebounce } from "@/hook/useDebounce";
import { useAuthStore } from "@/store/auth.store";

const PAGE_SIZE = 10;
const ALL_STATUS = "ALL_STATUS";
const ALL_CATEGORY = "ALL_CATEGORY";
const ALL_TRANSACTION_STATUS = "ALL_TRANSACTION_STATUS";

const eventStatusOptions: Array<{
  label: string;
  value: EventStatus;
}> = [
  { label: "Draft", value: "DRAFT" },
  { label: "Published", value: "PUBLISHED" },
  { label: "Canceled", value: "CANCELED" },
  { label: "Completed", value: "COMPLETED" },
];

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

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function getStatusVariant(status: IEvent["status"]) {
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

function getEventStatusFromSearchParams(value: string | null) {
  if (
    value &&
    eventStatusOptions.some((statusOption) => statusOption.value === value)
  ) {
    return value as EventStatus;
  }

  return ALL_STATUS;
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

export default function DashboardPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const isHydrated = useAuthStore((state) => state.isHydrated);
  const user = useAuthStore((state) => state.user);

  const currentView =
    searchParams.get("view") === "transactions" ? "transactions" : "events";

  const [events, setEvents] = useState<IEvent[]>([]);
  const [categories, setCategories] = useState<ICategory[]>([]);
  const [transactions, setTransactions] = useState<IOrganizerTransaction[]>([]);
  const [isLoadingEvents, setIsLoadingEvents] = useState(true);
  const [isLoadingTransactions, setIsLoadingTransactions] = useState(true);
  const [isLoadingFilters, setIsLoadingFilters] = useState(true);
  const [eventErrorMessage, setEventErrorMessage] = useState<string | null>(
    null,
  );
  const [transactionErrorMessage, setTransactionErrorMessage] = useState<
    string | null
  >(null);
  const [publishedEventTotal, setPublishedEventTotal] = useState(0);
  const [pendingReviewTotal, setPendingReviewTotal] = useState(0);

  const eventUrlSearchTerm = searchParams.get("nameLike") ?? "";
  const selectedEventStatus = getEventStatusFromSearchParams(
    searchParams.get("status"),
  );
  const selectedCategoryId =
    searchParams.get("categoryId")?.trim() || ALL_CATEGORY;
  const currentEventPage = getPageFromSearchParams(searchParams.get("page"));
  const [eventSearchTerm, setEventSearchTerm] = useState(eventUrlSearchTerm);
  const [eventPaginationMeta, setEventPaginationMeta] = useState<
    IPaginatedResponse<IEvent[]>["meta"]
  >({
    page: 1,
    limit: PAGE_SIZE,
    total: 0,
    totalPages: 1,
  });
  const debouncedEventSearchTerm = useDebounce(eventSearchTerm.trim(), 500);
  const pendingEventSearchParamRef = useRef<string | null>(null);

  const transactionUrlSearchTerm =
    searchParams.get("transactionEventNameLike") ?? "";
  const selectedTransactionStatus = getTransactionStatusFromSearchParams(
    searchParams.get("transactionStatus"),
  );
  const currentTransactionPage = getPageFromSearchParams(
    searchParams.get("transactionPage"),
  );
  const [transactionSearchTerm, setTransactionSearchTerm] = useState(
    transactionUrlSearchTerm,
  );
  const [transactionPaginationMeta, setTransactionPaginationMeta] = useState<
    IPaginatedResponse<IOrganizerTransaction[]>["meta"]
  >({
    page: 1,
    limit: PAGE_SIZE,
    total: 0,
    totalPages: 1,
  });
  const debouncedTransactionSearchTerm = useDebounce(
    transactionSearchTerm.trim(),
    500,
  );
  const pendingTransactionSearchParamRef = useRef<string | null>(null);

  const updateSearchParams = (updates: Record<string, string | null>) => {
    setSearchParams(createSearchParamsWithUpdates(searchParams, updates));
  };

  const setCurrentView = (view: "events" | "transactions") => {
    updateSearchParams({
      view: view === "transactions" ? "transactions" : null,
    });
  };

  const setEventPage = (page: number) => {
    updateSearchParams({
      page: page <= 1 ? null : String(page),
    });
  };

  const setTransactionPage = (page: number) => {
    updateSearchParams({
      transactionPage: page <= 1 ? null : String(page),
    });
  };

  useEffect(() => {
    let isMounted = true;

    const fetchCategories = async () => {
      try {
        const response = await getCategories();

        if (!isMounted) {
          return;
        }

        setCategories(response.data ?? []);
      } catch (error) {
        if (!isMounted) {
          return;
        }

        if (axios.isAxiosError(error)) {
          toast.error(
            error.response?.data?.message ?? "Failed to load categories",
          );
        } else {
          toast.error("Failed to load categories");
        }
      } finally {
        if (isMounted) {
          setIsLoadingFilters(false);
        }
      }
    };

    void fetchCategories();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (debouncedEventSearchTerm === eventUrlSearchTerm) {
      return;
    }

    pendingEventSearchParamRef.current = debouncedEventSearchTerm;

    setSearchParams(
      createSearchParamsWithUpdates(searchParams, {
        nameLike: debouncedEventSearchTerm || null,
        page: null,
      }),
    );
  }, [
    debouncedEventSearchTerm,
    eventUrlSearchTerm,
    searchParams,
    setSearchParams,
  ]);

  useEffect(() => {
    if (pendingEventSearchParamRef.current === eventUrlSearchTerm) {
      pendingEventSearchParamRef.current = null;
      return;
    }

    setEventSearchTerm(eventUrlSearchTerm);
  }, [eventUrlSearchTerm]);

  useEffect(() => {
    if (debouncedTransactionSearchTerm === transactionUrlSearchTerm) {
      return;
    }

    pendingTransactionSearchParamRef.current = debouncedTransactionSearchTerm;

    setSearchParams(
      createSearchParamsWithUpdates(searchParams, {
        transactionEventNameLike: debouncedTransactionSearchTerm || null,
        transactionPage: null,
      }),
    );
  }, [
    debouncedTransactionSearchTerm,
    transactionUrlSearchTerm,
    searchParams,
    setSearchParams,
  ]);

  useEffect(() => {
    if (pendingTransactionSearchParamRef.current === transactionUrlSearchTerm) {
      pendingTransactionSearchParamRef.current = null;
      return;
    }

    setTransactionSearchTerm(transactionUrlSearchTerm);
  }, [transactionUrlSearchTerm]);

  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    if (!user) {
      navigate("/login");
      return;
    }

    if (!["ORGANIZER", "ADMIN"].includes(user.role)) {
      navigate("/", { replace: true });
      return;
    }

    if (currentView !== "events") {
      return;
    }

    const fetchEvents = async () => {
      try {
        setIsLoadingEvents(true);
        setEventErrorMessage(null);

        const [eventsResponse, publishedResponse] = await Promise.all([
          getEvents({
            organizerId: user.id,
            page: currentEventPage,
            limit: PAGE_SIZE,
            nameLike: eventUrlSearchTerm || undefined,
            status:
              selectedEventStatus === ALL_STATUS
                ? undefined
                : (selectedEventStatus as EventStatus),
            categoryId:
              selectedCategoryId === ALL_CATEGORY
                ? undefined
                : selectedCategoryId,
          }),
          getEvents({
            organizerId: user.id,
            page: 1,
            limit: 1,
            status: "PUBLISHED",
          }),
        ]);

        setEvents(eventsResponse.data ?? []);
        setEventPaginationMeta(eventsResponse.meta);
        setPublishedEventTotal(publishedResponse.meta.total);
      } catch (error) {
        if (axios.isAxiosError(error)) {
          setEventErrorMessage(
            error.response?.data?.message ?? "Failed to load events",
          );
          toast.error(error.response?.data?.message ?? "Failed to load events");
        } else {
          setEventErrorMessage("Failed to load events");
          toast.error("Failed to load events");
        }
      } finally {
        setIsLoadingEvents(false);
      }
    };

    void fetchEvents();
  }, [
    currentEventPage,
    currentView,
    eventUrlSearchTerm,
    isHydrated,
    navigate,
    selectedCategoryId,
    selectedEventStatus,
    user,
  ]);

  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    if (!user) {
      navigate("/login");
      return;
    }

    if (!["ORGANIZER", "ADMIN"].includes(user.role)) {
      navigate("/", { replace: true });
      return;
    }

    if (currentView !== "transactions") {
      return;
    }

    const fetchTransactions = async () => {
      try {
        setIsLoadingTransactions(true);
        setTransactionErrorMessage(null);

        const [transactionsResponse, pendingReviewResponse] = await Promise.all(
          [
            getOrganizerTransactions({
              page: currentTransactionPage,
              limit: PAGE_SIZE,
              eventNameLike: transactionUrlSearchTerm || undefined,
              status:
                selectedTransactionStatus === ALL_TRANSACTION_STATUS
                  ? undefined
                  : (selectedTransactionStatus as TransactionStatus),
            }),
            getOrganizerTransactions({
              page: 1,
              limit: 1,
              status: "WAITING_FOR_ADMIN_CONFIRMATION",
            }),
          ],
        );

        setTransactions(transactionsResponse.data ?? []);
        setTransactionPaginationMeta(transactionsResponse.meta);
        setPendingReviewTotal(pendingReviewResponse.meta.total);
      } catch (error) {
        if (axios.isAxiosError(error)) {
          setTransactionErrorMessage(
            error.response?.data?.message ??
              "Failed to load organizer transactions",
          );
          toast.error(
            error.response?.data?.message ??
              "Failed to load organizer transactions",
          );
        } else {
          setTransactionErrorMessage("Failed to load organizer transactions");
          toast.error("Failed to load organizer transactions");
        }
      } finally {
        setIsLoadingTransactions(false);
      }
    };

    void fetchTransactions();
  }, [
    currentTransactionPage,
    currentView,
    isHydrated,
    navigate,
    selectedTransactionStatus,
    transactionUrlSearchTerm,
    user,
  ]);

  if (!isHydrated) {
    return (
      <div className="min-h-screen bg-muted/30 px-6 pt-28 pb-10 lg:px-20">
        <Card className="mx-auto w-full max-w-5xl border-border shadow-sm">
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">
              Loading dashboard...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const isAllowedRole = ["ORGANIZER", "ADMIN"].includes(user.role);
  const hasEventSearchTerm = eventSearchTerm.trim().length > 0;
  const hasTransactionSearchTerm = transactionSearchTerm.trim().length > 0;

  if (!isAllowedRole) {
    return null;
  }

  const hasActiveEventFilters =
    hasEventSearchTerm ||
    selectedEventStatus !== ALL_STATUS ||
    selectedCategoryId !== ALL_CATEGORY;
  const hasActiveTransactionFilters =
    hasTransactionSearchTerm ||
    selectedTransactionStatus !== ALL_TRANSACTION_STATUS;
  const eventPaginationItems = buildPaginationItems(
    currentEventPage,
    eventPaginationMeta.totalPages,
  );
  const transactionPaginationItems = buildPaginationItems(
    currentTransactionPage,
    transactionPaginationMeta.totalPages,
  );
  const hasMultipleEventPages = eventPaginationMeta.totalPages > 1;
  const hasMultipleTransactionPages = transactionPaginationMeta.totalPages > 1;
  const reloadTransactions = async () => {
    const transactionsResponse = await getOrganizerTransactions({
      page: currentTransactionPage,
      limit: PAGE_SIZE,
      eventNameLike: transactionUrlSearchTerm || undefined,
      status:
        selectedTransactionStatus === ALL_TRANSACTION_STATUS
          ? undefined
          : (selectedTransactionStatus as TransactionStatus),
    });

    const pendingReviewResponse = await getOrganizerTransactions({
      page: 1,
      limit: 1,
      status: "WAITING_FOR_ADMIN_CONFIRMATION",
    });

    setTransactions(transactionsResponse.data ?? []);
    setTransactionPaginationMeta(transactionsResponse.meta);
    setPendingReviewTotal(pendingReviewResponse.meta.total);
  };

  return (
    <div className="min-h-screen bg-muted/30 px-6 pt-28 pb-10 lg:px-20">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <Card className="w-full overflow-hidden border-border bg-card shadow-sm">
          <CardContent className="flex flex-col gap-4 p-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div className="space-y-2">
                <h1 className="text-4xl font-semibold tracking-tight text-foreground">
                  Event Dashboard
                </h1>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <div className="flex rounded-2xl border border-border/70 bg-muted/20 p-1">
                  <button
                    type="button"
                    onClick={() => setCurrentView("events")}
                    className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
                      currentView === "events"
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Event list
                  </button>
                  <button
                    type="button"
                    onClick={() => setCurrentView("transactions")}
                    className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
                      currentView === "transactions"
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Transaction list
                  </button>
                </div>
              </div>
            </div>

            {currentView === "events" ? (
              <div className="flex flex-col gap-3 md:flex-row">
                <StatCard
                  icon={<CalendarDaysIcon className="h-4 w-4" />}
                  label="Total event"
                  value={String(eventPaginationMeta.total)}
                />
                <StatCard
                  icon={<MapPinIcon className="h-4 w-4" />}
                  label="Published event"
                  value={String(publishedEventTotal)}
                />
              </div>
            ) : (
              <div className="flex flex-col gap-3 md:flex-row">
                <StatCard
                  icon={<ListChecksIcon className="h-4 w-4" />}
                  label="Total transaction"
                  value={String(transactionPaginationMeta.total)}
                />
                <StatCard
                  icon={<ClipboardCheckIcon className="h-4 w-4" />}
                  label="Need review"
                  value={String(pendingReviewTotal)}
                />
              </div>
            )}
          </CardContent>
        </Card>

        {currentView === "events" ? (
          <Card className="border-border bg-card shadow-sm">
            <CardContent className="flex flex-col gap-5 p-6">
              <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                <div className="space-y-1">
                  <h2 className="text-lg font-semibold text-foreground">
                    Event list
                  </h2>
                </div>

                <div className="flex flex-col gap-3 md:flex-row">
                  <div className="flex w-full flex-col gap-2 md:w-72">
                    <span className="text-sm font-medium text-foreground">
                      Search
                    </span>
                    <div className="relative">
                      <SearchIcon className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        value={eventSearchTerm}
                        onChange={(event) =>
                          setEventSearchTerm(event.target.value)
                        }
                        placeholder="Search event name"
                        className="h-8 bg-background pl-9"
                      />
                    </div>
                  </div>

                  <div className="flex w-full flex-col gap-2 md:w-52">
                    <span className="text-sm font-medium text-foreground">
                      Status
                    </span>
                    <Select
                      value={selectedEventStatus}
                      onValueChange={(value) =>
                        updateSearchParams({
                          status: value === ALL_STATUS ? null : value,
                          page: null,
                        })
                      }
                      disabled={isLoadingEvents}
                    >
                      <SelectTrigger className="h-10 w-full bg-background">
                        <SelectValue placeholder="All statuses" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={ALL_STATUS}>All statuses</SelectItem>
                        {eventStatusOptions.map((status) => (
                          <SelectItem key={status.value} value={status.value}>
                            {status.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex w-full flex-col gap-2 md:w-56">
                    <span className="text-sm font-medium text-foreground">
                      Category
                    </span>
                    <Select
                      value={selectedCategoryId}
                      onValueChange={(value) =>
                        updateSearchParams({
                          categoryId: value === ALL_CATEGORY ? null : value,
                          page: null,
                        })
                      }
                      disabled={isLoadingFilters || isLoadingEvents}
                    >
                      <SelectTrigger className="h-10 w-full bg-background">
                        <SelectValue placeholder="All categories" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={ALL_CATEGORY}>
                          All categories
                        </SelectItem>
                        {categories.map((category) => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {hasActiveEventFilters ? (
                    <div className="flex items-end">
                      <Button
                        type="button"
                        variant="outline"
                        className="h-8"
                        onClick={() => {
                          setEventSearchTerm("");
                          pendingEventSearchParamRef.current = "";
                          setSearchParams(
                            createSearchParamsWithUpdates(searchParams, {
                              nameLike: null,
                              status: null,
                              categoryId: null,
                              page: null,
                            }),
                          );
                        }}
                      >
                        Reset filters
                      </Button>
                    </div>
                  ) : null}
                </div>
              </div>

              {isLoadingEvents ? (
                <div className="flex items-center gap-3 py-8 text-sm text-muted-foreground">
                  <Spinner className="h-4 w-4" />
                  Loading your events...
                </div>
              ) : eventErrorMessage ? (
                <div className="flex flex-col gap-3 py-6">
                  <h3 className="text-lg font-semibold text-foreground">
                    We couldn't load your events
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {eventErrorMessage}
                  </p>
                </div>
              ) : events.length === 0 ? (
                <div className="flex flex-col gap-4 py-6">
                  <div className="space-y-1">
                    <h3 className="text-lg font-semibold text-foreground">
                      {hasActiveEventFilters
                        ? "No matching events"
                        : "No events yet"}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {hasActiveEventFilters
                        ? "Try a different event name, status, or category filter to see more results."
                        : "Create your first event to start managing banner, schedule, and event status from this dashboard."}
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="px-6 py-4">Event</TableHead>
                        <TableHead className="py-4">Schedule</TableHead>
                        <TableHead className="py-4">Venue</TableHead>
                        <TableHead className="py-4">Status</TableHead>
                        <TableHead className="py-4">Details</TableHead>
                        <TableHead className="px-6 py-4 text-right">
                          Action
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {events.map((event) => (
                        <TableRow key={event.id}>
                          <TableCell className="px-6 py-4">
                            <div className="flex max-w-56 flex-col gap-1">
                              <p
                                title={event.name}
                                className="truncate font-medium text-foreground"
                              >
                                {event.name}
                              </p>
                              <p
                                title={event.slug}
                                className="truncate text-xs text-muted-foreground"
                              >
                                {event.slug}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell className="py-4">
                            <div className="flex max-w-44 flex-col gap-1 text-sm">
                              <span
                                title={formatDateTime(event.startAt)}
                                className="truncate text-foreground"
                              >
                                {formatDateTime(event.startAt)}
                              </span>
                              <span
                                title={`Ends ${formatDateTime(event.endAt)}`}
                                className="truncate text-muted-foreground"
                              >
                                Ends {formatDateTime(event.endAt)}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="py-4">
                            <div className="flex max-w-56 flex-col gap-1 text-sm">
                              <span
                                title={event.venue}
                                className="flex items-center gap-2 truncate text-foreground"
                              >
                                <MapPinIcon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                                <span className="truncate">{event.venue}</span>
                              </span>
                              <span
                                title={event.address}
                                className="truncate text-muted-foreground"
                              >
                                {event.address}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="py-4">
                            <Badge variant={getStatusVariant(event.status)}>
                              {event.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="py-4">
                            <Button asChild size="sm" variant="outline">
                              <Link
                                to={`/dashboard/events/${event.slug || event.id}`}
                              >
                                Open details
                              </Link>
                            </Button>
                          </TableCell>
                          <TableCell className="px-6 py-4 text-right">
                            <Button asChild size="sm">
                              <Link to={`/event/update/${event.id}`}>
                                Update Event
                              </Link>
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>

                  <ListPagination
                    currentPage={currentEventPage}
                    totalPages={eventPaginationMeta.totalPages}
                    hasMultiplePages={hasMultipleEventPages}
                    items={eventPaginationItems}
                    onPageChange={setEventPage}
                  />
                </>
              )}
            </CardContent>
          </Card>
        ) : (
          <>
            <OrganizerRevenueChart
              organizerId={user.role === "ADMIN" ? undefined : user.id}
            />

            <Card className="border-border bg-card shadow-sm">
              <CardContent className="flex flex-col gap-5 p-6">
                <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                  <div className="space-y-1">
                    <h2 className="text-lg font-semibold text-foreground">
                      Transaction list
                    </h2>
                  </div>

                  <div className="flex flex-col gap-3 md:flex-row">
                    <div className="flex w-full flex-col gap-2 md:w-72">
                      <span className="text-sm font-medium text-foreground">
                        Search
                      </span>
                      <div className="relative">
                        <SearchIcon className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          value={transactionSearchTerm}
                          onChange={(event) =>
                            setTransactionSearchTerm(event.target.value)
                          }
                          placeholder="Search event name"
                          className="h-8 bg-background pl-9"
                        />
                      </div>
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

                    {hasActiveTransactionFilters ? (
                      <div className="flex items-end">
                        <Button
                          type="button"
                          variant="outline"
                          className="h-8"
                          onClick={() => {
                            setTransactionSearchTerm("");
                            pendingTransactionSearchParamRef.current = "";
                            setSearchParams(
                              createSearchParamsWithUpdates(searchParams, {
                                transactionEventNameLike: null,
                                transactionStatus: null,
                                transactionPage: null,
                              }),
                            );
                          }}
                        >
                          Reset filters
                        </Button>
                      </div>
                    ) : null}
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
                    onPageChange={setTransactionPage}
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

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex w-full items-start gap-3 rounded-2xl border border-border/70 bg-muted/20 p-4">
      <div className="rounded-full bg-primary/10 p-2 text-primary">{icon}</div>
      <div className="flex flex-col gap-1">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="text-2xl font-semibold text-foreground">{value}</p>
      </div>
    </div>
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
