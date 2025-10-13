import dayjs from "dayjs";

export function checkWarrantyStatus(purchase, duration) {
  const purchaseDate = dayjs(purchase);

  const expiresDate = purchaseDate.add(duration, "month");

  const today = dayjs();

  const isExpired = expiresDate.isBefore(today);

  const remainingDays = expiresDate.diff(today, "day");

  const endDate = expiresDate.format("YYYY-MM-DD");

  const result = {
    status: isExpired ? "INACTIVE" : "ACTIVE",
    endDate: endDate,
    remainingDays: remainingDays >= 0 ? remainingDays : -remainingDays,
  };

  return result;
}
