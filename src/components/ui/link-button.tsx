"use client";

import Link, { type LinkProps, useLinkStatus } from "next/link";
import * as React from "react";
import {
  ButtonContent,
  buttonVariants,
  type ButtonProps,
} from "~/components/ui/button";
import { cn } from "~/lib/utils";

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

  React.useEffect(() => {
    onPendingChange(pending);
  }, [onPendingChange, pending]);

  return (
    <span
      className="inline-flex items-center gap-2"
      data-link-button-pending={pending ? "true" : "false"}
    >
      <ButtonContent
        icon={icon}
        iconPosition={iconPosition}
        loading={loading || pending}
      >
        {children}
      </ButtonContent>
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

    const handleClick = React.useCallback<
      NonNullable<React.ComponentProps<typeof Link>["onClick"]>
    >(
      (event) => {
        onClick?.(event);

        if (
          event.defaultPrevented ||
          event.button !== 0 ||
          event.metaKey ||
          event.ctrlKey ||
          event.shiftKey ||
          event.altKey
        ) {
          return;
        }

        setPressed(true);
      },
      [onClick],
    );

    const handlePendingChange = React.useCallback((pending: boolean) => {
      setLinkPending(pending);
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
