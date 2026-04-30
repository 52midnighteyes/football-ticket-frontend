import axios from "axios";
import type { IEvent, ITicketType } from "@/api/event/event.interface";
import type {
  IEnrichedTransaction,
  ITransaction,
  ITransactionCheckoutEstimate,
  TransactionStatus,
} from "@/api/transaction/transaction.interface";

const rupiahFormatter = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
});

const dateTimeFormatter = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
  timeStyle: "short",
});

type TransactionStatusBadgeVariant =
  | "default"
  | "secondary"
  | "destructive"
  | "outline";

export interface ITransactionStatusMeta {
  label: string;
  badgeVariant: TransactionStatusBadgeVariant;
  toneClassName: string;
  description: string;
}

interface IEstimateParams {
  basePrice: number;
  voucherAmount: number;
  couponAmount: number;
  availablePoints: number;
  useAllPoints: boolean;
}

export function formatRupiah(amount: number) {
  const safeAmount = Number.isFinite(amount) ? Math.max(0, amount) : 0;

  return rupiahFormatter.format(safeAmount);
}

export function formatTransactionDateTime(value?: string | null) {
  if (!value) {
    return "TBD";
  }

  return dateTimeFormatter.format(new Date(value));
}

export function formatCouponSource(source: string) {
  return source
    .toLowerCase()
    .split("_")
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
}

export function isEventPurchasable(event?: IEvent | null, now = new Date()) {
  if (!event) {
    return false;
  }

  if (event.status !== "PUBLISHED") {
    return false;
  }

  if (event.deletedAt) {
    return false;
  }

  return new Date(event.startAt).getTime() > now.getTime();
}

export function buildTransactionEstimate({
  basePrice,
  voucherAmount,
  couponAmount,
  availablePoints,
  useAllPoints,
}: IEstimateParams): ITransactionCheckoutEstimate {
  const normalizedBasePrice = Math.max(0, basePrice);
  const safeVoucherAmount = Math.max(0, voucherAmount);
  const safeCouponAmount = Math.max(0, couponAmount);
  const amountAfterDiscounts = Math.max(
    normalizedBasePrice - safeVoucherAmount - safeCouponAmount,
    0,
  );
  const pointsDiscount = useAllPoints
    ? Math.min(Math.max(0, availablePoints), amountAfterDiscounts)
    : 0;

  return {
    basePrice: normalizedBasePrice,
    voucherDiscount: Math.min(safeVoucherAmount, normalizedBasePrice),
    couponDiscount: Math.min(
      safeCouponAmount,
      Math.max(normalizedBasePrice - safeVoucherAmount, 0),
    ),
    pointsDiscount,
    finalAmount: Math.max(amountAfterDiscounts - pointsDiscount, 0),
  };
}

export function getTransactionStatusMeta(
  status: TransactionStatus,
): ITransactionStatusMeta {
  switch (status) {
    case "WAITING_FOR_PAYMENT":
      return {
        label: "Waiting for payment",
        badgeVariant: "destructive",
        toneClassName:
          "border-destructive/25 bg-destructive/6 text-destructive",
        description: "Complete payment before the deadline to keep your ticket.",
      };
    case "WAITING_FOR_ADMIN_CONFIRMATION":
      return {
        label: "Waiting for confirmation",
        badgeVariant: "secondary",
        toneClassName: "border-primary/20 bg-primary/8 text-primary",
        description:
          "Your payment proof is locked in and waiting for admin review within the follow-up window.",
      };
    case "DONE":
      return {
        label: "Done",
        badgeVariant: "default",
        toneClassName: "border-accent/20 bg-accent/8 text-accent",
        description: "This purchase is complete and your ticket is secured.",
      };
    case "REJECTED":
      return {
        label: "Rejected",
        badgeVariant: "destructive",
        toneClassName:
          "border-destructive/25 bg-destructive/6 text-destructive",
        description: "The transaction was rejected. Please review the details.",
      };
    case "EXPIRED":
      return {
        label: "Expired",
        badgeVariant: "outline",
        toneClassName: "border-border bg-muted/70 text-muted-foreground",
        description: "The payment window ended before checkout was completed.",
      };
    case "CANCELED":
      return {
        label: "Canceled",
        badgeVariant: "outline",
        toneClassName: "border-border bg-muted/70 text-muted-foreground",
        description: "This transaction was canceled and is no longer active.",
      };
    default:
      return {
        label: status,
        badgeVariant: "outline",
        toneClassName: "border-border bg-muted/70 text-muted-foreground",
        description: "Transaction status updated.",
      };
  }
}

export function getTransactionErrorMessage(error: unknown) {
  if (axios.isAxiosError(error)) {
    const message = error.response?.data?.message;

    if (!message) {
      return "We couldn't complete that transaction. Please try again.";
    }

    const normalizedMessage = message.toLowerCase();

    if (
      normalizedMessage.includes("waiting_for_payment") ||
      normalizedMessage.includes("waiting_for_admin_confirmation") ||
      normalizedMessage.includes("already have") ||
      normalizedMessage.includes("same event") ||
      normalizedMessage.includes("duplicate")
    ) {
      return "You already have an active or completed transaction for this event.";
    }

    if (normalizedMessage.includes("voucher")) {
      return "That voucher can't be used for this event right now.";
    }

    if (normalizedMessage.includes("coupon")) {
      return "That coupon is no longer available for this purchase.";
    }

    if (normalizedMessage.includes("point")) {
      return "Your points can't be applied to this checkout amount.";
    }

    if (
      normalizedMessage.includes("sold out") ||
      normalizedMessage.includes("quota")
    ) {
      return "That ticket type is sold out or no longer available.";
    }

    if (normalizedMessage.includes("unauthorized")) {
      return "Please sign in again before continuing your purchase.";
    }

    if (normalizedMessage.includes("forbidden")) {
      return "Your account is not allowed to perform this action.";
    }

    if (
      normalizedMessage.includes("event not found") ||
      normalizedMessage.includes("not purchasable")
    ) {
      return "This event is unavailable for purchase or the kick-off time has already started.";
    }

    return message;
  }

  return "We couldn't complete that transaction. Please try again.";
}

export function enrichTransactions(
  transactions: ITransaction[],
  eventMap: Record<string, IEvent | null | undefined>,
): IEnrichedTransaction[] {
  return transactions.map((transaction) => {
    const event = transaction.event ?? eventMap[transaction.eventId] ?? null;
    const selectedItem = transaction.transactionItems[0] ?? null;
    const matchedTicketType =
      selectedItem?.ticketType ??
      findTicketTypeById(event?.ticketTypes, selectedItem?.ticketTypeId);

    return {
      ...transaction,
      eventSummary: {
        id: event?.id ?? transaction.eventId,
        name: event?.name ?? "Event unavailable",
        bannerUrl: event?.bannerUrl ?? "",
        venue: event?.venue ?? "Venue unavailable",
        address: event?.address ?? "",
        startAt: event?.startAt ?? transaction.createdAt ?? "",
        endAt: event?.endAt ?? "",
      },
      selectedItem,
      ticketTypeName: matchedTicketType?.name ?? "Ticket",
    };
  });
}

function findTicketTypeById(
  ticketTypes: ITicketType[] | undefined,
  ticketTypeId: string | undefined,
) {
  if (!ticketTypes || !ticketTypeId) {
    return null;
  }

  return ticketTypes.find((ticketType) => ticketType.id === ticketTypeId) ?? null;
}
