import { getTranslations } from "next-intl/server";
import Link from "next/link";

export async function ConstructionNotice(props: {
  gearName: string;
  slug: string;
  missing: string[];
  editHref: string;
}) {
  const t = await getTranslations("underConstructionPage");
  const { gearName, missing, editHref } = props;
  return (
    <div className="border-border mb-6 rounded-md border bg-amber-50/70 p-4 text-amber-900 dark:bg-amber-950/20 dark:text-amber-200">
      <div className="space-y-2">
        <div className="text-sm">{gearName}</div>
        <h2 className="text-base font-semibold">
          {t("statusUnderConstruction")}
        </h2>
        {missing.length > 0 && (
          <div className="text-sm">
            <div className="mb-1">{t("missingKeySpecs")}</div>
            <ul className="list-disc pl-5">
              {missing.map((m) => (
                <li key={m}>{m}</li>
              ))}
            </ul>
          </div>
        )}
        <div>
          <Link
            scroll={false}
            href={editHref}
            className="bg-primary hover:bg-primary/90 text-primary-foreground inline-flex items-center rounded-md px-3 py-1.5 text-sm font-medium transition-colors"
          >
            {t("contributeInfo")}
          </Link>
        </div>
      </div>
    </div>
  );
}
