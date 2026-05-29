"use client";

import { useState } from "react";
import PendingCard, { type PendingCardProps } from "./pending-card";

type CardData = Omit<PendingCardProps, "expanded" | "onToggleExpand">;

export default function PendingList({ items }: { items: CardData[] }) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <div className="divide-y divide-border">
      {items.map((item) => (
        <PendingCard
          key={item.id}
          {...item}
          expanded={expandedId === item.id}
          onToggleExpand={() =>
            setExpandedId((prev) => (prev === item.id ? null : item.id))
          }
        />
      ))}
    </div>
  );
}
