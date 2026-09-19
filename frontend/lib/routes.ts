export const ROUTES = {
  HOME: "/",
  PLAN: "/plan",
  TRIPS: "/trips",
  EXPLORE: "/explore",
  TRIP: (id: string) => `/trips/${encodeURIComponent(id)}`
} as const;

export const TRIP_SECTIONS = [
  ["Overview", "overview"],
  ["Itinerary", "itinerary"],
  ["Flights", "flights"],
  ["Stay", "stay"],
  ["Weather", "weather"],
  ["Budget", "budget"],
  ["Tips", "tips"]
] as const;
