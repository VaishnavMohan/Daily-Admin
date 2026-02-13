import React, { useEffect } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Colors from '../constants/Colors';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withRepeat,
    withTiming,
    Easing
} from 'react-native-reanimated';

const { width, height } = Dimensions.get('window');

export const OrbitalBackground = () => {
    const orb1Y = useSharedValue(0);
    const orb2Y = useSharedValue(0);

    useEffect(() => {
        orb1Y.value = withRepeat(
            withTiming(50, { duration: 5000, easing: Easing.inOut(Easing.ease) }),
            -1,
            true
        );
        orb2Y.value = withRepeat(
            withTiming(-50, { duration: 6000, easing: Easing.inOut(Easing.ease) }),
            -1,
            true
        );
    }, []);

    const style1 = useAnimatedStyle(() => ({
        transform: [{ translateY: orb1Y.value }],
    }));

    const style2 = useAnimatedStyle(() => ({
        transform: [{ translateY: orb2Y.value }],
    }));

    return (
        <View style={StyleSheet.absoluteFill}>
            {/* Deep Base */}
            <View style={[StyleSheet.absoluteFill, { backgroundColor: Colors.dark.background }]} />

            {/* Orb 1: Top Right (Indigo/Magenta) */}
            <Animated.View style={[styles.orb, styles.orb1, style1]}>
                <LinearGradient
                    colors={[Colors.dark.primary, Colors.dark.secondary]}
                    style={StyleSheet.absoluteFill}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                />
            </Animated.View>

            {/* Orb 2: Bottom Left (Cyan/Violet) */}
            <Animated.View style={[styles.orb, styles.orb2, style2]}>
                <LinearGradient
                    colors={[Colors.dark.accent, Colors.dark.primaryDark]}
                    style={StyleSheet.absoluteFill}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                />
            </Animated.View>

            {/* Glass Overlay/Noise Texture Simulation */}
            <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(15, 5, 24, 0.6)' }]} />
        </View>
    );
};

const styles = StyleSheet.create({
    orb: {
        position: 'absolute',
        width: width * 1.2,
        height: width * 1.2,
        borderRadius: width * 0.6,
        opacity: 0.25,
    },
    orb1: {
        top: -width * 0.4,
        right: -width * 0.4,
    },
    orb2: {
        bottom: -width * 0.2,
        left: -width * 0.4,
    },
});
