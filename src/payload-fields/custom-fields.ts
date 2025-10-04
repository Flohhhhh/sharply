import type { Field } from "payload";

/**
 * Single gear selection field - stores a gear slug as string
 */
export const reviewGearItemField: Field = {
  name: "review_gear_item",
  type: "text",
  label: "Review Gear Item",
  required: true,
  admin: {
    components: {
      Field: "../src/payload-fields/GearSelect#default",
    },
  },
};

/**
 * Multiple gear selection field - stores an array of gear slugs as JSON
 */
export const relatedGearItemsField: Field = {
  name: "related_gear_items",
  label: "Related Gear Items",
  type: "json",
  admin: {
    description:
      "Indicate which gear items have been mentioned in this news article.",
    components: {
      Field: "../src/payload-fields/GearMultiSelect#default",
    },
  },
};

export const relatedBrandField: Field = {
  name: "related_brand",
  label: "Related Brand",
  type: "text",
  admin: {
    description: "Select the brand associated with this article",
    components: {
      Field: "../src/payload-fields/BrandSelect#default",
    },
  },
};
