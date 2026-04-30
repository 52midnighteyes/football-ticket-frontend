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

export interface IEventQueryParams {
  id?: string;
  slug?: string;
  slugLike?: string;
  descriptionLike?: string;
  venueLike?: string;
  addressLike?: string;
  organizerId?: string;
  locationId?: string;
  categoryId?: string;
  nameLike?: string;
  status?: EventStatus;
  sortBy?:
    | "name"
    | "slug"
    | "venue"
    | "address"
    | "startAt"
    | "endAt"
    | "createdAt"
    | "updatedAt";
  sortOrder?: "asc" | "desc";
  page?: number;
  limit?: number;
}

export interface ICategoryQueryParams {
  id?: string;
  name?: string;
  nameLike?: string;
  sortBy?: "name" | "createdAt" | "updatedAt";
  sortOrder?: "asc" | "desc";
}

export interface ICityQueryParams {
  id?: string;
  provinceId?: string;
  code?: string;
  name?: string;
  codeLike?: string;
  nameLike?: string;
  sortBy?: "name" | "code" | "createdAt" | "updatedAt";
  sortOrder?: "asc" | "desc";
}

export interface IEventTicketTypeParams {
  name: string;
  price: number;
  quota: number;
  isActive?: boolean;
}

export type ICreateTicketTypeParams = IEventTicketTypeParams;

export interface IUpdateTicketTypeParams extends IEventTicketTypeParams {
  id?: string;
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
  ticketTypes: IEventTicketTypeParams[];
}

export interface IUpdateEventParams {
  categoryId: string;
  cityId: string;
  name: string;
  description: string;
  venue: string;
  address: string;
  startAt: string;
  endAt: string;
  status?: EventStatus;
  bannerUrl?: File | null;
  ticketTypes: IUpdateTicketTypeParams[];
}
