## Amazon Affiliate Link Flow

- Gear records store only ASINs. When editors paste a link or ASIN, `~/lib/validation/amazon.ts` canonicalizes it before saving.
- The gear page now renders Amazon buttons through `parseAmazonAsin(linkAmazon)` and points them at `/api/out/amazon?asin=<encodedASIN>&slug=<gear-slug>` to ensure clean parameters.
- `src/app/api/out/amazon/route.ts` re-parses the ASIN, builds an `amazon.com` destination using the tag from `AMAZON_AFFILIATE_TAG` via `~/lib/links/amazon.ts`, logs the click with `track("amazon_redirect")`, and returns a 307 redirect.
- Sharply does not maintain per-locale or per-country Amazon storefront routing in app code. Any international redirecting is handled by Amazon OneLink after the click.
- Including the slug lets Vercel analytics associate each click with the catalog item that triggered it while the route guards against invalid ASINs.

```text
linkAmazon input --> parseAmazonAsin() --> /api/out/amazon?asin=<ASIN>&slug=<slug> --> amazon.com URL + affiliate tag --> track() --> 307 redirect
```
