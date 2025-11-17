// storage-adapter-import-placeholder
import { postgresAdapter } from "@payloadcms/db-postgres";
import { payloadCloudPlugin } from "@payloadcms/payload-cloud";
import { lexicalEditor } from "@payloadcms/richtext-lexical";
import path from "path";
import { buildConfig } from "payload";
import { fileURLToPath } from "url";
import sharp from "sharp";
import { uploadthingStorage } from "@payloadcms/storage-uploadthing";
import { resendAdapter } from "@payloadcms/email-resend";

import { Users } from "./collections/Users";
import { Media } from "./collections/Media";
import { News } from "./collections/News";
import { Review } from "./collections/Review";
import { LearnPages } from "./collections/LearnPages";

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
    meta: {
      titleSuffix: " | Sharply CMS",
      description:
        "Sharply Content Management system. Create, edit, and manage content for Sharply.",
      icons: [
        {
          rel: "icon",
          type: "image/x-icon",
          url: "/favicon.ico",
        },
      ],
      robots: "noindex, nofollow",
    },
  },

  collections: [Users, Media, News, Review, LearnPages],
  routes: {
    admin: "/cms",
  },
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || "",
  typescript: {
    outputFile: path.resolve(dirname, "payload-types.ts"),
  },
  db: postgresAdapter({
    schemaName: "payload",
    pool: {
      connectionString: process.env.DATABASE_URI || "",
    },
  }),
  sharp,
  plugins: [
    payloadCloudPlugin(),
    // storage-adapter-placeholder
    uploadthingStorage({
      collections: {
        media: {
          disablePayloadAccessControl: true,
        },
      },
      options: {
        token: process.env.UPLOADTHING_TOKEN || "",
        acl: "public-read",
      },
    }),
  ],
  email: resendAdapter({
    defaultFromAddress: process.env.RESEND_EMAIL_FROM || "",
    defaultFromName: "Sharply Team",
    apiKey: process.env.RESEND_API_KEY || "",
  }),
});
