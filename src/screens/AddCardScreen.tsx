import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Platform, TextInput, FlatList, Dimensions, StatusBar } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import Colors from '../constants/Colors';
import { StorageService } from '../services/StorageService';
import { NotificationService } from '../services/NotificationService';
import { TaskCategory, LifeTask } from '../types';

const { width } = Dimensions.get('window');

interface CategoryOption {
    id: TaskCategory;
    label: string;
    description: string;
    icon: string;
    gradient: readonly [string, string, ...string[]];
}

const CATEGORIES: CategoryOption[] = [
    { id: 'finance', label: 'Finance', description: 'Credit Cards, Loans, EMIs', icon: 'credit-card-chip-outline', gradient: Colors.dark.gradients.Finance },
    { id: 'academic', label: 'Academic', description: 'Assignments, Fees, Exams', icon: 'school-outline', gradient: Colors.dark.gradients.Academic },
    { id: 'housing', label: 'Housing', description: 'Rent, Maintenance, Repairs', icon: 'home-city-outline', gradient: Colors.dark.gradients.Housing },
    { id: 'work', label: 'Work', description: 'Deadlines, Projects, Tasks', icon: 'briefcase-variant-outline', gradient: Colors.dark.gradients.Work },
    { id: 'utility', label: 'Utility', description: 'Bills, Recharge, Wifi', icon: 'lightning-bolt', gradient: Colors.dark.gradients.Utility },
    { id: 'medicine', label: 'Medicine', description: 'Daily reminders', icon: 'pill', gradient: Colors.dark.gradients.Medicine },
    { id: 'gym', label: 'Gym', description: 'Workout schedule', icon: 'dumbbell', gradient: Colors.dark.gradients.Gym },
];



