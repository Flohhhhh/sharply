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

const plugins: any[] = [payloadCloudPlugin()];
const uploadthingToken = process.env.UPLOADTHING_TOKEN?.trim();
const shouldRegisterUploadthing = Boolean(uploadthingToken);
if (shouldRegisterUploadthing) {
  console.info(
    "Payload registration: Uploadthing storage will be used for the media collection.",
  );
} else {
  console.warn(
    "Payload warning: UPLOADTHING_TOKEN is missing, so Uploadthing storage will not be initialized.",
  );
}
if (shouldRegisterUploadthing) {
  plugins.push(
    uploadthingStorage({
      collections: {
        media: {
          disablePayloadAccessControl: true,
        },
      },
      options: {
        token: uploadthingToken,
        acl: "public-read",
      },
    }),
  );
  console.log("Plugins: ", plugins);
}

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
      connectionString: process.env.DATABASE_URL || "",
    },
  }),
  sharp,
  plugins,
  email:
    process.env.RESEND_EMAIL_FROM && process.env.RESEND_API_KEY
      ? resendAdapter({
          defaultFromAddress: process.env.RESEND_EMAIL_FROM,
          defaultFromName: "Sharply Team",
          apiKey: process.env.RESEND_API_KEY,
        })
      : undefined,
});
