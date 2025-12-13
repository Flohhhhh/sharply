import { buildAmazonProductUrl } from "~/lib/validation/amazon";

/**
 * Return the Amazon destination URL for the given ASIN with our affiliate tag applied.
 */
export function getAmazonDestinationUrl(asin: string): string {
  return buildAmazonProductUrl(asin, {
    affiliateTag: process.env.AMAZON_AFFILIATE_TAG,
  });
}
