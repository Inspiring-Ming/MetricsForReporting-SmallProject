// --- Types ---
export type CategoryKey = string;

export type CalcRow = {
  category: CategoryKey;
  dateRange?: string;
  metric?: string;
  model?: string;
  status: "Not calculated" | "Calculating..." | "Success" | "Failed";
  value?: string;
};
