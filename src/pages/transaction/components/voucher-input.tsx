import {
  BadgePercentIcon,
  CheckCircle2Icon,
  CircleAlertIcon,
  Loader2Icon,
} from "lucide-react";
import type { ITransactionVoucher } from "@/api/transaction/transaction.interface";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatRupiah } from "@/pages/transaction/transaction.utils";
import type { VoucherValidationState } from "@/pages/transaction/hooks/use-voucher-validation";

interface VoucherInputProps {
  value: string;
  onChange: (value: string) => void;
  state: VoucherValidationState;
  voucher: ITransactionVoucher | null;
  errorMessage: string | null;
  disabled?: boolean;
}

export function VoucherInput({
  value,
  onChange,
  state,
  voucher,
  errorMessage,
  disabled = false,
}: VoucherInputProps) {
  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <Label htmlFor="voucherCode">Voucher code</Label>
        <p className="text-sm text-muted-foreground">
          Type one voucher code for this event. We will validate it before you
          submit.
        </p>
      </div>

      <div className="relative">
        <BadgePercentIcon className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          id="voucherCode"
          value={value}
          onChange={(event) => onChange(event.target.value.toUpperCase())}
          placeholder="EARLYBIRD10"
          disabled={disabled}
          className="h-11 rounded-xl bg-background pl-9 text-sm"
        />
      </div>

      <div className="rounded-xl border border-border bg-muted/40 px-3 py-2 text-sm">
        {state === "idle" ? (
          <p className="text-muted-foreground">
            Voucher validation will start once you type a code.
          </p>
        ) : null}

        {state === "checking" ? (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2Icon className="h-4 w-4 animate-spin" />
            <span>Checking voucher availability...</span>
          </div>
        ) : null}

        {state === "valid" && voucher ? (
          <div className="flex items-start gap-2 text-accent">
            <CheckCircle2Icon className="mt-0.5 h-4 w-4 shrink-0" />
            <div>
              <p className="font-medium">Voucher applied successfully.</p>
              <p className="text-sm text-muted-foreground">
                Discount: {formatRupiah(voucher.amount)}
              </p>
            </div>
          </div>
        ) : null}

        {state === "invalid" ? (
          <div className="flex items-start gap-2 text-destructive">
            <CircleAlertIcon className="mt-0.5 h-4 w-4 shrink-0" />
            <p>{errorMessage ?? "That voucher is not valid for this event."}</p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
