import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { cn } from "~/lib/utils";

type LearnCardProps = {
  href: string;
  title: string;
  description?: string | null;
  step?: number;
};

export function LearnCard({ href, title, description, step }: LearnCardProps) {
  return (
    <Link href={href} className="group block">
      <div
        className={cn(
          "relative rounded border p-6 transition-colors md:p-8",
          "bg-background hover:bg-accent/30",
        )}
      >
        <ArrowRight className="text-muted-foreground absolute top-6 right-6 h-5 w-5 transition-transform group-hover:translate-x-1" />

        <div className="flex min-h-[140px] flex-col md:min-h-[180px]">
          <h3 className="pr-10 text-3xl leading-tight font-semibold">
            {title}
          </h3>

          <div className="mt-auto space-y-2">
            {description ? (
              <p className="text-muted-foreground text-sm">{description}</p>
            ) : null}
            {typeof step === "number" ? (
              <div className="text-muted-foreground text-xs">{`Step ${step}`}</div>
            ) : null}
          </div>
        </div>
      </div>
    </Link>
  );
}

export default LearnCard;

