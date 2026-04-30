import type { ITicketType } from "@/api/event/event.interface";
import type { TransactionStatus } from "@/api/transaction/transaction.interface";

export interface ITicketUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
}

export interface ITicketTransactionEvent {
  id: string;
  name: string;
  organizerId: string;
  venue?: string;
  startAt?: string;
}

export interface ITicketTransactionSummary {
  id: string;
  status: TransactionStatus;
  finalAmount?: number;
  totalAmount?: number;
  event?: ITicketTransactionEvent | null;
  user?: ITicketUser | null;
}

export interface ITicketTransactionItemSummary {
  id: string;
  quantity?: number;
  price?: number;
  subtotal?: number;
  ticketType?: Pick<ITicketType, "id" | "name"> | null;
}

export interface ITicket {
  id: string;
  code: string;
  checkedInAt: string | null;
  createdAt: string;
  user?: ITicketUser | null;
  transaction?: ITicketTransactionSummary | null;
  transactionItem?: ITicketTransactionItemSummary | null;
}

export interface ITicketQueryParams {
  id?: string;
  organizerId?: string;
  transactionId?: string;
  transactionItemId?: string;
  eventId?: string;
  userId?: string;
  code?: string;
  codeLike?: string;
  eventNameLike?: string;
  ticketTypeNameLike?: string;
  checkedIn?: boolean;
  sortBy?: "code" | "checkedInAt" | "createdAt";
  sortOrder?: "asc" | "desc";
  page?: number;
  limit?: number;
}

export interface ITicketAttendanceStats {
  event: {
    id: string;
    name: string;
    venue: string;
    startAt: string;
  };
  totalTickets: number;
  totalCheckedInTickets: number;
  totalNotCheckedInTickets: number;
  attendancePercentage: number;
}

export interface ITicketCheckInResult {
  id: string;
  code: string;
  checkedInAt: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  event: {
    id: string;
    name: string;
    venue: string;
    startAt: string;
  };
  ticketType: {
    id: string;
    name: string;
  };
}
