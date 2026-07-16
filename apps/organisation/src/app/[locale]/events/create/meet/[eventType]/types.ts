// Mirror of what your component expects for the form result
export type TicketType = {
  ticketTypeName: string;
  ticketTypeDescription: string;
  ticketTypePrice: string;
  ticketTypeQuantity: string;
};
export type EventDay = {
  dayNumber: number;
  eventDate: string; // "YYYY-MM-DD"
  startTime: string; // "HH:MM"
  endTime: string; // "HH:MM"
  timezone: string;
};

export type CreateMeetFormValues = {
  eventName: string;
  eventDescription: string;
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
