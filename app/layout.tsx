import type { Metadata, Viewport } from "next";
import { hand, signature, caption } from "@/lib/fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: "All This I Did Without You",
  description: "A letter from Gerald Durrell to Lee McGeorge, 31 July 1978.",
};

export const viewport: Viewport = {
  themeColor: "#1c1713",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${hand.variable} ${signature.variable} ${caption.variable}`}>
      <body>{children}</body>
    </html>
  );
}
