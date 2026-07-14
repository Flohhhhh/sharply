import { getTranslations } from "next-intl/server";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "~/auth";
import { DeveloperApiError } from "~/server/developer-api/errors";
import { getDeveloperPortalData } from "~/server/developer-api/service";
import { DeveloperPortal } from "./developer-portal";

export const dynamic = "force-dynamic";

export default async function DeveloperPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    redirect(`/${locale}/auth/signin?callbackUrl=/${locale}/developer`);
  }

  const portalData = await getDeveloperPortalData().catch((error: unknown) => {
    if (
      error instanceof DeveloperApiError &&
      error.code === "developer_access_required"
    ) {
      return null;
    }
    throw error;
  });
  if (!portalData) {
    const t = await getTranslations({ locale, namespace: "developerApi" });
    return (
      <main className="mx-auto min-h-screen max-w-3xl px-6 pt-28 pb-16">
        <section className="border-border bg-card rounded-xl border p-8 shadow-sm">
          <p className="text-primary text-sm font-semibold tracking-wide uppercase">
            {t("portal.eyebrow")}
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight">
            {t("portal.accessTitle")}
          </h1>
          <p className="text-muted-foreground mt-3 max-w-xl leading-7">
            {t("portal.accessDescription")}
          </p>
        </section>
      </main>
    );
  }

  return <DeveloperPortal data={portalData} />;
}
