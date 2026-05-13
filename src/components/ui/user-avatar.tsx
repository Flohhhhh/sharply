import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";

type UserAvatarProps = {
  src?: string | null;
  name?: string | null;
  alt?: string;
  className?: string;
  fallbackClassName?: string;
};

function getInitials(name?: string | null) {
  const trimmedName = name?.trim();

  if (!trimmedName) return "?";

  const segments = trimmedName.split(/\s+/).filter(Boolean);
  const initials = segments
    .slice(0, 2)
    .map((segment) => segment[0] ?? "")
    .join("")
    .toUpperCase();

  return initials || trimmedName.charAt(0).toUpperCase() || "?";
}

export function UserAvatar({
  src,
  name,
  alt,
  className,
  fallbackClassName,
}: UserAvatarProps) {
  const imageAlt = alt ?? name?.trim() ?? "User";

  return (
    <Avatar className={className}>
      {src ? <AvatarImage src={src} alt={imageAlt} /> : null}
      <AvatarFallback className={fallbackClassName}>
        {getInitials(name)}
      </AvatarFallback>
    </Avatar>
  );
}
