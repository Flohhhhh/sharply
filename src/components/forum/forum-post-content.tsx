import type { ReactNode } from "react";
import ReactMarkdown from "react-markdown";
import rehypeSanitize from "rehype-sanitize";
import remarkGfm from "remark-gfm";
import {
  isExternalForumHref,
  isSafeForumHref,
  parseForumLexicalState,
  type ForumLexicalNode,
} from "~/lib/forum/content";

function renderText(node: ForumLexicalNode, key: string): ReactNode {
  const text = node.text ?? "";
  const format = node.format ?? 0;
  let content: ReactNode = text;

  if (format & 16) content = <code>{content}</code>;
  if (format & 8) content = <u>{content}</u>;
  if (format & 4) content = <s>{content}</s>;
  if (format & 2) content = <em>{content}</em>;
  if (format & 1) content = <strong>{content}</strong>;

  return <span key={key}>{content}</span>;
}

function renderLexicalNode(node: ForumLexicalNode, key: string): ReactNode {
  if (node.type === "text") return renderText(node, key);
  if (node.type === "linebreak") return <br key={key} />;

  const children = (node.children ?? []).map((child, index) =>
    renderLexicalNode(child, `${key}-${index}`),
  );

  switch (node.type) {
    case "root":
      return <>{children}</>;
    case "paragraph":
      return <p key={key}>{children}</p>;
    case "heading": {
      if (node.tag === "h1") {
        return <h1 key={key}>{children}</h1>;
      }
      if (node.tag === "h3") {
        return <h3 key={key}>{children}</h3>;
      }
      return <h2 key={key}>{children}</h2>;
    }
    case "quote":
      return <blockquote key={key}>{children}</blockquote>;
    case "list":
      return node.listType === "number" ? (
        <ol key={key}>{children}</ol>
      ) : (
        <ul key={key}>{children}</ul>
      );
    case "listitem":
      return <li key={key}>{children}</li>;
    case "code":
      return (
        <pre key={key}>
          <code>{children}</code>
        </pre>
      );
    case "link":
    case "autolink": {
      const href = node.url ?? "";
      if (!isSafeForumHref(href)) return <span key={key}>{children}</span>;
      const external = isExternalForumHref(href);
      return (
        <a
          key={key}
          href={href}
          target={external ? "_blank" : undefined}
          rel={external ? "noopener noreferrer" : undefined}
        >
          {children}
        </a>
      );
    }
    default:
      return <span key={key}>{children}</span>;
  }
}

function LexicalPostContent({ content }: { content: string }) {
  const state = parseForumLexicalState(content);
  if (!state) return null;

  return (
    <div className="prose prose-zinc prose-sm dark:prose-invert mt-6 max-w-none dark:opacity-90">
      {renderLexicalNode(state.root, "root")}
    </div>
  );
}

export function ForumPostContent({ content }: { content: string }) {
  const state = parseForumLexicalState(content);

  if (state) return <LexicalPostContent content={content} />;

  return (
    <div className="prose prose-zinc prose-sm dark:prose-invert mt-6 max-w-none dark:opacity-90">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeSanitize]}
        components={{
          a: ({ href, children }) => {
            const safeHref = href ?? "";
            if (!isSafeForumHref(safeHref)) return <span>{children}</span>;
            const external = isExternalForumHref(safeHref);
            return (
              <a
                href={safeHref}
                target={external ? "_blank" : undefined}
                rel={external ? "noopener noreferrer" : undefined}
              >
                {children}
              </a>
            );
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
