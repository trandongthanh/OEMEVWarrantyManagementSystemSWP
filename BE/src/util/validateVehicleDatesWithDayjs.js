import dayjs from "dayjs";

export function validateVehicleDatesWithDayjs(
  purchaseDateStr,
  dateOfManufactureStr
) {
  const purchaseDate = dayjs(purchaseDateStr);
  const dateOfManufacture = dayjs(dateOfManufactureStr);

  if (!purchaseDate.isValid() || !dateOfManufacture.isValid()) {
    return false;
  }

  const today = dayjs();

  if (purchaseDate.isBefore(dateOfManufacture)) {
    return {
      valid: false,
      error: "Purchase date cannot be before manufacture date",
    };
  }

  if (purchaseDate.isAfter(today)) {
    return { valid: false, error: "Purchase date cannot be in the future" };
  }

  return { valid: true };
}
