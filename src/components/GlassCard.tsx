import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Colors from '../constants/Colors';

interface GlassCardProps {
    children: React.ReactNode;
    style?: ViewStyle;
    variant?: 'light' | 'medium' | 'heavy';
}

export const GlassCard = ({ children, style, variant = 'medium' }: GlassCardProps) => {
    let backgroundColor = Colors.dark.glass.medium;
    if (variant === 'light') backgroundColor = Colors.dark.glass.light;
    if (variant === 'heavy') backgroundColor = Colors.dark.glass.heavy;

    return (
        <View style={[styles.container, { backgroundColor, borderColor: Colors.dark.glass.border }, style]}>
            <LinearGradient
                colors={['rgba(255,255,255,0.03)', 'transparent']}
                style={StyleSheet.absoluteFill}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
            />
            {children}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        borderRadius: 24,
        overflow: 'hidden',
        borderWidth: 1,
    }
});
