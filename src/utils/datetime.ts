export function normalizeTimestampValue(value: unknown): number | undefined {
  if (value == null || value === '') {
    return undefined;
  }

  if (value instanceof Date) {
    const timestamp = value.getTime();
    return Number.isNaN(timestamp) ? undefined : timestamp;
  }

  if (typeof value === 'number') {
    if (!Number.isFinite(value)) {
      return undefined;
    }
    return value < 1e12 ? value * 1000 : value;
  }

  const text = String(value).trim();
  if (!text) {
    return undefined;
  }

  if (/^\d+$/.test(text)) {
    const timestamp = Number(text);
    if (!Number.isFinite(timestamp)) {
      return undefined;
    }
    return timestamp < 1e12 ? timestamp * 1000 : timestamp;
  }

  const date = new Date(text);
  const timestamp = date.getTime();
  return Number.isNaN(timestamp) ? undefined : timestamp;
}

export function formatTimestampText(
  value: unknown,
  options?: { dateOnly?: boolean }
) {
  const timestamp = normalizeTimestampValue(value);
  if (timestamp == null) {
    return '--';
  }

  const date = new Date(timestamp);
  const pad = (num: number) => String(num).padStart(2, '0');
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());

  if (options?.dateOnly) {
    return `${year}-${month}-${day}`;
  }

  const hour = pad(date.getHours());
  const minute = pad(date.getMinutes());
  const second = pad(date.getSeconds());
  return `${year}-${month}-${day} ${hour}:${minute}:${second}`;
}
