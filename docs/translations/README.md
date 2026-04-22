# Translations

This directory documents how localized copy is organized in Sharply and how to add new translated content safely.

## Current setup

- Locale message files live in `/messages`:
  - `en.json`
  - `ja.json`
  - `de.json`
  - `fr.json`
  - `es.json`
  - `it.json`
  - `ms.json`
- App routes use `next-intl`.
- Server components fetch translations with `getTranslations` from `next-intl/server`.
- Client components use `useTranslations`.
- Malay is exposed through the language-only app locale id `ms` and labeled in the UI as `Bahasa Melayu (Malaysia)`.

## General rules

- Prefer storing translatable UI copy in the locale message files under `/messages`.
- Use stable keys that reflect the page or feature namespace.
- Keep the same key structure across all locale files.
- When adding new translation keys, update every supported locale in the same change.
- If a translation is not ready yet, use a safe English fallback rather than leaving the UI broken.

## Hall Of Fame pattern

Hall of fame items use a mixed pattern:

- English source copy lives in code in [src/app/[locale]/(pages)/lists/hall-of-fame/data.ts](/Users/camerongustavson/CodeProjects/sharply/src/app/[locale]/(pages)/lists/hall-of-fame/data.ts:1)
- Each item includes:
  - `slug`
  - `textKey`
  - `defaultText`
- Localized copies live in `/messages/*` under:
  - `hallOfFamePage.items.<slug>.text`

This keeps the English editorial source readable in the data file while still allowing localized copy through `next-intl`.

## Hall Of Fame fallback behavior

The page resolves item copy like this:

1. If the locale is `en`, use `defaultText` from `data.ts`.
2. If the locale is not `en` and the translation key exists, use the translated message.
3. If the locale is not `en` and the key is missing, fall back to `defaultText`.

The implementation currently lives in:

- [src/app/[locale]/(pages)/lists/hall-of-fame/page.tsx](/Users/camerongustavson/CodeProjects/sharply/src/app/[locale]/(pages)/lists/hall-of-fame/page.tsx:1)

## Spec Registry pattern

The spec registry uses the same mixed-source approach:

- English source copy stays inline in [src/lib/specs/registry.tsx](/Users/camerongustavson/CodeProjects/sharply/src/lib/specs/registry.tsx:1)
- Localized copies live in `/messages/*` under `gearDetail.specRegistry.*`
- Registry consumers pass a `gearDetail` translator into the registry builders

The registry resolves copy like this:

1. If the locale is `en`, use the inline English text from `registry.tsx`.
2. If the locale is not `en` and the translation key exists, use the localized message.
3. If the locale is not `en` and the key is missing, fall back to the inline English text.

Key format:

- Section titles: `gearDetail.specRegistry.sections.<sectionId>.title`
- Field labels: `gearDetail.specRegistry.sections.<sectionId>.fields.<fieldKey>.label`
- Shared simple values: `gearDetail.specRegistry.shared.*`

Notes:

- The `core.mounts` field has both singular and plural keys because the registry owns that label logic.
- English still needs matching keys in `messages/en.json` so translation parity stays green.

## Adding a new Hall Of Fame item

1. Add the item to `data.ts` with:
   - `slug`
   - `textKey`
   - `defaultText`
2. Add matching localized entries to every file in `/messages`.
3. Use the slug-based key format:

```json
"hallOfFamePage": {
  "items": {
    "example-slug": {
      "text": "Localized copy"
    }
  }
}
```

4. Run:

```bash
npm run lint
npm run test:i18n
```

## Choosing where English should live

Use `/messages/en.json` when:

- The copy is ordinary UI text.
- Translators should see English in the same place as other locales.
- The content is short and key-driven.

Use `defaultText` in code when:

- The content is curated editorial copy tied closely to a code-owned data list.
- Developers benefit from reading and editing the English text next to the item definitions.
- You still want translated copies in locale files with a safe fallback.
- The content is code-owned registry metadata such as spec section titles and field labels.

## Badge copy

- Badge tooltip descriptions on profile pages are localized from `/messages/*` under:
  - `userProfile.badgeDescriptions.*`
- Badge display names still come from the badge catalog in code for now.
- When you add or change badge earning copy, update:
  - `src/lib/badges/catalog.ts`
  - every locale file in `/messages`

## Notes

- Do not duplicate entire per-locale text objects in TypeScript data files.
- Do not rely on untranslated locales silently unless the English fallback is intentional.
- Keep translation keys stable once introduced to avoid unnecessary churn across locale files.
