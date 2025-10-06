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

  return (
    purchaseDate.isAfter(dateOfManufacture) ||
    purchaseDate.isAfter(today) ||
    purchaseDate.isSame(dateOfManufacture) ||
    purchaseDate.isSame(today)
  );
}
