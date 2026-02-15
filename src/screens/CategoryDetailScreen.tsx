import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, SafeAreaView, Platform, Dimensions } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Colors from '../constants/Colors';
import { StorageService } from '../services/StorageService';
import { LifeTask, TaskCategory } from '../types';
import { TaskRow } from '../components/TaskRow';
import { NeonActionSheet } from '../components/NeonActionSheet';
import { GlassModal } from '../components/GlassModal';
import Animated, { FadeInDown } from 'react-native-reanimated';

const { width } = Dimensions.get('window');

// Mapped Gradients matching CategoriesScreen
const CATEGORY_GRADIENTS: Record<string, string[]> = {
    finance: ['#0ea5e9', '#0284c7'],
    work: ['#10b981', '#059669'],
    academic: ['#6366f1', '#4f46e5'],
    health: ['#ec4899', '#db2777'],
    housing: ['#f59e0b', '#d97706'],
    utility: ['#8b5cf6', '#7c3aed'],
    shopping: ['#f43f5e', '#e11d48'],
    entertainment: ['#f87171', '#ef4444'],
    transport: ['#64748b', '#475569'],
    other: ['#334155', '#1e293b'],
};

export default function CategoryDetailScreen({ route, navigation }: any) {
    const insets = useSafeAreaInsets();
    const { category } = route.params as { category: TaskCategory };
    const [tasks, setTasks] = useState<LifeTask[]>([]);

    // Generic Modal State
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

    const gradientColors = CATEGORY_GRADIENTS[category] || CATEGORY_GRADIENTS['other'];

    useFocusEffect(
        useCallback(() => {
            loadTasks();
        }, [])
    );

    const loadTasks = async () => {
        const allTasks = await StorageService.getTasks();

        // Filter Future Tasks Logic
        const currentMonthEnd = new Date();
        currentMonthEnd.setMonth(currentMonthEnd.getMonth() + 1, 0);
        currentMonthEnd.setHours(23, 59, 59, 999);

        // Filter by category AND visibility rules
        const filtered = allTasks
            .filter(t => {
                if (t.category !== category) return false;

                const dueDate = new Date(t.dueDate);
                const isFutureMonth = dueDate > currentMonthEnd;

                if (t.status === 'completed') return true;
                if (t.status === 'overdue') return true;
                return !isFutureMonth;
            })
            .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

        setTasks(filtered);
    };

    const handleToggleTask = async (task: LifeTask) => {
        if (task.status === 'completed') {
            const updatedTask = { ...task, status: 'pending' as const };
            await StorageService.updateTask(updatedTask);
        } else {
            await StorageService.completeTask(task.id);
        }
        loadTasks();
    };

    const getCategoryIcon = (cat: TaskCategory) => {
        switch (cat) {
            case 'finance': return 'wallet-outline';
            case 'academic': return 'school-outline';
            case 'housing': return 'home-outline';
            case 'utility': return 'lightning-bolt-outline';
            case 'work': return 'briefcase-outline';
            case 'health': return 'heart-pulse';
            case 'shopping': return 'shopping-outline';
            case 'entertainment': return 'movie-open-outline';
            case 'transport': return 'car-outline';
            default: return 'dots-horizontal';
        }
    };

    // Action Sheet State
    const [selectedTask, setSelectedTask] = useState<LifeTask | null>(null);
    const [menuVisible, setMenuVisible] = useState(false);

    const handleLongPress = (task: LifeTask) => {
        setSelectedTask(task);
        setMenuVisible(true);
    };

    const confirmDelete = async () => {
        if (selectedTask) {
            await StorageService.deleteTask(selectedTask.id);
            setMenuVisible(false);
            loadTasks();
        }
    };

    return (
        <View style={styles.container}>
            {/* Hero Header */}
            <View style={styles.heroHeader}>
                <LinearGradient
                    colors={gradientColors as any}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={StyleSheet.absoluteFill}
                />

                {/* Back Button */}
                <View style={{ marginTop: insets.top + 10 }}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <MaterialCommunityIcons name="arrow-left" size={24} color="#fff" />
                    </TouchableOpacity>
                </View>

                {/* Hero Content */}
                <Animated.View entering={FadeInDown.delay(100).springify()} style={styles.heroContent}>
                    <View style={styles.heroIconCircle}>
                        <MaterialCommunityIcons name={getCategoryIcon(category) as any} size={40} color={gradientColors[1]} />
                    </View>
                    <Text style={styles.heroTitle}>{category.charAt(0).toUpperCase() + category.slice(1)}</Text>
                    <Text style={styles.heroSubtitle}>{tasks.length} Tasks active</Text>
                </Animated.View>

                {/* Curve Overlay */}
                <View style={styles.curveOverlay} />
            </View>

            <View style={styles.contentContainer}>
                {/* Task List */}
                <FlatList
                    data={tasks}
                    keyExtractor={item => item.id}
                    contentContainerStyle={styles.listContent}
                    renderItem={({ item, index }) => (
                        <Animated.View entering={FadeInDown.delay(200 + index * 50).springify()}>
                            <TaskRow
                                task={item}
                                onToggle={() => handleToggleTask(item)}
                                onPress={() => { }}
                                onLongPress={() => handleLongPress(item)}
                            />
                        </Animated.View>
                    )}
                    ListEmptyComponent={
                        <View style={styles.emptyState}>
                            <View style={[styles.emptyIconData, { backgroundColor: `${gradientColors[0]}15` }]}>
                                <MaterialCommunityIcons name="clipboard-text-outline" size={48} color={gradientColors[0]} />
                            </View>
                            <Text style={styles.emptyText}>No tasks in this category</Text>
                            <TouchableOpacity
                                style={[styles.createButton, { backgroundColor: gradientColors[0] }]}
                                onPress={() => navigation.navigate('AddCard', { preselectedCategory: category })}
                            >
                                <Text style={[styles.createButtonText]}>Create {category} Task</Text>
                            </TouchableOpacity>
                        </View>
                    }
                />
            </View>

            <NeonActionSheet
                visible={menuVisible}
                onClose={() => setMenuVisible(false)}
                onDelete={confirmDelete}
                title={selectedTask?.title || "Task Options"}
            />

            <GlassModal
                visible={modalConfig.visible}
                title={modalConfig.title}
                message={modalConfig.message}
                confirmText={modalConfig.confirmText}
                cancelText={modalConfig.cancelText}
                onConfirm={() => {
                    if (modalConfig.onConfirm) modalConfig.onConfirm();
                    else setModalConfig(prev => ({ ...prev, visible: false }));
                }}
                onCancel={() => setModalConfig(prev => ({ ...prev, visible: false }))}
                isDanger={modalConfig.isDanger}
                singleButton={modalConfig.singleButton}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.dark.background,
    },
    heroHeader: {
        paddingBottom: 40, // Space for curve
        position: 'relative',
        justifyContent: 'flex-start',
    },
    backButton: {
        width: 44,
        height: 44,
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 16,
        backgroundColor: 'rgba(0,0,0,0.2)',
        borderRadius: 22,
    },
    heroContent: {
        alignItems: 'center',
        marginTop: 10,
        marginBottom: 20,
    },
    heroIconCircle: {
        width: 72,
        height: 72,
        borderRadius: 36,
        backgroundColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 10,
    },
    heroTitle: {
        fontSize: 32,
        fontWeight: '800',
        color: '#fff',
        letterSpacing: -1,
        marginBottom: 4,
        textShadowColor: 'rgba(0,0,0,0.3)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 4,
    },
    heroSubtitle: {
        fontSize: 16,
        color: 'rgba(255,255,255,0.8)',
        fontWeight: '600',
    },
    curveOverlay: {
        position: 'absolute',
        bottom: -1,
        left: 0,
        right: 0,
        height: 30,
        backgroundColor: Colors.dark.background,
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
    },
    contentContainer: {
        flex: 1,
        marginTop: -10, // Pull up slightly under the curve
    },
    listContent: {
        padding: 20,
        paddingBottom: 100,
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 60,
        gap: 16,
    },
    emptyIconData: {
        width: 100,
        height: 100,
        borderRadius: 50,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 10,
    },
    emptyText: {
        color: Colors.dark.textSecondary,
        fontSize: 18,
        fontWeight: '500',
    },
    createButton: {
        paddingHorizontal: 24,
        paddingVertical: 14,
        borderRadius: 30,
        marginTop: 10,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    createButtonText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 16,
    }
});
