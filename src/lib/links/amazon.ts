import { buildAmazonProductUrl } from "~/lib/validation/amazon";

const SHARPLY_AMAZON_AFFILIATE_TAG = "sharply-20";

/**
 * Return the Amazon destination URL for the given ASIN with our affiliate tag applied.
 */
export function getAmazonDestinationUrl(asin: string): string {
  return buildAmazonProductUrl(asin, {
    affiliateTag: SHARPLY_AMAZON_AFFILIATE_TAG,
  });
}
