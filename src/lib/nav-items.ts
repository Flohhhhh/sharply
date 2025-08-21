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
} from "lucide-react";

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
      | "target"
      | "palette"
      | "film";
  }[];
  hideFromNavbar?: boolean;
  hideFromFooter?: boolean;
}

export const navItems: NavItem[] = [
  {
    title: "Gear",
    type: "category",
    items: [
      {
        title: "Browse Database",
        url: "/gear",
        description: "Explore all cameras, lenses, and accessories",
        iconKey: "camera",
      },
      {
        title: "Canon",
        url: "/brand/canon",
        description: "DSLR and mirrorless cameras, lenses",
        iconKey: "camera",
      },
      {
        title: "Nikon",
        url: "/brand/nikon",
        description: "Professional cameras and optics",
        iconKey: "camera",
      },
      {
        title: "Sony",
        url: "/brand/sony",
        description: "Mirrorless cameras and lenses",
        iconKey: "camera",
      },
      {
        title: "Fujifilm",
        url: "/brand/fujifilm",
        description: "Film and digital cameras, lenses",
        iconKey: "camera",
      },
      {
        title: "Leica",
        url: "/brand/leica",
        description: "Premium cameras and optics",
        iconKey: "camera",
      },
    ],
  },
  {
    title: "Tools",
    type: "category",
    items: [
      {
        title: "Search & Compare",
        url: "/search",
        description: "Find and compare gear side-by-side",
        iconKey: "search",
      },
      {
        title: "Focal Simulator",
        url: "/focal-simulator",
        description: "Visualize different focal lengths",
        iconKey: "target",
      },
      {
        title: "Construction Test",
        url: "/construction-test",
        description: "Test your gear knowledge",
        iconKey: "zap",
      },
      {
        title: "Price Tracking",
        url: "/tools/price-tracking",
        description: "Track gear prices over time",
        iconKey: "trending",
      },
    ],
  },

  {
    title: "Learn",
    type: "category",
    items: [
      {
        title: "Camera Guides",
        url: "/learn/camera-guides",
        description: "Master your camera settings",
        iconKey: "book",
      },
      {
        title: "Lens Selection",
        url: "/learn/lens-selection",
        description: "Choose the right lens for your needs",
        iconKey: "target",
      },
      {
        title: "Photography Tips",
        url: "/learn/photography-tips",
        description: "Improve your photography skills",
        iconKey: "palette",
      },
      {
        title: "Gear Maintenance",
        url: "/learn/gear-maintenance",
        description: "Keep your equipment in top shape",
        iconKey: "settings",
      },
    ],
  },
  {
    title: "About",
    type: "link",
    url: "/about",
    hideFromNavbar: true,
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
