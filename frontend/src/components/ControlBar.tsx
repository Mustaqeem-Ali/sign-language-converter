import { Button } from "@/components/ui/button";
import { Shield, ShieldOff, Zap, Hand } from "lucide-react";

interface Props {
  mode: "auto" | "manual";
  onToggleMode: () => void;
  armed: boolean;
  onToggleArm: () => void;
  isRecording: boolean;
}

export function ControlBar({ mode, onToggleMode, armed, onToggleArm, isRecording }: Props) {
  return (
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50">
      <div className="glass rounded-full px-6 py-3 flex items-center gap-3">
        {/* Mode toggle */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggleMode}
          className="rounded-full text-foreground hover:bg-secondary gap-2"
        >
          {mode === "auto" ? <Zap className="w-4 h-4" /> : <Hand className="w-4 h-4" />}
          <span className="text-sm font-medium">
            {mode === "auto" ? "Automatic" : "Manual"}
          </span>
        </Button>

        {/* Divider */}
        {mode === "manual" && (
          <div className="w-px h-6 bg-muted-foreground/30" />
        )}

        {/* Arm/Disarm button (manual only) */}
        {mode === "manual" && (
          <Button
            variant={armed ? "default" : "ghost"}
            size="sm"
            onClick={onToggleArm}
            className={`rounded-full gap-2 ${
              armed
                ? "bg-primary text-primary-foreground hover:bg-primary/90"
                : "text-foreground hover:bg-secondary"
            }`}
          >
            {armed ? <ShieldOff className="w-4 h-4" /> : <Shield className="w-4 h-4" />}
            <span className="text-sm font-medium">
              {armed ? "Disarm" : "Arm Camera"}
            </span>
          </Button>
        )}

        {/* Recording indicator */}
        {isRecording && (
          <>
            <div className="w-px h-6 bg-muted-foreground/30" />
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-destructive animate-pulse" />
              <span className="text-xs font-medium text-destructive">REC</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
