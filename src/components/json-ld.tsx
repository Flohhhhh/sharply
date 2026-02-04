import {
  generateGearPageJsonLd,
  type GearPageJsonLdInput,
} from "~/lib/seo/json-ld-helpers";
import { GetGearDisplayName } from "~/lib/gear/naming";
import type { GearItem } from "~/types/gear";

export function JsonLd(props: { gear: GearItem }) {
  const { gear } = props;
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
  if (!baseUrl) {
    throw new Error(
      "Tried to generate JSON-LD without NEXT_PUBLIC_BASE_URL being set",
    );
  }
  const url = `${baseUrl}/gear/${gear.slug}`;
  const displayName = GetGearDisplayName({
    name: gear.name,
    regionalAliases: gear.regionalAliases ?? [],
  });

  const input: GearPageJsonLdInput = {
    canonicalUrl: url,
    name: displayName,
    brandId: gear.brandId,
    image: gear.thumbnailUrl ?? undefined,
    category: gear.gearType,
  };

  return (
    <script type="application/ld+json">{generateGearPageJsonLd(input)}</script>
  );
}
