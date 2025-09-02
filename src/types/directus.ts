/** * Generated TypeScript types for Directus Schema * Generated on: 2025-08-23T19:43:17.258Z */
export interface AllPost {
  id: string;
}

export interface AppDatum {
  id: string;
}

export interface Brand {
  id: string;
  name: string;
  slug: string;
  created_at: "datetime";
  updated_at: "datetime";
}

export interface Gear {
  id: string;
  slug: string;
  search_name: string;
  name: string;
  model_number: string;
  gear_type: string;
  brand_id: string;
  mount_id: string;
  release_date: "datetime";
  msrp_usd_cents: number;
  thumbnail_url: string;
  weight_grams: number;
  link_manufacturer: string;
  link_mpb: string;
  link_amazon: string;
  genres: Record<string, unknown>;
  created_at: "datetime";
  updated_at: "datetime";
}

export interface Genre {
  id: string;
  name: string;
  slug: string;
  description: string;
  created_at: "datetime";
  updated_at: "datetime";
}

export interface Mount {
  id: string;
}

export interface Post {
  id: string;
  status: string;
  sort: number;
  user_created: string | DirectusUser;
  date_created: "datetime";
  user_updated: string | DirectusUser;
  date_updated: "datetime";
  post_type: string;
  title: string;
  /** Slug will be auto generated */
  slug: string;
  related_brand: string | Brand;
  thumbnail: string | DirectusFile;
  related_gear: number[] | PostsGear[];
  thumbnail_caption: string;
  thumbnail_credit: string;
  review_gear_item: string | Gear;
  news_content_wysiwyg: string;
}

export interface PostsGear {
  id: number;
  posts_id: string | Post;
  gear_id: string | Gear;
}

export interface PostsTranslation {
  id: number;
  posts_id: string;
  languages_code: string;
}

export interface SensorFormat {
  id: string;
  slug: string;
  name: string;
  crop_factor: number;
  description: string;
  updated_at: "datetime";
  created_at: "datetime";
}

export interface DirectusUser {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  location: string;
  title: string;
  description: string;
  tags: string;
  avatar: string;
  language: string;
  tfa_secret: boolean;
  status: string;
  role: string;
  token: string;
  last_access: string;
  last_page: string;
  provider: string;
  external_identifier: string;
  auth_data: string;
  email_notifications: boolean;
  appearance: string;
  theme_dark: string;
  theme_light: string;
  theme_light_overrides: string;
  theme_dark_overrides: string;
  policies: string;
}

export interface DirectusFile {
  id: string;
  storage: string;
  filename_disk: string;
  filename_download: string;
  title: string;
  type: string;
  folder: string;
  uploaded_by: string;
  uploaded_on: string;
  modified_by: string;
  modified_on: string;
  charset: string;
  filesize: number;
  width: number;
  height: number;
  duration: number;
  embed: string;
  description: string;
  location: string;
  tags: string;
  metadata: string;
  created_on: string;
  focal_point_x: string;
  focal_point_y: string;
  tus_id: string;
  tus_data: string;
}

export interface DirectusFolder {
  id: string;
  name: string;
  parent: string;
}

export interface DirectusRole {
  id: string;
  name: string;
  icon: string;
  description: string;
  admin_access: boolean;
  app_access: boolean;
  children: string;
  users: string;
  parent: string;
  policies: string;
}

export interface ApiCollections {
  all_posts: AllPost[];
  app_data: AppDatum[];
  brands: Brand[];
  gear: Gear[];
  genres: Genre[];
  mounts: Mount[];
  posts: Post[];
  posts_gear: PostsGear[];
  posts_translations: PostsTranslation[];
  sensor_formats: SensorFormat[];
  directus_users: DirectusUser[];
  directus_files: DirectusFile[];
}
