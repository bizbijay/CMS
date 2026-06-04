import { useCulture } from "../context/CultureContext";

/** Returns the translation dictionary for the current locale. */
export function useT() {
  return useCulture().t;
}
