import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";

const inter = Inter({
  subsets: ["latin", "latin-ext"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Chytrý Bazénář – Péče o bazénovou vodu",
  description:
    "Chytrá webová aplikace pro péči o bazénovou vodu. Zadejte parametry a získejte okamžitě doporučené dávkování chemie a akční plán krok za krokem.",
  keywords: [
    "bazén",
    "bazénová chemie",
    "pH",
    "chlór",
    "péče o bazén",
    "Chytrý Bazénář",
  ],
  authors: [{ name: "Chytrý Bazénář" }],
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Chytrý Bazénář",
  },
  openGraph: {
    title: "Chytrý Bazénář",
    description: "Chytrá péče o vaši bazénovou vodu – dávkování i postup.",
    type: "website",
    locale: "cs_CZ",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#0ea5e9" },
    { media: "(prefers-color-scheme: dark)", color: "#0c4a6e" },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="cs" className={inter.variable} suppressHydrationWarning>
      <head>
        <link rel="icon" href="/icons/favicon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.svg" />
      </head>
      <body className="font-sans">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}