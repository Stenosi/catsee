"use client";

import { useState } from "react";
import UserReportGroup, { type UserReportGroupProps } from "./user-report-group";

type CardData = Omit<UserReportGroupProps, "expanded" | "onToggleExpand">;

export default function UserReportList({ items }: { items: CardData[] }) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <div className="divide-y divide-border">
      {items.map((item) => (
        <UserReportGroup
          key={item.reportedUserId}
          {...item}
          expanded={expandedId === item.reportedUserId}
          onToggleExpand={() =>
            setExpandedId((prev) => (prev === item.reportedUserId ? null : item.reportedUserId))
          }
        />
      ))}
    </div>
  );
}
