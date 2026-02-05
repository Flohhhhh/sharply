import type { LucideIcon } from "lucide-react";
import { Bug, BookAlert, Feather, HeartHandshake } from "lucide-react";

export type ContactOption = {
  label: string;
  description: string;
  value: string;
  additionalInfo: string | null;
  infoLink: string | null;
  icon: LucideIcon;
};

export const CONTACT_OPTIONS: ContactOption[] = [
  {
    label: "Data Errors",
    description:
      "If you've found an issue with some data on the platform, please let us know so we can investigate and fix it.",
    value: "data-issue",
    additionalInfo:
      "Remember, Sharply is crowd-sourced! If you just found an incorrect spec or price on a gear item you can simply log in and submit a correction.",
    infoLink: null,
    icon: BookAlert,
  },
  {
    label: "Contributors",
    description:
      "If you're a writer or developer we would love to hear from you about how you can help us improve the platform.",
    value: "contribute",
    additionalInfo:
      "If you're a writer or developer we would love to hear from you about how you can help us improve the platform.",
    infoLink: null,
    icon: Feather,
  },
  {
    label: "Brand Partnerships",
    description:
      "We're always looking for new brand partnerships. If you're interested in partnering with us, please let us know.",
    value: "brand-partnerships",
    additionalInfo:
      "We're always looking for new brand partnerships. If you're interested in partnering with us, please let us know.",
    infoLink: null,
    icon: HeartHandshake,
  },
  {
    label: "Technical Issue",
    description:
      "If you're having technical issues with the platform, please let us know so we can investigate and fix it.",
    value: "technical-issue",
    additionalInfo:
      "Remember, Sharply is open source! If you want you can submit an issue or pull request to our GitHub repository.",
    infoLink: "https://github.com/Flohhhhh/sharply",
    icon: Bug,
  },
];
