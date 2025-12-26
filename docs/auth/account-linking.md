## Account Linking Overview

- Supported providers: Discord and Google (conditionally available based on env creds). Each user can link at most one of each.
- Location: `/profile/settings` → “Connected Accounts”.
- Linking flow: While signed in, clicking “Link {provider}” calls `signIn("provider", { callbackUrl: "/profile/settings" })`.
  - NextAuth sees the active session and attaches the new provider account to the current user.
- Unlink flow: “Disconnect” removes the provider’s `account` row for that user. The user record is unchanged; other sign-in methods continue to work. Re-link anytime.
- Display: Shows connected provider with a green check and “Connected as {user email or provider ID}”. Unlinked providers show an outline button to start linking.
- Confirmation: Disconnect is gated by an alert dialog explaining loss of that sign-in method until re-linked. If it is the last linked OAuth account, the dialog also warns: “This is your last linked OAuth account. If you continue, you will need to sign in using your email/magic link.”
