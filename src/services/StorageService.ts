import AsyncStorage from '@react-native-async-storage/async-storage';
import { LifeTask, User, AppSettings, ExpenseBudget, TaskCategory } from '../types';
import { MOCK_TASKS, MOCK_USER } from '../constants/MockData';

const TASKS_KEY = '@life_admin_tasks';
const USER_KEY = '@life_admin_user';
const SETTINGS_KEY = '@life_admin_settings';
const BUDGETS_KEY = '@life_admin_budgets';

export const StorageService = {
    // --- TASKS ---
    async getTasks(): Promise<LifeTask[]> {
        try {
            const jsonValue = await AsyncStorage.getItem(TASKS_KEY);
            if (jsonValue != null) {
                const tasks = JSON.parse(jsonValue);
                // Migration check: if old "Card" data is found (check for 'bank' but no 'category')
                if (tasks.length > 0 && tasks[0].bank && !tasks[0].category) {
                    console.log('Migrating old Card data to LifeTask...');
                    return tasks.map((t: any) => ({
                        ...t,
                        title: t.bank ? `${t.bank} ${t.name}` : t.name,
                        subtitle: 'Credit Card Bill',
                        category: 'finance',
                        type: 'bill',
                        amount: t.due || 0,
                        dueDate: t.nextDueDate || new Date().toISOString().split('T')[0],
                        recurrence: 'monthly',
                        status: t.isPaid ? 'completed' : 'pending',
                        last4: t.last4,
                        bank: t.bank
                    }));
                }
                return tasks;
            }
            // First time load: Return MOCK DATA
            await this.saveTasks(MOCK_TASKS);
            return MOCK_TASKS;
        } catch (e) {
            console.error('Failed to load tasks', e);
            return [];
        }
    },

    async saveTasks(tasks: LifeTask[]) {
        try {
            const jsonValue = JSON.stringify(tasks);
            await AsyncStorage.setItem(TASKS_KEY, jsonValue);
        } catch (e) {
            console.error('Failed to save tasks', e);
        }
    },

    async addTask(task: LifeTask) {
        const tasks = await this.getTasks();
        const newTasks = [...tasks, task];
        await this.saveTasks(newTasks);
        return newTasks;
    },

    async updateTask(updatedTask: LifeTask) {
        const tasks = await this.getTasks();
        const newTasks = tasks.map(t => t.id === updatedTask.id ? updatedTask : t);
        await this.saveTasks(newTasks);
        return newTasks;
    },

    async completeTask(taskId: string) {
        const tasks = await this.getTasks();
        const taskIndex = tasks.findIndex(t => t.id === taskId);

        if (taskIndex === -1) return tasks;

        const task = tasks[taskIndex];

        // 1. Mark current as completed
        const completedTask = { ...task, status: 'completed' as const };
        const newTasks = [...tasks];
        newTasks[taskIndex] = completedTask;

        // 2. Handle Recurrence (Create next task if needed)
        if (task.recurrence && task.recurrence !== 'once') {
            const currentDueDate = new Date(task.dueDate);
            let nextDueDate = new Date(currentDueDate);

            // Calculate next date based on recurrence
            if (task.recurrence === 'daily') {
                nextDueDate.setDate(currentDueDate.getDate() + 1);
            } else if (task.recurrence === 'weekly') {
                nextDueDate.setDate(currentDueDate.getDate() + 7);
            } else if (task.recurrence === 'biweekly') {
                nextDueDate.setDate(currentDueDate.getDate() + 14);
            } else if (task.recurrence === 'monthly') {
                nextDueDate.setMonth(currentDueDate.getMonth() + 1);
            } else if (task.recurrence === 'yearly') {
                nextDueDate.setFullYear(currentDueDate.getFullYear() + 1);
            }

            // Check if next task already exists to avoid duplicates (basic check)
            const nextDateString = nextDueDate.toISOString().split('T')[0];

            // Check if we've reached the end of recurrence
            if (task.recurrenceEndDate && nextDateString > task.recurrenceEndDate) {
                console.log('Recurrence ended for task:', task.title, 'End date:', task.recurrenceEndDate);
                return newTasks; // Don't create next task
            }

            const duplicateExists = tasks.some(t =>
                t.title === task.title &&
                t.dueDate === nextDateString &&
                t.status !== 'completed'
            );

            if (!duplicateExists) {
                const nextTask: LifeTask = {
                    ...task,
                    id: Math.random().toString(36).substr(2, 9),
                    dueDate: nextDateString,
                    status: 'pending',
                    // Preserve recurrenceEndDate for future iterations
                    recurrenceEndDate: task.recurrenceEndDate,
                    // Reset paid status for new bills? 
                    // task.isPaid is legacy, but if we use it, reset it.
                    isPaid: false
                };
                newTasks.push(nextTask);
                console.log('Created next recurring task:', nextTask.title, nextTask.dueDate);
            }
        }

        await this.saveTasks(newTasks);
        return newTasks;
    },

    async deleteTask(taskId: string) {
        const tasks = await this.getTasks();
        const newTasks = tasks.filter(t => t.id !== taskId);
        await this.saveTasks(newTasks);
        return newTasks;
    },

    // --- USER ---
    async getUser(): Promise<User> {
        try {
            const jsonValue = await AsyncStorage.getItem(USER_KEY);
            return jsonValue != null ? JSON.parse(jsonValue) : MOCK_USER;
        } catch (e) {
            console.error('Failed to load user', e);
            return MOCK_USER;
        }
    },

    async saveUser(user: User) {
        try {
            const jsonValue = JSON.stringify(user);
            await AsyncStorage.setItem(USER_KEY, jsonValue);
        } catch (e) {
            console.error('Failed to save user', e);
        }
    },

    // --- SETTINGS ---
    async getSettings(): Promise<AppSettings> {
        try {
            const json = await AsyncStorage.getItem(SETTINGS_KEY);
            return json ? JSON.parse(json) : {
                notifications: {
                    enabled: true,
                    frequency: 'urgent-due'
                }
            };
        } catch (error) {
            console.error('Error getting settings:', error);
            return { notifications: { enabled: true, frequency: 'urgent-due' } };
        }
    },

    async saveSettings(settings: AppSettings) {
        try {
            await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
        } catch (error) {
            console.error('Error saving settings:', error);
        }
    },

    async getBudgets(): Promise<ExpenseBudget[]> {
        try {
            const json = await AsyncStorage.getItem(BUDGETS_KEY);
            return json ? JSON.parse(json) : [];
        } catch (error) {
            console.error('Error getting budgets:', error);
            return [];
        }
    },

    async saveBudgets(budgets: ExpenseBudget[]): Promise<void> {
        try {
            await AsyncStorage.setItem(BUDGETS_KEY, JSON.stringify(budgets));
        } catch (error) {
            console.error('Error saving budgets:', error);
        }
    }
};
