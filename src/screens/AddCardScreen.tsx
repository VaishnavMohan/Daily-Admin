
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Platform, TextInput, FlatList, Dimensions, StatusBar, KeyboardAvoidingView } from 'react-native';
import Animated, { FadeIn, FadeOut, LinearTransition, FadeInDown, FadeInUp } from 'react-native-reanimated';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { BlurView } from 'expo-blur'; // Added BlurView, though not used in the provided styles
import Colors from '../constants/Colors';
import { StorageService } from '../services/StorageService';
import { NotificationService } from '../services/NotificationService';
import { TaskCategory, LifeTask } from '../types';

const { width, height } = Dimensions.get('window');

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
    // State
    const preselectedCategory = route?.params?.preselectedCategory;
    const [selectedCategory, setSelectedCategory] = useState<TaskCategory>(preselectedCategory || 'finance');
    const [title, setTitle] = useState('');
    const [subtitle, setSubtitle] = useState('');
    const [amount, setAmount] = useState('');
    const [selectedDay, setSelectedDay] = useState<number | null>(null);
    const dateListRef = useRef<any>(null);

    // Duration State
    const [durationMode, setDurationMode] = useState<'indefinite' | 'fixed' | 'once'>('indefinite');
    const [durationMonths, setDurationMonths] = useState(3);
    const [recurrenceFreq, setRecurrenceFreq] = useState<'once' | 'daily' | 'weekly' | 'monthly' | 'yearly'>('monthly');

    // Auto select today's date
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

    const handleCategorySelect = (id: TaskCategory) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setSelectedCategory(id);

        // Smart defaults
        if (id === 'work' || id === 'academic') {
            setDurationMode('once');
            setRecurrenceFreq('weekly');
        } else if (id === 'medicine') {
            setDurationMode('indefinite');
            setRecurrenceFreq('daily');
        } else if (id === 'gym') {
            setDurationMode('indefinite');
            setRecurrenceFreq('weekly');
        } else { // Default for finance, housing, utility, other
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

            // Format as YYYY-MM-DD using local time components to avoid timezone shift
            const formatDate = (date: Date) => {
                const y = date.getFullYear();
                const m = String(date.getMonth() + 1).padStart(2, '0');
                const d = String(date.getDate()).padStart(2, '0');
                return `${y}-${m}-${d}`;
            };

            let taskDueDate = (recurrenceFreq === 'daily' || recurrenceFreq === 'weekly')
                ? formatDate(today)
                : formatDate(adjustedFinalDate);

            // Determine type based on category
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

            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            navigation.goBack();
        } catch (error) {
            Alert.alert("Error", "Could not save task.");
        }
    };

    // Metadata for placeholders
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

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />

            {/* Background Gradient Mesh */}
            <LinearGradient
                colors={['#000000', '#121212']}
                style={StyleSheet.absoluteFill}
            />
            <Animated.View
                layout={LinearTransition.springify()}
                style={[styles.glowMesh]}
            >
                <LinearGradient
                    colors={currentCategory.gradient as any}
                    style={StyleSheet.absoluteFill}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                />
            </Animated.View>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconButton}>
                        <MaterialCommunityIcons name="close" size={24} color="#fff" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>New Task</Text>
                    <TouchableOpacity onPress={handleSave} style={styles.saveButton}>
                        <Text style={[styles.saveText, { color: currentCategory.gradient[0] }]}>Save</Text>
                    </TouchableOpacity>
                </View>

                <ScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.scrollContent}
                >
                    {/* 1. Main Input Section */}
                    <View style={styles.mainInputSection}>
                        <Animated.View layout={LinearTransition.springify()}>
                            <Text style={styles.label}>WHAT</Text>
                            <TextInput
                                style={styles.largeInput}
                                placeholder={getPlaceholder(selectedCategory)}
                                placeholderTextColor="rgba(255,255,255,0.3)"
                                value={title}
                                onChangeText={setTitle}
                                selectionColor={currentCategory.gradient[0]}
                                autoFocus={true}
                            />
                        </Animated.View>

                        {/* Contextual Inputs */}
                        {selectedCategory === 'finance' && (
                            <Animated.View entering={FadeInDown} exiting={FadeOut} style={styles.marginTop}>
                                <Text style={styles.label}>LAST 4 DIGITS</Text>
                                <TextInput
                                    style={styles.mediumInput}
                                    placeholder="8842"
                                    placeholderTextColor="rgba(255,255,255,0.3)"
                                    value={subtitle}
                                    onChangeText={(t) => { if (/^\d*$/.test(t) && t.length <= 4) setSubtitle(t); }}
                                    keyboardType="numeric"
                                    maxLength={4}
                                />
                            </Animated.View>
                        )}
                        {(selectedCategory === 'utility' || selectedCategory === 'housing') && (
                            <Animated.View entering={FadeInDown} exiting={FadeOut} style={styles.marginTop}>
                                <Text style={styles.label}>AMOUNT (₹)</Text>
                                <TextInput
                                    style={styles.mediumInput}
                                    placeholder="0.00"
                                    placeholderTextColor="rgba(255,255,255,0.3)"
                                    value={amount}
                                    onChangeText={setAmount}
                                    keyboardType="numeric"
                                />
                            </Animated.View>
                        )}
                    </View>

                    {/* 2. Category Selector */}
                    <View style={styles.section}>
                        <Text style={styles.label}>CATEGORY</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryRow}>
                            {CATEGORIES.map(cat => {
                                const isSelected = selectedCategory === cat.id;
                                return (
                                    <TouchableOpacity
                                        key={cat.id}
                                        onPress={() => handleCategorySelect(cat.id)}
                                        activeOpacity={0.7}
                                    >
                                        <Animated.View
                                            style={[
                                                styles.categoryPill,
                                                isSelected && { backgroundColor: 'rgba(255,255,255,0.1)', borderColor: cat.gradient[0] }
                                            ]}
                                            layout={LinearTransition}
                                        >
                                            <LinearGradient
                                                colors={isSelected ? cat.gradient as any : ['rgba(255,255,255,0.05)', 'rgba(255,255,255,0.05)']}
                                                style={styles.iconCircle}
                                            >
                                                <MaterialCommunityIcons name={cat.icon as any} size={18} color={isSelected ? '#fff' : '#8E8E93'} />
                                            </LinearGradient>
                                            {isSelected && (
                                                <Animated.Text entering={FadeIn.duration(200)} style={styles.categoryName}>
                                                    {cat.label}
                                                </Animated.Text>
                                            )}
                                        </Animated.View>
                                    </TouchableOpacity>
                                );
                            })}
                        </ScrollView>
                    </View>

                    {/* 3. Date Selection */}
                    <View style={styles.section}>
                        <Text style={styles.label}>DUE DAY</Text>
                        <FlatList
                            ref={dateListRef}
                            horizontal
                            data={Array.from({ length: 31 }, (_, i) => i + 1)}
                            keyExtractor={item => item.toString()}
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={{ paddingHorizontal: 0, gap: 12 }}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    onPress={() => {
                                        Haptics.selectionAsync();
                                        setSelectedDay(item);
                                    }}
                                    style={[
                                        styles.dateBox,
                                        selectedDay === item && { backgroundColor: currentCategory.gradient[0], borderColor: currentCategory.gradient[0] }
                                    ]}
                                >
                                    <Text style={[styles.dateText, selectedDay === item && { color: '#fff', fontWeight: 'bold' }]}>
                                        {item}
                                    </Text>
                                </TouchableOpacity>
                            )}
                        />
                    </View>

                    {/* 4. Duration & Frequency */}
                    <View style={styles.section}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 }}>
                            <Text style={styles.label}>FREQUENCY</Text>
                        </View>

                        <View style={styles.segmentContainer}>
                            {(['daily', 'weekly', 'monthly', 'yearly'] as const).map((freq) => (
                                <TouchableOpacity
                                    key={freq}
                                    style={[
                                        styles.segmentBtn,
                                        recurrenceFreq === freq && { backgroundColor: 'rgba(255,255,255,0.1)' }
                                    ]}
                                    onPress={() => {
                                        setRecurrenceFreq(freq);
                                        // Auto-adjust duration mode for daily/weekly to indefinite
                                        if (freq === 'daily' || freq === 'weekly') {
                                            setDurationMode('indefinite');
                                        } else if (durationMode === 'indefinite') {
                                            // If it was indefinite and now monthly/yearly, keep it indefinite
                                            setDurationMode('indefinite');
                                        } else {
                                            // Otherwise, default to fixed for monthly/yearly
                                            setDurationMode('fixed');
                                        }
                                    }}
                                >
                                    <Text style={[
                                        styles.segmentText,
                                        recurrenceFreq === freq && { color: currentCategory.gradient[0], fontWeight: 'bold' }
                                    ]}>
                                        {freq.charAt(0).toUpperCase() + freq.slice(1)}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <View style={{ marginTop: 24 }}>
                            <Text style={styles.label}>DURATION</Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12 }}>
                                {(['indefinite', 'once', 'fixed'] as const).map((mode) => (
                                    <TouchableOpacity
                                        key={mode}
                                        style={[
                                            styles.modePill,
                                            durationMode === mode && { backgroundColor: currentCategory.gradient[0], borderColor: currentCategory.gradient[0] }
                                        ]}
                                        onPress={() => setDurationMode(mode)}
                                        disabled={(recurrenceFreq === 'daily' || recurrenceFreq === 'weekly') && mode !== 'indefinite'} // Disable for daily/weekly if not indefinite
                                    >
                                        <Text style={[
                                            styles.modeText,
                                            durationMode === mode && { color: '#fff' },
                                            ((recurrenceFreq === 'daily' || recurrenceFreq === 'weekly') && mode !== 'indefinite') && { opacity: 0.5 }
                                        ]}>
                                            {mode === 'indefinite' ? '∞ Forever' : mode === 'once' ? 'Once' : 'Custom'}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                            {durationMode === 'fixed' && (
                                <Animated.View
                                    style={styles.counterRow}
                                    entering={FadeIn}
                                    exiting={FadeOut}
                                >
                                    <Text style={styles.counterLabel}>Duration</Text>
                                    <View style={styles.stepper}>
                                        <TouchableOpacity
                                            style={styles.stepBtn}
                                            onPress={() => setDurationMonths(Math.max(1, durationMonths - 1))}
                                        >
                                            <MaterialCommunityIcons name="minus" size={18} color="rgba(255,255,255,0.6)" />
                                        </TouchableOpacity>
                                        <Text style={styles.stepValue}>{durationMonths} mo</Text>
                                        <TouchableOpacity
                                            style={styles.stepBtn}
                                            onPress={() => setDurationMonths(Math.min(24, durationMonths + 1))}
                                        >
                                            <MaterialCommunityIcons name="plus" size={18} color="rgba(255,255,255,0.6)" />
                                        </TouchableOpacity>
                                    </View>
                                </Animated.View>
                            )}
                        </View>
                    </View>

                    <View style={{ height: 100 }} />
                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    glowMesh: {
        position: 'absolute',
        top: -100,
        left: -50,
        right: -50,
        height: 400,
        borderRadius: 200,
        transform: [{ scaleX: 2 }],
        opacity: 0.3,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: Platform.OS === 'ios' ? 60 : 40,
        paddingBottom: 20,
    },
    headerTitle: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    iconButton: {
        padding: 8,
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 20,
    },
    saveButton: {
        paddingVertical: 8,
        paddingHorizontal: 16,
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 20,
    },
    saveText: {
        fontWeight: 'bold',
        fontSize: 14,
    },
    scrollContent: {
        paddingHorizontal: 24,
    },
    // Input Section
    mainInputSection: {
        marginVertical: 20,
    },
    label: {
        color: 'rgba(255,255,255,0.4)',
        fontSize: 11,
        fontWeight: '700',
        letterSpacing: 1,
        marginBottom: 10,
        textTransform: 'uppercase',
    },
    largeInput: {
        fontSize: 34,
        fontWeight: '700',
        color: '#fff',
        paddingVertical: 10,
    },
    mediumInput: {
        fontSize: 24,
        fontWeight: '600',
        color: '#fff',
        paddingVertical: 8,
    },
    marginTop: {
        marginTop: 24,
    },
    // Sections
    section: {
        marginBottom: 32,
    },
    categoryRow: {
        gap: 12,
    },
    categoryPill: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 6,
        paddingRight: 16,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 24,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
        gap: 8,
        height: 48,
    },
    iconCircle: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
    },
    categoryName: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 14,
    },
    // Date
    dateBox: {
        width: 50,
        height: 64,
        borderRadius: 16,
        backgroundColor: 'rgba(255,255,255,0.05)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    dateText: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 18,
        fontWeight: '500',
    },
    // Segments
    segmentContainer: {
        flexDirection: 'row',
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 16,
        padding: 4,
    },
    segmentBtn: {
        flex: 1,
        paddingVertical: 12,
        alignItems: 'center',
        borderRadius: 12,
    },
    segmentText: {
        color: 'rgba(255,255,255,0.6)',
        fontSize: 13,
        fontWeight: '600',
    },
    modePill: {
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    modeText: {
        color: 'rgba(255,255,255,0.6)',
        fontWeight: '600',
        fontSize: 13,
    },
    counterRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 12,
        marginTop: 12,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 16,
    },
    counterLabel: {
        fontSize: 15,
        fontWeight: '600',
        color: '#fff',
    },
    stepper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 12,
        padding: 4,
    },
    stepBtn: {
        width: 32,
        height: 32,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 8,
        backgroundColor: 'rgba(255,255,255,0.05)',
    },
    stepValue: {
        fontSize: 14,
        fontWeight: '700',
        marginHorizontal: 8,
        minWidth: 50,
        textAlign: 'center',
        color: '#fff',
    },
});

