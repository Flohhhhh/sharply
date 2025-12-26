"use client";

import { useEffect, useState, useTransition } from "react";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Button } from "~/components/ui/button";
import { actionUpdateSocialLinks } from "~/server/users/actions";
import { Instagram, Globe, Plus, Trash2 } from "lucide-react";
import type { SocialLink } from "~/server/users/service";

type SocialLinksFormProps = {
  defaultLinks: SocialLink[];
  onSuccess?: (links: SocialLink[]) => void;
};

// Default slot templates
const DEFAULT_SLOTS = [
  { label: "Instagram", icon: "instagram" },
  { label: "Website", icon: "website" },
];

export function SocialLinksForm({
  defaultLinks,
  onSuccess,
}: SocialLinksFormProps) {
  const [links, setLinks] = useState<SocialLink[]>(defaultLinks);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    setLinks(defaultLinks);
  }, [defaultLinks]);

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    startTransition(async () => {
      try {
        setError(null);
        setSuccess(false);
        // Filter out empty links
        const validLinks = links.filter((link) => link.url.trim() !== "");
        const res = await actionUpdateSocialLinks(validLinks);
        setLinks(res.socialLinks);
        setSuccess(true);
        onSuccess?.(res.socialLinks);
        setTimeout(() => setSuccess(false), 3000);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "An error occurred";
        setError(errorMessage);
      }
    });
  };

  const addLink = () => {
    if (links.length >= 10) {
      setError("You can have at most 10 social links");
      return;
    }
    setLinks([...links, { label: "", url: "" }]);
  };

  const removeLink = (index: number) => {
    setLinks(links.filter((_, i) => i !== index));
  };

  const updateLink = (
    index: number,
    field: keyof SocialLink,
    value: string,
  ) => {
    const newLinks = [...links];
    const currentLink = newLinks[index];
    if (currentLink) {
      newLinks[index] = { ...currentLink, [field]: value };
      setLinks(newLinks);
    }
  };

  const addDefaultSlot = (slot: { label: string; icon: string }) => {
    if (links.length >= 10) {
      setError("You can have at most 10 social links");
      return;
    }
    setLinks([...links, { label: slot.label, url: "", icon: slot.icon }]);
  };

  const getIconComponent = (icon?: string) => {
    switch (icon) {
      case "instagram":
        return <Instagram className="h-4 w-4" />;
      case "website":
        return <Globe className="h-4 w-4" />;
      default:
        return <Globe className="h-4 w-4" />;
    }
  };

  // Show default slots if no links exist
  const showDefaultSlots = links.length === 0;

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-4">
        {showDefaultSlots && (
          <div className="space-y-2">
            <p className="text-muted-foreground text-sm">
              Add social links to your profile. Start with these popular
              options:
            </p>
            <div className="flex flex-wrap gap-2">
              {DEFAULT_SLOTS.map((slot) => (
                <Button
                  key={slot.icon}
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => addDefaultSlot(slot)}
                  icon={getIconComponent(slot.icon)}
                >
                  Add {slot.label}
                </Button>
              ))}
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addLink}
              icon={<Plus className="h-4 w-4" />}
            >
              Add Custom Link
            </Button>
          </div>
        )}

        {links.length > 0 && (
          <>
            {links.map((link, index) => (
              <div
                key={index}
                className="border-border space-y-2 rounded-lg border p-4"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 space-y-2">
                    <div className="space-y-1">
                      <Label htmlFor={`label-${index}`}>Label</Label>
                      <Input
                        id={`label-${index}`}
                        value={link.label}
                        onChange={(e) =>
                          updateLink(index, "label", e.target.value)
                        }
                        placeholder="Instagram, Website, etc."
                        aria-label={`Link label ${index + 1}`}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor={`url-${index}`}>URL</Label>
                      <Input
                        id={`url-${index}`}
                        type="url"
                        value={link.url}
                        onChange={(e) =>
                          updateLink(index, "url", e.target.value)
                        }
                        placeholder="https://..."
                        aria-label={`Link URL ${index + 1}`}
                      />
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeLink(index)}
                    aria-label="Remove link"
                    className="mt-6"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addLink}
              icon={<Plus className="h-4 w-4" />}
            >
              Add Another Link
            </Button>
          </>
        )}
      </div>

      {error ? <p className="text-destructive text-sm">{error}</p> : null}
      {success ? (
        <p className="text-green-600 dark:text-green-400 text-sm">
          Social links updated successfully!
        </p>
      ) : null}

      <Button type="submit" disabled={isPending} loading={isPending}>
        Save Changes
      </Button>
    </form>
  );
}
