import { useEffect, useMemo, useState } from "react";

function formatCountdown(milliseconds: number) {
  const totalSeconds = Math.max(Math.floor(milliseconds / 1000), 0);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return `${days}d ${String(hours).padStart(2, "0")}h ${String(
    minutes,
  ).padStart(2, "0")}m ${String(seconds).padStart(2, "0")}s`;
}

export function useTransactionCountdown(
  expiredAt: string | null,
  isActive: boolean = true,
) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!expiredAt || !isActive) {
      return;
    }

    const timer = window.setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => {
      window.clearInterval(timer);
    };
  }, [expiredAt, isActive]);

  return useMemo(() => {
    if (!isActive) {
      return {
        isExpired: false,
        remainingMilliseconds: null,
        label: "Timer stopped",
      };
    }

    if (!expiredAt) {
      return {
        isExpired: false,
        remainingMilliseconds: null,
        label: "No expiry",
      };
    }

    const remainingMilliseconds = new Date(expiredAt).getTime() - now;

    if (remainingMilliseconds <= 0) {
      return {
        isExpired: true,
        remainingMilliseconds: 0,
        label: "Expired",
      };
    }

    return {
      isExpired: false,
      remainingMilliseconds,
      label: formatCountdown(remainingMilliseconds),
    };
  }, [expiredAt, isActive, now]);
}
