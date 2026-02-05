"use client";

import { useEffect, useRef, useState } from "react";
import { ClipboardCopy, MailIcon } from "lucide-react";
import { toast } from "sonner";

import { Button } from "~/components/ui/button";

type EmailCopyButtonProps = {
  email: string;
};

export default function EmailCopyButton({ email }: EmailCopyButtonProps) {
  const [copied, setCopied] = useState(false);
  const [isCopying, setIsCopying] = useState(false);
  const cooldownRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (cooldownRef.current !== null) {
        window.clearTimeout(cooldownRef.current);
      }
    };
  }, []);

  const handleCopy = async () => {
    if (isCopying) return;

    if (!navigator?.clipboard?.writeText) {
      toast.error("Clipboard is not available in this browser");
      return;
    }

    try {
      const copyPromise = navigator.clipboard.writeText(email);

      setIsCopying(true);

      toast.promise(copyPromise, {
        loading: "Copying email...",
        success: "Email copied",
        error: "Unable to copy email",
      });

      await copyPromise;

      setCopied(true);

      cooldownRef.current = window.setTimeout(() => {
        setCopied(false);
        setIsCopying(false);
        cooldownRef.current = null;
      }, 750);
    } catch {
      setIsCopying(false);
    }
  };

  return (
    <Button
      type="button"
      variant="ghost"
      className="group justify-start hover:cursor-pointer"
      onClick={handleCopy}
      loading={isCopying}
      icon={<MailIcon className="size-4" />}
      aria-label="Copy contact email"
    >
      <span className="truncate">{copied ? "Copied!" : email}</span>
      <ClipboardCopy className="ml-auto size-4 opacity-0 transition-opacity group-hover:opacity-100" />
    </Button>
  );
}
