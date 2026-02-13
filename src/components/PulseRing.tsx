import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';
import Animated, {
    useSharedValue,
    useAnimatedProps,
    withTiming,
    withRepeat,
    withSequence,
    Easing
} from 'react-native-reanimated';
import Colors from '../constants/Colors';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface PulseRingProps {
    radius?: number;
    strokeWidth?: number;
    progress: number; // 0 to 1
    color?: string;
}

export const PulseRing = ({
    radius = 60,
    strokeWidth = 8,
    progress,
    color = Colors.dark.primary
}: PulseRingProps) => {
    const innerRadius = radius - strokeWidth / 2;
    const circumference = 2 * Math.PI * innerRadius;

    // Animation Values
    const progressValue = useSharedValue(0);
    const pulseOpacity = useSharedValue(0.5);
    const pulseScale = useSharedValue(1);

    useEffect(() => {
        progressValue.value = withTiming(progress, { duration: 1500, easing: Easing.out(Easing.exp) });

        // Pulse Effect
        pulseOpacity.value = withRepeat(
            withSequence(withTiming(0.2, { duration: 2000 }), withTiming(0.5, { duration: 2000 })),
            -1,
            true
        );
        pulseScale.value = withRepeat(
            withSequence(withTiming(1.1, { duration: 2000 }), withTiming(1, { duration: 2000 })),
            -1,
            true
        );
    }, [progress]);

    const animatedProps = useAnimatedProps(() => {
        return {
            strokeDashoffset: circumference * (1 - progressValue.value),
        };
    });

    return (
        <View style={{ width: radius * 2, height: radius * 2, justifyContent: 'center', alignItems: 'center' }}>
            {/* Glowing Backdrop/Shadow */}
            <Animated.View style={[
                StyleSheet.absoluteFill,
                {
                    backgroundColor: color,
                    borderRadius: radius,
                    opacity: 0.1,
                    transform: [{ scale: pulseScale }]
                }
            ]} />

            <Svg width={radius * 2} height={radius * 2}>
                <G rotation="-90" origin={`${radius}, ${radius}`}>
                    {/* Background Circle */}
                    <Circle
                        cx={radius}
                        cy={radius}
                        r={innerRadius}
                        stroke="rgba(255,255,255,0.1)"
                        strokeWidth={strokeWidth}
                        fill="transparent"
                    />
                    {/* Progress Circle */}
                    <AnimatedCircle
                        cx={radius}
                        cy={radius}
                        r={innerRadius}
                        stroke={color}
                        strokeWidth={strokeWidth}
                        fill="transparent"
                        strokeDasharray={circumference}
                        strokeLinecap="round"
                        animatedProps={animatedProps}
                    />
                </G>
            </Svg>

            {/* Inner Content (Children or Percentage) */}
            <View style={StyleSheet.absoluteFillObject}>
                {/* This space is for children usually, simplified here */}
            </View>
        </View>
    );
};
