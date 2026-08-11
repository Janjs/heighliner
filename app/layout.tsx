import type { Metadata } from "next";
import "@xyflow/react/dist/style.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "Heighliner",
  description:
    "Map how your company works and discover the best routes to AI automation.",
  icons: "/heighliner-logo.svg",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Outfit:wght@400;500;600&family=Sora:wght@400;500;600&family=Space+Grotesk:wght@400;500;600&display=swap"
        />
      </head>
      <body data-font="space">{children}</body>
    </html>
  );
}
