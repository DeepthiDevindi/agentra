import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TripMate AI | Plan a better journey",
  description: "An AI-powered travel planner for thoughtful, personal trips."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
