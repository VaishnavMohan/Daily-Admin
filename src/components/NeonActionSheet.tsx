import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, TouchableWithoutFeedback, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Colors from '../constants/Colors';

interface NeonActionSheetProps {
    visible: boolean;
    onClose: () => void;
    onDelete: () => void;
    onEdit?: () => void; // Optional for now
    title?: string;
}

export const NeonActionSheet: React.FC<NeonActionSheetProps> = ({ visible, onClose, onDelete, onEdit, title }) => {
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
                        <View style={styles.sheetContainer}>
                            {/* Replaced BlurView with solid semi-transparent bg for stability */}
                            {/* <BlurView intensity={80} tint="dark" style={StyleSheet.absoluteFill} /> */}

                            {/* Gradient Border Top */}
                            <View style={styles.topBorder} />

                            {title && <Text style={styles.title}>{title}</Text>}

                            {/* Edit Option */}
                            {onEdit && (
                                <TouchableOpacity style={styles.optionButton} onPress={onEdit}>
                                    <View style={styles.iconContainer}>
                                        <MaterialCommunityIcons name="pencil-outline" size={24} color={Colors.dark.primary} />
                                    </View>
                                    <Text style={styles.optionText}>Edit Task</Text>
                                </TouchableOpacity>
                            )}

                            {/* Delete Option */}
                            <TouchableOpacity style={[styles.optionButton, { marginBottom: 16 }]} onPress={onDelete}>
                                <View style={[styles.iconContainer, { backgroundColor: 'rgba(239, 68, 68, 0.1)' }]}>
                                    <MaterialCommunityIcons name="trash-can-outline" size={24} color={Colors.dark.danger} />
                                </View>
                                <Text style={[styles.optionText, { color: Colors.dark.danger }]}>Delete Task</Text>
                            </TouchableOpacity>

                            {/* Cancel Button */}
                            <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
                                <Text style={styles.cancelText}>Cancel</Text>
                            </TouchableOpacity>
                        </View>
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
        backgroundColor: 'rgba(15, 23, 42, 0.95)',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 24,
        paddingBottom: Platform.OS === 'ios' ? 40 : 24,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        borderBottomWidth: 0,
    },
    topBorder: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 2,
        backgroundColor: Colors.dark.primary,
        shadowColor: Colors.dark.primary,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 1,
        shadowRadius: 10,
        elevation: 5,
    },
    title: {
        color: Colors.dark.textSecondary,
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
        backgroundColor: 'rgba(99, 102, 241, 0.1)',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
    },
    optionText: {
        fontSize: 16,
        fontWeight: '600',
        color: Colors.dark.white,
    },
    cancelButton: {
        marginTop: 8,
        paddingVertical: 16,
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 16,
    },
    cancelText: {
        color: Colors.dark.white,
        fontSize: 16,
        fontWeight: '700',
    }
});
