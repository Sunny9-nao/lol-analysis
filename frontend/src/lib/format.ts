export function formatMatchTime(dateStr?: string | null): { relative: string; absolute: string } {
  if (!dateStr) return { relative: "", absolute: "" };
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);

  let relative = "";
  if (diffHours < 1) {
    const diffMins = Math.max(1, Math.floor(diffMs / (1000 * 60)));
    relative = `${diffMins}分前`;
  } else if (diffHours < 24) {
    relative = `${diffHours}時間前`;
  } else if (diffDays === 1) {
    relative = "昨日";
  } else {
    relative = `${diffDays}日前`;
  }

  const absolute = `${date.getMonth() + 1}/${date.getDate()} ${date.getHours().toString().padStart(2, "0")}:${date.getMinutes().toString().padStart(2, "0")}`;
  return { relative, absolute };
}

export interface PurchaseGroup {
  timeLabel: string;
  itemIds: number[];
}

export function groupEarlyItems(
  earlyItems?: { timestamp: string; itemId: number }[] | null
): PurchaseGroup[] {
  if (!earlyItems || earlyItems.length === 0) return [];

  const groups: PurchaseGroup[] = [];

  for (const item of earlyItems) {
    const [minStr, secStr] = item.timestamp.split(":");
    const min = parseInt(minStr, 10) || 0;
    const sec = parseInt(secStr, 10) || 0;
    const totalSec = min * 60 + sec;

    // ゲーム開始時（1分30秒未満）の初期買い物は「開始」にまとめる
    const isStart = totalSec < 90;
    const timeLabel = isStart ? "開始" : `${min}分`;

    const lastGroup = groups[groups.length - 1];
    // 同じ分、または開始アイテム同士であれば同じグループにまとめる
    if (lastGroup && (lastGroup.timeLabel === timeLabel || (isStart && lastGroup.timeLabel === "開始"))) {
      lastGroup.itemIds.push(item.itemId);
    } else {
      groups.push({
        timeLabel,
        itemIds: [item.itemId],
      });
    }
  }

  return groups;
}
