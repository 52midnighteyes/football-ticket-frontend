import type { IEvent, ITicketType } from "@/api/event/event.interface";

export type TransactionStatus =
  | "WAITING_FOR_PAYMENT"
  | "WAITING_FOR_ADMIN_CONFIRMATION"
  | "DONE"
  | "REJECTED"
  | "EXPIRED"
  | "CANCELED";

export interface ICreateTransactionParams {
  eventId: string;
  ticketTypeId: string;
  voucherCode?: string;
  couponId?: string;
  usePoints?: boolean;
}

export interface ITransactionQueryParams {
  status?: TransactionStatus;
}

export interface ITransactionVoucher {
  id: string;
  eventId: string;
  code: string;
  amount: number;
  quota: number;
  startAt: string;
  endAt: string;
}

export interface IUserCoupon {
  id: string;
  userId: string;
  amount: number;
  source: string;
  usedAt: string | null;
  expiresAt: string;
}

export interface ITransactionAvailablePoints {
  totalAvailablePoints: number;
}

export interface IOrganizerTransactionUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
}

export interface IOrganizerTransactionEvent {
  id: string;
  name: string;
  organizerId: string;
  slug?: string;
}

export interface ITransactionPaymentProofUpdate {
  id: string;
  status: TransactionStatus;
  paymentProofUrl: string;
  paymentProofUploadedAt: string;
  expiredAt: string;
}

export interface ITransactionItem {
  id: string;
  ticketTypeId: string;
  quantity: number;
  price: number;
  subtotal: number;
  ticketType?: Pick<ITicketType, "id" | "name"> | null;
}

export type ITransactionEventSummary = Pick<
  IEvent,
  | "id"
  | "name"
  | "slug"
  | "bannerUrl"
  | "venue"
  | "address"
  | "startAt"
  | "endAt"
  | "ticketTypes"
>;

export interface ITransaction {
  id: string;
  userId: string;
  eventId: string;
  couponId: string | null;
  voucherId: string | null;
  status: TransactionStatus;
  totalAmount: number;
  couponAmount: number;
  voucherAmount: number;
  pointsAmount: number;
  finalAmount: number;
  paymentProofUrl?: string | null;
  paymentProofUploadedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
  expiredAt: string | null;
  transactionItems: ITransactionItem[];
  event?: ITransactionEventSummary | null;
}

export interface ITransactionCheckoutEstimate {
  basePrice: number;
  voucherDiscount: number;
  couponDiscount: number;
  pointsDiscount: number;
  finalAmount: number;
}

export interface IOrganizerTransaction extends Omit<ITransaction, "event"> {
  user?: IOrganizerTransactionUser | null;
  event?: IOrganizerTransactionEvent | null;
  adminActionAt?: string | null;
}

export interface IOrganizerTransactionQueryParams {
  id?: string;
  organizerId?: string;
  eventId?: string;
  userId?: string;
  status?: TransactionStatus;
  eventNameLike?: string;
  buyerNameLike?: string;
  buyerEmailLike?: string;
  sortBy?:
    | "createdAt"
    | "updatedAt"
    | "expiredAt"
    | "paymentProofUploadedAt"
    | "adminActionAt"
    | "totalAmount"
    | "finalAmount"
    | "status";
  sortOrder?: "asc" | "desc";
  page?: number;
  limit?: number;
}

export interface ITransactionStatusUpdateParams {
  status: "DONE" | "REJECTED";
}

export interface ITransactionStatusUpdateResponse {
  id: string;
  status: "DONE" | "REJECTED";
}

export type OrganizerRevenueGroupBy = "year" | "month" | "day";

export interface IOrganizerRevenueItem {
  label: string;
  period: string;
  revenue: number;
}

export interface IOrganizerRevenueAnalytics {
  groupBy: OrganizerRevenueGroupBy;
  year: number | null;
  month: number | null;
  totalRevenue: number;
  items: IOrganizerRevenueItem[];
}

export interface IOrganizerRevenueQueryParams {
  groupBy?: OrganizerRevenueGroupBy;
  year?: number;
  month?: number;
  organizerId?: string;
}

export interface IEnrichedTransaction extends ITransaction {
  eventSummary: {
    id: string;
    name: string;
    bannerUrl: string;
    venue: string;
    address: string;
    startAt: string;
    endAt: string;
  };
  selectedItem: ITransactionItem | null;
  ticketTypeName: string;
}
