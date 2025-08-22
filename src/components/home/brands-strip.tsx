import Link from "next/link";

export default function BrandsStrip() {
  return (
    <section className="bg-muted/50 mt-18 w-full px-4 py-8 sm:px-8">
      <div className="text-muted-foreground mx-auto flex w-full justify-center gap-24 text-2xl font-bold">
        <Link href="/brands/canon" className="hover:text-primary">
          Canon
        </Link>
        <Link href="/brands/nikon" className="hover:text-primary">
          Nikon
        </Link>
        <Link href="/brands/sony" className="hover:text-primary">
          Sony
        </Link>
        <Link href="/brands/fujifilm" className="hover:text-primary">
          Fujifilm
        </Link>
        <Link href="/brands/leica" className="hover:text-primary">
          Leica
        </Link>
      </div>
      {/* <hr className="mx-auto mt-4 w-24" />
      <h2 className="mt-6 text-center text-sm">Explore Brands</h2> */}
    </section>
  );
}
