export type LexicalNode = {
  type?: string;
  text?: string;
  children?: LexicalNode[];
  // Allow arbitrary properties; we only care about a few common ones
  [key: string]: unknown;
};

type ToTextOptions = {
  paragraphSeparator?: string;
  maxLength?: number;
};

/**
 * Convert a Payload Lexical rich text JSON value into plain text.
 * Handles common node types by walking `children` and concatenating text nodes.
 */
export function lexicalToPlainText(
  value: unknown,
  options?: ToTextOptions,
): string {
  const paragraphSeparator = options?.paragraphSeparator ?? " ";
  const maxLength = options?.maxLength;

  const fragments: string[] = [];

  function pushSeparator() {
    // Avoid duplicate separators
    if (fragments.length === 0) return;
    const last = fragments[fragments.length - 1];
    if (last !== paragraphSeparator) {
      fragments.push(paragraphSeparator);
    }
  }

  function walk(node: unknown): void {
    if (!node) return;
    if (Array.isArray(node)) {
      node.forEach(walk);
      return;
    }
    if (typeof node !== "object") return;

    const n = node as LexicalNode;

    if (typeof n.text === "string") {
      fragments.push(n.text);
    }

    if (Array.isArray(n.children)) {
      n.children.forEach(walk);
      // Add a soft separator after block-like nodes
      if (
        n.type === "paragraph" ||
        n.type === "heading" ||
        n.type === "list-item" ||
        n.type === "listitem" ||
        n.type === "quote"
      ) {
        pushSeparator();
      }
    }
  }

  function isRecord(input: unknown): input is Record<string, unknown> {
    return typeof input === "object" && input !== null;
  }

  const root: unknown =
    isRecord(value) && "root" in value
      ? ((value as { root?: unknown }).root ?? value)
      : value;

  if (
    isRecord(root) &&
    Array.isArray((root as { children?: unknown }).children)
  ) {
    const children = (root as { children: unknown[] }).children;
    children.forEach(walk);
  } else {
    walk(root);
  }

  const text = fragments.join(" ").replace(/\s+/g, " ").trim();

  if (
    typeof maxLength === "number" &&
    maxLength > 0 &&
    text.length > maxLength
  ) {
    return text.slice(0, maxLength - 1).trimEnd() + "…";
  }
  return text;
}

/**
 * Extract plain text from the first paragraph block of a Lexical value.
 * Falls back to full-document plain text if no paragraph is found.
 */
export function lexicalFirstParagraphText(
  value: unknown,
  options?: { maxLength?: number },
): string {
  const maxLength = options?.maxLength;

  function isRecord(input: unknown): input is Record<string, unknown> {
    return typeof input === "object" && input !== null;
  }

  function collectText(node: unknown, fragments: string[]): void {
    if (!node) return;
    if (Array.isArray(node)) {
      node.forEach((child) => collectText(child, fragments));
      return;
    }
    if (typeof node !== "object") return;

    const n = node as LexicalNode;
    if (typeof n.text === "string") {
      fragments.push(n.text);
    }
    if (Array.isArray(n.children)) {
      n.children.forEach((child) => collectText(child, fragments));
    }
  }

  let paragraphNode: LexicalNode | undefined;

  const root: unknown =
    isRecord(value) && "root" in value
      ? ((value as { root?: unknown }).root ?? value)
      : value;

  if (
    isRecord(root) &&
    Array.isArray((root as { children?: unknown }).children)
  ) {
    const children = (root as { children: unknown[] })
      .children as LexicalNode[];
    paragraphNode = children.find((c) => c?.type === "paragraph");
  }

  if (!paragraphNode) {
    // Fallback: scan the whole structure for the first paragraph
    function findParagraph(node: unknown): void {
      if (paragraphNode || !node) return;
      if (Array.isArray(node)) {
        for (const child of node) {
          if (paragraphNode) break;
          findParagraph(child);
        }
        return;
      }
      if (typeof node !== "object") return;
      const n = node as LexicalNode;
      if (n.type === "paragraph") {
        paragraphNode = n;
        return;
      }
      if (Array.isArray(n.children)) {
        for (const child of n.children) {
          if (paragraphNode) break;
          findParagraph(child);
        }
      }
    }
    findParagraph(value);
  }

  if (paragraphNode) {
    const fragments: string[] = [];
    collectText(paragraphNode, fragments);
    const text = fragments.join(" ").replace(/\s+/g, " ").trim();
    if (
      typeof maxLength === "number" &&
      maxLength > 0 &&
      text.length > maxLength
    ) {
      return text.slice(0, maxLength - 1).trimEnd() + "…";
    }
    return text;
  }

  // No paragraph found – fall back to general plain text extraction
  return lexicalToPlainText(value, { maxLength });
}
