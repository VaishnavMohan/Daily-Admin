import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, StatusBar, SafeAreaView, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
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
    const [flatData, setFlatData] = useState<TimelineItem[]>([]);
    const [allData, setAllData] = useState<TimelineItem[]>([]); // Store unfiltered data
    const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'completed'>('all');
    const flatListRef = React.useRef<FlatList>(null);
    const [initialIndex, setInitialIndex] = useState<number | null>(null);

    useFocusEffect(
        useCallback(() => {
            loadTimeline();
        }, [])
    );

    // Scroll effect
    useEffect(() => {
        if (initialIndex !== null && flatListRef.current && flatData.length > 0) {
            // Validate index is within bounds
            const validIndex = Math.min(initialIndex, flatData.length - 1);
            if (validIndex >= 0) {
                // Small timeout to ensure layout is ready
                setTimeout(() => {
                    flatListRef.current?.scrollToIndex({
                        index: validIndex,
                        animated: true,
                        viewPosition: 0 // Top of the screen
                    });
                }, 100);
            }
        }
    }, [initialIndex, flatData]);

    // Filter change effect
    useEffect(() => {
        setInitialIndex(null); // Reset scroll position when filter changes
        applyFilter(allData, statusFilter);
    }, [statusFilter]);

    const loadTimeline = async () => {
        const data = await StorageService.getTasks();

        // Filter out daily and weekly tasks - they belong in Daily Habits section
        const timelineTasks = data.filter(task => {
            return task.recurrence === 'monthly' ||
                task.recurrence === 'yearly' ||
                task.recurrence === 'once';
        });

        // 1. Filter Logic - Only show current + next month
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

        // 2. Sort Logic
        const sortedTasks = [...visibleTasks].sort((a, b) => {
            return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
        });

        // 3. Flattening Logic
        const flattened: TimelineItem[] = [];
        const groups: Record<string, TimelineItem[]> = {};

        // Helper to get group key
        const getGroupKey = (date: Date) => date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

        // Divide tasks into groups first
        sortedTasks.forEach(task => {
            const date = new Date(task.dueDate);
            if (isNaN(date.getTime())) return;
            const key = getGroupKey(date);
            if (!groups[key]) groups[key] = [];
            groups[key].push(task);
        });

        // Create Marker
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const todayTime = todayStart.getTime();

        const todayMarker: TimelineMarker = {
            id: 'today-marker',
            type: 'marker',
            date: todayTime
        };

        // Inject Marker logic into groups? 
        // Better: Convert groups to array, INJECT MARKER globally, then re-flatten?
        // Actually, just injecting into the sorted list and then grouping-headers is safer.

        let tasksAndMarker: (LifeTask | TimelineMarker)[] = [...sortedTasks];
        let insertIndex = sortedTasks.findIndex(t => new Date(t.dueDate).getTime() >= todayTime);
        if (insertIndex === -1) insertIndex = sortedTasks.length;
        tasksAndMarker.splice(insertIndex, 0, todayMarker);

        // Now build the final flat list
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
                // Push new header
                flattened.push({
                    id: `header-${headerKey}`,
                    type: 'header',
                    title: headerKey
                });
                currentHeader = headerKey;
            }
            flattened.push(item);
        });

        setAllData(flattened); // Store all data
        applyFilter(flattened, statusFilter); // Apply current filter

        // Find Marker Index for Auto-Scroll
        const markerIndex = flattened.findIndex(item => 'type' in item && item.type === 'marker');
        if (markerIndex !== -1) {
            // Scroll to just before the marker? Or exact marker?
            // User wants "Today section first", so scrolling marker to top is ideal.
            setInitialIndex(markerIndex > 0 ? markerIndex - 1 : 0); // Show Header or Marker
        }
    };

    const applyFilter = (data: TimelineItem[], filter: 'all' | 'pending' | 'completed') => {
        console.log('🔍 Applying filter:', filter, 'Data items:', data.length);

        if (filter === 'all') {
            setFlatData(data);
            return;
        }

        const result: TimelineItem[] = [];
        let pendingHeader: TimelineHeader | null = null;

        data.forEach((item, index) => {
            // Check if it's a header or marker specifically
            const itemType = (item as any).type;
            console.log(`  [${index}]`, itemType ? `Type: ${itemType}` : 'Task');

            if (itemType === 'header' || itemType === 'marker') {
                // It's metadata (header or marker)
                if (itemType === 'header') {
                    // Store the header, we'll add it only if tasks follow
                    pendingHeader = item as TimelineHeader;
                } else if (itemType === 'marker') {
                    // Add pending header before marker if exists
                    if (pendingHeader) {
                        result.push(pendingHeader);
                        pendingHeader = null;
                    }
                    result.push(item as TimelineMarker);
                }
            } else {
                // It's a task (bill, checklist, etc.)
                const task = item as LifeTask;
                console.log(`    Status: ${task.status}`);

                const shouldInclude =
                    (filter === 'pending' && (task.status === 'pending' || task.status === 'overdue')) ||
                    (filter === 'completed' && task.status === 'completed');

                if (shouldInclude) {
                    console.log('    ✓ Including');
                    // Add the pending header before the first matching task
                    if (pendingHeader) {
                        result.push(pendingHeader);
                        pendingHeader = null;
                    }
                    result.push(task);
                }
            }
        });

        console.log('📊 Filter result:', result.length, 'items');
        setFlatData(result);
    };

    // ... (Keep helper functions like getCategoryIcon, etc.) ...
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
            case 'academic': return '#60a5fa'; // Blue
            case 'housing': return '#f472b6'; // Pink
            case 'utility': return '#a78bfa'; // Purple
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
            <View style={styles.markerContainer}>
                <View style={styles.markerLine} />
                <View style={styles.markerPill}>
                    <Text style={styles.markerText}>TODAY • {dateStr}</Text>
                </View>
                <View style={styles.markerLine} />
            </View>
        );
    };

    const renderItem = ({ item, index }: { item: TimelineItem, index: number }) => {
        if ('type' in item) {
            if (item.type === 'marker') return renderMarker();
            if (item.type === 'header') return renderHeaderItem(item.title);
        }

        // Render Task
        return renderTaskItem(item as LifeTask);
    };

    const renderHeaderItem = (title: string) => (
        <View style={styles.monthHeader}>
            <Text style={styles.monthTitle}>{title}</Text>
        </View>
    );

    const renderTaskItem = (item: LifeTask) => {
        const date = new Date(item.dueDate);
        const day = date.getDate();
        const dow = date.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();

        // Days Left Calculation
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const taskDate = new Date(item.dueDate);
        taskDate.setHours(0, 0, 0, 0);
        const diffTime = taskDate.getTime() - today.getTime();
        const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        const isUrgent = daysLeft <= 3 && item.status !== 'completed';
        const isCompleted = item.status === 'completed';

        return (
            <View style={styles.timelineItem}>
                {/* Left: Date */}
                <View style={[styles.dateColumn, isCompleted && { opacity: 0.5 }]}>
                    <Text style={styles.dayText}>{day}</Text>
                    <Text style={styles.dowText}>{dow}</Text>
                </View>

                {/* Timeline Line */}
                <View style={styles.lineWrapper}>
                    <View style={[
                        styles.dot,
                        isCompleted ? { backgroundColor: Colors.dark.success, borderColor: Colors.dark.success }
                            : isUrgent ? { backgroundColor: Colors.dark.danger, borderColor: Colors.dark.danger }
                                : { backgroundColor: Colors.dark.border, borderColor: Colors.dark.primary }
                    ]} />
                    <View style={styles.line} />
                </View>

                {/* Right: Card */}
                <TouchableOpacity
                    style={[styles.cardContainer, isCompleted && { opacity: 0.6 }]}
                    activeOpacity={0.7}
                    onPress={() => navigation.navigate('CategoryDetail', { category: item.category })}
                >
                    <LinearGradient
                        colors={['rgba(255,255,255,0.05)', 'rgba(255,255,255,0.02)']}
                        style={styles.cardGradient}
                    >
                        <View style={styles.cardHeader}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                <MaterialCommunityIcons
                                    name={getCategoryIcon(item.category) as any}
                                    size={16}
                                    color={getCategoryColor(item.category)}
                                />
                                <Text style={styles.categoryText}>{item.category.toUpperCase()}</Text>
                            </View>
                            <TouchableOpacity onPress={() => handleToggleTask(item)}>
                                <MaterialCommunityIcons
                                    name={isCompleted ? "check-circle" : "checkbox-blank-circle-outline"}
                                    size={20}
                                    color={isCompleted ? Colors.dark.success : Colors.dark.textSecondary}
                                />
                            </TouchableOpacity>
                        </View>

                        <Text style={styles.taskTitle}>{item.title}</Text>
                        <Text style={styles.taskSubtitle}>{item.subtitle}</Text>

                        {!isCompleted && (
                            <Text style={[styles.statusText, isUrgent && { color: Colors.dark.danger }]}>
                                {daysLeft < 0 ? 'OVERDUE' : daysLeft === 0 ? 'DUE TODAY' : daysLeft === 1 ? 'TOMORROW' : `${daysLeft} Days Left`}
                            </Text>
                        )}
                        {isCompleted && (
                            <Text style={{ color: Colors.dark.success, fontSize: 12, fontWeight: '600', marginTop: 4 }}>COMPLETED</Text>
                        )}
                    </LinearGradient>
                </TouchableOpacity>
            </View>
        );
    };

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={['#020617', '#0f172a']}
                style={StyleSheet.absoluteFill}
            />
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>Timeline</Text>
                    <Text style={styles.subHeader}>Upcoming Tasks</Text>

                    {/* Filter Segmented Control */}
                    <View style={styles.filterContainer}>
                        {(['all', 'pending', 'completed'] as const).map((filter) => (
                            <TouchableOpacity
                                key={filter}
                                style={[
                                    styles.filterBtn,
                                    statusFilter === filter && styles.filterBtnActive
                                ]}
                                onPress={() => setStatusFilter(filter)}
                            >
                                <Text style={[
                                    styles.filterText,
                                    statusFilter === filter && styles.filterTextActive
                                ]}>
                                    {filter === 'all' ? 'All' : filter === 'pending' ? 'Pending' : 'Completed'}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                <FlatList
                    ref={flatListRef}
                    data={flatData}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={{ paddingBottom: 100 }}
                    renderItem={renderItem}
                    onScrollToIndexFailed={(info) => {
                        const wait = new Promise(resolve => setTimeout(resolve, 500));
                        wait.then(() => {
                            flatListRef.current?.scrollToIndex({ index: info.index, animated: true });
                        });
                    }}
                    ListEmptyComponent={
                        <View style={styles.emptyState}>
                            <Text style={styles.emptyText}>No Tasks Found</Text>
                        </View>
                    }
                />
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.dark.background,
    },
    safeArea: {
        flex: 1,
        paddingTop: Platform.OS === 'android' ? 40 : 0,
    },
    header: {
        paddingHorizontal: 24,
        paddingBottom: 16,
        paddingTop: 10,
    },
    headerTitle: {
        fontSize: 34,
        fontWeight: '800',
        color: Colors.dark.white,
    },
    subHeader: {
        fontSize: 14,
        color: Colors.dark.primary,
        fontWeight: '600',
        marginTop: 4,
    },
    monthSection: {
        marginBottom: 20,
    },
    monthHeader: {
        backgroundColor: 'rgba(15, 23, 42, 0.9)',
        paddingVertical: 8,
        paddingHorizontal: 24,
        marginBottom: 10,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.05)',
    },
    monthTitle: {
        color: Colors.dark.textSecondary,
        fontSize: 13,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    timelineItem: {
        flexDirection: 'row',
        paddingHorizontal: 24,
        marginBottom: 0, // Continuous line look
    },
    dateColumn: {
        width: 50,
        alignItems: 'center',
        paddingTop: 16,
    },
    dayText: {
        fontSize: 20,
        fontWeight: 'bold',
        color: Colors.dark.white,
    },
    dowText: {
        fontSize: 10,
        color: Colors.dark.textSecondary,
        fontWeight: '600',
        marginTop: 2,
    },
    lineWrapper: {
        width: 20,
        alignItems: 'center',
    },
    dot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        marginTop: 22,
        zIndex: 10,
        borderWidth: 2,
        borderColor: Colors.dark.background,
    },
    line: {
        width: 2,
        backgroundColor: 'rgba(255,255,255,0.1)',
        position: 'absolute',
        top: 32,
        bottom: -22, // Connect to next item
    },
    cardContainer: {
        flex: 1,
        marginLeft: 10,
        marginBottom: 16,
        paddingTop: 8,
    },
    cardGradient: {
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    categoryText: {
        fontSize: 10,
        fontWeight: '700',
        color: Colors.dark.textSecondary,
        letterSpacing: 0.5,
    },
    taskTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: Colors.dark.white,
        marginBottom: 2,
    },
    taskSubtitle: {
        fontSize: 12,
        color: Colors.dark.textSecondary,
        marginBottom: 8,
    },
    statusText: {
        fontSize: 12,
        fontWeight: '700',
        color: Colors.dark.primary,
    },
    emptyState: {
        padding: 40,
        alignItems: 'center',
    },
    emptyText: {
        color: Colors.dark.textSecondary
    },
    markerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 24,
        marginVertical: 16,
    },
    markerLine: {
        flex: 1,
        height: 1,
        backgroundColor: Colors.dark.primary, // Neon connection
        opacity: 0.5,
    },
    markerPill: {
        backgroundColor: Colors.dark.primary,
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
        marginHorizontal: 12,
        shadowColor: Colors.dark.primary,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.6,
        shadowRadius: 8,
        elevation: 6,
    },
    markerText: {
        color: '#ffffff',
        fontSize: 10,
        fontWeight: 'bold',
        letterSpacing: 1,
    },
    filterContainer: {
        flexDirection: 'row',
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 12,
        padding: 4,
        marginTop: 16,
        gap: 4,
    },
    filterBtn: {
        flex: 1,
        paddingVertical: 8,
        alignItems: 'center',
        borderRadius: 8,
    },
    filterBtnActive: {
        backgroundColor: Colors.dark.gold,
    },
    filterText: {
        fontSize: 13,
        fontWeight: '600',
        color: Colors.dark.textSecondary,
    },
    filterTextActive: {
        color: '#000',
        fontWeight: '700',
    }
});
