// Mirror of what your component expects for the form result
export type TicketType = {
  ticketTypeName: string;
  ticketTypeDescription: string;
  ticketTypePrice: string;
  ticketTypeQuantity: string;
  /**
   * Is this tier given away?
   *
   * Form-only, and READ-ONLY on this form: whether a tier is free is settled
   * when the activity is created and the API refuses a flip afterwards. It is
   * derived from the stored price here purely so a free tier renders the way it
   * does on the create form instead of showing an editable price of 0.
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

export type EditInPersonFormValues = {
  eventName: string;
  eventDescription: string;
  address: string;
  state: string;
  city: string;
  country: string;
  location: { lat: number; lng: number };
  eventImage: File;
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
