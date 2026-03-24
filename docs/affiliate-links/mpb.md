## MPB Link Flow

- Gear records store an optional `linkMpb` column containing the relative or absolute path to the product on MPB (e.g., `/buy/used/canon-eos-r5/`).
- The link generation logic in `src/lib/links/mpb.ts` handles market-specific path segments (e.g., `en-us`, `en-uk`, `en-eu`) and constructs the final direct MPB destination URL.
- The gear page renders an MPB button that points to `/api/out/mpb?destinationPath=<encodedPath>&market=<marketCode>`.
- `src/app/(app)/api/out/mpb/route.ts` handles the redirection:
  - It resolves the `market` by prioritizing the query parameter (manually selected by the user), then falling back to server-side IP detection via Vercel edge headers.
  - If `destinationPath` is missing but a `gearSlug` or `gearId` is provided, it attempts to resolve the link from the database.
  - It normalizes the destination into the selected MPB storefront and returns a 307 redirect.
  - It rejects non-MPB absolute URLs with a 400 response so `/api/out/mpb` cannot be used as a generic redirect endpoint.

### Market Detection & Internationalization

- The system currently supports **US**, **UK**, and **EU** markets.
- User selection is managed via a global `CountryProvider` and persisted in Local Storage.
- **Future I18n Note**: This implementation is designed to integrate with a broader internationalization strategy. We plan to use "Method 2: Intelligent Mapping," where the user's language selection (e.g., German) automatically maps to the appropriate affiliate market (e.g., EU) while allowing for manual overrides in the footer.

```text
linkMpb input --> GearLinks (with market param) --> /api/out/mpb?destinationPath=<path>&market=<market> --> getMpbDestinationUrl() --> 307 redirect
```
