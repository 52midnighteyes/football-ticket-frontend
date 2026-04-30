import { optimizeCloudinaryImage } from "@/lib/cloudinary";
import { cn } from "@/lib/utils";

interface EventBannerProps {
  src?: string | null;
  alt: string;
  placeholder: string;
  className?: string;
  imageClassName?: string;
  width?: number;
  height?: number;
}

export default function EventBanner({
  src,
  alt,
  placeholder,
  className,
  imageClassName,
  width = 1280,
  height = 720,
}: EventBannerProps) {
  return (
    <div className={cn("aspect-video overflow-hidden bg-muted/30", className)}>
      {src ? (
        <img
          src={optimizeCloudinaryImage(src, {
            width,
            height,
            crop: "fill",
          })}
          alt={alt}
          className={cn("h-full w-full object-cover", imageClassName)}
        />
      ) : (
        <div className="flex h-full items-center justify-center bg-linear-to-br from-primary/12 via-card to-accent/10 px-6 py-8 text-center text-sm text-muted-foreground">
          {placeholder}
        </div>
      )}
    </div>
  );
}
