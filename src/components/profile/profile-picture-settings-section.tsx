"use client";

import { ImageIcon, Trash2Icon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRef, useState, useTransition } from "react";
import { ProfilePictureModal } from "~/components/modals/profile-picture-modal";
import { UserAvatar } from "~/components/ui/user-avatar";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "~/components/ui/alert-dialog";
import { Button, buttonVariants } from "~/components/ui/button";
import { Label } from "~/components/ui/label";
import { RadioGroup, RadioGroupItem } from "~/components/ui/radio-group";
import {
  getEffectiveAvatarSource,
  resolveUserAvatar,
  type AvatarSource,
} from "~/lib/auth/avatar";
import { useSession } from "~/lib/auth/auth-client";
import {
  actionClearProfileImage,
  actionUpdateAvatarSource,
} from "~/server/users/actions";
import { toast } from "sonner";

export type ProfilePictureSettingsSectionProps = {
  initialCustomImageUrl: string | null;
  initialDiscordImageUrl: string | null;
  initialAvatarSource: AvatarSource | null;
  hasLinkedDiscord: boolean;
  userName: string | null;
};

export function ProfilePictureSettingsSection({
  initialCustomImageUrl,
  initialDiscordImageUrl,
  initialAvatarSource,
  hasLinkedDiscord,
  userName,
}: ProfilePictureSettingsSectionProps) {
  const t = useTranslations("profileSettings");
  const { refetch: refetchSession } = useSession();
  const canChooseDiscordAvatar =
    hasLinkedDiscord && initialDiscordImageUrl !== null;
  const [customImageUrl, setCustomImageUrl] = useState<string | null>(
    initialCustomImageUrl,
  );
  const [avatarSource, setAvatarSource] = useState<AvatarSource>(() =>
    canChooseDiscordAvatar
      ? getEffectiveAvatarSource({
          image: initialCustomImageUrl,
          discordImage: initialDiscordImageUrl,
          avatarSource: initialAvatarSource,
        })
      : "custom",
  );
  const [isMutatingAvatar, startAvatarTransition] = useTransition();
  const [isUploadMutating, setIsUploadMutating] = useState(false);
  const mutationRef = useRef(false);
  const isAvatarBusy = isMutatingAvatar || isUploadMutating;

  const previewImageUrl = resolveUserAvatar({
    image: customImageUrl,
    discordImage: initialDiscordImageUrl,
    avatarSource,
  });

  async function selectSource(source: AvatarSource) {
    if (source === avatarSource || mutationRef.current) return;

    const previousSource = avatarSource;
    mutationRef.current = true;
    setAvatarSource(source);

    startAvatarTransition(async () => {
      try {
        const result = await actionUpdateAvatarSource(source);
        setAvatarSource(result.avatarSource);
        toast.success(t("avatarSourceUpdated"));
        void refetchSession({ query: { disableCookieCache: true } });
      } catch (error) {
        setAvatarSource(previousSource);
        toast.error(
          error instanceof Error
            ? error.message
            : t("avatarSourceUpdateFailed"),
        );
      } finally {
        mutationRef.current = false;
      }
    });
  }

  function removeCustomPicture() {
    if (!customImageUrl || mutationRef.current) return;

    mutationRef.current = true;
    startAvatarTransition(async () => {
      try {
        await actionClearProfileImage();
        setCustomImageUrl(null);
        setAvatarSource("custom");
        toast.success(t("profilePictureRemoved"));
        void refetchSession({ query: { disableCookieCache: true } });
      } catch {
        toast.error(t("profilePictureRemoveFailed"));
      } finally {
        mutationRef.current = false;
      }
    });
  }

  return (
    <div className="flex flex-col items-start gap-5">
      <UserAvatar
        src={previewImageUrl}
        name={userName}
        alt={t("profileThumbnailPreview")}
        className="size-16"
        fallbackClassName="text-2xl"
      />

      {canChooseDiscordAvatar ? (
        <div className="flex w-full max-w-md flex-col gap-3">
          <p className="text-muted-foreground text-sm">
            {t("avatarSourceDescription")}
          </p>
          <RadioGroup
            value={avatarSource}
            onValueChange={(value) => void selectSource(value as AvatarSource)}
            disabled={isAvatarBusy}
            aria-label={t("avatarSourceDescription")}
          >
            <div className="flex items-center gap-3">
              <RadioGroupItem value="discord" id="avatar-source-discord" />
              <Label htmlFor="avatar-source-discord" className="cursor-pointer">
                {t("useDiscordProfilePicture")}
              </Label>
            </div>
            <div className="flex items-center gap-3">
              <RadioGroupItem value="custom" id="avatar-source-custom" />
              <Label htmlFor="avatar-source-custom" className="cursor-pointer">
                {t("useCustomProfilePicture")}
              </Label>
            </div>
          </RadioGroup>
        </div>
      ) : null}

      {avatarSource === "custom" ? (
        <div className="flex flex-wrap gap-2">
          <ProfilePictureModal
            trigger={
              <Button icon={<ImageIcon />} disabled={isAvatarBusy}>
                {customImageUrl ? t("changePicture") : t("uploadNewPicture")}
              </Button>
            }
            currentImageUrl={previewImageUrl}
            onMutationChange={(pending) => {
              mutationRef.current = pending;
              setIsUploadMutating(pending);
            }}
            onSuccess={({ url }) => {
              setCustomImageUrl(url);
              setAvatarSource("custom");
              void refetchSession({ query: { disableCookieCache: true } });
            }}
          />
          {customImageUrl ? (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="outline"
                  icon={<Trash2Icon />}
                  disabled={isAvatarBusy}
                >
                  {t("removePicture")}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>{t("removePictureTitle")}</AlertDialogTitle>
                  <AlertDialogDescription>
                    {t("removePictureDescription")}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel disabled={isAvatarBusy}>
                    {t("cancel")}
                  </AlertDialogCancel>
                  <AlertDialogAction
                    className={buttonVariants({ variant: "destructive" })}
                    disabled={isAvatarBusy}
                    onClick={removeCustomPicture}
                  >
                    {t("removePicture")}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
