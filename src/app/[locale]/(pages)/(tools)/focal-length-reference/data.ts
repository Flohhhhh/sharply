export interface ImageSet {
  key: string;
  name: string;
  description: string;
  images: {
    url: string;
    focalLengthMm: number;
  }[];
}

export const ImageSets: ImageSet[] = [
  {
    key: "landscape-1",
    name: "Landscape 1",
    description: "A landscape photo of a mountain range.",
    images: [
      {
        url: "https://8v5lpkd4bi.ufs.sh/f/mJwI0W8NBfTnzmiSajDW5asiLTFbO8tnRDrZ2GJWf7we1uod",
        focalLengthMm: 16,
      },
      {
        url: "https://8v5lpkd4bi.ufs.sh/f/mJwI0W8NBfTnNPm1TFe4DztELgOkVAmswWaFS2xeUHYdrZQi",
        focalLengthMm: 24,
      },
      {
        url: "https://8v5lpkd4bi.ufs.sh/f/mJwI0W8NBfTn81QIpMvoIBeFGP6HCUDoAXSKYlv9mWg7bOu2",
        focalLengthMm: 35,
      },
      {
        url: "https://8v5lpkd4bi.ufs.sh/f/mJwI0W8NBfTndxRNGWt0HF8TGqsvlIEWRPn6ywJp3XzgAYQ1",
        focalLengthMm: 50,
      },
      {
        url: "https://8v5lpkd4bi.ufs.sh/f/mJwI0W8NBfTnT2n5mmNXOaFgH7eGuNrbwDnMJCZEPTImfYyS",
        focalLengthMm: 85,
      },
      {
        url: "https://8v5lpkd4bi.ufs.sh/f/mJwI0W8NBfTn2DbBND6O32XrPx7o8HylnZ4eJQftjDF6dG05",
        focalLengthMm: 135,
      },
      {
        url: "https://8v5lpkd4bi.ufs.sh/f/mJwI0W8NBfTnhO8jZCP2jkgLZ6eItO3UsaziDpdQxYKuwNG9",
        focalLengthMm: 200,
      },
      {
        url: "https://8v5lpkd4bi.ufs.sh/f/mJwI0W8NBfTnlTqpxx3J4eVQuiwaAZ0LHmNocGzSrUFndWgM",
        focalLengthMm: 400,
      },
    ],
  },
];
