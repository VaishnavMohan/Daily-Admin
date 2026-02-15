import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, Modal, TextInput, FlatList, KeyboardAvoidingView, Platform, Animated as RNAnimated } from 'react-native';
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
                <TouchableOpacity onPress={() => handleDeleteExpense(expense)} style={styles.deleteActionInner}>
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
                <View style={styles.headerSpacer} />

                {/* Month Selector Title */}
                <TouchableOpacity
                    style={styles.monthSelector}
                    onPress={() => setShowMonthPicker(true)}
                >
                    <Text style={styles.headerTitle}>{currentViewMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</Text>
                    <MaterialCommunityIcons name="chevron-down" size={20} color={Colors.dark.text} />
                </TouchableOpacity>

                <View style={styles.headerActions}>
                    <TouchableOpacity
                        onPress={() => setShowInsights(true)}
                        style={styles.headerInsightBtn}
                    >
                        <MaterialCommunityIcons name="chart-bar" size={20} color={Colors.dark.primary} />
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={() => setShowAddModal(true)}
                        style={[styles.headerAdd, { opacity: isCurrentMonth ? 1 : 0.5 }]}
                        disabled={!isCurrentMonth}
                    >
                        <LinearGradient
                            colors={['#38BDF8', '#0EA5E9']}
                            style={styles.headerAddGradient}
                        >
                            <MaterialCommunityIcons name="plus" size={24} color="#fff" />
                        </LinearGradient>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Range Selector */}
            <View style={styles.filterContainer}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
                    {(['day', 'month', '3m', '6m', 'year'] as const).map((range) => (
                        <TouchableOpacity
                            key={range}
                            onPress={() => {
                                setFilterRange(range);
                                // If switching to day, ensure day logic updates
                                if (range === 'day') {
                                    // Maybe scroll to today?
                                }
                            }}
                        >
                            {filterRange === range ? (
                                <LinearGradient
                                    colors={['#38BDF8', '#0EA5E9']}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                    style={styles.filterChipActive}
                                >
                                    <Text style={styles.filterTextActive}>
                                        {range === 'day' ? 'Today' : range === 'month' ? 'This Month' : range === 'year' ? 'Year' : range.toUpperCase()}
                                    </Text>
                                </LinearGradient>
                            ) : (
                                <View style={styles.filterChip}>
                                    <Text style={styles.filterText}>
                                        {range === 'day' ? 'Today' : range === 'month' ? 'This Month' : range === 'year' ? 'Year' : range.toUpperCase()}
                                    </Text>
                                </View>
                            )}
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            {/* Total Balance Card */}
            <View style={styles.overviewWrapper}>
                <LinearGradient
                    colors={['rgba(56,189,248,0.25)', 'rgba(14,165,233,0.08)', 'rgba(15,23,42,0)']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.overviewGradientBorder}
                >
                    <View style={styles.overviewContainer}>
                        <View style={styles.overviewRow}>
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
                                <MaterialCommunityIcons name="export-variant" size={18} color={Colors.dark.primary} />
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
                </LinearGradient>
            </View>


            {/* Insights Modal */}
            <Modal
                transparent
                visible={showInsights}
                animationType="fade"
                onRequestClose={() => setShowInsights(false)}
            >
                <BlurView intensity={40} tint="dark" style={styles.insightsOverlay}>
                    <TouchableOpacity style={StyleSheet.absoluteFill} onPress={() => setShowInsights(false)} />
                    <View style={styles.insightsCard}>
                        <LinearGradient
                            colors={['rgba(56,189,248,0.12)', 'rgba(30,41,59,0)']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={styles.insightsGlow}
                        />
                        <View style={styles.insightsHeader}>
                            <View style={styles.insightsTitleRow}>
                                <MaterialCommunityIcons name="chart-bar" size={22} color={Colors.dark.primary} />
                                <Text style={styles.insightsTitle}>Spending Insights</Text>
                            </View>
                            <TouchableOpacity onPress={() => setShowInsights(false)} style={styles.insightsCloseBtn}>
                                <MaterialCommunityIcons name="close" size={22} color={Colors.dark.textSecondary} />
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
                                    date.getMonth() === currentViewMonth.getMonth() && styles.pickerItemActive
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
            <View style={styles.contentArea}>

                {/* Date Strip */}
                <View style={styles.calendarContainer}>
                    <FlatList
                        ref={dateListRef}
                        data={dateStrip}
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.dateStripContent}
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
                                        isFuture && styles.dateItemFuture
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
                                    {isSelected ? (
                                        <LinearGradient
                                            colors={['#38BDF8', '#0EA5E9']}
                                            style={styles.dateItemSelectedGradient}
                                        >
                                            <Text style={styles.dayNameSelected}>
                                                {date.toLocaleDateString('en-US', { weekday: 'short' })}
                                            </Text>
                                            <Text style={styles.dayNumberSelected}>
                                                {date.getDate()}
                                            </Text>
                                        </LinearGradient>
                                    ) : (
                                        <>
                                            <Text style={styles.dayName}>
                                                {date.toLocaleDateString('en-US', { weekday: 'short' })}
                                            </Text>
                                            <Text style={styles.dayNumber}>
                                                {date.getDate()}
                                            </Text>
                                            {hasData && <View style={styles.dot} />}
                                        </>
                                    )}
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
                            dayExpenses.map((expense, index) => {
                                const cat = categories.find(c => c.key === expense.category);
                                const catColor = cat?.color || '#fff';
                                return (
                                    <View key={expense.id} style={styles.expenseRowWrapper}>
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
                                                <View style={[styles.expenseAccent, { backgroundColor: catColor }]} />
                                                <View style={[styles.catIcon, { backgroundColor: catColor + '18' }]}>
                                                    <MaterialCommunityIcons
                                                        name={cat?.icon || 'cash'}
                                                        size={20}
                                                        color={catColor}
                                                    />
                                                </View>
                                                <View style={styles.expenseInfo}>
                                                    <Text style={styles.expenseTitle}>{expense.title}</Text>
                                                    <Text style={styles.expenseCat}>{cat?.label}</Text>
                                                </View>
                                                <View style={styles.expenseAmountWrap}>
                                                    <Text style={styles.expenseAmount}>₹{expense.amount?.toLocaleString()}</Text>
                                                </View>
                                            </Animated.View>
                                        </WebSwipeable>
                                    </View>
                                );
                            })
                        ) : (
                            <View style={styles.emptyDayState}>
                                <View style={styles.emptyIconWrap}>
                                    <MaterialCommunityIcons name="receipt" size={40} color="rgba(56,189,248,0.3)" />
                                </View>
                                <Text style={styles.emptyDayTitle}>No expenses yet</Text>
                                <Text style={styles.emptyDayText}>Nothing recorded on this day</Text>
                                {isCurrentMonth && (
                                    <TouchableOpacity onPress={() => setShowAddModal(true)}>
                                        <LinearGradient
                                            colors={['#38BDF8', '#0EA5E9']}
                                            start={{ x: 0, y: 0 }}
                                            end={{ x: 1, y: 0 }}
                                            style={styles.addTodayButton}
                                        >
                                            <MaterialCommunityIcons name="plus" size={18} color="#fff" />
                                            <Text style={styles.addTodayText}>Add Expense</Text>
                                        </LinearGradient>
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
                        <LinearGradient
                            colors={['rgba(56,189,248,0.08)', 'rgba(30,41,59,0)']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={styles.modalGlow}
                        />
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Add Expense</Text>
                            <TouchableOpacity onPress={() => setShowAddModal(false)} style={styles.modalCloseBtn}>
                                <MaterialCommunityIcons name="close" size={22} color={Colors.dark.textSecondary} />
                            </TouchableOpacity>
                        </View>

                        <Text style={styles.dateLabel}>For {selectedDate.toLocaleDateString()}</Text>

                        <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="always">
                            <View style={styles.inputContainer}>
                                <Text style={styles.currencySymbol}>₹</Text>
                                <TextInput
                                    style={styles.amountInput}
                                    placeholder="0"
                                    placeholderTextColor="rgba(148,163,184,0.4)"
                                    keyboardType="numeric"
                                    value={amount}
                                    onChangeText={setAmount}
                                    autoFocus
                                />
                            </View>

                            <View style={styles.noteInputWrap}>
                                <MaterialCommunityIcons name="text" size={18} color={Colors.dark.textTertiary} style={styles.noteIcon} />
                                <TextInput
                                    style={styles.noteInput}
                                    placeholder="Description"
                                    placeholderTextColor="rgba(148,163,184,0.4)"
                                    value={note}
                                    onChangeText={setNote}
                                />
                            </View>

                            {/* Category Selector */}
                            <Text style={styles.categoryLabel}>Category</Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll} keyboardShouldPersistTaps="always">
                                {categories.map(cat => (
                                    <TouchableOpacity
                                        key={cat.key}
                                        style={[
                                            styles.categoryChip,
                                            selectedCategory === cat.key && styles.categoryChipSelected,
                                            selectedCategory === cat.key && { backgroundColor: cat.color, borderColor: cat.color }
                                        ]}
                                        onPress={() => setSelectedCategory(cat.key)}
                                    >
                                        <View style={[
                                            styles.categoryChipIconWrap,
                                            selectedCategory === cat.key
                                                ? { backgroundColor: 'rgba(255,255,255,0.2)' }
                                                : { backgroundColor: cat.color + '20' }
                                        ]}>
                                            <MaterialCommunityIcons
                                                name={cat.icon}
                                                size={18}
                                                color={selectedCategory === cat.key ? '#fff' : cat.color}
                                            />
                                        </View>
                                        <Text style={[
                                            styles.categoryChipText,
                                            selectedCategory === cat.key && styles.categoryChipTextSelected
                                        ]}>{cat.label}</Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>

                            <TouchableOpacity onPress={handleAddExpense}>
                                <LinearGradient
                                    colors={['#38BDF8', '#0EA5E9']}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                    style={styles.saveButton}
                                >
                                    <MaterialCommunityIcons name="check" size={22} color="#fff" />
                                    <Text style={styles.saveButtonText}>Save Expense</Text>
                                </LinearGradient>
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
                <BlurView intensity={20} tint="dark" style={styles.confirmOverlay}>
                    <View style={styles.confirmCard}>
                        <View style={styles.confirmIconSection}>
                            {modalConfig.isDanger ? (
                                <View style={styles.confirmIconDanger}>
                                    <MaterialCommunityIcons name="delete-outline" size={32} color="#EF4444" />
                                </View>
                            ) : (
                                <View style={styles.confirmIconInfo}>
                                    <MaterialCommunityIcons name="information-variant" size={32} color={Colors.dark.primary} />
                                </View>
                            )}
                            <Text style={styles.confirmTitle}>{modalConfig.title}</Text>
                            <Text style={styles.confirmMessage}>
                                {modalConfig.message}
                            </Text>
                        </View>

                        <View style={styles.confirmActions}>
                            {!modalConfig.singleButton && (
                                <TouchableOpacity
                                    style={styles.confirmCancelBtn}
                                    onPress={() => setModalConfig(prev => ({ ...prev, visible: false }))}
                                >
                                    <Text style={styles.confirmCancelText}>{modalConfig.cancelText || 'Cancel'}</Text>
                                </TouchableOpacity>
                            )}
                            <TouchableOpacity
                                style={[styles.confirmOkBtn, modalConfig.isDanger && styles.confirmOkBtnDanger]}
                                onPress={() => {
                                    if (modalConfig.onConfirm) modalConfig.onConfirm();
                                    else setModalConfig(prev => ({ ...prev, visible: false }));
                                }}
                            >
                                <Text style={styles.confirmOkText}>{modalConfig.confirmText || 'OK'}</Text>
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
        paddingBottom: 16,
        zIndex: 10,
    },
    headerSpacer: {
        width: 88,
    },
    monthSelector: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.06)',
        paddingVertical: 10,
        paddingHorizontal: 18,
        borderRadius: 24,
        gap: 8,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
    },
    headerTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#fff',
        letterSpacing: 0.3,
    },
    headerActions: {
        flexDirection: 'row',
        gap: 10,
    },
    headerInsightBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(56,189,248,0.12)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(56,189,248,0.2)',
    },
    headerAdd: {
        width: 40,
        height: 40,
        borderRadius: 20,
        overflow: 'hidden',
    },
    headerAddGradient: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    overviewWrapper: {
        paddingHorizontal: 20,
        marginBottom: 12,
    },
    overviewGradientBorder: {
        borderRadius: 24,
        padding: 1.5,
    },
    overviewContainer: {
        backgroundColor: 'rgba(15,23,42,0.85)',
        borderRadius: 23,
        padding: 20,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.06)',
    },
    overviewRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        width: '100%',
    },
    monthLabel: {
        fontSize: 12,
        color: Colors.dark.textSecondary,
        marginBottom: 4,
        textTransform: 'uppercase',
        letterSpacing: 1.5,
        fontWeight: '600',
    },
    monthValue: {
        fontSize: 38,
        fontWeight: '800',
        color: '#fff',
        letterSpacing: -1,
    },

    // Calendar Strip
    calendarContainer: {
        height: 80,
    },
    dateStripContent: {
        paddingHorizontal: 20,
    },
    dateItem: {
        width: 56,
        height: 72,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 18,
        backgroundColor: 'rgba(255,255,255,0.03)',
        marginRight: 10,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
        overflow: 'hidden',
    },
    dateItemFuture: {
        opacity: 0.3,
    },
    dateItemSelectedGradient: {
        flex: 1,
        width: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 17,
    },
    dayName: {
        fontSize: 11,
        color: Colors.dark.textTertiary,
        marginBottom: 4,
        textTransform: 'uppercase',
        fontWeight: '600',
        letterSpacing: 0.5,
    },
    dayNameSelected: {
        fontSize: 11,
        color: 'rgba(255,255,255,0.85)',
        marginBottom: 4,
        textTransform: 'uppercase',
        fontWeight: '600',
        letterSpacing: 0.5,
    },
    dayNumber: {
        fontSize: 18,
        fontWeight: '700',
        color: Colors.dark.textSecondary,
    },
    dayNumberSelected: {
        fontSize: 18,
        fontWeight: '800',
        color: '#fff',
    },
    dot: {
        width: 5,
        height: 5,
        borderRadius: 2.5,
        backgroundColor: Colors.dark.primary,
        marginTop: 5,
    },

    // Scroll Content
    scrollContent: {},

    // Day Details
    dayDetails: {
        paddingHorizontal: 24,
        backgroundColor: 'rgba(255,255,255,0.02)',
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        paddingTop: 28,
        marginTop: 10,
    },
    dayHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    dayHeaderTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#fff',
        letterSpacing: 0.3,
    },
    dayHeaderTotal: {
        fontSize: 18,
        fontWeight: '700',
        color: Colors.dark.primary,
    },
    expenseRowWrapper: {
        marginBottom: 10,
    },
    expenseRow: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 14,
        paddingLeft: 0,
        backgroundColor: 'rgba(30,41,59,0.5)',
        borderRadius: 18,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.06)',
        overflow: 'hidden',
    },
    expenseAccent: {
        width: 3,
        height: '70%',
        borderRadius: 2,
        marginLeft: 2,
        marginRight: 12,
    },
    catIcon: {
        width: 42,
        height: 42,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 14,
    },
    expenseInfo: {
        flex: 1,
    },
    expenseTitle: {
        fontSize: 15,
        fontWeight: '600',
        color: '#fff',
        marginBottom: 2,
    },
    expenseCat: {
        fontSize: 12,
        color: Colors.dark.textTertiary,
        fontWeight: '500',
    },
    expenseAmountWrap: {
        alignItems: 'flex-end',
    },
    expenseAmount: {
        fontSize: 16,
        fontWeight: '700',
        color: '#fff',
    },
    emptyDayState: {
        alignItems: 'center',
        paddingVertical: 48,
    },
    emptyIconWrap: {
        width: 72,
        height: 72,
        borderRadius: 36,
        backgroundColor: 'rgba(56,189,248,0.06)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
        borderWidth: 1,
        borderColor: 'rgba(56,189,248,0.12)',
    },
    emptyDayTitle: {
        color: '#fff',
        fontSize: 17,
        fontWeight: '700',
        marginBottom: 4,
    },
    emptyDayText: {
        color: Colors.dark.textTertiary,
        marginBottom: 20,
        fontSize: 14,
    },
    addTodayButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 24,
        gap: 6,
    },
    addTodayText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 14,
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
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
    },
    pickerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#fff',
        marginBottom: 20,
        textAlign: 'center',
        letterSpacing: 0.3,
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
    pickerItemActive: {
        color: Colors.dark.primary,
        fontWeight: 'bold',
    },

    // Quick Add Modal
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
        overflow: 'hidden',
    },
    modalGlow: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 120,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    modalTitle: {
        fontSize: 22,
        fontWeight: '800',
        color: '#fff',
        letterSpacing: 0.3,
    },
    modalCloseBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: 'rgba(255,255,255,0.08)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    dateLabel: {
        color: Colors.dark.textSecondary,
        marginBottom: 24,
        textAlign: 'center',
        fontSize: 14,
        fontWeight: '500',
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 24,
        paddingVertical: 16,
        backgroundColor: 'rgba(255,255,255,0.04)',
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.06)',
    },
    currencySymbol: {
        fontSize: 32,
        color: Colors.dark.primary,
        marginRight: 4,
        fontWeight: '600',
    },
    amountInput: {
        fontSize: 48,
        fontWeight: '800',
        color: '#fff',
        minWidth: 100,
    },
    noteInputWrap: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.06)',
        borderRadius: 16,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.06)',
    },
    noteIcon: {
        marginLeft: 16,
    },
    noteInput: {
        flex: 1,
        padding: 16,
        color: '#fff',
        fontSize: 16,
    },
    categoryLabel: {
        fontSize: 13,
        fontWeight: '600',
        color: Colors.dark.textTertiary,
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 12,
    },
    categoryScroll: {
        marginBottom: 28,
    },
    categoryChip: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 16,
        backgroundColor: 'rgba(255,255,255,0.04)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
        marginRight: 10,
        gap: 8,
    },
    categoryChipSelected: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    categoryChipIconWrap: {
        width: 30,
        height: 30,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    categoryChipText: {
        color: Colors.dark.textSecondary,
        fontWeight: '600',
        fontSize: 13,
    },
    categoryChipTextSelected: {
        color: '#fff',
    },
    saveButton: {
        flexDirection: 'row',
        borderRadius: 18,
        paddingVertical: 16,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
        gap: 8,
    },
    saveButtonText: {
        color: '#fff',
        fontSize: 17,
        fontWeight: '800',
    },
    // Breakdown
    breakdownContainer: {
        marginTop: 16,
        paddingBottom: 4,
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
    sectionLabel: {},
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
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.04)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
        marginRight: 6,
    },
    filterChipActive: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        marginRight: 6,
    },
    filterText: {
        fontSize: 13,
        fontWeight: '600',
        color: Colors.dark.textTertiary,
    },
    filterTextActive: {
        fontSize: 13,
        fontWeight: '700',
        color: '#fff',
    },
    exportButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 14,
        paddingVertical: 8,
        backgroundColor: 'rgba(56,189,248,0.1)',
        borderRadius: 20,
        gap: 6,
        borderWidth: 1,
        borderColor: 'rgba(56,189,248,0.15)',
    },
    exportText: {
        color: Colors.dark.primary,
        fontWeight: '600',
        fontSize: 13,
    },
    // Swipe Actions
    deleteAction: {
        backgroundColor: '#EF4444',
        justifyContent: 'center',
        alignItems: 'center',
        width: 70,
        borderRadius: 18,
        marginLeft: 8,
    },
    deleteActionInner: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
    },
    deleteActionText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 10,
        marginTop: 4,
    },
    contentArea: {
        flex: 1,
    },
    // Insights Modal
    insightsOverlay: {
        flex: 1,
        justifyContent: 'center',
        padding: 16,
    },
    insightsCard: {
        backgroundColor: '#1E293B',
        borderRadius: 28,
        padding: 24,
        borderWidth: 1,
        borderColor: 'rgba(56,189,248,0.15)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.6,
        shadowRadius: 24,
        overflow: 'hidden',
    },
    insightsGlow: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 80,
    },
    insightsHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    insightsTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    insightsTitle: {
        fontSize: 20,
        fontWeight: '800',
        color: '#fff',
        letterSpacing: 0.3,
    },
    insightsCloseBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: 'rgba(255,255,255,0.08)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    // Confirm Modal
    confirmOverlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    confirmCard: {
        width: '80%',
        backgroundColor: '#1E293B',
        borderRadius: 28,
        padding: 28,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.5,
        shadowRadius: 24,
    },
    confirmIconSection: {
        alignItems: 'center',
        marginBottom: 20,
    },
    confirmIconDanger: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: 'rgba(239,68,68,0.15)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
        borderWidth: 1,
        borderColor: 'rgba(239,68,68,0.2)',
    },
    confirmIconInfo: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: 'rgba(56,189,248,0.12)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
        borderWidth: 1,
        borderColor: 'rgba(56,189,248,0.2)',
    },
    confirmTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#fff',
        marginBottom: 8,
        textAlign: 'center',
    },
    confirmMessage: {
        fontSize: 14,
        color: Colors.dark.textSecondary,
        textAlign: 'center',
        lineHeight: 20,
    },
    confirmActions: {
        flexDirection: 'row',
        gap: 12,
    },
    confirmCancelBtn: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 16,
        backgroundColor: 'rgba(255,255,255,0.06)',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.06)',
    },
    confirmCancelText: {
        color: '#fff',
        fontWeight: '600',
    },
    confirmOkBtn: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 16,
        backgroundColor: Colors.dark.primary,
        alignItems: 'center',
    },
    confirmOkBtnDanger: {
        backgroundColor: '#EF4444',
    },
    confirmOkText: {
        color: '#fff',
        fontWeight: '700',
    },
});
