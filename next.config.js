import { withPayload } from "@payloadcms/next/withPayload";
/**
 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially useful
 * for Docker builds.
 */
import "./src/env.js";

/** @type {import("next").NextConfig} */
const config = {
  eslint: {
    ignoreDuringBuilds: false,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "sharply-directus.onrender.com",
      },
      {
        protocol: "https",
        hostname: "8v5lpkd4bi.ufs.sh",
      },
    ],
  },
};

export default withPayload(config);
