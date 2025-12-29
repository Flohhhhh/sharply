import { signOut } from "./auth-client";

export async function logOut() {
  await signOut();

  if (typeof window !== "undefined") {
    window.location.reload();
  }
}
