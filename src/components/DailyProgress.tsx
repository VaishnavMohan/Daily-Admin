import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle, Defs, LinearGradient as SvgGradient, Stop } from 'react-native-svg';
import Animated, { useSharedValue, useAnimatedProps, withTiming, Easing } from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import Colors from '../constants/Colors';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface DailyProgressProps {
    total: number;
    completed: number;
    size?: number;
    strokeWidth?: number;
}

export const DailyProgress: React.FC<DailyProgressProps> = ({
    total = 0,
    completed = 0,
    size = 120,
    strokeWidth = 10
}) => {
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const progress = total === 0 ? 0 : completed / total;

    const animatedProgress = useSharedValue(0);

    useEffect(() => {
        animatedProgress.value = withTiming(progress, {
            duration: 1500,
            easing: Easing.out(Easing.exp),
        });
    }, [progress]);

    const animatedProps = useAnimatedProps(() => {
        return {
            strokeDashoffset: circumference * (1 - animatedProgress.value),
        };
    });

    return (
        <View style={[styles.container, { width: size * 1.5 }]}>
            {/* Text Info */}
            <View style={styles.textContainer}>
                <Text style={styles.label}>Today's Pulse</Text>
                <View style={styles.statsRow}>
                    <Text style={styles.bigNumber}>{completed}</Text>
                    <Text style={styles.smallNumber}>/ {total}</Text>
                </View>
                <Text style={styles.subLabel}>Tasks Completed</Text>
            </View>

            {/* Ring Chart */}
            <View style={{ width: size, height: size }}>
                <Svg width={size} height={size}>
                    <Defs>
                        <SvgGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                            <Stop offset="0" stopColor="#D4AF37" />
                            <Stop offset="0.5" stopColor="#F8E9A1" />
                            <Stop offset="1" stopColor="#B69121" />
                        </SvgGradient>
                    </Defs>

                    {/* Background Track */}
                    <Circle
                        cx={size / 2}
                        cy={size / 2}
                        r={radius}
                        stroke={Colors.dark.gradients.ProgressTrack}
                        strokeWidth={strokeWidth}
                        fill="none"
                    />

                    {/* Progress Fill */}
                    <AnimatedCircle
                        cx={size / 2}
                        cy={size / 2}
                        r={radius}
                        stroke="url(#goldGradient)"
                        strokeWidth={strokeWidth}
                        fill="none"
                        strokeDasharray={`${circumference} ${circumference}`}
                        strokeLinecap="round"
                        animatedProps={animatedProps}
                        rotation="-90"
                        origin={`${size / 2}, ${size / 2}`}
                    />
                </Svg>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
    },
    textContainer: {
        justifyContent: 'center',
    },
    label: {
        color: Colors.dark.gold,
        fontSize: 12,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 4,
    },
    statsRow: {
        flexDirection: 'row',
        alignItems: 'baseline',
    },
    bigNumber: {
        fontSize: 36,
        fontWeight: '300', // Light font for elegance
        color: Colors.dark.text,
        letterSpacing: -1,
    },
    smallNumber: {
        fontSize: 18,
        color: Colors.dark.textSecondary,
        marginLeft: 4,
        fontWeight: '400',
    },
    subLabel: {
        color: Colors.dark.textTertiary,
        fontSize: 12,
        marginTop: 2,
    }
});
