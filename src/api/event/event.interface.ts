export type EventStatus = "DRAFT" | "PUBLISHED" | "CANCELED" | "COMPLETED";

export interface ICategory {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface ICity {
  id: string;
  provinceId: string;
  name: string;
  code: string;
  createdAt: string;
  updatedAt: string;
}

export interface ITicketType {
  id: string;
  eventId: string;
  name: string;
  price: number;
  quota: number;
  isActive?: boolean;
  isSoldOut?: boolean;
  isDeleted?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface IEvent {
  id: string;
  organizerId: string;
  categoryId: string;
  cityId: string;
  name: string;
  slug: string;
  description: string;
  bannerUrl: string;
  venue: string;
  address: string;
  startAt: string;
  endAt: string;
  status: EventStatus;
  ticketTypes?: ITicketType[];
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface IPaginatedResponse<T> {
  message: string;
  data: T;
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ICreateTicketTypeParams {
  name: string;
  price: number;
  quota: number;
  isActive?: boolean;
}

export interface ICreateEventParams {
  categoryId: string;
  cityId: string;
  name: string;
  description: string;
  venue: string;
  address: string;
  startAt: string;
  endAt: string;
  status?: EventStatus;
  bannerUrl: File;
  ticketTypes: ICreateTicketTypeParams[];
}