export const AddCardScreen = ({ navigation, route }: any) => {
    // State
    const preselectedCategory = route?.params?.preselectedCategory;
    const [selectedCategory, setSelectedCategory] = useState<TaskCategory>(preselectedCategory || 'finance');
    const [title, setTitle] = useState('');
    const [subtitle, setSubtitle] = useState('');
    const [amount, setAmount] = useState('');
    const [selectedDay, setSelectedDay] = useState<number | null>(null);
    const dateListRef = useRef<any>(null);

    // Duration State (keeping old system for now)
    const [durationMode, setDurationMode] = useState<'indefinite' | 'fixed' | 'once'>('indefinite');
    const [durationMonths, setDurationMonths] = useState(3);

    // NEW: Recurrence Frequency
    const [recurrenceFreq, setRecurrenceFreq] = useState<'once' | 'daily' | 'weekly' | 'monthly' | 'yearly'>('monthly');

    // Auto-switch defaults based on category
    useEffect(() => {
        if (selectedCategory === 'work' || selectedCategory === 'academic') {
            setDurationMode('once');
            setRecurrenceFreq('weekly'); // Weekly for assignments/work
        } else if (selectedCategory === 'medicine') {
            setDurationMode('indefinite');
            setRecurrenceFreq('daily'); // Daily for medicine
        } else if (selectedCategory === 'gym') {
            setDurationMode('indefinite');
            setRecurrenceFreq('weekly'); // Weekly for gym
        } else {
            setDurationMode('indefinite');
            setRecurrenceFreq('monthly'); // Monthly for bills
        }
    }, [selectedCategory]);

    // Auto select today's date and scroll to it
    useEffect(() => {
        const today = new Date();
        const todayDate = today.getDate();
        setSelectedDay(todayDate);

        // Scroll to today's date after a short delay
        setTimeout(() => {
            if (dateListRef.current && todayDate > 3) {
                dateListRef.current.scrollToIndex({
                    index: todayDate - 3, // Show a bit before today
                    animated: true,
                    viewPosition: 0.5
                });
            }
        }, 300);
    }, []);

    // Helpers
    const currentCategory = CATEGORIES.find(c => c.id === selectedCategory) || CATEGORIES[0];

    const handleCategorySelect = (id: TaskCategory) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        setSelectedCategory(id);
    };

    // Dynamic Labels
    const getInputMetadata = (cat: TaskCategory) => {
        switch (cat) {
            case 'finance': return { label: 'CREDIT CARD NAME', placeholder: 'e.g. HDFC Regalia' };
            case 'housing': return { label: 'PROPERTY / EXPENSE', placeholder: 'e.g. Apartment Rent' };
            case 'academic': return { label: 'SUBJECT / FEE', placeholder: 'e.g. Semester Fee' };
            case 'utility': return { label: 'SERVICE NAME', placeholder: 'e.g. Electricity Bill' };
            case 'work': return { label: 'PROJECT / TASK', placeholder: 'e.g. Q3 Report' };
            case 'medicine': return { label: 'MEDICINE NAME', placeholder: 'e.g. Vitamin D' };
            case 'gym': return { label: 'WORKOUT TYPE', placeholder: 'e.g. Weight Training' };
            default: return { label: 'TITLE', placeholder: 'What is it?' };
        }
    };

    const { label: inputLabel, placeholder: inputPlaceholder } = getInputMetadata(selectedCategory);

    const handleSave = async () => {
        if (!title.trim()) {
            Alert.alert("Missing Detail", "Please enter a title.");
            return;
        }
        if (!selectedDay) {
            Alert.alert("Missing Date", "Please select a due day.");
            return;
        }

        try {
            // Simplified logic for brevity - keeping core robustness
            const today = new Date();
            let targetYear = today.getFullYear();
            let targetMonth = today.getMonth();
            const daysInMonth = new Date(targetYear, targetMonth + 1, 0).getDate();
            const finalDate = new Date(targetYear, targetMonth, Math.min(selectedDay, daysInMonth));
            if (finalDate < today) {
                targetMonth++; // Move to next month if passed
                if (targetMonth > 11) { targetMonth = 0; targetYear++; }
            }
            // Re-calculate finalDate with potentially updated month/year
            const adjustedFinalDate = new Date(targetYear, targetMonth, Math.min(selectedDay, daysInMonth));

            const currentCategory = CATEGORIES.find(c => c.id === selectedCategory);
            if (!currentCategory) return;

            // Smart recurrence logic based on frequency
            let recurrence: 'once' | 'daily' | 'weekly' | 'monthly' | 'yearly' = recurrenceFreq;
            let recurrenceEndDate: string | undefined = undefined;

            // For daily and weekly tasks, ignore duration settings - always indefinite
            if (recurrenceFreq === 'daily' || recurrenceFreq === 'weekly') {
                // Daily/weekly tasks are habits - no end date
                recurrence = recurrenceFreq;
                recurrenceEndDate = undefined;
            } else if (durationMode === 'once') {
                // One-time tasks
                recurrence = 'once';
                recurrenceEndDate = undefined;
            } else if (durationMode === 'fixed') {
                // Fixed duration for monthly/yearly tasks
                recurrence = recurrenceFreq;
                const endDate = new Date(adjustedFinalDate);
                endDate.setMonth(adjustedFinalDate.getMonth() + durationMonths);
                recurrenceEndDate = endDate.toISOString().split('T')[0];
            } else {
                // Indefinite monthly/yearly
                recurrence = recurrenceFreq;
                recurrenceEndDate = undefined;
            }

            // Determine the correct due date based on recurrence type
            let taskDueDate: string;
            if (recurrenceFreq === 'daily' || recurrenceFreq === 'weekly') {
                // For daily/weekly habits, use today as the start date
                taskDueDate = today.toISOString().split('T')[0];
            } else {
                // For monthly/yearly/once, use the calculated future date
                taskDueDate = adjustedFinalDate.toISOString().split('T')[0];
            }

            const newTask: LifeTask = {
                id: Date.now().toString(),
                title: title.trim(),
                subtitle: subtitle.trim() || 'Due',
                category: selectedCategory,
                type: 'bill',
                dueDate: taskDueDate,
                recurrence: recurrence,
                recurrenceEndDate: recurrenceEndDate,
                status: 'pending',
                amount: (selectedCategory === 'utility' || selectedCategory === 'housing') ? (amount ? parseFloat(amount) : undefined) : undefined,
                currency: '₹',
                icon: currentCategory.icon,
                isPaid: false
            };
            await StorageService.addTask(newTask);

            const settings = await StorageService.getSettings();
            await NotificationService.scheduleCardReminders(
                newTask.title,
                newTask.subtitle || 'Task Due',
                new Date(taskDueDate),
                settings,
                recurrence, // Pass recurrence frequency for smart notifications
                selectedCategory // Pass category for context
            );

            navigation.goBack();
        } catch (error) {
            Alert.alert("Error", "Could not save task.");
        }
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />

            {/* 1. Immersive Header (Dynamic Color) */}
            <LinearGradient
                colors={currentCategory.gradient as any}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.immersiveHeader}
            >
                {/* Top Nav */}
                <View style={styles.headerNav}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
                        <MaterialCommunityIcons name="arrow-left" size={28} color="#fff" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>
                        {selectedCategory === 'finance' && 'Add Finance Card'}
                        {selectedCategory === 'medicine' && 'Add Medicine'}
                        {selectedCategory === 'gym' && 'Add Gym Task'}
                        {selectedCategory === 'academic' && 'Add Academic Task'}
                        {selectedCategory === 'work' && 'Add Work Task'}
                        {selectedCategory === 'utility' && 'Add Utility Bill'}
                        {selectedCategory === 'housing' && 'Add Housing Bill'}
                        {selectedCategory === 'other' && 'Add Task'}
                    </Text>
                    <TouchableOpacity onPress={handleSave} style={styles.saveBtn}>
                        <View style={styles.saveBtnCircle}>
                            <MaterialCommunityIcons name="check" size={24} color="#000" />
                        </View>
                    </TouchableOpacity>
                </View>

                {/* Recurrence Badge - Shows what frequency was auto-selected */}
                {selectedCategory && (
                    <View style={styles.recurrenceBadge}>
                        <Text style={styles.recurrenceBadgeText}>
                            {recurrenceFreq === 'daily' && '🔁 Daily reminders @ 8 AM & 8 PM'}
                            {recurrenceFreq === 'weekly' && '🔁 Weekly schedule'}
                            {recurrenceFreq === 'monthly' && '🔁 Monthly recurring'}
                            {recurrenceFreq === 'once' && '⏱️ One-time task'}
                        </Text>
                    </View>
                )}

                {/* Big Icon & Label */}
                <View style={styles.headerHero}>
                    <MaterialCommunityIcons name={currentCategory.icon as any} size={64} color="rgba(255,255,255,0.9)" />
                    <Text style={styles.headerCategoryLabel}>{currentCategory.label}</Text>
                    <Text style={styles.headerCategoryDesc}>{currentCategory.description}</Text>
                </View>
            </LinearGradient>

            {/* 2. Floating Card Form */}
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.floatingCard}>

                    {/* Inputs Group (iOS Style) */}
                    <View style={styles.inputGroup}>
                        <View style={styles.inputRow}>
                            <Text style={styles.inputLabel}>{inputLabel}</Text>
                            <TextInput
                                style={styles.inputField}
                                placeholder={inputPlaceholder}
                                value={title}
                                onChangeText={setTitle}
                                placeholderTextColor="#C7C7CC"
                            />
                        </View>
                        <View style={styles.divider} />

                        {selectedCategory === 'finance' && (
                            <>
                                <View style={styles.inputRow}>
                                    <Text style={styles.inputLabel}>CARD DIGITS</Text>
                                    <TextInput
                                        style={styles.inputField}
                                        placeholder="Last 4 (e.g. 8842)"
                                        value={subtitle}
                                        onChangeText={(t) => { if (/^\d*$/.test(t) && t.length <= 4) setSubtitle(t); }}
                                        keyboardType="numeric"
                                        maxLength={4}
                                    />
                                </View>
                                <View style={styles.divider} />
                            </>
                        )}

                        {(selectedCategory === 'utility' || selectedCategory === 'housing') && (
                            <View style={styles.inputRow}>
                                <Text style={styles.inputLabel}>AMOUNT</Text>
                                <TextInput
                                    style={styles.inputField}
                                    placeholder="₹0.00"
                                    value={amount}
                                    onChangeText={setAmount}
                                    keyboardType="numeric"
                                />
                            </View>
                        )}
                    </View>

                    {/* Category Selector */}
                    <Text style={styles.sectionTitle}>CATEGORY</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryRow}>
                        {CATEGORIES.map(cat => {
                            const isSelected = selectedCategory === cat.id;
                            return (
                                <TouchableOpacity
                                    key={cat.id}
                                    style={[
                                        styles.categoryCircle,
                                        isSelected && { borderColor: cat.gradient[0], borderWidth: 2 }
                                    ]}
                                    onPress={() => handleCategorySelect(cat.id)}
                                >
                                    <LinearGradient
                                        colors={isSelected ? cat.gradient as any : ['#F2F2F7', '#F2F2F7']}
                                        style={styles.categoryInner}
                                    >
                                        <MaterialCommunityIcons
                                            name={cat.icon as any}
                                            size={24}
                                            color={isSelected ? '#fff' : '#8E8E93'}
                                        />
                                    </LinearGradient>
                                </TouchableOpacity>
                            );
                        })}
                    </ScrollView>

                    {/* Duration Selector */}
                    <Text style={styles.sectionTitle}>DURATION</Text>
                    <View style={styles.durationContainer}>
                        <View style={styles.segmentRow}>
                            {(['indefinite', 'fixed', 'once'] as const).map((mode) => (
                                <TouchableOpacity
                                    key={mode}
                                    style={[
                                        styles.segmentBtn,
                                        durationMode === mode && { backgroundColor: currentCategory.gradient[0] }
                                    ]}
                                    onPress={() => setDurationMode(mode)}
                                >
                                    <Text style={[
                                        styles.segmentText,
                                        durationMode === mode && { color: '#fff', fontWeight: 'bold' }
                                    ]}>
                                        {mode === 'indefinite' ? '∞ Forever' : mode === 'fixed' ? '📅 Fixed' : '⏱️ Once'}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        {durationMode === 'fixed' && (
                            <View style={styles.counterRow}>
                                <Text style={styles.counterLabel}>Duration</Text>
                                <View style={styles.stepper}>
                                    <TouchableOpacity
                                        style={styles.stepBtn}
                                        onPress={() => setDurationMonths(Math.max(1, durationMonths - 1))}
                                    >
                                        <MaterialCommunityIcons name="minus" size={18} color="#8E8E93" />
                                    </TouchableOpacity>
                                    <Text style={styles.stepValue}>{durationMonths} mo</Text>
                                    <TouchableOpacity
                                        style={styles.stepBtn}
                                        onPress={() => setDurationMonths(Math.min(24, durationMonths + 1))}
                                    >
                                        <MaterialCommunityIcons name="plus" size={18} color="#8E8E93" />
                                    </TouchableOpacity>
                                </View>
                            </View>
                        )}
                    </View>

                    {/* Recurrence Frequency Selector - Only show for recurring tasks */}
                    {durationMode !== 'once' && (
                        <>
                            <Text style={styles.sectionTitle}>FREQUENCY</Text>
                            <View style={styles.frequencyRow}>
                                {(['daily', 'weekly', 'monthly', 'yearly'] as const).map((freq) => {
                                    const isSelected = recurrenceFreq === freq;
                                    const labels = {
                                        daily: 'Daily',
                                        weekly: 'Weekly',
                                        monthly: 'Monthly',
                                        yearly: 'Yearly'
                                    };
                                    return (
                                        <TouchableOpacity
                                            key={freq}
                                            style={[
                                                styles.frequencyChip,
                                                isSelected && {
                                                    backgroundColor: currentCategory.gradient[0],
                                                    borderColor: currentCategory.gradient[0]
                                                }
                                            ]}
                                            onPress={() => setRecurrenceFreq(freq)}
                                        >
                                            <Text style={[
                                                styles.frequencyChipText,
                                                isSelected && styles.frequencyChipTextActive
                                            ]}>
                                                {labels[freq]}
                                            </Text>
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>
                        </>
                    )}

                    {/* Due Day */}
                    <Text style={styles.sectionTitle}>DUE DAY</Text>
                    <FlatList
                        ref={dateListRef}
                        horizontal
                        data={Array.from({ length: 31 }, (_, i) => i + 1)}
                        keyExtractor={item => item.toString()}
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.dateWheel}
                        onScrollToIndexFailed={() => { }}
                        renderItem={({ item }) => (
                            <TouchableOpacity
                                onPress={() => {
                                    Haptics.selectionAsync();
                                    setSelectedDay(item);
                                }}
                                style={[
                                    styles.datePill,
                                    selectedDay === item && { backgroundColor: currentCategory.gradient[0] }
                                ]}
                            >
                                <Text style={[
                                    styles.dateText,
                                    selectedDay === item && { color: '#fff', fontWeight: 'bold' }
                                ]}>
                                    {item}
                                </Text>
                            </TouchableOpacity>
                        )}
                    />

                </View>
                <View style={{ height: 100 }} />
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F2F2F7',
    },
    immersiveHeader: {
        height: '35%',
        paddingTop: Platform.OS === 'ios' ? 60 : 40,
        paddingHorizontal: 20,
    },
    headerNav: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#fff',
    },
    iconBtn: {
        padding: 8,
    },
    saveBtn: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 5,
    },
    headerHero: {
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 10,
    },
    headerCategoryLabel: {
        color: '#fff',
        fontSize: 24,
        fontWeight: '800',
        marginTop: 10,
        letterSpacing: 1,
        textTransform: 'uppercase',
        opacity: 0.9,
    },
    headerCategoryDesc: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 13,
        fontWeight: '500',
        marginTop: 4,
        letterSpacing: 0.5,
    },
    scrollView: {
        flex: 1,
        marginTop: -60, // Overlap header
    },
    scrollContent: {
        paddingHorizontal: 20,
    },
    floatingCard: {
        backgroundColor: '#fff',
        borderRadius: 24,
        padding: 24,
        shadowColor: "#000", // Deep shadow
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.15,
        shadowRadius: 20,
        elevation: 10,
    },

    // Inputs
    inputGroup: {
        // iOS Settings Group Style
        backgroundColor: '#fff',
        borderRadius: 12,
        overflow: 'hidden',
    },
    inputRow: {
        marginBottom: 12,
    },
    inputLabel: {
        fontSize: 11,
        fontWeight: '700',
        color: '#8E8E93',
        marginBottom: 8,
        letterSpacing: 0.5,
    },
    inputField: {
        fontSize: 18,
        color: '#000',
        paddingVertical: 8,
        fontWeight: '500',
    },
    divider: {
        height: 1,
        backgroundColor: '#E5E5EA', // Divider Gray
        marginVertical: 12,
    },

    // Section Titles
    sectionTitle: {
        fontSize: 13,
        fontWeight: '700',
        color: '#8E8E93',
        marginTop: 24,
        marginBottom: 16,
        letterSpacing: 0.5,
    },

    // Categories
    categoryRow: {
        gap: 16,
        paddingBottom: 10,
    },
    categoryCircle: {
        width: 60,
        height: 60,
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
    },
    categoryInner: {
        width: 52,
        height: 52,
        borderRadius: 26,
        justifyContent: 'center',
        alignItems: 'center',
    },

    // Date Wheel
    dateWheel: {
        gap: 10,
        paddingBottom: 10,
    },
    datePill: {
        width: 44,
        height: 60,
        borderRadius: 22,
        backgroundColor: '#F2F2F7',
        justifyContent: 'center',
        alignItems: 'center',
    },
    dateText: {
        fontSize: 16,
        color: '#000',
        fontWeight: '600',
    },
    durationContainer: {
        backgroundColor: '#F2F2F7',
        borderRadius: 16,
        padding: 4,
    },
    segmentRow: {
        flexDirection: 'row',
        gap: 4,
    },
    segmentBtn: {
        flex: 1,
        paddingVertical: 10,
        alignItems: 'center',
        borderRadius: 12,
    },
    segmentText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#8E8E93',
    },
    counterRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        paddingTop: 12,
    },
    counterLabel: {
        fontSize: 15,
        fontWeight: '600',
        color: '#000',
    },
    stepper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 4,
    },
    stepBtn: {
        width: 32,
        height: 32,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 8,
        backgroundColor: '#F2F2F7',
    },
    stepValue: {
        fontSize: 14,
        fontWeight: '700',
        marginHorizontal: 8,
        minWidth: 50,
        textAlign: 'center',
        color: '#000',
    },
    recurrenceBadge: {
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderRadius: 8,
        paddingHorizontal: 16,
        paddingVertical: 8,
        marginVertical: 12,
        alignSelf: 'center',
    },
    recurrenceBadgeText: {
        fontSize: 13,
        color: '#F0F0F0',
        fontWeight: '600',
    },
    saveBtnCircle: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 4,
    },
    frequencyRow: {
        flexDirection: 'row',
        gap: 6,
        marginBottom: 20,
    },
    frequencyChip: {
        flex: 1,
        paddingVertical: 10,
        paddingHorizontal: 8,
        borderRadius: 10,
        backgroundColor: '#F2F2F7',
        borderWidth: 2,
        borderColor: '#F2F2F7',
        alignItems: 'center',
    },
    frequencyChipText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#8E8E93',
    },
    frequencyChipTextActive: {
        color: '#fff',
    },
});
