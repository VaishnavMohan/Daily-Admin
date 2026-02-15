export type TaskCategory = 'finance' | 'academic' | 'housing' | 'utility' | 'work' | 'medicine' | 'gym' | 'health' | 'other' | 'food' | 'transport' | 'shopping' | 'entertainment' | 'dining' | 'personal' | 'travel';
export type TaskType = 'bill' | 'checklist' | 'expense';
export type RecurrenceFrequency = 'once' | 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'yearly';
export type TaskStatus = 'pending' | 'completed' | 'snoozed' | 'overdue';

export interface LifeTask {
    id: string;
    title: string;          // e.g., "HDFC Regalia", "PhD Progress Report"
    subtitle?: string;      // e.g., "Statement Due", "Submission Portal"

    // Categorization
    category: TaskCategory;
    type: TaskType;

    // Timing
    dueDate: string;        // ISO Date String: YYYY-MM-DD
    recurrence: RecurrenceFrequency;
    recurrenceEndDate?: string; // Stop recurring after this date

    // Status
    status: TaskStatus;
    isPaid?: boolean;       // Legacy compatibility / Specific to bills

    // Finance Specific
    amount?: number;
    currency?: string;
    payUrl?: string;

    // Card Specific (Legacy)
    last4?: string;
    bank?: string;

    // Metadata
    icon?: string;          // Custom icon name
    notes?: string;

    // Notification configuration
    notificationEnabled?: boolean;
    notificationTiming?: 'morning' | 'afternoon' | 'evening' | 'custom';
    customNotificationTime?: string; // HH:MM format
    reminderDaysBefore?: number[];   // e.g., [3, 1] for bills

    // Weekly-specific
    weeklyDays?: number[]; // 0 = Sunday, 1 = Monday, etc.
}

export interface User {
    id?: string;
    name: string;
    email?: string;
    avatar?: string;
    totalDue: number;
    currency: string;
}

export interface ExpenseBudget {
    category: TaskCategory;
    monthlyLimit: number;
}

export interface AppSettings {
    notifications: {
        enabled: boolean;
        frequency: 'off' | 'due-only' | 'urgent-due' | '3-day' | '5-day';
    };
}
