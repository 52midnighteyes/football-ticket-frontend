import { useEffect, useMemo, useState } from "react";
import { ImagePlusIcon, Loader2Icon, LandmarkIcon, UploadIcon } from "lucide-react";
import {
  uploadTransactionPaymentProof,
} from "@/api/transaction/transaction.api";
import type { IEnrichedTransaction } from "@/api/transaction/transaction.interface";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getTransactionErrorMessage } from "@/pages/transaction/transaction.utils";
import { toast } from "sonner";

interface UploadPaymentProofDialogProps {
  transaction: IEnrichedTransaction;
  onUploaded: () => Promise<void> | void;
}

export function UploadPaymentProofDialog({
  transaction,
  onUploaded,
}: UploadPaymentProofDialogProps) {
  const [open, setOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [localPreviewUrl, setLocalPreviewUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!selectedFile) {
      setLocalPreviewUrl(null);
      return;
    }

    const objectUrl = URL.createObjectURL(selectedFile);
    setLocalPreviewUrl(objectUrl);

    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [selectedFile]);

  const previewUrl = useMemo(
    () => localPreviewUrl ?? transaction.paymentProofUrl ?? null,
    [localPreviewUrl, transaction.paymentProofUrl],
  );

  async function handleSubmit() {
    if (!selectedFile) {
      toast.error("Choose an image before uploading your payment proof.");
      return;
    }

    try {
      setIsSubmitting(true);

      const formData = new FormData();
      formData.append("paymentProof", selectedFile);

      const response = await uploadTransactionPaymentProof(transaction.id, formData);
      toast.success(response.message || "Payment proof uploaded successfully.");
      await onUploaded();
      setOpen(false);
      setSelectedFile(null);
    } catch (error) {
      toast.error(getTransactionErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (!nextOpen) {
          setSelectedFile(null);
        }
      }}
    >
      <DialogTrigger asChild>
        <Button
          type="button"
          className="w-full rounded-xl bg-linear-to-r from-primary to-accent text-primary-foreground shadow-sm hover:opacity-95"
        >
          <UploadIcon className="mr-2 h-4 w-4" />
          Upload payment proof
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-xl">
        <DialogHeader className="space-y-2">
          <DialogTitle>Upload your payment proof</DialogTitle>
          <DialogDescription className="leading-6">
            Upload a transfer receipt image for this order. After a successful upload,
            the transaction will move to waiting for admin confirmation and the review
            deadline will shift to the new 3-hour follow-up window.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          <div className="rounded-3xl border border-primary/15 bg-linear-to-br from-primary/8 via-card to-accent/10 p-5">
            <div className="flex items-start gap-3">
              <div className="rounded-2xl bg-primary/10 p-2 text-primary">
                <LandmarkIcon className="h-5 w-5" />
              </div>
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">
                    Transfer your payment to this bank account
                  </p>
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                  <BankInfo label="Bank" value="Bank Central Asia" />
                  <BankInfo label="Name" value="MatchPass Football Org" />
                  <BankInfo label="Rekening" value="4567891011" />
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor={`payment-proof-${transaction.id}`}>Payment proof image</Label>
            <Input
              id={`payment-proof-${transaction.id}`}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="cursor-pointer"
              disabled={isSubmitting}
              onChange={(event) => {
                const file = event.currentTarget.files?.[0] ?? null;
                setSelectedFile(file);
              }}
            />
            <p className="text-xs leading-5 text-muted-foreground">
              Use JPG, PNG, or WEBP. This upload is only available while the transaction
              is still waiting for payment.
            </p>
          </div>

          <div className="space-y-3">
            <p className="text-sm font-medium text-foreground">Preview</p>
            {previewUrl ? (
              <div className="overflow-hidden rounded-3xl border border-border/80 bg-muted/20">
                <div className="aspect-[16/10] w-full">
                  <img
                    src={previewUrl}
                    alt="Payment proof preview"
                    className="h-full w-full object-cover"
                  />
                </div>
              </div>
            ) : (
              <div className="flex aspect-[16/10] items-center justify-center rounded-3xl border border-dashed border-border/80 bg-muted/20 px-6 text-center">
                <div className="space-y-2 text-muted-foreground">
                  <ImagePlusIcon className="mx-auto h-6 w-6" />
                  <p className="text-sm">
                    Choose a payment proof image to preview it here before upload.
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              disabled={isSubmitting}
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              disabled={!selectedFile || isSubmitting}
              onClick={() => void handleSubmit()}
              className="bg-linear-to-r from-primary to-accent text-primary-foreground hover:opacity-95"
            >
              {isSubmitting ? (
                <>
                  <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <UploadIcon className="mr-2 h-4 w-4" />
                  Upload proof
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function BankInfo({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border/70 bg-background/80 px-4 py-3">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-2 break-words text-sm font-semibold leading-6 text-foreground">
        {value}
      </p>
    </div>
  );
}
