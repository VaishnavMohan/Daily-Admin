import * as React from 'react';
import { useCallback, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, StatusBar, RefreshControl, Dimensions, TouchableOpacity } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown, FadeOut, LinearTransition } from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import Colors from '../constants/Colors';
import { StorageService } from '../services/StorageService';
import { LifeTask } from '../types';
import { BentoCard } from '../components/BentoCard';
import { TaskRow } from '../components/TaskRow';
import { DailyProgress } from '../components/DailyProgress';

const { width } = Dimensions.get('window');

export default function LifeDashboard({ navigation }: any) {
    const [tasks, setTasks] = useState<LifeTask[]>([]);
    const [refreshing, setRefreshing] = useState(false);
    const [filterConstraint, setFilterConstraint] = useState<'all' | 'urgent'>('all');

    useFocusEffect(
        useCallback(() => {
            loadData();
            StatusBar.setBarStyle('light-content');
        }, [])
    );

    const loadData = async () => {
        const data = await StorageService.getTasks();
        setTasks(data);
        setRefreshing(false);
    };

    const handleToggleTask = async (task: LifeTask) => {
        if (task.status === 'completed') {
            const updatedTask = { ...task, status: 'pending' as const };
            await StorageService.updateTask(updatedTask);
        } else {
            await StorageService.completeTask(task.id);
        }
        loadData();
    };

    const onRefresh = () => {
        setRefreshing(true);
        loadData();
    };

    // --- Derived Data for Hybrid Layout ---
    const today = new Date();
    const dateStr = today.toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long' });

    const getGreeting = (hour: number) => {
        if (hour < 5) return 'Late Night Hustle';
        if (hour < 12) return ['Good Morning', 'Rise & Grind', 'Carpe Diem'][Math.floor(Math.random() * 3)];
        if (hour < 17) return ['Good Afternoon', 'Keep Pushing', 'Stay Focused'][Math.floor(Math.random() * 3)];
        if (hour < 22) return ['Good Evening', 'Wrap It Up', 'Rest & Recharge'][Math.floor(Math.random() * 3)];
        return 'Time to Sleep';
    };
    const greeting = React.useMemo(() => getGreeting(today.getHours()), [today.getHours()]); // Memoize to prevent flicker during minor updates if any

    const pendingTasks = tasks.filter(t => t.status !== 'completed');
    const completedTasks = tasks.filter(t => t.status === 'completed');

    // Urgent: Overdue or Due < 3 days
    const urgentTasks = pendingTasks.filter(t => {
        const diff = (new Date(t.dueDate).getTime() - today.getTime()) / (1000 * 3600 * 24);
        return diff <= 3;
    });

    const financeTasks = pendingTasks.filter(t => t.category === 'finance');

    // Determine which tasks to show based on filter
    const visiblePendingTasks = filterConstraint === 'urgent' ? urgentTasks : pendingTasks;

    // Sort logic for the list: Urgent first, then by date
    const sortedPendingTasks = [...visiblePendingTasks].sort((a, b) => {
        const dateA = new Date(a.dueDate).getTime();
        const dateB = new Date(b.dueDate).getTime();

        // Prioritize Urgent
        const isUrgentA = urgentTasks.includes(a);
        const isUrgentB = urgentTasks.includes(b);

        if (isUrgentA && !isUrgentB) return -1;
        if (!isUrgentA && isUrgentB) return 1;

        return dateA - dateB;
    });

    const totalStatsCount = pendingTasks.length + completedTasks.length;

    const insets = useSafeAreaInsets();
    const headerHeight = 60 + insets.top; // Approximate header height

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={Colors.dark.gradients.AppBackground as unknown as readonly [string, string, ...string[]]}
                style={StyleSheet.absoluteFill}
            />

            {/* --- FIXED PROFESSIONAL HEADER --- */}
            <BlurView
                intensity={80}
                tint="dark"
                style={[styles.fixedHeader, { paddingTop: insets.top, height: headerHeight }]}
            >
                <View style={styles.topBar}>
                    <View style={styles.brandContainer}>
                        <MaterialCommunityIcons name="shield-check-outline" size={20} color={Colors.dark.primary} />
                        <Text style={styles.brandText}>DAILY ADMIN</Text>
                    </View>
                    <TouchableOpacity
                        onPress={() => navigation.navigate('Settings')}
                        style={styles.settingsButton}
                    >
                        <MaterialCommunityIcons name="dots-horizontal" size={24} color={Colors.dark.textSecondary} />
                    </TouchableOpacity>
                </View>
            </BlurView>

            <ScrollView
                contentContainerStyle={[styles.scrollContent, { paddingTop: headerHeight + 20 }]}
                showsVerticalScrollIndicator={false}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.dark.primary} />}
            >
                {/* Greeting Section (First in scroll) */}
                <Animated.View entering={FadeInDown.delay(100).duration(600)} style={styles.headerWrapper}>
                    <View style={styles.titleContainer}>
                        <Text style={styles.dateText}>{dateStr.toUpperCase()}</Text>
                        <Text style={styles.greetingText}>{greeting}</Text>
                    </View>
                </Animated.View>

                {/* --- BENTO HEADER (Stats) --- */}
                <View style={styles.gridContainer}>
                    <View style={styles.row}>
                        <Animated.View entering={FadeInDown.delay(200).duration(600)} style={{ flex: 1, marginRight: 8 }}>
                            <BentoCard
                                title="Needs Attention"
                                subtitle="Overdue & Due Soon"
                                value={urgentTasks.length.toString()}
                                icon="alert-circle-outline"
                                colSpan={1}
                                variant={filterConstraint === 'urgent' ? 'highlight' : (urgentTasks.length > 0 ? 'highlight' : 'standard')}
                                onPress={() => setFilterConstraint(filterConstraint === 'urgent' ? 'all' : 'urgent')}
                                style={filterConstraint === 'urgent' ? { borderWidth: 2, borderColor: Colors.dark.gold } : {}}
                            />
                        </Animated.View>

                        <Animated.View entering={FadeInDown.delay(300).duration(600)} style={{ flex: 1, marginLeft: 8 }}>
                            <BentoCard
                                colSpan={1}
                                variant="standard"
                                style={{ padding: 0, justifyContent: 'center', alignItems: 'center' }}
                            >
                                <View style={{ transform: [{ scale: 0.8 }] }}>
                                    <DailyProgress total={totalStatsCount} completed={completedTasks.length} size={100} />
                                </View>
                            </BentoCard>
                        </Animated.View>
                    </View>
                </View>

                {/* --- TASK LIST SECTION --- */}
                <View style={styles.listSection}>
                    <Animated.View entering={FadeInDown.delay(400).duration(600)} style={styles.sectionHeaderRow}>
                        <Text style={styles.sectionTitle}>
                            {filterConstraint === 'urgent' ? 'Urgent Tasks' : 'Up Next'}
                        </Text>
                        {filterConstraint === 'urgent' ? (
                            <TouchableOpacity onPress={() => setFilterConstraint('all')}>
                                <Text style={[styles.countText, { color: Colors.dark.primary }]}>Clear Filter</Text>
                            </TouchableOpacity>
                        ) : (
                            <Text style={styles.countText}>{sortedPendingTasks.length} Pending</Text>
                        )}
                    </Animated.View>

                    {sortedPendingTasks.length > 0 ? (
                        sortedPendingTasks.map((task, index) => (
                            <Animated.View
                                key={task.id}
                                entering={FadeInDown.delay(index * 100).springify()}
                                exiting={FadeOut}
                                layout={LinearTransition.springify()}
                            >
                                <TaskRow
                                    task={task}
                                    onToggle={() => handleToggleTask(task)}
                                    onPress={() => { }}
                                    onLongPress={() => { }}
                                />
                            </Animated.View>
                        ))
                    ) : (
                        <View style={styles.emptyState}>
                            <Text style={styles.emptyText}>No pending tasks. You're all caught up!</Text>
                        </View>
                    )}

                    {/* Completed Section */}
                    {completedTasks.length > 0 && (
                        <View style={{ marginTop: 24 }}>
                            <Text style={styles.sectionTitle}>Completed Today</Text>
                            {completedTasks.slice(0, 3).map((task, index) => (
                                <Animated.View
                                    key={task.id}
                                    entering={FadeInDown.delay(index * 100 + 200)}
                                    layout={LinearTransition.springify()}
                                >
                                    <TaskRow
                                        task={task}
                                        onToggle={() => handleToggleTask(task)}
                                        onPress={() => { }}
                                    />
                                </Animated.View>
                            ))}
                        </View>
                    )}
                </View>

                <View style={{ height: 100 }} />
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.dark.background,
    },
    fixedHeader: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        paddingHorizontal: 24,
        overflow: 'hidden', // Clip content
        borderBottomWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
        justifyContent: 'center', // Center vertical
    },
    safeArea: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: 24,
        paddingBottom: 120, // Bottom Tab safe area
    },
    headerWrapper: {
        marginBottom: 24,
        // No top margin needed as padding is handled by ScrollView
    },
    topBar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        height: '100%', // Fill the fixed header
        paddingBottom: 8, // Adjust for visual alignment
    },
    brandContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: 'rgba(255,255,255,0.03)',
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    brandText: {
        fontSize: 14,
        fontWeight: '800', // Heavy bold
        color: Colors.dark.text,
        letterSpacing: 1.5,
    },
    settingsButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.03)',
    },
    titleContainer: {
        // paddingHorizontal: 4, // Align with content
    },
    dateText: {
        color: Colors.dark.primary, // Pop color
        fontSize: 13,
        fontWeight: '700',
        letterSpacing: 1.5,
        marginBottom: 6,
        textTransform: 'uppercase',
    },
    greetingText: {
        color: Colors.dark.text,
        fontSize: 32,
        fontWeight: '300', // Elegant thin
        letterSpacing: -1,
        lineHeight: 40,
    },
    // REMOVED OLD STYLES
    /*
    headerContainer: { ... },
    profileImageContainer: { ... },
    */
    gridContainer: {
        marginBottom: 32,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
    },
    listSection: {
        flex: 1,
    },
    sectionHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    sectionTitle: {
        color: Colors.dark.text,
        fontSize: 18,
        fontWeight: '600',
        letterSpacing: 0.5,
    },
    countText: {
        color: Colors.dark.textSecondary,
        fontSize: 13,
        fontWeight: '500',
    },
    emptyState: {
        paddingVertical: 40,
        alignItems: 'center',
    },
    emptyText: {
        color: Colors.dark.textSecondary,
        fontSize: 14,
        fontStyle: 'italic',
    }
});
