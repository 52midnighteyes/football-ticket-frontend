import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  CalendarDaysIcon,
  CircleAlertIcon,
  Loader2Icon,
  MapPinIcon,
  TicketIcon,
} from "lucide-react";
import { Link } from "react-router";
import type { IEvent, ITicketType } from "@/api/event/event.interface";
import {
  createTransaction,
  getMyAvailablePoints,
  getMyCoupons,
} from "@/api/transaction/transaction.api";
import type {
  ITransaction,
  IUserCoupon,
} from "@/api/transaction/transaction.interface";
import EventBanner from "@/components/event-banner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { VoucherInput } from "@/pages/transaction/components/voucher-input";
import { CouponSelector } from "@/pages/transaction/components/coupon-selector";
import { UseAllPointsToggle } from "@/pages/transaction/components/use-all-points-toggle";
import { PriceSummary } from "@/pages/transaction/components/price-summary";
import { useVoucherValidation } from "@/pages/transaction/hooks/use-voucher-validation";
import {
  buildTransactionEstimate,
  formatRupiah,
  formatTransactionDateTime,
  getTransactionErrorMessage,
  isEventPurchasable,
} from "@/pages/transaction/transaction.utils";
import { toast } from "sonner";

interface TransactionCheckoutProps {
  event: IEvent;
  selectedTicketTypeId: string;
  onTransactionCreated: (transaction: ITransaction) => void;
}

