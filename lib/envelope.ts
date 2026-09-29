/** Everything written or stuck on the outside of an envelope. */
export interface EnvelopeConfig {
  from: { name: string; address: string[] };
  to: { name: string; address: string[] };
  stamp: {
    src: string;
    alt: string;
    width: number;
    height: number;
    /** How many are stuck on, side by side. */
    count: number;
    /**
     * Fraction trimmed from each side of the scan (its own background and
     * perforations): `x` from left and right, `y` from top and bottom.
     */
    crop: { x: number; y: number };
  };
  postmark: { town: string; date: string; time: string };
  seal: {
    /** One or two letters pressed into the wax. */
    monogram: string;
    /** Base wax colour; highlights and shadows are derived from it. */
    wax: string;
  };
}
