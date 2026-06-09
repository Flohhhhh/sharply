export const botIdProtectedRoutes = [
  {
    path: "/api/contact",
    method: "POST",
  },
  {
    path: "/api/gear/*/reviews",
    method: "POST",
  },
  {
    path: "/api/reviews/*",
    method: "POST",
  },
  {
    path: "/api/exif-tracking/save",
    method: "POST",
  },
  {
    path: "/exif-viewer/parse",
    method: "POST",
  },
  {
    path: "/*/exif-viewer/parse",
    method: "POST",
  },
  {
    path: "/gear/*",
    method: "POST",
  },
  {
    path: "/*/gear/*",
    method: "POST",
  },
] satisfies Array<{ path: string; method: string }>;
