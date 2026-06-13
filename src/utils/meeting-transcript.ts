export interface SpeakerTranscriptBlock {
  id: string;
  label: string;
  text: string;
  timestamp: number;
  pending?: boolean;
}

export interface SpeakerTranscriptLine extends SpeakerTranscriptBlock {
  displayLabel: string;
}

function normalizeSpeakerLabel(label: string) {
  return String(label || '')
    .replace(/(提到|补充)$/, '')
    .trim();
}

function mergeTranscriptText(existingText: string, incomingText: string) {
  const current = String(existingText || '');
  const incoming = String(incomingText || '');
  if (!current) {
    return incoming;
  }
  if (!incoming) {
    return current;
  }
  if (incoming.startsWith(current)) {
    return incoming;
  }
  if (current.endsWith(incoming)) {
    return current;
  }

  const maxOverlap = Math.min(current.length, incoming.length);
  for (let overlap = maxOverlap; overlap > 0; overlap -= 1) {
    if (current.slice(-overlap) === incoming.slice(0, overlap)) {
      return `${current}${incoming.slice(overlap)}`;
    }
  }
  return `${current}${incoming}`;
}

export function buildSpeakerTranscriptLines(
  blocks: SpeakerTranscriptBlock[]
): SpeakerTranscriptLine[] {
  return blocks.reduce<SpeakerTranscriptLine[]>((lines, item) => {
    const displayLabel = normalizeSpeakerLabel(item.label);
    const existing = lines.find((line) => line.displayLabel === displayLabel);
    if (existing) {
      existing.text = mergeTranscriptText(existing.text, item.text);
      existing.pending = existing.pending || !!item.pending;
      existing.id = item.id;
      existing.timestamp = Math.max(existing.timestamp, item.timestamp);
      return lines;
    }
    lines.push({
      ...item,
      displayLabel,
      pending: !!item.pending,
    });
    return lines;
  }, []);
}
