// function calculateExpiationDates({ vehicle }) {
//   const purchaseDate = vehicle.purchaseDate;

//   const manPolicy = vehicle.model.mainPolicy;

//   const componentsWithExpiration = vehicle.model.typeComponents.map(
//     (component) => {
//       const policy = component.specificPolicy || manPolicy;

//       const expirationDate = new Date(purchaseDate);
//       expirationDate.setMonth(expirationDate.getMonth() + policy.durationYear);

//       return {
//         name: component.name,
//         warranty_expires_at: expirationDate.toISOString(),
//       };
//     }
//   );

//   return componentsWithExpiration;
// }

function calculateExpiationDates({ vehicle }) {
  const purchaseDate = new Date(vehicle.purchaseDate);

  const mainPolicy = vehicle.model.mainPolicy;

  const componentsWithExpiration = vehicle.model.typeComponents.map(
    (typeComponent) => {
      const policy = typeComponent.specificPolicy || mainPolicy;

      const expirationDate = new Date(purchaseDate);

      expirationDate.setMonth(purchaseDate.getMonth() + policy.durationMonth);

      return {
        name: typeComponent.name,
        warranty_expires_at: expirationDate.toISOString(),
      };
    }
  );

  return componentsWithExpiration;
}

module.exports = {
  calculateExpiationDates,
};
