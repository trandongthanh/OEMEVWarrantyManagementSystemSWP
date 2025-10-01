import dayjs from "dayjs";

export function checkWarrantyStatus(purchase, duration) {
  const purchaseDate = dayjs(purchase);

  const expiresDate = purchaseDate.add(duration, "month");

  const today = dayjs();

  const isExpired = expiresDate.isAfter(today);

  const remainingDays = expiresDate.diff(today, "day");

  const result = {
    status: isExpired,
    remainingDays: remainingDays > 0 ? remainingDays : -remainingDays,
  };

  return result;
}
