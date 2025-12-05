/**
 * Searchable fields for booking queries
 */
export const bookingSearchableFields: string[] = [];

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
