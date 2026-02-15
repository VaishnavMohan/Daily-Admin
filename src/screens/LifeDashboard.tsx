import * as React from 'react';
import { useCallback, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, StatusBar, RefreshControl, Dimensions, TouchableOpacity, Modal, Animated as RNAnimated } from 'react-native';
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
import WebSwipeable from '../components/WebSwipeable';

const { width } = Dimensions.get('window');

export default function LifeDashboard({ navigation }: any) {
    const [tasks, setTasks] = useState<LifeTask[]>([]);
    const [refreshing, setRefreshing] = useState(false);
    const [filterConstraint, setFilterConstraint] = useState<'all' | 'urgent'>('all');

    // Swipe & Modal State
    const rowRefs = React.useRef(new Map<string, any>());
    const [modalConfig, setModalConfig] = useState<{
        visible: boolean;
        title: string;
        message: string;
        confirmText?: string;
        cancelText?: string;
        onConfirm?: () => void;
        isDanger?: boolean;
        singleButton?: boolean;
    }>({ visible: false, title: '', message: '' });

    useFocusEffect(
        useCallback(() => {
            loadData();
            StatusBar.setBarStyle('light-content');
            return () => {
                // Close all swipe rows on blur
                rowRefs.current.forEach((ref) => {
                    ref?.close();
                });
            };
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

    const handleDeleteTask = (task: LifeTask) => {
        setModalConfig({
            visible: true,
            title: "Delete Task?",
            message: `Are you sure you want to delete "${task.title}"?`,
            confirmText: "Delete",
            isDanger: true,
            onConfirm: async () => {
                await StorageService.deleteTask(task.id);
                loadData();
                setModalConfig(prev => ({ ...prev, visible: false }));
            }
        });
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

    // -- DEBUG --
    // -- Filter Logic -- 
    // We want to exclude Expenses but keep Tasks (even if they are 'food' or 'shopping' related)
    const EXPENSE_ONLY_CATEGORIES = ['food', 'transport', 'shopping', 'entertainment', 'dining', 'personal', 'travel', 'health', 'other', 'utility'];

    const pendingTasksArray = tasks.filter(t => {
        // --- STRICT WHITELIST FILTER ---
        // Only allow explicit 'bill' or 'checklist' types.
        // Hides 'expense', undefined types, or anything else.
        const type = t.type ? t.type.toLowerCase() : '';

        // Allowed Types Only
        if (type !== 'bill' && type !== 'checklist') {
            return false;
        }

        // --- STEP 2: STATUS FILTER ---
        if (t.status === 'completed') return false;

        // --- STEP 3: DATE FILTER ---
        // Parse "YYYY-MM-DD" as local integers
        const [y, m, d] = t.dueDate.split('-').map(Number);
        const taskDate = new Date(y, m - 1, d); // Local time 00:00:00

        // Current Month Bounds
        const nextMonthStart = new Date(today.getFullYear(), today.getMonth() + 1, 1);

        // Show if: 
        // 1. Due this month (>= 1st AND < next 1st)
        // 2. Overdue (due before this month start)
        const isThisMonthOrOverdue = taskDate < nextMonthStart;

        return isThisMonthOrOverdue;
    });

    const completedTasksArray = tasks.filter(t => {
        // --- STRICT WHITELIST FILTER ---
        const type = t.type ? t.type.toLowerCase() : '';
        if (type !== 'bill' && type !== 'checklist') return false;

        // --- STATUS ---
        if (t.status !== 'completed') return false;

        // --- CURRENT MONTH ONLY ---
        const [y, m, d] = t.dueDate.split('-').map(Number);
        const taskDate = new Date(y, m - 1, d);
        const currentMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
        const nextMonthStart = new Date(today.getFullYear(), today.getMonth() + 1, 1);

        // Must be exactly within current month
        return taskDate >= currentMonthStart && taskDate < nextMonthStart;
    });

    const pendingTasks = pendingTasksArray;
    const completedTasks = completedTasksArray;

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
                        onPress={() => navigation.navigate('Profile')}
                        style={styles.settingsButton}
                    >
                        <MaterialCommunityIcons name="account-circle" size={28} color={Colors.dark.primary} />
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
                                style={{ marginBottom: 12 }}
                            >
                                <WebSwipeable
                                    ref={(ref) => {
                                        if (ref) rowRefs.current.set(task.id, ref);
                                    }}
                                    onSwipeableWillOpen={() => {
                                        [...rowRefs.current.entries()].forEach(([key, ref]) => {
                                            if (key !== task.id && ref) ref.close();
                                        });
                                    }}
                                    renderRightActions={(progress, dragX) => {
                                        const scale = dragX.interpolate({
                                            inputRange: [-100, 0],
                                            outputRange: [1, 0],
                                            extrapolate: 'clamp',
                                        });
                                        // Standard swipe width calculation for dashboard
                                        const opacity = progress.interpolate({
                                            inputRange: [0, 1],
                                            outputRange: [0, 1],
                                        });

                                        return (
                                            <TouchableOpacity
                                                onPress={() => {
                                                    rowRefs.current.get(task.id)?.close();
                                                    handleDeleteTask(task);
                                                }}
                                                style={[styles.deleteAction, { opacity }]}
                                            >
                                                <View style={styles.deleteIconContainer}>
                                                    <MaterialCommunityIcons name="trash-can-outline" size={24} color="#fff" />
                                                </View>
                                                <Text style={styles.deleteText}>Delete</Text>
                                            </TouchableOpacity>
                                        );
                                    }}
                                >
                                    <TaskRow
                                        task={task}
                                        onToggle={() => handleToggleTask(task)}
                                        onPress={() => { }}
                                        onLongPress={() => handleDeleteTask(task)}
                                        style={{ marginBottom: 0 }}
                                    />
                                </WebSwipeable>
                            </Animated.View>
                        ))
                    ) : (
                        <Animated.View entering={FadeInDown.delay(600).duration(800)} style={styles.zeroStateContainer}>
                            <LinearGradient
                                colors={['rgba(255,255,255,0.05)', 'rgba(255,255,255,0.02)']}
                                style={styles.zeroStateCard}
                            >
                                <MaterialCommunityIcons name="rocket-launch-outline" size={48} color={Colors.dark.primary} style={{ marginBottom: 16 }} />
                                <Text style={styles.zeroStateTitle}>Welcome to Daily Admin</Text>
                                <Text style={styles.zeroStateSubtitle}>Your personal command center for life.</Text>

                                <View style={styles.featureList}>
                                    <View style={styles.featureRow}>
                                        <MaterialCommunityIcons name="credit-card-check-outline" size={20} color={Colors.dark.textSecondary} />
                                        <Text style={styles.featureText}>Track subscriptions & monthly bills</Text>
                                    </View>
                                    <View style={styles.featureRow}>
                                        <MaterialCommunityIcons name="checkbox-marked-circle-outline" size={20} color={Colors.dark.textSecondary} />
                                        <Text style={styles.featureText}>Manage household chores & tasks</Text>
                                    </View>
                                    <View style={styles.featureRow}>
                                        <MaterialCommunityIcons name="pill" size={20} color={Colors.dark.textSecondary} />
                                        <Text style={styles.featureText}>Monitor daily habits & meds</Text>
                                    </View>
                                </View>

                                <View style={styles.ctaContainer}>
                                    <Text style={styles.ctaText}>Tap </Text>
                                    <View style={styles.plusIconSmall}>
                                        <MaterialCommunityIcons name="plus" size={14} color="#000" />
                                    </View>
                                    <Text style={styles.ctaText}> below to get started</Text>
                                </View>
                                <MaterialCommunityIcons name="arrow-down" size={24} color={Colors.dark.primary} style={{ marginTop: 8, opacity: 0.8 }} />
                            </LinearGradient>
                        </Animated.View>
                    )}

                    {/* Completed Section */}
                    {completedTasks.length > 0 && (
                        <View style={{ marginTop: 24 }}>
                            <Text style={styles.sectionTitle}>Completed This Month</Text>
                            {completedTasks.map((task, index) => (
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
            {/* Manual Overlay Modal (Bypassing Native Modal due to issues) */}
            {modalConfig.visible && (
                <View style={[StyleSheet.absoluteFill, { zIndex: 9999, elevation: 9999 }]}>
                    <TouchableOpacity
                        activeOpacity={1}
                        style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center' }}
                        onPress={() => setModalConfig(prev => ({ ...prev, visible: false }))}
                    >
                        <TouchableOpacity
                            activeOpacity={1}
                            onPress={(e) => e.stopPropagation()}
                        >
                            <View style={{
                                width: width * 0.85,
                                maxWidth: 400,
                                backgroundColor: '#1E293B',
                                borderRadius: 24,
                                padding: 24,
                                borderWidth: 1,
                                borderColor: 'rgba(255,255,255,0.1)',
                                shadowColor: "#000",
                                shadowOffset: { width: 0, height: 10 },
                                shadowOpacity: 0.5,
                                shadowRadius: 20,
                            }}>
                                <View style={{ alignItems: 'center', marginBottom: 16 }}>
                                    {modalConfig.isDanger ? (
                                        <View style={{ width: 60, height: 60, borderRadius: 30, backgroundColor: 'rgba(239, 68, 68, 0.2)', justifyContent: 'center', alignItems: 'center', marginBottom: 16 }}>
                                            <MaterialCommunityIcons name="delete-outline" size={32} color="#EF4444" />
                                        </View>
                                    ) : (
                                        <View style={{ width: 60, height: 60, borderRadius: 30, backgroundColor: 'rgba(59, 130, 246, 0.2)', justifyContent: 'center', alignItems: 'center', marginBottom: 16 }}>
                                            <MaterialCommunityIcons name="information-variant" size={32} color={Colors.dark.primary} />
                                        </View>
                                    )}
                                    <Text style={{ fontSize: 20, fontWeight: '700', color: '#fff', marginBottom: 8, textAlign: 'center' }}>{modalConfig.title}</Text>
                                    <Text style={{ fontSize: 14, color: Colors.dark.textSecondary, textAlign: 'center' }}>
                                        {modalConfig.message}
                                    </Text>
                                </View>

                                <View style={{ flexDirection: 'row', gap: 12 }}>
                                    {!modalConfig.singleButton && (
                                        <TouchableOpacity
                                            style={{ flex: 1, paddingVertical: 14, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.05)', alignItems: 'center' }}
                                            onPress={() => setModalConfig(prev => ({ ...prev, visible: false }))}
                                        >
                                            <Text style={{ color: '#fff', fontWeight: '600' }}>{modalConfig.cancelText || 'Cancel'}</Text>
                                        </TouchableOpacity>
                                    )}
                                    <TouchableOpacity
                                        style={{ flex: 1, paddingVertical: 14, borderRadius: 16, backgroundColor: modalConfig.isDanger ? '#EF4444' : Colors.dark.primary, alignItems: 'center' }}
                                        onPress={() => {
                                            if (modalConfig.onConfirm) modalConfig.onConfirm();
                                            else setModalConfig(prev => ({ ...prev, visible: false }));
                                        }}
                                    >
                                        <Text style={{ color: '#fff', fontWeight: '600' }}>{modalConfig.confirmText || 'OK'}</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </TouchableOpacity>
                    </TouchableOpacity>
                </View>
            )}
        </View >
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
        zIndex: 1000,
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
    },
    // NEW ZERO STATE STYLES
    zeroStateContainer: {
        marginTop: 20,
        paddingHorizontal: 4,
    },
    zeroStateCard: {
        borderRadius: 24,
        padding: 32,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
    },
    zeroStateTitle: {
        color: Colors.dark.text,
        fontSize: 22,
        fontWeight: 'bold',
        marginBottom: 8,
        textAlign: 'center',
    },
    zeroStateSubtitle: {
        color: Colors.dark.textSecondary,
        fontSize: 15,
        marginBottom: 32,
        textAlign: 'center',
        lineHeight: 22,
    },
    featureList: {
        width: '100%',
        gap: 16,
        marginBottom: 32,
    },
    featureRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        backgroundColor: 'rgba(255,255,255,0.03)',
        padding: 12,
        borderRadius: 12,
    },
    featureText: {
        color: Colors.dark.text,
        fontSize: 14,
        fontWeight: '500',
    },
    ctaContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    ctaText: {
        color: Colors.dark.primary,
        fontSize: 14,
        fontWeight: '600',
    },
    plusIconSmall: {
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: Colors.dark.primary,
        justifyContent: 'center',
        alignItems: 'center',
        marginHorizontal: 4,
    },
    // Dashboard Swipe Actions
    deleteAction: {
        backgroundColor: '#EF4444',
        justifyContent: 'center',
        alignItems: 'center',
        width: 70,
        height: '100%',
        borderRadius: 16,
        marginLeft: 8,
    },
    deleteIconContainer: {
        marginBottom: 4,
    },
    deleteText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '600',
    }
});
