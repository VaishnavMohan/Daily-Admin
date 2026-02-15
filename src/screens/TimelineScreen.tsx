import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, StatusBar, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import Colors from '../constants/Colors';
import { StorageService } from '../services/StorageService';
import { LifeTask, TaskCategory } from '../types';

interface TimelineMarker {
    id: string;
    type: 'marker';
    date: number;
}

interface TimelineHeader {
    id: string;
    type: 'header';
    title: string;
}

type TimelineItem = LifeTask | TimelineMarker | TimelineHeader;

export default function TimelineScreen({ navigation }: any) {
    const insets = useSafeAreaInsets();
    const [flatData, setFlatData] = useState<TimelineItem[]>([]);
    const [allData, setAllData] = useState<TimelineItem[]>([]);
    const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'completed'>('all');
    const flatListRef = React.useRef<FlatList>(null);
    const [initialIndex, setInitialIndex] = useState<number | null>(null);

    useFocusEffect(
        useCallback(() => {
            loadTimeline();
        }, [])
    );

    useEffect(() => {
        if (initialIndex !== null && flatListRef.current && flatData.length > 0) {
            const validIndex = Math.min(initialIndex, flatData.length - 1);
            if (validIndex >= 0) {
                setTimeout(() => {
                    flatListRef.current?.scrollToIndex({
                        index: validIndex,
                        animated: true,
                        viewPosition: 0
                    });
                }, 100);
            }
        }
    }, [initialIndex, flatData]);

    useEffect(() => {
        setInitialIndex(null);
        applyFilter(allData, statusFilter);
    }, [statusFilter]);

    const loadTimeline = async () => {
        const data = await StorageService.getTasks();

        const timelineTasks = data.filter(task => {
            if (task.type === 'expense') return false;
            const type = task.type ? task.type.toLowerCase() : '';
            if (type !== 'bill' && type !== 'checklist') return false;
            return true;
        });

        const currentMonthEnd = new Date();
        currentMonthEnd.setMonth(currentMonthEnd.getMonth() + 1, 0);
        currentMonthEnd.setHours(23, 59, 59, 999);

        const visibleTasks = timelineTasks.filter(t => {
            const dueDate = new Date(t.dueDate);
            const isFutureMonth = dueDate > currentMonthEnd;
            if (t.status === 'completed') return true;
            if (t.status === 'overdue') return true;
            return !isFutureMonth;
        });

        const sortedTasks = [...visibleTasks].sort((a, b) => {
            return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
        });

        const flattened: TimelineItem[] = [];
        const groups: Record<string, TimelineItem[]> = {};

        const getGroupKey = (date: Date) => date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

        sortedTasks.forEach(task => {
            const date = new Date(task.dueDate);
            if (isNaN(date.getTime())) return;
            const key = getGroupKey(date);
            if (!groups[key]) groups[key] = [];
            groups[key].push(task);
        });

        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const todayTime = todayStart.getTime();

        const todayMarker: TimelineMarker = {
            id: 'today-marker',
            type: 'marker',
            date: todayTime
        };

        let tasksAndMarker: (LifeTask | TimelineMarker)[] = [...sortedTasks];
        let insertIndex = sortedTasks.findIndex(t => new Date(t.dueDate).getTime() >= todayTime);
        if (insertIndex === -1) insertIndex = sortedTasks.length;
        tasksAndMarker.splice(insertIndex, 0, todayMarker);

        let currentHeader = '';

        tasksAndMarker.forEach((item) => {
            let itemDate: Date;
            if ('type' in item && item.type === 'marker') {
                itemDate = new Date(item.date);
            } else {
                itemDate = new Date((item as LifeTask).dueDate);
            }

            const headerKey = getGroupKey(itemDate);

            if (headerKey !== currentHeader) {
                flattened.push({
                    id: `header-${headerKey}`,
                    type: 'header',
                    title: headerKey
                });
                currentHeader = headerKey;
            }
            flattened.push(item);
        });

        setAllData(flattened);
        applyFilter(flattened, statusFilter);

        const markerIndex = flattened.findIndex(item => 'type' in item && item.type === 'marker');
        if (markerIndex !== -1) {
            setInitialIndex(markerIndex > 0 ? markerIndex - 1 : 0);
        }
    };

    const applyFilter = (data: TimelineItem[], filter: 'all' | 'pending' | 'completed') => {
        if (filter === 'all') {
            setFlatData(data);
            return;
        }

        const result: TimelineItem[] = [];
        let pendingHeader: TimelineHeader | null = null;

        data.forEach((item) => {
            const itemType = (item as any).type;

            if (itemType === 'header' || itemType === 'marker') {
                if (itemType === 'header') {
                    pendingHeader = item as TimelineHeader;
                } else if (itemType === 'marker') {
                    if (pendingHeader) {
                        result.push(pendingHeader);
                        pendingHeader = null;
                    }
                    result.push(item as TimelineMarker);
                }
            } else {
                const task = item as LifeTask;
                const shouldInclude =
                    (filter === 'pending' && (task.status === 'pending' || task.status === 'overdue')) ||
                    (filter === 'completed' && task.status === 'completed');

                if (shouldInclude) {
                    if (pendingHeader) {
                        result.push(pendingHeader);
                        pendingHeader = null;
                    }
                    result.push(task);
                }
            }
        });

        setFlatData(result);
    };

    const getCategoryIcon = (category: TaskCategory) => {
        switch (category) {
            case 'finance': return 'credit-card-outline';
            case 'academic': return 'school-outline';
            case 'housing': return 'home-outline';
            case 'utility': return 'lightning-bolt-outline';
            case 'work': return 'briefcase-outline';
            default: return 'checkbox-blank-circle-outline';
        }
    };

    const getCategoryColor = (category: TaskCategory) => {
        switch (category) {
            case 'finance': return Colors.dark.primary;
            case 'academic': return '#60a5fa';
            case 'housing': return '#f472b6';
            case 'utility': return '#a78bfa';
            default: return Colors.dark.textSecondary;
        }
    };

    const handleToggleTask = async (task: LifeTask) => {
        if (task.status === 'completed') {
            const updatedTask = { ...task, status: 'pending' as const };
            await StorageService.updateTask(updatedTask);
        } else {
            await StorageService.completeTask(task.id);
        }
        loadTimeline();
    };


    const renderMarker = () => {
        const dateStr = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).toUpperCase();
        return (
            <Animated.View entering={FadeInDown.duration(500).delay(200)} style={styles.markerContainer}>
                <LinearGradient
                    colors={[Colors.dark.primary, 'transparent']}
                    start={{ x: 1, y: 0 }}
                    end={{ x: 0, y: 0 }}
                    style={styles.markerLineLeft}
                />
                <View style={styles.markerPill}>
                    <LinearGradient
                        colors={[Colors.dark.primary, '#0EA5E9']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.markerPillGradient}
                    >
                        <MaterialCommunityIcons name="arrow-right-drop-circle" size={14} color="#fff" />
                        <Text style={styles.markerText}>TODAY • {dateStr}</Text>
                    </LinearGradient>
                </View>
                <LinearGradient
                    colors={['transparent', Colors.dark.primary]}
                    start={{ x: 1, y: 0 }}
                    end={{ x: 0, y: 0 }}
                    style={styles.markerLineRight}
                />
            </Animated.View>
        );
    };

    const renderItem = ({ item, index }: { item: TimelineItem, index: number }) => {
        if ('type' in item) {
            if (item.type === 'marker') return renderMarker();
            if (item.type === 'header') return renderHeaderItem(item.title, index);
        }

        return renderTaskItem(item as LifeTask, index);
    };

    const renderHeaderItem = (title: string, index: number) => (
        <Animated.View entering={FadeInDown.duration(400).delay(Math.min(index * 50, 300))} style={styles.monthHeader}>
            <View style={styles.monthHeaderAccent} />
            <Text style={styles.monthTitle}>{title}</Text>
        </Animated.View>
    );

    const renderTaskItem = (item: LifeTask, index: number) => {
        const date = new Date(item.dueDate);
        const day = date.getDate();
        const dow = date.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const taskDate = new Date(item.dueDate);
        taskDate.setHours(0, 0, 0, 0);
        const diffTime = taskDate.getTime() - today.getTime();
        const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        const isUrgent = daysLeft <= 3 && item.status !== 'completed';
        const isCompleted = item.status === 'completed';
        const catColor = getCategoryColor(item.category);

        return (
            <Animated.View entering={FadeInDown.duration(400).delay(Math.min(index * 60, 400))} style={styles.timelineItem}>
                <View style={[styles.dateColumn, isCompleted && { opacity: 0.4 }]}>
                    <Text style={styles.dayText}>{day}</Text>
                    <Text style={styles.dowText}>{dow}</Text>
                </View>

                <View style={styles.lineWrapper}>
                    <View style={[
                        styles.dotOuter,
                        isCompleted ? { borderColor: Colors.dark.success }
                            : isUrgent ? { borderColor: Colors.dark.danger }
                                : { borderColor: catColor }
                    ]}>
                        <View style={[
                            styles.dotInner,
                            isCompleted ? { backgroundColor: Colors.dark.success }
                                : isUrgent ? { backgroundColor: Colors.dark.danger }
                                    : { backgroundColor: catColor }
                        ]} />
                    </View>
                    <View style={styles.line} />
                </View>

                <TouchableOpacity
                    style={[styles.cardContainer, isCompleted && { opacity: 0.55 }]}
                    activeOpacity={0.7}
                    onPress={() => navigation.navigate('CategoryDetail', { category: item.category })}
                >
                    <View style={styles.cardOuter}>
                        <View style={[styles.cardAccentStripe, { backgroundColor: catColor }]} />
                        <LinearGradient
                            colors={['rgba(255,255,255,0.07)', 'rgba(255,255,255,0.02)']}
                            style={styles.cardGradient}
                        >
                            <View style={styles.cardHeader}>
                                <View style={styles.cardCategoryRow}>
                                    <View style={[styles.categoryIconWrap, { backgroundColor: `${catColor}18` }]}>
                                        <MaterialCommunityIcons
                                            name={getCategoryIcon(item.category) as any}
                                            size={14}
                                            color={catColor}
                                        />
                                    </View>
                                    <Text style={[styles.categoryText, { color: catColor }]}>{item.category.toUpperCase()}</Text>
                                </View>
                                <TouchableOpacity onPress={() => handleToggleTask(item)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                                    <MaterialCommunityIcons
                                        name={isCompleted ? "check-circle" : "checkbox-blank-circle-outline"}
                                        size={22}
                                        color={isCompleted ? Colors.dark.success : Colors.dark.textTertiary}
                                    />
                                </TouchableOpacity>
                            </View>

                            <Text style={[styles.taskTitle, isCompleted && styles.taskTitleCompleted]}>{item.title}</Text>
                            <Text style={styles.taskSubtitle}>{item.subtitle}</Text>

                            {!isCompleted && (
                                <View style={styles.statusRow}>
                                    <View style={[styles.statusBadge, isUrgent && styles.statusBadgeUrgent]}>
                                        <MaterialCommunityIcons
                                            name={isUrgent ? "alert-circle-outline" : "clock-outline"}
                                            size={12}
                                            color={isUrgent ? Colors.dark.danger : Colors.dark.primary}
                                        />
                                        <Text style={[styles.statusText, isUrgent && { color: Colors.dark.danger }]}>
                                            {daysLeft < 0 ? 'OVERDUE' : daysLeft === 0 ? 'DUE TODAY' : daysLeft === 1 ? 'TOMORROW' : `${daysLeft} Days Left`}
                                        </Text>
                                    </View>
                                </View>
                            )}
                            {isCompleted && (
                                <View style={styles.statusRow}>
                                    <View style={styles.completedBadge}>
                                        <MaterialCommunityIcons name="check-bold" size={10} color={Colors.dark.success} />
                                        <Text style={styles.completedText}>COMPLETED</Text>
                                    </View>
                                </View>
                            )}
                        </LinearGradient>
                    </View>
                </TouchableOpacity>
            </Animated.View>
        );
    };

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={Colors.dark.gradients.AppBackground as unknown as string[]}
                style={StyleSheet.absoluteFill}
            />
            <View style={[styles.screenContent, { paddingTop: insets.top }]}>
                <BlurView intensity={40} tint="dark" style={styles.headerBlur}>
                    <View style={styles.header}>
                        <View style={styles.headerTopRow}>
                            <View>
                                <Text style={styles.headerTitle}>Timeline</Text>
                                <Text style={styles.subHeader}>Upcoming Tasks & Bills</Text>
                            </View>
                            <View style={styles.headerIconWrap}>
                                <MaterialCommunityIcons name="timeline-clock-outline" size={24} color={Colors.dark.primary} />
                            </View>
                        </View>

                        <View style={styles.filterContainer}>
                            {(['all', 'pending', 'completed'] as const).map((filter) => (
                                <TouchableOpacity
                                    key={filter}
                                    style={[
                                        styles.filterBtn,
                                        statusFilter === filter && styles.filterBtnActive
                                    ]}
                                    onPress={() => setStatusFilter(filter)}
                                    activeOpacity={0.7}
                                >
                                    {statusFilter === filter && (
                                        <LinearGradient
                                            colors={[Colors.dark.primary, '#0EA5E9']}
                                            start={{ x: 0, y: 0 }}
                                            end={{ x: 1, y: 1 }}
                                            style={StyleSheet.absoluteFill}
                                        />
                                    )}
                                    <Text style={[
                                        styles.filterText,
                                        statusFilter === filter && styles.filterTextActive
                                    ]}>
                                        {filter === 'all' ? 'All' : filter === 'pending' ? 'Pending' : 'Done'}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                </BlurView>

                <FlatList
                    ref={flatListRef}
                    data={flatData}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={{ paddingBottom: 100, paddingTop: 8 }}
                    renderItem={renderItem}
                    onScrollToIndexFailed={(info) => {
                        const wait = new Promise(resolve => setTimeout(resolve, 500));
                        wait.then(() => {
                            flatListRef.current?.scrollToIndex({ index: info.index, animated: true });
                        });
                    }}
                    ListEmptyComponent={
                        <View style={styles.emptyState}>
                            <MaterialCommunityIcons name="calendar-blank-outline" size={48} color={Colors.dark.textTertiary} />
                            <Text style={styles.emptyTitle}>No Tasks Found</Text>
                            <Text style={styles.emptyText}>Your timeline is clear</Text>
                        </View>
                    }
                    showsVerticalScrollIndicator={false}
                />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.dark.background,
    },
    screenContent: {
        flex: 1,
    },
    headerBlur: {
        overflow: 'hidden',
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.06)',
    },
    header: {
        paddingHorizontal: 24,
        paddingBottom: 16,
        paddingTop: 12,
    },
    headerTopRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    headerTitle: {
        fontSize: 32,
        fontWeight: '800',
        color: Colors.dark.white,
        letterSpacing: -0.5,
    },
    subHeader: {
        fontSize: 14,
        color: Colors.dark.textSecondary,
        fontWeight: '500',
        marginTop: 2,
        letterSpacing: 0.2,
    },
    headerIconWrap: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(56, 189, 248, 0.1)',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'rgba(56, 189, 248, 0.15)',
    },
    monthHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 24,
        marginTop: 8,
        marginBottom: 4,
    },
    monthHeaderAccent: {
        width: 3,
        height: 16,
        borderRadius: 2,
        backgroundColor: Colors.dark.primary,
        marginRight: 10,
    },
    monthTitle: {
        color: Colors.dark.textSecondary,
        fontSize: 13,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 1.5,
    },
    timelineItem: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        marginBottom: 0,
    },
    dateColumn: {
        width: 48,
        alignItems: 'center',
        paddingTop: 18,
    },
    dayText: {
        fontSize: 22,
        fontWeight: '700',
        color: Colors.dark.white,
        letterSpacing: -0.5,
    },
    dowText: {
        fontSize: 10,
        color: Colors.dark.textTertiary,
        fontWeight: '600',
        marginTop: 2,
        letterSpacing: 0.5,
    },
    lineWrapper: {
        width: 24,
        alignItems: 'center',
    },
    dotOuter: {
        width: 14,
        height: 14,
        borderRadius: 7,
        marginTop: 22,
        zIndex: 10,
        borderWidth: 2,
        backgroundColor: Colors.dark.background,
        alignItems: 'center',
        justifyContent: 'center',
    },
    dotInner: {
        width: 6,
        height: 6,
        borderRadius: 3,
    },
    line: {
        width: 1.5,
        backgroundColor: 'rgba(255,255,255,0.08)',
        position: 'absolute',
        top: 36,
        bottom: -16,
    },
    cardContainer: {
        flex: 1,
        marginLeft: 8,
        marginBottom: 12,
        paddingTop: 8,
    },
    cardOuter: {
        borderRadius: 16,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.07)',
        flexDirection: 'row',
    },
    cardAccentStripe: {
        width: 3,
    },
    cardGradient: {
        flex: 1,
        padding: 14,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    cardCategoryRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    categoryIconWrap: {
        width: 24,
        height: 24,
        borderRadius: 6,
        alignItems: 'center',
        justifyContent: 'center',
    },
    categoryText: {
        fontSize: 10,
        fontWeight: '700',
        letterSpacing: 0.8,
    },
    taskTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: Colors.dark.white,
        marginBottom: 2,
        letterSpacing: -0.2,
    },
    taskTitleCompleted: {
        textDecorationLine: 'line-through',
        opacity: 0.7,
    },
    taskSubtitle: {
        fontSize: 12,
        color: Colors.dark.textTertiary,
        marginBottom: 8,
        lineHeight: 16,
    },
    statusRow: {
        flexDirection: 'row',
        marginTop: 2,
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: 'rgba(56, 189, 248, 0.1)',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 6,
    },
    statusBadgeUrgent: {
        backgroundColor: 'rgba(248, 113, 113, 0.12)',
    },
    statusText: {
        fontSize: 11,
        fontWeight: '700',
        color: Colors.dark.primary,
        letterSpacing: 0.3,
    },
    completedBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: 'rgba(74, 222, 128, 0.1)',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 6,
    },
    completedText: {
        color: Colors.dark.success,
        fontSize: 11,
        fontWeight: '700',
        letterSpacing: 0.3,
    },
    emptyState: {
        padding: 60,
        alignItems: 'center',
        gap: 8,
    },
    emptyTitle: {
        color: Colors.dark.textSecondary,
        fontSize: 16,
        fontWeight: '600',
        marginTop: 8,
    },
    emptyText: {
        color: Colors.dark.textTertiary,
        fontSize: 13,
    },
    markerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        marginVertical: 20,
    },
    markerLineLeft: {
        flex: 1,
        height: 1.5,
    },
    markerLineRight: {
        flex: 1,
        height: 1.5,
    },
    markerPill: {
        marginHorizontal: 12,
        borderRadius: 20,
        overflow: 'hidden',
        shadowColor: Colors.dark.primary,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.5,
        shadowRadius: 12,
        elevation: 8,
    },
    markerPillGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 16,
        paddingVertical: 6,
    },
    markerText: {
        color: '#ffffff',
        fontSize: 11,
        fontWeight: '800',
        letterSpacing: 1.2,
    },
    filterContainer: {
        flexDirection: 'row',
        backgroundColor: 'rgba(255,255,255,0.04)',
        borderRadius: 14,
        padding: 3,
        marginTop: 16,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.06)',
    },
    filterBtn: {
        flex: 1,
        paddingVertical: 8,
        alignItems: 'center',
        borderRadius: 11,
        overflow: 'hidden',
    },
    filterBtnActive: {
        shadowColor: Colors.dark.primary,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
        elevation: 4,
    },
    filterText: {
        fontSize: 13,
        fontWeight: '600',
        color: Colors.dark.textTertiary,
    },
    filterTextActive: {
        color: '#fff',
        fontWeight: '700',
    },
});
