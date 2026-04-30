import axios from "axios";
import type { ApiResponse } from "@/interface/api.interface";
import api from "@/lib/axios";
import type {
  ICategory,
  ICategoryQueryParams,
  ICity,
  ICityQueryParams,
  ICreateEventParams,
  IEventQueryParams,
  IEvent,
  IPaginatedResponse,
  IUpdateEventParams,
} from "./event.interface";

export const getCategories = async (
  params?: ICategoryQueryParams,
): Promise<ApiResponse<ICategory[]>> => {
  const response = await api.get<ApiResponse<ICategory[]>>("/categories", {
    params,
  });
  return response.data;
};

export const getCities = async (
  params?: ICityQueryParams,
): Promise<ApiResponse<ICity[]>> => {
  const response = await api.get<ApiResponse<ICity[]>>("/locations/cities", {
    params,
  });
  return response.data;
};

const appendEventFormData = (
  formData: FormData,
  params: ICreateEventParams | IUpdateEventParams,
) => {
  formData.append("categoryId", params.categoryId);
  formData.append("cityId", params.cityId);
  formData.append("name", params.name);
  formData.append("description", params.description);
  formData.append("venue", params.venue);
  formData.append("address", params.address);
  formData.append("startAt", params.startAt);
  formData.append("endAt", params.endAt);

  if (params.status) {
    formData.append("status", params.status);
  }

  formData.append("ticketTypes", JSON.stringify(params.ticketTypes));

  if (params.bannerUrl instanceof File) {
    formData.append("bannerUrl", params.bannerUrl);
  }
};

export const createEvent = async (
  organizerId: string,
  params: ICreateEventParams,
): Promise<ApiResponse<IEvent>> => {
  const formData = new FormData();

  appendEventFormData(formData, params);

  const response = await api.post<ApiResponse<IEvent>>(
    `/event/organizer/${organizerId}`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    },
  );

  return response.data;
};

export const getEvents = async (
  params?: IEventQueryParams,
): Promise<IPaginatedResponse<IEvent[]>> => {
  const response = await api.get<IPaginatedResponse<IEvent[]>>("/event", {
    params,
  });
  return response.data;
};

export const getEventById = async (id: string): Promise<ApiResponse<IEvent>> => {
  const response = await api.get<ApiResponse<IEvent>>(`/event/${id}`);
  return response.data;
};

export const getEventBySlug = async (
  slug: string,
): Promise<ApiResponse<IEvent>> => {
  const response = await api.get<ApiResponse<IEvent>>(
    `/event/slug/${encodeURIComponent(slug)}`,
  );
  return response.data;
};

export const getEventByIdentifier = async (
  identifier: string,
): Promise<ApiResponse<IEvent>> => {
  try {
    return await getEventBySlug(identifier);
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      return getEventById(identifier);
    }

    throw error;
  }
};

export const updateEvent = async (
  id: string,
  params: IUpdateEventParams,
): Promise<ApiResponse<IEvent>> => {
  const formData = new FormData();

  appendEventFormData(formData, params);

  const response = await api.put<ApiResponse<IEvent>>(`/event/${id}`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return response.data;
};
