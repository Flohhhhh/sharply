import { passkeyClient } from "@better-auth/passkey/client";
import {
  emailOTPClient,
  inferAdditionalFields,
} from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";
import { type auth } from "~/auth";

// typically done as export const authClient = createAuthClient();, we just destructure the functions we need
export const {
  signIn,
  signOut,
  useSession,
  emailOtp,
  linkSocial,
  listAccounts,
  unlinkAccount,
  passkey,
} = createAuthClient({
  plugins: [
    inferAdditionalFields<typeof auth>(),
    emailOTPClient(),
    passkeyClient(),
  ],
});
