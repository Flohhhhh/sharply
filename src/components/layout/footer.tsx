import React from "react";
import {
  FaDiscord,
  FaFacebook,
  FaInstagram,
  FaLinkedin,
  FaTwitter,
} from "react-icons/fa";
import { getFooterItems } from "~/lib/nav-items";
import Link from "next/link";

interface Footer7Props {
  logo?: {
    url: string;
    src: string;
    alt: string;
    title: string;
  };
  description?: string;
  socialLinks?: Array<{
    icon: React.ReactElement;
    href: string;
    label: string;
  }>;
  copyright?: string;
}

// Footer sections will be dynamically generated from nav-items.ts

const defaultSocialLinks = [
  {
    icon: <FaDiscord className="size-5" />,
    href: "/discord/invite",
    label: "Join Discord",
  },
  {
    icon: <FaInstagram className="size-5" />,
    href: "https://www.instagram.com/sharplyphoto/",
    label: "Instagram",
  },
  // { icon: <FaFacebook className="size-5" />, href: "#", label: "Facebook" },
  {
    icon: <FaTwitter className="size-5" />,
    href: "https://x.com/sharply_photo",
    label: "X",
  },
  // { icon: <FaLinkedin className="size-5" />, href: "#", label: "LinkedIn" },
];

// Legal links will be dynamically generated from nav-items.ts

export default function Footer({
  logo = {
    url: "/",
    src: "/favicon.ico",
    alt: "Sharply",
    title: "Sharply",
  },
  description = "Sharply is a community-driven platform for sharing and discovering the best gear for your photography and videography needs.",
  socialLinks = defaultSocialLinks,
  copyright = "© 2025 Sharply. All rights reserved.",
}: Footer7Props) {
  return (
    <section className="w-full py-16">
      <div className="flex w-full flex-col justify-between gap-10 px-4 sm:px-8 lg:flex-row lg:items-start lg:text-left">
        <div className="flex w-full flex-col justify-between gap-6 lg:items-start">
          {/* Logo */}
          <div className="flex items-center gap-2 lg:justify-start">
            <Link href={logo.url}>
              <img
                src={logo.src}
                alt={logo.alt}
                title={logo.title}
                className="h-8"
              />
            </Link>
            <h2 className="text-xl font-semibold">{logo.title}</h2>
          </div>
          <p className="text-muted-foreground max-w-[70%] text-sm">
            {description}
          </p>
          <ul className="text-muted-foreground flex items-center space-x-6">
            {socialLinks.map((social, idx) => (
              <li key={idx} className="hover:text-primary font-medium">
                <Link
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={social.label}
                >
                  {social.icon}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div className="grid w-full gap-6 md:grid-cols-4 lg:gap-12">
          {/* Navigation Categories */}
          {(() => {
            const footerItems = getFooterItems();
            return (
              <>
                {/* Category columns */}
                {footerItems.sections.map((section, sectionIdx) => (
                  <div key={sectionIdx}>
                    <h3 className="text-foreground mb-4 font-bold">
                      {section.title}
                    </h3>
                    <ul className="text-muted-foreground space-y-3 text-sm">
                      {section.links.map((link, linkIdx) => (
                        <li
                          key={linkIdx}
                          className="hover:text-primary font-medium transition-colors"
                        >
                          <Link href={link.href}>{link.name}</Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}

                {/* Standalone links column */}
                <div>
                  <h3 className="text-foreground mb-4 font-bold">More</h3>
                  <ul className="text-muted-foreground space-y-3 text-sm">
                    {footerItems.bottomLinks.map((link, linkIdx) => (
                      <li
                        key={linkIdx}
                        className="hover:text-primary font-medium transition-colors"
                      >
                        <Link href={link.href}>{link.name}</Link>
                      </li>
                    ))}
                  </ul>
                </div>
              </>
            );
          })()}
        </div>
      </div>
      <div className="border-border mt-8 border-t py-8">
        <div className="text-muted-foreground flex flex-col justify-between gap-4 px-4 text-xs font-medium sm:px-8 md:flex-row md:items-center md:text-left">
          <div className="flex max-w-sm flex-col gap-4">
            <p className="order-2 lg:order-1">
              Product images © respective manufacturers. Used for editorial and
              informational purposes only. This site is independent and not
              affiliated with Nikon, Canon, Sony, or other brands.
            </p>
            <p>
              As an Amazon Affiliate, Sharply may earn a commission on
              qualifying purchases made through links to Amazon.
            </p>
            <p className="order-2 lg:order-1">{copyright}</p>
          </div>

          <ul className="order-1 flex flex-col gap-3 md:order-2 md:flex-row">
            <li className="hover:text-primary transition-colors">
              <Link href="/privacy-policy">Privacy</Link>
            </li>
            <li className="hover:text-primary transition-colors">
              <Link href="/terms-of-service">Term of Service</Link>
            </li>
            {/* <li className="hover:text-primary transition-colors">
              <Link href="/contact">Contact</Link>
            </li> */}
          </ul>
        </div>
      </div>
    </section>
  );
}
