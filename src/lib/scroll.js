import { useScroll } from "framer-motion";
import { useRef } from "react";
export function useElementScrollProgress() {
    const ref = useRef(null);
    const { scrollYProgress } = useScroll({
        target: ref,
        offset: ["start end", "end start"],
    });
    return {
        ref,
        scrollYProgress,
    };
}
