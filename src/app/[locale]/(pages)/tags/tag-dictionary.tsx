"use client";

import { Search } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { TagIcon } from "~/components/gear/tag-icon";
import { Input } from "~/components/ui/input";
import { filterTagDictionary } from "~/lib/tags/filter-tag-dictionary";
import type { PublicTagRow } from "~/server/tags/service";

type TagDictionaryProps = {
  noMatchingTagsLabel: string;
  searchTagsLabel: string;
  tags: PublicTagRow[];
};

export function TagDictionary({
  noMatchingTagsLabel,
  searchTagsLabel,
  tags,
}: TagDictionaryProps) {
  const [query, setQuery] = useState("");
  const filteredTags = filterTagDictionary(tags, query);

  return (
    <div className="mt-10">
      <div className="relative max-w-md">
        <Search
          aria-hidden="true"
          className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2"
        />
        <Input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={searchTagsLabel}
          aria-label={searchTagsLabel}
          className="pl-9"
        />
      </div>
      {filteredTags.length ? (
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {filteredTags.map((tag) => (
            <TagDictionaryCard key={tag.id} tag={tag} />
          ))}
        </div>
      ) : (
        <p className="text-muted-foreground mt-4">{noMatchingTagsLabel}</p>
      )}
    </div>
  );
}

function TagDictionaryCard({ tag }: { tag: PublicTagRow }) {
  const cardContent = tag.pageContent || tag.description;
  const cardTitle = tag.pageTitle || tag.name;

  return (
    <Link
      href={`/tags/${tag.slug}`}
      className="hover:bg-muted rounded-md border p-4"
    >
      <h2 className="flex items-center gap-2 font-semibold">
        <TagIcon name={tag.icon} size={18} />
        {cardTitle}
      </h2>
      {cardContent ? (
        <p className="text-muted-foreground mt-1 text-sm whitespace-pre-wrap">
          {cardContent}
        </p>
      ) : null}
    </Link>
  );
}
