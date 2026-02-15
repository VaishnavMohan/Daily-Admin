import * as React from 'react';
import { useCallback, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, StatusBar, RefreshControl, Dimensions, TouchableOpacity, Modal, Animated as RNAnimated } from 'react-native';
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
import { useTheme } from '../context/ThemeContext';

const { width } = Dimensions.get('window');

export default function LifeDashboard({ navigation }: any) {
    const { colors, theme } = useTheme();
    const [tasks, setTasks] = useState<LifeTask[]>([]);
    const [refreshing, setRefreshing] = useState(false);
    const [filterConstraint, setFilterConstraint] = useState<'all' | 'urgent'>('all');

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

    const handleSnoozeTask = async (task: LifeTask) => {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const y = tomorrow.getFullYear();
        const m = String(tomorrow.getMonth() + 1).padStart(2, '0');
        const d = String(tomorrow.getDate()).padStart(2, '0');
        const updatedTask = { ...task, dueDate: `${y}-${m}-${d}` };
        await StorageService.updateTask(updatedTask);
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

    const today = new Date();
    const dateStr = today.toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long' });

    const getGreeting = (hour: number) => {
        if (hour < 5) return 'Late Night Hustle';
        if (hour < 12) return 'Good Morning';
        if (hour < 17) return 'Good Afternoon';
        if (hour < 22) return 'Good Evening';
        return 'Time to Sleep';
    };
    const currentHour = today.getHours();
    const greeting = React.useMemo(() => getGreeting(currentHour), [currentHour]);

    const pendingTasks = tasks.filter(t => {
        const type = t.type ? t.type.toLowerCase() : '';
        if (type !== 'bill' && type !== 'checklist') {
            return false;
        }
        if (t.status === 'completed') return false;
        const [y, m, d] = t.dueDate.split('-').map(Number);
        const taskDate = new Date(y, m - 1, d);
        const nextMonthStart = new Date(today.getFullYear(), today.getMonth() + 1, 1);
        const isThisMonthOrOverdue = taskDate < nextMonthStart;
        return isThisMonthOrOverdue;
    });

    const completedTasks = tasks.filter(t => {
        const type = t.type ? t.type.toLowerCase() : '';
        if (type !== 'bill' && type !== 'checklist') return false;
        if (t.status !== 'completed') return false;
        const [y, m, d] = t.dueDate.split('-').map(Number);
        const taskDate = new Date(y, m - 1, d);
        const currentMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
        const nextMonthStart = new Date(today.getFullYear(), today.getMonth() + 1, 1);
        return taskDate >= currentMonthStart && taskDate < nextMonthStart;
    });

    const urgentTasks = pendingTasks.filter(t => {
        const diff = (new Date(t.dueDate).getTime() - today.getTime()) / (1000 * 3600 * 24);
        return diff <= 3;
    });

    const financeTasks = pendingTasks.filter(t => t.category === 'finance');

    const visiblePendingTasks = filterConstraint === 'urgent' ? urgentTasks : pendingTasks;

    const sortedPendingTasks = [...visiblePendingTasks].sort((a, b) => {
        const dateA = new Date(a.dueDate).getTime();
        const dateB = new Date(b.dueDate).getTime();
        const isUrgentA = urgentTasks.includes(a);
        const isUrgentB = urgentTasks.includes(b);
        if (isUrgentA && !isUrgentB) return -1;
        if (!isUrgentA && isUrgentB) return 1;
        return dateA - dateB;
    });

    const totalStatsCount = pendingTasks.length + completedTasks.length;

    const insets = useSafeAreaInsets();
    const headerHeight = 60 + insets.top;

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <LinearGradient
                colors={colors.gradients.AppBackground as unknown as readonly [string, string, ...string[]]}
                style={StyleSheet.absoluteFill}
            />

            <BlurView
                intensity={80}
                tint={theme === 'dark' ? 'dark' : 'light'}
                style={[styles.fixedHeader, { paddingTop: insets.top, height: headerHeight, backgroundColor: theme === 'dark' ? 'rgba(15, 23, 42, 0.97)' : 'rgba(248, 250, 252, 0.97)', borderColor: theme === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' }]}
            >
                <View style={styles.topBar}>
                    <View style={[styles.brandContainer, { backgroundColor: `${colors.primary}08`, borderColor: `${colors.primary}18` }]}>
                        <MaterialCommunityIcons name="shield-check-outline" size={20} color={colors.primary} />
                        <Text style={[styles.brandText, { color: colors.text }]}>DAILY ADMIN</Text>
                    </View>
                    <TouchableOpacity
                        onPress={() => navigation.navigate('Profile')}
                        style={[styles.settingsButton, { backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)', borderColor: theme === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' }]}
                    >
                        <MaterialCommunityIcons name="account-circle" size={28} color={colors.primary} />
                    </TouchableOpacity>
                </View>
                <LinearGradient
                    colors={['transparent', `${colors.primary}14`, `${colors.primary}25`, `${colors.primary}14`, 'transparent']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.headerGlow}
                />
            </BlurView>

            <ScrollView
                contentContainerStyle={[styles.scrollContent, { paddingTop: headerHeight + 24 }]}
                showsVerticalScrollIndicator={false}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.dark.primary} />}
            >
                <Animated.View entering={FadeInDown.delay(100).duration(600)} style={styles.headerWrapper}>
                    <View style={styles.titleContainer}>
                        <Text style={[styles.dateText, { color: colors.primary }]}>{dateStr.toUpperCase()}</Text>
                        <Text style={[styles.greetingText, { color: colors.text }]}>{greeting}</Text>
                    </View>
                </Animated.View>

                <View style={styles.gridContainer}>
                    <View style={styles.row}>
                        <Animated.View entering={FadeInDown.delay(200).duration(600)} style={styles.bentoCardLeft}>
                            <BentoCard
                                title="Needs Attention"
                                subtitle="Overdue & Due Soon"
                                value={urgentTasks.length.toString()}
                                icon="alert-circle-outline"
                                colSpan={1}
                                variant={filterConstraint === 'urgent' ? 'highlight' : (urgentTasks.length > 0 ? 'highlight' : 'standard')}
                                onPress={() => setFilterConstraint(filterConstraint === 'urgent' ? 'all' : 'urgent')}
                                style={filterConstraint === 'urgent' ? styles.bentoCardActive : undefined}
                            />
                        </Animated.View>

                        <Animated.View entering={FadeInDown.delay(300).duration(600)} style={styles.bentoCardRight}>
                            <BentoCard
                                colSpan={1}
                                variant="standard"
                                style={styles.progressCard}
                            >
                                <View style={styles.progressScaleWrapper}>
                                    <DailyProgress total={totalStatsCount} completed={completedTasks.length} size={100} />
                                </View>
                            </BentoCard>
                        </Animated.View>
                    </View>
                </View>

                <View style={styles.listSection}>
                    <Animated.View entering={FadeInDown.delay(400).duration(600)} style={styles.sectionHeaderRow}>
                        <Text style={[styles.sectionTitle, { color: colors.text }]}>
                            {filterConstraint === 'urgent' ? 'Urgent Tasks' : 'Up Next'}
                        </Text>
                        {filterConstraint === 'urgent' ? (
                            <TouchableOpacity onPress={() => setFilterConstraint('all')} style={[styles.clearFilterButton, { backgroundColor: `${colors.primary}18`, borderColor: `${colors.primary}30` }]}>
                                <Text style={[styles.clearFilterText, { color: colors.primary }]}>Clear Filter</Text>
                            </TouchableOpacity>
                        ) : (
                            <View style={[styles.pendingBadge, { backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)' }]}>
                                <Text style={[styles.countText, { color: colors.textSecondary }]}>{sortedPendingTasks.length} Pending</Text>
                            </View>
                        )}
                    </Animated.View>

                    {sortedPendingTasks.length > 0 ? (
                        sortedPendingTasks.map((task, index) => (
                            <Animated.View
                                key={task.id}
                                entering={FadeInDown.delay(index * 100).springify()}
                                exiting={FadeOut}
                                layout={LinearTransition.springify()}
                                style={styles.taskRowWrapper}
                            >
                                <View style={styles.taskRowWithActions}>
                                    <View style={styles.taskRowContent}>
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
                                                        style={styles.deleteActionWrapper}
                                                    >
                                                        <RNAnimated.View style={[styles.deleteActionInner, { opacity }]}>
                                                            <LinearGradient
                                                                colors={['#EF4444', '#DC2626', '#B91C1C']}
                                                                start={{ x: 0, y: 0 }}
                                                                end={{ x: 1, y: 1 }}
                                                                style={styles.deleteGradient}
                                                            >
                                                                <View style={styles.deleteIconContainer}>
                                                                    <MaterialCommunityIcons name="trash-can-outline" size={22} color="#fff" />
                                                                </View>
                                                                <Text style={styles.deleteText}>Delete</Text>
                                                            </LinearGradient>
                                                        </RNAnimated.View>
                                                    </TouchableOpacity>
                                                );
                                            }}
                                        >
                                            <TaskRow
                                                task={task}
                                                onToggle={() => handleToggleTask(task)}
                                                onPress={() => { }}
                                                onLongPress={() => handleDeleteTask(task)}
                                                style={styles.taskRowInner}
                                            />
                                        </WebSwipeable>
                                    </View>
                                    <View style={styles.quickActions}>
                                        <TouchableOpacity
                                            onPress={() => handleToggleTask(task)}
                                            style={styles.quickActionButton}
                                        >
                                            <View style={[styles.quickActionCircle, { backgroundColor: 'rgba(74, 222, 128, 0.15)', borderColor: 'rgba(74, 222, 128, 0.3)' }]}>
                                                <MaterialCommunityIcons name="check" size={16} color="#4ADE80" />
                                            </View>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            onPress={() => handleSnoozeTask(task)}
                                            style={styles.quickActionButton}
                                        >
                                            <View style={[styles.quickActionCircle, { backgroundColor: 'rgba(245, 158, 11, 0.15)', borderColor: 'rgba(245, 158, 11, 0.3)' }]}>
                                                <MaterialCommunityIcons name="clock-outline" size={16} color="#F59E0B" />
                                            </View>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            </Animated.View>
                        ))
                    ) : (
                        <Animated.View entering={FadeInDown.delay(600).duration(800)} style={styles.zeroStateContainer}>
                            <LinearGradient
                                colors={theme === 'dark' ? ['rgba(255,255,255,0.06)', 'rgba(255,255,255,0.02)'] : ['rgba(0,0,0,0.03)', 'rgba(0,0,0,0.01)']}
                                style={[styles.zeroStateCard, { borderColor: theme === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }]}
                            >
                                <View style={[styles.zeroStateIconWrapper, { backgroundColor: `${colors.primary}14`, borderColor: `${colors.primary}25` }]}>
                                    <MaterialCommunityIcons name="rocket-launch-outline" size={40} color={colors.primary} />
                                </View>
                                <Text style={[styles.zeroStateTitle, { color: colors.text }]}>Welcome to Daily Admin</Text>
                                <Text style={[styles.zeroStateSubtitle, { color: colors.textSecondary }]}>Your personal command center for life.</Text>

                                <View style={styles.featureList}>
                                    <View style={[styles.featureRow, { backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)', borderColor: theme === 'dark' ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)' }]}>
                                        <MaterialCommunityIcons name="credit-card-check-outline" size={20} color={colors.textSecondary} />
                                        <Text style={[styles.featureText, { color: colors.text }]}>Track subscriptions & monthly bills</Text>
                                    </View>
                                    <View style={[styles.featureRow, { backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)', borderColor: theme === 'dark' ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)' }]}>
                                        <MaterialCommunityIcons name="checkbox-marked-circle-outline" size={20} color={colors.textSecondary} />
                                        <Text style={[styles.featureText, { color: colors.text }]}>Manage household chores & tasks</Text>
                                    </View>
                                    <View style={[styles.featureRow, { backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)', borderColor: theme === 'dark' ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)' }]}>
                                        <MaterialCommunityIcons name="pill" size={20} color={colors.textSecondary} />
                                        <Text style={[styles.featureText, { color: colors.text }]}>Monitor daily habits & meds</Text>
                                    </View>
                                </View>

                                <View style={styles.ctaContainer}>
                                    <Text style={[styles.ctaText, { color: colors.primary }]}>Tap </Text>
                                    <View style={[styles.plusIconSmall, { backgroundColor: colors.primary }]}>
                                        <MaterialCommunityIcons name="plus" size={14} color="#fff" />
                                    </View>
                                    <Text style={[styles.ctaText, { color: colors.primary }]}> below to get started</Text>
                                </View>
                                <MaterialCommunityIcons name="arrow-down" size={24} color={colors.primary} style={styles.ctaArrow} />
                            </LinearGradient>
                        </Animated.View>
                    )}

                    {completedTasks.length > 0 && (
                        <View style={styles.completedSection}>
                            <View style={styles.completedHeaderRow}>
                                <View style={[styles.completedDivider, { backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)' }]} />
                                <Text style={[styles.completedSectionTitle, { color: colors.textTertiary }]}>Completed This Month</Text>
                                <View style={[styles.completedDivider, { backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)' }]} />
                            </View>
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

                <View style={styles.bottomSpacer} />
            </ScrollView>

            {modalConfig.visible && (
                <View style={styles.modalOverlay}>
                    <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFill} />
                    <TouchableOpacity
                        activeOpacity={1}
                        style={styles.modalBackdrop}
                        onPress={() => setModalConfig(prev => ({ ...prev, visible: false }))}
                    >
                        <TouchableOpacity
                            activeOpacity={1}
                            onPress={(e) => e.stopPropagation()}
                        >
                            <View style={[styles.modalCard, { backgroundColor: colors.surface, borderColor: theme === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)' }]}>
                                <View style={styles.modalHeaderSection}>
                                    {modalConfig.isDanger ? (
                                        <View style={styles.modalIconDanger}>
                                            <MaterialCommunityIcons name="delete-outline" size={30} color="#EF4444" />
                                        </View>
                                    ) : (
                                        <View style={styles.modalIconInfo}>
                                            <MaterialCommunityIcons name="information-variant" size={30} color={colors.primary} />
                                        </View>
                                    )}
                                    <Text style={[styles.modalTitle, { color: colors.text }]}>{modalConfig.title}</Text>
                                    <Text style={[styles.modalMessage, { color: colors.textSecondary }]}>
                                        {modalConfig.message}
                                    </Text>
                                </View>

                                <View style={styles.modalButtonRow}>
                                    {!modalConfig.singleButton && (
                                        <TouchableOpacity
                                            style={styles.modalCancelButton}
                                            onPress={() => setModalConfig(prev => ({ ...prev, visible: false }))}
                                        >
                                            <Text style={styles.modalCancelText}>{modalConfig.cancelText || 'Cancel'}</Text>
                                        </TouchableOpacity>
                                    )}
                                    <TouchableOpacity
                                        style={[
                                            styles.modalConfirmButton,
                                            modalConfig.isDanger ? styles.modalConfirmDanger : styles.modalConfirmPrimary
                                        ]}
                                        onPress={() => {
                                            if (modalConfig.onConfirm) modalConfig.onConfirm();
                                            else setModalConfig(prev => ({ ...prev, visible: false }));
                                        }}
                                    >
                                        <Text style={styles.modalConfirmText}>{modalConfig.confirmText || 'OK'}</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </TouchableOpacity>
                    </TouchableOpacity>
                </View>
            )}
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
        zIndex: 1000,
        paddingHorizontal: 24,
        overflow: 'hidden',
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderColor: 'rgba(255,255,255,0.06)',
        justifyContent: 'center',
        backgroundColor: 'rgba(15, 23, 42, 0.97)',
    },
    headerGlow: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 2,
    },
    topBar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        height: '100%',
        paddingBottom: 8,
    },
    brandContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        backgroundColor: 'rgba(56, 189, 248, 0.04)',
        paddingVertical: 8,
        paddingHorizontal: 14,
        borderRadius: 24,
        borderWidth: 1,
        borderColor: 'rgba(56, 189, 248, 0.1)',
    },
    brandText: {
        fontSize: 13,
        fontWeight: '800',
        color: Colors.dark.text,
        letterSpacing: 2,
    },
    settingsButton: {
        width: 42,
        height: 42,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 21,
        backgroundColor: 'rgba(255,255,255,0.04)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.06)',
    },
    scrollContent: {
        paddingHorizontal: 24,
        paddingBottom: 120,
    },
    headerWrapper: {
        marginBottom: 28,
    },
    titleContainer: {},
    dateText: {
        color: Colors.dark.primary,
        fontSize: 12,
        fontWeight: '600',
        letterSpacing: 2.5,
        marginBottom: 8,
        textTransform: 'uppercase',
        opacity: 0.9,
    },
    greetingText: {
        color: Colors.dark.text,
        fontSize: 34,
        fontWeight: '200',
        letterSpacing: -0.5,
        lineHeight: 42,
    },
    gridContainer: {
        marginBottom: 36,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    bentoCardLeft: {
        flex: 1,
        marginRight: 8,
    },
    bentoCardRight: {
        flex: 1,
        marginLeft: 8,
    },
    bentoCardActive: {
        borderWidth: 1.5,
        borderColor: Colors.dark.gold,
    },
    progressCard: {
        padding: 0,
        justifyContent: 'center',
        alignItems: 'center',
    },
    progressScaleWrapper: {
        transform: [{ scale: 0.85 }],
        alignItems: 'center',
        justifyContent: 'center',
    },
    listSection: {
        flex: 1,
    },
    sectionHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    sectionTitle: {
        color: Colors.dark.text,
        fontSize: 20,
        fontWeight: '700',
        letterSpacing: 0.3,
    },
    clearFilterButton: {
        paddingHorizontal: 14,
        paddingVertical: 6,
        borderRadius: 20,
        backgroundColor: 'rgba(56, 189, 248, 0.1)',
        borderWidth: 1,
        borderColor: 'rgba(56, 189, 248, 0.2)',
    },
    clearFilterText: {
        color: Colors.dark.primary,
        fontSize: 13,
        fontWeight: '600',
    },
    pendingBadge: {
        paddingHorizontal: 12,
        paddingVertical: 5,
        borderRadius: 16,
        backgroundColor: 'rgba(255,255,255,0.04)',
    },
    countText: {
        color: Colors.dark.textSecondary,
        fontSize: 13,
        fontWeight: '500',
    },
    taskRowWrapper: {
        marginBottom: 10,
    },
    taskRowInner: {
        marginBottom: 0,
    },
    taskRowWithActions: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    taskRowContent: {
        flex: 1,
    },
    quickActions: {
        flexDirection: 'column',
        alignItems: 'center',
        gap: 8,
        marginLeft: 10,
    },
    quickActionButton: {
        padding: 2,
    },
    quickActionCircle: {
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
    },
    deleteActionWrapper: {
        justifyContent: 'center',
        alignItems: 'center',
        width: 76,
        marginLeft: 10,
    },
    deleteActionInner: {
        width: '100%',
        height: '100%',
        borderRadius: 16,
        overflow: 'hidden',
    },
    deleteGradient: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 16,
    },
    deleteIconContainer: {
        marginBottom: 4,
    },
    deleteText: {
        color: '#fff',
        fontSize: 11,
        fontWeight: '700',
        letterSpacing: 0.5,
    },
    zeroStateContainer: {
        marginTop: 20,
        paddingHorizontal: 4,
    },
    zeroStateCard: {
        borderRadius: 28,
        padding: 36,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
    },
    zeroStateIconWrapper: {
        width: 72,
        height: 72,
        borderRadius: 36,
        backgroundColor: 'rgba(56, 189, 248, 0.08)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
        borderWidth: 1,
        borderColor: 'rgba(56, 189, 248, 0.15)',
    },
    zeroStateTitle: {
        color: Colors.dark.text,
        fontSize: 22,
        fontWeight: '700',
        marginBottom: 8,
        textAlign: 'center',
        letterSpacing: 0.3,
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
        gap: 12,
        marginBottom: 32,
    },
    featureRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        backgroundColor: 'rgba(255,255,255,0.03)',
        padding: 14,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.04)',
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
        width: 22,
        height: 22,
        borderRadius: 11,
        backgroundColor: Colors.dark.primary,
        justifyContent: 'center',
        alignItems: 'center',
        marginHorizontal: 4,
    },
    ctaArrow: {
        marginTop: 8,
        opacity: 0.7,
    },
    completedSection: {
        marginTop: 32,
    },
    completedHeaderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
        gap: 12,
    },
    completedDivider: {
        flex: 1,
        height: StyleSheet.hairlineWidth,
        backgroundColor: 'rgba(255,255,255,0.08)',
    },
    completedSectionTitle: {
        color: Colors.dark.textTertiary,
        fontSize: 13,
        fontWeight: '600',
        letterSpacing: 1,
        textTransform: 'uppercase',
    },
    bottomSpacer: {
        height: 100,
    },
    modalOverlay: {
        ...StyleSheet.absoluteFillObject,
        zIndex: 9999,
        elevation: 9999,
    },
    modalBackdrop: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.7)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalCard: {
        width: width * 0.85,
        maxWidth: 400,
        backgroundColor: '#1E293B',
        borderRadius: 28,
        padding: 28,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 16 },
        shadowOpacity: 0.6,
        shadowRadius: 32,
    },
    modalHeaderSection: {
        alignItems: 'center',
        marginBottom: 24,
    },
    modalIconDanger: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: 'rgba(239, 68, 68, 0.12)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 18,
        borderWidth: 1,
        borderColor: 'rgba(239, 68, 68, 0.2)',
    },
    modalIconInfo: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: 'rgba(56, 189, 248, 0.12)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 18,
        borderWidth: 1,
        borderColor: 'rgba(56, 189, 248, 0.2)',
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#fff',
        marginBottom: 8,
        textAlign: 'center',
        letterSpacing: 0.2,
    },
    modalMessage: {
        fontSize: 14,
        color: Colors.dark.textSecondary,
        textAlign: 'center',
        lineHeight: 20,
    },
    modalButtonRow: {
        flexDirection: 'row',
        gap: 12,
    },
    modalCancelButton: {
        flex: 1,
        paddingVertical: 15,
        borderRadius: 16,
        backgroundColor: 'rgba(255,255,255,0.06)',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.06)',
    },
    modalCancelText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 15,
    },
    modalConfirmButton: {
        flex: 1,
        paddingVertical: 15,
        borderRadius: 16,
        alignItems: 'center',
    },
    modalConfirmDanger: {
        backgroundColor: '#EF4444',
    },
    modalConfirmPrimary: {
        backgroundColor: Colors.dark.primary,
    },
    modalConfirmText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 15,
        letterSpacing: 0.3,
    },
    safeArea: {
        flex: 1,
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
});
