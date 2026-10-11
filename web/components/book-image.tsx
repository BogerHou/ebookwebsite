import type { ImgHTMLAttributes } from "react";
import { getResponsiveBookImage } from "@/lib/responsive-book-images";

export type BookImageProps = Omit<ImgHTMLAttributes<HTMLImageElement>, "src" | "srcSet" | "width" | "height" | "alt"> & {
  src: string;
  width: number;
  height: number;
  alt: string;
  preload?: boolean;
  priority?: boolean;
};

export function BookImage({ src, width, height, alt, sizes, preload = false, priority = false,
  loading, fetchPriority, decoding = "async", ...props }: BookImageProps) {
  const important = preload || priority;
  const responsive = getResponsiveBookImage(src, width, height);
  return <img {...props} {...responsive} width={width} height={height} alt={alt} sizes={sizes}
    loading={important ? "eager" : loading || "lazy"}
    fetchPriority={important ? "high" : fetchPriority} decoding={decoding} />;
}

export default BookImage;
