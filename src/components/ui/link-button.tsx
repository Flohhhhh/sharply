"use client";

import Link, { type LinkProps, useLinkStatus } from "next/link";
import * as React from "react";
import { Loader2 } from "lucide-react";
import { buttonVariants, type ButtonProps } from "~/components/ui/button";
import { cn } from "~/lib/utils";

export const LINK_BUTTON_PRESS_RESET_MS = 1500;

type LinkButtonClickEvent = Pick<
  React.MouseEvent<HTMLAnchorElement>,
  | "altKey"
  | "button"
  | "ctrlKey"
  | "defaultPrevented"
  | "metaKey"
  | "shiftKey"
  | "currentTarget"
>;

export function shouldStartLinkButtonPressedState(
  event: LinkButtonClickEvent,
) {
  if (
    event.defaultPrevented ||
    event.button !== 0 ||
    event.metaKey ||
    event.ctrlKey ||
    event.shiftKey ||
    event.altKey
  ) {
    return false;
  }

  const target = event.currentTarget.target?.toLowerCase();
  if (target && target !== "_self") {
    return false;
  }

  return !event.currentTarget.download;
}

export function createLinkButtonPressedResetTimer(
  onReset: () => void,
  timeoutMs = LINK_BUTTON_PRESS_RESET_MS,
) {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  return {
    clear() {
      if (!timeoutId) {
        return;
      }

      clearTimeout(timeoutId);
      timeoutId = undefined;
    },
    schedule() {
      this.clear();
      timeoutId = setTimeout(() => {
        timeoutId = undefined;
        onReset();
      }, timeoutMs);
    },
  };
}

type LinkButtonProps = Omit<
  React.ComponentProps<typeof Link>,
  keyof LinkProps | "className" | "children"
> &
  LinkProps &
  Pick<
    ButtonProps,
    "children" | "className" | "icon" | "iconPosition" | "loading" | "size" | "variant"
  >;

function LinkButtonPendingContent({
  children,
  icon,
  iconPosition,
  loading,
  onPendingChange,
}: Pick<ButtonProps, "children" | "icon" | "iconPosition" | "loading"> & {
  onPendingChange: (pending: boolean) => void;
}) {
  const { pending } = useLinkStatus();
  const iconElement = loading || pending ? (
    <Loader2 className="size-4 animate-spin" />
  ) : (
    icon
  );

  React.useEffect(() => {
    onPendingChange(pending);
  }, [onPendingChange, pending]);

  return (
    <span
      className="inline-flex items-center gap-2"
      data-link-button-pending={pending ? "true" : "false"}
    >
      {(loading || pending || icon) && iconPosition === "left" && iconElement}
      {children}
      {(loading || pending || icon) && iconPosition === "right" && iconElement}
    </span>
  );
}

const LinkButton = React.forwardRef<HTMLAnchorElement, LinkButtonProps>(
  (
    {
      children,
      className,
      icon,
      iconPosition = "left",
      loading = false,
      onClick,
      size,
      variant,
      ...props
    },
    ref,
  ) => {
    const [linkPending, setLinkPending] = React.useState(false);
    const [pressed, setPressed] = React.useState(false);
    const isPending = loading || linkPending || pressed;
    const pressedResetTimerRef = React.useRef<
      ReturnType<typeof createLinkButtonPressedResetTimer> | null
    >(null);

    if (pressedResetTimerRef.current === null) {
      pressedResetTimerRef.current = createLinkButtonPressedResetTimer(() => {
        setPressed(false);
      });
    }

    React.useEffect(() => {
      return () => {
        pressedResetTimerRef.current?.clear();
      };
    }, []);

    const handleClick = React.useCallback<
      NonNullable<React.ComponentProps<typeof Link>["onClick"]>
    >(
      (event) => {
        onClick?.(event);

        if (!shouldStartLinkButtonPressedState(event)) {
          return;
        }

        setPressed(true);
        pressedResetTimerRef.current?.schedule();
      },
      [onClick],
    );

    const handlePendingChange = React.useCallback((pending: boolean) => {
      setLinkPending(pending);
      if (pending) {
        pressedResetTimerRef.current?.clear();
        return;
      }

      pressedResetTimerRef.current?.clear();
      if (!pending) {
        setPressed(false);
      }
    }, []);

    return (
      <Link
        ref={ref}
        aria-disabled={isPending ? "true" : undefined}
        className={cn(
          buttonVariants({ variant, size, className }),
          isPending && "pointer-events-none",
        )}
        data-link-button-root="true"
        data-link-button-loading={isPending ? "true" : "false"}
        onClick={handleClick}
        {...props}
      >
        <LinkButtonPendingContent
          icon={icon}
          iconPosition={iconPosition}
          loading={loading}
          onPendingChange={handlePendingChange}
        >
          {children}
        </LinkButtonPendingContent>
      </Link>
    );
  },
);

LinkButton.displayName = "LinkButton";

export { LinkButton };
