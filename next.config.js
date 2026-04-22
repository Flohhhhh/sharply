import { withPayload } from "@payloadcms/next/withPayload";
import { fileURLToPath } from "node:url";
import createNextIntlPlugin from "next-intl/plugin";
/**
 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially useful
 * for Docker builds.
 */
import "./src/env.js";

const emptyNodeFsPromisesPath = fileURLToPath(
  new URL("./src/lib/empty-node-fs-promises.js", import.meta.url),
);
const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

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
      {
        source: "/qr",
        destination: "/",
        permanent: false,
      },
    ];
  },
  eslint: {
    ignoreDuringBuilds: false,
  },
  images: {
    unoptimized: process.env.NODE_ENV === "development",
    remotePatterns: [
      {
        protocol: "https",
        hostname: "8v5lpkd4bi.ufs.sh",
      },
      {
        protocol: "https",
        hostname: "utfs.io",
      },
      {
        protocol: "https",
        hostname: "*.ytimg.com",
      },
      {
        protocol: "https",
        hostname: "img.youtube.com",
      },
      {
        protocol: "https",
        hostname: "cdn.discordapp.com",
      },
    ],
  },
  webpack: (config, { isServer, webpack }) => {
    if (!isServer) {
      config.plugins.push(
        new webpack.NormalModuleReplacementPlugin(
          /^node:fs\/promises$/,
          emptyNodeFsPromisesPath,
        ),
      );
    }

    return config;
  },
};

export default withPayload(withNextIntl(config));
