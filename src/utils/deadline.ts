export interface DeadlineStatus {
  label: string;
  color: "red" | "orange" | "yellow" | "slate" | "blue";
  urgencyStr: string;
}

export function getDeadlineStatus(deadline: string | null | Date): DeadlineStatus {
  if (!deadline) {
    return { label: "NO DEADLINE", color: "slate", urgencyStr: "NONE" };
  }

  const deadlineDate = new Date(deadline);
  // Reset hours to 0 for accurate day comparisons regardless of time
  deadlineDate.setHours(0, 0, 0, 0);

  const now = new Date();
  now.setHours(0, 0, 0, 0);

  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);

  const threeDaysFromNow = new Date(now);
  threeDaysFromNow.setDate(now.getDate() + 3);

  if (deadlineDate < now) {
    return { label: "OVERDUE", color: "red", urgencyStr: "OVERDUE" };
  } else if (deadlineDate.getTime() === now.getTime()) {
    return { label: "DUE TODAY", color: "red", urgencyStr: "DUE TODAY" };
  } else if (deadlineDate.getTime() === tomorrow.getTime()) {
    return { label: "DUE TOMORROW", color: "orange", urgencyStr: "DUE TOMORROW" };
  } else if (deadlineDate <= threeDaysFromNow) {
    return { label: "IN 3 DAYS", color: "yellow", urgencyStr: "IN 3 DAYS" };
  }

  return { label: "UPCOMING", color: "slate", urgencyStr: "UPCOMING" };
}
