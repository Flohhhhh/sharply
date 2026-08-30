import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { ArrowUpRight, CheckCircle2, MessageSquare, Pin } from "lucide-react";
import { ZodError } from "zod";
import { auth } from "~/auth";
import { Badge } from "~/components/ui/badge";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "~/components/ui/empty";
import { LinkButton } from "~/components/ui/link-button";
import {
  ForumComposeDrawer,
  ForumComposeTrigger,
  type ForumComposeActionState,
} from "~/components/forum/forum-compose-drawer";
import { defaultLocale, isLocale } from "~/i18n/config";
import { localizePathname } from "~/i18n/routing";
import { formatDate } from "~/lib/format/date";
import { buildLocalizedMetadata } from "~/lib/seo/metadata";
import { actionCreateForumThread } from "~/server/forum/actions";
import { fetchForumHome } from "~/server/forum/service";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale: requestedLocale } = await params;
  const locale = isLocale(requestedLocale) ? requestedLocale : defaultLocale;
  const t = await getTranslations({ locale, namespace: "forum" });

  return buildLocalizedMetadata("/forum", {
    title: t("forumMetadataTitle"),
    description: t("forumMetadataDescription"),
    openGraph: {
      title: t("forumMetadataTitle"),
      description: t("forumMetadataDescription"),
    },
  });
}

function authorLabel(
  author: {
    authorName: string | null;
    authorHandle: string | null;
    authorMemberNumber: number;
  },
  memberLabel: string,
) {
  if (author.authorName?.trim()) return author.authorName;
  if (author.authorHandle?.trim()) return `@${author.authorHandle}`;
  return memberLabel.replace("{number}", String(author.authorMemberNumber));
}

type ForumHome = Awaited<ReturnType<typeof fetchForumHome>>;
type ForumThread = ForumHome["threads"][number];

function buildCategoryRows(
  categories: ForumHome["categories"],
  threads: ForumHome["threads"],
) {
  const stats = new Map<
    string,
    {
      latestThread: ForumThread | null;
    }
  >();

  for (const category of categories) {
    stats.set(category.id, {
      latestThread: null,
    });
  }

  for (const thread of threads) {
    const categoryStats = stats.get(thread.categoryId);
    if (!categoryStats) continue;

    if (
      !categoryStats.latestThread ||
      thread.lastActivityAt > categoryStats.latestThread.lastActivityAt
    ) {
      categoryStats.latestThread = thread;
    }
  }

  return categories.map((category) => ({
    ...category,
    ...stats.get(category.id)!,
  }));
}

