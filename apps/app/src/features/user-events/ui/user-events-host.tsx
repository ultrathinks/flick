import { useUserEvents } from "../model/use-user-events.ts";

export const UserEventsHost = () => {
  useUserEvents();
  return null;
};
