import { createUploadthing, type FileRouter } from "uploadthing/next";
import { UploadThingError } from "uploadthing/server";
import { auth } from "~/server/auth";

const f = createUploadthing();

// FileRouter for your app, can contain multiple FileRoutes
export const ourFileRouter = {
  // Define as many FileRoutes as you like, each with a unique routeSlug
  imageUploader: f({
    image: {
      /**
       * For full list of options and defaults, see the File Route API reference
       * @see https://docs.uploadthing.com/file-routes#route-config
       */
      maxFileSize: "4MB",
      maxFileCount: 1,
    },
  })
    // Set permissions and file types for this FileRoute
    .middleware(async () => {
      // This code runs on your server before upload
      const session = await auth();

      // If you throw, the user will not be able to upload
      if (!session?.user?.id) {
        console.log("Attempt to upload image without user", session);
        throw new UploadThingError("Unauthorized");
      }

      // Whatever is returned here is accessible in onUploadComplete as `metadata`
      return { userId: session.user.id };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      // This code RUNS ON YOUR SERVER after upload
      console.log("Upload complete for userId:", metadata.userId);

      console.log("file url", file.ufsUrl);

      // !!! Whatever is returned here is sent to the clientside `onClientUploadComplete` callback
      return { uploadedBy: metadata.userId };
    }),
  gearImageUploader: f({
    image: {
      maxFileSize: "4MB",
      maxFileCount: 1,
    },
  }) // Set permissions and file types for this FileRoute
    .middleware(async () => {
      // This code runs on your server before upload
      const session = await auth();
      const role = session?.user?.role;

      // If you throw, the user will not be able to upload
      if (!session?.user?.id) {
        console.log("Attempt to upload image without user", session);
        throw new UploadThingError("Unauthorized");
      }

      if (role !== "ADMIN" && role !== "SUPERADMIN" && role !== "EDITOR") {
        console.log(
          "Attempt to upload gear image without admin, superadmin or editor role",
          session,
        );
        throw new UploadThingError("Unauthorized");
      }

      // Whatever is returned here is accessible in onUploadComplete as `metadata`
      return { userId: session.user.id, role: role };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log("Uploaded gear image", file.ufsUrl);
      return {
        uploadedBy: metadata.userId,
        role: metadata.role,
        fileUrl: file.ufsUrl,
      };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
