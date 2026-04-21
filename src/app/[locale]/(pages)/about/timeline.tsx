import { CheckCircle, MailWarning, UserStar } from "lucide-react";

type TimelineItem = {
  title: string;
  description: string;
};

type TimelineProps = {
  items: [TimelineItem, TimelineItem, TimelineItem];
};

export default function Timeline({ items }: TimelineProps) {
  const data = [
    { ...items[0], icon: MailWarning },
    { ...items[1], icon: UserStar },
    { ...items[2], icon: CheckCircle },
  ];

  return (
    <div className="relative">
      {/* Vertical rail */}
      <div
        className="border-border pointer-events-none absolute top-0 left-6 h-full border-l"
        aria-hidden
      />

      <ol className="space-y-40">
        {data.map((item, index) => {
          const Icon = item.icon;
          return (
            <li key={index} className="relative pl-20">
              {/* Icon badge */}
              <div className="absolute top-0 left-0">
                <div className="bg-background ring-border/60 flex h-12 w-12 items-center justify-center rounded-xl shadow-sm ring-1">
                  <Icon className="size-6" />
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="text-2xl leading-tight font-semibold">
                  {item.title}
                </h3>
                <p className="text-muted-foreground max-w-xl">
                  {item.description}
                </p>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
