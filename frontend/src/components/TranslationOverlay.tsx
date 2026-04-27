interface Props {
  text: string | null;
  loading: boolean;
}

export function TranslationOverlay({ text, loading }: Props) {
  if (!text && !loading) return null;

  return (
    <div className="fixed bottom-28 left-1/2 -translate-x-1/2 z-50 max-w-lg w-full px-4">
      <div className="glass rounded-2xl px-6 py-4 text-center">
        {loading ? (
          <div className="flex items-center justify-center gap-2">
            <div className="w-2 h-2 rounded-full bg-primary animate-bounce [animation-delay:0ms]" />
            <div className="w-2 h-2 rounded-full bg-primary animate-bounce [animation-delay:150ms]" />
            <div className="w-2 h-2 rounded-full bg-primary animate-bounce [animation-delay:300ms]" />
            <span className="text-sm text-muted-foreground ml-2">Translating…</span>
          </div>
        ) : (
          <p className="text-foreground text-lg font-medium">{text}</p>
        )}
      </div>
    </div>
  );
}
