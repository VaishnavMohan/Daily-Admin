const DateUtils = {
    getNextDueDate: (dayOfMonth) => {
        const today = new Date();
        // Mock today as Feb 8 2026
        // today.setFullYear(2026, 1, 8); 

        let targetMonth = today.getMonth();
        let targetYear = today.getFullYear();

        // If today is 8th, and due is 28th.
        // targetMonth = 1 (Feb).
        // targetYear = 2026.

        const nextDate = new Date(targetYear, targetMonth, dayOfMonth);
        // nextDate -> Feb 28 2026 00:00:00 Local Time.

        console.log("Local Date Object:", nextDate.toString());
        console.log("ISO String:", nextDate.toISOString());

        return nextDate.toISOString().split('T')[0];
    }
};

const d = DateUtils.getNextDueDate(28);
console.log("Result:", d);
