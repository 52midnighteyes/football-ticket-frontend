import { useEffect, useState } from "react";
import { Link } from "react-router";
import {
  CalendarDaysIcon,
  CopyIcon,
  MapPinIcon,
  MailIcon,
  QrCodeIcon,
  RefreshCcwIcon,
  ShieldCheckIcon,
  SparklesIcon,
  TicketIcon,
} from "lucide-react";
import { getMyAvailablePoints } from "@/api/transaction/transaction.api";
import { getTickets } from "@/api/ticket/ticket.api";
import type { ITicket } from "@/api/ticket/ticket.interface";
import { getEventById } from "@/api/event/event.api";
import type { IEvent } from "@/api/event/event.interface";
import { avatarFallback } from "@/components/navbar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import EventBanner from "@/components/event-banner";
import type { IUserParams } from "@/store/auth.store";
import { useAuthStore } from "@/store/auth.store";
import InfoRow from "./info-row";
import { meApi, resendVerificationEmailApi } from "@/api/auth/auth.api";
import ChangeAvatar from "./change-avatar";
import ChangePassword from "./change-password";
import { toast } from "sonner";
import { formatTransactionDateTime } from "@/pages/transaction/transaction.utils";

interface ProfileCardProps {
  user: IUserParams;
}

export default function ProfileCard({ user }: ProfileCardProps) {
  const [isResendingVerification, setIsResendingVerification] = useState(false);
  const [availablePoints, setAvailablePoints] = useState<number | null>(
    typeof user.points === "number" ? user.points : null,
  );
  const [tickets, setTickets] = useState<ITicket[]>([]);
  const [isLoadingTickets, setIsLoadingTickets] = useState(false);
  const [ticketErrorMessage, setTicketErrorMessage] = useState<string | null>(
    null,
  );
  const fullName = `${user.firstName} ${user.lastName}`;
  const initials = `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`;
  const roleLabel = user.role;
  const setUser = useAuthStore((state) => state.setUser);
  const referralCode = user.referralCode?.trim() || null;

  useEffect(() => {
    const loadProfileContext = async () => {
      try {
        const profileResponse = await meApi();
        if (!profileResponse.data) {
          throw new Error("Failed to fetch user profile");
        }

        setUser(profileResponse.data);

        if (profileResponse.data.role !== "CUSTOMER") {
          return;
        }

        const [pointsResponse, ticketsResponse] = await Promise.all([
          getMyAvailablePoints(),
          getTickets({
            page: 1,
            limit: 8,
            sortBy: "createdAt",
            sortOrder: "desc",
          }),
        ]);

        setAvailablePoints(pointsResponse.data?.totalAvailablePoints ?? 0);
        setTickets(ticketsResponse.data ?? []);
      } catch (error) {
        console.error(error);
      }
    };

    void loadProfileContext();
  }, [setUser]);

  useEffect(() => {
    if (user.role !== "CUSTOMER") {
      return;
    }

    const loadTickets = async () => {
      try {
        setIsLoadingTickets(true);
        setTicketErrorMessage(null);

        const response = await getTickets({
          page: 1,
          limit: 8,
          sortBy: "createdAt",
          sortOrder: "desc",
        });

        setTickets(response.data ?? []);
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "Failed to load your tickets";
        setTicketErrorMessage(message);
      } finally {
        setIsLoadingTickets(false);
      }
    };

    void loadTickets();
  }, [user.role]);

  const handleResendVerificationEmail = async () => {
    try {
      setIsResendingVerification(true);
      const response = await resendVerificationEmailApi();
      toast.success(response.message);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to resend verification email";
      toast.error(message);
    } finally {
      setIsResendingVerification(false);
    }
  };

  const handleCopyReferralCode = async () => {
    if (!referralCode) {
      return;
    }

    try {
      await navigator.clipboard.writeText(referralCode);
      toast.success("Referral code copied");
    } catch {
      toast.error("Failed to copy referral code");
    }
  };

  return (
    <div className="grid min-w-0 gap-6 xl:grid-cols-[minmax(0,1.15fr)_320px]">
      <div className="min-w-0 space-y-6">
        <Card className="overflow-hidden border-border/80 bg-card pt-0 shadow-lg shadow-primary/5">
          <CardHeader className="gap-6 rounded-none  py-7">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
              <div className="flex min-w-0 flex-col gap-5 sm:flex-row sm:items-center">
                <div className="flex size-22 shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/70 bg-card text-xl font-semibold text-primary shadow-sm">
                  {user.avatarUrl ? (
                    <img
                      src={user.avatarUrl || avatarFallback}
                      alt={`${fullName} profile picture`}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    initials
                  )}
                </div>

                <div className="min-w-0 space-y-3">
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary">{roleLabel}</Badge>
                    <Badge variant={user.isVerified ? "default" : "outline"}>
                      {user.isVerified ? "Verified" : "Unverified"}
                    </Badge>
                  </div>

                  <div className="space-y-1">
                    <CardTitle className="line-clamp-2 break-words text-3xl font-semibold tracking-tight">
                      {fullName}
                    </CardTitle>
                    <CardDescription className="flex items-center gap-2 break-words text-sm leading-6">
                      <MailIcon className="h-4 w-4 shrink-0" />
                      {user.email}
                    </CardDescription>
                  </div>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 lg:w-64 lg:grid-cols-1">
                {user.role === "CUSTOMER" ? (
                  <Button
                    asChild
                    variant="outline"
                    type="button"
                    className="h-10 justify-center"
                  >
                    <Link to="/transactions">View Transactions</Link>
                  </Button>
                ) : null}
                {!user.isVerified ? (
                  <Button
                    variant="secondary"
                    type="button"
                    className="h-10 justify-center"
                    disabled={isResendingVerification}
                    onClick={handleResendVerificationEmail}
                  >
                    {isResendingVerification
                      ? "Sending..."
                      : "Resend Verification Email"}
                  </Button>
                ) : null}
                <ChangeAvatar />
                <ChangePassword />
              </div>
            </div>
          </CardHeader>
        </Card>

        <div className="grid min-w-0 gap-6 lg:grid-cols-2">
          <SectionCard
            title="Account details"
            description="Core identity and session details for this account."
            icon={<ShieldCheckIcon className="h-4 w-4" />}
          >
            <div className="grid gap-3 sm:grid-cols-2">
              <InfoRow label="First name" value={user.firstName} />
              <InfoRow label="Last name" value={user.lastName} />
              <InfoRow
                label="Email"
                value={user.email}
                className="sm:col-span-2"
              />
              <InfoRow label="Role" value={roleLabel} />
              <InfoRow
                label="Verification"
                value={
                  user.isVerified ? "Email verified" : "Email not verified"
                }
              />
            </div>
          </SectionCard>

          <SectionCard
            title={
              user.role === "CUSTOMER" ? "Customer extras" : "Account perks"
            }
            description={
              user.role === "CUSTOMER"
                ? "Referral and loyalty information that supports repeat purchases."
                : "Useful account metadata for managing your organizer workspace."
            }
            icon={<SparklesIcon className="h-4 w-4" />}
          >
            <div className="grid gap-3">
              {referralCode ? (
                <InfoRow
                  label="Referral code"
                  value={
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <span className="font-mono text-base tracking-[0.16em] text-primary">
                        {referralCode}
                      </span>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="w-full sm:w-auto"
                        onClick={() => void handleCopyReferralCode()}
                      >
                        <CopyIcon className="mr-2 h-4 w-4" />
                        Copy code
                      </Button>
                    </div>
                  }
                />
              ) : (
                <InfoRow
                  label="Referral code"
                  value="No referral code available for this account yet."
                />
              )}

              {typeof availablePoints === "number" ? (
                <InfoRow
                  label="Available points"
                  value={`${new Intl.NumberFormat("id-ID").format(availablePoints)} pts`}
                />
              ) : (
                <InfoRow
                  label="Available points"
                  value="Points are only shown for customer accounts."
                />
              )}
            </div>
          </SectionCard>
        </div>

        {user.role === "CUSTOMER" ? (
          <SectionCard
            title="My tickets"
            description="A quick view of the tickets you already own."
            icon={<TicketIcon className="h-4 w-4" />}
          >
            <CustomerTicketsTable
              tickets={tickets}
              isLoading={isLoadingTickets}
              errorMessage={ticketErrorMessage}
              onRetry={async () => {
                try {
                  setIsLoadingTickets(true);
                  setTicketErrorMessage(null);
                  const response = await getTickets({
                    page: 1,
                    limit: 8,
                    sortBy: "createdAt",
                    sortOrder: "desc",
                  });
                  setTickets(response.data ?? []);
                } catch (error) {
                  const message =
                    error instanceof Error
                      ? error.message
                      : "Failed to load your tickets";
                  setTicketErrorMessage(message);
                } finally {
                  setIsLoadingTickets(false);
                }
              }}
            />
          </SectionCard>
        ) : null}
      </div>

      <div className="min-w-0 space-y-6 xl:sticky xl:top-28 xl:self-start">
        <SectionCard
          title="Quick actions"
          description="Common tasks for keeping your account current and secure."
          icon={<ShieldCheckIcon className="h-4 w-4" />}
        >
          <div className="grid gap-3">
            <ChangeAvatar />
            <ChangePassword />
            {user.role === "CUSTOMER" ? (
              <Button
                asChild
                variant="outline"
                type="button"
                className="justify-center"
              >
                <Link to="/transactions">View Transactions</Link>
              </Button>
            ) : (
              <Button
                asChild
                variant="outline"
                type="button"
                className="justify-center"
              >
                <Link to="/dashboard">Open Dashboard</Link>
              </Button>
            )}
            {!user.isVerified ? (
              <Button
                variant="secondary"
                type="button"
                className="justify-center"
                disabled={isResendingVerification}
                onClick={handleResendVerificationEmail}
              >
                {isResendingVerification
                  ? "Sending..."
                  : "Resend Verification Email"}
              </Button>
            ) : null}
          </div>
        </SectionCard>
      </div>
    </div>
  );
}

