import { Suspense } from "react";
import { LanguageSwitcher } from "~/components/language-switcher";
import { LocaleLink } from "~/components/locale-link";
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="bg-background relative min-h-screen sm:px-8">
      <div className="absolute top-8 right-8 left-8 flex justify-center sm:justify-start">
        <LocaleLink className="text-2xl font-bold" href="/">
          Sharply
        </LocaleLink>
      </div>
      <div className="absolute right-8 bottom-8 left-8 flex justify-center sm:justify-start">
        <Suspense fallback={<div aria-hidden="true" className="h-9 min-w-[210px]" />}>
          <LanguageSwitcher />
        </Suspense>
      </div>
      <Suspense fallback={null}>{children}</Suspense>
    </main>
  );
}
