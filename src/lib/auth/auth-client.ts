import { createAuthClient } from "better-auth/react";
import {
  emailOTPClient,
  inferAdditionalFields,
} from "better-auth/client/plugins";
import { auth } from "~/auth";

// typically done as export const authClient = createAuthClient();, we just destructure the functions we need
export const {
  signIn,
  signOut,
  useSession,
  emailOtp,
  linkSocial,
  listAccounts,
  unlinkAccount,
} = createAuthClient({
  plugins: [inferAdditionalFields<typeof auth>(), emailOTPClient()],
});
