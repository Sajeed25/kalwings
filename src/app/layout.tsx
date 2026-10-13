import type { Metadata, Viewport } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { ServiceWorkerRegister } from "@/components/sw-register";
import { RevealObserver } from "@/components/reveal-observer";
import { site } from "@/lib/site";

const orgLd = { "@context": "https://schema.org", "@type": "Organization", name: "Kalwings", url: site.url, slogan: site.tagline, description: site.description, address: { "@type": "PostalAddress", addressRegion: "Telangana", addressCountry: "IN" } };

const display = Plus_Jakarta_Sans({ subsets: ["latin"], weight: ["700", "800"], variable: "--font-display", display: "swap" });
const body = Inter({ subsets: ["latin"], variable: "--font-body", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: { default: "Kalwings — Your potential deserves to be seen.", template: "%s · Kalwings" },
  description: site.description,
  applicationName: "Kalwings",
  manifest: "/manifest.webmanifest",
  openGraph: { type: "website", siteName: "Kalwings", title: "Kalwings — Your potential deserves to be seen.", description: site.description, url: site.url, locale: "en_IN" },
  twitter: { card: "summary_large_image", title: "Kalwings", description: site.description },
  alternates: { canonical: "/" },
};

export const viewport: Viewport = {
  themeColor: [{ media: "(prefers-color-scheme: light)", color: "#FAFAF7" }, { media: "(prefers-color-scheme: dark)", color: "#060F26" }],
  width: "device-width",
  initialScale: 1,
};

// Sets the theme before first paint to avoid a flash.
const themeScript = `document.documentElement.classList.add('js');try{var t=localStorage.getItem('kw-theme');if(t)document.documentElement.dataset.theme=t;else if(matchMedia('(prefers-color-scheme: dark)').matches)document.documentElement.dataset.theme='dark'}catch(e){}`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-IN" className={`${display.variable} ${body.variable}`} suppressHydrationWarning>
      <head><script dangerouslySetInnerHTML={{ __html: themeScript }} /><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(orgLd) }} /></head>
      <body>
        <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-full focus:bg-navy focus:px-4 focus:py-2 focus:text-white">Skip to content</a>
        <Navbar />
        <main id="main">{children}</main>
        <Footer />
        <ServiceWorkerRegister />
        <RevealObserver />
      </body>
    </html>
  );
}
