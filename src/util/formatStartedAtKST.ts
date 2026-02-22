const kstFormatter = new Intl.DateTimeFormat('ko-KR', {
  timeZone: 'Asia/Seoul',
  month: 'numeric',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
});

/**
 * ISO date string → short KST string (e.g. "2/21 14:30")
 */
export function formatStartedAtKST(isoString: string): string {
  return kstFormatter.format(new Date(isoString));
}
