## Amazon Affiliate Link Flow

- Gear records store only ASINs. When editors paste a link or ASIN, `~/lib/validation/amazon.ts` canonicalizes it before saving.
- The gear page now renders Amazon buttons through `parseAmazonAsin(linkAmazon)` and points them at `/api/out/amazon?asin=<encodedASIN>&slug=<gear-slug>` to ensure clean parameters.
- `src/app/api/out/amazon/route.ts` re-parses the ASIN, builds the affiliate destination using the tag from `AMAZON_AFFILIATE_TAG` via `~/lib/links/amazon.ts`, logs the click with `track("amazon_redirect")`, and returns a 307 redirect.
- Including the slug lets Vercel analytics associate each click with the catalog item that triggered it while the route guards against invalid ASINs.

```text
linkAmazon input --> parseAmazonAsin() --> /api/out/amazon?asin=<ASIN>&slug=<slug> --> getAmazonDestinationUrl() --> track() --> 307 redirect
```
