import { useEffect, useRef, useState } from "react";
import {
  ArrowRightIcon,
  CalendarDaysIcon,
  MapPinIcon,
  SearchIcon,
  TicketIcon,
  XIcon,
} from "lucide-react";
import { Link, useSearchParams } from "react-router";
import { getEvents } from "@/api/event/event.api";
import type {
  IEvent,
  IPaginatedResponse,
  ITicketType,
} from "@/api/event/event.interface";
import { Badge } from "@/components/ui/badge";
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
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";
import { useDebounce } from "@/hook/useDebounce";
import {
  formatRupiah,
  formatTransactionDateTime,
  isEventPurchasable,
} from "@/pages/transaction/transaction.utils";

const PAGE_SIZE = 9;

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

export default function HomePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [events, setEvents] = useState<IEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [paginationMeta, setPaginationMeta] = useState<
    IPaginatedResponse<IEvent[]>["meta"]
  >({
    page: 1,
    limit: PAGE_SIZE,
    total: 0,
    totalPages: 1,
  });

  const urlSearchTerm = searchParams.get("nameLike") ?? "";
  const currentPage = getPageFromSearchParams(searchParams.get("page"));
  const [searchTerm, setSearchTerm] = useState(urlSearchTerm);
  const debouncedSearchTerm = useDebounce(searchTerm.trim(), 400);
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
    let isCancelled = false;

    const loadEvents = async () => {
      try {
        setIsLoading(true);
        setErrorMessage(null);
        const response = await getEvents({
          status: "PUBLISHED",
          nameLike: urlSearchTerm || undefined,
          page: currentPage,
          limit: PAGE_SIZE,
          sortBy: "startAt",
          sortOrder: "asc",
        });

        if (isCancelled) {
          return;
        }

        setEvents(response.data ?? []);
        setPaginationMeta(response.meta);
      } catch {
        if (!isCancelled) {
          setErrorMessage("We couldn't load published matches right now.");
          setEvents([]);
          setPaginationMeta((currentMeta) => ({
            ...currentMeta,
            page: currentPage,
            total: 0,
            totalPages: 1,
          }));
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    };

    void loadEvents();

    return () => {
      isCancelled = true;
    };
  }, [currentPage, urlSearchTerm]);

  const hasActiveSearch = urlSearchTerm.trim().length > 0;
  const paginationItems = buildPaginationItems(
    currentPage,
    paginationMeta.totalPages,
  );
  const hasMultiplePages = paginationMeta.totalPages > 1;

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(210,82,32,0.14),_transparent_30%),linear-gradient(180deg,_rgba(245,247,244,1)_0%,_rgba(236,241,236,1)_100%)] px-6 pt-28 pb-12 lg:px-16">
      <div className="mx-auto flex max-w-7xl flex-col gap-8 lg:gap-10">
        <section className="overflow-hidden rounded-[2rem] border border-border/70 bg-linear-to-br from-accent via-chart-4 to-primary px-6 py-8 text-primary-foreground shadow-2xl shadow-primary/15 md:px-10 md:py-12 lg:px-12 lg:py-14">
          <div className="mx-auto flex max-w-5xl flex-col items-center gap-6 text-center lg:gap-8">
            <Badge className="border-white/20 bg-white/12 px-3 py-1 text-primary-foreground hover:bg-white/12">
              Live football tickets
            </Badge>

            <div className="space-y-4">
              <h1 className="text-4xl font-semibold tracking-tight text-primary-foreground md:text-6xl">
                Where Football Lives
              </h1>
              <p className="mx-auto max-w-2xl text-sm leading-7 text-primary-foreground/80 md:text-base">
                Discover live matches, compare ticket tiers, then continue to a
                focused transaction step when you're ready to pay.
              </p>
            </div>

            <div className="w-full max-w-4xl rounded-[1.75rem] border border-white/15 bg-white/92 p-2 shadow-xl shadow-black/10 backdrop-blur">
              <div className="flex items-center gap-3 rounded-[1.25rem] bg-card px-4 py-3 md:px-5">
                <SearchIcon className="h-5 w-5 shrink-0 text-muted-foreground" />
                <Input
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="What do you want to see live?"
                  className="h-12 border-0 px-0 text-base text-foreground shadow-none ring-0 focus-visible:border-0 focus-visible:ring-0 md:text-lg"
                  aria-label="Search events"
                />
                {searchTerm ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-10 w-10 rounded-full text-muted-foreground"
                    onClick={() => setSearchTerm("")}
                  >
                    <XIcon className="h-4 w-4" />
                    <span className="sr-only">Clear search</span>
                  </Button>
                ) : null}
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3 text-sm text-primary-foreground/75 lg:gap-4">
              <span>Search by match name.</span>
              <span className="hidden h-1.5 w-1.5 rounded-full bg-white/35 sm:block" />
              <span>Preview the event first.</span>
              <span className="hidden h-1.5 w-1.5 rounded-full bg-white/35 sm:block" />
              <span>Finish payment on a dedicated transaction page.</span>
            </div>
          </div>
        </section>

        <section className="space-y-6 lg:space-y-7">
          {hasActiveSearch ? (
            <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-border/70 bg-card/80 px-4 py-3 shadow-sm">
              <Badge variant="secondary">
                {isLoading
                  ? "Searching..."
                  : `${paginationMeta.total} result(s)`}
              </Badge>
              <p className="text-sm text-muted-foreground">
                Showing matches for "{urlSearchTerm.trim()}".
              </p>
              <Button
                type="button"
                variant="ghost"
                className="h-8 rounded-full px-3 text-sm"
                onClick={() => {
                  setSearchTerm("");
                  pendingSearchParamRef.current = "";
                  setSearchParams(new URLSearchParams());
                }}
              >
                Clear search
              </Button>
            </div>
          ) : null}

          {isLoading ? (
            <div className="flex items-center gap-3 rounded-2xl border border-border bg-card px-5 py-4 shadow-sm">
              <Spinner />
              <p className="text-sm text-muted-foreground">
                Loading published events...
              </p>
            </div>
          ) : null}

          {!isLoading && errorMessage ? (
            <Card className="border-destructive/20 bg-destructive/5 shadow-none">
              <CardContent className="py-5 text-sm text-destructive">
                {errorMessage}
              </CardContent>
            </Card>
          ) : null}

          {!isLoading && !errorMessage && events.length === 0 ? (
            <Card className="border-dashed border-border/80 bg-card shadow-none">
              <CardContent className="py-10 text-center">
                <p className="text-lg font-semibold">
                  {hasActiveSearch
                    ? "No matches found for that search"
                    : "No published matches yet"}
                </p>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">
                  {hasActiveSearch
                    ? "Try another match name and we'll keep the list updated."
                    : "Once events are published, customers can start their purchase flow from here."}
                </p>
              </CardContent>
            </Card>
          ) : null}

          {!isLoading && !errorMessage && events.length > 0 ? (
            <>
              <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                {events.map((event) => {
                  const availableTicketTypes = (event.ticketTypes ?? []).filter(
                    (ticketType) => ticketType.isActive !== false,
                  );
                  const cheapestTicketType =
                    getCheapestTicketType(availableTicketTypes);
                  const eventHref = `/event/${event.slug || event.id}`;
                  const isPurchasable = isEventPurchasable(event);
                  const isSoldOut = !cheapestTicketType;
                  const canBuy = isPurchasable && !isSoldOut;

                  return (
                    <Card
                      key={event.id}
                      className="h-full gap-0 border-border/80 bg-card pt-0 shadow-md shadow-primary/5 transition-transform duration-200 hover:-translate-y-1"
                    >
                      <EventBanner
                        src={event.bannerUrl}
                        alt={event.name}
                        placeholder="Match artwork unavailable"
                        width={960}
                        height={540}
                      />

                      <div className="flex flex-1 flex-col">
                        <CardHeader className="gap-4 px-5 pt-5 pb-0">
                          <div className="flex items-center justify-between gap-3">
                            <Badge variant={canBuy ? "secondary" : "outline"}>
                              {canBuy
                                ? "Tickets available"
                                : isSoldOut
                                  ? "Sold out"
                                  : "Purchase closed"}
                            </Badge>
                            <p className="text-xs font-medium text-muted-foreground">
                              {availableTicketTypes.length} ticket type
                              {availableTicketTypes.length === 1 ? "" : "s"}
                            </p>
                          </div>

                          <div className="min-w-0 space-y-2">
                            <CardTitle className="line-clamp-2 break-words text-[1.75rem] leading-tight font-semibold">
                              {event.name}
                            </CardTitle>
                            <CardDescription className="line-clamp-2 break-words text-sm leading-6">
                              {event.description}
                            </CardDescription>
                          </div>
                        </CardHeader>

                        <CardContent className="flex flex-1 flex-col px-5 pt-5 pb-5">
                          <div className="space-y-3.5">
                            <p className="flex items-start gap-3 text-sm text-muted-foreground">
                              <MapPinIcon className="mt-0.5 h-4 w-4 shrink-0" />
                              <span className="min-w-0 line-clamp-2 break-words leading-6">
                                {event.venue}
                              </span>
                            </p>
                            <p className="flex items-start gap-3 text-sm text-muted-foreground">
                              <CalendarDaysIcon className="mt-0.5 h-4 w-4 shrink-0" />
                              <span className="leading-6">
                                {formatTransactionDateTime(event.startAt)}
                              </span>
                            </p>
                            <p className="flex items-start gap-3 text-sm text-muted-foreground">
                              <TicketIcon className="mt-0.5 h-4 w-4 shrink-0" />
                              <span className="leading-6">
                                {cheapestTicketType
                                  ? `From ${formatRupiah(cheapestTicketType.price)}`
                                  : "No active ticket type available"}
                              </span>
                            </p>
                          </div>
                        </CardContent>
                      </div>

                      <Separator />

                      <CardFooter className="mt-auto min-h-[4.75rem] justify-start border-t-0 bg-transparent px-5 py-4">
                        <Button
                          asChild
                          variant={canBuy ? "default" : "outline"}
                          className="h-10 rounded-full px-5"
                        >
                          <Link to={eventHref}>
                            {canBuy ? "Choose ticket" : "View event"}
                            <ArrowRightIcon className="ml-2 h-4 w-4" />
                          </Link>
                        </Button>
                      </CardFooter>
                    </Card>
                  );
                })}
              </div>

              <div className="flex flex-col gap-3 border-t border-border/70 pt-5 md:flex-row md:items-center md:justify-between">
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
          ) : null}
        </section>
      </div>
    </div>
  );
}

function getCheapestTicketType(ticketTypes: ITicketType[]) {
  if (ticketTypes.length === 0) {
    return null;
  }

  return ticketTypes.reduce<ITicketType | null>((cheapest, ticketType) => {
    if (ticketType.isSoldOut) {
      return cheapest;
    }

    if (!cheapest || ticketType.price < cheapest.price) {
      return ticketType;
    }

    return cheapest;
  }, null);
}
