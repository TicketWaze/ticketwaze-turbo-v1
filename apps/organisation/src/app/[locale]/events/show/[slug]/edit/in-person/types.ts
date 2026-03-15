// Mirror of what your component expects for the form result
export type TicketType = {
  ticketTypeName: string;
  ticketTypeDescription: string;
  ticketTypePrice: string;
  ticketTypeQuantity: string;
};

export type EventDay = {
  dateTime: string; // ISO string after transform
};

export type EditInPersonFormValues = {
  eventName: string;
  eventDescription: string;
  address: string;
  state: string;
  city: string;
  country: string;
  longitude: string;
  latitude: string;
  eventImage: File;
  eventDays: EventDay[];
  ticketTypes: TicketType[];
  activityTags: string[];
  eventCurrency: string;
};

// Small helper to allow passing translation function
export type TranslateFn = (key: string) => string;
