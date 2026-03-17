// Mirror of what your component expects for the form result
export type TicketType = {
  ticketTypeName: string;
  ticketTypeDescription: string;
  ticketTypePrice: string;
  ticketTypeQuantity: string;
};

export type EventDay = {
  dateTime: string; // ISO string after transform
  // startTime?: string; // (kept commented since original had it)
  // endTime: string; // ISO string after transform
};

export type CreateInPersonFormValues = {
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
};

// Small helper to allow passing translation function
export type TranslateFn = (key: string) => string;
