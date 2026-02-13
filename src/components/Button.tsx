import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Colors from '../constants/Colors';

interface ButtonProps {
    label: string;
    onPress: () => void;
    isLoading?: boolean;
    variant?: 'primary' | 'secondary';
    style?: ViewStyle;
}

export const Button = ({ label, onPress, isLoading, variant = 'primary', style }: ButtonProps) => {
    if (variant === 'secondary') {
        return (
            <TouchableOpacity
                onPress={onPress}
                activeOpacity={0.8}
                disabled={isLoading}
                style={[styles.secondaryButton, style]}
            >
                {isLoading ? (
                    <ActivityIndicator color={Colors.dark.white} />
                ) : (
                    <Text style={styles.secondaryLabel}>{label}</Text>
                )}
            </TouchableOpacity>
        );
    }

    return (
        <TouchableOpacity
            onPress={onPress}
            activeOpacity={0.8}
            disabled={isLoading}
            style={style}
        >
            <LinearGradient
                colors={[Colors.dark.gold, '#AA8811']} // Gold -> Darker Gold
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.gradient}
            >
                {isLoading ? (
                    <ActivityIndicator color={Colors.dark.white} />
                ) : (
                    <Text style={styles.label}>{label}</Text>
                )}
            </LinearGradient>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    gradient: {
        borderRadius: 12,
        paddingVertical: 14,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: Colors.dark.primary, // Gold Shadow
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 8,
    },
    label: {
        color: '#000', // Black text on Gold
        fontSize: 16,
        fontWeight: 'bold',
        letterSpacing: 0.5,
        textTransform: 'uppercase',
    },
    secondaryButton: {
        borderRadius: 12,
        paddingVertical: 14,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.05)', // Glassy
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    secondaryLabel: {
        color: Colors.dark.white,
        fontSize: 16,
        fontWeight: '600',
        letterSpacing: 0.5,
    }
});
