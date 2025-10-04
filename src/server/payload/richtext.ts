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

  const root: any = (value as any)?.root ?? value;
  if (root && Array.isArray(root.children)) {
    root.children.forEach(walk);
  } else {
    walk(root);
  }

  let text = fragments.join(" ").replace(/\s+/g, " ").trim();

  if (
    typeof maxLength === "number" &&
    maxLength > 0 &&
    text.length > maxLength
  ) {
    return text.slice(0, maxLength - 1).trimEnd() + "…";
  }
  return text;
}
