export async function requestNotificationPermissionIfDefault(): Promise<void> {
  if (typeof Notification === 'undefined') return;
  if (Notification.permission !== 'default') return;
  try {
    await Notification.requestPermission();
  } catch {}
}
