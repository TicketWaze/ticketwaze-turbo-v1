export type TicketType = {
  ticketTypeName: string;
  ticketTypeDescription: string;
  ticketTypePrice: string;
  ticketTypeQuantity: string;
};

export type EventDay = {
  dateTime: string; // ISO string after transform
};

export type CreateMeetFormValues = {
  eventName: string;
  eventDescription: string;
  eventTagId: string;
  eventImage: File;
  eventDays: EventDay[];
  ticketTypes: TicketType[];
  eventCurrency: string;
};

// Small helper to allow passing translation function
export type TranslateFn = (key: string) => string;
