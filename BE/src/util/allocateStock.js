export function allocateStock({ stocks, quantity }) {
  const singleStockSource = stocks.find(
    (stock) => stock.quantityAvailable >= quantity
  );

  if (singleStockSource) {
    return [{ stockId: singleStockSource.stockId, quantity: quantity }];
  }

  let quantityNeed = quantity;
  const reservations = [];
  for (const stock of stocks) {
    const quantityCantake = Math.min(quantityNeed, stock.quantityAvailable);

    if (quantityCantake) {
      reservations.push({
        stockId: stock.stockId,
        quantity: quantityCantake,
      });

      quantityNeed -= quantityCantake;
    }

    if (quantityNeed <= 0) {
      return reservations;
    }
  }

  return reservations;
}
