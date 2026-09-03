"use client";

import { useEffect,useState } from "react";

export function ScrollFadeGrid({ children }: { children: React.ReactNode }) {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const updateScrollState = () => setIsScrolled(window.scrollY > 24);

    updateScrollState();
    window.addEventListener("scroll", updateScrollState, { passive: true });

    return () => window.removeEventListener("scroll", updateScrollState);
  }, []);

  return (
    <div
      data-scrolled={isScrolled}
      className="group/scroll-fade relative w-full"
    >
      {children}
    </div>
  );
}
