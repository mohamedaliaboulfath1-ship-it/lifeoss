"use client";

import { cn } from "@/lib/utils";

interface FormatToolbarProps {
  onFormat: (cmd: string) => void;
  className?: string;
}

export function JournalFormatToolbar({ onFormat, className }: FormatToolbarProps) {
  const buttons = [
    { cmd: "bold", label: "B", title: "Ctrl+B" },
    { cmd: "italic", label: "I", title: "Ctrl+I" },
    { cmd: "underline", label: "U", title: "Ctrl+U" },
    { cmd: "strikeThrough", label: "S", title: "يتوسطه خط" },
    { cmd: "hiliteColor", label: "H", title: "تمييز", value: "#fbbf24" },
    { cmd: "code", label: "</>", title: "كود" },
  ];

  return (
    <div
      className={cn(
        "flex flex-wrap gap-1 p-1.5 rounded-lg border border-border/60 bg-surface2/50",
        className
      )}
    >
      {buttons.map((b) => (
        <button
          key={b.cmd}
          type="button"
          title={b.title}
          className="px-2 py-1 text-xs font-mono rounded hover:bg-gold/15 hover:text-gold2 transition-colors"
          onMouseDown={(e) => {
            e.preventDefault();
            onFormat(b.cmd);
          }}
        >
          {b.label}
        </button>
      ))}
    </div>
  );
}

export function applyRichFormat(cmd: string) {
  if (cmd === "code") {
    document.execCommand("fontName", false, "monospace");
    return;
  }
  if (cmd === "hiliteColor") {
    document.execCommand("hiliteColor", false, "#fbbf24");
    return;
  }
  document.execCommand(cmd, false);
}
