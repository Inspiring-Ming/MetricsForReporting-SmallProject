import React from "react";

type TaskbarProps = {
  brand?: string;
  subtitle?: string;
  onChatBotClick?: () => void;
  onProfileClick?: () => void;
  className?: string;
};

export default function Taskbar({
  brand = "EcoM",
  subtitle = "ESG Report",
  onChatBotClick,
  onProfileClick,
  className = "",
}: TaskbarProps) {
  return (
    <header className={`sticky top-0 z-30 bg-slate-900 text-white ${className}`}>
      <div className="mx-auto max-w-7xl px-4 py-3 flex items-center gap-4">
        <div className="font-bold">{brand}</div>
        <div className="opacity-70">{subtitle}</div>
        <div className="ml-auto flex items-center gap-2">
          {/* <button
            className="px-3 py-1.5 text-sm bg-slate-800 hover:bg-slate-700 rounded-xl"
            onClick={onChatBotClick}
          >
            ChatBot
          </button> */}
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
