## Account Linking Overview

- Supported providers: Discord and Google (enabled only when env creds are present). One account per provider per user.
- Location: `/profile/settings` → “Connected Accounts”.
- Linking flow: Uses Better Auth `linkSocial` from `~/lib/auth/auth-client`. While signed in, clicking “Link {provider}” calls:
  - `linkSocial({ provider, callbackURL: "/profile/settings?linked={provider}" })`
  - Better Auth attaches the provider account to the current session’s user. On return, the page shows a success toast if `linked={provider}` is present.
- Unlink flow: “Disconnect” calls `unlinkAccount({ providerId, accountId })`. The provider’s account row is removed; the user record remains and other sign-in methods keep working.
- Display: Connected providers show a green check and “Connected as {user email or provider ID}”. Unlinked providers show an outline button to start linking and note when a provider is unavailable in the current environment.
- Confirmation: Disconnect is gated by an alert dialog explaining loss of that sign-in method. If it is the last linked OAuth account, the dialog warns: “This is your last linked OAuth account. If you continue, you will need to sign in using your email/magic link.”
