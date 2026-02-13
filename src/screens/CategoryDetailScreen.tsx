import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, SafeAreaView, Platform, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Colors from '../constants/Colors';
import { StorageService } from '../services/StorageService';
import { LifeTask, TaskCategory } from '../types';
import { TaskRow } from '../components/TaskRow';
import { NeonActionSheet } from '../components/NeonActionSheet';

export default function CategoryDetailScreen({ route, navigation }: any) {
    const { category } = route.params as { category: TaskCategory };
    const [tasks, setTasks] = useState<LifeTask[]>([]);

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

    const handleDeleteTask = (task: LifeTask) => {
        Alert.alert(
            "Delete Task",
            `Are you sure you want to delete "${task.title}"?`,
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: async () => {
                        await StorageService.deleteTask(task.id);
                        loadTasks();
                    }
                }
            ]
        );
    };

    const getCategoryColor = (cat: TaskCategory) => {
        switch (cat) {
            case 'finance': return Colors.dark.primary;
            case 'academic': return '#60a5fa';
            case 'housing': return '#f472b6';
            case 'utility': return '#a78bfa';
            case 'work': return '#34d399';
            case 'health': return '#f87171';
            default: return Colors.dark.textSecondary;
        }
    };

    const getCategoryIcon = (cat: TaskCategory) => {
        switch (cat) {
            case 'finance': return 'credit-card-outline';
            case 'academic': return 'school-outline';
            case 'housing': return 'home-outline';
            case 'utility': return 'lightning-bolt-outline';
            case 'work': return 'briefcase-outline';
            case 'health': return 'heart-pulse';
            default: return 'checkbox-blank-circle-outline';
        }
    };

    const themeColor = getCategoryColor(category);

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
            <LinearGradient
                colors={['#020617', '#0f172a']}
                style={StyleSheet.absoluteFill}
            />
            <SafeAreaView style={styles.safeArea}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <MaterialCommunityIcons name="arrow-left" size={24} color={Colors.dark.white} />
                    </TouchableOpacity>
                    <View style={styles.headerTitleContainer}>
                        <MaterialCommunityIcons name={getCategoryIcon(category) as any} size={24} color={themeColor} />
                        <Text style={[styles.headerTitle, { color: themeColor }]}>
                            {category.charAt(0).toUpperCase() + category.slice(1)}
                        </Text>
                    </View>
                    <View style={{ width: 40 }} />
                </View>

                {/* Task List */}
                <FlatList
                    data={tasks}
                    keyExtractor={item => item.id}
                    contentContainerStyle={styles.listContent}
                    renderItem={({ item }) => (
                        <TaskRow
                            task={item}
                            onToggle={() => handleToggleTask(item)}
                            onPress={() => { }}
                            onLongPress={() => handleLongPress(item)}
                        />
                    )}
                    ListEmptyComponent={
                        <View style={styles.emptyState}>
                            <MaterialCommunityIcons name="clipboard-text-outline" size={64} color="rgba(255,255,255,0.1)" />
                            <Text style={styles.emptyText}>No tasks in this category</Text>
                            <TouchableOpacity
                                style={[styles.createButton, { borderColor: themeColor }]}
                                onPress={() => navigation.navigate('AddCard', { preselectedCategory: category })}
                            >
                                <Text style={[styles.createButtonText, { color: themeColor }]}>Create One</Text>
                            </TouchableOpacity>
                        </View>
                    }
                />
            </SafeAreaView>

            <NeonActionSheet
                visible={menuVisible}
                onClose={() => setMenuVisible(false)}
                onDelete={confirmDelete}
                title={selectedTask?.title || "Task Options"}
            />
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
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 16,
        marginBottom: 10,
    },
    backButton: {
        padding: 8,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.05)',
    },
    headerTitleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        letterSpacing: 0.5,
    },
    listContent: {
        padding: 20,
        paddingBottom: 100,
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 100,
        gap: 16,
    },
    emptyText: {
        color: Colors.dark.textSecondary,
        fontSize: 16,
    },
    createButton: {
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 20,
        borderWidth: 1,
        marginTop: 10,
    },
    createButtonText: {
        fontWeight: '600',
    }
});
