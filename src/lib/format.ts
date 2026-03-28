export function formatRelativeWindow(input: string) {
  const timestamp = new Date(input).getTime();
  const diffMinutes = Math.round((Date.now() - timestamp) / 60000);

  if (diffMinutes < 60) {
    return `${diffMinutes}m ago`;
  }

  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) {
    return `${diffHours}h ago`;
  }

  const diffDays = Math.round(diffHours / 24);
  return `${diffDays}d ago`;
}

export function formatPercent(value: number) {
  return `${value.toFixed(0)}%`;
}

export function formatCompactNumber(value: number) {
  return new Intl.NumberFormat("en", { notation: "compact" }).format(value);
}
