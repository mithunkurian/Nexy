// Google Calendar API v3 — requires a free Google Cloud API key
// with "Google Calendar API" enabled, and the calendar must be public
// OR the calendar ID + API key from a service account.

export interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  allDay: boolean;
  location?: string;
  description?: string;
}

export async function fetchCalendarEvents(
  calendarId: string,
  apiKey: string,
): Promise<CalendarEvent[]> {
  try {
    const now = new Date().toISOString();
    const url =
      `https://www.googleapis.com/calendar/v3/calendars/` +
      `${encodeURIComponent(calendarId)}/events` +
      `?key=${apiKey}` +
      `&timeMin=${encodeURIComponent(now)}` +
      `&maxResults=5` +
      `&singleEvents=true` +
      `&orderBy=startTime`;

    const res = await fetch(url);
    if (!res.ok) return [];

    const data = await res.json();
    const items: {
      id: string;
      summary?: string;
      location?: string;
      description?: string;
      start: { dateTime?: string; date?: string };
      end:   { dateTime?: string; date?: string };
    }[] = data.items ?? [];

    return items.map((item) => {
      const allDay = !item.start.dateTime;
      const start = new Date(item.start.dateTime ?? item.start.date ?? "");
      const end   = new Date(item.end.dateTime   ?? item.end.date   ?? "");
      return {
        id: item.id,
        title: item.summary ?? "(No title)",
        start,
        end,
        allDay,
        location: item.location,
        description: item.description,
      };
    });
  } catch {
    return [];
  }
}

/** Format a CalendarEvent start time as a readable string */
export function formatEventTime(event: CalendarEvent): string {
  if (event.allDay) return "All day";
  const now = new Date();
  const isToday = event.start.toDateString() === now.toDateString();
  const isTomorrow =
    event.start.toDateString() ===
    new Date(now.getTime() + 86_400_000).toDateString();

  const timeStr = event.start.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  });

  if (isToday)    return `Today ${timeStr}`;
  if (isTomorrow) return `Tomorrow ${timeStr}`;

  return event.start.toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
  }) + ` ${timeStr}`;
}
