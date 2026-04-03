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
    return { label: "QUÁ HẠN", color: "red", urgencyStr: "QUÁ HẠN" };
  } else if (deadlineDate.getTime() === now.getTime()) {
    return { label: "HÔM NAY", color: "red", urgencyStr: "HÔM NAY" };
  } else if (deadlineDate.getTime() === tomorrow.getTime()) {
    return { label: "NGÀY MAI", color: "orange", urgencyStr: "NGÀY MAI" };
  } else if (deadlineDate <= threeDaysFromNow) {
    return { label: "TRONG 3 NGÀY", color: "yellow", urgencyStr: "TRONG 3 NGÀY" };
  }

  return { label: "SẮP TỚI", color: "slate", urgencyStr: "SẮP TỚI" };
}
