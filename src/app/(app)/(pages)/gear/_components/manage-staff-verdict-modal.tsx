"use client";
import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";
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
import { toast } from "sonner";
import { Separator } from "~/components/ui/separator";
import { actionUpsertStaffVerdict } from "~/server/gear/actions";
import { Pencil } from "lucide-react";
import type { UserRole } from "~/server/auth";

const verdictSchema = z.object({
  content: z.string().max(5000).optional(),
  pros: z.string().optional(),
  cons: z.string().optional(),
  whoFor: z.string().max(1000).optional(),
  notFor: z.string().max(1000).optional(),
  alternatives: z.string().optional(),
});

function parseLines(value: string | undefined): string[] | null {
  if (!value) return null;
  const arr = value
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
  return arr.length ? arr : null;
}

export function ManageStaffVerdictModal({ slug }: { slug: string }) {
  const { data: session } = useSession();
  const isAdmin = useMemo(() => {
    const role = (session?.user as { role?: UserRole } | null | undefined)
      ?.role;
    return role === "ADMIN" || role === "SUPERADMIN";
  }, [session?.user]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [initial, setInitial] = useState<{
    content: string;
    pros: string;
    cons: string;
    whoFor: string;
    notFor: string;
    alternatives: string;
  } | null>(null);
  const form = useForm<z.infer<typeof verdictSchema>>({
    resolver: zodResolver(verdictSchema),
    defaultValues: {
      content: "",
      pros: "",
      cons: "",
      whoFor: "",
      notFor: "",
      alternatives: "",
    },
  });

  useEffect(() => {
    if (!open) return;
    let mounted = true;
    void (async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/gear/${slug}/staff-verdict`, {
          method: "GET",
        });
        if (!mounted) return;
        if (res.ok) {
          const json = (await res.json()) as {
            verdict: {
              content: string | null;
              pros: string[] | null;
              cons: string[] | null;
              whoFor: string | null;
              notFor: string | null;
              alternatives: string[] | null;
            } | null;
          };
          const v = json.verdict;
          const next = {
            content: v?.content ?? "",
            pros: (v?.pros ?? []).join("\n"),
            cons: (v?.cons ?? []).join("\n"),
            whoFor: v?.whoFor ?? "",
            notFor: v?.notFor ?? "",
            alternatives: (v?.alternatives ?? []).join("\n"),
          };
          setInitial(next);
          form.reset(next);
        } else {
          const empty = {
            content: "",
            pros: "",
            cons: "",
            whoFor: "",
            notFor: "",
            alternatives: "",
          };
          setInitial(empty);
          form.reset(empty);
        }
      } catch (e) {
        const empty = {
          content: "",
          pros: "",
          cons: "",
          whoFor: "",
          notFor: "",
          alternatives: "",
        };
        setInitial(empty);
        form.reset(empty);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [open, slug]);

  if (!isAdmin) return null;

  const handleSubmit = async (formData: z.infer<typeof verdictSchema>) => {
    try {
      setLoading(true);
      const res = await actionUpsertStaffVerdict(slug, {
        content: formData.content?.trim() || null,
        pros: parseLines(formData.pros),
        cons: parseLines(formData.cons),
        whoFor: formData.whoFor?.trim() || null,
        notFor: formData.notFor?.trim() || null,
        alternatives: parseLines(formData.alternatives),
      });
      const ok =
        ((res as { ok?: boolean } | null | undefined)?.ok ?? false) === true;
      if (ok) {
        toast.success("Staff verdict updated.");
        setOpen(false);
      } else {
        toast.error("Failed to save. Please try again.");
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" icon={<Pencil />}>
          Manage Staff Verdict
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Staff Verdict</DialogTitle>
        </DialogHeader>

        {loading && !initial ? (
          <div className="text-muted-foreground py-8 text-center text-sm">
            Loading…
          </div>
        ) : (
          <Form {...form}>
            <form
              className="space-y-6"
              onSubmit={form.handleSubmit(handleSubmit)}
            >
              <FormField
                control={form.control}
                name="content"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Summary</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="Short editorial summary"
                        rows={5}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Separator />

              <div className="grid gap-6 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="pros"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Pros (one per line)</FormLabel>
                      <FormControl>
                        <Textarea {...field} rows={6} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="cons"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cons (one per line)</FormLabel>
                      <FormControl>
                        <Textarea {...field} rows={6} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="whoFor"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Who it's for</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Ideal audience or use cases"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="notFor"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Not for</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Who should skip this" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* TODO: Set this up with a real gear selector */}
              {/* <FormField
                control={form.control}
                name="alternatives"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Top alternatives (one per line)</FormLabel>
                    <FormControl>
                      <Textarea {...field} rows={4} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              /> */}

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? "Saving…" : "Save"}
                </Button>
              </div>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}
