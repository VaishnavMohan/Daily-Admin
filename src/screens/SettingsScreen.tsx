import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Switch, TouchableOpacity, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Colors from '../constants/Colors';
import { Button } from '../components/Button';
import { StorageService } from '../services/StorageService';
import { NotificationService } from '../services/NotificationService';
import { useTheme } from '../context/ThemeContext';
import { GlassModal } from '../components/GlassModal';

export const SettingsScreen = ({ navigation }: any) => {
    const insets = useSafeAreaInsets();
    const { colors, theme, toggleTheme } = useTheme();
    const [notificationsEnabled, setNotificationsEnabled] = useState(true);
    const [frequency, setFrequency] = useState<'off' | 'due-only' | 'urgent-due' | '3-day' | '5-day'>('urgent-due');
    const [isLoading, setIsLoading] = useState(false);
    const [modalConfig, setModalConfig] = useState<{
        visible: boolean;
        title: string;
        message: string;
        confirmText?: string;
        cancelText?: string;
        onConfirm?: () => void;
        isDanger?: boolean;
        singleButton?: boolean;
    }>({ visible: false, title: '', message: '' });

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

            setModalConfig({
                visible: true,
                title: "Success",
                message: "Settings saved successfully!",
                confirmText: "OK",
                singleButton: true,
                onConfirm: () => {
                    setModalConfig(prev => ({ ...prev, visible: false }));
                    navigation.goBack();
                }
            });
        } catch (error) {
            console.error('Error saving settings:', error);
            setModalConfig({
                visible: true,
                title: "Error",
                message: "Failed to save settings. Please try again.",
                confirmText: "OK",
                singleButton: true,
                isDanger: true,
                onConfirm: () => setModalConfig(prev => ({ ...prev, visible: false }))
            });
        } finally {
            setIsLoading(false);
        }
    };

    const FrequencyOption = ({ value, label, description }: any) => {
        const selected = frequency === value;
        return (
            <TouchableOpacity
                style={[styles.optionCard, selected && { borderColor: `${colors.primary}60` }, {
                    borderColor: theme === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
                    backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)',
                }]}
                onPress={() => setFrequency(value)}
                activeOpacity={0.7}
            >
                {selected && (
                    <LinearGradient
                        colors={[`${colors.primary}15`, `${colors.primary}05`]}
                        style={StyleSheet.absoluteFill}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                    />
                )}
                <View style={[styles.radioOuter, selected ? { borderColor: colors.primary } : {
                    borderColor: theme === 'dark' ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.15)',
                }]}>
                    {selected && (
                        <LinearGradient
                            colors={[colors.primary, '#0EA5E9']}
                            style={styles.radioInner}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                        />
                    )}
                </View>
                <View style={{ flex: 1 }}>
                    <Text style={[styles.optionLabel, { color: selected ? colors.primary : colors.text }]}>
                        {label}
                    </Text>
                    <Text style={[styles.optionDescription, { color: colors.textSecondary }]}>{description}</Text>
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <LinearGradient
                colors={colors.gradients.AppBackground as any}
                style={StyleSheet.absoluteFill}
            />
            <View style={{ flex: 1, paddingTop: insets.top }}>
                <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                    <Animated.View entering={FadeInDown.delay(50).springify()} style={styles.header}>
                        <Text style={[styles.headerTitle, { color: colors.text }]}>Settings</Text>
                        <Text style={[styles.subHeader, { color: colors.textSecondary }]}>Configure your preferences</Text>
                    </Animated.View>

                    <Animated.View entering={FadeInDown.delay(80).springify()}>
                        <LinearGradient
                            colors={[colors.glass.medium, theme === 'dark' ? 'rgba(15, 23, 42, 0.5)' : 'rgba(255, 255, 255, 0.5)']}
                            style={[styles.section, { borderColor: colors.glass.border }]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 0, y: 1 }}
                        >
                            <Text style={[styles.sectionTitle, { color: colors.textTertiary }]}>Appearance</Text>
                            <View style={styles.toggleRow}>
                                <View style={{ flex: 1 }}>
                                    <Text style={[styles.toggleLabel, { color: colors.text }]}>Dark Mode</Text>
                                    <Text style={[styles.toggleDescription, { color: colors.textSecondary }]}>
                                        {theme === 'dark' ? 'Dark theme active' : 'Light theme active'}
                                    </Text>
                                </View>
                                <TouchableOpacity onPress={toggleTheme} style={[styles.themeToggleButton, {
                                    backgroundColor: theme === 'dark' ? 'rgba(56, 189, 248, 0.15)' : 'rgba(14, 165, 233, 0.12)',
                                    borderColor: theme === 'dark' ? 'rgba(56, 189, 248, 0.3)' : 'rgba(14, 165, 233, 0.25)',
                                }]}>
                                    <MaterialCommunityIcons
                                        name={theme === 'dark' ? 'weather-night' : 'weather-sunny'}
                                        size={22}
                                        color={colors.primary}
                                    />
                                </TouchableOpacity>
                            </View>
                        </LinearGradient>
                    </Animated.View>

                    <Animated.View entering={FadeInDown.delay(100).springify()}>
                        <LinearGradient
                            colors={[colors.glass.medium, theme === 'dark' ? 'rgba(15, 23, 42, 0.5)' : 'rgba(255, 255, 255, 0.5)']}
                            style={[styles.section, { borderColor: colors.glass.border }]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 0, y: 1 }}
                        >
                            <View style={styles.toggleRow}>
                                <View style={{ flex: 1 }}>
                                    <Text style={[styles.toggleLabel, { color: colors.text }]}>Enable Notifications</Text>
                                    <Text style={[styles.toggleDescription, { color: colors.textSecondary }]}>
                                        Receive reminders for upcoming bills
                                    </Text>
                                </View>
                                <Switch
                                    value={notificationsEnabled}
                                    onValueChange={setNotificationsEnabled}
                                    trackColor={{ false: colors.border, true: colors.primary }}
                                    thumbColor="#ffffff"
                                />
                            </View>
                        </LinearGradient>
                    </Animated.View>

                    {notificationsEnabled && (
                        <Animated.View entering={FadeInDown.delay(150).springify()}>
                            <LinearGradient
                                colors={[colors.glass.medium, theme === 'dark' ? 'rgba(15, 23, 42, 0.5)' : 'rgba(255, 255, 255, 0.5)']}
                                style={[styles.section, { borderColor: colors.glass.border }]}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 0, y: 1 }}
                            >
                                <Text style={[styles.sectionTitle, { color: colors.textTertiary }]}>Notification Frequency</Text>

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
            <GlassModal
                visible={modalConfig.visible}
                title={modalConfig.title}
                message={modalConfig.message}
                confirmText={modalConfig.confirmText}
                cancelText={modalConfig.cancelText}
                onConfirm={() => {
                    if (modalConfig.onConfirm) modalConfig.onConfirm();
                    else setModalConfig(prev => ({ ...prev, visible: false }));
                }}
                onCancel={() => setModalConfig(prev => ({ ...prev, visible: false }))}
                isDanger={modalConfig.isDanger}
                singleButton={modalConfig.singleButton}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
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
        fontWeight: '800',
        letterSpacing: -1,
    },
    subHeader: {
        fontSize: 15,
        marginTop: 4,
        fontWeight: '500',
    },
    section: {
        borderRadius: 22,
        padding: 20,
        borderWidth: 1,
        marginBottom: 20,
        overflow: 'hidden',
    },
    sectionTitle: {
        fontSize: 13,
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
        fontWeight: '700',
    },
    toggleDescription: {
        fontSize: 14,
        marginTop: 4,
    },
    themeToggleButton: {
        width: 44,
        height: 44,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
    },
    optionCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 16,
        borderWidth: 1.5,
        marginBottom: 10,
        overflow: 'hidden',
        position: 'relative',
    },
    radioOuter: {
        width: 22,
        height: 22,
        borderRadius: 11,
        borderWidth: 2,
        marginRight: 14,
        alignItems: 'center',
        justifyContent: 'center',
    },
    radioInner: {
        width: 12,
        height: 12,
        borderRadius: 6,
    },
    optionLabel: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 3,
    },
    optionDescription: {
        fontSize: 13,
    },
});
