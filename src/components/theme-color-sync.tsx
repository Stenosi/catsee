"use client";

import { useEffect } from "react";

export default function ThemeColorSync() {
  useEffect(() => {
    const el = document.createElement("div");
    el.style.cssText =
      "position:fixed;visibility:hidden;pointer-events:none;background:var(--card)";
    document.body.appendChild(el);
    const rgb = getComputedStyle(el).backgroundColor;
    document.body.removeChild(el);

    const match = rgb.match(/\d+/g);
    if (!match) return;
    const hex =
      "#" +
      match
        .slice(0, 3)
        .map((n) => parseInt(n).toString(16).padStart(2, "0"))
        .join("");

    const meta = document.querySelector<HTMLMetaElement>(
      'meta[name="theme-color"]'
    );
    if (meta) meta.content = hex;
  }, []);

  return null;
}
