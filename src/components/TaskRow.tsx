import * as React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import Colors from '../constants/Colors';
import { LifeTask, TaskCategory } from '../types';

interface TaskRowProps {
    task: LifeTask;
    onToggle: () => void;
    onPress: () => void;
    onLongPress?: () => void;
}

const getCategoryColor = (category: TaskCategory) => {
    switch (category) {
        case 'finance': return Colors.dark.gold;
        case 'academic': return Colors.dark.primary;
        case 'housing': return Colors.dark.copper;
        case 'health': return Colors.dark.teal;
        default: return Colors.dark.textSecondary;
    }
};

const getCategoryIcon = (category: TaskCategory, customIcon?: string) => {
    if (customIcon) return customIcon;
    switch (category) {
        case 'finance': return 'credit-card-outline';
        case 'academic': return 'school-outline';
        case 'housing': return 'home-outline';
        case 'utility': return 'lightning-bolt-outline';
        case 'work': return 'briefcase-outline';
        case 'health': return 'heart-pulse';
        case 'medicine': return 'pill';
        case 'gym': return 'dumbbell';
        default: return 'checkbox-blank-circle-outline';
    }
};

export const TaskRow: React.FC<TaskRowProps> = ({ task, onToggle, onPress, onLongPress }) => {
    const isCompleted = task.status === 'completed';
    const isOverdue = task.status === 'overdue' || (new Date(task.dueDate) < new Date() && !isCompleted && new Date(task.dueDate).toDateString() !== new Date().toDateString());
    const categoryColor = getCategoryColor(task.category);

    // Format Date
    const formatDate = (isoDate: string) => {
        const d = new Date(isoDate);
        const today = new Date();
        const diffStats = Math.ceil((d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

        if (d.toDateString() === today.toDateString()) return 'TODAY';
        if (diffStats === 1) return 'TOMORROW';
        if (diffStats < 0) return 'OVERDUE';

        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).toUpperCase();
    };

    const dateStr = formatDate(task.dueDate);
    const showAmount = ['finance', 'housing', 'utility'].includes(task.category) && task.amount;

    return (
        <TouchableOpacity
            onPress={onPress}
            onLongPress={onLongPress}
            activeOpacity={0.8}
            style={[styles.wrapper, isCompleted && styles.wrapperCompleted]}
        >
            <BlurView intensity={20} tint="dark" style={[styles.container, isOverdue && !isCompleted && styles.overdueBorder]}>
                {/* Left: Icon - Minimal */}
                <View style={styles.iconBox}>
                    <MaterialCommunityIcons
                        name={getCategoryIcon(task.category, task.icon) as any}
                        size={20}
                        color={isCompleted ? Colors.dark.textSecondary : categoryColor}
                    />
                </View>

                {/* Middle */}
                <View style={styles.middleSection}>
                    <Text
                        style={[styles.title, isCompleted && styles.textCompleted]}
                        numberOfLines={1}
                    >
                        {task.title}
                    </Text>

                    <View style={styles.metaRow}>
                        {showAmount && (
                            <Text style={styles.amountText}>
                                {task.currency}{task.amount?.toLocaleString()} <Text style={{ color: Colors.dark.textTertiary }}>|</Text>
                            </Text>
                        )}
                        <Text style={[
                            styles.date,
                            isOverdue && !isCompleted ? { color: Colors.dark.danger } : { color: Colors.dark.textSecondary }
                        ]}>
                            {dateStr}
                        </Text>
                        {task.subtitle && (
                            <Text style={styles.subtitle} numberOfLines={1}> • {task.subtitle}</Text>
                        )}
                    </View>
                </View>

                {/* Right: Checkbox - Physical Button */}
                <TouchableOpacity onPress={onToggle} style={styles.checkboxArea} hitSlop={10}>
                    {isCompleted ? (
                        <View style={[styles.checkbox, { backgroundColor: Colors.dark.success, borderColor: Colors.dark.success }]}>
                            <MaterialCommunityIcons name="check" size={14} color="#000" />
                        </View>
                    ) : (
                        <View style={[styles.checkbox, { borderColor: Colors.dark.textTertiary }]} />
                    )}
                </TouchableOpacity>
            </BlurView>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    wrapper: {
        marginBottom: 12,
        borderRadius: 16,
        overflow: 'hidden',
        backgroundColor: 'rgba(30,30,30,0.4)', // Fallback
    },
    wrapperCompleted: {
        opacity: 0.5,
    },
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 20,
        backgroundColor: 'rgba(255,255,255,0.03)',
    },
    overdueBorder: {
        borderLeftWidth: 3,
        borderLeftColor: Colors.dark.danger,
        paddingLeft: 17, // adjust for border
    },
    iconBox: {
        width: 36,
        height: 36,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 14,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 10,
    },
    middleSection: {
        flex: 1,
    },
    title: {
        fontSize: 15,
        fontWeight: '600',
        color: Colors.dark.text,
        marginBottom: 4,
        letterSpacing: 0.3,
    },
    textCompleted: {
        textDecorationLine: 'line-through',
        color: Colors.dark.textSecondary,
    },
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    amountText: {
        fontSize: 12,
        color: Colors.dark.white,
        fontWeight: '700',
        marginRight: 6,
        fontVariant: ['tabular-nums'],
    },
    date: {
        fontSize: 11,
        fontWeight: '600',
        letterSpacing: 0.5,
    },
    subtitle: {
        fontSize: 11,
        color: Colors.dark.textTertiary,
    },
    checkboxArea: {
        marginLeft: 12,
        padding: 4,
    },
    checkbox: {
        width: 22,
        height: 22,
        borderRadius: 11,
        borderWidth: 1.5,
        justifyContent: 'center',
        alignItems: 'center',
    }
});
