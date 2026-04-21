import { createUploadthing, type FileRouter } from "uploadthing/next";
import { UploadThingError } from "uploadthing/server";
import { auth } from "~/auth";
import { headers } from "next/headers";
import { requireRole } from "~/lib/auth/auth-helpers";

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
      const session = await auth.api.getSession({
        headers: await headers(),
      });

      // If you throw, the user will not be able to upload
      if (!session) {
        console.log("Attempt to upload image without user", session);
        throw new UploadThingError("Unauthorized");
      }

      const user = session?.user;
      if (!user) {
        console.log("Attempt to upload image without user", session);
        throw new UploadThingError("Unauthorized");
      }
      // Whatever is returned here is accessible in onUploadComplete as `metadata`
      return { userId: user.id };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      // This code RUNS ON YOUR SERVER after upload
      console.log("Upload complete for userId:", metadata.userId);

      console.log("file url", file.ufsUrl);

      // !!! Whatever is returned here is sent to the clientside `onClientUploadComplete` callback
      return { uploadedBy: metadata.userId };
    }),
  // Raw sample uploader - only for CAMERA gear types
  // Note: Gear type validation (CAMERA only) occurs at the service layer
  // when the file is linked to gear via addRawSampleToGear()
  rawSampleUploader: f({
    blob: {
      maxFileSize: "128MB",
      maxFileCount: 1,
    },
  })
    .middleware(async () => {
      const session = await auth.api.getSession({
        headers: await headers(),
      });

      if (!session?.user) {
        console.log(
          "Attempt to upload raw sample without editor permission",
          session,
        );
        throw new UploadThingError("Unauthorized");
      }

      if (!requireRole(session.user, ["ADMIN", "SUPERADMIN"])) {
        console.log(
          "Attempt to upload raw sample without editor role",
          session,
        );
        throw new UploadThingError("Unauthorized");
      }

      return { userId: session.user.id };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log("Uploaded raw sample", file.ufsUrl);
      return {
        uploadedBy: metadata.userId,
        fileUrl: file.ufsUrl,
        fileName: file.name,
        contentType: file.type,
        sizeBytes: file.size,
      };
    }),
  gearImageUploader: f({
    image: {
      maxFileSize: "4MB",
      maxFileCount: 1,
    },
  }) // Set permissions and file types for this FileRoute
    .middleware(async () => {
      // This code runs on your server before upload
      const session = await auth.api.getSession({
        headers: await headers(),
      });
      const user = session?.user;

      // If you throw, the user will not be able to upload
      if (!session) {
        console.log("Attempt to upload image without user", session);
        throw new UploadThingError("Unauthorized");
      }

      if (!user) {
        console.log("Attempt to upload gear image without user", session);
        throw new UploadThingError("Unauthorized");
      }

      if (!requireRole(user, ["EDITOR"])) {
        console.log(
          "Attempt to upload gear image without admin, superadmin or editor role",
          session,
        );
        throw new UploadThingError("Unauthorized");
      }

      // Whatever is returned here is accessible in onUploadComplete as `metadata`
      return { userId: user.id, role: user.role };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log("Uploaded gear image", file.ufsUrl);
      return {
        uploadedBy: metadata.userId,
        role: metadata.role,
        fileUrl: file.ufsUrl,
      };
    }),
  profilePictureUploader: f({
    image: {
      maxFileSize: "4MB",
      maxFileCount: 1,
    },
  })
    .middleware(async () => {
      const session = await auth.api.getSession({
        headers: await headers(),
      });
      const user = session?.user;

      if (!session) {
        console.log("Attempt to upload profile picture without user", session);
        throw new UploadThingError("Unauthorized");
      }

      if (!user) {
        console.log("Attempt to upload profile picture without user", session);
        throw new UploadThingError("Unauthorized");
      }

      // Return old image URL for deletion if it exists
      return { userId: user.id, oldImageUrl: user.image };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log(
        "Uploaded profile picture for user:",
        metadata.userId,
        file.ufsUrl,
      );

      // Note: Old image cleanup should be handled by the calling service
      // UploadThing doesn't provide direct file deletion API
      return {
        uploadedBy: metadata.userId,
        fileUrl: file.ufsUrl,
        oldImageUrl: metadata.oldImageUrl,
      };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
