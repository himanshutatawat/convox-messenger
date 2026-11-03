/**
 * Appends Cloudinary on-the-fly transformations for auto format (WebP/AVIF),
 * auto compression quality, and responsive width constraints.
 */
export function optimizeCloudinaryUrl(
  url?: string | null,
  width?: number
): string {
  if (!url) return "/images/avatar-placeholder.png";

  // Only apply to Cloudinary assets that don't already have transforms
  if (!url.includes("res.cloudinary.com") || url.includes("/f_auto,q_auto")) {
    return url;
  }

  const transform = width ? `f_auto,q_auto,w_${width}` : "f_auto,q_auto";
  return url.replace("/image/upload/", `/image/upload/${transform}/`);
}

