import slugify from "slugify";
import type { CollectionConfig, Field } from "payload";
import {
  relatedGearItemsField,
  relatedBrandField,
} from "~/payload-fields/custom-fields";

export const News: CollectionConfig = {
  slug: "news",
  admin: {
    useAsTitle: "title",
  },
  versions: {
    drafts: {
      autosave: true,
    },
    maxPerDoc: 4,
  },

  trash: true,
  fields: [
    {
      name: "title",
      type: "text",
      required: true,
      admin: {
        description: "The title of the news article.",
      },
    },
    {
      name: "thumbnail",
      type: "upload",
      relationTo: "media",
      required: true,
      admin: {
        position: "sidebar",
        description: "The thumbnail of the news article.",
      },
    },
    {
      name: "slug",
      type: "text",
      unique: true,
      admin: {
        position: "sidebar",
        description: "Auto-generated from title, can be overridden",
      },
    },
    {
      name: "override_date",
      label: "Override Date (Optional)",
      type: "date",
      admin: {
        position: "sidebar",
        description:
          "Override the date of the news article. Defaults to creation date if not set.",
      },
    },
    {
      name: "content",
      type: "richText",
      required: true,
    },
    relatedBrandField,
    relatedGearItemsField,
    {
      name: "sourceLinks",
      type: "array",
      fields: [
        {
          name: "name",
          type: "text",
        },
        {
          name: "link",
          type: "text",
        },
      ],
      admin: {
        description: "Add any source links to the news article.",
      },
    },
  ],

  hooks: {
    beforeValidate: [
      ({ data }) => {
        if (data?.title && !data?.slug) {
          data.slug = slugify(data.title, {
            lower: true,
            strict: true, // remove special chars
            trim: true,
          });
        }
        return data;
      },
    ],
  },
};
