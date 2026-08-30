"use client";

import { $createCodeNode, CodeNode } from "@lexical/code";
import { LinkNode, TOGGLE_LINK_COMMAND } from "@lexical/link";
import {
  INSERT_ORDERED_LIST_COMMAND,
  INSERT_UNORDERED_LIST_COMMAND,
  ListItemNode,
  ListNode,
} from "@lexical/list";
import { $convertFromMarkdownString, TRANSFORMERS } from "@lexical/markdown";
import {
  $createHeadingNode,
  $createQuoteNode,
  HeadingNode,
  QuoteNode,
} from "@lexical/rich-text";
import {
  $createParagraphNode,
  $getSelection,
  $isRangeSelection,
  CAN_REDO_COMMAND,
  CAN_UNDO_COMMAND,
  COMMAND_PRIORITY_LOW,
  FORMAT_TEXT_COMMAND,
  REDO_COMMAND,
  SELECTION_CHANGE_COMMAND,
  UNDO_COMMAND,
  type LexicalEditor,
} from "lexical";
import { $setBlocksType } from "@lexical/selection";
import { Bold, Italic, Link2, Redo2, Strikethrough, Undo2 } from "lucide-react";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { LinkPlugin } from "@lexical/react/LexicalLinkPlugin";
import { ListPlugin } from "@lexical/react/LexicalListPlugin";
import { MarkdownShortcutPlugin } from "@lexical/react/LexicalMarkdownShortcutPlugin";
import { OnChangePlugin } from "@lexical/react/LexicalOnChangePlugin";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { isSafeForumHref, parseForumLexicalState } from "~/lib/forum/content";

type ForumEditorProps = {
  ariaLabel: string;
  linkApplyLabel: string;
  linkLabel: string;
  linkPlaceholder: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  labels: {
    bold: string;
    italic: string;
    strikethrough: string;
    paragraph: string;
    heading1: string;
    heading2: string;
    heading3: string;
    bulletedList: string;
    numberedList: string;
    quote: string;
    inlineCode: string;
    undo: string;
    redo: string;
  };
};

const theme = {
  paragraph: "mb-2 last:mb-0",
  heading: {
    h1: "mt-5 mb-2 text-2xl font-semibold tracking-tight first:mt-0",
    h2: "mt-4 mb-2 text-lg font-semibold first:mt-0",
    h3: "mt-3 mb-2 font-semibold first:mt-0",
  },
  quote:
    "border-muted-foreground/30 text-muted-foreground my-3 border-l-2 pl-4 italic",
  list: {
    ul: "my-2 list-disc pl-6",
    ol: "my-2 list-decimal pl-6",
    listitem: "my-1",
  },
  text: {
    bold: "font-semibold",
    italic: "italic",
    strikethrough: "line-through",
    underline: "underline",
    code: "bg-muted rounded px-1 py-0.5 font-mono text-[0.9em]",
  },
};

function ToolbarButton({
  active = false,
  children,
  disabled = false,
  label,
  onClick,
}: {
  active?: boolean;
  children: ReactNode;
  disabled?: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <Button
      type="button"
      variant={active ? "secondary" : "ghost"}
      size="icon"
      aria-label={label}
      aria-pressed={active}
      title={label}
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </Button>
  );
}

