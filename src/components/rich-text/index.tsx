import React from "react";
import { RichText as LexicalRichText } from "@payloadcms/richtext-lexical/react";
import type { DefaultNodeTypes } from "@payloadcms/richtext-lexical";
import type { JSXConvertersFunction } from "@payloadcms/richtext-lexical/react";
import type { News } from "~/payload-types";

// Keep heading tags intact (with optional demotion); TOC will assign IDs client-side if missing
function createHeadingConverters(
  demoteHeadingsBy: number,
): JSXConvertersFunction<DefaultNodeTypes> {
  const safeDemotion = Number.isFinite(demoteHeadingsBy)
    ? Math.max(0, Math.floor(demoteHeadingsBy))
    : 0;
  return ({ defaultConverters }) => ({
    ...defaultConverters,
    heading: ({ node, nodesToJSX }) => {
      const children = nodesToJSX({ nodes: node.children });
      const isHeadingTag = (tag: unknown): tag is string =>
        typeof tag === "string" && /^h[1-6]$/i.test(tag);
      const originalTag = isHeadingTag(node.tag)
        ? node.tag.toLowerCase()
        : "h2";
      const originalLevel = Number(originalTag[1]);
      const newLevel = Math.min(6, Math.max(1, originalLevel + safeDemotion));
      const effectiveTag = `h${newLevel}`;
      return React.createElement(effectiveTag, null, children);
    },
  });
}

export function RichText(
  props: {
    data: News["content"];
    demoteHeadingsBy?: number;
  } & React.HTMLAttributes<HTMLDivElement>,
) {
  const { className = "", demoteHeadingsBy = 0, ...rest } = props;
  return (
    <LexicalRichText
      {...rest}
      className={[
        "prose prose-zinc dark:prose-invert prose-h2:text-2xl dark:prose-h2:text-2xl sm:prose:h2:text-4xl dark:sm:prose-h2:text-4xl max-w-none dark:opacity-90",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      converters={createHeadingConverters(demoteHeadingsBy)}
    />
  );
}
