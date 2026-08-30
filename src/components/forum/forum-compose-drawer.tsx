"use client";

import { AlertCircle, X } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  createContext,
  type ReactNode,
  useCallback,
  useActionState,
  useContext,
  useEffect,
  useState,
} from "react";
import { useFormStatus } from "react-dom";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Button } from "~/components/ui/button";
import { Alert, AlertDescription } from "~/components/ui/alert";
import { ForumEditor } from "~/components/forum/forum-editor";
import {
  FloatingDrawer,
  FloatingDrawerClose,
  FloatingDrawerContent,
  FloatingDrawerDescription,
  FloatingDrawerHeader,
  FloatingDrawerTitle,
} from "~/components/ui/floating-drawer";
import {
  ForumComposeDraftProvider,
  type ForumComposeDraft,
  useForumComposeDraft,
} from "~/components/forum/forum-compose-draft";

export type ForumComposeError = "invalidDiscussion" | "invalidReply";

export type ForumComposeActionState = {
  error: ForumComposeError | null;
};

export type ForumComposeAction = (
  state: ForumComposeActionState,
  formData: FormData,
) => Promise<ForumComposeActionState>;

export type ForumComposeCategory = {
  id: string;
  name: string;
};

export type ForumComposeCopy = {
  title: string;
  description: string;
  close: string;
  expand: string;
  collapse: string;
  cancel: string;
  submit: string;
  categoryLabel: string;
  selectCategory: string;
  titleLabel: string;
  titlePlaceholder: string;
  bodyLabel: string;
  bodyPlaceholder: string;
  editorAriaLabel: string;
  editorLinkApply: string;
  editorLink: string;
  editorLinkPlaceholder: string;
  editorBold: string;
  editorItalic: string;
  editorStrikethrough: string;
  editorParagraph: string;
  editorHeading1: string;
  editorHeading2: string;
  editorHeading3: string;
  editorBulletedList: string;
  editorNumberedList: string;
  editorQuote: string;
  editorInlineCode: string;
  editorUndo: string;
  editorRedo: string;
  invalidMessage: string;
  noCategoriesMessage: string;
};

type ForumComposeContextValue = {
  hasDraft: boolean;
  open: () => void;
};

const ForumComposeContext = createContext<ForumComposeContextValue | null>(
  null,
);

function useForumCompose() {
  const context = useContext(ForumComposeContext);
  if (!context) {
    throw new Error(
      "ForumComposeTrigger must be rendered inside ForumComposeDrawer",
    );
  }

  return context;
}

export function ForumComposeTrigger({
  children,
  draftLabel,
  ...props
}: Omit<
  React.ComponentProps<typeof Button>,
  "children" | "onClick" | "type"
> & {
  children: ReactNode;
  draftLabel?: string;
}) {
  const { hasDraft, open } = useForumCompose();

  return (
    <Button type="button" onClick={open} {...props}>
      {hasDraft && draftLabel ? draftLabel : children}
    </Button>
  );
}

function SubmitButton({
  disabled = false,
  label,
}: {
  disabled?: boolean;
  label: string;
}) {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" loading={pending} disabled={disabled || pending}>
      {label}
    </Button>
  );
}

