/**
 * Searchable fields for booking queries
 */
export const bookingSearchableFields: string[] = ["title", "city"];
// export const bookingSearchableFields: string[] = [
//   "travelId.title",
//   "travelId.destination.city",
// ];

/**
 * Filterable fields for booking queries
 */
export const bookingFilterableFields: string[] = [
  "bookingStatus",
  "paymentStatus",
  "userId",
  "travelId",
];

/**
 * Sortable fields for booking queries
 */
export const bookingSortableFields: string[] = [
  "createdAt",
  "updatedAt",
  "amount",
  "totalPeople",
];
