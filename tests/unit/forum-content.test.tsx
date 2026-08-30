import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ForumPostContent } from "~/components/forum/forum-post-content";
import {
  isSafeForumHref,
  isValidForumContent,
  parseForumLexicalState,
} from "~/lib/forum/content";

const lexicalContent = JSON.stringify({
  root: {
    type: "root",
    children: [
      {
        type: "paragraph",
        children: [
          { type: "text", text: "Hello ", format: 0 },
          { type: "text", text: "world", format: 1 },
        ],
      },
      {
        type: "link",
        url: "https://example.com",
        children: [{ type: "text", text: "Example", format: 0 }],
      },
    ],
  },
});

describe("forum content", () => {
  it("detects valid Lexical JSON content", () => {
    expect(parseForumLexicalState(lexicalContent)).not.toBeNull();
    expect(parseForumLexicalState("plain text")).toBeNull();
  });

  it("rejects empty editor documents and accepts formatted content", () => {
    const emptyContent = JSON.stringify({
      root: { type: "root", children: [{ type: "paragraph", children: [] }] },
    });

    expect(isValidForumContent(emptyContent)).toBe(false);
    expect(isValidForumContent(lexicalContent)).toBe(true);
    expect(isValidForumContent("**A legacy Markdown post**")).toBe(true);
    expect(isValidForumContent("a".repeat(20_001))).toBe(false);
  });

  it("allows safe internal and web links only", () => {
    expect(isSafeForumHref("/forum/t/example")).toBe(true);
    expect(isSafeForumHref("#post-1")).toBe(true);
    expect(isSafeForumHref("https://example.com")).toBe(true);
    expect(isSafeForumHref("javascript:alert(1)")).toBe(false);
    expect(isSafeForumHref("data:text/html,unsafe")).toBe(false);
    expect(isSafeForumHref("//example.com")).toBe(false);
  });

  it("renders Lexical formatting and legacy Markdown", () => {
    const lexicalMarkup = renderToStaticMarkup(
      <ForumPostContent content={lexicalContent} />,
    );
    const markdownMarkup = renderToStaticMarkup(
      <ForumPostContent content={"## Legacy\n\n**Markdown**"} />,
    );

    expect(lexicalMarkup).toContain("<strong>world</strong>");
    expect(lexicalMarkup).toContain('href="https://example.com"');
    expect(markdownMarkup).toContain("<h2>Legacy</h2>");
    expect(markdownMarkup).toContain("<strong>Markdown</strong>");
    expect(
      renderToStaticMarkup(
        <ForumPostContent content={"# Title\n\n- one\n- two"} />,
      ),
    ).toContain("<ul>");
  });

  it("does not render unsafe Markdown links", () => {
    const markup = renderToStaticMarkup(
      <ForumPostContent content={'[unsafe](javascript:alert("x"))'} />,
    );

    expect(markup).not.toContain("javascript:");
    expect(markup).toContain("unsafe");
  });

  it("renders children from unknown Lexical nodes without crashing", () => {
    const markup = renderToStaticMarkup(
      <ForumPostContent
        content={JSON.stringify({
          root: {
            type: "root",
            children: [
              {
                type: "future-custom-node",
                children: [{ type: "text", text: "Future content", format: 0 }],
              },
            ],
          },
        })}
      />,
    );

    expect(markup).toContain("Future content");
  });
});
