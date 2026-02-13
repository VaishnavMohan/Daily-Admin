import { LifeTask, User } from '../types';

export const MOCK_USER: User = {
    name: 'Vaishnav',
    totalDue: 45230,
    currency: '₹',
};

// Helper: Get date relative to today (e.g., +5 days)
const getDate = (daysFromNow: number) => {
    const d = new Date();
    d.setDate(d.getDate() + daysFromNow);
    return d.toISOString().split('T')[0];
};

// Helper: Get specific day of current/next month
const getNextDueDate = (day: number) => {
    const today = new Date();
    const currentDay = today.getDate();
    const d = new Date();

    // If day has passed, move to next month
    if (currentDay > day) {
        d.setMonth(d.getMonth() + 1);
    }
    d.setDate(day);
    return d.toISOString().split('T')[0];
};

export const MOCK_TASKS: LifeTask[] = [
    // --- FINANCE (With Amount) ---
    {
        id: '1',
        title: 'HDFC Regalia Gold',
        subtitle: 'Statement Due',
        category: 'finance',
        type: 'bill',
        dueDate: getDate(2), // Due in 2 days
        recurrence: 'monthly',
        status: 'pending',
        amount: 15400,
        currency: '₹',
        icon: 'credit-card-outline'
    },
    {
        id: '2',
        title: 'House Rent',
        category: 'housing',
        type: 'bill',
        dueDate: getDate(0), // Due Today
        recurrence: 'monthly',
        status: 'pending',
        amount: 25000,
        currency: '₹',
        icon: 'home-outline'
    },

    // --- ACADEMIC (With Submission) ---
    {
        id: '3',
        title: 'PhD Progress Report',
        subtitle: 'Submit to Portal',
        category: 'academic',
        type: 'checklist',
        dueDate: getDate(5), // Due in 5 days
        recurrence: 'monthly',
        status: 'pending',
        icon: 'school-outline'
    },

    // --- UTILITY ---
    {
        id: '4',
        title: 'Electricity Bill',
        category: 'utility',
        type: 'bill',
        dueDate: getDate(10),
        recurrence: 'monthly',
        status: 'pending',
        amount: 1450,
        currency: '₹',
        icon: 'lightning-bolt-outline'
    },

    // --- WORK ---
    {
        id: '5',
        title: 'Weekly Lab Meeting',
        category: 'work',
        type: 'checklist',
        dueDate: getDate(1), // Tomorrow
        recurrence: 'weekly',
        status: 'pending',
        icon: 'flask-outline'
    },

    // --- COMPLETED ---
    {
        id: '6',
        title: 'ACT Fibernet',
        subtitle: 'WiFi Bill',
        category: 'utility',
        type: 'bill',
        dueDate: getDate(-5),
        recurrence: 'monthly',
        status: 'completed',
        amount: 1100,
        currency: '₹',
        isPaid: true,
        icon: 'wifi'
    }
];

export const MOCK_DATA = {
    user: MOCK_USER,
    tasks: MOCK_TASKS
};
