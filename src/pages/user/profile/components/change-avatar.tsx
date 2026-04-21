import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import ChangeAvatarForm from "./upload-avatar-form";
import { useState } from "react";

export default function ChangeAvatar() {
  const [open, setOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const handlePreview = (previewUrl: string) => {
    setPreviewUrl(previewUrl);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (!nextOpen) {
          setPreviewUrl(null);
        }
      }}
    >
      <DialogTrigger asChild onClick={() => handlePreview("")}>
        <Button variant="outline" type="button">
          Change Avatar
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex justify-center font-semibold">
            Upload Your Avatar
          </DialogTitle>
          <div className="flex flex-col items-center text-sm text-muted-foreground">
            {previewUrl ? (
              <div className="rounded-full mb-2 max-w-30 w-full overflow-hidden aspect-square ">
                <img
                  className="max-w-40 w-full h-full max-h-40 object-cover"
                  src={previewUrl}
                />
              </div>
            ) : null}
            <ChangeAvatarForm
              handlePreview={handlePreview}
              onSuccess={() => {
                setOpen(false);
                setPreviewUrl(null);
              }}
            />
          </div>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
}
