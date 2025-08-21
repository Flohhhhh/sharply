"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { getFooterItems } from "~/lib/nav-items";

interface NavSheetDesktopProps {
  children: React.ReactNode;
  topClass: string; // e.g., "top-16 h-[calc(100vh-4rem)]" or "top-24 h-[calc(100vh-6rem)]"
}

export function NavSheetDesktop({ children, topClass }: NavSheetDesktopProps) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const footerItems = useMemo(() => getFooterItems(), []);
  const mountRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    mountRef.current = document.body;
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  function handleNavigate(href: string) {
    setOpen(false);
    router.push(href);
  }

  return (
    <>
      <span onClick={() => setOpen((v) => !v)} className="inline-flex">
        {children}
      </span>
      {mountRef.current &&
        createPortal(
          <>
            {/* Overlay */}
            <div
              onClick={() => setOpen(false)}
              className={
                open
                  ? "fixed inset-0 z-[60] opacity-100 transition-opacity ease-out"
                  : "pointer-events-none fixed inset-0 z-[60] opacity-0 transition-opacity ease-in"
              }
            />

            {/* Content */}
            <div
              role="dialog"
              aria-modal="true"
              className={`fixed inset-x-0 ${topClass} pointer-events-none z-[61]`}
            >
              <div
                className={
                  (open ? "scale-y-100" : "pointer-events-none scale-y-0") +
                  " pointer-events-auto w-full origin-top transform-gpu transition-transform duration-200 ease-out"
                }
              >
                <div className="bg-background border-b shadow-md">
                  <div className="px-4 pt-4 pb-6 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
                      {footerItems.sections.map((section, idx) => (
                        <div key={idx}>
                          <h3 className="text-foreground mb-3 text-sm font-semibold tracking-wide uppercase">
                            {section.title}
                          </h3>
                          <ul className="text-muted-foreground space-y-2 text-sm">
                            {section.links.map((l, i) => (
                              <li key={i}>
                                <button
                                  onClick={() => handleNavigate(l.href)}
                                  className="hover:text-foreground transition-colors"
                                >
                                  {l.name}
                                </button>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                      {/* More column */}
                      <div>
                        <h3 className="text-foreground mb-3 text-sm font-semibold tracking-wide uppercase">
                          More
                        </h3>
                        <ul className="text-muted-foreground space-y-2 text-sm">
                          {footerItems.bottomLinks.map((l, i) => (
                            <li key={i}>
                              <button
                                onClick={() => handleNavigate(l.href)}
                                className="hover:text-foreground transition-colors"
                              >
                                {l.name}
                              </button>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>,
          mountRef.current,
        )}
    </>
  );
}
