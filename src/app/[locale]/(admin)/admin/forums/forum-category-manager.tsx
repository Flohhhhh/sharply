"use client";

import { useState, useTransition, type FormEvent } from "react";
import { Plus } from "lucide-react";
import { actionCreateForumCategory } from "~/server/forum/actions";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Textarea } from "~/components/ui/textarea";

type ForumCategory = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
};

export function ForumCategoryManager({
  categories,
  canManageCategories,
}: {
  categories: ForumCategory[];
  canManageCategories: boolean;
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    startTransition(async () => {
      try {
        await actionCreateForumCategory({ name, description });
        setName("");
        setDescription("");
      } catch (submitError) {
        setError(
          submitError instanceof Error
            ? submitError.message
            : "Could not create the category.",
        );
      }
    });
  };

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Categories</h2>
        <p className="text-muted-foreground mt-1 text-sm">
          Keep the taxonomy intentionally small. Categories are created by
          admins only.
        </p>
      </div>

      {canManageCategories ? (
        <form
          onSubmit={handleSubmit}
          className="grid gap-3 rounded-xl border p-5 md:grid-cols-[1fr_1.5fr_auto] md:items-end"
        >
          <label className="space-y-2 text-sm font-medium">
            Name
            <Input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Buying Advice"
              required
              maxLength={120}
            />
          </label>
          <label className="space-y-2 text-sm font-medium">
            Description
            <Textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Questions about choosing and comparing gear."
              rows={1}
              maxLength={500}
            />
          </label>
          <Button type="submit" loading={isPending} icon={<Plus />}>
            Add category
          </Button>
        </form>
      ) : (
        <div className="rounded-xl border border-dashed p-5 text-sm">
          Only admins can create or reorder forum categories. Moderators can
          still review reports.
        </div>
      )}

      {error ? <p className="text-destructive text-sm">{error}</p> : null}

      <div className="divide-border divide-y rounded-xl border">
        {categories.length ? (
          categories.map((category) => (
            <div
              key={category.id}
              className="flex flex-col gap-1 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="font-medium">{category.name}</p>
                {category.description ? (
                  <p className="text-muted-foreground mt-1 text-sm">
                    {category.description}
                  </p>
                ) : null}
              </div>
              <code className="text-muted-foreground text-xs">
                {category.slug}
              </code>
            </div>
          ))
        ) : (
          <p className="text-muted-foreground px-5 py-8 text-sm">
            No categories have been created yet.
          </p>
        )}
      </div>
    </section>
  );
}
