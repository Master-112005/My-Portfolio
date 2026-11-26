import { useScroll } from "framer-motion";
import { useRef } from "react";

export function useElementScrollProgress<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  return {
    ref,
    scrollYProgress,
  };
}
