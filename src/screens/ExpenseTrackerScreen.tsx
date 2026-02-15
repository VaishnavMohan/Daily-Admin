import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, Dimensions, Modal, TextInput, FlatList, KeyboardAvoidingView, Platform, Animated as RNAnimated } from 'react-native';
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
import WebSwipeable from '../components/WebSwipeable';
import { SpendingHeatmap } from '../components/SpendingHeatmap';

const { width } = Dimensions.get('window');

export const ExpenseTrackerScreen = ({ navigation }: any) => {
    const insets = useSafeAreaInsets();
    const [expenses, setExpenses] = useState<LifeTask[]>([]);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showMonthPicker, setShowMonthPicker] = useState(false);

    // Swipeable renderRightActions
    const renderRightActions = (progress: any, dragX: any, expense: LifeTask) => {
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
            <RNAnimated.View style={[styles.deleteAction, { opacity, transform: [{ scale }] }]}>
                <TouchableOpacity onPress={() => handleDeleteExpense(expense)} style={{ flex: 1, justifyContent: 'center', alignItems: 'center', width: '100%' }}>
                    <MaterialCommunityIcons name="trash-can-outline" size={24} color="#fff" />
                    <RNAnimated.Text style={styles.deleteActionText}>Delete</RNAnimated.Text>
                </TouchableOpacity>
            </RNAnimated.View>
        );
    };

    // View State
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [currentViewMonth, setCurrentViewMonth] = useState(new Date());
    const [filterRange, setFilterRange] = useState<'day' | 'month' | '3m' | '6m' | 'year'>('month');
    const [showInsights, setShowInsights] = useState(false);

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

    // Swipe Exclusivity
    const rowRefs = useRef(new Map<string, any>());

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
            return () => {
                // Close all swipe rows on blur
                rowRefs.current.forEach((ref) => {
                    ref?.close();
                });
            };
        }, [])
    );

    // Auto-scroll to today when date strip loads/changes
    useEffect(() => {
        if (dateListRef.current && dateStrip.length > 0) {
            const fmt = (dt: Date) => `${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,'0')}-${String(dt.getDate()).padStart(2,'0')}`;
            const todayIndex = dateStrip.findIndex(d =>
                fmt(d) === fmt(selectedDate)
            );
            if (todayIndex !== -1) {
                setTimeout(() => {
                    dateListRef.current?.scrollToIndex({ index: todayIndex, animated: true, viewPosition: 0.5 });
                }, 500);
            }
        }
    }, [currentViewMonth]);

    const loadExpenses = async () => {
        const allTasks = await StorageService.getTasks();
        const expenseTasks = allTasks.filter(t => t.type === 'expense');
        setExpenses(expenseTasks.sort((a, b) => new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime()));
    };

    const handleAddExpense = async () => {
        if (!amount) return;

        // Format as YYYY-MM-DD using local time components to avoid timezone shift
        const y = selectedDate.getFullYear();
        const m = String(selectedDate.getMonth() + 1).padStart(2, '0');
        const d = String(selectedDate.getDate()).padStart(2, '0');
        const localDateString = `${y}-${m}-${d}`;

        const newExpense: LifeTask = {
            id: Date.now().toString(),
            title: note || categories.find(c => c.key === selectedCategory)?.label || 'Expense', // Assuming 'expenseTitle' was meant to be 'note'
            amount: parseFloat(amount), // Assuming 'expenseAmount' was meant to be 'amount'
            category: selectedCategory,
            type: 'expense',
            dueDate: localDateString,
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
            const rangeName = filterRange === 'day' ? 'Today' :
                filterRange === 'month' ? currentViewMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) :
                    filterRange === 'year' ? currentViewMonth.getFullYear().toString() :
                        filterRange.toUpperCase();

            let csvContent = 'Date,Category,Description,Amount (INR)\n';

            if (filteredExpenses.length === 0) {
                setModalConfig({
                    visible: true,
                    title: "No Expenses",
                    message: "There are no expenses to export for this selection.",
                    singleButton: true
                });
                return;
            }

            const expensesToExport = filteredExpenses; // Use filtered expenses for export

            csvContent = "Date,Category,Title,Amount,Note\n" +
                expensesToExport.map(e => {
                    const date = new Date(e.dueDate).toLocaleDateString(); // Use dueDate for date
                    const category = categories.find(c => c.key === e.category)?.label || e.category;
                    return `${date},${category},"${e.title}",${e.amount},"${e.notes || ''}"`;
                }).join("\n");

            const fileName = `Expenses_${rangeName.replace(/ /g, '_')}.csv`;
            const fileUri = FileSystem.documentDirectory + fileName;

            await FileSystem.writeAsStringAsync(fileUri, csvContent);
            await Sharing.shareAsync(fileUri, {
                mimeType: 'text/csv',
                dialogTitle: `Export ${rangeName} Expenses`
            });

        } catch (error) {
            console.error(error);
            setModalConfig({
                visible: true,
                title: "Export Failed",
                message: "Could not export data. Please try again.",
                singleButton: true
            });
        }
    };

    const handleDeleteExpense = (expense: LifeTask) => {
        setModalConfig({
            visible: true,
            title: "Delete Expense?",
            message: `Are you sure you want to delete "${expense.title}"? This action cannot be undone.`,
            confirmText: "Delete",
            isDanger: true,
            onConfirm: async () => {
                await StorageService.deleteTask(expense.id);
                loadExpenses();
                setModalConfig(prev => ({ ...prev, visible: false }));
            }
        });
    };

    // Date Logic Helpers
    const isCurrentMonth = useMemo(() => {
        const now = new Date();
        return currentViewMonth.getMonth() === now.getMonth() && currentViewMonth.getFullYear() === now.getFullYear();
    }, [currentViewMonth]);

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

    const formatLocalDate = (d: Date) => {
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${y}-${m}-${day}`;
    };

    const selectedDateStr = formatLocalDate(selectedDate);

    const filteredExpenses = useMemo(() => {
        const now = new Date();

        return expenses.filter(e => {
            const [ey, em, ed] = e.dueDate.split('-').map(Number);
            const date = new Date(ey, em - 1, ed);

            if (filterRange === 'day') {
                return e.dueDate === formatLocalDate(selectedDate);
            }
            if (filterRange === 'month') {
                return date.getMonth() === currentViewMonth.getMonth() && date.getFullYear() === currentViewMonth.getFullYear();
            }
            if (filterRange === 'year') {
                return date.getFullYear() === currentViewMonth.getFullYear();
            }
            if (filterRange === '3m') {
                // Last 3 months from current view month
                const start = new Date(currentViewMonth);
                start.setMonth(start.getMonth() - 2); // Current + prev 2 = 3
                start.setDate(1);

                const end = new Date(currentViewMonth);
                end.setMonth(end.getMonth() + 1);
                end.setDate(0); // End of current month

                return date >= start && date <= end;
            }
            if (filterRange === '6m') {
                // Last 6 months
                const start = new Date(currentViewMonth);
                start.setMonth(start.getMonth() - 5);
                start.setDate(1);

                const end = new Date(currentViewMonth);
                end.setMonth(end.getMonth() + 1);
                end.setDate(0);

                return date >= start && date <= end;
            }
            return false;
        });
    }, [expenses, filterRange, selectedDate, currentViewMonth]);

    const filteredTotal = filteredExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);

    // Keep daily list separate (for the list below) or same? 
    // The user wants 'filter', enabling day/month/year stats.
    // The list below currently shows 'Day Details'. 
    // We should probably keep the list showing Day Details selected by date strip, 
    // OR show the list of filtered items if range is > day?
    // For now, let's keep the list as "Day Details" (Calendar View) but update the "Total Spent" card to reflect the filter.

    // We still need 'dayTotal' for the list header if we keep it.
    const dayExpenses = expenses.filter(e => e.dueDate === formatLocalDate(selectedDate));
    const dayTotal = dayExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);


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

                <View style={{ flexDirection: 'row', gap: 8 }}>
                    <TouchableOpacity
                        onPress={() => setShowInsights(true)}
                        style={[styles.headerAdd, { backgroundColor: 'rgba(59, 130, 246, 0.2)', width: 40, height: 40 }]}
                    >
                        <MaterialCommunityIcons name="chart-bar" size={20} color={Colors.dark.primary} />
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={() => setShowAddModal(true)}
                        style={[styles.headerAdd, { opacity: isCurrentMonth ? 1 : 0.5 }]}
                        disabled={!isCurrentMonth}
                    >
                        <MaterialCommunityIcons name="plus" size={24} color="#fff" />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Range Selector */}
            <View style={styles.filterContainer}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
                    {(['day', 'month', '3m', '6m', 'year'] as const).map((range) => (
                        <TouchableOpacity
                            key={range}
                            style={[
                                styles.filterChip,
                                filterRange === range && { backgroundColor: Colors.dark.primary, borderColor: Colors.dark.primary }
                            ]}
                            onPress={() => {
                                setFilterRange(range);
                                // If switching to day, ensure day logic updates
                                if (range === 'day') {
                                    // Maybe scroll to today?
                                }
                            }}
                        >
                            <Text style={[
                                styles.filterText,
                                filterRange === range && { color: '#fff', fontWeight: 'bold' }
                            ]}>
                                {range === 'day' ? 'Today' : range === 'month' ? 'This Month' : range === 'year' ? 'Year' : range.toUpperCase()}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            {/* Total Balance Card */}
            <View style={styles.overviewContainer}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                    <View>
                        <Text style={styles.monthLabel}>
                            {filterRange === 'day' ? 'Spent Today' :
                                filterRange === 'month' ? 'Spent in ' + currentViewMonth.toLocaleDateString('en-US', { month: 'short' }) :
                                    filterRange === 'year' ? 'Spent in ' + currentViewMonth.getFullYear() :
                                        'Total Spent'}
                        </Text>
                        <Animated.Text
                            key={filteredTotal} // Animate on change
                            entering={FadeInDown.springify()}
                            style={styles.monthValue}
                        >
                            ₹{filteredTotal.toLocaleString()}
                        </Animated.Text>
                    </View>

                    <TouchableOpacity style={styles.exportButton} onPress={handleExport}>
                        <MaterialCommunityIcons name="export-variant" size={20} color={Colors.dark.primary} />
                        <Text style={styles.exportText}>Export</Text>
                    </TouchableOpacity>
                </View>

                {/* Category Breakdown */}
                {filteredTotal > 0 && (
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.breakdownContainer}>
                        {(() => {
                            const breakdown = Object.values(filteredExpenses.reduce((acc, curr) => {
                                if (!acc[curr.category]) acc[curr.category] = { key: curr.category, total: 0 };
                                acc[curr.category].total += (curr.amount || 0);
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


            {/* Insights Modal */}
            <Modal
                transparent
                visible={showInsights}
                animationType="fade"
                onRequestClose={() => setShowInsights(false)}
            >
                <BlurView intensity={40} tint="dark" style={{ flex: 1, justifyContent: 'center', padding: 16 }}>
                    <TouchableOpacity style={StyleSheet.absoluteFill} onPress={() => setShowInsights(false)} />
                    <View style={{
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
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                            <Text style={{ fontSize: 20, fontWeight: '700', color: '#fff' }}>Spending Insights</Text>
                            <TouchableOpacity onPress={() => setShowInsights(false)} style={{ padding: 4 }}>
                                <MaterialCommunityIcons name="close" size={24} color={Colors.dark.textSecondary} />
                            </TouchableOpacity>
                        </View>

                        <SpendingHeatmap expenses={expenses} days={90} />
                    </View>
                </BlurView>
            </Modal>

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
                            const toLocalStr = (d: Date) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
                            const dStr = toLocalStr(date);
                            const selectedStr = toLocalStr(selectedDate);
                            const isSelected = dStr === selectedStr;
                            const hasData = expenses.some(e => e.dueDate === dStr);

                            const today = new Date();
                            today.setHours(0, 0, 0, 0);
                            const isFuture = date > today;

                            return (
                                <TouchableOpacity
                                    style={[
                                        styles.dateItem,
                                        isSelected && styles.dateItemSelected,
                                        isFuture && { opacity: 0.3 }
                                    ]}
                                    onPress={() => {
                                        if (isFuture) {
                                            setModalConfig({
                                                visible: true,
                                                title: "Future Date",
                                                message: "You cannot add expenses for the future yet!",
                                                singleButton: true
                                            });
                                            return;
                                        }
                                        setSelectedDate(date);
                                    }}
                                    disabled={isFuture}
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
                    {/* Heatmap moved to Modal */}

                    <View style={[styles.dayDetails, { minHeight: 500 }]}>
                        <View style={styles.dayHeader}>
                            <Text style={styles.dayHeaderTitle}>
                                {selectedDateStr === formatLocalDate(new Date()) ? 'Today' : selectedDate.toLocaleDateString('en-US', { weekday: 'long', day: 'numeric' })}
                            </Text>
                            <Text style={styles.dayHeaderTotal}>{dayTotal > 0 ? `₹${dayTotal.toLocaleString()}` : ''}</Text>
                        </View>

                        {dayExpenses.length > 0 ? (
                            dayExpenses.map((expense, index) => (
                                <View key={expense.id} style={{ marginBottom: 8 }}>
                                    <WebSwipeable
                                        ref={(ref) => {
                                            if (ref) {
                                                rowRefs.current.set(expense.id, ref);
                                            }
                                        }}
                                        onSwipeableWillOpen={() => {
                                            [...rowRefs.current.entries()].forEach(([key, ref]) => {
                                                if (key !== expense.id && ref) ref.close();
                                            });
                                        }}
                                        renderRightActions={(progress, dragX) => {
                                            const scale = dragX.interpolate({
                                                inputRange: [-100, 0],
                                                outputRange: [1, 0],
                                                extrapolate: 'clamp',
                                            });
                                            return (
                                                <TouchableOpacity
                                                    onPress={() => {
                                                        if (rowRefs.current.get(expense.id)) rowRefs.current.get(expense.id)?.close();
                                                        handleDeleteExpense(expense);
                                                    }}
                                                    style={styles.deleteAction}
                                                >
                                                    <RNAnimated.View style={{ transform: [{ scale }] }}>
                                                        <MaterialCommunityIcons name="trash-can-outline" size={24} color="#fff" />
                                                    </RNAnimated.View>
                                                    <RNAnimated.Text style={[styles.deleteActionText, { transform: [{ scale }] }]}>Delete</RNAnimated.Text>
                                                </TouchableOpacity>
                                            );
                                        }}
                                    >
                                        <Animated.View
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
                                    </WebSwipeable>
                                </View>
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

            {/* Universal Glassmorphism Modal */}
            <Modal
                transparent
                visible={modalConfig.visible}
                animationType="fade"
                onRequestClose={() => setModalConfig(prev => ({ ...prev, visible: false }))}
            >
                <BlurView intensity={20} tint="dark" style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <View style={{
                        width: '80%',
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
                </BlurView>
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
        padding: 16,
        backgroundColor: 'rgba(255,255,255,0.03)',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
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
        // ... existing
    },
    // Filter Chips
    filterContainer: {
        marginBottom: 10,
        paddingHorizontal: 0,
    },
    filterScroll: {
        paddingHorizontal: 20,
        gap: 8,
    },
    filterChip: {
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        marginRight: 8,
    },
    filterText: {
        fontSize: 12,
        fontWeight: '600',
        color: Colors.dark.textSecondary,
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
    // Swipe Actions
    deleteAction: {
        backgroundColor: '#EF4444',
        justifyContent: 'center',
        alignItems: 'center',
        width: 70,
        borderRadius: 16,
        marginLeft: 8,
    },
    deleteActionText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 10,
        marginTop: 4,
    },
});
