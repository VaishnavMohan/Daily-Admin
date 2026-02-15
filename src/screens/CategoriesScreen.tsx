import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Platform, Dimensions } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown, ZoomIn } from 'react-native-reanimated';
import Colors from '../constants/Colors';
import { useTheme } from '../context/ThemeContext';
import { TaskCategory } from '../types';

const { width } = Dimensions.get('window');
const COLUMN_WIDTH = (width - 48 - 16) / 2; // 48 padding (24*2), 16 gap

interface CategoryOption {
    id: TaskCategory;
    label: string;
    icon: string;
    color: string;
    gradient: string[];
    description: string;
    count?: number; // Placeholder for real data
}

const CATEGORIES: CategoryOption[] = [
    { id: 'finance', label: 'Finance', icon: 'wallet-outline', color: '#38bdf8', gradient: ['#0ea5e9', '#0284c7'], description: 'Bills & Budget' },
    { id: 'work', label: 'Work', icon: 'briefcase-outline', color: '#34d399', gradient: ['#10b981', '#059669'], description: 'Projects & Tasks' },
    { id: 'academic', label: 'Academic', icon: 'school-outline', color: '#818cf8', gradient: ['#6366f1', '#4f46e5'], description: 'Study & Exams' },
    { id: 'health', label: 'Health', icon: 'heart-pulse', color: '#f472b6', gradient: ['#ec4899', '#db2777'], description: 'Fitness & Meds' },
    { id: 'housing', label: 'Housing', icon: 'home-outline', color: '#fbbf24', gradient: ['#f59e0b', '#d97706'], description: 'Rent & Utilities' },
    { id: 'utility', label: 'Utility', icon: 'lightning-bolt-outline', color: '#a78bfa', gradient: ['#8b5cf6', '#7c3aed'], description: 'Bills & Meter' },
    { id: 'shopping', label: 'Shopping', icon: 'shopping-outline', color: '#fb7185', gradient: ['#f43f5e', '#e11d48'], description: 'Groceries & Fun' },
    { id: 'entertainment', label: 'Fun', icon: 'movie-open-outline', color: '#fca5a5', gradient: ['#f87171', '#ef4444'], description: 'Movies & Events' },
    { id: 'transport', label: 'Transport', icon: 'car-outline', color: '#94a3b8', gradient: ['#64748b', '#475569'], description: 'Commute & Fuel' },
    { id: 'other', label: 'Other', icon: 'dots-horizontal', color: Colors.dark.textSecondary, gradient: ['#334155', '#1e293b'], description: 'Misc Items' },
];

export default function CategoriesScreen({ navigation }: any) {
    const insets = useSafeAreaInsets();
    const { colors, theme } = useTheme();

    const renderItem = ({ item, index }: { item: CategoryOption; index: number }) => (
        <Animated.View
            entering={FadeInDown.delay(index * 50).springify()}
            style={styles.gridItem}
        >
            <TouchableOpacity
                activeOpacity={0.9}
                onPress={() => navigation.navigate('CategoryDetail', { category: item.id })}
                style={styles.cardContainer}
            >
                <LinearGradient
                    colors={item.gradient as any}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={StyleSheet.absoluteFill}
                />

                {/* Glass overlay for texture */}
                <LinearGradient
                    colors={['rgba(255,255,255,0.15)', 'rgba(255,255,255,0)']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 0, y: 1 }}
                    style={StyleSheet.absoluteFill}
                />

                <View style={styles.cardContent}>
                    <View style={styles.iconCircle}>
                        <MaterialCommunityIcons name={item.icon as any} size={28} color="#fff" />
                    </View>
                    <View style={styles.textWrapper}>
                        <Text style={styles.cardTitle}>{item.label}</Text>
                        <Text style={styles.cardDesc} numberOfLines={1}>{item.description}</Text>
                    </View>
                </View>

                {/* Decorative circle */}
                <View style={[styles.decorativeCircle, { backgroundColor: 'rgba(255,255,255,0.1)' }]} />
            </TouchableOpacity>
        </Animated.View>
    );

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <LinearGradient
                colors={colors.gradients.AppBackground as any}
                style={StyleSheet.absoluteFill}
            />

            <View style={[styles.safeArea, { paddingTop: insets.top }]}>
                {/* Header */}
                <View style={styles.header}>
                    <Animated.View entering={FadeInDown.delay(100).springify()}>
                        <Text style={[styles.headerTitle, { color: colors.text }]}>Categories</Text>
                        <Text style={[styles.subHeader, { color: colors.textSecondary }]}>
                            Organize your finances and tasks
                        </Text>
                    </Animated.View>
                </View>

                {/* Grid */}
                <FlatList
                    data={CATEGORIES}
                    keyExtractor={item => item.id}
                    renderItem={renderItem}
                    numColumns={2}
                    contentContainerStyle={styles.listContent}
                    columnWrapperStyle={styles.columnWrapper}
                    showsVerticalScrollIndicator={false}
                />
            </View>
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
    },
    header: {
        paddingHorizontal: 24,
        paddingBottom: 20,
        paddingTop: 10,
    },
    headerTitle: {
        fontSize: 34,
        fontWeight: '800',
        color: Colors.dark.white,
        letterSpacing: -1,
        marginBottom: 4,
    },
    subHeader: {
        fontSize: 16,
        color: Colors.dark.textSecondary,
        fontWeight: '500',
    },
    listContent: {
        paddingHorizontal: 24,
        paddingBottom: 100,
    },
    columnWrapper: {
        justifyContent: 'space-between',
        marginBottom: 16,
    },
    gridItem: {
        width: COLUMN_WIDTH,
        height: COLUMN_WIDTH * 1.1, // Slightly taller than wide
    },
    cardContainer: {
        flex: 1,
        borderRadius: 24,
        overflow: 'hidden',
        position: 'relative',
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    cardContent: {
        flex: 1,
        padding: 16,
        justifyContent: 'space-between',
    },
    iconCircle: {
        width: 48,
        height: 48,
        borderRadius: 16,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        // backdropFilter removed as it is not supported in React Native
    },
    textWrapper: {
        gap: 2,
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#fff',
        letterSpacing: -0.5,
    },
    cardDesc: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.8)',
        fontWeight: '500',
    },
    decorativeCircle: {
        position: 'absolute',
        top: -20,
        right: -20,
        width: 100,
        height: 100,
        borderRadius: 50,
        zIndex: -1,
    }
});
