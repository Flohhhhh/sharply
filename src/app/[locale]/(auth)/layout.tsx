import { Suspense } from "react";
import { LocaleLink } from "~/components/locale-link";
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="bg-background min-h-screen sm:px-8">
      <div className="absolute top-8 right-8 left-8 flex justify-center sm:justify-start">
        <LocaleLink className="text-2xl font-bold" href="/">
          Sharply
        </LocaleLink>
      </div>
      <Suspense fallback={null}>{children}</Suspense>
    </main>
  );
}
