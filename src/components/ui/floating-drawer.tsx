"use client";

import * as React from "react";
import { Drawer as DrawerPrimitive } from "vaul";

import { cn } from "~/lib/utils";

function FloatingDrawer({
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Root>) {
  // Vaul 1.1.2 keeps `modal` in its own context but does not forward it to
  // Radix Dialog.Root. Clone the returned root element so non-modal drawers
  // do not install Radix's document scroll lock.
  const root = DrawerPrimitive.Root(props);

  return React.cloneElement(root, { modal: props.modal });
}

function FloatingDrawerTrigger({
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Trigger>) {
  return (
    <DrawerPrimitive.Trigger data-slot="floating-drawer-trigger" {...props} />
  );
}

function FloatingDrawerPortal({
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Portal>) {
  return (
    <DrawerPrimitive.Portal data-slot="floating-drawer-portal" {...props} />
  );
}

function FloatingDrawerClose({
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Close>) {
  return <DrawerPrimitive.Close data-slot="floating-drawer-close" {...props} />;
}

function FloatingDrawerOverlay({
  className,
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Overlay>) {
  return (
    <DrawerPrimitive.Overlay
      data-slot="floating-drawer-overlay"
      className={cn(
        "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/50",
        className,
      )}
      {...props}
    />
  );
}

function FloatingDrawerContent({
  className,
  children,
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Content>) {
  return (
    <FloatingDrawerPortal data-slot="floating-drawer-portal">
      <FloatingDrawerOverlay />
      <DrawerPrimitive.Content
        data-slot="floating-drawer-content"
        className={cn(
          "group/floating-drawer-content bg-background fixed z-50 flex h-auto flex-col shadow-[0_16px_40px_rgba(0,0,0,0.2)] dark:shadow-[0_18px_52px_rgba(0,0,0,0.72)]",
          "data-[vaul-drawer-direction=top]:inset-x-0 data-[vaul-drawer-direction=top]:top-0 data-[vaul-drawer-direction=top]:mb-24 data-[vaul-drawer-direction=top]:max-h-[80vh] data-[vaul-drawer-direction=top]:rounded-b-lg data-[vaul-drawer-direction=top]:border-b",
          "data-[vaul-drawer-direction=bottom]:top-auto data-[vaul-drawer-direction=bottom]:right-3 data-[vaul-drawer-direction=bottom]:bottom-3 data-[vaul-drawer-direction=bottom]:left-auto data-[vaul-drawer-direction=bottom]:h-[50dvh] data-[vaul-drawer-direction=bottom]:max-h-[50dvh] data-[vaul-drawer-direction=bottom]:min-h-0 data-[vaul-drawer-direction=bottom]:w-[min(38rem,calc(100vw-1.5rem))] data-[vaul-drawer-direction=bottom]:rounded-2xl data-[vaul-drawer-direction=bottom]:border sm:data-[vaul-drawer-direction=bottom]:right-6 sm:data-[vaul-drawer-direction=bottom]:bottom-6 sm:data-[vaul-drawer-direction=bottom]:w-[min(38rem,calc(100vw-3rem))]",
          "data-[vaul-drawer-direction=right]:inset-y-0 data-[vaul-drawer-direction=right]:right-0 data-[vaul-drawer-direction=right]:w-3/4 data-[vaul-drawer-direction=right]:border-l data-[vaul-drawer-direction=right]:sm:max-w-sm",
          "data-[vaul-drawer-direction=left]:inset-y-0 data-[vaul-drawer-direction=left]:left-0 data-[vaul-drawer-direction=left]:w-3/4 data-[vaul-drawer-direction=left]:border-r data-[vaul-drawer-direction=left]:sm:max-w-sm",
          className,
        )}
        {...props}
      >
        {children}
      </DrawerPrimitive.Content>
    </FloatingDrawerPortal>
  );
}

function FloatingDrawerHeader({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="floating-drawer-header"
      className={cn(
        "flex flex-col gap-0.5 p-4 group-data-[vaul-drawer-direction=bottom]/floating-drawer-content:text-center group-data-[vaul-drawer-direction=top]/floating-drawer-content:text-center md:gap-1.5 md:text-left",
        className,
      )}
      {...props}
    />
  );
}

function FloatingDrawerFooter({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="floating-drawer-footer"
      className={cn("mt-auto flex flex-col gap-2 p-4", className)}
      {...props}
    />
  );
}

function FloatingDrawerTitle({
  className,
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Title>) {
  return (
    <DrawerPrimitive.Title
      data-slot="floating-drawer-title"
      className={cn("text-foreground font-semibold", className)}
      {...props}
    />
  );
}

function FloatingDrawerDescription({
  className,
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Description>) {
  return (
    <DrawerPrimitive.Description
      data-slot="floating-drawer-description"
      className={cn("text-muted-foreground text-sm", className)}
      {...props}
    />
  );
}

export {
  FloatingDrawer,
  FloatingDrawerClose,
  FloatingDrawerContent,
  FloatingDrawerDescription,
  FloatingDrawerFooter,
  FloatingDrawerHeader,
  FloatingDrawerOverlay,
  FloatingDrawerPortal,
  FloatingDrawerTitle,
  FloatingDrawerTrigger,
};
