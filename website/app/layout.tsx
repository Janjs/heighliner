import type { Metadata } from "next";
import "@xyflow/react/dist/style.css";
import "./globals.css";

export const metadata: Metadata = { title: "Heighliner", description: "Map how your company works and discover routes to AI automation.", icons: "/heighliner-logo.svg" };
export default function Layout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="en"><body data-font="space">{children}</body></html>; }
