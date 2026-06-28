export type BinType = "food" | "garden" | "recycling" | "refuse" | "other";

export interface BinMeta {
  accent: string;
  chip: string;
  dot: string;
  label: string;
}

export const BIN_META: Record<BinType, BinMeta> = {
  refuse: {
    accent: "border-amber-700",
    chip: "bg-amber-100 text-amber-900",
    dot: "bg-amber-600",
    label: "General Refuse",
  },
  recycling: {
    accent: "border-blue-600",
    chip: "bg-blue-100 text-blue-900",
    dot: "bg-blue-500",
    label: "Recycling",
  },
  garden: {
    accent: "border-green-600",
    chip: "bg-green-100 text-green-900",
    dot: "bg-green-500",
    label: "Garden Waste",
  },
  food: {
    accent: "border-orange-500",
    chip: "bg-orange-100 text-orange-900",
    dot: "bg-orange-500",
    label: "Food Waste",
  },
  other: {
    accent: "border-slate-400",
    chip: "bg-slate-100 text-slate-600",
    dot: "bg-slate-400",
    label: "Other",
  },
};
