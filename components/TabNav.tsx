"use client";

export type TabType = "portfolio" | "hedges" | "risks" | "news" | "greeks";

interface TabNavProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

const TABS: { id: TabType; label: string }[] = [
  { id: "portfolio", label: "Portfolio" },
  { id: "hedges", label: "Hedges" },
  { id: "risks", label: "Risks" },
  { id: "news", label: "News" },
  { id: "greeks", label: "Greeks" },
];

export function TabNav({ activeTab, onTabChange }: TabNavProps) {
  return (
    <div className="flex gap-1 p-1 bg-secondary/50 rounded-lg w-fit">
      {TABS.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
            activeTab === tab.id
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
