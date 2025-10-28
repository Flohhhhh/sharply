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
      {
        source: "/discord/invite",
        destination: "https://discord.gg/8qSXVurbw6",
        permanent: false,
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
      {
        protocol: "https",
        hostname: "utfs.io",
      },
    ],
  },
};

export default withPayload(config);
