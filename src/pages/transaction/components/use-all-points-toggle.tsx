import { CoinsIcon } from "lucide-react";
import { formatRupiah } from "@/pages/transaction/transaction.utils";

interface UseAllPointsToggleProps {
  checked: boolean;
  availablePoints: number;
  disabled?: boolean;
  isLoading?: boolean;
  errorMessage?: string | null;
  onRetry?: () => void;
  onCheckedChange: (checked: boolean) => void;
}

export function UseAllPointsToggle({
  checked,
  availablePoints,
  disabled = false,
  isLoading = false,
  errorMessage = null,
  onRetry,
  onCheckedChange,
}: UseAllPointsToggleProps) {
  if (isLoading) {
    return (
      <div className="flex w-full items-start gap-3 rounded-2xl border border-border bg-muted/20 px-4 py-4 text-left">
        <div className="mt-0.5 rounded-full bg-accent/10 p-2 text-accent">
          <CoinsIcon className="h-4 w-4" />
        </div>
        <div>
          <p className="font-semibold">Loading available points</p>
          <p className="text-sm text-muted-foreground">
            Checking how many active points can be used for this transaction.
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Points expire 3 months after they are earned.
          </p>
        </div>
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div className="flex w-full items-start justify-between gap-4 rounded-2xl border border-destructive/20 bg-destructive/6 px-4 py-4 text-left">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 rounded-full bg-destructive/10 p-2 text-destructive">
            <CoinsIcon className="h-4 w-4" />
          </div>
          <div>
            <p className="font-semibold text-destructive">
              Points unavailable right now
            </p>
            <p className="text-sm text-muted-foreground">{errorMessage}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Points expire 3 months after they are earned.
            </p>
          </div>
        </div>
        {onRetry ? (
          <button
            type="button"
            onClick={onRetry}
            className="shrink-0 text-sm font-medium text-destructive underline-offset-4 hover:underline"
          >
            Retry
          </button>
        ) : null}
      </div>
    );
  }

  const noPointsAvailable = availablePoints <= 0;

  return (
    <button
      type="button"
      onClick={() => {
        if (!disabled && !noPointsAvailable) {
          onCheckedChange(!checked);
        }
      }}
      disabled={disabled || noPointsAvailable}
      className={`flex w-full items-start justify-between gap-4 rounded-2xl border px-4 py-4 text-left transition ${
        checked
          ? "border-accent bg-accent/8"
          : "border-border bg-card hover:border-accent/40"
      } disabled:cursor-not-allowed disabled:opacity-60`}
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5 rounded-full bg-accent/10 p-2 text-accent">
          <CoinsIcon className="h-4 w-4" />
        </div>
        <div>
          <p className="font-semibold">Use all available points</p>
          <p className="text-sm text-muted-foreground">
            {noPointsAvailable
              ? "No points available in your account right now."
              : `Available points: ${formatRupiah(availablePoints)}`}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Points expire 3 months after they are earned.
          </p>
        </div>
      </div>

      <span
        className={`mt-0.5 inline-flex h-6 w-11 shrink-0 items-center rounded-full border p-0.5 transition ${
          checked
            ? "border-accent bg-accent"
            : "border-border bg-muted"
        }`}
        aria-hidden="true"
      >
        <span
          className={`block h-4.5 w-4.5 rounded-full bg-white transition ${
            checked ? "translate-x-5" : "translate-x-0"
          }`}
        />
      </span>
    </button>
  );
}
