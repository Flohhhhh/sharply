## B&H Link Flow

- Gear records now have an optional `linkBh` column storing a canonical B&H product URL.
- Canonicalization trims any trailing path/query after the product key: we store `https://www.bhphotovideo.com/c/product/<productKey>/` (e.g., `https://www.bhphotovideo.com/c/product/1834803-REG/`).
- The gear page renders a B&H button that points to `/api/out/bh?url=<encoded-url>&slug=<gear-slug>`.
- `src/app/(app)/api/out/bh/route.ts` re-validates the URL via `parseBhProductUrl` (allowed hosts: `bhphotovideo.com`, `www.bhphotovideo.com`, `bhpho.to`), logs `bhphoto_redirect`, and returns a 307 redirect.
- Validation lives in `src/lib/validation/bhphoto.ts` and ensures we do not turn the route into an open redirect.
- If the URL is missing or invalid, the route returns a 400 JSON error instead of redirecting.
