import React from "react";
import { RichText as LexicalRichText } from "@payloadcms/richtext-lexical/react";
import type { DefaultNodeTypes } from "@payloadcms/richtext-lexical";
import type { JSXConvertersFunction } from "@payloadcms/richtext-lexical/react";
import type { News } from "~/payload-types";

// Keep heading tags intact; TOC will assign IDs client-side if missing
const headingConverters: JSXConvertersFunction<DefaultNodeTypes> = ({
  defaultConverters,
}) => ({
  ...defaultConverters,
  heading: ({ node, nodesToJSX }) => {
    const children = nodesToJSX({ nodes: node.children });
    const Tag = node.tag;
    return React.createElement(Tag as any, null, children);
  },
});

export function RichText(
  props: {
    data: News["content"];
  } & React.HTMLAttributes<HTMLDivElement>,
) {
  const { className = "", ...rest } = props;
  return (
    <LexicalRichText
      {...rest}
      className={["prose", className].filter(Boolean).join(" ")}
      converters={headingConverters}
    />
  );
}
