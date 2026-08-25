// Mirror of what your component expects for the form result
export type TicketType = {
  ticketTypeName: string;
  ticketTypeDescription: string;
  ticketTypePrice: string;
  ticketTypeQuantity: string;
  /**
   * Is this tier given away?
   *
   * Form-only. What reaches the API is a price of 0 — that is the single source
   * of truth server-side, and there is no `is_free` column on a ticket type.
   * The flag exists here because a checkbox needs somewhere to live while the
   * price input is hidden, and because an empty price string is ambiguous
   * (untouched or deliberately free?) until the organiser has said which.
   */
  isFree: boolean;
};
export type EventDay = {
  dayNumber: number;
  eventDate: string; // "YYYY-MM-DD"
  startTime: string; // "HH:MM"
  endTime: string; // "HH:MM"
  timezone: string;
};

export type CreateInPersonFormValues = {
  eventName: string;
  eventDescription: string;
  address: string;
  state: string;
  city: string;
  country: string;
  location: { lat: number; lng: number };
  // Absent while the form is being filled, and absent for good when publishing
  // a teaser that keeps the cover image it already has.
  eventImage?: File;
  eventDays: EventDay[];
  activityTags: string[];
  ticketTypes: TicketType[];
  eventCurrency: string;
  isFree: boolean;
  ticketSalesEndAt?: string;
};

// Small helper to allow passing translation function
export type TranslateFn = (
  key: string,
  values?: Record<string, string | number>,
) => string;
