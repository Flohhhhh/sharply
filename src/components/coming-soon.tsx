import Image from "next/image";
import Link from "next/link";
import { Button } from "./ui/button";

export default function ComingSoon(props: {
  title?: string;
  description?: string;
  buttonText?: string;
  buttonHref?: string;
}) {
  const {
    title = "Coming Soon",
    description = "We're working hard to bring you the best experience possible.",
    buttonText = "Go to Home",
    buttonHref = "/",
  } = props;
  return (
    <div className="dark bg-background relative h-full w-full">
      {/* background image */}
      <Image
        src="https://8v5lpkd4bi.ufs.sh/f/mJwI0W8NBfTndcj3727t0HF8TGqsvlIEWRPn6ywJp3XzgAYQ"
        alt="Coming Soon"
        fill
        className="object-cover opacity-10"
      />
      <div className="text-foreground flex h-screen flex-col items-center justify-center gap-4">
        <h2>{title}</h2>
        <h1 className="text-7xl font-bold">Coming Soon!</h1>
        <p className="text-muted-foreground max-w-md text-center text-sm">
          {description}
        </p>
        <Button asChild className="mt-8">
          <Link href={buttonHref}>{buttonText}</Link>
        </Button>
      </div>
    </div>
  );
}
