import "server-only";

import {
  getDeveloperApiSpecCatalog,
  getDeveloperApiSpecFields,
  getDeveloperApiSpecValue,
} from "~/lib/specs/registry";
import { DeveloperApiError } from "./errors";
import { getDeveloperGear } from "./service";

export function getDeveloperApiSpecsCatalog() {
  return getDeveloperApiSpecCatalog();
}

export function resolveDeveloperApiSpecSelectors(selectors: string[]) {
  const fields = getDeveloperApiSpecFields();
  const fieldsById = new Map(
    fields.map((definition) => [definition.field.api.id, definition]),
  );
  const fieldsByCategory = new Map<string, typeof fields>();

  for (const definition of fields) {
    const categoryFields =
      fieldsByCategory.get(definition.field.api.category) ?? [];
    categoryFields.push(definition);
    fieldsByCategory.set(definition.field.api.category, categoryFields);
  }

  const resolved = [] as typeof fields;
  const seen = new Set<string>();
  for (const selector of selectors) {
    const selected = fieldsById.get(selector)
      ? [fieldsById.get(selector)!]
      : fieldsByCategory.get(selector);
    if (!selected) {
      throw new DeveloperApiError(
        "invalid_request",
        400,
        `Unknown spec selector: ${selector}.`,
      );
    }
    for (const definition of selected) {
      if (seen.has(definition.field.api.id)) continue;
      seen.add(definition.field.api.id);
      resolved.push(definition);
    }
  }
  return resolved;
}

export async function getDeveloperGearSelectedSpecs(params: {
  slug: string;
  selectors: string[];
}) {
  const fields = resolveDeveloperApiSpecSelectors(params.selectors);
  const gear = await getDeveloperGear(params.slug);

  return fields
    .map((definition) => getDeveloperApiSpecValue(gear, definition))
    .filter((value): value is { id: string; raw: unknown; display: string } =>
      Boolean(value),
    );
}
