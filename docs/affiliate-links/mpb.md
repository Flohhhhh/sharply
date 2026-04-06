## MPB Link Flow

- Gear records store an optional `linkMpb` column containing a normalized MPB base product path (for example, `/product/canon-rf-24-70mm-f-2-8l-is-usm`).
- Editors can paste any MPB product URL with any supported mount. The input is normalized before save by stripping the market segment and the known `-...-fit` suffix from the final slug segment.
- MPB search URLs such as `/search?q=...` are no longer valid saved inputs and are rejected in the UI and route layer.
- The link generation logic in `src/lib/links/mpb.ts` handles:
  - market-specific storefront prefixes (`en-us`, `en-uk`, `en-eu`)
  - mount-suffix normalization for storage
  - mount-suffix reconstruction for outbound clicks
- The gear page renders an MPB button that points to `/api/out/mpb?destinationPath=<basePath>&market=<marketCode>` and, when needed, appends `mountId=<mountId>`.
- `src/app/(app)/api/out/mpb/route.ts` handles the redirection:
  - It resolves the `market` by prioritizing the query parameter (manually selected by the user), then falling back to server-side IP detection via Vercel edge headers.
  - If `destinationPath` is missing but a `gearSlug` or `gearId` is provided, it attempts to resolve the link from the database.
  - If `mountId` is provided, it rebuilds the final MPB slug with the mapped `-...-fit` suffix before redirecting.
  - It rejects MPB search URLs and non-MPB absolute URLs with a `400` response so `/api/out/mpb` cannot be used as a generic redirect endpoint.

### Multi-Mount Lens Flow

- For lenses with multiple mounts, the gear page checks the item’s `mountIds` against `MPB_MOUNT_PATHS_MAP`.
- If more than one supported mount suffix is available, clicking the MPB card opens a modal so the user can choose the mount they want.
- If a mount exists on the gear item but does not yet have an MPB suffix mapping, it is shown in the chooser as unavailable instead of redirecting to a broken URL.
- If only one supported mount is available, the MPB card still opens directly without a modal.

### Market Detection & Internationalization

- The system currently supports **US**, **UK**, and **EU** markets.
- User selection is managed via a global `CountryProvider` and persisted in Local Storage.
- **Future I18n Note**: This implementation is designed to integrate with a broader internationalization strategy. We plan to use "Method 2: Intelligent Mapping," where the user's language selection (for example, German) automatically maps to the appropriate affiliate market (for example, EU) while allowing for manual overrides in the footer.

```text
MPB product link input
  -> normalize to stored base path
  -> GearLinks
  -> optional mount picker for multi-mount lenses
  -> /api/out/mpb?destinationPath=<basePath>&market=<market>&mountId=<mountId?>
  -> getMpbDestinationUrl()
  -> 307 redirect
```
