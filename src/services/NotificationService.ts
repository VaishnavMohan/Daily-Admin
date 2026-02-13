import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import Colors from '../constants/Colors';

// Configure global handler
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
    }),
});

export const NotificationService = {
    async registerForPushNotificationsAsync() {
        if (Platform.OS === 'android') {
            await Notifications.setNotificationChannelAsync('default', {
                name: 'Default',
                importance: Notifications.AndroidImportance.MAX,
                vibrationPattern: [0, 250, 250, 250],
                lightColor: Colors.dark.primary,
            });
        }

        if (Device.isDevice) {
            const { status: existingStatus } = await Notifications.getPermissionsAsync();
            let finalStatus = existingStatus;
            if (existingStatus !== 'granted') {
                const { status } = await Notifications.requestPermissionsAsync();
                finalStatus = status;
            }
            if (finalStatus !== 'granted') {
                console.log('Permission not granted for notifications');
                return;
            }
        }
    },

    async scheduleReminder(title: string, body: string, triggerDate: Date) {
        const now = new Date();

        // Verbose Logging - ENABLED FOR DEBUG
        console.log(`[Notification] Attempting: "${title}"`);
        console.log(`   Trigger (Local): ${triggerDate.toLocaleString()}`);
        console.log(`   Trigger (ISO):   ${triggerDate.toISOString()}`);
        console.log(`   Now (Local):     ${now.toLocaleString()}`);

        // Strict Check: Must be > 1 minute in future
        if (triggerDate.getTime() <= now.getTime() + 60000) {
            console.log(`[Notification] SKIPPED: Past/Immediate. Diff: ${(triggerDate.getTime() - now.getTime()) / 1000}s`);
            return;
        }

        await Notifications.scheduleNotificationAsync({
            content: {
                title,
                body,
                sound: 'default',
                color: Colors.dark.primary,
            },
            trigger: {
                date: triggerDate,
            } as any,
        });

        console.log(`[Notification] SCHEDULED: "${title}" for ${triggerDate.toLocaleString()}`);
    },

    /**
     * Smart notification scheduler - adapts based on task frequency
     * - Daily tasks: notify at specific times (8 AM, 8 PM)
     * - Weekly tasks: notify 1 day before
     * - Monthly tasks: notify 3 days + 1 day before (if settings allow)
     */
    async scheduleCardReminders(
        bankName: string,
        cardName: string,
        dueDate: Date,
        settings?: any,
        recurrenceFreq?: string,
        taskCategory?: string
    ) {
        console.log('[Smart Notification] Task:', bankName, 'Freq:', recurrenceFreq, 'Category:', taskCategory);
        console.log('[Notification] Settings received:', JSON.stringify(settings));

        // CRITICAL: If settings not provided or malformed, DON'T schedule
        if (!settings || !settings.notifications) {
            console.log('[Notification] BLOCKED - No settings provided');
            return;
        }

        // Check if notifications are disabled
        if (settings.notifications.enabled === false || settings.notifications.frequency === 'off') {
            console.log('[Notification] BLOCKED - Disabled by user (enabled:', settings.notifications.enabled, 'frequency:', settings.notifications.frequency, ')');
            return;
        }

        // DEV MODE: Skip in Expo Go to prevent immediate test notification firing
        if (__DEV__) {
            console.log('[Notification] ⚠️  DEV MODE: Skipping (Expo Go limitation)');
            console.log('[Notification] ✅  Would schedule for:', dueDate.toLocaleDateString());
            return;
        }

        const freq = recurrenceFreq || 'monthly'; // Default to monthly for backward compatibility

        // ========== DAILY TASKS (Medicine, Habits) ==========
        if (freq === 'daily') {
            console.log('[Smart Notification] 💊 Daily task - scheduling time-based notifications');

            // Morning notification (8 AM)
            const morningNotif = new Date();
            morningNotif.setHours(8, 0, 0, 0);
            if (morningNotif <= new Date()) {
                morningNotif.setDate(morningNotif.getDate() + 1);
            }
            await this.scheduleReminder(
                `💊 ${bankName}`,
                `Time to take your ${cardName}`,
                morningNotif
            );

            // Evening notification (8 PM)
            const eveningNotif = new Date();
            eveningNotif.setHours(20, 0, 0, 0);
            if (eveningNotif <= new Date()) {
                eveningNotif.setDate(eveningNotif.getDate() + 1);
            }
            await this.scheduleReminder(
                `💊 ${bankName}`,
                `Evening reminder: ${cardName}`,
                eveningNotif
            );

            console.log('[Smart Notification] ✅ Scheduled daily reminders at 8 AM and 8 PM');
            return;
        }

        // ========== WEEKLY TASKS (Assignments, Meetings) ==========
        if (freq === 'weekly') {
            console.log('[Smart Notification] 📚 Weekly task - scheduling 1 day before');

            // 1 day before at 9 AM
            const oneDayBefore = new Date(dueDate);
            oneDayBefore.setDate(dueDate.getDate() - 1);
            oneDayBefore.setHours(9, 0, 0, 0);

            await this.scheduleReminder(
                `📚 ${bankName}`,
                `Due tomorrow: ${cardName}`,
                oneDayBefore
            );

            console.log('[Smart Notification] ✅ Scheduled 1-day reminder for weekly task');
            return;
        }

        // ========== MONTHLY/YEARLY TASKS (Bills, Rent) - Use user preferences ==========
        console.log('[Smart Notification] 💳 Monthly/Yearly task - using user preferences');
        if (__DEV__) {
            console.log('[Notification] ⚠️  DEV MODE: Skipping (Expo Go limitation)');
            console.log('[Notification] ✅  Would schedule for:', dueDate.toLocaleDateString());
            return;
        }

        const frequency = settings.notifications.frequency;
        console.log('[Notification] Proceeding with frequency:', frequency);
        console.log('[Notification] Due Date received:', dueDate.toLocaleString(), '(should be midnight)');

        // Helper to get fresh date copy
        const getTrigger = (daysBefore: number, hour: number) => {
            const d = new Date(dueDate); // Clone
            d.setDate(d.getDate() - daysBefore); // Subtract days
            d.setHours(hour, 0, 0, 0); // Set hour
            console.log(`[Notification] getTrigger(${daysBefore} days, ${hour}h) = ${d.toLocaleString()}`);
            return d;
        };

        // Schedule based on user preference
        if (frequency === '5-day') {
            await this.scheduleReminder(`Reminder: ${bankName} Due in 5 Days`, `Your ${cardName} bill is due in 5 days`, getTrigger(5, 10));
            await this.scheduleReminder(`Reminder: ${bankName} Due in 3 Days`, `Your ${cardName} bill is due in 3 days`, getTrigger(3, 10));
            await this.scheduleReminder(`Urgent: Pay ${bankName} Tomorrow`, `Due tomorrow! Avoid late fees.`, getTrigger(1, 11));
            await this.scheduleReminder(`Due Today: ${bankName}`, `Please pay your ${cardName} bill today!`, getTrigger(0, 9));
        } else if (frequency === '3-day') {
            await this.scheduleReminder(`Reminder: ${bankName} Due in 3 Days`, `Your ${cardName} bill is due in 3 days`, getTrigger(3, 10));
            await this.scheduleReminder(`Urgent: Pay ${bankName} Tomorrow`, `Due tomorrow! Avoid late fees.`, getTrigger(1, 11));
            await this.scheduleReminder(`Due Today: ${bankName}`, `Please pay your ${cardName} bill today!`, getTrigger(0, 9));
        } else if (frequency === 'urgent-due') {
            console.log('[Notification] Scheduling URGENT notification (1 day before at 11 AM)');
            // 1 Day Before
            await this.scheduleReminder(
                `Urgent: Pay ${bankName} Tomorrow`,
                `Due tomorrow! Avoid late fees.`,
                getTrigger(1, 11)
            );
        }

        // Always schedule "Due Today" for 'due-only' and 'urgent-due'
        if (frequency === 'due-only' || frequency === 'urgent-due') {
            console.log('[Notification] Scheduling DUE DATE notification (due date at 9 AM)');
            await this.scheduleReminder(
                `Due Today: ${bankName}`,
                `Please pay your ${cardName} bill today!`,
                getTrigger(0, 9)
            );
        }
    },

    async cancelAll() {
        await Notifications.cancelAllScheduledNotificationsAsync();
        console.log("[Notification] Cancelled All");
    },

    async rescheduleAll(cards: any[], settings?: any) {
        await this.cancelAll();
        console.log(`[Notification] Rescheduling for ${cards.length} cards...`);

        // Check if notifications are disabled
        if (!settings?.notifications?.enabled || settings?.notifications?.frequency === 'off') {
            console.log('[Notification] All notifications disabled by user');
            return;
        }

        for (const card of cards) {
            if (card.isPaid) continue;

            // Safe Check
            if (!card.nextDueDate || typeof card.nextDueDate !== 'string') {
                console.log("[Notification] Skipping invalid card:", card.name);
                continue;
            }

            // Strict Parsing: YYYY-MM-DD -> Local Date
            const parts = card.nextDueDate.split('-');
            if (parts.length !== 3) continue;

            const y = parseInt(parts[0], 10);
            const m = parseInt(parts[1], 10) - 1; // Month 0-indexed
            const d = parseInt(parts[2], 10);

            const dueDate = new Date(y, m, d, 0, 0, 0, 0); // Local Midnight

            console.log(`[Notification] Card: ${card.bank} ${card.name}`);
            console.log(`[Notification]   nextDueDate (ISO): ${card.nextDueDate}`);
            console.log(`[Notification]   Parsed as: ${dueDate.toLocaleString()}`);
            console.log(`[Notification]   Days from now: ${Math.ceil((dueDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))}`);

            await this.scheduleCardReminders(card.bank, card.name, dueDate, settings);
        }
        console.log("[Notification] Reschedule Complete.");
    }
};
