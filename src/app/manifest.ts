import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Kalwings", short_name: "Kalwings", description: "Your potential deserves to be seen.",
    id: "/", start_url: "/", scope: "/", lang: "en-IN", dir: "ltr", orientation: "portrait", categories: ["education", "business", "productivity"], display: "standalone", background_color: "#0B0E1A", theme_color: "#0B0E1A",
    shortcuts: [
      { name: "Opportunities", short_name: "Jobs", url: "/opportunities", description: "Browse open roles" },
      { name: "Events", url: "/events", description: "Webinars, workshops and meetups" },
      { name: "Calendar", url: "/calendar", description: "Deadlines and events" },
      { name: "My dashboard", short_name: "Dashboard", url: "/dashboard", description: "Applications and profile" },
    ],
    icons: [
      { src: "/pwa-icon/192", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/pwa-icon/512", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/pwa-icon/512", sizes: "512x512", type: "image/png", purpose: "maskable" },
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
    ],
  };
}
