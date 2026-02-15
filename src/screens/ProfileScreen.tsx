import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Colors from '../constants/Colors';
import { FadeInDown } from 'react-native-reanimated';
import Animated from 'react-native-reanimated';
import { useTheme } from '../context/ThemeContext';
import { GlassModal } from '../components/GlassModal';

const MENU_COLORS = {
    'bell-ring-outline': '#38BDF8',
    'palette-outline': '#C084FC',
    'help-circle-outline': '#4ADE80',
    'information-outline': '#FACC15',
    'database-export-outline': '#FB923C',
};

import { useAuth } from '../context/AuthContext';

export const ProfileScreen = ({ navigation }: any) => {
    const insets = useSafeAreaInsets();
    const { colors, theme } = useTheme();
    const { user, signOut, isGuest } = useAuth();

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

    const MenuOption = ({ icon, label, subtitle, onPress }: any) => {
        const tint = (MENU_COLORS as any)[icon] || colors.primary;
        return (
            <TouchableOpacity style={styles.menuOption} onPress={onPress} activeOpacity={0.7}>
                <LinearGradient
                    colors={[`${tint}18`, 'transparent']}
                    style={StyleSheet.absoluteFill}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                />
                <View style={[styles.iconContainer, { backgroundColor: `${tint}20`, borderColor: `${tint}40` }]}>
                    <MaterialCommunityIcons name={icon} size={22} color={tint} />
                </View>
                <View style={{ flex: 1 }}>
                    <Text style={[styles.menuLabel, { color: colors.text }]}>{label}</Text>
                    {subtitle && <Text style={[styles.menuSubtitle, { color: colors.textSecondary }]}>{subtitle}</Text>}
                </View>
                <View style={[styles.chevronContainer, {
                    backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                }]}>
                    <MaterialCommunityIcons name="chevron-right" size={20} color={colors.textTertiary} />
                </View>
            </TouchableOpacity>
        );
    };

    const getDisplayName = () => {
        if (isGuest) return 'Guest User';

        const metaName = user?.user_metadata?.full_name;
        if (metaName && metaName !== 'User' && metaName.trim() !== '') return metaName;

        if (user?.email) {
            const namePart = user.email.split('@')[0];
            const cleanName = namePart.replace(/[0-9]+$/, '');
            return cleanName.charAt(0).toUpperCase() + cleanName.slice(1);
        }
        return 'Life Admin User';
    };

    const handleHelp = () => {
        setModalConfig({
            visible: true,
            title: "How to Use",
            message: "Here's a quick guide to getting the most out of Daily Admin.",
            confirmText: "Got it",
            singleButton: true,
            onConfirm: () => setModalConfig(prev => ({ ...prev, visible: false }))
        });
    };

    const handleLogout = () => {
        setModalConfig({
            visible: true,
            title: "Sign Out",
            message: "Are you sure you want to sign out?",
            confirmText: "Sign Out",
            cancelText: "Cancel",
            isDanger: true,
            onConfirm: async () => {
                setModalConfig(prev => ({ ...prev, visible: false }));
                await signOut();
            }
        });
    };

    const handleLogin = () => {
        navigation.navigate('Auth');
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
                        <View style={styles.avatarOuter}>
                            <LinearGradient
                                colors={[colors.primary, '#0EA5E9', '#6366F1']}
                                style={styles.avatarGradientRing}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                            />
                            <View style={[styles.avatarInner, { backgroundColor: colors.backgroundSecondary }]}>
                                {isGuest ? (
                                    <Text style={{ fontSize: 24, fontWeight: 'bold', color: colors.primary }}>G</Text>
                                ) : (
                                    <MaterialCommunityIcons name="account" size={36} color={theme === 'dark' ? '#fff' : colors.primary} />
                                )}
                            </View>
                        </View>
                        <View>
                            <Text style={[styles.userName, { color: colors.text }]}>
                                {getDisplayName()}
                            </Text>
                            <TouchableOpacity onPress={isGuest ? handleLogin : () => { }}>
                                <Text style={[styles.userStatus, { color: isGuest ? colors.primary : colors.textSecondary }]}>
                                    {isGuest ? 'Tap to Sign In' : (user?.email || 'Life Admin Manager')}
                                </Text>
                            </TouchableOpacity>
                        </View>
                        {!isGuest && (
                            <TouchableOpacity style={{ marginLeft: 'auto', padding: 8 }} onPress={handleLogout}>
                                <MaterialCommunityIcons name="logout" size={24} color={colors.textSecondary} />
                            </TouchableOpacity>
                        )}
                    </Animated.View>

                    <Animated.View entering={FadeInDown.delay(100).springify()} style={styles.section}>
                        <Text style={[styles.sectionTitle, { color: colors.textTertiary }]}>App Settings</Text>
                        <LinearGradient
                            colors={[colors.glass.medium, theme === 'dark' ? 'rgba(15, 23, 42, 0.5)' : 'rgba(255, 255, 255, 0.5)']}
                            style={[styles.sectionCard, { borderColor: colors.glass.border }]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 0, y: 1 }}
                        >
                            <MenuOption
                                icon="bell-ring-outline"
                                label="Notifications"
                                subtitle="Manage alerts & frequency"
                                onPress={() => navigation.navigate('Settings')}
                            />

                        </LinearGradient>
                    </Animated.View>

                    <Animated.View entering={FadeInDown.delay(200).springify()} style={styles.section}>
                        <Text style={[styles.sectionTitle, { color: colors.textTertiary }]}>Support</Text>
                        <LinearGradient
                            colors={[colors.glass.medium, theme === 'dark' ? 'rgba(15, 23, 42, 0.5)' : 'rgba(255, 255, 255, 0.5)']}
                            style={[styles.sectionCard, { borderColor: colors.glass.border }]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 0, y: 1 }}
                        >
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
                        </LinearGradient>
                    </Animated.View>

                    <Animated.View entering={FadeInDown.delay(300).springify()} style={styles.section}>
                        <Text style={[styles.sectionTitle, { color: colors.textTertiary }]}>Data</Text>
                        <LinearGradient
                            colors={[colors.glass.medium, theme === 'dark' ? 'rgba(15, 23, 42, 0.5)' : 'rgba(255, 255, 255, 0.5)']}
                            style={[styles.sectionCard, { borderColor: colors.glass.border }]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 0, y: 1 }}
                        >
                            <MenuOption
                                icon="database-export-outline"
                                label="Export Data"
                                subtitle="Download your tasks"
                                onPress={() => setModalConfig({
                                    visible: true,
                                    title: "Coming Soon",
                                    message: "Data export will be available in the next update.",
                                    confirmText: "OK",
                                    singleButton: true,
                                    onConfirm: () => setModalConfig(prev => ({ ...prev, visible: false }))
                                })}
                            />
                        </LinearGradient>
                    </Animated.View>

                    <Animated.View entering={FadeInDown.delay(400).springify()} style={styles.footer}>
                        <LinearGradient
                            colors={[`${colors.primary}14`, theme === 'dark' ? 'rgba(99, 102, 241, 0.05)' : 'rgba(99, 102, 241, 0.03)']}
                            style={[styles.footerGradient, {
                                borderColor: theme === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
                            }]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                        >
                            <Text style={[styles.footerBrand, { color: colors.primary }]}>Daily Admin</Text>
                            <Text style={[styles.footerVersion, { color: colors.textTertiary }]}>Version 1.0.0 • Built with ❤️</Text>
                        </LinearGradient>
                    </Animated.View>

                </ScrollView>
            </View>

            {/* Reusable Glass Modal */}
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
                icon={modalConfig.title === "How to Use" ? "help-circle-outline" : undefined}
            >
                {modalConfig.title === "How to Use" && (
                    <View style={{ marginTop: 16 }}>
                        <View style={[styles.featureRow, { backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)', borderColor: theme === 'dark' ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)' }]}>
                            <MaterialCommunityIcons name="plus-box-outline" size={20} color={colors.primary} />
                            <Text style={[styles.featureText, { color: colors.text }]}>Tap + to add tasks or bills</Text>
                        </View>
                        <View style={[styles.featureRow, { backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)', borderColor: theme === 'dark' ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)' }]}>
                            <MaterialCommunityIcons name="gesture-swipe-right" size={20} color={colors.primary} />
                            <Text style={[styles.featureText, { color: colors.text }]}>Swipe right to complete</Text>
                        </View>
                        <View style={[styles.featureRow, { backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)', borderColor: theme === 'dark' ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)' }]}>
                            <MaterialCommunityIcons name="gesture-swipe-left" size={20} color="#EF4444" />
                            <Text style={[styles.featureText, { color: colors.text }]}>Swipe left to delete</Text>
                        </View>
                        <View style={[styles.featureRow, { backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)', borderColor: theme === 'dark' ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)' }]}>
                            <MaterialCommunityIcons name="filter-variant" size={20} color={colors.textSecondary} />
                            <Text style={[styles.featureText, { color: colors.text }]}>Use filters to focus on what matters</Text>
                        </View>
                    </View>
                )}
            </GlassModal>
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
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 36,
        marginTop: 16,
    },
    avatarOuter: {
        width: 76,
        height: 76,
        borderRadius: 38,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 20,
        position: 'relative',
    },
    avatarGradientRing: {
        ...StyleSheet.absoluteFillObject,
        borderRadius: 38,
    },
    avatarInner: {
        width: 68,
        height: 68,
        borderRadius: 34,
        justifyContent: 'center',
        alignItems: 'center',
    },
    userName: {
        fontSize: 26,
        fontWeight: '800',
        letterSpacing: -0.5,
    },
    userStatus: {
        fontSize: 15,
        marginTop: 2,
        fontWeight: '500',
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 13,
        fontWeight: '700',
        marginBottom: 12,
        marginLeft: 4,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    sectionCard: {
        borderRadius: 20,
        padding: 4,
        borderWidth: 1,
        overflow: 'hidden',
    },
    menuOption: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 14,
        borderRadius: 16,
        marginBottom: 2,
        overflow: 'hidden',
        position: 'relative',
    },
    iconContainer: {
        width: 42,
        height: 42,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 14,
        borderWidth: 1,
    },
    chevronContainer: {
        width: 28,
        height: 28,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    menuLabel: {
        fontSize: 16,
        fontWeight: '600',
    },
    menuSubtitle: {
        fontSize: 13,
        marginTop: 2,
    },
    footer: {
        marginTop: 8,
        alignItems: 'center',
    },
    footerGradient: {
        borderRadius: 16,
        paddingVertical: 20,
        paddingHorizontal: 32,
        alignItems: 'center',
        borderWidth: 1,
        width: '100%',
    },
    footerBrand: {
        fontSize: 18,
        fontWeight: '800',
        letterSpacing: 1,
    },
    footerVersion: {
        fontSize: 12,
        marginTop: 4,
        fontWeight: '500',
    },
    featureRow: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderRadius: 12,
        marginBottom: 8,
        borderWidth: 1,
        gap: 12,
    },
    featureText: {
        fontSize: 14,
        fontWeight: '500',
    },
});
