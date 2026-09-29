import type { EnvelopeConfig } from "@/lib/envelope";

/**
 * The envelope for the Durrell letter. Addresses are period-style
 * placeholders; edit them here and nowhere else.
 */
export const envelope: EnvelopeConfig = {
  from: {
    name: "Gerald Durrell",
    address: ["The Manor House", "Trinity, Jersey", "Channel Islands"],
  },
  to: {
    name: "Lee McGeorge",
    address: ["c/o The Department of Zoology", "Durham, North Carolina", "U.S.A."],
  },
  stamp: {
    src: "/stamps/colorado-13c.jpg",
    alt: "A 13 cent United States stamp: Colorado, the Centennial State, with a columbine flower below blue mountains",
    width: 449,
    height: 683,
    count: 3,
    crop: { x: 0.056, y: 0.03 },
  },
  postmark: { town: "JERSEY", date: "1 AUG 1978", time: "4.15 PM" },
  seal: { monogram: "G", wax: "#4c0f19" },
};
