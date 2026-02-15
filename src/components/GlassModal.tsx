import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Dimensions } from 'react-native';
import { BlurView } from 'expo-blur';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

const { width } = Dimensions.get('window');

interface GlassModalProps {
    visible: boolean;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    onConfirm?: () => void;
    onCancel?: () => void;
    isDanger?: boolean;
    singleButton?: boolean;
    icon?: keyof typeof MaterialCommunityIcons.glyphMap;
    children?: React.ReactNode;
}

export const GlassModal = ({
    visible,
    title,
    message,
    confirmText = 'OK',
    cancelText = 'Cancel',
    onConfirm,
    onCancel,
    isDanger = false,
    singleButton = false,
    icon,
    children
}: GlassModalProps) => {
    const { colors, theme } = useTheme();

    if (!visible) return null;

    return (
        <View style={styles.modalOverlay}>
            <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFill} />
            <TouchableOpacity
                activeOpacity={1}
                style={styles.modalBackdrop}
                onPress={onCancel}
            >
                <TouchableOpacity
                    activeOpacity={1}
                    onPress={(e) => e.stopPropagation()}
                >
                    <View style={[styles.modalCard, { backgroundColor: colors.surface, borderColor: theme === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)' }]}>
                        <View style={styles.modalHeaderSection}>
                            {icon ? (
                                <View style={[styles.modalIconWrapper, {
                                    backgroundColor: isDanger ? 'rgba(239, 68, 68, 0.12)' : `${colors.primary}12`,
                                    borderColor: isDanger ? 'rgba(239, 68, 68, 0.2)' : `${colors.primary}20`
                                }]}>
                                    <MaterialCommunityIcons
                                        name={icon}
                                        size={30}
                                        color={isDanger ? '#EF4444' : colors.primary}
                                    />
                                </View>
                            ) : (
                                <View style={[styles.modalIconWrapper, {
                                    backgroundColor: isDanger ? 'rgba(239, 68, 68, 0.12)' : `${colors.primary}12`,
                                    borderColor: isDanger ? 'rgba(239, 68, 68, 0.2)' : `${colors.primary}20`
                                }]}>
                                    <MaterialCommunityIcons
                                        name={isDanger ? "delete-outline" : "information-variant"}
                                        size={30}
                                        color={isDanger ? '#EF4444' : colors.primary}
                                    />
                                </View>
                            )}
                            <Text style={[styles.modalTitle, { color: colors.text }]}>{title}</Text>
                            {message ? <Text style={[styles.modalMessage, { color: colors.textSecondary }]}>{message}</Text> : null}
                        </View>

                        {/* Custom Content Slot */}
                        {children}

                        <View style={[styles.modalButtonRow, { marginTop: children ? 24 : 0 }]}>
                            {!singleButton && (
                                <TouchableOpacity
                                    style={styles.modalCancelButton}
                                    onPress={onCancel}
                                >
                                    <Text style={styles.modalCancelText}>{cancelText}</Text>
                                </TouchableOpacity>
                            )}
                            <TouchableOpacity
                                style={[
                                    styles.modalConfirmButton,
                                    isDanger ? styles.modalConfirmDanger : styles.modalConfirmPrimary
                                ]}
                                onPress={onConfirm}
                            >
                                <Text style={styles.modalConfirmText}>{confirmText}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </TouchableOpacity>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    modalOverlay: {
        ...StyleSheet.absoluteFillObject,
        zIndex: 9999,
        elevation: 9999,
    },
    modalBackdrop: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.7)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalCard: {
        width: width * 0.85,
        maxWidth: 400,
        borderRadius: 28,
        padding: 28,
        borderWidth: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 16 },
        shadowOpacity: 0.6,
        shadowRadius: 32,
    },
    modalHeaderSection: {
        alignItems: 'center',
        marginBottom: 24,
    },
    modalIconWrapper: {
        width: 64,
        height: 64,
        borderRadius: 32,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 18,
        borderWidth: 1,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '700',
        marginBottom: 8,
        textAlign: 'center',
        letterSpacing: 0.5,
    },
    modalMessage: {
        fontSize: 15,
        textAlign: 'center',
        lineHeight: 22,
    },
    modalButtonRow: {
        flexDirection: 'row',
        gap: 12,
    },
    modalCancelButton: {
        flex: 1,
        paddingVertical: 14,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 14,
        backgroundColor: 'rgba(255,255,255,0.05)',
    },
    modalCancelText: {
        color: '#94A3B8',
        fontSize: 15,
        fontWeight: '600',
    },
    modalConfirmButton: {
        flex: 1,
        paddingVertical: 14,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 14,
    },
    modalConfirmPrimary: {
        backgroundColor: '#38BDF8',
    },
    modalConfirmDanger: {
        backgroundColor: '#EF4444',
    },
    modalConfirmText: {
        color: '#fff',
        fontSize: 15,
        fontWeight: '700',
    },
});
