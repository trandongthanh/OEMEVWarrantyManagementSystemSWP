import dayjs from "dayjs";

export function validateVehicleDatesWithDayjs(
  purchaseDateStr,
  dateOfManufactureStr
) {
  const purchaseDate = dayjs(purchaseDateStr);
  const dateOfManufacture = dayjs(dateOfManufactureStr);

  if (!purchaseDate.isValid || !dateOfManufacture.isValid) {
    return false;
  }

  return (
    purchaseDate.isAfter(dateOfManufacture) ||
    purchaseDate.isSame(dateOfManufacture)
  );
}
