import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Switch, TouchableOpacity, Alert, SafeAreaView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Colors from '../constants/Colors';
import { Button } from '../components/Button';
import { StorageService } from '../services/StorageService';
import { NotificationService } from '../services/NotificationService';

export const SettingsScreen = ({ navigation }: any) => {
    const [notificationsEnabled, setNotificationsEnabled] = useState(true);
    const [frequency, setFrequency] = useState<'off' | 'due-only' | 'urgent-due' | '3-day' | '5-day'>('urgent-due');
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        try {
            const settings = await StorageService.getSettings();
            setNotificationsEnabled(settings.notifications.enabled);
            setFrequency(settings.notifications.frequency);
        } catch (error) {
            console.error('Error loading settings:', error);
        }
    };

    const handleSave = async () => {
        setIsLoading(true);
        try {
            const settings = {
                notifications: {
                    enabled: notificationsEnabled,
                    frequency: frequency
                }
            };

            await StorageService.saveSettings(settings);

            // Reschedule all notifications with new settings
            const cards = await StorageService.getTasks();
            await NotificationService.rescheduleAll(cards, settings);

            Alert.alert('Success', 'Settings saved successfully!', [
                { text: 'OK', onPress: () => navigation.goBack() }
            ]);
        } catch (error) {
            console.error('Error saving settings:', error);
            Alert.alert('Error', 'Failed to save settings');
        } finally {
            setIsLoading(false);
        }
    };

    const FrequencyOption = ({ value, label, description }: any) => {
        const selected = frequency === value;
        return (
            <TouchableOpacity
                style={[styles.optionCard, selected && styles.optionCardSelected]}
                onPress={() => setFrequency(value)}
            >
                <View style={styles.radioOuter}>
                    {selected && <View style={styles.radioInner} />}
                </View>
                <View style={{ flex: 1 }}>
                    <Text style={[styles.optionLabel, selected && styles.optionLabelSelected]}>
                        {label}
                    </Text>
                    <Text style={styles.optionDescription}>{description}</Text>
                </View>
            </TouchableOpacity>
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
                    <View style={styles.header}>
                        <Text style={styles.headerTitle}>Settings</Text>
                        <Text style={styles.subHeader}>Configure your notification preferences</Text>
                    </View>

                    <View style={styles.section}>
                        <View style={styles.toggleRow}>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.toggleLabel}>Enable Notifications</Text>
                                <Text style={styles.toggleDescription}>
                                    Receive reminders for upcoming bills
                                </Text>
                            </View>
                            <Switch
                                value={notificationsEnabled}
                                onValueChange={setNotificationsEnabled}
                                trackColor={{ false: Colors.dark.border, true: Colors.dark.primary }}
                                thumbColor="#ffffff"
                            />
                        </View>
                    </View>

                    {notificationsEnabled && (
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Notification Frequency</Text>

                            <FrequencyOption
                                value="off"
                                label="Off"
                                description="No notifications (manual tracking)"
                            />

                            <FrequencyOption
                                value="due-only"
                                label="Due Date Only"
                                description="Single reminder on the due date (9 AM)"
                            />

                            <FrequencyOption
                                value="urgent-due"
                                label="Urgent + Due"
                                description="1 day before (11 AM) + due date (9 AM)"
                            />

                            <FrequencyOption
                                value="3-day"
                                label="3-Day Plan"
                                description="3 days, 1 day before + due date"
                            />

                            <FrequencyOption
                                value="5-day"
                                label="5-Day Plan"
                                description="5, 3, 1 days before + due date"
                            />
                        </View>
                    )}

                    <Button
                        label={isLoading ? "Saving..." : "Save Settings"}
                        onPress={handleSave}
                        isLoading={isLoading}
                        style={{ marginTop: 24 }}
                    />

                    <Button
                        label="Cancel"
                        onPress={() => navigation.goBack()}
                        variant="secondary"
                        style={{ marginTop: 12 }}
                    />
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
    },
    header: {
        marginTop: 20,
        marginBottom: 30,
    },
    headerTitle: {
        fontSize: 32,
        color: Colors.dark.primary,
        fontWeight: 'bold',
        letterSpacing: 0.5,
    },
    subHeader: {
        fontSize: 16,
        color: Colors.dark.textSecondary,
        marginTop: 4,
    },
    section: {
        backgroundColor: 'rgba(255,255,255,0.03)',
        borderRadius: 24,
        padding: 20,
        borderWidth: 1,
        borderColor: Colors.dark.border,
        marginBottom: 20,
    },
    sectionTitle: {
        fontSize: 18,
        color: Colors.dark.text,
        fontWeight: '600',
        marginBottom: 16,
    },
    toggleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    toggleLabel: {
        fontSize: 18,
        color: Colors.dark.text,
        fontWeight: '600',
    },
    toggleDescription: {
        fontSize: 14,
        color: Colors.dark.textSecondary,
        marginTop: 4,
    },
    optionCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 16,
        borderWidth: 2,
        borderColor: Colors.dark.border,
        marginBottom: 12,
        backgroundColor: 'rgba(255,255,255,0.02)',
    },
    optionCardSelected: {
        borderColor: Colors.dark.primary,
        backgroundColor: 'rgba(255, 215, 0, 0.05)',
    },
    radioOuter: {
        width: 24,
        height: 24,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: Colors.dark.border,
        marginRight: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    radioInner: {
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: Colors.dark.primary,
    },
    optionLabel: {
        fontSize: 16,
        color: Colors.dark.text,
        fontWeight: '600',
        marginBottom: 4,
    },
    optionLabelSelected: {
        color: Colors.dark.primary,
    },
    optionDescription: {
        fontSize: 14,
        color: Colors.dark.textSecondary,
    },
});
