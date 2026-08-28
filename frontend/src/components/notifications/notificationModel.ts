export interface NotificationItem {
  _id: string;
  title: string;
  message: string;
  resourceType: string;
  resourceId: string;
  readAt: string | null;
}

export const notificationDestinations: Record<string, string> = {
  calendarEvents: '/calendar',
  progressReports: '/me',
  careTask: '/pt/care',
  careAlert: '/pt/care',
};

export function notificationDestination(resourceType: string): string | undefined {
  return notificationDestinations[resourceType];
}
