import type { IPaginatedResponse } from "@/api/event/event.interface";
import type { ApiResponse } from "@/interface/api.interface";
import api from "@/lib/axios";
import type {
  ITicket,
  ITicketAttendanceStats,
  ITicketCheckInResult,
  ITicketQueryParams,
} from "./ticket.interface";

export const getTickets = async (
  params?: ITicketQueryParams,
): Promise<IPaginatedResponse<ITicket[]>> => {
  const response = await api.get<IPaginatedResponse<ITicket[]>>("/tickets", {
    params,
  });

  return response.data;
};

export const getTicketAttendanceStats = async (
  eventId: string,
): Promise<ApiResponse<ITicketAttendanceStats>> => {
  const response = await api.get<ApiResponse<ITicketAttendanceStats>>(
    "/tickets/attendance-stats",
    {
      params: {
        eventId,
      },
    },
  );

  return response.data;
};

export const checkInTicket = async (
  code: string,
): Promise<ApiResponse<ITicketCheckInResult>> => {
  const response = await api.patch<ApiResponse<ITicketCheckInResult>>(
    "/tickets/check-in",
    {
      code,
    },
  );

  return response.data;
};
