import Link from "next/link";

export default function LearnPage() {
  return (
    <div className="mt-36 flex flex-col gap-4">
      Learn
      <Link href="/learn/basics">Basics</Link>
      <Link href="/learn/all-about-gear">All About Gear</Link>
    </div>
  );
}
