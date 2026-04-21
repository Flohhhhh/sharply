"use client";

import { useTranslations } from "next-intl";
import Image from "next/image";
import React from "react";
import { FaDiscord,FaGithub,FaInstagram,FaTwitter } from "react-icons/fa";
import { LanguageSwitcher } from "~/components/language-switcher";
import { LocaleLink } from "~/components/locale-link";
import { getFooterItems } from "~/lib/nav-items";

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

// Legal links will be dynamically generated from nav-items.ts

export default function Footer({
  logo = {
    url: "/",
    src: "/favicon.ico",
    alt: "Sharply",
    title: "Sharply",
  },
  description,
  socialLinks,
  copyright,
}: Footer7Props) {
  const tNav = useTranslations("nav");
  const tFooter = useTranslations("footer");

  const footerItems = getFooterItems(tNav);
  const resolvedDescription = description ?? tFooter("description");
  const resolvedSocialLinks = socialLinks ?? [
    {
      icon: <FaDiscord className="size-5" />,
      href: "/discord/invite",
      label: tFooter("joinDiscord"),
    },
    {
      icon: <FaInstagram className="size-5" />,
      href: "https://www.instagram.com/sharplyphoto/",
      label: tFooter("instagram"),
    },
    {
      icon: <FaTwitter className="size-5" />,
      href: "https://x.com/sharply_photo",
      label: tFooter("x"),
    },
    {
      icon: <FaGithub className="size-5" />,
      href: "https://github.com/Flohhhhh/sharply",
      label: tFooter("github"),
    },
  ];
  const resolvedCopyright = copyright ?? tFooter("copyright");

  return (
    <section className="w-full py-16">
      <div className="flex w-full flex-col justify-between gap-10 px-4 sm:px-8 lg:flex-row lg:items-start lg:text-left">
        <div className="flex w-full flex-col justify-between gap-6 lg:items-start">
          {/* Logo */}
          <div className="flex items-center gap-4 lg:justify-start">
            <LocaleLink href={logo.url}>
              <Image
                src={logo.src}
                alt={logo.alt}
                title={logo.title}
                className="h-8"
                width={32}
                height={32}
              />
            </LocaleLink>
            <h2 className="text-xl font-semibold">{logo.title}</h2>
            <LanguageSwitcher />
          </div>
          <p className="text-muted-foreground max-w-[70%] text-sm">
            {resolvedDescription}
          </p>
          <ul className="text-muted-foreground flex items-center space-x-6">
            {resolvedSocialLinks.map((social, idx) => (
              <li key={idx} className="hover:text-primary font-medium">
                <LocaleLink
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={social.label}
                >
                  {social.icon}
                </LocaleLink>
              </li>
            ))}
          </ul>
        </div>
        <div className="grid w-full gap-6 md:grid-cols-4 lg:gap-12">
          {/* Navigation Categories */}
          <>
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
                      <LocaleLink href={link.href}>{link.name}</LocaleLink>
                    </li>
                  ))}
                </ul>
              </div>
            ))}

            <div>
              <h3 className="text-foreground mb-4 font-bold">{tNav("more")}</h3>
              <ul className="text-muted-foreground space-y-3 text-sm">
                {footerItems.bottomLinks.map((link, linkIdx) => (
                  <li
                    key={linkIdx}
                    className="hover:text-primary font-medium transition-colors"
                  >
                    <LocaleLink href={link.href}>{link.name}</LocaleLink>
                  </li>
                ))}
              </ul>
            </div>
          </>
        </div>
      </div>
      <div className="border-border mt-8 border-t py-8">
        <div className="text-muted-foreground flex flex-col justify-between gap-4 px-4 text-xs font-medium sm:px-8 md:flex-row md:items-start md:text-left">
          <div className="flex max-w-sm flex-col gap-4">
            <p className="order-2 lg:order-1">
              {tFooter("productImagesDisclaimer")}
            </p>
            <p>{tFooter("amazonAffiliateDisclaimer")}</p>
            <p className="order-2 lg:order-1">{resolvedCopyright}</p>
          </div>

          <ul className="order-1 flex flex-col gap-3 md:order-2 md:flex-row md:self-start">
            <li className="hover:text-primary transition-colors">
              <LocaleLink href="/privacy-policy">
                {tNav("privacyPolicy")}
              </LocaleLink>
            </li>
            <li className="hover:text-primary transition-colors">
              <LocaleLink href="/terms-of-service">
                {tNav("termsOfService")}
              </LocaleLink>
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
