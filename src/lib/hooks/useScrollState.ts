import { useEffect,useLayoutEffect,useState } from "react";

const useIsomorphicLayoutEffect =
  typeof window === "undefined" ? useEffect : useLayoutEffect;

export function useScrollState(threshold: number = 0) {
  const [hasScrolled, setHasScrolled] = useState(false);

  useIsomorphicLayoutEffect(() => {
    const handleScroll = () => {
      setHasScrolled(window.scrollY > threshold);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [threshold]);

  return { hasScrolled };
}
