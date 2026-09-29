import { La_Belle_Aurore, Herr_Von_Muellerhoff, Cormorant_Garamond } from "next/font/google";

/** The writer's hand: quick, slanted, adult. Used for everything he wrote. */
export const hand = La_Belle_Aurore({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-hand",
  display: "block",
});

/** A faster, looser flourish, only for the signature. */
export const signature = Herr_Von_Muellerhoff({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-signature",
  display: "block",
});

/** Quiet printed type for the few words outside the letter. */
export const caption = Cormorant_Garamond({
  weight: ["400", "500"],
  style: ["italic", "normal"],
  subsets: ["latin"],
  variable: "--font-caption",
});
