
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Colors from '../constants/Colors';
import DashboardScreen from './DashboardScreen';
import { AddBillScreen } from './AddBillScreen';
import { SplitBillScreen } from './SplitBillScreen';

const ScreenWrapper = ({ title, children }: { title: string, children?: React.ReactNode }) => (
    <View style={styles.container}>
        <LinearGradient
            colors={[Colors.dark.background, '#1a1a2e']}
            style={StyleSheet.absoluteFill}
        />
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>Coming Soon</Text>
        {children}
    </View>
);

import TimelineScreen from './TimelineScreen';
import { SettingsScreen } from './SettingsScreen';
import LifeDashboard from './LifeDashboard';
import { AddCardScreen } from './AddCardScreen';
import CategoryDetailScreen from './CategoryDetailScreen';
import CategoriesScreen from './CategoriesScreen';

import { ProfileScreen } from './ProfileScreen';
import { LoginScreen } from './LoginScreen';
import { SignUpScreen } from './SignUpScreen';
import { ExpenseTrackerScreen } from './ExpenseTrackerScreen';

// export const ProfileScreen = () => <ScreenWrapper title="Profile" />;

export { DashboardScreen, AddBillScreen, SplitBillScreen, TimelineScreen, SettingsScreen, LifeDashboard, AddCardScreen, CategoryDetailScreen, CategoriesScreen, ProfileScreen, ExpenseTrackerScreen, LoginScreen, SignUpScreen };

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    title: {
        fontSize: 28,
        color: Colors.dark.white,
        fontWeight: 'bold',
        marginBottom: 10,
        textShadowColor: Colors.dark.primary,
        textShadowRadius: 10,
    },
    subtitle: {
        color: Colors.dark.textSecondary,
        fontSize: 16,
    }
});
