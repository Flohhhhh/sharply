import { BRANDS, MOUNTS, SENSOR_FORMATS } from "~/lib/constants";
import type { GearItem } from "~/types/gear";

export type GearJsonLdSpec = {
  name: string;
  value: string | number | boolean | null | undefined;
};

export type GearPageJsonLdInput = {
  canonicalUrl: string;
  name: string;
  description?: string;
  brandId?: string;
  image?: string;
  category?: "CAMERA" | "LENS"; // "Camera" / "Lens" etc
  // keySpecs?: GearJsonLdSpec[];
};

// export function getKeySpecs(item: GearItem): GearJsonLdSpec[] {
//   const specs: GearJsonLdSpec[] = [];
//   if (item.cameraSpecs) {
//     const cameraSpecs = item.cameraSpecs;
//     if (cameraSpecs.resolutionMp) {
//       specs.push({
//         name: "Sensor Resolution",
//         value: `${cameraSpecs.resolutionMp} megapixels`,
//       });
//     }
//     if (cameraSpecs.sensorFormatId) {
//       const sensorFormat = SENSOR_FORMATS.find(
//         (s) => s.id === (cameraSpecs.sensorFormatId as string),
//       );
//       if (sensorFormat) {
//         specs.push({
//           name: "Sensor Format",
//           value: sensorFormat.name,
//         });
//       }
//     }
//   }
//   if (item.lensSpecs) {
//     const lensSpecs = item.lensSpecs;
//     if (lensSpecs.focalLengthMinMm && lensSpecs.focalLengthMaxMm) {
//       specs.push({
//         name: "Focal Length",
//         value: `${lensSpecs.focalLengthMinMm} - ${lensSpecs.focalLengthMaxMm} mm`,
//       });
//     }
//   }
//   return specs;
// }

export function generateGearPageJsonLd(input: GearPageJsonLdInput): string {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
  if (!baseUrl) {
    throw new Error(
      "Tried to generate JSON-LD without NEXT_PUBLIC_BASE_URL being set",
    );
  }

  const product: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "ProductModel",
    "@id": input.canonicalUrl,
    isPartOf: {
      "@type": "WebSite",
      "@id": `${baseUrl}/#website`,
      name: "Sharply",
      url: `${baseUrl}/`,
    },
    url: input.canonicalUrl,
    name: input.name,
  };

  if (input.description) {
    product.description = input.description;
  }

  if (input.brandId) {
    const brand = BRANDS.find((b) => b.id === input.brandId);
    if (brand) {
      product.brand = {
        "@type": "Brand",
        "@id": `${baseUrl}/browse/${brand.slug}`,
        name: brand.name,
        url: `${baseUrl}/browse/${brand.slug}`,
      };
    }
  }

  if (input.image) {
    product.image = input.image;
  }

  if (input.category) {
    if (input.category === "CAMERA") {
      product.category = "Camera";
    } else if (input.category === "LENS") {
      product.category = "Lens";
    }
  }

  if (process.env.NODE_ENV !== "production") {
    console.log("Generated JSON-LD for product:", product);
  }

  return JSON.stringify(product);
}
