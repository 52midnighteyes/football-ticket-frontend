type CloudinaryImageOptions = {
  width?: number;
  height?: number;
  crop?: "fill" | "fit" | "limit" | "pad" | "fill_pad";
  gravity?: string;
  quality?: string | number;
  format?: string;
  dpr?: string | number;
};

const CLOUDINARY_IMAGE_UPLOAD_SEGMENT = "/image/upload/";

export function optimizeCloudinaryImage(
  url: string,
  options: CloudinaryImageOptions = {},
) {
  if (!url.includes(CLOUDINARY_IMAGE_UPLOAD_SEGMENT)) {
    return url;
  }

  const [baseUrl, assetPath] = url.split(CLOUDINARY_IMAGE_UPLOAD_SEGMENT);

  if (!assetPath) {
    return url;
  }

  const [firstSegment] = assetPath.split("/");

  if (!firstSegment || !/^v\d+$/.test(firstSegment)) {
    return url;
  }

  const transformations = [
    `f_${options.format ?? "auto"}`,
    `q_${options.quality ?? "auto"}`,
    `dpr_${options.dpr ?? "auto"}`,
    options.width ? `w_${options.width}` : null,
    options.height ? `h_${options.height}` : null,
    options.crop
      ? `c_${options.crop}`
      : options.width || options.height
        ? `c_${options.width && options.height ? "fill" : "limit"}`
        : null,
    options.gravity ? `g_${options.gravity}` : null,
  ].filter(Boolean);

  if (!transformations.length) {
    return url;
  }

  return `${baseUrl}${CLOUDINARY_IMAGE_UPLOAD_SEGMENT}${transformations.join(",")}/${assetPath}`;
}
