import Link from "next/link";
import { Suspense } from "react";
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="bg-background min-h-screen sm:px-8">
      <div className="absolute top-8 right-8 left-8 flex justify-center sm:justify-start">
        <Link className="text-2xl font-bold" href="/">
          Sharply
        </Link>
      </div>
      <Suspense fallback={null}>{children}</Suspense>
    </main>
  );
}
