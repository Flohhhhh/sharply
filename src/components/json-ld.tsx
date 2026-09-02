import { buildJsonLdGraph, type JsonLdNode } from "~/lib/seo/json-ld-helpers";

/**
 * Renders schema.org JSON-LD. Pass a single complete document (with
 * "@context") or an array of nodes to wrap in one @graph document —
 * nullish array entries are dropped, so nullable builders can be called
 * inline.
 *
 * Rendered as a text child on purpose: React emits script text raw while
 * escaping "</script>" breakouts, so this is XSS-safe for data that may
 * contain user-provided strings (unlike dangerouslySetInnerHTML).
 */
export function JsonLd(props: {
  data: JsonLdNode | Array<JsonLdNode | null | undefined>;
}) {
  const document = Array.isArray(props.data)
    ? buildJsonLdGraph(props.data)
    : props.data;

  return <script type="application/ld+json">{JSON.stringify(document)}</script>;
}