function EditorToolbar({
  labels,
  linkApplyLabel,
  linkLabel,
  linkPlaceholder,
}: Pick<
  ForumEditorProps,
  "labels" | "linkApplyLabel" | "linkLabel" | "linkPlaceholder"
>) {
  const [editor] = useLexicalComposerContext();
  const [activeFormats, setActiveFormats] = useState<Set<string>>(new Set());
  const [blockType, setBlockType] = useState("paragraph");
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [linkOpen, setLinkOpen] = useState(false);
  const [linkValue, setLinkValue] = useState("");

  const updateToolbar = () => {
    editor.getEditorState().read(() => {
      const selection = $getSelection();
      if (!$isRangeSelection(selection)) return;

      const nextFormats = new Set<string>();
      for (const format of [
        "bold",
        "italic",
        "strikethrough",
        "code",
      ] as const) {
        if (selection.hasFormat(format)) nextFormats.add(format);
      }
      setActiveFormats(nextFormats);

      const topLevelNode = selection.anchor
        .getNode()
        .getTopLevelElementOrThrow();
      if (topLevelNode.getType() === "heading") {
        setBlockType((topLevelNode as HeadingNode).getTag());
      } else if (topLevelNode.getType() === "list") {
        setBlockType((topLevelNode as ListNode).getListType());
      } else {
        setBlockType(topLevelNode.getType());
      }
    });
  };

  useEffect(() => {
    const removeUpdateListener = editor.registerUpdateListener(updateToolbar);
    const removeSelectionListener = editor.registerCommand(
      SELECTION_CHANGE_COMMAND,
      () => {
        updateToolbar();
        return false;
      },
      COMMAND_PRIORITY_LOW,
    );
    const removeUndoListener = editor.registerCommand(
      CAN_UNDO_COMMAND,
      (value) => {
        setCanUndo(value);
        return false;
      },
      COMMAND_PRIORITY_LOW,
    );
    const removeRedoListener = editor.registerCommand(
      CAN_REDO_COMMAND,
      (value) => {
        setCanRedo(value);
        return false;
      },
      COMMAND_PRIORITY_LOW,
    );

    updateToolbar();
    return () => {
      removeUpdateListener();
      removeSelectionListener();
      removeUndoListener();
      removeRedoListener();
    };
  }, [editor]);

  const setBlock = (value: string) => {
    if (value === "bullet") {
      editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined);
      return;
    }
    if (value === "number") {
      editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined);
      return;
    }

    editor.update(() => {
      const selection = $getSelection();
      if (!$isRangeSelection(selection)) return;

      $setBlocksType(selection, () => {
        if (value === "h1" || value === "h2" || value === "h3") {
          return $createHeadingNode(value);
        }
        if (value === "quote") return $createQuoteNode();
        if (value === "code") return $createCodeNode();
        return $createParagraphNode();
      });
    });
  };

  const applyLink = () => {
    const href = linkValue.trim();
    if (!isSafeForumHref(href)) return;
    editor.dispatchCommand(TOGGLE_LINK_COMMAND, href);
    setLinkOpen(false);
  };

  return (
    <div className="border-border/70 bg-muted/20 flex flex-wrap items-center gap-0.5 border-b px-2 py-1">
      <ToolbarButton
        active={activeFormats.has("bold")}
        label={labels.bold}
        onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "bold")}
      >
        <Bold aria-hidden="true" />
      </ToolbarButton>
      <ToolbarButton
        active={activeFormats.has("italic")}
        label={labels.italic}
        onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "italic")}
      >
        <Italic aria-hidden="true" />
      </ToolbarButton>
      <ToolbarButton
        active={activeFormats.has("strikethrough")}
        label={labels.strikethrough}
        onClick={() =>
          editor.dispatchCommand(FORMAT_TEXT_COMMAND, "strikethrough")
        }
      >
        <Strikethrough aria-hidden="true" />
      </ToolbarButton>

      <Select value={blockType} onValueChange={setBlock}>
        <SelectTrigger className="h-8 w-28 border-0 bg-transparent px-2 text-xs shadow-none">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectItem value="paragraph">{labels.paragraph}</SelectItem>
            <SelectItem value="h1">{labels.heading1}</SelectItem>
            <SelectItem value="h2">{labels.heading2}</SelectItem>
            <SelectItem value="h3">{labels.heading3}</SelectItem>
            <SelectItem value="bullet">{labels.bulletedList}</SelectItem>
            <SelectItem value="number">{labels.numberedList}</SelectItem>
            <SelectItem value="quote">{labels.quote}</SelectItem>
            <SelectItem value="code">{labels.inlineCode}</SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>

      <Popover open={linkOpen} onOpenChange={setLinkOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={linkLabel}
            title={linkLabel}
            onMouseDown={(event) => event.preventDefault()}
          >
            <Link2 aria-hidden="true" />
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-80">
          <div className="flex gap-2">
            <Input
              autoFocus
              value={linkValue}
              placeholder={linkPlaceholder}
              aria-label={linkLabel}
              onChange={(event) => setLinkValue(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  applyLink();
                }
              }}
            />
            <Button type="button" onClick={applyLink}>
              {linkApplyLabel}
            </Button>
          </div>
        </PopoverContent>
      </Popover>

      <ToolbarButton
        label={labels.undo}
        disabled={!canUndo}
        onClick={() => editor.dispatchCommand(UNDO_COMMAND, undefined)}
      >
        <Undo2 aria-hidden="true" />
      </ToolbarButton>
      <ToolbarButton
        label={labels.redo}
        disabled={!canRedo}
        onClick={() => editor.dispatchCommand(REDO_COMMAND, undefined)}
      >
        <Redo2 aria-hidden="true" />
      </ToolbarButton>
    </div>
  );
}

function EditorPlugins({
  ariaLabel,
  labels,
  linkApplyLabel,
  linkLabel,
  linkPlaceholder,
  onChange,
  placeholder,
}: Omit<ForumEditorProps, "value">) {
  return (
    <>
      <EditorToolbar
        labels={labels}
        linkApplyLabel={linkApplyLabel}
        linkLabel={linkLabel}
        linkPlaceholder={linkPlaceholder}
      />
      <RichTextPlugin
        contentEditable={
          <div className="relative min-h-32">
            <ContentEditable
              className="forum-editor-content prose prose-zinc prose-sm dark:prose-invert min-h-32 max-w-none px-3 py-3 outline-none dark:opacity-90"
              aria-label={ariaLabel}
              aria-placeholder={placeholder}
              placeholder={
                <div className="text-muted-foreground pointer-events-none absolute top-3 left-3 text-sm">
                  {placeholder}
                </div>
              }
            />
          </div>
        }
        placeholder={null}
        ErrorBoundary={LexicalErrorBoundary}
      />
      <HistoryPlugin />
      <LinkPlugin
        validateUrl={isSafeForumHref}
        attributes={{ rel: "noopener noreferrer" }}
      />
      <ListPlugin />
      <MarkdownShortcutPlugin transformers={TRANSFORMERS} />
      <OnChangePlugin
        onChange={(editorState) =>
          onChange(JSON.stringify(editorState.toJSON()))
        }
      />
    </>
  );
}

export function ForumEditor({ value, onChange, ...props }: ForumEditorProps) {
  const initialEditorState = useMemo(() => {
    if (!value.trim()) return undefined;
    if (parseForumLexicalState(value)) return value;

    return (editor: LexicalEditor) => {
      editor.update(() => {
        $convertFromMarkdownString(value, TRANSFORMERS);
      });
    };
  }, [value]);

  const initialConfig = useMemo(
    () => ({
      namespace: "SharplyForumEditor",
      nodes: [
        HeadingNode,
        QuoteNode,
        ListNode,
        ListItemNode,
        LinkNode,
        CodeNode,
      ],
      editorState: initialEditorState,
      theme,
      onError: (error: Error) => {
        throw error;
      },
    }),
    [initialEditorState],
  );

  return (
    <div className="border-input bg-background focus-within:ring-ring/50 relative overflow-hidden rounded-md border shadow-sm focus-within:ring-2">
      <LexicalComposer initialConfig={initialConfig}>
        <EditorPlugins {...props} onChange={onChange} />
      </LexicalComposer>
    </div>
  );
}
