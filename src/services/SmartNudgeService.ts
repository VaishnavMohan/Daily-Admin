import AsyncStorage from '@react-native-async-storage/async-storage';

const NUDGE_KEY = '@life_admin_nudges';

interface NudgeState {
    hasShownFirstVictory: boolean;
    isDashboardCardDismissed: boolean;
    taskCountAtLastCheck: number;
}

const DEFAULT_STATE: NudgeState = {
    hasShownFirstVictory: false,
    isDashboardCardDismissed: false,
    taskCountAtLastCheck: 0,
};

export const SmartNudgeService = {
    async getNudgeState(): Promise<NudgeState> {
        try {
            const json = await AsyncStorage.getItem(NUDGE_KEY);
            return json ? JSON.parse(json) : DEFAULT_STATE;
        } catch (e) {
            console.error('Failed to get nudge state', e);
            return DEFAULT_STATE;
        }
    },

    async saveNudgeState(state: NudgeState) {
        try {
            await AsyncStorage.setItem(NUDGE_KEY, JSON.stringify(state));
        } catch (e) {
            console.error('Failed to save nudge state', e);
        }
    },

    async shouldShowFirstVictory(currentTaskCount: number): Promise<boolean> {
        const state = await this.getNudgeState();
        // Trigger if we crossed from 0 to >=1 tasks, AND haven't shown it yet
        if (!state.hasShownFirstVictory && currentTaskCount > 0) {
            return true;
        }
        return false;
    },

    async markFirstVictoryShown() {
        const state = await this.getNudgeState();
        await this.saveNudgeState({ ...state, hasShownFirstVictory: true });
    },

    async shouldShowDashboardGuardian(isGuest: boolean, taskCount: number): Promise<boolean> {
        if (!isGuest) return false;
        const state = await this.getNudgeState();
        if (state.isDashboardCardDismissed) return false;
        if (taskCount > 0) return true;
        return false;
    },

    async dismissDashboardGuardian() {
        const state = await this.getNudgeState();
        await this.saveNudgeState({ ...state, isDashboardCardDismissed: true });
    },

    // For testing
    async reset() {
        await AsyncStorage.removeItem(NUDGE_KEY);
    }
};