export function TransactionCheckout({
  event,
  selectedTicketTypeId,
  onTransactionCreated,
}: TransactionCheckoutProps) {
  const [voucherCode, setVoucherCode] = useState("");
  const [selectedCouponId, setSelectedCouponId] = useState<string | null>(null);
  const [useAllPoints, setUseAllPoints] = useState(false);
  const [availablePoints, setAvailablePoints] = useState(0);
  const [coupons, setCoupons] = useState<IUserCoupon[]>([]);
  const [isCouponsLoading, setIsCouponsLoading] = useState(true);
  const [isPointsLoading, setIsPointsLoading] = useState(true);
  const [couponErrorMessage, setCouponErrorMessage] = useState<string | null>(
    null,
  );
  const [pointsErrorMessage, setPointsErrorMessage] = useState<string | null>(
    null,
  );
  const [submitErrorMessage, setSubmitErrorMessage] = useState<string | null>(
    null,
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedTicketType = useMemo(
    () =>
      (event.ticketTypes ?? []).find(
        (ticketType) =>
          ticketType.id === selectedTicketTypeId &&
          ticketType.isActive !== false,
      ) ?? null,
    [event.ticketTypes, selectedTicketTypeId],
  );

  const selectedCoupon =
    coupons.find((coupon) => coupon.id === selectedCouponId) ?? null;

  const {
    state: voucherState,
    voucher,
    errorMessage: voucherErrorMessage,
  } = useVoucherValidation(event.id, voucherCode);

  const loadCoupons = useCallback(async () => {
    try {
      setIsCouponsLoading(true);
      setCouponErrorMessage(null);
      const response = await getMyCoupons();
      setCoupons(response.data ?? []);
    } catch (error) {
      setCouponErrorMessage(getTransactionErrorMessage(error));
      setCoupons([]);
    } finally {
      setIsCouponsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadCoupons();
  }, [loadCoupons]);

  const loadAvailablePoints = useCallback(async () => {
    try {
      setIsPointsLoading(true);
      setPointsErrorMessage(null);
      const response = await getMyAvailablePoints();
      setAvailablePoints(Math.max(0, response.data?.totalAvailablePoints ?? 0));
    } catch (error) {
      setPointsErrorMessage(getTransactionErrorMessage(error));
      setAvailablePoints(0);
      setUseAllPoints(false);
    } finally {
      setIsPointsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadAvailablePoints();
  }, [loadAvailablePoints]);

  const estimate = buildTransactionEstimate({
    basePrice: selectedTicketType?.price ?? 0,
    voucherAmount: voucherState === "valid" ? voucher?.amount ?? 0 : 0,
    couponAmount: selectedCoupon?.amount ?? 0,
    availablePoints,
    useAllPoints,
  });

  const isCheckoutUnavailable =
    !selectedTicketType ||
    !isEventPurchasable(event) ||
    selectedTicketType.isSoldOut === true;

  async function handleSubmit() {
    if (!selectedTicketType) {
      return;
    }

    try {
      setIsSubmitting(true);
      setSubmitErrorMessage(null);

      const response = await createTransaction({
        eventId: event.id,
        ticketTypeId: selectedTicketType.id,
        voucherCode:
          voucherState === "valid" ? voucherCode.trim().toUpperCase() : undefined,
        couponId: selectedCoupon?.id,
        usePoints: useAllPoints,
      });

      if (!response.data) {
        throw new Error("Transaction response was empty");
      }

      toast.success(response.message || "Transaction created successfully.");
      onTransactionCreated(response.data);
    } catch (error) {
      const friendlyMessage = getTransactionErrorMessage(error);
      setSubmitErrorMessage(friendlyMessage);
      toast.error(friendlyMessage);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
      <div className="space-y-6">
        <Card className="gap-0 overflow-hidden border-border/80 bg-card pt-0 shadow-xl shadow-primary/5">
          <EventBanner
            src={event.bannerUrl}
            alt={event.name}
            placeholder="Event banner unavailable"
          />

          <CardHeader className="gap-3">
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">Transaction step</Badge>
              <Badge variant="outline">1 ticket selected</Badge>
            </div>
            <CardTitle className="text-3xl font-semibold tracking-tight md:text-4xl">
              {event.name}
            </CardTitle>
            <CardDescription className="max-w-3xl text-sm leading-6">
              Your ticket choice is locked in for this step. Review the order,
              apply discounts, and create the transaction when everything looks
              right.
            </CardDescription>
          </CardHeader>

          <CardContent className="grid gap-3 sm:grid-cols-2">
            <SummaryPill
              icon={<MapPinIcon className="h-4 w-4" />}
              label="Venue"
              value={event.venue}
            />
            <SummaryPill
              icon={<CalendarDaysIcon className="h-4 w-4" />}
              label="Kick-off"
              value={formatTransactionDateTime(event.startAt)}
            />
            <SummaryPill
              icon={<TicketIcon className="h-4 w-4" />}
              label="Ticket quantity"
              value="Fixed at 1"
            />
            <SummaryPill
              icon={<MapPinIcon className="h-4 w-4" />}
              label="Address"
              value={event.address}
            />
          </CardContent>
        </Card>

        <Card className="border-border/80 bg-card shadow-sm">
          <CardHeader>
            <CardTitle className="text-xl">Selected ticket</CardTitle>
            <CardDescription>
              Want to change it? Go back to the event page before creating the
              transaction.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <SelectedTicketCard ticketType={selectedTicketType} />
            <Separator />
            <Button asChild variant="outline">
              <Link to={`/event/${event.slug || event.id}`}>Change ticket selection</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="border-border/80 bg-card shadow-sm">
          <CardHeader className="gap-1">
            <CardTitle className="text-xl">Discounts and points</CardTitle>
            <CardDescription>
              Voucher, coupon, and points can be combined if they are all valid.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <VoucherInput
              value={voucherCode}
              onChange={setVoucherCode}
              state={voucherState}
              voucher={voucher}
              errorMessage={voucherErrorMessage}
              disabled={isSubmitting}
            />

            <CouponSelector
              coupons={coupons}
              selectedCouponId={selectedCouponId}
              onSelect={setSelectedCouponId}
              isLoading={isCouponsLoading}
              errorMessage={couponErrorMessage}
              onRetry={() => void loadCoupons()}
            />

            <UseAllPointsToggle
              checked={useAllPoints}
              availablePoints={availablePoints}
              disabled={isSubmitting}
              isLoading={isPointsLoading}
              errorMessage={pointsErrorMessage}
              onRetry={() => void loadAvailablePoints()}
              onCheckedChange={setUseAllPoints}
            />
          </CardContent>
        </Card>

        {submitErrorMessage ? (
          <div className="flex items-start gap-3 rounded-2xl border border-destructive/20 bg-destructive/6 px-4 py-4 text-sm text-destructive">
            <CircleAlertIcon className="mt-0.5 h-4 w-4 shrink-0" />
            <p>{submitErrorMessage}</p>
          </div>
        ) : null}

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Button
            type="button"
            size="lg"
            className="h-12 rounded-xl px-6 text-sm font-semibold"
            disabled={isCheckoutUnavailable || isSubmitting}
            onClick={() => void handleSubmit()}
          >
            {isSubmitting ? (
              <>
                <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
                Creating transaction...
              </>
            ) : (
              "Submit transaction"
            )}
          </Button>

          <p className="text-sm text-muted-foreground">
            Backend validation is always final for quota, discount rules,
            duplicate prevention, and payable total.
          </p>
        </div>
      </div>

      <div className="space-y-5 xl:sticky xl:top-28 xl:self-start">
        <PriceSummary
          estimate={estimate}
          selectedTicketType={selectedTicketType}
          useAllPoints={useAllPoints}
        />

        {!isEventPurchasable(event) ? (
          <InlineNotice>
            This event is no longer purchasable because it is unavailable or
            the kick-off time has started.
          </InlineNotice>
        ) : null}

        {selectedTicketType?.isSoldOut ? (
          <InlineNotice>
            The selected ticket type is sold out. Return to the event page and
            choose another ticket type.
          </InlineNotice>
        ) : null}
      </div>
    </div>
  );
}

function SummaryPill({
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
      <p className="mt-2 text-sm font-semibold">{value}</p>
    </div>
  );
}

function SelectedTicketCard({
  ticketType,
}: {
  ticketType: ITicketType | null;
}) {
  if (!ticketType) {
    return (
      <div className="rounded-2xl border border-dashed border-border/80 bg-muted/25 px-4 py-4 text-sm text-muted-foreground">
        The selected ticket could not be found for this event.
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border/80 bg-muted/25 px-4 py-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-lg font-semibold">{ticketType.name}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Remaining quota: {ticketType.quota}
          </p>
        </div>
        <Badge variant={ticketType.isSoldOut ? "outline" : "secondary"}>
          {ticketType.isSoldOut ? "Sold out" : "Selected"}
        </Badge>
      </div>
      <p className="mt-4 text-xl font-semibold">
        {formatRupiah(ticketType.price)}
      </p>
    </div>
  );
}

function InlineNotice({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-2xl border border-border/80 bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
      {children}
    </div>
  );
}
