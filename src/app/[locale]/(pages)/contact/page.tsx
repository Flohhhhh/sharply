import { env } from "~/env";
import { Separator } from "~/components/ui/separator";
import ContactClient from "./_components/contact-client";
import Image from "next/image";
import Link from "next/link";
import DiscordBanner from "~/components/discord-banner";
import EmailCopyButton from "./_components/email-copy-button";

export default function ContactPage() {
  const email =
    env.RESEND_EMAIL_CONTACT ?? env.RESEND_EMAIL_FROM ?? "team@mysite.com";

  return (
    <div className="mt-16 sm:mt-24 sm:px-8">
      <div className="mx-auto max-w-7xl space-y-8 px-4 py-10">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-7">
          {/* Text left side column */}
          <div className="space-y-4 sm:col-span-5">
            <div className="space-y-4">
              <span className="text-muted-foreground pl-1 text-sm">
                / contact
              </span>
              <h1 className="pt-4 text-7xl font-extrabold">Let's talk!</h1>
              <p className="text-muted-foreground max-w-lg text-sm">
                Questions, corrections, and thoughtful inquiries are always
                welcome. We read every message and typically respond within 2–3
                business days.
              </p>
            </div>
            <Separator className="my-8" />
            <ContactClient />
            <Separator className="my-8" />
            <div className="grid grid-cols-1 gap-4 px-1 sm:grid-cols-2">
              {/* email */}
              <EmailCopyButton email={email} />
            </div>
            <Separator className="my-8" />
            <DiscordBanner label="Community" />
          </div>
          {/* Image right side column */}
          <div className="col-span-2 hidden sm:block">
            <div className="relative h-full overflow-hidden rounded-lg">
              <Image
                className="object-cover"
                src="https://8v5lpkd4bi.ufs.sh/f/mJwI0W8NBfTnKOxlqP4VYhAfi0GsBrWzqnyk3FXES8OHPg14"
                alt="Contact"
                fill
              />
              <div className="absolute right-0 bottom-0 left-0 h-12 bg-linear-0 from-black/30 to-transparent"></div>
              <span className="absolute bottom-2 left-2 text-xs text-white">
                Photo by{" "}
                <Link
                  className="underline"
                  href="https://unsplash.com/@youssefnaddam?utm_source=unsplash&utm_medium=referral&utm_content=creditCopyText"
                >
                  Youssef Naddam
                </Link>{" "}
                on{" "}
                <Link
                  className="underline"
                  href="https://unsplash.com/photos/two-persons-arms-iJ2IG8ckCpA?utm_source=unsplash&utm_medium=referral&utm_content=creditCopyText"
                >
                  Unsplash
                </Link>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
