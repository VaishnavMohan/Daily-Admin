import React, { useMemo, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions, ScrollView } from 'react-native';
import Svg, { Rect } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Colors from '../constants/Colors';
import { LifeTask } from '../types';

interface SpendingHeatmapProps {
    expenses: LifeTask[];
    days?: number; // Number of days to show (default: ~90 for a quarter)
}

const SQUARE_SIZE = 14; // Increased for better touch/visibility
const GAP = 4;
const DAYS_IN_WEEK = 7;

export const SpendingHeatmap = ({ expenses, days = 91 }: SpendingHeatmapProps) => {
    const scrollRef = useRef<ScrollView>(null);

    // 1. Process Data
    const calendarData = useMemo(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Normalize to midnight

        const data: { date: Date; count: number; total: number; level: number }[] = [];
        const startDate = new Date(today);
        startDate.setDate(today.getDate() - days + 1);

        // Map date strings to totals
        const expenseMap: Record<string, number> = {};
        let maxDaily = 0;

        const toLocalISO = (d: Date) => {
            const offset = d.getTimezoneOffset() * 60000;
            return new Date(d.getTime() - offset).toISOString().split('T')[0];
        };

        expenses.forEach(e => {
            // Expenses stored as YYYY-MM-DD string, so no conversion needed for key
            const dateStr = e.dueDate;
            expenseMap[dateStr] = (expenseMap[dateStr] || 0) + (e.amount || 0);
            if (expenseMap[dateStr] > maxDaily) maxDaily = expenseMap[dateStr];
        });

        // Fill array for grid
        for (let i = 0; i < days; i++) {
            const d = new Date(startDate);
            d.setDate(startDate.getDate() + i);

            const dStr = toLocalISO(d);
            const total = expenseMap[dStr] || 0;

            // Calculate Level (0-4)
            let level = 0;
            if (total > 0) {
                if (total > maxDaily * 0.75) level = 4;
                else if (total > maxDaily * 0.5) level = 3;
                else if (total > maxDaily * 0.25) level = 2;
                else level = 1;
            }

            data.push({ date: d, total, count: 0, level });
        }
        return data;
    }, [expenses, days]);

    // 2. Render Grid
    // We render weeks as columns
    const weeks = Math.ceil(days / DAYS_IN_WEEK);
    const height = (SQUARE_SIZE + GAP) * DAYS_IN_WEEK;
    const width = (SQUARE_SIZE + GAP) * weeks;

    // Auto-scroll to end on mount
    useEffect(() => {
        setTimeout(() => {
            scrollRef.current?.scrollToEnd({ animated: false });
        }, 100);
    }, [days]); // Run when days changes (or data loads)

    const getColor = (level: number) => {
        switch (level) {
            case 1: return 'rgba(56, 189, 248, 0.3)'; // Primary Blue/Cyan
            case 2: return 'rgba(56, 189, 248, 0.5)';
            case 3: return 'rgba(56, 189, 248, 0.7)';
            case 4: return 'rgba(56, 189, 248, 1.0)';
            default: return 'rgba(255,255,255,0.05)';
        }
    };

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={['rgba(255,255,255,0.05)', 'rgba(255,255,255,0.02)']}
                style={styles.card}
            >
                <View style={styles.header}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <View style={styles.iconContainer}>
                            <MaterialCommunityIcons name="fire" size={16} color={Colors.dark.primary} />
                        </View>
                        <Text style={styles.title}>Spending Heatmap</Text>
                    </View>
                    {/* Legend or Subtitle */}
                    <Text style={styles.subtitle}>Last {Math.round(days / 7)} Weeks</Text>
                </View>

                {/* Scrollable Container */}
                <ScrollView
                    ref={scrollRef}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ paddingHorizontal: 10 }}
                >
                    <Svg height={height} width={width}>
                        {calendarData.map((day, index) => {
                            const col = Math.floor(index / DAYS_IN_WEEK);
                            const row = index % DAYS_IN_WEEK;

                            return (
                                <Rect
                                    key={index}
                                    x={col * (SQUARE_SIZE + GAP)}
                                    y={row * (SQUARE_SIZE + GAP)}
                                    width={SQUARE_SIZE}
                                    height={SQUARE_SIZE}
                                    fill={getColor(day.level)}
                                    rx={4}
                                    ry={4}
                                />
                            );
                        })}
                    </Svg>
                </ScrollView>

                {/* Footer / Legend */}
                <View style={styles.footer}>
                    <Text style={styles.footerText}>Less</Text>
                    <View style={{ flexDirection: 'row', gap: 4 }}>
                        <View style={[styles.legendDot, { backgroundColor: 'rgba(255,255,255,0.1)' }]} />
                        <View style={[styles.legendDot, { backgroundColor: 'rgba(56, 189, 248, 0.4)' }]} />
                        <View style={[styles.legendDot, { backgroundColor: 'rgba(56, 189, 248, 0.7)' }]} />
                        <View style={[styles.legendDot, { backgroundColor: '#38BDF8' }]} />
                    </View>
                    <Text style={styles.footerText}>More</Text>
                </View>
            </LinearGradient>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: 20,
    },
    card: {
        borderRadius: 24,
        paddingVertical: 16,
        paddingHorizontal: 0, // Remove padding to let scroll view touch edges
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
        paddingHorizontal: 16, // Add padding back for header
    },
    title: {
        fontSize: 16,
        fontWeight: '700',
        color: '#fff',
    },
    subtitle: {
        fontSize: 12,
        color: Colors.dark.textSecondary,
        fontWeight: '500',
    },
    iconContainer: {
        width: 28,
        height: 28,
        borderRadius: 8,
        backgroundColor: 'rgba(56, 189, 248, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        alignItems: 'center',
        marginTop: 12,
        gap: 8,
        paddingHorizontal: 16, // Add padding back for footer
    },
    footerText: {
        fontSize: 10,
        color: Colors.dark.textSecondary,
    },
    legendDot: {
        width: 8,
        height: 8,
        borderRadius: 2,
    }
});
