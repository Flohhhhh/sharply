import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import {
  CheckCircle2,
  Link2,
  MessageSquare,
  MoreHorizontal,
  UserRound,
} from "lucide-react";
import { ZodError } from "zod";
import { auth } from "~/auth";
import { Badge } from "~/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Button } from "~/components/ui/button";
import { LinkButton } from "~/components/ui/link-button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { Breadcrumbs } from "~/components/layout/breadcrumbs";
import {
  ForumComposeDrawer,
  ForumComposeTrigger,
  type ForumComposeActionState,
} from "~/components/forum/forum-compose-drawer";
import { ForumPostContent } from "~/components/forum/forum-post-content";
import { defaultLocale, isLocale } from "~/i18n/config";
import { localizePathname } from "~/i18n/routing";
import { RelativeTime } from "~/components/relative-time";
import { buildLocalizedMetadata } from "~/lib/seo/metadata";
import { cn } from "~/lib/utils";
import {
  actionChooseForumBestAnswer,
  actionCreateForumPost,
} from "~/server/forum/actions";
import { fetchForumThread } from "~/server/forum/service";
import { requireRole } from "~/lib/auth/auth-helpers";

export const dynamic = "force-dynamic";

function readFormValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}): Promise<Metadata> {
  const { locale: requestedLocale, id } = await params;
  const locale = isLocale(requestedLocale) ? requestedLocale : defaultLocale;
  const [thread, t] = await Promise.all([
    fetchForumThread(id),
    getTranslations({ locale, namespace: "forum" }),
  ]);

  return buildLocalizedMetadata(`/forum/t/${id}`, {
    title: thread?.thread.title ?? t("threadNotFound"),
    description: t("forumMetadataDescription"),
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

export default async function ForumThreadPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; id: string }>;
  searchParams: Promise<{ compose?: string }>;
}) {
  const { locale: requestedLocale, id } = await params;
  const locale = isLocale(requestedLocale) ? requestedLocale : defaultLocale;
  const [{ compose: requestedCompose }, threadData, t, session] =
    await Promise.all([
      searchParams,
      fetchForumThread(id),
      getTranslations({ locale, namespace: "forum" }),
      auth.api.getSession({ headers: await headers() }),
    ]);

  if (!threadData) notFound();

  const { thread, posts, linkedGear } = threadData;
  const canChooseBestAnswer = Boolean(
    session?.user &&
    (session.user.id === thread.authorUserId ||
      requireRole(session.user, ["MODERATOR"])),
  );

  async function submitReply(
    _state: ForumComposeActionState,
    formData: FormData,
  ): Promise<ForumComposeActionState> {
    "use server";

    try {
      await actionCreateForumPost({
        threadId: thread.id,
        content: readFormValue(formData, "content"),
      });

      redirect(localizePathname(`/forum/t/${thread.id}`, locale));
    } catch (error) {
      if (error instanceof ZodError) {
        return { error: "invalidReply" };
      }

      throw error;
    }
  }

  async function chooseBestAnswer(formData: FormData) {
    "use server";

    await actionChooseForumBestAnswer({
      threadId: thread.id,
      postId: readFormValue(formData, "postId") || null,
    });

    redirect(localizePathname(`/forum/t/${thread.id}`, locale));
  }

  const threadPath = localizePathname(`/forum/t/${thread.id}`, locale);
  const categoryPath = `/forum?view=latest&category=${encodeURIComponent(thread.categorySlug)}`;
  const composeReplyPath = `${threadPath}?compose=reply`;
  const signInHref = `${localizePathname("/auth/signin", locale)}?callbackUrl=${encodeURIComponent(composeReplyPath)}`;
  const numberFormatter = new Intl.NumberFormat(locale, {
    notation: "compact",
    maximumFractionDigits: 1,
  });
  const participants = Array.from(
    new Map(
      posts.map((post) => [
        post.authorUserId,
        {
          id: post.authorUserId,
          name: authorLabel(post, t("member")),
          image: post.authorImage,
        },
      ]),
    ).values(),
  );
  const visibleParticipants = participants.slice(0, 6);
  const remainingParticipants =
    participants.length - visibleParticipants.length;
  const participantSummary = (
    <div className="border-border/70 flex h-16 items-center justify-between gap-6 border-y">
      <div className="flex items-center gap-x-6">
        <div className="flex flex-col">
          <span className="text-lg leading-none font-medium">
            {numberFormatter.format(thread.viewCount)}
          </span>
          <span className="text-muted-foreground mt-1 text-xs">
            {t("viewsLabel")}
          </span>
        </div>
        <div className="flex flex-col">
          <span className="text-lg leading-none font-medium">
            {numberFormatter.format(thread.replyCount)}
          </span>
          <span className="text-muted-foreground mt-1 text-xs">
            {t("repliesLabel")}
          </span>
        </div>
        <div className="flex flex-col">
          <span className="text-lg leading-none font-medium">
            {numberFormatter.format(participants.length)}
          </span>
          <span className="text-muted-foreground mt-1 text-xs">
            {t("participantsLabel")}
          </span>
        </div>
      </div>

      {visibleParticipants.length ? (
        <div className="flex items-center" aria-label={t("participantsLabel")}>
          {visibleParticipants.map((participant) => (
            <Avatar
              key={participant.id}
              className="border-background -ml-1.5 size-8 border-2 first:ml-0"
            >
              <AvatarImage
                src={participant.image ?? undefined}
                alt={participant.name}
              />
              <AvatarFallback>
                {participant.name.trim().charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          ))}
          {remainingParticipants > 0 ? (
            <Avatar className="border-background bg-muted text-muted-foreground -ml-1.5 size-8 border-2">
              <AvatarFallback className="text-xs">
                +{remainingParticipants}
              </AvatarFallback>
            </Avatar>
          ) : null}
        </div>
      ) : null}
    </div>
  );

  return (
    <ForumComposeDrawer
      action={submitReply}
      copy={{
        title: t("reply"),
        description: t("markdownHint"),
        close: t("closeComposer"),
        expand: t("expandComposer"),
        collapse: t("collapseComposer"),
        cancel: t("cancel"),
        submit: t("postReply"),
        categoryLabel: t("category"),
        selectCategory: t("selectCategory"),
        titleLabel: t("titleLabel"),
        titlePlaceholder: t("titlePlaceholder"),
        bodyLabel: t("bodyLabel"),
        bodyPlaceholder: t("replyPlaceholder"),
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
        invalidMessage: t("invalidReply"),
        noCategoriesMessage: t("noCategoriesForNewThread"),
      }}
      initialOpen={Boolean(session?.user && requestedCompose === "reply")}
      mode="reply"
    >
      <div className="mx-auto w-full max-w-5xl space-y-8">
        <div className="border-border/70 space-y-4 border-b pb-8">
          <Breadcrumbs
            items={[
              { label: t("forums"), href: "/forum" },
              { label: thread.categoryName, href: categoryPath },
              { label: thread.title },
            ]}
          />
          <div className="space-y-3">
            <h2 className="pt-2 pb-2 text-4xl font-semibold tracking-tight sm:text-6xl">
              {thread.title}
            </h2>
            {thread.bestAnswerPostId ? (
              <div className="text-muted-foreground flex flex-wrap items-center gap-2 text-sm">
                <Badge variant="secondary">
                  <CheckCircle2 />
                  {t("bestAnswer")}
                </Badge>
              </div>
            ) : null}
          </div>
        </div>

        {linkedGear.length ? (
          <div className="flex gap-3 overflow-x-auto pb-1">
            {linkedGear.map((item) => (
              <Link
                key={item.id}
                href={localizePathname(`/gear/${item.slug}`, locale)}
                className="bg-muted/30 hover:bg-accent flex min-w-64 items-center gap-3 rounded-lg border px-3 py-2 transition-colors"
              >
                <div className="bg-muted size-12 shrink-0 overflow-hidden rounded-md">
                  {item.thumbnailUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.thumbnailUrl}
                      alt={item.name}
                      className="size-full object-contain"
                    />
                  ) : null}
                </div>
                <div className="min-w-0">
                  <p className="text-muted-foreground text-xs">
                    {item.brandName ?? t("category")}
                  </p>
                  <p className="truncate text-sm font-medium">{item.name}</p>
                </div>
                <Link2 className="text-muted-foreground ml-auto size-4 shrink-0" />
              </Link>
            ))}
          </div>
        ) : null}

        <section>
          {posts.map((post, index) => {
            const isBestAnswer = post.id === thread.bestAnswerPostId;
            const author = authorLabel(post, t("member"));
            const hasPostMetadata = isBestAnswer || post.editCount > 0;
            return (
              <article
                key={post.id}
                className={cn(
                  "group py-6",
                  index === 0 && "pt-0 pb-0",
                  index === posts.length - 1 && "pb-0",
                )}
              >
                <div className="grid grid-cols-[2rem_minmax(0,1fr)] items-start gap-x-4 sm:gap-x-6">
                  <div
                    className={cn(
                      "sticky top-2 self-start",
                      index > 1 && "pt-6",
                    )}
                  >
                    <Avatar className="bg-muted size-8 shrink-0">
                      <AvatarImage src={post.authorImage ?? undefined} alt="" />
                      <AvatarFallback>
                        <UserRound aria-hidden="true" className="size-4" />
                      </AvatarFallback>
                    </Avatar>
                  </div>
                  <div
                    className={cn(
                      "min-w-0",
                      index > 1 && "border-border/70 border-t pt-6",
                    )}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <p className="min-w-0 font-medium">{author}</p>
                      <div className="text-muted-foreground flex shrink-0 items-center gap-1 text-xs">
                        <RelativeTime
                          isoDate={post.createdAt.toISOString()}
                          locale={locale}
                          style="short"
                          numeric="always"
                          fallbackPreset="datetime-short"
                        />
                        <span aria-hidden="true">·</span>
                        <span>#{index + 1}</span>
                      </div>
                    </div>
                    <ForumPostContent content={post.content} />

                    {hasPostMetadata || canChooseBestAnswer ? (
                      <div className="mt-5 flex min-h-8 items-end gap-4">
                        {hasPostMetadata ? (
                          <div className="text-muted-foreground flex flex-wrap items-center gap-x-3 gap-y-2 text-xs">
                            {isBestAnswer ? (
                              <span className="text-primary flex items-center gap-1.5 font-medium">
                                <CheckCircle2 aria-hidden="true" />
                                {t("bestAnswer")}
                              </span>
                            ) : null}
                            {post.editCount ? <span>{t("edited")}</span> : null}
                          </div>
                        ) : null}

                        {canChooseBestAnswer ? (
                          <div className="ml-auto opacity-100 transition-opacity sm:opacity-0 sm:group-focus-within:opacity-100 sm:group-hover:opacity-100">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  aria-label={t("postOptions")}
                                >
                                  <MoreHorizontal aria-hidden="true" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <form action={chooseBestAnswer}>
                                  <input
                                    type="hidden"
                                    name="postId"
                                    value={post.id}
                                  />
                                  <DropdownMenuItem asChild>
                                    <button type="submit">
                                      <CheckCircle2 aria-hidden="true" />
                                      {isBestAnswer
                                        ? t("removeBestAnswer")
                                        : t("markBestAnswer")}
                                    </button>
                                  </DropdownMenuItem>
                                </form>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        ) : null}
                      </div>
                    ) : null}
                    {index === 0 ? participantSummary : null}
                  </div>
                </div>
              </article>
            );
          })}
        </section>

        {thread.status === "OPEN" ? (
          session?.user ? (
            <div className={cn(posts.length > 1 && "border-t", "pt-6")}>
              <ForumComposeTrigger>
                <MessageSquare aria-hidden="true" />
                <span>{t("reply")}</span>
              </ForumComposeTrigger>
            </div>
          ) : (
            <div className={cn(posts.length > 1 && "border-t", "pt-6")}>
              <LinkButton href={signInHref} icon={<MessageSquare />}>
                {t("signInToReply")}
              </LinkButton>
            </div>
          )
        ) : (
          <p className="text-muted-foreground border-t pt-6 text-sm">
            {t("threadLocked")}
          </p>
        )}

        {thread.status === "OPEN" ? (
          session?.user ? (
            <ForumComposeTrigger
              className="fixed right-4 bottom-4 z-40 shadow-lg sm:right-6 sm:bottom-6"
              draftLabel={t("openDraft")}
            >
              <MessageSquare aria-hidden="true" />
              <span>{t("reply")}</span>
            </ForumComposeTrigger>
          ) : (
            <LinkButton
              href={signInHref}
              icon={<MessageSquare />}
              className="fixed right-4 bottom-4 z-40 shadow-lg sm:right-6 sm:bottom-6"
            >
              {t("signInToReply")}
            </LinkButton>
          )
        ) : null}
      </div>
    </ForumComposeDrawer>
  );
}
