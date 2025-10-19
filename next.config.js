import { withPayload } from "@payloadcms/next/withPayload";
/**
 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially useful
 * for Docker builds.
 */
import "./src/env.js";

/** @type {import("next").NextConfig} */
const config = {
  async redirects() {
    return [
      {
        source: "/gear",
        destination: "/browse",
        permanent: true,
      },
      {
        source: "/gear/",
        destination: "/browse",
        permanent: true,
      },
      {
        source: "/brand/:slug",
        destination: "/browse/:slug",
        permanent: true,
      },
    ];
  },
  eslint: {
    ignoreDuringBuilds: false,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "8v5lpkd4bi.ufs.sh",
      },
    ],
  },
};

export default withPayload(config);
