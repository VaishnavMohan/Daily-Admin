
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Platform, TextInput, FlatList, Dimensions, StatusBar, KeyboardAvoidingView } from 'react-native';
import Animated, { FadeInDown, FadeOut, useAnimatedStyle, useSharedValue, withTiming, Easing } from 'react-native-reanimated';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
    { id: 'finance', label: 'Finance', description: 'Credit Cards, Loans', icon: 'credit-card-chip-outline', gradient: Colors.dark.gradients.Finance },
    { id: 'academic', label: 'Academic', description: 'Assignments, Exams', icon: 'school-outline', gradient: Colors.dark.gradients.Academic },
    { id: 'housing', label: 'Housing', description: 'Rent, Maintenance', icon: 'home-city-outline', gradient: Colors.dark.gradients.Housing },
    { id: 'work', label: 'Work', description: 'Deadlines, Projects', icon: 'briefcase-variant-outline', gradient: Colors.dark.gradients.Work },
    { id: 'utility', label: 'Utility', description: 'Bills, Recharge', icon: 'lightning-bolt', gradient: Colors.dark.gradients.Utility },
    { id: 'medicine', label: 'Health', description: 'Meds, Checkups', icon: 'pill', gradient: Colors.dark.gradients.Medicine },
    { id: 'gym', label: 'Fitness', description: 'Workouts, Diet', icon: 'dumbbell', gradient: Colors.dark.gradients.Gym },
    { id: 'other', label: 'General', description: 'Notes, Chores', icon: 'checkbox-marked-circle-outline', gradient: ['#8E8E93', '#636366'] },
];

