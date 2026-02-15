import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Switch, TouchableOpacity, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import Colors from '../constants/Colors';
import { Button } from '../components/Button';
import { StorageService } from '../services/StorageService';
import { NotificationService } from '../services/NotificationService';

export const SettingsScreen = ({ navigation }: any) => {
    const insets = useSafeAreaInsets();
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
                activeOpacity={0.7}
            >
                {selected && (
                    <LinearGradient
                        colors={['rgba(56, 189, 248, 0.1)', 'rgba(56, 189, 248, 0.03)']}
                        style={StyleSheet.absoluteFill}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                    />
                )}
                <View style={[styles.radioOuter, selected && styles.radioOuterSelected]}>
                    {selected && (
                        <LinearGradient
                            colors={[Colors.dark.primary, '#0EA5E9']}
                            style={styles.radioInner}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                        />
                    )}
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
                colors={Colors.dark.gradients.AppBackground as any}
                style={StyleSheet.absoluteFill}
            />
            <View style={{ flex: 1, paddingTop: insets.top }}>
                <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                    <Animated.View entering={FadeInDown.delay(50).springify()} style={styles.header}>
                        <Text style={styles.headerTitle}>Settings</Text>
                        <Text style={styles.subHeader}>Configure your notification preferences</Text>
                    </Animated.View>

                    <Animated.View entering={FadeInDown.delay(100).springify()}>
                        <LinearGradient
                            colors={[Colors.dark.glass.medium, 'rgba(15, 23, 42, 0.5)']}
                            style={styles.section}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 0, y: 1 }}
                        >
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
                        </LinearGradient>
                    </Animated.View>

                    {notificationsEnabled && (
                        <Animated.View entering={FadeInDown.delay(150).springify()}>
                            <LinearGradient
                                colors={[Colors.dark.glass.medium, 'rgba(15, 23, 42, 0.5)']}
                                style={styles.section}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 0, y: 1 }}
                            >
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
                            </LinearGradient>
                        </Animated.View>
                    )}

                    <Animated.View entering={FadeInDown.delay(200).springify()}>
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
                    </Animated.View>
                </ScrollView>
            </View>
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
        marginTop: 16,
        marginBottom: 28,
    },
    headerTitle: {
        fontSize: 34,
        color: Colors.dark.white,
        fontWeight: '800',
        letterSpacing: -1,
    },
    subHeader: {
        fontSize: 15,
        color: Colors.dark.textSecondary,
        marginTop: 4,
        fontWeight: '500',
    },
    section: {
        borderRadius: 22,
        padding: 20,
        borderWidth: 1,
        borderColor: Colors.dark.glass.border,
        marginBottom: 20,
        overflow: 'hidden',
    },
    sectionTitle: {
        fontSize: 13,
        color: Colors.dark.textTertiary,
        fontWeight: '700',
        marginBottom: 16,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    toggleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    toggleLabel: {
        fontSize: 18,
        color: Colors.dark.text,
        fontWeight: '700',
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
        borderWidth: 1.5,
        borderColor: 'rgba(255,255,255,0.08)',
        marginBottom: 10,
        backgroundColor: 'rgba(255,255,255,0.02)',
        overflow: 'hidden',
        position: 'relative',
    },
    optionCardSelected: {
        borderColor: `${Colors.dark.primary}60`,
    },
    radioOuter: {
        width: 22,
        height: 22,
        borderRadius: 11,
        borderWidth: 2,
        borderColor: 'rgba(255,255,255,0.15)',
        marginRight: 14,
        alignItems: 'center',
        justifyContent: 'center',
    },
    radioOuterSelected: {
        borderColor: Colors.dark.primary,
    },
    radioInner: {
        width: 12,
        height: 12,
        borderRadius: 6,
    },
    optionLabel: {
        fontSize: 16,
        color: Colors.dark.text,
        fontWeight: '600',
        marginBottom: 3,
    },
    optionLabelSelected: {
        color: Colors.dark.primary,
    },
    optionDescription: {
        fontSize: 13,
        color: Colors.dark.textSecondary,
    },
});
