import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, TouchableWithoutFeedback, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { useTheme } from '../context/ThemeContext';

interface NeonActionSheetProps {
    visible: boolean;
    onClose: () => void;
    onDelete: () => void;
    onEdit?: () => void; // Optional for now
    title?: string;
}

export const NeonActionSheet: React.FC<NeonActionSheetProps> = ({ visible, onClose, onDelete, onEdit, title }) => {
    const { colors, isDark } = useTheme();

    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="fade"
            onRequestClose={onClose}
        >
            <TouchableWithoutFeedback onPress={onClose}>
                <View style={styles.overlay}>
                    <TouchableWithoutFeedback>
                        <BlurView
                            intensity={80}
                            tint={isDark ? 'dark' : 'light'}
                            style={[
                                styles.sheetContainer,
                                {
                                    backgroundColor: isDark ? 'rgba(15, 23, 42, 0.85)' : 'rgba(255, 255, 255, 0.85)',
                                    borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
                                }
                            ]}
                        >
                            {/* Gradient Border Top */}
                            <View style={[styles.topBorder, { backgroundColor: colors.primary, shadowColor: colors.primary }]} />

                            {title && <Text style={[styles.title, { color: colors.textSecondary }]}>{title}</Text>}

                            {/* Edit Option */}
                            {onEdit && (
                                <TouchableOpacity style={styles.optionButton} onPress={onEdit}>
                                    <View style={[
                                        styles.iconContainer,
                                        { backgroundColor: isDark ? 'rgba(99, 102, 241, 0.1)' : 'rgba(99, 102, 241, 0.08)' }
                                    ]}>
                                        <MaterialCommunityIcons name="pencil-outline" size={24} color={colors.primary} />
                                    </View>
                                    <Text style={[styles.optionText, { color: colors.text }]}>Edit Task</Text>
                                </TouchableOpacity>
                            )}

                            {/* Delete Option */}
                            <TouchableOpacity style={[styles.optionButton, { marginBottom: 16 }]} onPress={onDelete}>
                                <View style={[styles.iconContainer, { backgroundColor: 'rgba(239, 68, 68, 0.1)' }]}>
                                    <MaterialCommunityIcons name="trash-can-outline" size={24} color={colors.danger} />
                                </View>
                                <Text style={[styles.optionText, { color: colors.danger }]}>Delete Task</Text>
                            </TouchableOpacity>

                            {/* Cancel Button */}
                            <TouchableOpacity
                                style={[
                                    styles.cancelButton,
                                    { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }
                                ]}
                                onPress={onClose}
                            >
                                <Text style={[styles.cancelText, { color: colors.text }]}>Cancel</Text>
                            </TouchableOpacity>
                        </BlurView>
                    </TouchableWithoutFeedback>
                </View>
            </TouchableWithoutFeedback>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'flex-end',
    },
    sheetContainer: {
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 24,
        paddingBottom: Platform.OS === 'ios' ? 40 : 24,
        overflow: 'hidden',
        borderWidth: 1,
        borderBottomWidth: 0,
    },
    topBorder: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 2,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 1,
        shadowRadius: 10,
        elevation: 5,
    },
    title: {
        fontSize: 12,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 20,
        textAlign: 'center',
    },
    optionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        marginBottom: 8,
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
    },
    optionText: {
        fontSize: 16,
        fontWeight: '600',
    },
    cancelButton: {
        marginTop: 8,
        paddingVertical: 16,
        alignItems: 'center',
        borderRadius: 16,
    },
    cancelText: {
        fontSize: 16,
        fontWeight: '700',
    }
});
