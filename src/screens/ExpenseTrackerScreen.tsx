import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, Dimensions, Modal, TextInput, FlatList, KeyboardAvoidingView, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import Animated, { FadeInDown, FadeInRight, Layout, ZoomIn } from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Colors from '../constants/Colors';
import { StorageService } from '../services/StorageService';
import { LifeTask, TaskCategory } from '../types';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Alert } from 'react-native';

const { width } = Dimensions.get('window');

export const ExpenseTrackerScreen = ({ navigation }: any) => {
    const insets = useSafeAreaInsets();
    const [expenses, setExpenses] = useState<LifeTask[]>([]);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showMonthPicker, setShowMonthPicker] = useState(false);

    // View State
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [currentViewMonth, setCurrentViewMonth] = useState(new Date()); // Tracks which month we are viewing

    // Quick Add State
    const [amount, setAmount] = useState('');
    const [note, setNote] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<TaskCategory>('food');

    // Calendar Scroll Ref
    const dateListRef = useRef<FlatList>(null);

    const categories: { key: TaskCategory; icon: any; label: string; color: string }[] = [
        { key: 'food', icon: 'food-fork-drink', label: 'Food', color: '#F59E0B' },
        { key: 'transport', icon: 'car', label: 'Transport', color: '#3B82F6' },
        { key: 'shopping', icon: 'shopping', label: 'Shopping', color: '#EC4899' },
        { key: 'entertainment', icon: 'movie', label: 'Fun', color: '#8B5CF6' },
        { key: 'utility', icon: 'lightning-bolt', label: 'Bills', color: '#10B981' },
        { key: 'health', icon: 'heart-pulse', label: 'Health', color: '#EF4444' },
    ];

    useFocusEffect(
        useCallback(() => {
            loadExpenses();
            // Reset to today when entering IF we want that behavior
            // setSelectedDate(new Date()); 
        }, [])
    );

    // Auto-scroll to today when date strip loads/changes
    useEffect(() => {
        if (dateListRef.current && dateStrip.length > 0) {
            const todayIndex = dateStrip.findIndex(d =>
                d.toISOString().split('T')[0] === selectedDate.toISOString().split('T')[0]
            );
            if (todayIndex !== -1) {
                // Wait a tick for layout
                setTimeout(() => {
                    dateListRef.current?.scrollToIndex({ index: todayIndex, animated: true, viewPosition: 0.5 });
                }, 500);
            }
        }
    }, [currentViewMonth]); // Run when switching months

    const loadExpenses = async () => {
        const allTasks = await StorageService.getTasks();
        const expenseTasks = allTasks.filter(t => t.type === 'expense');
        setExpenses(expenseTasks.sort((a, b) => new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime()));
    };

    const handleAddExpense = async () => {
        if (!amount) return;

        const newExpense: LifeTask = {
            id: Math.random().toString(36).substr(2, 9),
            title: note || categories.find(c => c.key === selectedCategory)?.label || 'Expense',
            category: selectedCategory,
            type: 'expense',
            amount: parseFloat(amount),
            dueDate: selectedDate.toISOString().split('T')[0],
            recurrence: 'once',
            status: 'completed',
            currency: 'INR',
        };

        await StorageService.addTask(newExpense);
        setAmount('');
        setNote('');
        setShowAddModal(false);
        loadExpenses();
    };

    const handleExport = async () => {
        try {
            const monthName = currentViewMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

            // Generate CSV content
            let csvContent = 'Date,Category,Description,Amount (INR)\n';

            // Get relevant expenses
            const exportData = expenses.filter(e => {
                const d = new Date(e.dueDate);
                return d.getMonth() === currentViewMonth.getMonth() && d.getFullYear() === currentViewMonth.getFullYear();
            }).sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()); // Sort oldest first

            if (exportData.length === 0) {
                Alert.alert("No Expenses", "There are no expenses to export for this month.");
                return;
            }

            exportData.forEach(item => {
                const date = item.dueDate;
                const category = categories.find(c => c.key === item.category)?.label || item.category;
                const desc = item.title.replace(/,/g, ' '); // simple escape
                const amt = item.amount;
                csvContent += `${date},${category},${desc},${amt}\n`;
            });

            const fileName = `Expenses_${monthName.replace(/ /g, '_')}.csv`;
            const fileUri = FileSystem.documentDirectory + fileName;

            await FileSystem.writeAsStringAsync(fileUri, csvContent);
            await Sharing.shareAsync(fileUri, {
                mimeType: 'text/csv',
                dialogTitle: `Export ${monthName} Expenses`
            });

        } catch (error) {
            console.error(error);
            Alert.alert("Export Failed", "Could not export data. Please try again.");
        }
    };

    // --- Date Logic ---
    const isCurrentMonth = useMemo(() => {
        const now = new Date();
        return currentViewMonth.getMonth() === now.getMonth() && currentViewMonth.getFullYear() === now.getFullYear();
    }, [currentViewMonth]);

    // Generate Date Strip for the View Month
    const dateStrip = useMemo(() => {
        const days = [];
        const year = currentViewMonth.getFullYear();
        const month = currentViewMonth.getMonth();
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        for (let i = 1; i <= daysInMonth; i++) {
            days.push(new Date(year, month, i));
        }
        return days;
    }, [currentViewMonth]);

    const selectedDateStr = selectedDate.toISOString().split('T')[0];

    // Filtered Content
    const dayExpenses = expenses.filter(e => e.dueDate === selectedDateStr);
    const dayTotal = dayExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);

    // Month Stats
    const monthExpenses = expenses.filter(e => {
        const d = new Date(e.dueDate);
        return d.getMonth() === currentViewMonth.getMonth() && d.getFullYear() === currentViewMonth.getFullYear();
    });

    const monthTotal = monthExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);

    // Available Months for History
    const availableMonths = useMemo(() => {
        const months = [];
        for (let i = 0; i < 6; i++) { // Last 6 months
            const d = new Date();
            d.setMonth(d.getMonth() - i);
            months.push(d);
        }
        return months;
    }, []);

    const changeMonth = (date: Date) => {
        setCurrentViewMonth(date);
        // Default to 1st of that month if not current month
        if (date.getMonth() === new Date().getMonth()) {
            setSelectedDate(new Date());
        } else {
            setSelectedDate(new Date(date.getFullYear(), date.getMonth(), 1));
        }
        setShowMonthPicker(false);
    };

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={[Colors.dark.background, '#0f172a']}
                style={StyleSheet.absoluteFill}
            />

            {/* Custom Header with Safe Area */}
            <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => navigation.navigate('Dashboard')}
                >
                    <MaterialCommunityIcons name="arrow-left" size={24} color={Colors.dark.textSecondary} />
                    <Text style={styles.backText}>Dashboard</Text>
                </TouchableOpacity>

                {/* Month Selector Title */}
                <TouchableOpacity
                    style={styles.monthSelector}
                    onPress={() => setShowMonthPicker(true)}
                >
                    <Text style={styles.headerTitle}>{currentViewMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</Text>
                    <MaterialCommunityIcons name="chevron-down" size={20} color={Colors.dark.text} />
                </TouchableOpacity>

                <TouchableOpacity
                    onPress={() => setShowAddModal(true)}
                    style={[styles.headerAdd, { opacity: isCurrentMonth ? 1 : 0.5 }]}
                    disabled={!isCurrentMonth}
                >
                    <MaterialCommunityIcons name="plus" size={24} color="#fff" />
                </TouchableOpacity>
            </View>

            {/* Total Balance Card */}
            <View style={styles.overviewContainer}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                    <View>
                        <Text style={styles.monthLabel}>Total Spent</Text>
                        <Animated.Text
                            key={monthTotal} // Animate on change
                            entering={FadeInDown.springify()}
                            style={styles.monthValue}
                        >
                            ₹{monthTotal.toLocaleString()}
                        </Animated.Text>
                    </View>

                    <TouchableOpacity style={styles.exportButton} onPress={handleExport}>
                        <MaterialCommunityIcons name="export-variant" size={20} color={Colors.dark.primary} />
                        <Text style={styles.exportText}>Export</Text>
                    </TouchableOpacity>
                </View>

                {/* Extraordinary Category Breakdown */}
                {monthTotal > 0 && (
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.breakdownContainer}>
                        {(() => {
                            const breakdown = Object.values(expenses.reduce((acc, curr) => {
                                const d = new Date(curr.dueDate);
                                if (d.getMonth() === currentViewMonth.getMonth() && d.getFullYear() === currentViewMonth.getFullYear()) {
                                    if (!acc[curr.category]) acc[curr.category] = { key: curr.category, total: 0 };
                                    acc[curr.category].total += (curr.amount || 0);
                                }
                                return acc;
                            }, {} as Record<string, { key: TaskCategory, total: number }>))
                                .sort((a, b) => b.total - a.total);

                            return breakdown.map((item, index) => {
                                const cat = categories.find(c => c.key === item.key);
                                if (!cat) return null;
                                return (
                                    <Animated.View
                                        key={item.key}
                                        entering={FadeInDown.delay(index * 100 + 200)}
                                        style={[styles.breakdownItem, { backgroundColor: cat.color + '15', borderColor: cat.color + '30' }]}
                                    >
                                        <MaterialCommunityIcons name={cat.icon} size={16} color={cat.color} />
                                        <Text style={[styles.breakdownText, { color: cat.color }]}>{cat.label}</Text>
                                        <Text style={styles.breakdownAmount}>₹{item.total.toLocaleString()}</Text>
                                    </Animated.View>
                                );
                            });
                        })()}
                    </ScrollView>
                )}
            </View>

            {/* Month Picker Modal */}
            <Modal
                transparent
                visible={showMonthPicker}
                animationType="fade"
                onRequestClose={() => setShowMonthPicker(false)}
            >
                <TouchableOpacity style={styles.pickerOverlay} activeOpacity={1} onPress={() => setShowMonthPicker(false)}>
                    <BlurView intensity={80} tint="dark" style={styles.pickerContent}>
                        <Text style={styles.pickerTitle}>Select Month</Text>
                        {availableMonths.map((date, index) => (
                            <TouchableOpacity
                                key={index}
                                style={styles.pickerItem}
                                onPress={() => changeMonth(date)}
                            >
                                <Text style={[
                                    styles.pickerItemText,
                                    date.getMonth() === currentViewMonth.getMonth() && { color: Colors.dark.primary, fontWeight: 'bold' }
                                ]}>
                                    {date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                                </Text>
                                {date.getMonth() === currentViewMonth.getMonth() && (
                                    <MaterialCommunityIcons name="check" size={20} color={Colors.dark.primary} />
                                )}
                            </TouchableOpacity>
                        ))}
                    </BlurView>
                </TouchableOpacity>
            </Modal>

            {/* Content Area */}
            <View style={{ flex: 1 }}>

                {/* Date Strip */}
                <View style={styles.calendarContainer}>
                    <FlatList
                        ref={dateListRef}
                        data={dateStrip}
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={{ paddingHorizontal: 20 }}
                        initialNumToRender={15}
                        onScrollToIndexFailed={info => {
                            const wait = new Promise(resolve => setTimeout(resolve, 500));
                            wait.then(() => {
                                dateListRef.current?.scrollToIndex({ index: info.index, animated: true });
                            });
                        }}
                        keyExtractor={(item) => item.toISOString()}
                        renderItem={({ item: date }) => {
                            const dStr = date.toISOString().split('T')[0];
                            const isSelected = dStr === selectedDateStr;
                            const hasData = expenses.some(e => e.dueDate === dStr);

                            return (
                                <TouchableOpacity
                                    style={[styles.dateItem, isSelected && styles.dateItemSelected]}
                                    onPress={() => setSelectedDate(date)}
                                >
                                    <Text style={[styles.dayName, isSelected && styles.dayNameSelected]}>
                                        {date.toLocaleDateString('en-US', { weekday: 'short' })}
                                    </Text>
                                    <Text style={[styles.dayNumber, isSelected && styles.dayNumberSelected]}>
                                        {date.getDate()}
                                    </Text>
                                    {hasData && !isSelected && <View style={styles.dot} />}
                                </TouchableOpacity>
                            );
                        }}
                    />
                </View>

                {/* Daily Details List */}
                <Animated.ScrollView
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                >
                    <View style={[styles.dayDetails, { minHeight: 500 }]}>
                        <View style={styles.dayHeader}>
                            <Text style={styles.dayHeaderTitle}>
                                {selectedDateStr === new Date().toISOString().split('T')[0] ? 'Today' : selectedDate.toLocaleDateString('en-US', { weekday: 'long', day: 'numeric' })}
                            </Text>
                            <Text style={styles.dayHeaderTotal}>{dayTotal > 0 ? `₹${dayTotal.toLocaleString()}` : ''}</Text>
                        </View>

                        {dayExpenses.length > 0 ? (
                            dayExpenses.map((expense, index) => (
                                <Animated.View
                                    key={expense.id}
                                    entering={FadeInDown.delay(index * 50).springify()}
                                    style={styles.expenseRow}
                                >
                                    <View style={[styles.catIcon, { backgroundColor: categories.find(c => c.key === expense.category)?.color + '20' }]}>
                                        <MaterialCommunityIcons
                                            name={categories.find(c => c.key === expense.category)?.icon || 'cash'}
                                            size={20}
                                            color={categories.find(c => c.key === expense.category)?.color || '#fff'}
                                        />
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.expenseTitle}>{expense.title}</Text>
                                        <Text style={styles.expenseCat}>{categories.find(c => c.key === expense.category)?.label}</Text>
                                    </View>
                                    <View style={{ alignItems: 'flex-end' }}>
                                        <Text style={styles.expenseAmount}>₹{expense.amount?.toLocaleString()}</Text>
                                    </View>
                                </Animated.View>
                            ))
                        ) : (
                            <View style={styles.emptyDayState}>
                                <MaterialCommunityIcons name="timeline-text-outline" size={48} color="rgba(255,255,255,0.1)" />
                                <Text style={styles.emptyDayText}>No activity on this day</Text>
                                {isCurrentMonth && (
                                    <TouchableOpacity style={styles.addTodayButton} onPress={() => setShowAddModal(true)}>
                                        <Text style={styles.addTodayText}>Add Expense</Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                        )}
                    </View>
                </Animated.ScrollView>

            </View>

            {/* Quick Add Modal */}
            <Modal
                transparent
                visible={showAddModal}
                animationType="slide"
                onRequestClose={() => setShowAddModal(false)}
            >
                <BlurView intensity={40} tint="dark" style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Add Expense</Text>
                            <TouchableOpacity onPress={() => setShowAddModal(false)}>
                                <MaterialCommunityIcons name="close-circle" size={30} color={Colors.dark.textSecondary} />
                            </TouchableOpacity>
                        </View>

                        <Text style={styles.dateLabel}>For {selectedDate.toLocaleDateString()}</Text>

                        <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="always">
                            <View style={styles.inputContainer}>
                                <Text style={styles.currencySymbol}>₹</Text>
                                <TextInput
                                    style={styles.amountInput}
                                    placeholder="0"
                                    placeholderTextColor="#666"
                                    keyboardType="numeric"
                                    value={amount}
                                    onChangeText={setAmount}
                                    autoFocus
                                />
                            </View>

                            <TextInput
                                style={styles.noteInput}
                                placeholder="Description"
                                placeholderTextColor="#666"
                                value={note}
                                onChangeText={setNote}
                            />

                            {/* Category Selector */}
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll} keyboardShouldPersistTaps="always">
                                {categories.map(cat => (
                                    <TouchableOpacity
                                        key={cat.key}
                                        style={[styles.categoryChip, selectedCategory === cat.key && { backgroundColor: cat.color, borderColor: cat.color }]}
                                        onPress={() => setSelectedCategory(cat.key)}
                                    >
                                        <MaterialCommunityIcons name={cat.icon} size={20} color="#fff" />
                                        <Text style={styles.categoryChipText}>{cat.label}</Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>

                            <TouchableOpacity style={styles.saveButton} onPress={handleAddExpense}>
                                <Text style={styles.saveButtonText}>Save Expense</Text>
                            </TouchableOpacity>
                        </ScrollView>
                    </View>
                </BlurView >
            </Modal >
        </View >
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.dark.background,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingBottom: 20,
        zIndex: 10,
    },
    backButton: {
        width: 40,
        justifyContent: 'center',
        // backgroundColor: 'red'
    },
    backText: {
        display: 'none', // Icon only for cleaner look
    },
    monthSelector: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.05)',
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 20,
        gap: 8,
    },
    headerTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#fff',
    },
    headerAdd: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: Colors.dark.primary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    overviewContainer: {
        paddingHorizontal: 24,
        alignItems: 'center',
        marginBottom: 10,
    },
    monthLabel: {
        fontSize: 14,
        color: Colors.dark.textSecondary,
        marginBottom: 4,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    monthValue: {
        fontSize: 42,
        fontWeight: '800',
        color: '#fff',
    },

    // Calendar Strip
    calendarContainer: {
        height: 80,
    },
    dateItem: {
        width: 60,
        height: 70,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 16,
        backgroundColor: 'rgba(255,255,255,0.03)',
        marginRight: 10,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    dateItemSelected: {
        backgroundColor: Colors.dark.primary,
        borderColor: Colors.dark.primary,
        transform: [{ scale: 1.05 }],
    },
    dayName: {
        fontSize: 12,
        color: Colors.dark.textSecondary,
        marginBottom: 4,
        textTransform: 'uppercase',
    },
    dayNameSelected: {
        color: 'rgba(255,255,255,0.8)',
    },
    dayNumber: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#fff',
    },
    dayNumberSelected: {
        color: '#fff',
    },
    dot: {
        width: 4,
        height: 4,
        borderRadius: 2,
        backgroundColor: Colors.dark.textSecondary,
        marginTop: 6,
    },

    // Scroll Content
    scrollContent: {
        // paddingHorizontal: 0,
    },

    // Day Details
    dayDetails: {
        paddingHorizontal: 24,
        backgroundColor: 'rgba(255,255,255,0.02)',
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        paddingTop: 32,
        marginTop: 10,
    },
    dayHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
    },
    dayHeaderTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#fff',
    },
    dayHeaderTotal: {
        fontSize: 20,
        fontWeight: '600',
        color: Colors.dark.textSecondary,
    },
    expenseRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.05)',
    },
    catIcon: {
        width: 40,
        height: 40,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    expenseTitle: {
        fontSize: 16,
        fontWeight: '500',
        color: '#fff',
    },
    expenseCat: {
        fontSize: 12,
        color: Colors.dark.textSecondary,
    },
    expenseAmount: {
        fontSize: 16,
        fontWeight: '600',
        color: '#fff',
    },
    emptyDayState: {
        alignItems: 'center',
        paddingVertical: 40,
    },
    emptyDayText: {
        color: Colors.dark.textSecondary,
        marginVertical: 16,
        fontSize: 16,
    },
    addTodayButton: {
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.1)',
    },
    addTodayText: {
        color: '#fff',
        fontWeight: '600',
    },

    // Month Picker Modal
    pickerOverlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    pickerContent: {
        width: width * 0.8,
        borderRadius: 24,
        padding: 24,
        overflow: 'hidden',
        backgroundColor: 'rgba(30, 27, 75, 0.9)',
    },
    pickerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 20,
        textAlign: 'center',
    },
    pickerItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.05)',
    },
    pickerItemText: {
        fontSize: 16,
        color: Colors.dark.text,
    },

    // Quick Add Modal (Same as before)
    modalOverlay: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#1E1B4B',
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        padding: 24,
        paddingBottom: 40,
        borderTopWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#fff',
    },
    dateLabel: {
        color: Colors.dark.textSecondary,
        marginBottom: 20,
        textAlign: 'center',
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 24,
    },
    currencySymbol: {
        fontSize: 32,
        color: Colors.dark.textSecondary,
        marginRight: 8,
    },
    amountInput: {
        fontSize: 48,
        fontWeight: 'bold',
        color: '#fff',
        minWidth: 100,
    },
    noteInput: {
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 12,
        padding: 16,
        color: '#fff',
        fontSize: 16,
        marginBottom: 24,
    },
    categoryScroll: {
        marginBottom: 32,
    },
    categoryChip: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 16,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        marginRight: 12,
    },
    categoryChipText: {
        color: '#fff',
        marginLeft: 8,
        fontWeight: '600',
    },
    saveButton: {
        backgroundColor: Colors.dark.primary,
        borderRadius: 16,
        padding: 18,
        alignItems: 'center',
        marginBottom: 16,
    },
    saveButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    // Breakdown
    breakdownContainer: {
        marginTop: 16,
        paddingBottom: 8,
    },
    breakdownItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
        marginRight: 8,
        borderWidth: 1,
        gap: 6,
    },
    breakdownText: {
        fontSize: 12,
        fontWeight: '600',
    },
    breakdownAmount: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#fff',
    },
    sectionLabel: {
        color: Colors.dark.textSecondary,
        fontSize: 12,
        fontWeight: '600',
        marginBottom: 8,
        textTransform: 'uppercase',
    },
    exportButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 6,
        backgroundColor: 'rgba(59, 130, 246, 0.15)', // Blue tint
        borderRadius: 16,
        gap: 6,
    },
    exportText: {
        color: Colors.dark.primary,
        fontWeight: '600',
        fontSize: 14,
    },
});
