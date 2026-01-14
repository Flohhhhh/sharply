// ReactNode import removed as it's not used in this file
import {
  Camera,
  Search,
  BarChart3,
  BookOpen,
  Settings,
  HelpCircle,
  Info,
  Shield,
  FileText,
  Users,
  Star,
  TrendingUp,
  Zap,
  Target,
  Palette,
  Film,
  Scale,
  PencilRuler,
  Flame,
  SquareStop,
} from "lucide-react";
import { TbLaurelWreath } from "react-icons/tb";
import { FaInstagram } from "react-icons/fa";

interface NavItem {
  title: string;
  type: "link" | "category";
  url?: string;
  items?: {
    title: string;
    url: string;
    description?: string;
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

export const navItems: NavItem[] = [
  { title: "About", type: "link", url: "/about" },
  {
    title: "News",
    type: "link",
    url: "/news",
  },
  {
    title: "Gear",
    type: "category",
    items: [
      {
        title: "Browse",
        url: "/gear",
        description: "Explore all cameras, lenses, and accessories",
        iconKey: "camera",
      },
      {
        title: "Contribute",
        url: "/lists/under-construction",
        description: "View items that need contributions",
        iconKey: "pencilRuler",
      },
      {
        title: "Hall of Fame",
        url: "/lists/hall-of-fame",
        description:
          "The most iconic and influential gear in the history of photography",
        iconKey: "wreath",
      },
      {
        title: "Trending",
        url: "/lists/trending",
        description: "The most popular gear based on activity.",
        iconKey: "flame",
      },
    ],
  },
  {
    title: "Tools",
    type: "category",
    items: [
      // {
      //   title: "Search",
      //   url: "/search",
      //   description: "Search for gear by name, brand, or type",
      //   iconKey: "search",
      // },
      {
        title: "Compare",
        url: "/compare",
        description: "Compare gear side-by-side",
        iconKey: "scale",
      },
      {
        title: "Instagram Post Builder",
        url: "/instagram-post-builder",
        description: "Create Instagram posts with multiple images",
        iconKey: "instagram",
      },
      // {
      //   title: "Field of View Reference",
      //   url: "/focal-length-reference",
      //   description: "Visualize different focal lengths and sensor sizes.",
      //   iconKey: "squareStop",
      // },
    ],
  },

  {
    title: "Learn",
    type: "category",
    items: [
      {
        title: "Basics",
        url: "/learn/basics",
        description: "Learn about the basics of photography",
        iconKey: "book",
      },
      {
        title: "View All Learn Content",
        url: "/learn",
        description: "View all learn content",
        iconKey: "book",
      },
      // {
      //   title: "Camera Guides",
      //   url: "/learn/camera-guides",
      //   description: "Master your camera settings",
      //   iconKey: "book",
      // },
      // {
      //   title: "Lens Selection",
      //   url: "/learn/lens-selection",
      //   description: "Choose the right lens for your needs",
      //   iconKey: "target",
      // },
      // {
      //   title: "Photography Tips",
      //   url: "/learn/photography-tips",
      //   description: "Improve your photography skills",
      //   iconKey: "palette",
      // },
      // {
      //   title: "Gear Maintenance",
      //   url: "/learn/gear-maintenance",
      //   description: "Keep your equipment in top shape",
      //   iconKey: "settings",
      // },
    ],
  },
  {
    title: "Contact",
    type: "link",
    url: "/contact",
    hideFromNavbar: true,
  },
  {
    title: "Privacy Policy",
    type: "link",
    url: "/privacy-policy",
    hideFromNavbar: true,
    hideFromFooter: false,
  },
  {
    title: "Terms of Service",
    type: "link",
    url: "/terms-of-service",
    hideFromNavbar: true,
    hideFromFooter: false,
  },
];

// Icon mapping for consistent icon usage
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

// Get nav items filtered by hideFromNavbar and format for the navbar component
export const getNavItems = () => {
  return navItems
    .filter((item) => !item.hideFromNavbar)
    .map((item) => ({
      title: item.title,
      url: item.url || "#",
      items:
        item.type === "category"
          ? item.items?.map((subItem) => ({
              title: subItem.title,
              url: subItem.url,
              description: subItem.description,
              iconKey: subItem.iconKey,
            }))
          : undefined,
    }));
};

// Get footer items filtered by hideFromFooter and format for the footer component
export const getFooterItems = () => {
  const footerItems = navItems.filter((item) => !item.hideFromFooter);

  const categories = footerItems.filter((item) => item.type === "category");
  const standaloneLinks = footerItems.filter((item) => item.type === "link");

  return {
    sections: categories.map((category) => ({
      title: category.title,
      links:
        category.items?.map((item) => ({
          name: item.title,
          href: item.url,
        })) || [],
    })),
    bottomLinks: standaloneLinks.map((item) => ({
      name: item.title,
      href: item.url || "#",
    })),
  };
};

// Get navigation items for specific contexts
export const getGearNavItems = () => {
  return navItems
    .filter((item) => item.title === "Gear")
    .flatMap((item) => item.items || []);
};

export const getToolNavItems = () => {
  return navItems
    .filter((item) => item.title === "Tools")
    .flatMap((item) => item.items || []);
};

export const getLearnNavItems = () => {
  return navItems
    .filter((item) => item.title === "Learn")
    .flatMap((item) => item.items || []);
};

// Utility function to get a specific nav item by title
export const getNavItemByTitle = (title: string) => {
  return navItems.find((item) => item.title === title);
};

// Utility function to get all category items
export const getAllCategoryItems = () => {
  return navItems
    .filter((item) => item.type === "category")
    .flatMap((item) => item.items || []);
};

// Utility function to check if a URL is in navigation
export const isNavUrl = (url: string) => {
  return navItems.some((item) => {
    if (item.url === url) return true;
    if (item.items?.some((subItem) => subItem.url === url)) return true;
    return false;
  });
};
