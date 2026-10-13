import type { Metadata, Viewport } from "next";
import { Montserrat } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { ServiceWorkerRegister } from "@/components/sw-register";
import { RevealObserver } from "@/components/reveal-observer";
import { site } from "@/lib/site";

const orgLd = { "@context": "https://schema.org", "@type": "Organization", name: "Kalwings", url: site.url, slogan: site.tagline, description: site.description, address: { "@type": "PostalAddress", addressRegion: "Telangana", addressCountry: "IN" } };

// BRAND FONT (single swap point). Montserrat is a PLACEHOLDER chosen to sit with the geometric KALWINGS wordmark.
// To match another font (e.g. the one on os.nexpreneur.com), change ONLY this import/constructor and keep variable "--font-brand".
const brandFont = Montserrat({ subsets: ["latin"], variable: "--font-brand", display: "swap" });

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
  themeColor: "#000000",
  width: "device-width",
  initialScale: 1,
};

// Sets the theme before first paint to avoid a flash.
const themeScript = `document.documentElement.classList.add('js');try{var t=localStorage.getItem('kw-theme');document.documentElement.dataset.theme=t==='light'?'light':'dark'}catch(e){document.documentElement.dataset.theme='dark'}`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-IN" className={brandFont.variable} suppressHydrationWarning>
      <head><script dangerouslySetInnerHTML={{ __html: themeScript }} /><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(orgLd) }} /></head>
      <body>
        <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-full focus:bg-black focus:px-4 focus:py-2 focus:text-white">Skip to content</a>
        <Navbar />
        <main id="main">{children}</main>
        <Footer />
        <ServiceWorkerRegister />
        <RevealObserver />
      </body>
    </html>
  );
}
