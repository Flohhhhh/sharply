import type { LucideIcon } from "lucide-react";
import { Bug, BookAlert, Feather, HeartHandshake } from "lucide-react";
import type { ContactReason } from "~/lib/contact/contact-schema";

export type ContactOption = {
  label: string;
  description: string;
  value: ContactReason;
  additionalInfo: string | null;
  infoLink: string | null;
  subjectTemplate: string;
  messageTemplate: string;
  extraFields: Array<"referenceUrl" | "company">;
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
    subjectTemplate: "Data correction request",
    messageTemplate:
      "I found an issue with the following data on Sharply:\n\n- Gear item or page:\n- What looks incorrect:\n- Suggested correction:\n\nThanks!",
    extraFields: ["referenceUrl"],
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
    subjectTemplate: "Contributor interest",
    messageTemplate:
      "Hi Sharply team,\n\nI'm interested in contributing. Here's a quick summary of my background and how I'd like to help:\n\n- Area of interest (writing, data, engineering, etc.):\n- Relevant experience:\n- Availability:\n\nThanks!",
    extraFields: [],
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
    subjectTemplate: "Brand partnership inquiry",
    messageTemplate:
      "Hi Sharply team,\n\nI'm reaching out about a potential brand partnership. Here's a quick overview:\n\n- Company or brand:\n- Partnership idea:\n- Best next step:\n\nLooking forward to connecting.",
    extraFields: ["company"],
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
    subjectTemplate: "Technical issue report",
    messageTemplate:
      "I ran into a technical issue on Sharply:\n\n- What I was doing:\n- What happened:\n- What I expected:\n- Steps to reproduce (if known):\n\nThanks for looking into it.",
    extraFields: ["referenceUrl"],
    icon: Bug,
  },
];
