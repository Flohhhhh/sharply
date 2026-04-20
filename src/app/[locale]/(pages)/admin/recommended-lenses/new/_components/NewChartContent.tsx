"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { actionCreateRecommendationChart } from "~/server/recommendations/actions";
import { Input } from "~/components/ui/input";
import { Textarea } from "~/components/ui/textarea";
import { Label } from "~/components/ui/label";
import { Button } from "~/components/ui/button";
import { BRANDS } from "@/lib/generated";
import BrandSelectField from "../../_components/BrandSelectField";

export default function NewChartContent() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  async function onSubmit(formData: FormData) {
    startTransition(async () => {
      const res = await actionCreateRecommendationChart(formData);
      if (res?.ok && res.chart) {
        toast.success("Chart created");
        router.replace(
          `/admin/recommended-lenses/${res.chart.brand}/${res.chart.slug}`,
        );
      } else {
        toast.error("Failed to create chart");
      }
    });
  }

  return (
    <div className="mx-auto mt-24 max-w-3xl space-y-6 px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Create Chart</h1>
      </div>

      <form action={onSubmit} className="space-y-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1">
            <Label htmlFor="brand">Brand</Label>
            <BrandSelectField
              name="brand"
              options={BRANDS.map((b) => ({ value: b.slug, label: b.name }))}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="slug">Slug</Label>
            <Input id="slug" name="slug" placeholder="e-apsc" required />
          </div>
          <div className="space-y-1 sm:col-span-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              name="title"
              placeholder="Sony E APS-C"
              required
            />
          </div>
          <div className="space-y-1 sm:col-span-2">
            <Label htmlFor="description">Description (optional)</Label>
            <Textarea
              id="description"
              name="description"
              rows={3}
              placeholder="Short description"
            />
          </div>

          <div className="mt-7 flex items-center gap-3">
            <input
              id="isPublished"
              name="isPublished"
              type="checkbox"
              defaultChecked
              className="size-4"
            />
            <Label htmlFor="isPublished">Published</Label>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button type="submit" disabled={pending}>
            {pending ? "Creating..." : "Create"}
          </Button>
        </div>
      </form>
    </div>
  );
}
