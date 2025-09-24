"use client";

import Tilt from "react-parallax-tilt";
import { useIsMobile } from "~/hooks/use-mobile";
import { Avatar, AvatarImage, AvatarFallback } from "~/components/ui/avatar";
import type { User } from "~/server/db/schema";
import { formatHumanDate } from "~/lib/utils";

export default function UserCard(props: { user: User }) {
  if (!props.user) return null;

  const joinedDate = props.user.createdAt
    ? formatHumanDate(props.user.createdAt)
    : "Unknown";

  return (
    <Tilt
      tiltReverse
      transitionSpeed={1800}
      trackOnWindow
      tiltMaxAngleX={12}
      tiltMaxAngleY={12}
      tiltAngleXInitial={-7}
      tiltAngleYInitial={7}
      glareEnable={true}
      glareMaxOpacity={0.2}
      glareColor="#94a3b8"
      glarePosition="top"
      glareBorderRadius="24px"
      gyroscope={useIsMobile()}
    >
      <div className="aspect-[3/2] w-72 rounded-3xl border bg-white p-2 shadow-md sm:w-[500px]">
        <div className="flex flex-col items-center gap-4 py-2 sm:py-4">
          <Avatar className="h-12 w-12 sm:h-20 sm:w-20">
            <AvatarImage src={props.user.image || ""} />
            <AvatarFallback>{props.user.name?.split(" ")[0]}</AvatarFallback>
          </Avatar>
          <h1 className="text-2xl font-bold">{props.user.name}</h1>

          <div className="flex flex-col items-center gap-2">
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground text-sm">
                Joined {joinedDate}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground text-xs">Member #:</span>
              <span className="text-muted-foreground font-mono text-xs">
                {props.user.memberNumber ?? "?"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </Tilt>
  );
}