export const AddCardScreen = ({ navigation, route }: any) => {
    const insets = useSafeAreaInsets();
    const preselectedCategory = route?.params?.preselectedCategory;
    const [selectedCategory, setSelectedCategory] = useState<TaskCategory>(preselectedCategory || 'finance');
    const [title, setTitle] = useState('');
    const [subtitle, setSubtitle] = useState('');
    const [amount, setAmount] = useState('');
    const [selectedDay, setSelectedDay] = useState<number | null>(null);
    const dateListRef = useRef<any>(null);

    const [durationMode, setDurationMode] = useState<'indefinite' | 'fixed' | 'once'>('indefinite');
    const [durationMonths, setDurationMonths] = useState(3);
    const [recurrenceFreq, setRecurrenceFreq] = useState<'once' | 'daily' | 'weekly' | 'monthly' | 'yearly'>('monthly');

    useEffect(() => {
        const today = new Date();
        const todayDate = today.getDate();
        setSelectedDay(todayDate);
        setTimeout(() => {
            if (dateListRef.current && todayDate > 3) {
                dateListRef.current.scrollToIndex({ index: todayDate - 3, animated: true, viewPosition: 0.5 });
            }
        }, 300);
    }, []);

    const currentCategory = CATEGORIES.find(c => c.id === selectedCategory) || CATEGORIES[0];

    const subInputHeight = useSharedValue(1);
    const subInputOpacity = useSharedValue(1);
    const timingConfig = { duration: 280, easing: Easing.bezier(0.25, 0.1, 0.25, 1) };

    const subInputAnimStyle = useAnimatedStyle(() => ({
        maxHeight: subInputHeight.value * 90,
        opacity: subInputOpacity.value,
        overflow: 'hidden' as const,
    }));

    useEffect(() => {
        const needsSubInput = selectedCategory === 'finance' || selectedCategory === 'utility' || selectedCategory === 'housing';
        subInputHeight.value = withTiming(needsSubInput ? 1 : 0, timingConfig);
        subInputOpacity.value = withTiming(needsSubInput ? 1 : 0, timingConfig);
    }, [selectedCategory]);

    const handleCategorySelect = (id: TaskCategory) => {
        setSelectedCategory(id);
        if (id === 'work' || id === 'academic') {
            setDurationMode('once');
            setRecurrenceFreq('weekly');
        } else if (id === 'medicine') {
            setDurationMode('indefinite');
            setRecurrenceFreq('daily');
        } else if (id === 'gym') {
            setDurationMode('indefinite');
            setRecurrenceFreq('weekly');
        } else {
            setDurationMode('indefinite');
            setRecurrenceFreq('monthly');
        }
    };

    const handleSave = async () => {
        if (!title.trim()) {
            Alert.alert("Missing Detail", "What is this task called?");
            return;
        }
        if (!selectedDay) {
            Alert.alert("Missing Date", "When is this due?");
            return;
        }

        try {
            const today = new Date();
            let targetYear = today.getFullYear();
            let targetMonth = today.getMonth();
            const daysInMonth = new Date(targetYear, targetMonth + 1, 0).getDate();
            const finalDate = new Date(targetYear, targetMonth, Math.min(selectedDay, daysInMonth));
            if (finalDate < today) {
                targetMonth++;
                if (targetMonth > 11) { targetMonth = 0; targetYear++; }
            }
            const adjustedFinalDate = new Date(targetYear, targetMonth, Math.min(selectedDay, daysInMonth));

            let recurrence: 'once' | 'daily' | 'weekly' | 'monthly' | 'yearly' = recurrenceFreq;
            let recurrenceEndDate: string | undefined = undefined;

            if (recurrenceFreq === 'daily' || recurrenceFreq === 'weekly') {
                recurrence = recurrenceFreq;
            } else if (durationMode === 'once') {
                recurrence = 'once';
            } else if (durationMode === 'fixed') {
                recurrence = recurrenceFreq;
                const endDate = new Date(adjustedFinalDate);
                endDate.setMonth(adjustedFinalDate.getMonth() + durationMonths);
                recurrenceEndDate = endDate.toISOString().split('T')[0];
            }

            const formatDate = (date: Date) => {
                const y = date.getFullYear();
                const m = String(date.getMonth() + 1).padStart(2, '0');
                const d = String(date.getDate()).padStart(2, '0');
                return `${y}-${m}-${d}`;
            };

            let taskDueDate = (recurrenceFreq === 'daily' || recurrenceFreq === 'weekly')
                ? formatDate(today)
                : formatDate(adjustedFinalDate);

            let autoType: 'bill' | 'checklist' = 'checklist';
            if (['finance', 'housing', 'utility', 'medicine'].includes(selectedCategory)) {
                autoType = 'bill';
            }

            const newTask: LifeTask = {
                id: Date.now().toString(),
                title: title.trim(),
                subtitle: subtitle.trim() || undefined,
                category: selectedCategory,
                type: autoType,
                dueDate: taskDueDate,
                recurrence: recurrence,
                recurrenceEndDate: recurrenceEndDate,
                status: 'pending',
                amount: (selectedCategory === 'utility' || selectedCategory === 'housing') ? (amount ? parseFloat(amount) : undefined) : undefined,
                currency: 'INR',
                icon: currentCategory.icon,
                isPaid: false
            };

            await StorageService.addTask(newTask);
            const settings = await StorageService.getSettings();
            await NotificationService.scheduleCardReminders(newTask.title, newTask.subtitle || 'Task Due', new Date(taskDueDate), settings, recurrence, selectedCategory);

            navigation.goBack();
        } catch (error) {
            Alert.alert("Error", "Could not save task.");
        }
    };

    const getPlaceholder = (cat: TaskCategory) => {
        switch (cat) {
            case 'finance': return 'Credit Card Name';
            case 'housing': return 'Rent or Bill';
            case 'academic': return 'Assignment Name';
            case 'utility': return 'Utility Name';
            case 'work': return 'Project Title';
            case 'medicine': return 'Medicine Name';
            case 'gym': return 'Workout Name';
            default: return 'Task Name';
        }
    };

    const accentColor = currentCategory.gradient[0];

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />
            <LinearGradient
                colors={Colors.dark.gradients.AppBackground as any}
                style={StyleSheet.absoluteFill}
            />

            <View style={[styles.accentGlow, { backgroundColor: accentColor }]} />

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeBtn} activeOpacity={0.7}>
                        <MaterialCommunityIcons name="close" size={22} color="#fff" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>New Task</Text>
                    <TouchableOpacity onPress={handleSave} activeOpacity={0.7}>
                        <LinearGradient
                            colors={currentCategory.gradient as any}
                            style={styles.saveBtn}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                        >
                            <Text style={styles.saveText}>Save</Text>
                        </LinearGradient>
                    </TouchableOpacity>
                </View>

                <ScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.scrollContent}
                    keyboardShouldPersistTaps="handled"
                >
                    <View style={styles.inputSection}>
                        <Text style={[styles.sectionLabel, { color: accentColor }]}>WHAT</Text>
                        <TextInput
                            style={styles.mainInput}
                            placeholder={getPlaceholder(selectedCategory)}
                            placeholderTextColor="rgba(255,255,255,0.2)"
                            value={title}
                            onChangeText={setTitle}
                            selectionColor={accentColor}
                            autoFocus={true}
                        />

                        <Animated.View style={subInputAnimStyle}>
                            {selectedCategory === 'finance' ? (
                                <View style={styles.subInputWrap}>
                                    <Text style={[styles.sectionLabel, { color: accentColor }]}>LAST 4 DIGITS</Text>
                                    <TextInput
                                        style={styles.subInput}
                                        placeholder="8842"
                                        placeholderTextColor="rgba(255,255,255,0.2)"
                                        value={subtitle}
                                        onChangeText={(t) => { if (/^\d*$/.test(t) && t.length <= 4) setSubtitle(t); }}
                                        keyboardType="numeric"
                                        maxLength={4}
                                    />
                                </View>
                            ) : (selectedCategory === 'utility' || selectedCategory === 'housing') ? (
                                <View style={styles.subInputWrap}>
                                    <Text style={[styles.sectionLabel, { color: accentColor }]}>AMOUNT (₹)</Text>
                                    <TextInput
                                        style={styles.subInput}
                                        placeholder="0.00"
                                        placeholderTextColor="rgba(255,255,255,0.2)"
                                        value={amount}
                                        onChangeText={setAmount}
                                        keyboardType="numeric"
                                    />
                                </View>
                            ) : (
                                <View style={styles.subInputWrap} />
                            )}
                        </Animated.View>
                    </View>

                    <View style={styles.section}>
                        <Text style={[styles.sectionLabel, { color: accentColor }]}>CATEGORY</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryScroll}>
                            {CATEGORIES.map(cat => {
                                const isSelected = selectedCategory === cat.id;
                                return (
                                    <TouchableOpacity
                                        key={cat.id}
                                        onPress={() => handleCategorySelect(cat.id)}
                                        activeOpacity={0.7}
                                        style={[
                                            styles.categoryChip,
                                            isSelected && { borderColor: cat.gradient[0], backgroundColor: `${cat.gradient[0]}15` }
                                        ]}
                                    >
                                        <View style={[styles.catIconWrap, { backgroundColor: isSelected ? cat.gradient[0] : 'rgba(255,255,255,0.06)' }]}>
                                            <MaterialCommunityIcons name={cat.icon as any} size={16} color={isSelected ? '#fff' : Colors.dark.textTertiary} />
                                        </View>
                                        <Text style={[styles.catLabel, isSelected && { color: '#fff', fontWeight: '600' }]}>{cat.label}</Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </ScrollView>
                    </View>

                    <View style={styles.section}>
                        <Text style={[styles.sectionLabel, { color: accentColor }]}>DUE DAY</Text>
                        <FlatList
                            ref={dateListRef}
                            horizontal
                            data={Array.from({ length: 31 }, (_, i) => i + 1)}
                            keyExtractor={item => item.toString()}
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={{ paddingHorizontal: 0, gap: 8 }}
                            renderItem={({ item }) => {
                                const isToday = item === new Date().getDate();
                                const isActive = selectedDay === item;
                                return (
                                    <TouchableOpacity
                                        onPress={() => setSelectedDay(item)}
                                        style={[styles.dateChip, isActive && { borderColor: accentColor }]}
                                    >
                                        {isActive ? (
                                            <LinearGradient
                                                colors={currentCategory.gradient as any}
                                                style={[StyleSheet.absoluteFill, { borderRadius: 12 }]}
                                            />
                                        ) : null}
                                        <Text style={[styles.dateNum, isActive && { color: '#fff', fontWeight: '700' }]}>
                                            {item}
                                        </Text>
                                        {isToday && !isActive && <View style={[styles.todayDot, { backgroundColor: accentColor }]} />}
                                    </TouchableOpacity>
                                );
                            }}
                        />
                    </View>

                    <View style={styles.section}>
                        <Text style={[styles.sectionLabel, { color: accentColor }]}>FREQUENCY</Text>
                        <View style={styles.freqRow}>
                            {(['daily', 'weekly', 'monthly', 'yearly'] as const).map((freq) => {
                                const isActive = recurrenceFreq === freq;
                                return (
                                    <TouchableOpacity
                                        key={freq}
                                        style={[styles.freqChip, isActive && { borderColor: accentColor }]}
                                        onPress={() => {
                                            setRecurrenceFreq(freq);
                                            if (freq === 'daily' || freq === 'weekly') {
                                                setDurationMode('indefinite');
                                            }
                                        }}
                                    >
                                        {isActive ? (
                                            <LinearGradient
                                                colors={currentCategory.gradient as any}
                                                style={[StyleSheet.absoluteFill, { borderRadius: 12 }]}
                                            />
                                        ) : null}
                                        <Text style={[styles.freqText, isActive && { color: '#fff', fontWeight: '700' }]}>
                                            {freq.charAt(0).toUpperCase() + freq.slice(1)}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>

                        <View style={styles.durationSection}>
                            <Text style={[styles.sectionLabel, { color: accentColor }]}>DURATION</Text>
                            <View style={styles.durationRow}>
                                {(['indefinite', 'once', 'fixed'] as const).map((mode) => {
                                    const isActive = durationMode === mode;
                                    const isDisabled = (recurrenceFreq === 'daily' || recurrenceFreq === 'weekly') && mode !== 'indefinite';
                                    return (
                                        <TouchableOpacity
                                            key={mode}
                                            style={[
                                                styles.durationChip,
                                                isActive && { borderColor: accentColor, backgroundColor: `${accentColor}20` },
                                                isDisabled && { opacity: 0.3 }
                                            ]}
                                            onPress={() => setDurationMode(mode)}
                                            disabled={isDisabled}
                                        >
                                            <Text style={[styles.durationText, isActive && { color: accentColor, fontWeight: '700' }]}>
                                                {mode === 'indefinite' ? 'Forever' : mode === 'once' ? 'Once' : 'Custom'}
                                            </Text>
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>
                            {durationMode === 'fixed' && (
                                <View style={styles.stepperRow}>
                                    <Text style={styles.stepperLabel}>Duration</Text>
                                    <View style={styles.stepper}>
                                        <TouchableOpacity
                                            style={styles.stepBtn}
                                            onPress={() => setDurationMonths(Math.max(1, durationMonths - 1))}
                                        >
                                            <MaterialCommunityIcons name="minus" size={16} color={Colors.dark.textSecondary} />
                                        </TouchableOpacity>
                                        <Text style={styles.stepValue}>{durationMonths} mo</Text>
                                        <TouchableOpacity
                                            style={styles.stepBtn}
                                            onPress={() => setDurationMonths(Math.min(24, durationMonths + 1))}
                                        >
                                            <MaterialCommunityIcons name="plus" size={16} color={Colors.dark.textSecondary} />
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            )}
                        </View>
                    </View>

                    <View style={{ height: 120 }} />
                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.dark.background,
    },
    accentGlow: {
        position: 'absolute',
        top: -80,
        left: '10%',
        right: '10%',
        height: 200,
        borderRadius: 100,
        opacity: 0.08,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.06)',
    },
    headerTitle: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '700',
        letterSpacing: -0.3,
    },
    closeBtn: {
        width: 40,
        height: 40,
        borderRadius: 14,
        backgroundColor: 'rgba(255,255,255,0.08)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    saveBtn: {
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 14,
    },
    saveText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 14,
    },
    scrollContent: {
        paddingHorizontal: 20,
        paddingTop: 8,
    },
    inputSection: {
        marginTop: 20,
        marginBottom: 8,
    },
    sectionLabel: {
        fontSize: 11,
        fontWeight: '700',
        letterSpacing: 1.2,
        marginBottom: 10,
    },
    mainInput: {
        fontSize: 28,
        fontWeight: '300',
        color: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.1)',
        paddingBottom: 12,
        paddingTop: 4,
    },
    subInputWrap: {
        marginTop: 24,
    },
    subInput: {
        fontSize: 20,
        fontWeight: '400',
        color: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.1)',
        paddingBottom: 10,
    },
    section: {
        marginTop: 28,
    },
    categoryScroll: {
        gap: 10,
        paddingRight: 20,
    },
    categoryChip: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        paddingHorizontal: 14,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
        backgroundColor: 'rgba(255,255,255,0.03)',
        gap: 8,
    },
    catIconWrap: {
        width: 30,
        height: 30,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    catLabel: {
        color: Colors.dark.textSecondary,
        fontSize: 13,
        fontWeight: '500',
    },
    dateChip: {
        width: 44,
        height: 52,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
        backgroundColor: 'rgba(255,255,255,0.03)',
        overflow: 'hidden',
    },
    dateNum: {
        fontSize: 16,
        fontWeight: '500',
        color: Colors.dark.textSecondary,
    },
    todayDot: {
        width: 4,
        height: 4,
        borderRadius: 2,
        marginTop: 4,
    },
    freqRow: {
        flexDirection: 'row',
        gap: 10,
    },
    freqChip: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 12,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
        backgroundColor: 'rgba(255,255,255,0.03)',
        overflow: 'hidden',
    },
    freqText: {
        color: Colors.dark.textSecondary,
        fontSize: 13,
        fontWeight: '500',
    },
    durationSection: {
        marginTop: 24,
    },
    durationRow: {
        flexDirection: 'row',
        gap: 10,
    },
    durationChip: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 12,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
        backgroundColor: 'rgba(255,255,255,0.03)',
    },
    durationText: {
        color: Colors.dark.textSecondary,
        fontSize: 13,
        fontWeight: '500',
    },
    stepperRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 16,
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderRadius: 14,
        backgroundColor: 'rgba(255,255,255,0.04)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
    },
    stepperLabel: {
        color: Colors.dark.textSecondary,
        fontSize: 14,
        fontWeight: '500',
    },
    stepper: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    stepBtn: {
        width: 32,
        height: 32,
        borderRadius: 10,
        backgroundColor: 'rgba(255,255,255,0.08)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    stepValue: {
        fontSize: 16,
        fontWeight: '700',
        color: '#fff',
        minWidth: 50,
        textAlign: 'center',
    },
});
