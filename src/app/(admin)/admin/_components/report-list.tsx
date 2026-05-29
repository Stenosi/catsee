"use client";

import { useState } from "react";
import ReportGroup, { type ReportGroupProps } from "./report-group";

type CardData = Omit<ReportGroupProps, "expanded" | "onToggleExpand">;

export default function ReportList({ items }: { items: CardData[] }) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <div className="divide-y divide-border">
      {items.map((item) => (
        <ReportGroup
          key={item.sightingId}
          {...item}
          expanded={expandedId === item.sightingId}
          onToggleExpand={() =>
            setExpandedId((prev) => (prev === item.sightingId ? null : item.sightingId))
          }
        />
      ))}
    </div>
  );
}
