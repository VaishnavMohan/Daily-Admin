import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, FlatList, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Colors from '../constants/Colors';
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

// ... (imports remain)

export default function CategoriesScreen({ navigation }: any) {
    const renderItem = ({ item }: { item: CategoryOption }) => (
        <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => navigation.navigate('CategoryDetail', { category: item.id })}
            style={{ marginBottom: 16 }}
        >
            <GlassCard variant="medium" style={styles.cardContainer}>
                <LinearGradient
                    colors={[`${item.color}10`, 'transparent']}
                    style={StyleSheet.absoluteFill}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                />
                <View style={styles.cardContent}>
                    <View style={[styles.iconContainer, { backgroundColor: `${item.color}20`, borderColor: `${item.color}40` }]}>
                        <MaterialCommunityIcons name={item.icon as any} size={28} color={item.color} />
                    </View>
                    <View style={styles.textContainer}>
                        <Text style={[styles.categoryTitle, { color: Colors.dark.white }]}>{item.label}</Text>
                        <Text style={styles.categoryDesc}>{item.description}</Text>
                    </View>
                    <View style={[styles.arrowContainer, { backgroundColor: Colors.dark.glass.light }]}>
                        <MaterialCommunityIcons name="chevron-right" size={20} color={Colors.dark.glass.textSecondary} />
                    </View>
                </View>
            </GlassCard>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={Colors.dark.gradients.AppBackground as any}
                style={StyleSheet.absoluteFill}
            />
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>Categories</Text>
                    <Text style={styles.subHeader}>Manage your life areas</Text>
                </View>

                <FlatList
                    data={CATEGORIES}
                    keyExtractor={item => item.id}
                    renderItem={renderItem}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                />
            </SafeAreaView>
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
        paddingTop: Platform.OS === 'android' ? 40 : 0,
    },
    header: {
        paddingHorizontal: 24,
        paddingBottom: 24,
        paddingTop: 10,
    },
    headerTitle: {
        fontSize: 34,
        fontWeight: '800',
        color: Colors.dark.white,
        letterSpacing: -1,
    },
    subHeader: {
        fontSize: 16,
        color: Colors.dark.textSecondary,
        marginTop: 4,
    },
    listContent: {
        padding: 24,
        paddingTop: 0,
        paddingBottom: 100,
    },
    cardContainer: {
        borderRadius: 24,
        borderWidth: 1,
        borderColor: Colors.dark.glass.border,
    },
    cardContent: {
        padding: 20,
        flexDirection: 'row',
        alignItems: 'center',
    },
    iconContainer: {
        width: 56,
        height: 56,
        borderRadius: 20,
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
        marginBottom: 4,
    },
    categoryDesc: {
        fontSize: 13,
        color: Colors.dark.textSecondary,
        fontWeight: '500',
    },
    arrowContainer: {
        width: 32,
        height: 32,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    }
});
