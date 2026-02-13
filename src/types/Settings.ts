export interface NotificationSettings {
    enabled: boolean;
    frequency: 'off' | 'due-only' | 'urgent-due' | '3-day' | '5-day';
}

export interface AppSettings {
    notifications: NotificationSettings;
}
