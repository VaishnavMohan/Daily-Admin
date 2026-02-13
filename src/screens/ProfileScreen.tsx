import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Colors from '../constants/Colors';
import { FadeInDown } from 'react-native-reanimated';
import Animated from 'react-native-reanimated';

export const ProfileScreen = ({ navigation }: any) => {

    const MenuOption = ({ icon, label, subtitle, onPress }: any) => (
        <TouchableOpacity style={styles.menuOption} onPress={onPress}>
            <View style={styles.iconContainer}>
                <MaterialCommunityIcons name={icon} size={24} color={Colors.dark.primary} />
            </View>
            <View style={{ flex: 1 }}>
                <Text style={styles.menuLabel}>{label}</Text>
                {subtitle && <Text style={styles.menuSubtitle}>{subtitle}</Text>}
            </View>
            <MaterialCommunityIcons name="chevron-right" size={24} color={Colors.dark.textSecondary} />
        </TouchableOpacity>
    );

    const handleHelp = () => {
        Alert.alert(
            "How to use Daily Admin",
            "1. Dashboard: See urgent tasks & daily progress.\n2. Timeline: View tasks by date.\n3. Categories: Manage specific areas of life.\n4. Add (+): Create new bills, chores, or habits."
        );
    };

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={[Colors.dark.background, '#0f172a']}
                style={StyleSheet.absoluteFill}
            />
            <SafeAreaView style={{ flex: 1 }}>
                <ScrollView contentContainerStyle={styles.content}>
                    {/* Header */}
                    <View style={styles.header}>
                        <View style={styles.avatarContainer}>
                            <MaterialCommunityIcons name="account" size={40} color="#fff" />
                        </View>
                        <View>
                            <Text style={styles.userName}>User</Text>
                            <Text style={styles.userStatus}>Life Admin Manager</Text>
                        </View>
                    </View>

                    {/* Settings Section */}
                    <Animated.View entering={FadeInDown.delay(100)} style={styles.section}>
                        <Text style={styles.sectionTitle}>App Settings</Text>
                        <MenuOption
                            icon="bell-ring-outline"
                            label="Notifications"
                            subtitle="Manage alerts & frequency"
                            onPress={() => navigation.navigate('Settings')}
                        />
                        <MenuOption
                            icon="palette-outline"
                            label="Appearance"
                            subtitle="Dark Mode (Default)"
                            onPress={() => { }}
                        />
                    </Animated.View>

                    {/* Support Section */}
                    <Animated.View entering={FadeInDown.delay(200)} style={styles.section}>
                        <Text style={styles.sectionTitle}>Support</Text>
                        <MenuOption
                            icon="help-circle-outline"
                            label="How to use"
                            subtitle="Quick guide to features"
                            onPress={handleHelp}
                        />
                        <MenuOption
                            icon="information-outline"
                            label="About"
                            subtitle="Version 1.0.0"
                            onPress={() => { }}
                        />
                    </Animated.View>

                    {/* Data Section */}
                    <Animated.View entering={FadeInDown.delay(300)} style={styles.section}>
                        <Text style={styles.sectionTitle}>Data</Text>
                        <MenuOption
                            icon="database-export-outline"
                            label="Export Data"
                            subtitle="Download your tasks"
                            onPress={() => Alert.alert("Coming Soon", "Data export will be available in the next update.")}
                        />
                    </Animated.View>

                </ScrollView>
            </SafeAreaView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.dark.background,
    },
    content: {
        padding: 24,
        paddingBottom: 100,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 40,
        marginTop: 20,
    },
    avatarContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: Colors.dark.primary,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 20,
        borderWidth: 4,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    userName: {
        fontSize: 24,
        fontWeight: 'bold',
        color: Colors.dark.text,
    },
    userStatus: {
        fontSize: 16,
        color: Colors.dark.textSecondary,
    },
    section: {
        marginBottom: 32,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: Colors.dark.text,
        marginBottom: 16,
        marginLeft: 4,
    },
    menuOption: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.03)',
        padding: 16,
        borderRadius: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: 'rgba(255,255,255,0.05)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    menuLabel: {
        fontSize: 16,
        fontWeight: '600',
        color: Colors.dark.text,
    },
    menuSubtitle: {
        fontSize: 13,
        color: Colors.dark.textSecondary,
        marginTop: 2,
    },
});
