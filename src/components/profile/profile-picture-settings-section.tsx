"use client";

import { useEffect, useState } from "react";
import { ImageIcon } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { ProfilePictureModal } from "~/components/modals/profile-picture-modal";

export type ProfilePictureSettingsSectionProps = {
  initialImageUrl: string | null;
};

export function ProfilePictureSettingsSection({
  initialImageUrl,
}: ProfilePictureSettingsSectionProps) {
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(
    initialImageUrl,
  );

  useEffect(() => {
    setPreviewImageUrl(initialImageUrl);
  }, [initialImageUrl]);

  return (
    <div className="space-y-3">
      {/* <div className="text-muted-foreground text-xs">Thumbnail preview</div> */}
      <div className="flex flex-col items-start gap-4">
        <Avatar className="h-16 w-16">
          <AvatarImage
            src={previewImageUrl ?? undefined}
            alt="Profile thumbnail preview"
          />
          <AvatarFallback className="text-2xl">Avatar</AvatarFallback>
        </Avatar>
        <ProfilePictureModal
          trigger={
            <Button icon={<ImageIcon className="h-4 w-4" />}>
              Update Profile Picture
            </Button>
          }
          currentImageUrl={initialImageUrl}
          onSuccess={({ url }) => setPreviewImageUrl(url)}
        />
      </div>
    </div>
  );
}
