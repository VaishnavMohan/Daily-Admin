import React, { useCallback, useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, SafeAreaView, Dimensions, StatusBar, Platform } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Colors from '../constants/Colors';
import { StorageService } from '../services/StorageService';
import { LifeTask } from '../types';
import { NotificationService } from '../services/NotificationService';
import { DateUtils } from '../utils/dateUtils';

const { width } = Dimensions.get('window');

export default function DashboardScreen({ navigation }: any) {
    const [tasks, setTasks] = useState<LifeTask[]>([]);
    const [greeting, setGreeting] = useState('');

    useEffect(() => {
        const hour = new Date().getHours();
        if (hour < 12) setGreeting('Good Morning');
        else if (hour < 18) setGreeting('Good Afternoon');
        else setGreeting('Good Evening');
    }, []);

    useFocusEffect(
        useCallback(() => {
            loadCards();
            // Status bar for Light Theme -> Dark Text
            StatusBar.setBarStyle('dark-content');
            if (Platform.OS === 'android') {
                StatusBar.setBackgroundColor('transparent');
                StatusBar.setTranslucent(true);
            }
        }, [])
    );

    const loadCards = async () => {
        let allTasks = await StorageService.getTasks();
        // Filter for Finance/Card type tasks
        // Assuming cards are 'finance' category and have 'bank' or 'last4' or just 'finance' category
        const cardTasks = allTasks.filter(t => t.category === 'finance');

        // Sort by Date
        cardTasks.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
        setCards(cardTasks);
    };

    const handleDelete = (task: LifeTask) => {
        Alert.alert(
            "Delete Card?",
            `Remove ${task.title}?`,
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: async () => {
                        await StorageService.deleteTask(task.id);
                        loadCards();
                    }
                }
            ]
        );
    };

    const handleMarkPaid = (task: LifeTask) => {
        Alert.alert(
            "Mark as Paid?",
            "Hide until next cycle?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Confirm",
                    onPress: async () => {
                        await StorageService.completeTask(task.id);
                        loadCards();
                    }
                }
            ]
        );
    };

    const renderTicket = ({ item }: { item: LifeTask }) => {
        const daysLeft = DateUtils.getDaysRemaining(item.dueDate);
        const { day, month } = DateUtils.formatForDisplay(item.dueDate);

        const isPaid = item.status === 'completed';
        const isUrgent = daysLeft <= 3 && !isPaid;
        const isOverdue = daysLeft < 0 && !isPaid;

        // Dynamic Gradient based on status
        let cardGradient = Colors.dark.gradients.Primary; // Default Blue
        if (isUrgent || isOverdue) cardGradient = Colors.dark.gradients.Urgent; // Red/Orange
        if (isPaid) cardGradient = ['#E5E5EA', '#D1D1D6']; // Gray for paid

        const textColor = isPaid ? '#8E8E93' : '#FFFFFF';
        const subTextColor = isPaid ? '#AEAEB2' : 'rgba(255,255,255,0.8)';

        return (
            <View style={[styles.ticketContainer, isPaid && styles.ticketPaid]}>
                <LinearGradient
                    colors={cardGradient as any}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.ticketGradient}
                >
                    <View style={styles.cardContent}>
                        {/* Top: Bank & Date */}
                        <View style={styles.topRow}>
                            <View>
                                <Text style={[styles.bankName, { color: textColor }]}>{item.bank || item.title}</Text>
                                <Text style={[styles.cardName, { color: subTextColor }]}>{item.subtitle || 'Card Statement'}</Text>
                            </View>

                            <View style={[styles.dateBadge, isPaid ? { backgroundColor: 'rgba(0,0,0,0.05)' } : { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
                                <Text style={[styles.dateMonth, { color: isPaid ? '#8E8E93' : '#fff' }]}>{month}</Text>
                                <Text style={[styles.dateDay, { color: textColor }]}>{day}</Text>
                            </View>
                        </View>

                        {/* Middle: Chip & Details */}
                        <View style={styles.midRow}>
                            <MaterialCommunityIcons name="chip" size={24} color={isPaid ? '#AEAEB2' : 'rgba(255,255,255,0.6)'} />
                            <Text style={[styles.last4, { color: subTextColor }]}>•••• {item.last4 || '****'}</Text>
                        </View>

                        {/* Bottom: Action */}
                        <View style={styles.bottomRow}>
                            <View>
                                <Text style={[styles.daysLabel, { color: subTextColor }]}>STATUS</Text>
                                <Text style={[styles.daysValue, { color: textColor }]}>
                                    {isPaid ? 'PAID' : isOverdue ? 'OVERDUE' : `${daysLeft} DAYS LEFT`}
                                </Text>
                            </View>

                            {!isPaid ? (
                                <TouchableOpacity style={styles.payBtn} onPress={() => handleMarkPaid(item)}>
                                    <Text style={styles.payBtnText}>Pay Now</Text>
                                    <MaterialCommunityIcons name="arrow-right" size={16} color={Colors.dark.primary} />
                                </TouchableOpacity>
                            ) : (
                                <View style={styles.paidBadge}>
                                    <MaterialCommunityIcons name="check" size={16} color="#fff" />
                                    <Text style={styles.paidText}>Done</Text>
                                </View>
                            )}
                        </View>

                        <TouchableOpacity onPress={() => handleDelete(item)} style={styles.deleteBtn}>
                            <MaterialCommunityIcons name="dots-horizontal" size={24} color={subTextColor} />
                        </TouchableOpacity>
                    </View>
                </LinearGradient>
            </View>
        );
    };

    return (
        <View style={styles.container}>
            {/* Background: Now Light Vibrant */}
            <LinearGradient
                colors={Colors.dark.gradients.AppBackground}
                style={StyleSheet.absoluteFill}
            />

            <SafeAreaView style={styles.safeArea}>
                <View style={styles.header}>
                    <View>
                        <Text style={styles.greeting}>{greeting}</Text>
                        <Text style={styles.headerTitle}>My Cards</Text>
                    </View>
                    <View style={styles.headerActions}>
                        {/* Settings - Dark Icon on Light BG */}
                        <TouchableOpacity
                            style={styles.iconButton}
                            onPress={() => navigation.navigate('Settings')}
                        >
                            <MaterialCommunityIcons name="cog-outline" size={24} color={Colors.dark.text} />
                        </TouchableOpacity>

                        {/* Add Button - Vibrant Gradient */}
                        <TouchableOpacity
                            style={styles.addButton}
                            onPress={() => navigation.navigate('AddCard')}
                        >
                            <LinearGradient
                                colors={Colors.dark.gradients.Primary}
                                style={styles.addButtonGradient}
                            >
                                <MaterialCommunityIcons name="plus" size={28} color="#fff" />
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>
                </View>

                <FlatList
                    data={tasks}
                    keyExtractor={item => item.id}
                    renderItem={renderTicket}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                    ListEmptyComponent={
                        <View style={styles.emptyState}>
                            <View style={styles.emptyIconBg}>
                                <MaterialCommunityIcons name="credit-card-plus-outline" size={48} color={Colors.dark.primary} />
                            </View>
                            <Text style={styles.emptyText}>No Cards Found</Text>
                            <Text style={styles.emptySubText}>Add your first card to get started.</Text>
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
        backgroundColor: Colors.dark.background, // Light Gray
    },
    safeArea: {
        flex: 1,
        paddingTop: Platform.OS === 'android' ? 40 : 0,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingTop: 10,
        paddingBottom: 20,
    },
    greeting: {
        fontSize: 13,
        color: Colors.dark.textSecondary,
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 4,
    },
    headerTitle: {
        fontSize: 32,
        fontWeight: '800',
        color: Colors.dark.text, // Black on Light
        letterSpacing: -0.5,
    },
    headerActions: {
        flexDirection: 'row',
        gap: 12,
        alignItems: 'center',
    },
    iconButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    addButton: {
        shadowColor: Colors.dark.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    addButtonGradient: {
        width: 50,
        height: 50,
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
    },
    listContent: {
        paddingHorizontal: 20,
        paddingBottom: 40,
        paddingTop: 10,
    },
    ticketContainer: {
        marginBottom: 20,
        borderRadius: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.1,
        shadowRadius: 16,
        elevation: 8,
        backgroundColor: '#fff', // Fallback
    },
    ticketPaid: {
        // opacity: 0.8,
    },
    ticketGradient: {
        borderRadius: 24,
        padding: 24,
        minHeight: 180,
    },
    cardContent: {
        flex: 1,
        justifyContent: 'space-between',
    },
    topRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    bankName: {
        fontSize: 20,
        fontWeight: '800',
        letterSpacing: 0.5,
    },
    cardName: {
        fontSize: 14,
        marginTop: 2,
        fontWeight: '500',
    },
    dateBadge: {
        alignItems: 'center',
        paddingVertical: 6,
        paddingHorizontal: 10,
        borderRadius: 12,
        minWidth: 50,
    },
    dateMonth: {
        fontSize: 10,
        fontWeight: '700',
        textTransform: 'uppercase',
    },
    dateDay: {
        fontSize: 18,
        fontWeight: '800',
    },
    midRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 20,
        gap: 10,
    },
    last4: {
        fontSize: 14,
        fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
        letterSpacing: 2,
        fontWeight: '600',
    },
    bottomRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        marginTop: 24,
    },
    daysLabel: {
        fontSize: 10,
        fontWeight: '700',
        letterSpacing: 1,
        marginBottom: 2,
    },
    daysValue: {
        fontSize: 16,
        fontWeight: '800',
    },
    payBtn: {
        backgroundColor: '#fff',
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 20,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    payBtnText: {
        color: Colors.dark.primary,
        fontWeight: '700',
        fontSize: 13,
    },
    paidBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#34C759',
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 16,
        gap: 4,
    },
    paidText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 12,
    },
    deleteBtn: {
        marginLeft: 'auto',
        padding: 8,
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 20,
        marginTop: -30
    },

    // Empty State
    emptyState: {
        alignItems: 'center',
        marginTop: 60,
    },
    emptyIconBg: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 5,
    },
    emptyText: {
        fontSize: 18,
        fontWeight: '700',
        color: Colors.dark.text,
    },
    emptySubText: {
        marginTop: 8,
        color: Colors.dark.textSecondary,
        fontSize: 14,
    }
});
