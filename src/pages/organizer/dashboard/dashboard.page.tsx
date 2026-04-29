import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import axios from "axios";
import {
  CalendarDaysIcon,
  MapPinIcon,
  PlusIcon,
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

const statusOptions: Array<{
  label: string;
  value: EventStatus;
}> = [
  { label: "Draft", value: "DRAFT" },
  { label: "Published", value: "PUBLISHED" },
  { label: "Canceled", value: "CANCELED" },
  { label: "Completed", value: "COMPLETED" },
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

function getStatusFromSearchParams(value: string | null) {
  if (
    value &&
    statusOptions.some((statusOption) => statusOption.value === value)
  ) {
    return value as EventStatus;
  }

  return ALL_STATUS;
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
  const [events, setEvents] = useState<IEvent[]>([]);
  const [categories, setCategories] = useState<ICategory[]>([]);
  const [isLoadingEvents, setIsLoadingEvents] = useState(true);
  const [isLoadingFilters, setIsLoadingFilters] = useState(true);
  const [publishedEventTotal, setPublishedEventTotal] = useState(0);
  const urlSearchTerm = searchParams.get("nameLike") ?? "";
  const selectedStatus = getStatusFromSearchParams(searchParams.get("status"));
  const selectedCategoryId =
    searchParams.get("categoryId")?.trim() || ALL_CATEGORY;
  const currentPage = getPageFromSearchParams(searchParams.get("page"));
  const [searchTerm, setSearchTerm] = useState(urlSearchTerm);
  const [paginationMeta, setPaginationMeta] = useState<
    IPaginatedResponse<IEvent[]>["meta"]
  >({
    page: 1,
    limit: PAGE_SIZE,
    total: 0,
    totalPages: 1,
  });
  const debouncedSearchTerm = useDebounce(searchTerm.trim(), 500);
  const pendingSearchParamRef = useRef<string | null>(null);

  const updateSearchParams = (updates: Record<string, string | null>) => {
    setSearchParams(createSearchParamsWithUpdates(searchParams, updates));
  };

  const setPage = (page: number) => {
    updateSearchParams({
      page: page <= 1 ? null : String(page),
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
    if (debouncedSearchTerm === urlSearchTerm) {
      return;
    }

    pendingSearchParamRef.current = debouncedSearchTerm;

    setSearchParams(
      createSearchParamsWithUpdates(searchParams, {
        nameLike: debouncedSearchTerm || null,
        page: null,
      }),
    );
  }, [debouncedSearchTerm, urlSearchTerm, searchParams, setSearchParams]);

  useEffect(() => {
    if (pendingSearchParamRef.current === urlSearchTerm) {
      pendingSearchParamRef.current = null;
      return;
    }

    setSearchTerm(urlSearchTerm);
  }, [urlSearchTerm]);

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

    const fetchEvents = async () => {
      try {
        setIsLoadingEvents(true);

        const [eventsResponse, publishedResponse] = await Promise.all([
          getEvents({
            organizerId: user.id,
            page: currentPage,
            limit: PAGE_SIZE,
            nameLike: urlSearchTerm || undefined,
            status:
              selectedStatus === ALL_STATUS
                ? undefined
                : (selectedStatus as EventStatus),
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
        setPaginationMeta(eventsResponse.meta);
        setPublishedEventTotal(publishedResponse.meta.total);
      } catch (error) {
        if (axios.isAxiosError(error)) {
          toast.error(error.response?.data?.message ?? "Failed to load events");
        } else {
          toast.error("Failed to load events");
        }
      } finally {
        setIsLoadingEvents(false);
      }
    };

    void fetchEvents();
  }, [
    currentPage,
    isHydrated,
    navigate,
    selectedCategoryId,
    selectedStatus,
    urlSearchTerm,
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
  const hasSearchTerm = searchTerm.trim().length > 0;

  if (!isAllowedRole) {
    return null;
  }

  const hasActiveFilters =
    hasSearchTerm ||
    selectedStatus !== ALL_STATUS ||
    selectedCategoryId !== ALL_CATEGORY;
  const paginationItems = buildPaginationItems(
    currentPage,
    paginationMeta.totalPages,
  );
  const hasMultiplePages = paginationMeta.totalPages > 1;

  return (
    <div className="min-h-screen bg-muted/30 px-6 pt-28 pb-10 lg:px-20">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <Card className="w-full overflow-hidden border-border bg-card shadow-sm">
          <CardContent className="flex flex-col gap-4 p-6">
            <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div className="space-y-2">
                <h1 className="text-4xl font-semibold tracking-tight text-foreground">
                  Event Dashboard
                </h1>
                <p className="text-sm leading-6 text-foreground/75">
                  Track the events you own, filter what matters, and jump
                  straight into updates when details change.
                </p>
              </div>

              <Button type="button" onClick={() => navigate("/event/create")}>
                <PlusIcon className="h-4 w-4" />
                Create Event
              </Button>
            </div>

            <div className="flex flex-col gap-3 md:flex-row">
              <div className="flex w-full items-start gap-3 rounded-2xl border border-border/70 bg-muted/20 p-4">
                <div className="rounded-full bg-primary/10 p-2 text-primary">
                  <CalendarDaysIcon className="h-4 w-4" />
                </div>
                <div className="flex flex-col gap-1">
                  <p className="text-sm text-muted-foreground">Total event</p>
                  <p className="text-2xl font-semibold text-foreground">
                    {paginationMeta.total}
                  </p>
                </div>
              </div>

              <div className="flex w-full items-start gap-3 rounded-2xl border border-border/70 bg-muted/20 p-4">
                <div className="rounded-full bg-primary/10 p-2 text-primary">
                  <MapPinIcon className="h-4 w-4" />
                </div>
                <div className="flex flex-col gap-1">
                  <p className="text-sm text-muted-foreground">
                    Published event
                  </p>
                  <p className="text-2xl font-semibold text-foreground">
                    {publishedEventTotal}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

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
                      value={searchTerm}
                      onChange={(event) => setSearchTerm(event.target.value)}
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
                    value={selectedStatus}
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
                      {statusOptions.map((status) => (
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

                {hasActiveFilters ? (
                  <div className="flex items-end">
                    <Button
                      type="button"
                      variant="outline"
                      className="h-8"
                      onClick={() => {
                        setSearchTerm("");
                        pendingSearchParamRef.current = "";
                        setSearchParams(new URLSearchParams());
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
            ) : events.length === 0 ? (
              <div className="flex flex-col gap-4 py-6">
                <div className="space-y-1">
                  <h3 className="text-lg font-semibold text-foreground">
                    {hasActiveFilters ? "No matching events" : "No events yet"}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {hasActiveFilters
                      ? "Try a different event name, status, or category filter to see more results."
                      : "Create your first event to start managing banner, schedule, and event status from this dashboard."}
                  </p>
                </div>

                {!hasActiveFilters ? (
                  <div>
                    <Button
                      type="button"
                      onClick={() => navigate("/event/create")}
                    >
                      <PlusIcon className="h-4 w-4" />
                      Create Event
                    </Button>
                  </div>
                ) : null}
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
                      <TableHead className="py-4">Updated</TableHead>
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
                        <TableCell className="py-4 text-sm text-muted-foreground">
                          <span
                            title={formatDateTime(event.updatedAt)}
                            className="block max-w-36 truncate"
                          >
                            {formatDateTime(event.updatedAt)}
                          </span>
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

                <div className="flex flex-col gap-3 border-t border-border/70 pt-4 md:flex-row md:items-center md:justify-between">
                  <p className="text-sm text-muted-foreground">
                    Page {currentPage} of {paginationMeta.totalPages}
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

                              setPage(1);
                            }}
                            className={
                              currentPage === 1
                                ? "pointer-events-none opacity-50"
                                : ""
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

                              setPage(currentPage - 1);
                            }}
                            className={
                              currentPage === 1
                                ? "pointer-events-none opacity-50"
                                : ""
                            }
                          />
                        </PaginationItem>
                      ) : null}

                      {(hasMultiplePages ? paginationItems : [1]).map(
                        (item, index) =>
                          typeof item === "number" ? (
                            <PaginationItem key={item}>
                              <PaginationLink
                                href="#"
                                isActive={currentPage === item}
                                onClick={(event) => {
                                  event.preventDefault();
                                  setPage(item);
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

                              if (currentPage === paginationMeta.totalPages) {
                                return;
                              }

                              setPage(currentPage + 1);
                            }}
                            className={
                              currentPage === paginationMeta.totalPages
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

                              if (currentPage === paginationMeta.totalPages) {
                                return;
                              }

                              setPage(paginationMeta.totalPages);
                            }}
                            className={
                              currentPage === paginationMeta.totalPages
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
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
