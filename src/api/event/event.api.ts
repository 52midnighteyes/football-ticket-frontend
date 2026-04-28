import type { ApiResponse } from "@/interface/api.interface";
import api from "@/lib/axios";
import type {
  ICategory,
  ICity,
  ICreateEventParams,
  IEvent,
  IPaginatedResponse,
} from "./event.interface";

export const getCategories = async (): Promise<ApiResponse<ICategory[]>> => {
  const response = await api.get<ApiResponse<ICategory[]>>("/categories");
  return response.data;
};

export const getCities = async (): Promise<ApiResponse<ICity[]>> => {
  const response = await api.get<ApiResponse<ICity[]>>("/cities");
  return response.data;
};

export const createEvent = async (
  organizerId: string,
  params: ICreateEventParams,
): Promise<ApiResponse<IEvent>> => {
  const formData = new FormData();

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
  formData.append("bannerUrl", params.bannerUrl);

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

export const getEvents = async (): Promise<IPaginatedResponse<IEvent[]>> => {
  const response = await api.get<IPaginatedResponse<IEvent[]>>("/event");
  return response.data;
};
