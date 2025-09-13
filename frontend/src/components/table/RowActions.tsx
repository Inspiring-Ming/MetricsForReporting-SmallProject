// src/components/table/RowActions.tsx
import React from "react";

type Props = {
  canCalculate: boolean;
  onCalculate: () => void;
  canShowDetails: boolean;
  onShowDetails: () => void;
  calculating: boolean;
};

export default function RowActions({
  canCalculate,
  onCalculate,
  canShowDetails,
  onShowDetails,
  calculating,
}: Props) {
  return (
    <div className="flex items-center justify-end gap-2">
      <button
        className="px-3 py-1.5 rounded-xl bg-slate-800 text-white text-sm shadow hover:bg-slate-700 disabled:opacity-40"
        onClick={onCalculate}
        disabled={!canCalculate}
      >
        {calculating ? "..." : "Calculate"}
      </button>
      <button
        className="px-3 py-1.5 rounded-xl border text-sm hover:bg-slate-50 disabled:opacity-40"
        onClick={onShowDetails}
        disabled={!canShowDetails}
      >
        Details
      </button>
    </div>
  );
}
