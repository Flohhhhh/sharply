import {
  BarChart3,
  BookOpen,
  Camera,
  FileText,
  Film,
  Flame,
  HelpCircle,
  Info,
  Palette,
  PencilRuler,
  Scale,
  Search,
  Settings,
  Shield,
  SquareStop,
  Star,
  Target,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react";
import { FaInstagram } from "react-icons/fa";
import { TbLaurelWreath } from "react-icons/tb";

type NavTranslator = (key: string) => string;

interface NavItem {
  titleKey: string;
  type: "link" | "category";
  url?: string;
  items?: {
    titleKey: string;
    url: string;
    descriptionKey?: string;
    iconKey?:
      | "camera"
      | "search"
      | "chart"
      | "book"
      | "settings"
      | "help"
      | "info"
      | "shield"
      | "file"
      | "users"
      | "star"
      | "trending"
      | "zap"
      | "wreath"
      | "target"
      | "palette"
      | "film"
      | "scale"
      | "pencilRuler"
      | "instagram"
      | "flame"
      | "squareStop";
  }[];
  hideFromNavbar?: boolean;
  hideFromFooter?: boolean;
}

const navItems: NavItem[] = [
  { titleKey: "about", type: "link", url: "/about" },
  {
    titleKey: "news",
    type: "link",
    url: "/news",
  },
  {
    titleKey: "gear",
    type: "category",
    items: [
      {
        titleKey: "gearBrowseTitle",
        url: "/gear",
        descriptionKey: "gearBrowseDescription",
        iconKey: "camera",
      },
      {
        titleKey: "gearContributeTitle",
        url: "/lists/under-construction",
        descriptionKey: "gearContributeDescription",
        iconKey: "pencilRuler",
      },
      {
        titleKey: "gearHallOfFameTitle",
        url: "/lists/hall-of-fame",
        descriptionKey: "gearHallOfFameDescription",
        iconKey: "wreath",
      },
      {
        titleKey: "gearTrendingTitle",
        url: "/lists/trending",
        descriptionKey: "gearTrendingDescription",
        iconKey: "flame",
      },
    ],
  },
  {
    titleKey: "tools",
    type: "category",
    items: [
      {
        titleKey: "toolCompareTitle",
        url: "/compare",
        descriptionKey: "toolCompareDescription",
        iconKey: "scale",
      },
      {
        titleKey: "toolExifViewerTitle",
        url: "/exif-viewer",
        descriptionKey: "toolExifViewerDescription",
        iconKey: "file",
      },
      {
        titleKey: "toolInstagramPostBuilderTitle",
        url: "/instagram-post-builder",
        descriptionKey: "toolInstagramPostBuilderDescription",
        iconKey: "instagram",
      },
    ],
  },
  {
    titleKey: "learn",
    type: "category",
    items: [
      {
        titleKey: "learnBasicsTitle",
        url: "/learn/basics",
        descriptionKey: "learnBasicsDescription",
        iconKey: "book",
      },
      {
        titleKey: "learnViewAllTitle",
        url: "/learn",
        descriptionKey: "learnViewAllDescription",
        iconKey: "book",
      },
    ],
  },
  {
    titleKey: "github",
    type: "link",
    url: "https://github.com/Flohhhhh/sharply",
    hideFromNavbar: true,
    hideFromFooter: false,
  },
  {
    titleKey: "contact",
    type: "link",
    url: "/contact",
    hideFromNavbar: true,
  },
  {
    titleKey: "privacyPolicy",
    type: "link",
    url: "/privacy-policy",
    hideFromNavbar: true,
    hideFromFooter: false,
  },
  {
    titleKey: "termsOfService",
    type: "link",
    url: "/terms-of-service",
    hideFromNavbar: true,
    hideFromFooter: false,
  },
];

export const iconMap = {
  camera: Camera,
  search: Search,
  chart: BarChart3,
  book: BookOpen,
  settings: Settings,
  help: HelpCircle,
  info: Info,
  shield: Shield,
  file: FileText,
  users: Users,
  star: Star,
  trending: TrendingUp,
  zap: Zap,
  target: Target,
  palette: Palette,
  film: Film,
  scale: Scale,
  pencilRuler: PencilRuler,
  wreath: TbLaurelWreath,
  instagram: FaInstagram,
  flame: Flame,
  squareStop: SquareStop,
};

export const getNavItems = (t: NavTranslator) => {
  return navItems
    .filter((item) => !item.hideFromNavbar)
    .map((item) => ({
      title: t(item.titleKey),
      url: item.url || "#",
      items:
        item.type === "category"
          ? item.items?.map((subItem) => ({
              title: t(subItem.titleKey),
              url: subItem.url,
              description: subItem.descriptionKey
                ? t(subItem.descriptionKey)
                : undefined,
              iconKey: subItem.iconKey,
            }))
          : undefined,
    }));
};

export const getFooterItems = (t: NavTranslator) => {
  const footerItems = navItems.filter((item) => !item.hideFromFooter);
  const categories = footerItems.filter((item) => item.type === "category");
  const standaloneLinks = footerItems.filter((item) => item.type === "link");

  return {
    sections: categories.map((category) => ({
      title: t(category.titleKey),
      links:
        category.items?.map((item) => ({
          name: t(item.titleKey),
          href: item.url,
        })) || [],
    })),
    bottomLinks: standaloneLinks.map((item) => ({
      name: t(item.titleKey),
      href: item.url || "#",
    })),
  };
};

export const getGearNavItems = (t: NavTranslator) => {
  return navItems
    .filter((item) => item.titleKey === "gear")
    .flatMap((item) =>
      (item.items || []).map((subItem) => ({
        ...subItem,
        title: t(subItem.titleKey),
        description: subItem.descriptionKey
          ? t(subItem.descriptionKey)
          : undefined,
      })),
    );
};

export const getToolNavItems = (t: NavTranslator) => {
  return navItems
    .filter((item) => item.titleKey === "tools")
    .flatMap((item) =>
      (item.items || []).map((subItem) => ({
        ...subItem,
        title: t(subItem.titleKey),
        description: subItem.descriptionKey
          ? t(subItem.descriptionKey)
          : undefined,
      })),
    );
};

export const getLearnNavItems = (t: NavTranslator) => {
  return navItems
    .filter((item) => item.titleKey === "learn")
    .flatMap((item) =>
      (item.items || []).map((subItem) => ({
        ...subItem,
        title: t(subItem.titleKey),
        description: subItem.descriptionKey
          ? t(subItem.descriptionKey)
          : undefined,
      })),
    );
};

export const getNavItemByTitle = (title: string, t: NavTranslator) => {
  return navItems.find((item) => t(item.titleKey) === title);
};

export const getAllCategoryItems = (t: NavTranslator) => {
  return navItems
    .filter((item) => item.type === "category")
    .flatMap((item) =>
      (item.items || []).map((subItem) => ({
        ...subItem,
        title: t(subItem.titleKey),
        description: subItem.descriptionKey
          ? t(subItem.descriptionKey)
          : undefined,
      })),
    );
};

export const isNavUrl = (url: string) => {
  return navItems.some((item) => {
    if (item.url === url) return true;
    if (item.items?.some((subItem) => subItem.url === url)) return true;
    return false;
  });
};
