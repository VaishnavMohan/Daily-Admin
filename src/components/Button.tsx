import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, ViewStyle, Platform } from 'react-native';
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
                colors={[Colors.dark.primary, '#0EA5E9']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[styles.gradient, Platform.select({
                    web: { boxShadow: '0 4px 20px rgba(56, 189, 248, 0.3)' } as any,
                    default: {},
                })]}
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
        borderRadius: 16,
        paddingVertical: 16,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: Colors.dark.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 8,
    },
    label: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '700',
        letterSpacing: 0.5,
        textTransform: 'uppercase',
    },
    secondaryButton: {
        borderRadius: 16,
        paddingVertical: 16,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: Colors.dark.glass.medium,
        borderWidth: 1,
        borderColor: Colors.dark.glass.border,
    },
    secondaryLabel: {
        color: Colors.dark.white,
        fontSize: 16,
        fontWeight: '600',
        letterSpacing: 0.5,
    }
});