function ForumComposeForm({
  action,
  categories,
  copy,
  draft,
  mode,
  onCancel,
  onDraftChange,
}: {
  action: ForumComposeAction;
  categories: readonly ForumComposeCategory[];
  copy: ForumComposeCopy;
  draft: ForumComposeDraft;
  mode: "thread" | "reply";
  onCancel: () => void;
  onDraftChange: (draft: Partial<ForumComposeDraft>) => void;
}) {
  const [state, formAction] = useActionState<ForumComposeActionState, FormData>(
    action,
    { error: null },
  );
  const canCreateThread = mode === "reply" || categories.length > 0;

  return (
    <form action={formAction} className="flex min-h-0 flex-1 flex-col">
      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-6">
        <div className="mx-auto flex w-full max-w-4xl flex-col gap-5">
          {state.error ? (
            <Alert variant="destructive">
              <AlertCircle aria-hidden="true" />
              <AlertDescription>{copy.invalidMessage}</AlertDescription>
            </Alert>
          ) : null}

          {mode === "thread" && !categories.length ? (
            <Alert>
              <AlertDescription>{copy.noCategoriesMessage}</AlertDescription>
            </Alert>
          ) : null}

          {mode === "thread" ? (
            <>
              <div className="flex flex-col gap-2">
                <Label htmlFor="forum-thread-title">{copy.titleLabel}</Label>
                <Input
                  id="forum-thread-title"
                  name="title"
                  required
                  minLength={5}
                  maxLength={240}
                  placeholder={copy.titlePlaceholder}
                  value={draft.title}
                  onChange={(event) =>
                    onDraftChange({ title: event.target.value })
                  }
                />
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="forum-thread-category">
                  {copy.categoryLabel}
                </Label>
                <Select
                  name="categoryId"
                  value={draft.categoryId}
                  onValueChange={(categoryId) => onDraftChange({ categoryId })}
                  required
                >
                  <SelectTrigger id="forum-thread-category" className="w-full">
                    <SelectValue placeholder={copy.selectCategory} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
            </>
          ) : null}

          <div className="flex min-h-36 flex-1 flex-col gap-2">
            <Label htmlFor="forum-compose-content">{copy.bodyLabel}</Label>
            <input type="hidden" name="content" value={draft.content} />
            <ForumEditor
              ariaLabel={copy.editorAriaLabel}
              linkApplyLabel={copy.editorLinkApply}
              linkLabel={copy.editorLink}
              linkPlaceholder={copy.editorLinkPlaceholder}
              placeholder={copy.bodyPlaceholder}
              value={draft.content}
              onChange={(content) => onDraftChange({ content })}
              labels={{
                bold: copy.editorBold,
                italic: copy.editorItalic,
                strikethrough: copy.editorStrikethrough,
                paragraph: copy.editorParagraph,
                heading1: copy.editorHeading1,
                heading2: copy.editorHeading2,
                heading3: copy.editorHeading3,
                bulletedList: copy.editorBulletedList,
                numberedList: copy.editorNumberedList,
                quote: copy.editorQuote,
                inlineCode: copy.editorInlineCode,
                undo: copy.editorUndo,
                redo: copy.editorRedo,
              }}
            />
          </div>
        </div>
      </div>

      <div className="mt-0 flex shrink-0 flex-row items-center justify-end gap-2 border-t px-4 py-3 sm:px-6">
        <Button type="button" variant="ghost" onClick={onCancel}>
          {copy.cancel}
        </Button>
        <SubmitButton disabled={!canCreateThread} label={copy.submit} />
      </div>
    </form>
  );
}

type ForumComposeDrawerProps = {
  action: ForumComposeAction;
  categories?: readonly ForumComposeCategory[];
  children: ReactNode;
  copy: ForumComposeCopy;
  initialOpen?: boolean;
  mode: "thread" | "reply";
};

function ForumComposeDrawerContent({
  action,
  categories = [],
  children,
  copy,
  initialOpen = false,
  mode,
}: ForumComposeDrawerProps) {
  const [open, setOpen] = useState(initialOpen);
  const { draft, resetDraft, updateDraft } = useForumComposeDraft();
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  const clearComposeQuery = useCallback(() => {
    if (!searchParams.has("compose")) return;

    const nextParams = new URLSearchParams(searchParams.toString());
    nextParams.delete("compose");
    const query = nextParams.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, {
      scroll: false,
    });
  }, [pathname, router, searchParams]);

  const closeComposer = useCallback(() => {
    setOpen(false);
    clearComposeQuery();
  }, [clearComposeQuery]);

  const discardComposer = useCallback(() => {
    resetDraft(categories[0]?.id ?? "");
    closeComposer();
  }, [categories, closeComposer, resetDraft]);

  const handleOpenChange = useCallback(
    (nextOpen: boolean) => {
      if (nextOpen) setOpen(true);
      else closeComposer();
    },
    [closeComposer],
  );

  const openComposer = useCallback(() => {
    setOpen(true);
  }, []);

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") handleOpenChange(false);
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleOpenChange, open]);

  return (
    <ForumComposeContext.Provider
      value={{
        hasDraft: Boolean(draft.title.trim() || draft.content.trim()),
        open: openComposer,
      }}
    >
      <FloatingDrawer
        open={open}
        modal={false}
        onOpenChange={handleOpenChange}
        direction="bottom"
      >
        {children}
        <FloatingDrawerContent className="overflow-hidden">
          <FloatingDrawerHeader className="px-4 pt-2 pb-3 text-left sm:px-6">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <FloatingDrawerTitle className="truncate text-left text-base">
                  {copy.title}
                </FloatingDrawerTitle>
                <FloatingDrawerDescription className="mt-1 text-left">
                  {copy.description}
                </FloatingDrawerDescription>
              </div>
              <FloatingDrawerClose asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label={copy.close}
                >
                  <X aria-hidden="true" />
                </Button>
              </FloatingDrawerClose>
            </div>
          </FloatingDrawerHeader>

          <ForumComposeForm
            action={action}
            categories={categories}
            copy={copy}
            draft={draft}
            mode={mode}
            onCancel={discardComposer}
            onDraftChange={updateDraft}
          />
        </FloatingDrawerContent>
      </FloatingDrawer>
    </ForumComposeContext.Provider>
  );
}

export function ForumComposeDrawer(props: ForumComposeDrawerProps) {
  return (
    <ForumComposeDraftProvider
      initialCategoryId={props.categories?.[0]?.id ?? ""}
    >
      <ForumComposeDrawerContent {...props} />
    </ForumComposeDraftProvider>
  );
}
