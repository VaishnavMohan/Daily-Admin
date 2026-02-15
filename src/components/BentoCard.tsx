import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TouchableOpacity } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Colors from '../constants/Colors';


interface BentoCardProps {
    title?: string;
    subtitle?: string;
    icon?: keyof typeof MaterialCommunityIcons.glyphMap;
    value?: string | number;
    children?: React.ReactNode;
    style?: ViewStyle;
    variant?: 'hero' | 'standard' | 'glass' | 'highlight';
    padding?: number;
    onPress?: () => void;
    colSpan?: 1 | 2; // 1 = Half Width, 2 = Full Width
}

export const BentoCard = ({
    title,
    subtitle,
    icon,
    value,
    children,
    style,
    variant = 'standard',
    padding = 20,
    onPress,
    colSpan = 2
}: BentoCardProps) => {

    const cardWidth = '100%';

    const isPressed = useSharedValue(false);

    const getIntensity = () => {
        if (variant === 'hero') return 60;
        if (variant === 'glass') return 40;
        return 0; // Standard uses solid/gradient
    };

    const getBackgroundColors = () => {
        // Use the new Midnight Theme gradients
        if (variant === 'hero') return Colors.dark.gradients.BentoHighlight as unknown as readonly [string, string, ...string[]];
        if (variant === 'highlight') return Colors.dark.gradients.BentoHighlight as unknown as readonly [string, string, ...string[]];
        return Colors.dark.gradients.Bento1 as unknown as readonly [string, string, ...string[]];
    };

    const Content = (
        <View style={{ flex: 1 }}>
            {/* Header Section */}
            {(title || icon) && (
                <View style={styles.headerRow}>
                    <View>
                        {title && <Text style={styles.title}>{title}</Text>}
                        {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
                    </View>
                    {icon && (
                        <View style={[styles.iconContainer, variant === 'highlight' && styles.iconHighlight]}>
                            <MaterialCommunityIcons name={icon} size={20} color={variant === 'highlight' ? Colors.dark.gold : Colors.dark.textSecondary} />
                        </View>
                    )}
                </View>
            )}

            {/* Main Value - e.g. "5 Tasks" */}
            {value && (
                <Text style={styles.valueText}>{value}</Text>
            )}

            {children}
        </View>
    );

    const animatedStyle = useAnimatedStyle(() => {
        return {
            transform: [{ scale: withSpring(isPressed.value ? 0.96 : 1) }],
        };
    });

    const handlePressIn = () => { isPressed.value = true; };
    const handlePressOut = () => { isPressed.value = false; };

    const Container = onPress ? Animated.createAnimatedComponent(TouchableOpacity) : View;

    return (
        <Container
            style={[
                styles.container,
                { width: cardWidth },
                style,
                onPress ? animatedStyle : {}
            ]}
            onPress={onPress}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            activeOpacity={1}
        >
            <LinearGradient
                colors={getBackgroundColors()}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.gradientBorder]}
            >
                <BlurView
                    intensity={getIntensity()}
                    tint="dark"
                    style={[styles.innerContent, { padding }]}
                >
                    {Content}
                </BlurView>
            </LinearGradient>
        </Container>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: 12,
        borderRadius: 24,
        overflow: 'hidden',
        // Slight shadow
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    gradientBorder: {
        flex: 1,
        borderRadius: 24,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
    },
    innerContent: {
        flex: 1,
        backgroundColor: 'rgba(20, 20, 20, 0.6)', // Base transparency
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    title: {
        fontSize: 12,
        color: Colors.dark.textSecondary,
        textTransform: 'uppercase',
        letterSpacing: 1,
        fontWeight: '700',
    },
    subtitle: {
        fontSize: 12,
        color: Colors.dark.textTertiary,
        marginTop: 2,
        fontWeight: '500',
    },
    valueText: {
        fontSize: 28,
        fontWeight: '600',
        color: Colors.dark.text,
        marginBottom: 8,
        letterSpacing: -0.5,
    },
    iconContainer: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: 'rgba(255,255,255,0.05)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    iconHighlight: {
        backgroundColor: 'rgba(201, 162, 39, 0.1)',
        borderWidth: 1,
        borderColor: 'rgba(201, 162, 39, 0.2)',
    }
});
