import * as Yup from "yup";
import type { EventStatus, IEvent } from "@/api/event/event.interface";

const allowedStatuses: EventStatus[] = [
  "DRAFT",
  "PUBLISHED",
  "CANCELED",
  "COMPLETED",
];

const allowedMimeTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_FILE_SIZE = 2 * 1024 * 1024;

export interface ICreateTicketTypeFormValues {
  id?: string;
  name: string;
  price: string;
  quota: string;
  isActive: boolean;
}

export interface ICreateEventFormValues {
  categoryId: string;
  cityId: string;
  name: string;
  description: string;
  venue: string;
  address: string;
  startAt: string;
  endAt: string;
  status: EventStatus;
  bannerUrl: File | null;
  ticketTypes: ICreateTicketTypeFormValues[];
}

export const createEventInitialValues: ICreateEventFormValues = {
  categoryId: "",
  cityId: "",
  name: "",
  description: "",
  venue: "",
  address: "",
  startAt: "",
  endAt: "",
  status: "DRAFT",
  bannerUrl: null,
  ticketTypes: [
    {
      name: "",
      price: "",
      quota: "",
      isActive: true,
    },
  ],
};

const buildBannerSchema = (isRequired: boolean) => {
  const schema = Yup.mixed<File>()
    .nullable()
    .test({
      name: "banner-validation",
      message: isRequired
        ? "Banner must be JPG, PNG, or WEBP and max 2MB."
        : "Banner must be JPG, PNG, or WEBP and max 2MB when provided.",
      test(value) {
        if (!value) {
          return !isRequired;
        }

        if (!(value instanceof File)) {
          return false;
        }

        return allowedMimeTypes.has(value.type) && value.size <= MAX_FILE_SIZE;
      },
    });

  return isRequired ? schema.required("Banner image is required") : schema;
};

const baseEventSchema = {
  categoryId: Yup.string().trim().required("Category is required"),
  cityId: Yup.string().trim().required("City is required"),
  name: Yup.string().trim().required("Event name is required"),
  description: Yup.string()
    .trim()
    .min(20, "Description must be at least 20 characters")
    .required("Description is required"),
  venue: Yup.string().trim().required("Venue is required"),
  address: Yup.string().trim().required("Address is required"),
  startAt: Yup.string().required("Start date is required"),
  endAt: Yup.string()
    .required("End date is required")
    .test({
      name: "is-after-start",
      message: "End date must be after start date",
      test(value, context) {
        const startAt = context.parent.startAt;

        if (!startAt || !value) {
          return true;
        }

        return new Date(value).getTime() > new Date(startAt).getTime();
      },
    }),
  status: Yup.mixed<EventStatus>()
    .oneOf(allowedStatuses, "Invalid event status")
    .required("Status is required"),
  ticketTypes: Yup.array()
    .of(
      Yup.object({
        id: Yup.string().trim().optional(),
        name: Yup.string().trim().required("Ticket name is required"),
        price: Yup.string()
          .required("Price is required")
          .test({
            name: "ticket-price-valid",
            message: "Price must be a number greater than or equal to 0",
            test(value) {
              if (!value) {
                return false;
              }

              if (!/^\d+$/.test(value)) {
                return false;
              }

              return Number(value) >= 0;
            },
          }),
        quota: Yup.string()
          .required("Quota is required")
          .test({
            name: "ticket-quota-valid",
            message: "Quota must be a whole number greater than or equal to 1",
            test(value) {
              if (!value) {
                return false;
              }

              if (!/^\d+$/.test(value)) {
                return false;
              }

              return Number(value) >= 1;
            },
          }),
        isActive: Yup.boolean().required("Ticket status is required"),
      }),
    )
    .min(1, "At least one ticket type is required")
    .required("At least one ticket type is required"),
};

export const createEventSchema = Yup.object({
  ...baseEventSchema,
  bannerUrl: buildBannerSchema(true),
});

export const updateEventSchema = Yup.object({
  ...baseEventSchema,
  bannerUrl: buildBannerSchema(false),
});

export const mapEventToFormValues = (
  event: IEvent,
): ICreateEventFormValues => ({
  categoryId: event.categoryId,
  cityId: event.cityId,
  name: event.name,
  description: event.description,
  venue: event.venue,
  address: event.address,
  startAt: event.startAt.slice(0, 16),
  endAt: event.endAt.slice(0, 16),
  status: event.status,
  bannerUrl: null,
  ticketTypes:
    event.ticketTypes && event.ticketTypes.length > 0
      ? event.ticketTypes.map((ticketType) => ({
          id: ticketType.id,
          name: ticketType.name,
          price: String(ticketType.price),
          quota: String(ticketType.quota),
          isActive: ticketType.isActive ?? true,
        }))
      : [
          {
            name: "",
            price: "",
            quota: "",
            isActive: true,
          },
        ],
});
