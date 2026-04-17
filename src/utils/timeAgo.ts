/**
 * Compact relative time formatter.
 * Returns: "now", "30s", "5m", "3h", "2d", "1w", "8w", "1y", "3y"
 * Months are converted to weeks (4w = ~1 month) to avoid clash with "m" (minutes).
 */
export function formatTimeAgo(dateString: string): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    const diffWeeks = Math.floor(diffDays / 7);
    const diffYears = Math.floor(diffDays / 365);

    if (diffSecs < 60) return diffSecs <= 5 ? 'now' : `${diffSecs}s`;
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}d`;
    if (diffYears < 1) return `${diffWeeks}w`;
    return `${diffYears}y`;
}
