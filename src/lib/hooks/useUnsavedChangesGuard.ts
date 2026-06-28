"use client";

import { useEffect,useRef,useState } from "react";

const HISTORY_GUARD_KEY = "__sharplyUnsavedChangesGuard";

type LeaveAction = () => void;

export interface LeaveRequest {
  action: LeaveAction;
  force?: boolean;
  isDirty: boolean;
}

export interface LinkNavigationCandidate {
  altKey?: boolean;
  button?: number;
  ctrlKey?: boolean;
  currentOrigin: string;
  currentPathname?: string;
  currentSearch?: string;
  defaultPrevented?: boolean;
  download?: boolean;
  href: string | null;
  metaKey?: boolean;
  shiftKey?: boolean;
  target?: string | null;
}

export interface LeaveActionController {
  cancelLeave: () => void;
  confirmLeave: (execute: (action: LeaveAction) => void) => boolean;
  hasPendingLeave: () => boolean;
  requestLeave: ({ action, force, isDirty }: LeaveRequest) => boolean;
}

export interface UseUnsavedChangesGuardOptions {
  interceptHistory?: boolean;
  interceptLinks?: boolean;
  isDirty: boolean;
  navigate?: (href: string) => void;
}

function isGuardState(state: unknown): boolean {
  return Boolean(
    state &&
      typeof state === "object" &&
      HISTORY_GUARD_KEY in (state as Record<string, unknown>),
  );
}

export function shouldWarnBeforeUnload({
  isDirty,
  isSuppressed,
}: {
  isDirty: boolean;
  isSuppressed: boolean;
}): boolean {
  return isDirty && !isSuppressed;
}

export function getHistoryLeaveDelta(hasHistoryTrap: boolean): -1 | -2 {
  return hasHistoryTrap ? -2 : -1;
}

export function getGuardedLinkNavigationHref(
  candidate: LinkNavigationCandidate,
): string | null {
  if (candidate.defaultPrevented) return null;
  if (candidate.button !== undefined && candidate.button !== 0) return null;
  if (candidate.metaKey || candidate.ctrlKey || candidate.shiftKey || candidate.altKey) {
    return null;
  }
  if (!candidate.href) return null;
  if (candidate.download) return null;
  if (candidate.target && candidate.target !== "_self") return null;

  let destination: URL;
  try {
    destination = new URL(candidate.href, candidate.currentOrigin);
  } catch {
    return null;
  }

  if (destination.origin !== candidate.currentOrigin) return null;
  if (
    candidate.currentPathname === destination.pathname &&
    candidate.currentSearch === destination.search &&
    destination.hash.length > 0
  ) {
    return null;
  }

  return `${destination.pathname}${destination.search}${destination.hash}`;
}

export function createLeaveActionController(): LeaveActionController {
  let pendingAction: LeaveAction | null = null;

  return {
    cancelLeave() {
      pendingAction = null;
    },
    confirmLeave(execute) {
      if (!pendingAction) return false;
      const action = pendingAction;
      pendingAction = null;
      execute(action);
      return true;
    },
    hasPendingLeave() {
      return pendingAction !== null;
    },
    requestLeave({ action, force = false, isDirty }) {
      if (force || !isDirty) {
        pendingAction = null;
        return false;
      }
      pendingAction = action;
      return true;
    },
  };
}

