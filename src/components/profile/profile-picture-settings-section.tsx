"use client";

import { ImageIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect,useState } from "react";
import { ProfilePictureModal } from "~/components/modals/profile-picture-modal";
import { Avatar,AvatarFallback,AvatarImage } from "~/components/ui/avatar";
import { Button } from "~/components/ui/button";

export type ProfilePictureSettingsSectionProps = {
  initialImageUrl: string | null;
};

export function ProfilePictureSettingsSection({
  initialImageUrl,
}: ProfilePictureSettingsSectionProps) {
  const t = useTranslations("profileSettings");
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
            alt={t("profileThumbnailPreview")}
          />
          <AvatarFallback className="text-2xl">{t("avatar")}</AvatarFallback>
        </Avatar>
        <ProfilePictureModal
          trigger={
            <Button icon={<ImageIcon className="h-4 w-4" />}>
              {t("updateProfilePicture")}
            </Button>
          }
          currentImageUrl={initialImageUrl}
          onSuccess={({ url }) => setPreviewImageUrl(url)}
        />
      </div>
    </div>
  );
}
