import { useEffect, useState } from "react";
import {
  checkTransactionVoucher,
} from "@/api/transaction/transaction.api";
import type { ITransactionVoucher } from "@/api/transaction/transaction.interface";
import { useDebounce } from "@/hook/useDebounce";
import { getTransactionErrorMessage } from "@/pages/transaction/transaction.utils";

export type VoucherValidationState = "idle" | "checking" | "valid" | "invalid";

export function useVoucherValidation(eventId: string, code: string) {
  const debouncedCode = useDebounce(code.trim(), 500);
  const isIdle = !eventId || debouncedCode.length === 0;
  const [state, setState] = useState<VoucherValidationState>("idle");
  const [voucher, setVoucher] = useState<ITransactionVoucher | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isIdle) {
      return;
    }

    let isCancelled = false;

    const validateVoucher = async () => {
      try {
        setState("checking");
        setErrorMessage(null);
        const response = await checkTransactionVoucher(eventId, debouncedCode);

        if (isCancelled) {
          return;
        }

        if (!response.data) {
          setState("invalid");
          setVoucher(null);
          setErrorMessage("We couldn't validate that voucher just now.");
          return;
        }

        setState("valid");
        setVoucher(response.data);
        setErrorMessage(null);
      } catch (error) {
        if (isCancelled) {
          return;
        }

        setState("invalid");
        setVoucher(null);
        setErrorMessage(getTransactionErrorMessage(error));
      }
    };

    void validateVoucher();

    return () => {
      isCancelled = true;
    };
  }, [debouncedCode, eventId, isIdle]);

  return {
    state: isIdle ? "idle" : state,
    voucher: isIdle ? null : voucher,
    errorMessage: isIdle ? null : errorMessage,
    debouncedCode,
  };
}
