export function getTimeAgo(dateStr: string, long = false): string {
  const now = new Date();
  const date = new Date(dateStr);
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (!long) {
    if (seconds < 60) return "just now";
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d`;
    return date.toLocaleDateString();
  }

  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (seconds < 3600) return `${minutes} ${minutes === 1 ? "minute" : "minutes"} ago`;
  const hours = Math.floor(seconds / 3600);
  if (seconds < 86400) return `${hours} ${hours === 1 ? "hour" : "hours"} ago`;
  const days = Math.floor(seconds / 86400);
  if (seconds < 604800) return `${days} ${days === 1 ? "day" : "days"} ago`;
  const weeks = Math.floor(seconds / 604800);
  if (seconds < 2592000) return `${weeks} ${weeks === 1 ? "week" : "weeks"} ago`;
  return date.toLocaleDateString();
}
