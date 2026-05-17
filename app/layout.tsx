import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Inter } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { RootShell } from "@/components/layout/root-shell";
import { SiteSwitcher } from "@/components/site-switcher";
import { GA_MEASUREMENT_ID } from "@/lib/analytics";
import {
  SITE_DESCRIPTION,
  SITE_NAME,
  SITE_URL,
  jsonLdScript,
  organizationJsonLd
} from "@/lib/seo";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap"
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_NAME,
    template: `%s | ${SITE_NAME}`
  },
  description: SITE_DESCRIPTION
};

export default function RootLayout({
  children
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html className={inter.variable} lang="en">
      <body>
        <script
          dangerouslySetInnerHTML={{ __html: jsonLdScript(organizationJsonLd()) }}
          type="application/ld+json"
        />
        {GA_MEASUREMENT_ID ? (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
              strategy="afterInteractive"
            />
            <Script id="ga-init" strategy="afterInteractive">
              {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${GA_MEASUREMENT_ID}');`}
            </Script>
          </>
        ) : null}
        <RootShell>{children}</RootShell>
        <SiteSwitcher />
      </body>
    </html>
  );
}