export function useUnsavedChangesGuard({
  interceptHistory = false,
  interceptLinks = false,
  isDirty,
  navigate,
}: UseUnsavedChangesGuardOptions) {
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const controllerRef = useRef(createLeaveActionController());
  const historyTrapArmedRef = useRef(false);
  const isDirtyRef = useRef(isDirty);
  const navigateRef = useRef(navigate);
  const suppressGuardRef = useRef(false);
  const suppressNextPopstateRef = useRef(false);

  isDirtyRef.current = isDirty;
  navigateRef.current = navigate;

  const executeWithoutGuard = (action: LeaveAction) => {
    suppressGuardRef.current = true;
    try {
      action();
    } finally {
      window.setTimeout(() => {
        suppressGuardRef.current = false;
      }, 0);
    }
  };

  const requestLeave = (action: LeaveAction, opts?: { force?: boolean }) => {
    const shouldConfirm = controllerRef.current.requestLeave({
      action,
      force: opts?.force,
      isDirty: isDirtyRef.current && !suppressGuardRef.current,
    });

    if (shouldConfirm) {
      setIsConfirmOpen(true);
      return false;
    }

    setIsConfirmOpen(false);
    executeWithoutGuard(action);
    return true;
  };

  const confirmLeave = () => {
    const executed = controllerRef.current.confirmLeave(executeWithoutGuard);
    setIsConfirmOpen(false);
    return executed;
  };

  const cancelLeave = () => {
    controllerRef.current.cancelLeave();
    setIsConfirmOpen(false);
  };

  const leaveByHistoryBack = () => {
    suppressNextPopstateRef.current = true;
    window.history.go(getHistoryLeaveDelta(historyTrapArmedRef.current));
  };

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (
        !shouldWarnBeforeUnload({
          isDirty: isDirtyRef.current,
          isSuppressed: suppressGuardRef.current,
        })
      ) {
        return;
      }

      event.preventDefault();
      event.returnValue = "";
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || !interceptHistory) return;
    if (!isDirty) {
      if (!historyTrapArmedRef.current) return;

      suppressGuardRef.current = true;
      suppressNextPopstateRef.current = true;
      historyTrapArmedRef.current = false;
      window.history.back();
      window.setTimeout(() => {
        suppressGuardRef.current = false;
        suppressNextPopstateRef.current = false;
      }, 0);
      return;
    }

    if (historyTrapArmedRef.current) return;

    window.history.pushState({ [HISTORY_GUARD_KEY]: true }, "", window.location.href);
    historyTrapArmedRef.current = true;
    return () => {
      if (
        !historyTrapArmedRef.current ||
        !isGuardState(window.history.state)
      ) {
        return;
      }

      suppressGuardRef.current = true;
      suppressNextPopstateRef.current = true;
      historyTrapArmedRef.current = false;
      window.history.back();
      window.setTimeout(() => {
        suppressGuardRef.current = false;
        suppressNextPopstateRef.current = false;
      }, 0);
    };
  }, [interceptHistory, isDirty]);

  useEffect(() => {
    if (typeof window === "undefined" || !interceptHistory) return;

    const handlePopState = (event: PopStateEvent) => {
      if (suppressNextPopstateRef.current) {
        suppressNextPopstateRef.current = false;
        historyTrapArmedRef.current = isGuardState(event.state);
        return;
      }

      if (suppressGuardRef.current) {
        return;
      }

      if (!isDirtyRef.current || !historyTrapArmedRef.current) {
        historyTrapArmedRef.current = isGuardState(event.state);
        return;
      }

      controllerRef.current.requestLeave({
        action: leaveByHistoryBack,
        force: false,
        isDirty: true,
      });
      setIsConfirmOpen(true);
      window.history.pushState({ [HISTORY_GUARD_KEY]: true }, "", window.location.href);
      historyTrapArmedRef.current = true;
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [interceptHistory]);

  useEffect(() => {
    if (typeof document === "undefined" || !interceptLinks) return;

    const handleDocumentClick = (event: MouseEvent) => {
      if (!isDirtyRef.current || suppressGuardRef.current) return;

      const target = event.target;
      if (!(target instanceof Element)) return;

      const anchor = target.closest("a");
      if (!(anchor instanceof HTMLAnchorElement)) return;

      const href = getGuardedLinkNavigationHref({
        altKey: event.altKey,
        button: event.button,
        ctrlKey: event.ctrlKey,
        currentOrigin: window.location.origin,
        currentPathname: window.location.pathname,
        currentSearch: window.location.search,
        defaultPrevented: event.defaultPrevented,
        download: anchor.hasAttribute("download"),
        href: anchor.href,
        metaKey: event.metaKey,
        shiftKey: event.shiftKey,
        target: anchor.getAttribute("target"),
      });

      if (!href) return;

      event.preventDefault();
      requestLeave(() => {
        const routerNavigate = navigateRef.current;
        if (routerNavigate) {
          routerNavigate(href);
          return;
        }
        window.location.assign(href);
      });
    };

    document.addEventListener("click", handleDocumentClick, true);
    return () => document.removeEventListener("click", handleDocumentClick, true);
  }, [interceptLinks]);

  return {
    cancelLeave,
    confirmLeave,
    isConfirmOpen,
    leaveByHistoryBack,
    requestLeave,
  };
}
