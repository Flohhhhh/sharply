import type { Metadata } from "next";
import SignInClient from "./client";

export const metadata: Metadata = {
  title: "Log In",
};

export default function Page() {
  return <SignInClient />;
}
