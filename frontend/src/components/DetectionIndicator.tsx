interface Props {
  visible: boolean;
}

export function DetectionIndicator({ visible }: Props) {
  if (!visible) return null;
  return (
    <div className="fixed top-6 left-6 z-50 flex items-center gap-2 animate-pulse-glow">
      <div className="w-3 h-3 rounded-full bg-primary glow-dot" />
      <span className="text-xs font-medium text-primary tracking-wide uppercase">
        Hands Detected
      </span>
    </div>
  );
}
