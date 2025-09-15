import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

// export const YT_REGEX = /^(?:(?:https?:)?\/\/)?(?:www\.)?(?:m\.)?(?:youtu(?:be)?\.com\/(?:v\/|embed\/|watch(?:\/|\?v=))|youtu\.be\/)((?:\w|-){11})(?:\S+)?$/;
export const YT_REGEX =
  /(?:https?:\/\/)?(?:www\.)?(?:m\.)?(?:youtube\.com\/(?:.*[?&]v=|(?:v|embed)\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})(?:[?&\s][^ ]*)?/;

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
