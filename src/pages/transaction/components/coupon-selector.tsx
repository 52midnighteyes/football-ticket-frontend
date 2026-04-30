import { useEffect } from "react";
import { CalendarDaysIcon, RefreshCcwIcon, TicketPercentIcon } from "lucide-react";
import type { IUserCoupon } from "@/api/transaction/transaction.interface";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { useTransactionCountdown } from "@/pages/transaction/hooks/use-transaction-countdown";
import {
  formatCouponSource,
  formatRupiah,
  formatTransactionDateTime,
} from "@/pages/transaction/transaction.utils";

interface CouponSelectorProps {
  coupons: IUserCoupon[];
  selectedCouponId: string | null;
  onSelect: (couponId: string | null) => void;
  isLoading: boolean;
  errorMessage: string | null;
  onRetry: () => void;
}

export function CouponSelector({
  coupons,
  selectedCouponId,
  onSelect,
  isLoading,
  errorMessage,
  onRetry,
}: CouponSelectorProps) {
  if (isLoading) {
    return (
      <Card className="border-border/80 bg-card/90 shadow-sm">
        <CardContent className="flex items-center gap-3 py-6">
          <Spinner />
          <div>
            <p className="font-medium">Loading your coupons</p>
            <p className="text-sm text-muted-foreground">
              Pulling the latest available coupon list from your account.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h3 className="text-base font-semibold">Select one coupon</h3>
        <p className="text-sm text-muted-foreground">
          Choose a coupon from your account or continue without one. Referral
          coupons expire 3 months after they are earned.
        </p>
      </div>

      {errorMessage ? (
        <Card className="border-destructive/20 bg-destructive/5 shadow-none">
          <CardContent className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-medium text-destructive">Unable to load coupons</p>
              <p className="text-sm text-muted-foreground">{errorMessage}</p>
            </div>
            <Button type="button" variant="outline" onClick={onRetry}>
              <RefreshCcwIcon className="mr-2 h-4 w-4" />
              Retry
            </Button>
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-3">
        <button
          type="button"
          onClick={() => onSelect(null)}
          className={`rounded-2xl border p-4 text-left transition ${
            selectedCouponId === null
              ? "border-primary bg-primary/6 shadow-sm"
              : "border-border bg-card hover:border-primary/35"
          }`}
        >
          <p className="font-semibold">No coupon</p>
          <p className="text-sm text-muted-foreground">
            Keep your coupon for another checkout.
          </p>
        </button>

        {coupons.length === 0 ? (
          <Card className="border-dashed border-border/80 bg-muted/30 shadow-none">
            <CardContent className="py-5">
              <p className="font-medium">No coupons available right now</p>
              <p className="text-sm text-muted-foreground">
                If you earn one later, it will appear here automatically while
                it is still within its 3-month validity window.
              </p>
            </CardContent>
          </Card>
        ) : null}

        {coupons.map((coupon) => {
          const isSelected = selectedCouponId === coupon.id;

          return (
            <CouponOptionCard
              key={coupon.id}
              coupon={coupon}
              isSelected={isSelected}
              onSelect={onSelect}
            />
          );
        })}
      </div>
    </div>
  );
}

function CouponOptionCard({
  coupon,
  isSelected,
  onSelect,
}: {
  coupon: IUserCoupon;
  isSelected: boolean;
  onSelect: (couponId: string | null) => void;
}) {
  const countdown = useTransactionCountdown(coupon.expiresAt, true);
  const isExpired = countdown.isExpired;

  useEffect(() => {
    if (isExpired && isSelected) {
      onSelect(null);
    }
  }, [isExpired, isSelected, onSelect]);

  return (
    <button
      type="button"
      onClick={() => onSelect(isSelected ? null : coupon.id)}
      disabled={isExpired}
      className={`rounded-2xl border p-0 text-left transition ${
        isSelected
          ? "border-primary bg-primary/6 shadow-md"
          : "border-border bg-card hover:border-primary/35"
      } disabled:cursor-not-allowed disabled:opacity-75`}
    >
      <Card className="bg-transparent py-0 shadow-none ring-0">
        <CardHeader className="gap-3 py-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <CardTitle className="text-lg">{formatRupiah(coupon.amount)}</CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">
                {formatCouponSource(coupon.source)}
              </p>
            </div>
            <div
              className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${
                isExpired
                  ? "bg-destructive/10 text-destructive"
                  : isSelected
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
              }`}
            >
              <TicketPercentIcon className="h-3.5 w-3.5" />
              {isExpired ? "Expired" : isSelected ? "Selected" : "Available"}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-2 pb-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <CalendarDaysIcon className="h-4 w-4" />
            Expires {formatTransactionDateTime(coupon.expiresAt)}
          </div>
          <div
            className={`text-sm font-medium ${
              isExpired ? "text-destructive" : "text-foreground"
            }`}
          >
            {isExpired ? "Coupon expired while you were checking out." : `Time left: ${countdown.label}`}
          </div>
        </CardContent>
      </Card>
    </button>
  );
}
