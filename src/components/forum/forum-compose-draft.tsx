"use client";

import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useState,
} from "react";

export type ForumComposeDraft = {
  title: string;
  categoryId: string;
  content: string;
};

type ForumComposeDraftContextValue = {
  draft: ForumComposeDraft;
  resetDraft: (categoryId: string) => void;
  updateDraft: (updates: Partial<ForumComposeDraft>) => void;
};

const ForumComposeDraftContext =
  createContext<ForumComposeDraftContextValue | null>(null);

export function ForumComposeDraftProvider({
  children,
  initialCategoryId,
}: {
  children: ReactNode;
  initialCategoryId: string;
}) {
  const [draft, setDraft] = useState<ForumComposeDraft>(() => ({
    title: "",
    categoryId: initialCategoryId,
    content: "",
  }));

  const updateDraft = useCallback((updates: Partial<ForumComposeDraft>) => {
    setDraft((current) => ({ ...current, ...updates }));
  }, []);

  const resetDraft = useCallback((categoryId: string) => {
    setDraft({ title: "", categoryId, content: "" });
  }, []);

  return (
    <ForumComposeDraftContext.Provider
      value={{ draft, resetDraft, updateDraft }}
    >
      {children}
    </ForumComposeDraftContext.Provider>
  );
}

export function useForumComposeDraft() {
  const context = useContext(ForumComposeDraftContext);
  if (!context) {
    throw new Error(
      "useForumComposeDraft must be rendered inside ForumComposeDraftProvider",
    );
  }

  return context;
}
