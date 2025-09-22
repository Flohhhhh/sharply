import { CheckCircle, MailWarning, UserStar } from "lucide-react";

export default function Timeline() {
  const data = [
    {
      title: "You submit a change request",
      description:
        "If you see missing or incorrect data on a gear page, you are able to submit a change request for it.",
      icon: MailWarning,
    },
    {
      title: "Our team reviews the change request",
      description:
        "Our team will review the change request and either approve it or request additional information.",
      icon: UserStar,
    },
    {
      title: "The change is approved",
      description:
        "Once the change is approved, it will be live on the site for everyone to see! We'll credit you for your contribution.",
      icon: CheckCircle,
    },
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
