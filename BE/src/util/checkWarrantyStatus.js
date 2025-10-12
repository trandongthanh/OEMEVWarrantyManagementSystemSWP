import dayjs from "dayjs";

export function checkWarrantyStatus(purchase, duration) {
  const purchaseDate = dayjs(purchase);

  const expiresDate = purchaseDate.add(duration, "month");

  const today = dayjs();

  const isExpired = today.isAfter(expiresDate);

  const remainingDays = expiresDate.diff(today, "day");

  const endDate = expiresDate.format("YYYY-MM-DD");

  const result = {
    status: isExpired ? "ACTIVE" : "INACTIVE",
    endDate: endDate,
    remainingDays: remainingDays > 0 ? remainingDays : -remainingDays,
  };

  return result;
}
