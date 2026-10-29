import type { Metadata } from "next";
import "./globals.css";
import Store from "@/components/store";
export const metadata: Metadata = {
  title: "NovaMart | Mobile accessories",
  description:
    "Cases, chargers, cables and audio, chosen for the way you carry your phone.",
};
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body>
        <Store />
        {children}
      </body>
    </html>
  );
}
