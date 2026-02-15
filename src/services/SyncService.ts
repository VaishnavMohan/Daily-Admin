import { supabase } from './SupabaseClient';
import { LifeTask } from '../types';

export const SyncService = {
    async pushLocalChanges(userId: string, tasks: LifeTask[]) {
        if (!userId || tasks.length === 0) return;

        console.log(`SyncService: Pushing ${tasks.length} tasks to cloud...`);

        const payload = tasks.map(task => ({
            id: task.id,
            user_id: userId,
            title: task.title,
            subtitle: task.subtitle,
            category: task.category,
            type: task.type,
            due_date: task.dueDate,
            recurrence: task.recurrence,
            recurrence_end_date: task.recurrenceEndDate,
            status: task.status,
            amount: task.amount,
            currency: task.currency,
            icon: task.icon,
            is_paid: task.isPaid,
        }));

        try {
            const { error } = await supabase
                .from('tasks')
                .upsert(payload, { onConflict: 'id' });

            if (error) throw error;
            console.log('SyncService: Push successful');
        } catch (error) {
            console.error('SyncService: Push failed', error);
            throw error;
        }
    },

    async pullCloudChanges(userId: string): Promise<LifeTask[]> {
        if (!userId) return [];

        console.log('SyncService: Pulling from cloud...');

        try {
            const { data, error } = await supabase
                .from('tasks')
                .select('*');

            if (error) throw error;
            if (!data) return [];

            return data.map((item: any) => ({
                id: item.id,
                title: item.title,
                subtitle: item.subtitle,
                category: item.category,
                type: item.type,
                dueDate: item.due_date,
                recurrence: item.recurrence,
                recurrenceEndDate: item.recurrence_end_date,
                status: item.status,
                amount: item.amount,
                currency: item.currency,
                icon: item.icon,
                isPaid: item.is_paid
            }));
        } catch (error) {
            console.error('SyncService: Pull failed', error);
            throw error;
        }
    },

    async syncInitial(userId: string, localTasks: LifeTask[]): Promise<LifeTask[]> {
        try {
            // 1. Push Local -> Cloud (Save Guest Work)
            if (localTasks.length > 0) {
                await this.pushLocalChanges(userId, localTasks);
            }

            // 2. Pull Cloud -> Local (Get Full List)
            const mergedTasks = await this.pullCloudChanges(userId);
            return mergedTasks;
        } catch (error) {
            console.error("SyncService: Initial sync failed", error);
            return localTasks; // Fallback to local
        }
    }
};
