export type Suggestion = {
  id: string;
  label: string;
  href: string;
  type: "gear" | "brand";
  relevance?: number;
};
