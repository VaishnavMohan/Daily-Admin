export const DateUtils = {
    /**
     * Helper to get Local "YYYY-MM-DD" string.
     * toISOString() uses UTC and shifts dates. We want Local.
     */
    toLocalISOString: (date: Date): string => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    },

    getDaysRemaining: (dateStr: string): number => {
        if (!dateStr) return 0;

        let targetDate: Date;
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Local Midnight

        // Handle "YYYY-MM-DD" strictly
        if (dateStr.includes('-') && dateStr.length === 10) {
            const [y, m, d] = dateStr.split('-').map(Number);
            targetDate = new Date(y, m - 1, d); // Local Midnight
            targetDate.setHours(0, 0, 0, 0);
        } else if (dateStr.includes(',')) {
            // Legacy: "Feb 28, 2026"
            targetDate = new Date(dateStr);
        } else {
            // Fallback
            targetDate = new Date(dateStr);
        }

        if (isNaN(targetDate.getTime())) return 0;

        // Force local midnight just in case
        targetDate.setHours(0, 0, 0, 0);

        const diffTime = targetDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        return diffDays;
    },

    formatForDisplay: (dateStr: string): { day: string, month: string } => {
        // Parse strictly to ensure display matches storage
        let date: Date;
        if (dateStr && dateStr.includes('-') && dateStr.length === 10) {
            const [y, m, d] = dateStr.split('-').map(Number);
            date = new Date(y, m - 1, d);
        } else {
            date = new Date(dateStr);
        }

        if (isNaN(date.getTime())) return { day: '--', month: '---' };

        return {
            day: date.getDate().toString(),
            month: date.toLocaleDateString('en-US', { month: 'short' }).toUpperCase()
        };
    },

    getNextDueDate: (dayOfMonth: number): string => {
        const today = new Date();
        let targetMonth = today.getMonth();
        let targetYear = today.getFullYear();

        // If today is 8th, and due is 5th -> Next month
        if (today.getDate() > dayOfMonth) {
            targetMonth++;
            if (targetMonth > 11) {
                targetMonth = 0;
                targetYear++;
            }
        }

        // Clamp day to max days in month (e.g. 31 -> 28 in Feb)
        const maxDaysInMonth = new Date(targetYear, targetMonth + 1, 0).getDate();
        const finalDay = Math.min(dayOfMonth, maxDaysInMonth);

        // Construct date (Local)
        const nextDate = new Date(targetYear, targetMonth, finalDay);

        // Return YYYY-MM-DD Local
        return DateUtils.toLocalISOString(nextDate);
    }
};
