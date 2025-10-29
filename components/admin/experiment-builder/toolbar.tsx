"use client";

// ===== EXPERIMENT BUILDER TOOLBAR =====
// Barra de ferramentas principal do experiment builder

import React from "react";
import { ToolbarProps } from "./types";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Palette,
  Eye,
  Smartphone,
  Tablet,
  Monitor,
  Undo,
  Redo,
  Save,
  Play,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";

const VIEW_MODES = [
  { mode: "desktop" as const, icon: Monitor, label: "Desktop" },
  { mode: "tablet" as const, icon: Tablet, label: "Tablet" },
  { mode: "mobile" as const, icon: Smartphone, label: "Mobile" },
];

const MODES = [
  { mode: "design" as const, icon: Palette, label: "Design" },
  { mode: "preview" as const, icon: Eye, label: "Preview" },
];

export function Toolbar({
  mode,
  viewMode,
  onModeChange,
  onViewModeChange,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
}: ToolbarProps) {
  return (
    <div className="h-14 bg-white border-b border-gray-200 px-4 flex items-center justify-between">
      {/* Left side - Mode selection */}
      <div className="flex items-center gap-2">
        <div className="flex rounded-lg bg-gray-100 p-1">
          {MODES.map((modeOption) => (
            <Button
              key={modeOption.mode}
              variant={mode === modeOption.mode ? "default" : "ghost"}
              size="sm"
              onClick={() => onModeChange(modeOption.mode)}
              className={cn(
                "flex items-center gap-2",
                mode === modeOption.mode && "bg-white shadow-sm",
              )}
            >
              <modeOption.icon className="w-4 h-4" />
              {modeOption.label}
            </Button>
          ))}
        </div>

        <Separator orientation="vertical" className="h-6" />

        {/* View mode selection - only show in design mode */}
        {mode === "design" && (
          <div className="flex rounded-lg bg-gray-100 p-1">
            {VIEW_MODES.map((viewModeOption) => (
              <Button
                key={viewModeOption.mode}
                variant={viewMode === viewModeOption.mode ? "default" : "ghost"}
                size="sm"
                onClick={() => onViewModeChange(viewModeOption.mode)}
                className={cn(
                  "flex items-center gap-2",
                  viewMode === viewModeOption.mode && "bg-white shadow-sm",
                )}
              >
                <viewModeOption.icon className="w-4 h-4" />
                <span className="hidden sm:inline">{viewModeOption.label}</span>
              </Button>
            ))}
          </div>
        )}
      </div>

      {/* Center - Experiment info */}
      <div className="flex-1 flex justify-center">
        <div className="text-sm text-gray-600">
          {mode === "design"
            ? "Modo Design - Arraste elementos para criar variantes"
            : "Modo Preview - Visualize o resultado final"}
        </div>
      </div>

      {/* Right side - Actions */}
      <div className="flex items-center gap-2">
        {/* Undo/Redo */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onUndo}
          disabled={!canUndo}
          title="Desfazer (Ctrl+Z)"
        >
          <Undo className="w-4 h-4" />
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={onRedo}
          disabled={!canRedo}
          title="Refazer (Ctrl+Y)"
        >
          <Redo className="w-4 h-4" />
        </Button>

        <Separator orientation="vertical" className="h-6" />

        {/* Action buttons */}
        <Button variant="outline" size="sm" className="flex items-center gap-2">
          <Save className="w-4 h-4" />
          <span className="hidden sm:inline">Salvar Rascunho</span>
        </Button>

        <Button variant="default" size="sm" className="flex items-center gap-2">
          <Play className="w-4 h-4" />
          <span className="hidden sm:inline">Publicar Experimento</span>
        </Button>

        <Button variant="ghost" size="sm">
          <Settings className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

// Keyboard shortcuts hook
export function useKeyboardShortcuts(
  onUndo: () => void,
  onRedo: () => void,
  canUndo: boolean,
  canRedo: boolean,
) {
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case "z":
            if (e.shiftKey) {
              // Ctrl+Shift+Z = Redo
              e.preventDefault();
              if (canRedo) onRedo();
            } else {
              // Ctrl+Z = Undo
              e.preventDefault();
              if (canUndo) onUndo();
            }
            break;
          case "y":
            // Ctrl+Y = Redo
            e.preventDefault();
            if (canRedo) onRedo();
            break;
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onUndo, onRedo, canUndo, canRedo]);
}
