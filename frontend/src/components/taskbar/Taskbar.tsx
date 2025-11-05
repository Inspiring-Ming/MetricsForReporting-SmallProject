import React from "react";

type TaskbarProps = {
  brand?: string;
  subtitle?: string;
  onUploadClick?: () => void;
  onProfileClick?: () => void;
  className?: string;
};

export default function Taskbar({
  brand = "EcoM",
  subtitle = "ESG Report",
  onUploadClick,
  onProfileClick,
  className = "",
}: TaskbarProps) {
  return (
    <header className={`sticky top-0 z-30 bg-slate-900 text-white ${className}`}>
      <div className="mx-auto max-w-7xl px-4 py-3 flex items-center gap-4">
        <div className="font-bold">{brand}</div>
        <div className="opacity-70">{subtitle}</div>
        <div className="ml-auto flex items-center gap-2">
          <button
            className="px-3 py-1.5 text-sm bg-slate-800 hover:bg-slate-700 rounded-xl flex items-center gap-1.5"
            onClick={onUploadClick}
          >
            <svg
              className="h-4 w-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5" />
              <path d="M7.5 7.5 12 3l4.5 4.5M12 3v12.75" />
            </svg>
            <span>Upload</span>
          </button>
          <button
            className="px-3 py-1.5 text-sm bg-slate-800 hover:bg-slate-700 rounded-xl"
            onClick={onProfileClick}
          >
            Profile
          </button>
        </div>
      </div>
    </header>
  );
}
