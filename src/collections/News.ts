import slugify from "slugify";
import type { CollectionConfig, Field } from "payload";
import {
  relatedGearItemsField,
  relatedBrandField,
} from "~/payload-fields/custom-fields";
import { lexicalToPlainText } from "~/server/payload/richtext";

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
      name: "slug",
      type: "text",
      unique: true,
      access: {
        read: () => true,
        update: () => false,
      },
      admin: {
        position: "sidebar",
        description: "Auto-generated from title.",
      },
    },

    // auto generating excerpt from content
    {
      name: "excerpt",
      type: "textarea",
      access: {
        read: () => true,
        update: () => false,
      },
      admin: {
        position: "sidebar",
        description:
          "The excerpt of the news article. Auto-generated from content.",
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
        if (data?.content) {
          try {
            const text = lexicalToPlainText(data.content, { maxLength: 160 });
            data.excerpt = text;
          } catch {
            const contentString = JSON.stringify(data.content);
            data.excerpt = `${contentString.slice(0, 160)}...`;
          }
        }
        return data;
      },
    ],
  },
};
