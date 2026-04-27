import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Props {
  voices: { id: string; gender: string }[];
  selectedVoice: string;
  onSelect: (id: string) => void;
  loading: boolean;
}

export function VoiceSelector({ voices, selectedVoice, onSelect, loading }: Props) {
  return (
    <div className="fixed top-6 right-6 z-50">
      <Select value={selectedVoice} onValueChange={onSelect} disabled={loading}>
        <SelectTrigger className="w-48 glass border-0 text-foreground">
          <SelectValue placeholder={loading ? "Loading voices…" : "Select voice"} />
        </SelectTrigger>
        <SelectContent className="glass border-0">
          {(voices || []).map((v) => (
            <SelectItem key={v.id} value={v.id} className="text-foreground">
              {v.id}, {v.gender}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