export default async function ForumPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ view?: string; category?: string; compose?: string }>;
}) {
  const { locale: requestedLocale } = await params;
  const locale = isLocale(requestedLocale) ? requestedLocale : defaultLocale;
  const [
    { categories, threads },
    t,
    session,
    {
      view: requestedView,
      category: requestedCategory,
      compose: requestedCompose,
    },
  ] = await Promise.all([
    fetchForumHome(),
    getTranslations({ locale, namespace: "forum" }),
    auth.api.getSession({ headers: await headers() }),
    searchParams,
  ]);
  const view = requestedView === "latest" ? "latest" : "categories";
  const categoryRows = buildCategoryRows(categories, threads);
  const activeCategory = categories.find(
    (category) => category.slug === requestedCategory,
  );
  const visibleThreads = activeCategory
    ? threads.filter((thread) => thread.categorySlug === activeCategory.slug)
    : threads;

  const forumPath = localizePathname("/forum", locale);
  const categoriesHref = `${forumPath}?view=categories`;
  const latestHref = `${forumPath}?view=latest`;

  const composeThreadPath = `${forumPath}?compose=thread`;
  const signInHref = `${localizePathname("/auth/signin", locale)}?callbackUrl=${encodeURIComponent(composeThreadPath)}`;

  async function submitThread(
    _state: ForumComposeActionState,
    formData: FormData,
  ): Promise<ForumComposeActionState> {
    "use server";

    try {
      const thread = await actionCreateForumThread({
        categoryId: readFormValue(formData, "categoryId"),
        title: readFormValue(formData, "title"),
        content: readFormValue(formData, "content"),
      });

      redirect(localizePathname(`/forum/t/${thread.id}`, locale));
    } catch (error) {
      if (error instanceof ZodError) {
        return { error: "invalidDiscussion" };
      }

      throw error;
    }
  }

  return (
    <ForumComposeDrawer
      action={submitThread}
      categories={categories.map(({ id, name }) => ({ id, name }))}
      copy={{
        title: t("newDiscussion"),
        description: t("markdownHint"),
        close: t("closeComposer"),
        expand: t("expandComposer"),
        collapse: t("collapseComposer"),
        cancel: t("cancel"),
        submit: t("publishDiscussion"),
        categoryLabel: t("category"),
        selectCategory: t("selectCategory"),
        titleLabel: t("titleLabel"),
        titlePlaceholder: t("titlePlaceholder"),
        bodyLabel: t("bodyLabel"),
        bodyPlaceholder: t("bodyPlaceholder"),
        editorAriaLabel: t("editorAriaLabel"),
        editorLinkApply: t("editorLinkApply"),
        editorLink: t("editorLink"),
        editorLinkPlaceholder: t("editorLinkPlaceholder"),
        editorBold: t("editorBold"),
        editorItalic: t("editorItalic"),
        editorStrikethrough: t("editorStrikethrough"),
        editorParagraph: t("editorParagraph"),
        editorHeading1: t("editorHeading1"),
        editorHeading2: t("editorHeading2"),
        editorHeading3: t("editorHeading3"),
        editorBulletedList: t("editorBulletedList"),
        editorNumberedList: t("editorNumberedList"),
        editorQuote: t("editorQuote"),
        editorInlineCode: t("editorInlineCode"),
        editorUndo: t("editorUndo"),
        editorRedo: t("editorRedo"),
        invalidMessage: t("invalidDiscussion"),
        noCategoriesMessage: t("noCategoriesForNewThread"),
      }}
      initialOpen={Boolean(session?.user && requestedCompose === "thread")}
      mode="thread"
    >
      <div className="space-y-8">
        <section className="space-y-5">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div className="min-w-0 flex-1">
              <div className="w-full max-w-3xl">
                <h1 className="text-foreground text-4xl leading-tight font-bold tracking-tight sm:text-6xl">
                  {t("title")}
                </h1>
              </div>
            </div>
            {session?.user ? (
              <ForumComposeTrigger>
                <MessageSquare aria-hidden="true" />
                <span>{t("startDiscussion")}</span>
              </ForumComposeTrigger>
            ) : (
              <LinkButton href={signInHref} icon={<MessageSquare />}>
                {t("signInToParticipate")}
              </LinkButton>
            )}
          </div>

          <nav
            aria-label={t("forumViews")}
            className="border-border flex items-center gap-1 border-b"
          >
            <Link
              href={categoriesHref}
              scroll={false}
              aria-current={view === "categories" ? "page" : undefined}
              className={
                view === "categories"
                  ? "border-foreground text-foreground -mb-px border-b-2 px-3 py-3 text-sm font-medium"
                  : "text-muted-foreground hover:text-foreground px-3 py-3 text-sm transition-colors"
              }
            >
              {t("categories")}
            </Link>
            <Link
              href={latestHref}
              scroll={false}
              aria-current={view === "latest" ? "page" : undefined}
              className={
                view === "latest"
                  ? "border-foreground text-foreground -mb-px border-b-2 px-3 py-3 text-sm font-medium"
                  : "text-muted-foreground hover:text-foreground px-3 py-3 text-sm transition-colors"
              }
            >
              {t("latest")}
            </Link>
          </nav>
        </section>

        {view === "categories" ? (
          <section id="categories" className="scroll-mt-24 space-y-5">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="text-2xl font-semibold tracking-tight">
                  {t("categories")}
                </h2>
                <p className="text-muted-foreground mt-1 text-sm">
                  {t("categoryDirectoryDescription")}
                </p>
              </div>
              <span className="text-muted-foreground text-sm">
                {t("categoryCount", { count: categoryRows.length })}
              </span>
            </div>

            {categoryRows.length ? (
              <div className="divide-border divide-y overflow-hidden rounded-xl border">
                {categoryRows.map((category) => {
                  const latestThread = category.latestThread;
                  const latestAuthor = latestThread
                    ? authorLabel(latestThread, t("member"))
                    : null;

                  return (
                    <div
                      key={category.id}
                      className="grid gap-5 px-5 py-5 sm:px-6 lg:grid-cols-[minmax(0,1fr)_auto_minmax(15rem,24rem)] lg:items-center"
                    >
                      <div className="min-w-0">
                        <Link
                          href={
                            forumPath +
                            "?view=latest&category=" +
                            encodeURIComponent(category.slug)
                          }
                          scroll={false}
                          className="group inline-block"
                        >
                          <h3 className="group-hover:text-primary text-lg font-semibold tracking-tight transition-colors">
                            {category.name}
                          </h3>
                        </Link>
                        {category.description ? (
                          <p className="text-muted-foreground mt-1 max-w-2xl text-sm leading-relaxed">
                            {category.description}
                          </p>
                        ) : null}
                      </div>

                      <div className="text-muted-foreground flex gap-4 text-sm lg:flex-col lg:gap-1 lg:text-right">
                        <span>
                          {t("threadCount", { count: category.threadCount })}
                        </span>
                        <span>
                          {t("replies", { count: category.replyCount })}
                        </span>
                      </div>

                      <div className="border-border/70 min-w-0 border-t pt-4 lg:border-t-0 lg:border-l lg:pt-0 lg:pl-5">
                        <p className="text-muted-foreground text-xs font-semibold tracking-[0.14em] uppercase">
                          {t("latestActivity")}
                        </p>
                        {latestThread && latestAuthor ? (
                          <Link
                            href={localizePathname(
                              `/forum/t/${latestThread.id}`,
                              locale,
                            )}
                            className="group mt-2 block"
                          >
                            <span className="group-hover:text-primary block truncate text-sm font-medium transition-colors">
                              {latestThread.title}
                            </span>
                            <span className="text-muted-foreground mt-1 block truncate text-xs">
                              {latestAuthor} ·{" "}
                              {formatDate(latestThread.lastActivityAt, {
                                locale,
                                preset: "date-medium",
                              })}
                            </span>
                          </Link>
                        ) : (
                          <p className="text-muted-foreground mt-2 text-sm">
                            {t("noCategoryDiscussions")}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <Empty className="min-h-80 border-0 px-0 py-12">
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <MessageSquare />
                  </EmptyMedia>
                  <EmptyTitle>{t("noCategoriesTitle")}</EmptyTitle>
                  <EmptyDescription>
                    {t("noCategoriesDescription")}
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            )}
          </section>
        ) : (
          <section id="latest" className="scroll-mt-24 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h2 className="text-2xl font-semibold tracking-tight">
                {t("latestDiscussions")}
              </h2>
              <span className="text-muted-foreground text-sm">
                {t("recentActivity")}
              </span>
            </div>

            {visibleThreads.length ? (
              <div className="divide-border divide-y">
                {visibleThreads.map((thread) => {
                  const author = authorLabel(thread, t("member"));
                  return (
                    <Link
                      key={thread.id}
                      href={localizePathname(`/forum/t/${thread.id}`, locale)}
                      className="group block space-y-3 py-5 first:pt-2"
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="outline">{thread.categoryName}</Badge>
                        {thread.isPinned ? (
                          <Badge variant="secondary">
                            <Pin />
                            {t("pinned")}
                          </Badge>
                        ) : null}
                        {thread.bestAnswerPostId ? (
                          <Badge variant="secondary">
                            <CheckCircle2 />
                            {t("bestAnswer")}
                          </Badge>
                        ) : null}
                      </div>
                      <div className="flex items-start justify-between gap-4">
                        <h3 className="group-hover:text-primary text-lg font-medium tracking-tight transition-colors">
                          {thread.title}
                        </h3>
                        <ArrowUpRight className="text-muted-foreground mt-1 size-4 shrink-0" />
                      </div>
                      <div className="text-muted-foreground flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
                        <span>{t("postedBy", { name: author })}</span>
                        <span aria-hidden="true">·</span>
                        <time dateTime={thread.lastActivityAt.toISOString()}>
                          {formatDate(thread.lastActivityAt, {
                            locale,
                            preset: "date-medium",
                          })}
                        </time>
                        <span aria-hidden="true">·</span>
                        <span>
                          {t("replies", { count: thread.replyCount })}
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <Empty className="min-h-80 border-0 px-0 py-12">
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <MessageSquare />
                  </EmptyMedia>
                  <EmptyTitle>{t("noThreadsTitle")}</EmptyTitle>
                  <EmptyDescription>
                    {t("noThreadsDescription")}
                  </EmptyDescription>
                </EmptyHeader>
                <EmptyContent>
                  {session?.user ? (
                    <ForumComposeTrigger>
                      <MessageSquare aria-hidden="true" />
                      <span>{t("createFirstDiscussion")}</span>
                    </ForumComposeTrigger>
                  ) : (
                    <LinkButton href={signInHref} icon={<MessageSquare />}>
                      {t("createFirstDiscussion")}
                    </LinkButton>
                  )}
                </EmptyContent>
              </Empty>
            )}
          </section>
        )}

        <section className="border-t pt-6 lg:hidden">
          <h2 className="font-semibold">{t("guidelinesTitle")}</h2>
          <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
            {t("guidelinesDescription")}
          </p>
        </section>

        {session?.user ? (
          <ForumComposeTrigger
            className="fixed right-4 bottom-4 z-40 shadow-lg sm:right-6 sm:bottom-6"
            draftLabel={t("openDraft")}
          >
            <MessageSquare aria-hidden="true" />
            <span>{t("startDiscussion")}</span>
          </ForumComposeTrigger>
        ) : (
          <LinkButton
            href={signInHref}
            icon={<MessageSquare />}
            className="fixed right-4 bottom-4 z-40 shadow-lg sm:right-6 sm:bottom-6"
          >
            {t("signInToParticipate")}
          </LinkButton>
        )}
      </div>
    </ForumComposeDrawer>
  );
}

function readFormValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}
