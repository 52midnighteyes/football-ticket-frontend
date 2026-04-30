import { useCallback, useEffect, useState } from "react";
import { getEventById } from "@/api/event/event.api";
import { getMyTransactions } from "@/api/transaction/transaction.api";
import type {
  IEnrichedTransaction,
  TransactionStatus,
} from "@/api/transaction/transaction.interface";
import { enrichTransactions, getTransactionErrorMessage } from "@/pages/transaction/transaction.utils";

export function useTransactions(status?: TransactionStatus, enabled: boolean = true) {
  const [transactions, setTransactions] = useState<IEnrichedTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadTransactions = useCallback(async () => {
    if (!enabled) {
      setIsLoading(false);
      setErrorMessage(null);
      setTransactions([]);
      return;
    }

    try {
      setIsLoading(true);
      setErrorMessage(null);

      const response = await getMyTransactions(status ? { status } : undefined);
      const rows = response.data ?? [];
      const eventIds = [
        ...new Set(
          rows
            .filter((transaction) => !transaction.event)
            .map((transaction) => transaction.eventId),
        ),
      ];

      const eventEntries = await Promise.all(
        eventIds.map(async (eventId) => {
          try {
            const eventResponse = await getEventById(eventId);
            return [eventId, eventResponse.data ?? null] as const;
          } catch {
            return [eventId, null] as const;
          }
        }),
      );

      const eventMap = Object.fromEntries(eventEntries);

      setTransactions(enrichTransactions(rows, eventMap));
    } catch (error) {
      setTransactions([]);
      setErrorMessage(getTransactionErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  }, [enabled, status]);

  useEffect(() => {
    void loadTransactions();
  }, [loadTransactions]);

  return {
    transactions,
    isLoading,
    errorMessage,
    reload: loadTransactions,
  };
}
