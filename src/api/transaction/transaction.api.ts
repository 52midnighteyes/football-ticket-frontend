import type { ApiResponse } from "@/interface/api.interface";
import api from "@/lib/axios";
import type { IPaginatedResponse } from "@/api/event/event.interface";
import type {
  IOrganizerRevenueAnalytics,
  IOrganizerRevenueQueryParams,
  ITransactionAvailablePoints,
  ICreateTransactionParams,
  IOrganizerTransaction,
  IOrganizerTransactionQueryParams,
  ITransactionPaymentProofUpdate,
  ITransaction,
  ITransactionQueryParams,
  ITransactionStatusUpdateParams,
  ITransactionStatusUpdateResponse,
  ITransactionVoucher,
  IUserCoupon,
} from "./transaction.interface";

export const createTransaction = async (
  params: ICreateTransactionParams,
): Promise<ApiResponse<ITransaction>> => {
  const response = await api.post<ApiResponse<ITransaction>>(
    "/transactions",
    params,
  );

  return response.data;
};

export const getMyTransactions = async (
  params?: ITransactionQueryParams,
): Promise<ApiResponse<ITransaction[]>> => {
  const response = await api.get<ApiResponse<ITransaction[]>>(
    "/transactions/me",
    {
      params,
    },
  );

  return response.data;
};

export const getOrganizerTransactions = async (
  params?: IOrganizerTransactionQueryParams,
): Promise<IPaginatedResponse<IOrganizerTransaction[]>> => {
  const response = await api.get<IPaginatedResponse<IOrganizerTransaction[]>>(
    "/transactions/organizer/me",
    {
      params,
    },
  );

  return response.data;
};

export const getOrganizerRevenue = async (
  params?: IOrganizerRevenueQueryParams,
): Promise<ApiResponse<IOrganizerRevenueAnalytics>> => {
  const response = await api.get<ApiResponse<IOrganizerRevenueAnalytics>>(
    "/transactions/organizer/revenue",
    {
      params,
    },
  );

  return response.data;
};

export const checkTransactionVoucher = async (
  eventId: string,
  code: string,
): Promise<ApiResponse<ITransactionVoucher>> => {
  const response = await api.get<ApiResponse<ITransactionVoucher>>(
    "/transactions/vouchers/check",
    {
      params: {
        eventId,
        code,
      },
    },
  );

  return response.data;
};

export const getMyCoupons = async (): Promise<ApiResponse<IUserCoupon[]>> => {
  const response = await api.get<ApiResponse<IUserCoupon[]>>(
    "/transactions/coupons/me",
  );

  return response.data;
};

export const getMyAvailablePoints = async (): Promise<
  ApiResponse<ITransactionAvailablePoints>
> => {
  const response = await api.get<ApiResponse<ITransactionAvailablePoints>>(
    "/transactions/points/me",
  );

  return response.data;
};

export const uploadTransactionPaymentProof = async (
  transactionId: string,
  formData: FormData,
): Promise<ApiResponse<ITransactionPaymentProofUpdate>> => {
  const response = await api.patch<ApiResponse<ITransactionPaymentProofUpdate>>(
    `/transactions/${transactionId}/payment-proof`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    },
  );

  return response.data;
};

export const updateTransactionStatus = async (
  transactionId: string,
  params: ITransactionStatusUpdateParams,
): Promise<ApiResponse<ITransactionStatusUpdateResponse>> => {
  const response = await api.patch<ApiResponse<ITransactionStatusUpdateResponse>>(
    `/transactions/${transactionId}/status`,
    params,
  );

  return response.data;
};