function CustomerTicketsTable({
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
      <div className="flex items-center gap-3 py-6 text-sm text-muted-foreground">
        <Spinner className="h-4 w-4" />
        Loading your tickets...
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div className="flex flex-col gap-3 rounded-2xl border border-destructive/20 bg-destructive/5 p-4">
        <p className="text-sm text-muted-foreground">{errorMessage}</p>
        <Button type="button" variant="outline" onClick={() => void onRetry()}>
          <RefreshCcwIcon className="mr-2 h-4 w-4" />
          Retry
        </Button>
      </div>
    );
  }

  if (tickets.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border/70 bg-muted/20 px-4 py-6 text-sm text-muted-foreground">
        You do not have any issued tickets yet.
      </div>
    );
  }

  return (
    <div className="min-w-0 overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="px-6 py-4">Event</TableHead>
            <TableHead className="py-4">Ticket</TableHead>
            <TableHead className="py-4">Code</TableHead>
            <TableHead className="py-4">Status</TableHead>
            <TableHead className="py-4">Issued</TableHead>
            <TableHead className="px-6 py-4 text-right">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tickets.map((ticket) => {
            const eventName =
              ticket.transaction?.event?.name ?? "Event unavailable";
            const eventStartAt = ticket.transaction?.event?.startAt;
            const ticketTypeName =
              ticket.transactionItem?.ticketType?.name ?? "Ticket";

            return (
              <TableRow key={ticket.id}>
                <TableCell className="px-6 py-4">
                  <div className="flex max-w-52 min-w-0 flex-col gap-1">
                    <p className="truncate font-medium text-foreground">
                      {eventName}
                    </p>
                    <p className="flex items-center gap-2 truncate text-xs text-muted-foreground">
                      <CalendarDaysIcon className="h-3.5 w-3.5 shrink-0" />
                      {eventStartAt
                        ? formatTransactionDateTime(eventStartAt)
                        : "Schedule unavailable"}
                    </p>
                  </div>
                </TableCell>
                <TableCell className="py-4 text-sm font-medium text-foreground">
                  {ticketTypeName}
                </TableCell>
                <TableCell className="py-4">
                  <span className="font-mono text-xs tracking-[0.14em] text-primary">
                    {ticket.code}
                  </span>
                </TableCell>
                <TableCell className="py-4">
                  <Badge variant={ticket.checkedInAt ? "default" : "outline"}>
                    {ticket.checkedInAt ? "Checked in" : "Not checked in"}
                  </Badge>
                </TableCell>
                <TableCell className="px-6 py-4 text-sm text-muted-foreground">
                  {formatTransactionDateTime(ticket.createdAt)}
                </TableCell>
                <TableCell className="px-6 py-4 text-right">
                  <ViewTicketDialog ticket={ticket} />
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

function ViewTicketDialog({ ticket }: { ticket: ITicket }) {
  const [open, setOpen] = useState(false);
  const [event, setEvent] = useState<IEvent | null>(null);
  const [isLoadingEvent, setIsLoadingEvent] = useState(false);

  const eventId = ticket.transaction?.event?.id;
  const eventName = ticket.transaction?.event?.name ?? "Event unavailable";
  const ticketTypeName = ticket.transactionItem?.ticketType?.name ?? "Ticket";

  useEffect(() => {
    if (!open || !eventId) {
      return;
    }

    let isMounted = true;

    const loadEvent = async () => {
      try {
        setIsLoadingEvent(true);
        const response = await getEventById(eventId);

        if (!isMounted) {
          return;
        }

        setEvent(response.data ?? null);
      } catch {
        if (!isMounted) {
          return;
        }

        setEvent(null);
      } finally {
        if (isMounted) {
          setIsLoadingEvent(false);
        }
      }
    };

    void loadEvent();

    return () => {
      isMounted = false;
    };
  }, [eventId, open]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button
        type="button"
        size="sm"
        variant="outline"
        onClick={() => setOpen(true)}
      >
        View Ticket
      </Button>

      <DialogContent className="w-[calc(100%-1rem)] max-w-md overflow-hidden p-0">
        <div className="flex max-h-[85vh] flex-col overflow-hidden rounded-xl bg-card">
          <EventBanner
            src={event?.bannerUrl}
            alt={eventName}
            placeholder="Event artwork unavailable"
            className="aspect-[5/4] w-full shrink-0 border-b border-border/70 bg-muted/30 sm:aspect-[6/5]"
            imageClassName="object-cover object-center"
          />

          <div className="min-h-0 space-y-5 overflow-y-auto px-4 py-4 sm:px-5 sm:py-5">
            <div className="space-y-2 pr-8">
              <h2 className="text-2xl font-semibold tracking-tight text-foreground">
                {eventName}
              </h2>
              <p className="text-sm leading-6 text-muted-foreground">
                Your issued match ticket. Show this code when needed and keep it
                easy to read at the venue gate.
              </p>
            </div>

            <div className="grid gap-3">
              <TicketPreviewInfo
                icon={<TicketIcon className="h-4 w-4" />}
                label="Ticket type"
                value={ticketTypeName}
              />
              <TicketPreviewInfo
                icon={<CalendarDaysIcon className="h-4 w-4" />}
                label="Schedule"
                value={
                  event?.startAt
                    ? formatTransactionDateTime(event.startAt)
                    : ticket.transaction?.event?.startAt
                      ? formatTransactionDateTime(ticket.transaction.event.startAt)
                      : "Schedule unavailable"
                }
              />
              <TicketPreviewInfo
                icon={<MapPinIcon className="h-4 w-4" />}
                label="Venue"
                value={event?.venue ?? ticket.transaction?.event?.venue ?? "Venue unavailable"}
              />
            </div>

            <div className="rounded-[1.75rem] border border-primary/15 bg-linear-to-br from-primary/6 via-card to-accent/10 p-5 text-center">
              <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                <QrCodeIcon className="h-5 w-5" />
              </div>
              <p className="mt-3 text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                Ticket code
              </p>
              <p className="mt-3 break-all font-mono text-3xl font-semibold tracking-[0.18em] text-primary">
                {ticket.code}
              </p>
              <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                <Badge variant={ticket.checkedInAt ? "default" : "outline"}>
                  {ticket.checkedInAt ? "Checked in" : "Not checked in"}
                </Badge>
                <Badge variant="secondary">
                  Issued {formatTransactionDateTime(ticket.createdAt)}
                </Badge>
              </div>
            </div>

            {isLoadingEvent ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Spinner className="h-4 w-4" />
                Loading event details...
              </div>
            ) : null}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function TicketPreviewInfo({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-border/70 bg-background/80 px-4 py-3 shadow-sm">
      <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
        {icon}
        {label}
      </div>
      <p className="mt-2 text-sm font-semibold leading-6 text-foreground">
        {value}
      </p>
    </div>
  );
}

function SectionCard({
  title,
  description,
  icon,
  children,
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Card className="border-border/80 bg-card shadow-sm">
      <CardHeader className="gap-2">
        <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <span className="rounded-full bg-primary/10 p-2 text-primary">
            {icon}
          </span>
          {title}
        </div>
        <CardDescription className="text-sm leading-6">
          {description}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">{children}</CardContent>
    </Card>
  );
}
