"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { CONTACT_OPTIONS, type ContactOption } from "../contact-options";
import {
  CONTACT_MIN_MESSAGE_LENGTH,
  contactFormSchema,
  type ContactReason,
} from "~/lib/contact/contact-schema";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "~/components/ui/drawer";
import { Button } from "~/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "~/components/ui/form";
import { Input } from "~/components/ui/input";
import { Textarea } from "~/components/ui/textarea";
import { useIsMobile } from "~/lib/hooks/useIsMobile";

type ContactFormValues = z.infer<typeof contactFormSchema>;

const defaultValues: ContactFormValues = {
  reason: "data-issue",
  name: "",
  email: "",
  subject: "",
  message: "",
  referenceUrl: "",
  company: "",
};

export default function ContactClient() {
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);
  const [selectedReason, setSelectedReason] = useState<ContactReason | null>(
    null,
  );
  const [subjectTouched, setSubjectTouched] = useState(false);
  const [messageTouched, setMessageTouched] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [formStartedAt, setFormStartedAt] = useState<number | null>(null);
  const [honeypot, setHoneypot] = useState("");

  const optionMap = useMemo(
    () => new Map(CONTACT_OPTIONS.map((option) => [option.value, option])),
    [],
  );

  const form = useForm<ContactFormValues>({
    resolver: zodResolver(contactFormSchema),
    defaultValues,
  });

  const selectedOption = selectedReason
    ? (optionMap.get(selectedReason) ?? null)
    : null;

  const applyReasonDefaults = (option: ContactOption) => {
    form.setValue("reason", option.value, { shouldValidate: true });
    if (!subjectTouched) {
      form.setValue("subject", option.subjectTemplate, {
        shouldDirty: false,
      });
    }
    if (!messageTouched) {
      form.setValue("message", option.messageTemplate, {
        shouldDirty: false,
      });
    }
  };

  const handleOptionClick = (option: ContactOption) => {
    if (!open) {
      setOpen(true);
      setSubmitted(false);
      setServerError(null);
      setSubjectTouched(false);
      setMessageTouched(false);
      setFormStartedAt(Date.now());
      setHoneypot("");
      setSelectedReason(option.value);
      form.reset({
        ...defaultValues,
        reason: option.value,
        subject: option.subjectTemplate,
        message: option.messageTemplate,
      });
      return;
    }

    setSelectedReason(option.value);
    applyReasonDefaults(option);
  };

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (!nextOpen) {
      setSubmitted(false);
      setServerError(null);
      setSubjectTouched(false);
      setMessageTouched(false);
      setFormStartedAt(null);
      setHoneypot("");
      setSelectedReason(null);
      form.reset(defaultValues);
    }
  };

  const handleSubmit = async (values: ContactFormValues) => {
    setServerError(null);
    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...values,
          honeypot,
          startedAt: formStartedAt ?? Date.now(),
        }),
      });

      const data = (await response.json()) as
        | { ok: true }
        | {
            ok: false;
            message: string;
            fieldErrors?: Record<string, string>;
          };

      if (data.ok) {
        toast.success("Message sent. We'll be in touch soon.");
        setSubmitted(true);
        return;
      }

      if (data.fieldErrors) {
        for (const [field, message] of Object.entries(data.fieldErrors)) {
          form.setError(field as keyof ContactFormValues, { message });
        }
      }

      const message =
        data.message || "Unable to send message. Please try again later.";
      setServerError(message);
      toast.error(message);
    } catch (error) {
      const message = "Unable to send message. Please try again later.";
      setServerError(message);
      toast.error(message);
    }
  };

  const headerContent = (
    <>
      <DialogTitle>Contact Sharply</DialogTitle>
      {selectedOption?.additionalInfo ? (
        <DialogDescription>
          {selectedOption.infoLink ? (
            <Link
              href={selectedOption.infoLink}
              className="text-foreground underline"
              target="_blank"
              rel="noreferrer"
            >
              {selectedOption.additionalInfo}
            </Link>
          ) : (
            selectedOption.additionalInfo
          )}
        </DialogDescription>
      ) : null}
    </>
  );

  const formContent = submitted ? (
    <div className="space-y-4">
      <p className="text-sm">
        Thanks for reaching out! Your message has been sent and we'll respond
        within a couple business days.
      </p>
      <div className="flex justify-end">
        <Button type="button" onClick={() => handleOpenChange(false)}>
          Close
        </Button>
      </div>
    </div>
  ) : (
    <Form {...form}>
      <form className="space-y-6" onSubmit={form.handleSubmit(handleSubmit)}>
        <input
          type="text"
          name="website"
          value={honeypot}
          onChange={(event) => setHoneypot(event.target.value)}
          className="hidden"
          tabIndex={-1}
          autoComplete="off"
        />

        <FormField
          control={form.control}
          name="reason"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Input type="hidden" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Name</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Your name" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder="you@example.com"
                    type="email"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="subject"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Subject</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  placeholder="Subject"
                  onChange={(event) => {
                    setSubjectTouched(true);
                    field.onChange(event);
                  }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="message"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Message</FormLabel>
              <FormControl>
                <Textarea
                  {...field}
                  rows={6}
                  placeholder={`Tell us more (min ${CONTACT_MIN_MESSAGE_LENGTH} characters)`}
                  onChange={(event) => {
                    setMessageTouched(true);
                    field.onChange(event);
                  }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {selectedOption?.extraFields.includes("referenceUrl") ? (
          <FormField
            control={form.control}
            name="referenceUrl"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Reference URL</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder="https://sharply.io/..."
                    type="url"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        ) : null}

        {selectedOption?.extraFields.includes("company") ? (
          <FormField
            control={form.control}
            name="company"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Company</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Your company" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        ) : null}

        {serverError ? (
          <p className="text-destructive text-sm">{serverError}</p>
        ) : null}

        <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="ghost"
            onClick={() => handleOpenChange(false)}
          >
            Cancel
          </Button>
          <Button type="submit" loading={form.formState.isSubmitting}>
            Send message
          </Button>
        </div>
      </form>
    </Form>
  );

  return (
    <>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {CONTACT_OPTIONS.map((option: ContactOption) => {
          const IconComponent = option.icon;
          return (
            <button
              key={option.value}
              className="hover:bg-muted relative flex min-h-36 flex-col items-start justify-start rounded-md border p-4 pr-24 text-left hover:cursor-pointer"
              onClick={() => handleOptionClick(option)}
              data-contact-option={option.value}
              type="button"
            >
              <IconComponent
                strokeWidth={2}
                className="absolute top-2 right-2 size-12 opacity-20"
              />
              <h3 className="font-bold">{option.label}</h3>
              <p className="text-muted-foreground mt-auto text-sm">
                {option.description}
              </p>
            </button>
          );
        })}
      </div>

      {isMobile ? (
        <Drawer open={open} onOpenChange={handleOpenChange}>
          <DrawerContent className="max-h-[90vh]">
            <DrawerHeader>
              <DrawerTitle>Contact Sharply</DrawerTitle>
              {selectedOption?.additionalInfo ? (
                <DrawerDescription>
                  {selectedOption.infoLink ? (
                    <Link
                      href={selectedOption.infoLink}
                      className="text-foreground underline"
                      target="_blank"
                      rel="noreferrer"
                    >
                      {selectedOption.additionalInfo}
                    </Link>
                  ) : (
                    selectedOption.additionalInfo
                  )}
                </DrawerDescription>
              ) : null}
            </DrawerHeader>
            <div className="flex-1 overflow-y-auto px-4 pb-6">
              {formContent}
            </div>
          </DrawerContent>
        </Drawer>
      ) : (
        <Dialog open={open} onOpenChange={handleOpenChange}>
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>{headerContent}</DialogHeader>
            {formContent}
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
