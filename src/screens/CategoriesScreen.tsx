import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import Colors from '../constants/Colors';
import { useTheme } from '../context/ThemeContext';
import { TaskCategory } from '../types';

interface CategoryOption {
    id: TaskCategory;
    label: string;
    icon: string;
    color: string;
    description: string;
}

const CATEGORIES: CategoryOption[] = [
    { id: 'finance', label: 'Finance', icon: 'credit-card-outline', color: Colors.dark.primary, description: 'Bills, Cards, EMI' },
    { id: 'academic', label: 'Academic', icon: 'school-outline', color: '#60a5fa', description: 'Assignments, Thesis, Exams' },
    { id: 'housing', label: 'Housing', icon: 'home-outline', color: '#f472b6', description: 'Rent, Maintenance' },
    { id: 'utility', label: 'Utility', icon: 'lightning-bolt-outline', color: '#a78bfa', description: 'Electricity, Water, Gas' },
    { id: 'work', label: 'Work', icon: 'briefcase-outline', color: '#34d399', description: 'Projects, Deadlines' },
    { id: 'health', label: 'Health', icon: 'heart-pulse', color: '#f87171', description: 'Checkups, Medicines' },
    { id: 'other', label: 'Other', icon: 'dots-horizontal', color: Colors.dark.textSecondary, description: 'Miscellaneous Tasks' },
];

import { GlassCard } from '../components/GlassCard';

export default function CategoriesScreen({ navigation }: any) {
    const insets = useSafeAreaInsets();
    const { colors, theme } = useTheme();

    const renderItem = ({ item, index }: { item: CategoryOption; index: number }) => (
        <Animated.View entering={FadeInDown.delay(80 * index).springify()}>
            <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => navigation.navigate('CategoryDetail', { category: item.id })}
                style={{ marginBottom: 14 }}
            >
                <GlassCard variant="medium" style={styles.cardContainer}>
                    <LinearGradient
                        colors={[`${item.color}15`, `${item.color}05`, 'transparent']}
                        style={StyleSheet.absoluteFill}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                    />
                    <View style={styles.cardContent}>
                        <View style={[styles.iconContainer, { backgroundColor: `${item.color}20`, borderColor: `${item.color}40` }]}>
                            <MaterialCommunityIcons name={item.icon as any} size={28} color={item.color} />
                        </View>
                        <View style={styles.textContainer}>
                            <Text style={[styles.categoryTitle, { color: colors.text }]}>{item.label}</Text>
                            <Text style={[styles.categoryDesc, { color: colors.textSecondary }]}>{item.description}</Text>
                        </View>
                        <View style={[styles.arrowContainer, { backgroundColor: `${item.color}15`, borderColor: `${item.color}25` }]}>
                            <MaterialCommunityIcons name="chevron-right" size={18} color={item.color} />
                        </View>
                    </View>
                </GlassCard>
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
                <View style={[styles.headerWrapper, { borderBottomColor: theme === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' }]}>
                    <BlurView intensity={30} tint={theme === 'dark' ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
                    <LinearGradient
                        colors={theme === 'dark' ? ['rgba(56, 189, 248, 0.08)', 'transparent'] : ['rgba(14, 165, 233, 0.05)', 'transparent']}
                        style={StyleSheet.absoluteFill}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                    />
                    <View style={styles.header}>
                        <Animated.View entering={FadeInDown.delay(50).springify()}>
                            <Text style={[styles.headerTitle, { color: colors.text }]}>Categories</Text>
                            <Text style={[styles.subHeader, { color: colors.textSecondary }]}>Manage your life areas</Text>
                        </Animated.View>
                    </View>
                </View>

                <FlatList
                    data={CATEGORIES}
                    keyExtractor={item => item.id}
                    renderItem={renderItem}
                    contentContainerStyle={styles.listContent}
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
    headerWrapper: {
        overflow: 'hidden',
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.06)',
        position: 'relative',
    },
    header: {
        paddingHorizontal: 24,
        paddingBottom: 20,
        paddingTop: 14,
    },
    headerTitle: {
        fontSize: 34,
        fontWeight: '800',
        color: Colors.dark.white,
        letterSpacing: -1,
    },
    subHeader: {
        fontSize: 15,
        color: Colors.dark.textSecondary,
        marginTop: 4,
        fontWeight: '500',
    },
    listContent: {
        padding: 24,
        paddingTop: 20,
        paddingBottom: 100,
    },
    cardContainer: {
        borderRadius: 22,
        borderWidth: 1,
        borderColor: Colors.dark.glass.border,
        overflow: 'hidden',
    },
    cardContent: {
        padding: 18,
        flexDirection: 'row',
        alignItems: 'center',
    },
    iconContainer: {
        width: 54,
        height: 54,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
        borderWidth: 1,
    },
    textContainer: {
        flex: 1,
    },
    categoryTitle: {
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 3,
        letterSpacing: -0.3,
    },
    categoryDesc: {
        fontSize: 13,
        color: Colors.dark.textSecondary,
        fontWeight: '500',
    },
    arrowContainer: {
        width: 34,
        height: 34,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
    }
});
