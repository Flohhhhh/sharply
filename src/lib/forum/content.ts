export const MAX_FORUM_CONTENT_TEXT_LENGTH = 20_000;
export const MAX_FORUM_CONTENT_SERIALIZED_LENGTH = 100_000;

export type ForumLexicalNode = {
  type?: string;
  version?: number;
  text?: string;
  format?: number;
  url?: string;
  tag?: string;
  listType?: string;
  children?: ForumLexicalNode[];
};

export type ForumLexicalState = {
  root: ForumLexicalNode;
};

export function parseForumLexicalState(
  content: string,
): ForumLexicalState | null {
  try {
    const parsed = JSON.parse(content) as unknown;
    if (!parsed || typeof parsed !== "object" || !("root" in parsed)) {
      return null;
    }

    const root = (parsed as { root?: unknown }).root;
    if (!root || typeof root !== "object") return null;

    const children = (root as { children?: unknown }).children;
    if (!Array.isArray(children)) return null;

    return { root: root as ForumLexicalNode };
  } catch {
    return null;
  }
}

function lexicalNodeToPlainText(node: ForumLexicalNode): string {
  const text = typeof node.text === "string" ? node.text : "";
  const children = Array.isArray(node.children)
    ? node.children.map(lexicalNodeToPlainText).join("")
    : "";
  const separator =
    node.type === "paragraph" ||
    node.type === "heading" ||
    node.type === "quote"
      ? "\n"
      : "";

  return `${text}${children}${separator}`;
}

function markdownToPlainText(content: string) {
  return content
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/[*_~`>#-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function forumContentToPlainText(content: string) {
  const state = parseForumLexicalState(content);
  return state
    ? lexicalNodeToPlainText(state.root).trim()
    : markdownToPlainText(content);
}

export function isValidForumContent(content: string) {
  if (content.length > MAX_FORUM_CONTENT_SERIALIZED_LENGTH) return false;

  const text = forumContentToPlainText(content);
  return text.length > 0 && text.length <= MAX_FORUM_CONTENT_TEXT_LENGTH;
}

export function isSafeForumHref(href: string) {
  const value = href.trim();
  if (!value) return false;

  if (value.startsWith("/") && !value.startsWith("//")) return true;
  if (value.startsWith("#")) return true;

  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export function isExternalForumHref(href: string) {
  try {
    const url = new URL(href);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}
