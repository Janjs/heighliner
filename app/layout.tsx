import type { Metadata } from "next";
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
      <body>{children}</body>
    </html>
  );
}
