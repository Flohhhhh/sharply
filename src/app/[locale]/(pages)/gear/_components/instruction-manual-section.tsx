import { BookOpen, ExternalLink } from "lucide-react";
import { getTranslations } from "next-intl/server";

export async function InstructionManualSection({
  linkInstructionManual,
}: {
  linkInstructionManual?: string | null;
}) {
  if (!linkInstructionManual?.trim()) {
    return null;
  }

  const t = await getTranslations("gearDetail");

  return (
    <section id="instruction-manual" className="scroll-mt-24 space-y-3">
      <h2 className="text-lg font-semibold">{t("instructionManual.title")}</h2>
      <a
        href={linkInstructionManual}
        target="_blank"
        rel="noopener noreferrer"
        className="group block overflow-hidden rounded-lg border border-border bg-transparent shadow-sm transition-colors"
      >
        <div className="flex items-center justify-between gap-3 p-2">
          <div className="flex min-w-0 items-center gap-3">
            <div className="bg-muted/50 text-muted-foreground flex size-10 shrink-0 items-center justify-center rounded-md border">
              <BookOpen className="size-4" />
            </div>
            <div className="font-medium">{t("instructionManual.fieldLabel")}</div>
          </div>
          <span className="text-muted-foreground inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-sm transition-colors group-hover:bg-accent/60 group-hover:text-foreground">
            <ExternalLink className="size-4" />
            {t("instructionManual.openCta")}
          </span>
        </div>
      </a>
    </section>
  );
}
