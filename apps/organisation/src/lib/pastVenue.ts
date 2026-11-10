/** A place the club has played a match (GET /seasons/:org/venues). */
export type PastVenue = {
  address: string;
  city: string;
  state: string;
  country: string;
  location: { lat: number; lng: number } | null;
};
