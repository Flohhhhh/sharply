import { Button } from "~/components/ui/button";
import {
  BadgeCheck,
  CheckCircle2,
  Flame,
  Heart,
  ScanHeart,
  UserPlus,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import Timeline from "./timeline";
import { Badge } from "~/components/ui/badge";
import { ContributionCounter } from "~/components/home/contribution-counter";
import { GearCounter } from "~/components/home/gear-counter";

export default function About() {
  return (
    <div className="mt-36 min-h-screen space-y-16">
      <h1 className="sr-only text-2xl font-bold">About</h1>
      <section className="mx-auto w-full max-w-7xl space-y-8 px-4 sm:px-8">
        <div className="mb-12 grid grid-cols-1 gap-8 sm:grid-cols-2">
          <h2 className="max-w-lg text-4xl font-bold sm:text-6xl">
            Photography for Everyone
          </h2>
          <p className="text-muted-foreground max-w-lg self-end">
            Sharply is building the modern hub for photography knowledge. We
            bring together accurate gear data, structured community insights,
            and inspiring stories; we're making information open, clear, and
            accessible for every photographer.
          </p>
        </div>

        <div>
          <Image
            src="https://8v5lpkd4bi.ufs.sh/f/mJwI0W8NBfTnmxxvVcw8NBfTn68UzcGl7jKdovRxmIyCpLMV"
            alt="About"
            className="aspect-[21/9] w-full rounded-t-2xl object-cover"
            width={1000}
            height={1000}
          />
          <div className="bg-primary flex items-center justify-center gap-4 rounded-b-2xl p-4">
            <ScanHeart className="size-5 animate-pulse" />
            <p className="text-primary-foreground text-center text-sm">
              Photography knowledge made open and accessible for everyone!
            </p>
          </div>
        </div>
      </section>
      {/* future logo strip/cloud */}
      <section className="mx-auto w-full max-w-7xl space-y-8 px-4 pt-8 pb-16 sm:px-8">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
          <div className="top-24 max-w-lg space-y-4">
            <Badge>Our Mission</Badge>
            <h3 className="text-3xl font-bold">
              We're building a better way to learn about & find gear.
            </h3>
            <p className="text-muted-foreground">
              Sharply was built to make photography knowledge open, clear, and
              accessible. We combine accurate data, trusted insights, and modern
              design to create a space where photographers can learn, compare,
              and make better choices without the noise or gatekeeping.
            </p>
          </div>
          <div className="flex flex-col gap-3">
            {/* Open Access */}
            <div className="bg-card flex items-start gap-4 rounded-md border p-5">
              <div className="bg-secondary flex h-12 w-12 shrink-0 items-center justify-center rounded">
                <Heart className="text-foreground-muted w-8" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Open and Transparent</h3>
                <p className="text-muted-foreground text-sm">
                  All our data, specs, and insights are freely accessible and
                  explained in plain language.
                </p>
              </div>
            </div>
            {/* Community Insight */}
            <div className="bg-card flex items-start gap-4 rounded-md border p-5">
              <div className="bg-secondary flex h-12 w-12 shrink-0 items-center justify-center rounded">
                <ScanHeart className="text-foreground-muted w-8" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">
                  Shaped by Photographers
                </h3>
                <p className="text-muted-foreground text-sm">
                  Contributions come from photographers just like you, and are
                  validated and approved by trusted editors so you can trust the
                  information you find.
                </p>
              </div>
            </div>
            {/* Modern Experience */}
            <div className="bg-card flex items-start gap-4 rounded-md border p-5">
              <div className="bg-secondary flex h-12 w-12 shrink-0 items-center justify-center rounded">
                {/* Using a camera icon for modern experience */}
                <Flame className="text-foreground-muted w-8" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Built for Today</h3>
                <p className="text-muted-foreground text-sm">
                  Our modern & modest design combined with the latest technology
                  meets the most current user experience standards making
                  exploring gear and knowledge effortless.
                </p>
              </div>
            </div>
            {/* Trusted Knowledge */}
            <div className="bg-card flex items-start gap-4 rounded-md border p-5">
              <div className="bg-secondary flex h-12 w-12 shrink-0 items-center justify-center rounded">
                {/* Using a check-circle icon for trust */}
                <BadgeCheck className="text-foreground-muted w-8" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Accurate and Reliable</h3>
                <p className="text-muted-foreground text-sm">
                  Verified specs and curated reviews ensure clarity and
                  confidence in every decision.
                </p>
              </div>
            </div>
            <Button asChild>
              <Link href="/gear">View the gear database</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="w-full space-y-8 bg-white">
        <div className="mx-auto grid w-full max-w-7xl grid-cols-1 gap-8 px-4 py-24 sm:grid-cols-2 sm:px-8">
          <div className="max-w-lg space-y-4">
            <Badge>The Problem</Badge>
            <h2 className="text-3xl font-bold">Why it Matters</h2>
            <p className="text-muted-foreground">
              Photography knowledge today is scattered and inconsistent. Specs
              are locked away on manufacturer sites, reviews are spread across
              dozens of platforms, and testing methods vary so much that it’s
              hard to make meaningful comparisons. For photographers, this
              creates frustration, wasted time, and uncertainty when choosing
              gear.
            </p>
            <p className="text-muted-foreground">
              Many of the existing standards are also difficult to access.
              They’re designed for labs or institutions, often hidden behind
              technical jargon or paywalls, and they feel out of reach for
              everyday photographers. Instead of making knowledge easier to
              understand, these systems unintentionally create barriers.
            </p>
            <p className="text-muted-foreground">
              The result is a landscape where information is fragmented, trust
              is hard to earn, and too often, only insiders or dedicated
              enthusiasts can truly make sense of it all.
            </p>
          </div>
          <div className="max-w-lg space-y-4">
            <Badge>The Solution</Badge>
            <h2 className="text-3xl font-bold">Our Vision for the Future</h2>
            <p className="text-muted-foreground">
              We believe photography knowledge should be open, transparent, and
              accessible to everyone, whether you are buying your first camera
              or evaluating a flagship system for professional work. Our
              platform brings together accurate gear data, structured community
              insights, and thoughtful editorial to make learning and comparing
              simple and seamless.
            </p>
            <p className="text-muted-foreground">
              We do not just want to present information, we want to reshape how
              it is created and shared. Our long-term vision is to pioneer open
              and accessible standards for photography testing and data
              practices. Instead of each site or brand using their own closed
              method, we hope to lead the way in creating a shared approach that
              is clear, replicable, and available to the entire community.
            </p>
            <p className="text-muted-foreground">
              This future is about clarity, accessibility, and collaboration. By
              working together with like-minded photographers, contributors, and
              brands, we believe Sharply can not only provide the modern
              platform photographers need today but also set the stage for
              tomorrow’s open photography standards.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl space-y-8 px-4 py-16 sm:px-8">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
          <div className="top-24 max-w-lg space-y-4">
            <Badge>Crowd-sourced</Badge>
            <h3 className="text-3xl font-bold">How it Works</h3>
            <p className="text-muted-foreground max-w-lg">
              Anyone can contribute to the database by submitting changes or
              suggestions. This allows us to have the most accurate and up to
              date information compared to review sites.
            </p>
            <div className="mt-12 flex gap-8">
              <GearCounter />
              <ContributionCounter />
            </div>
          </div>
          <Timeline />
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-7xl grid-cols-1 gap-8 rounded-xl bg-white px-8 py-24 sm:grid-cols-2 sm:px-12">
        <div className="space-y-4">
          <h2 className="text-3xl font-bold">Let's Get Started</h2>
          <p className="text-muted-foreground">
            We are always looking for like-minded people who share our mission.
            Whether you are a reviewer, developer, or simply passionate about
            photography, you can be a part of the future of photography.
          </p>
          <Button
            asChild
            icon={<UserPlus className="size-4" />}
            iconPosition="right"
            className="mt-4"
          >
            <Link href="/auth/signup">Create an account</Link>
          </Button>
        </div>
        <div className="hidden max-w-md space-y-4 sm:block">
          <ul className="list-inside list-none space-y-4 pl-12">
            <li className="flex items-center gap-2">
              <CheckCircle2 className="size-4 text-emerald-400" />
              Suggest gear spec changes
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="size-4 text-emerald-400" />
              Save gear to your collection
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="size-4 text-emerald-400" />
              Write reviews and share your experiences
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="size-4 text-emerald-400" />
              Add items to your wishlist
            </li>
          </ul>
        </div>
      </section>
    </div>
  );
}
