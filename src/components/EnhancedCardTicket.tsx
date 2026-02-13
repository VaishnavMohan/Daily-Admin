import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Colors from '../constants/Colors';

interface EnhancedCardTicketProps {
    bank: string;
    cardName: string;
    dueDate: string;
    daysLeft: number;
    isPaid: boolean;
    onPress: () => void;
    onMarkPaid: () => void;
    onDelete: () => void;
}

export const EnhancedCardTicket: React.FC<EnhancedCardTicketProps> = ({
    bank,
    cardName,
    dueDate,
    daysLeft,
    isPaid,
    onPress,
    onMarkPaid,
    onDelete
}) => {
    // Determine urgency level and colors
    const getUrgencyData = () => {
        if (isPaid) {
            return {
                gradient: Colors.dark.gradientSuccess,
                accentColor: Colors.dark.success,
                badgeText: 'PAID ✓',
                badgeColor: Colors.dark.success,
                statusText: 'Completed',
                icon: 'check-circle' as const,
            };
        }
        if (daysLeft < 0) {
            return {
                gradient: Colors.dark.gradientOverdue,
                accentColor: Colors.dark.danger,
                badgeText: 'OVERDUE',
                badgeColor: Colors.dark.danger,
                statusText: `${Math.abs(daysLeft)} days overdue`,
                icon: 'alert-circle' as const,
            };
        }
        if (daysLeft === 0) {
            return {
                gradient: Colors.dark.gradientDanger,
                accentColor: Colors.dark.danger,
                badgeText: 'DUE TODAY',
                badgeColor: Colors.dark.danger,
                statusText: 'Pay now!',
                icon: 'alert' as const,
            };
        }
        if (daysLeft <= 3) {
            return {
                gradient: Colors.dark.gradientUrgent,
                accentColor: Colors.dark.warning,
                badgeText: 'URGENT',
                badgeColor: Colors.dark.warning,
                statusText: `Due in ${days Left
            } ${ daysLeft === 1 ? 'day' : 'days' } `,
                icon: 'clock-alert' as const,
            };
        }
        return {
            gradient: Colors.dark.gradientSafe,
            accentColor: Colors.dark.success,
            badgeText: 'ON TRACK',
            badgeColor: Colors.dark.success,
            statusText: `Due in ${ daysLeft } days`,
            icon: 'calendar-check' as const,
        };
    };

    const urgency = getUrgencyData();

    return (
        <TouchableOpacity onPress={onPress} activeOpacity={0.9} style={styles.container}>
            {/* Background Gradient Glow */}
            <LinearGradient
                colors={[...urgency.gradient, 'transparent']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.glowBackground}
            />
            
            {/* Main Card Content */}
            <View style={styles.cardContent}>
                {/* Accent Border */}
                <LinearGradient
                    colors={urgency.gradient}
                    style={styles.accentBorder}
                />
                
                {/* Content Container */}
                <View style={styles.mainContent}>
                    {/* Header Row */}
                    <View style={styles.headerRow}>
                        <View style={styles.titleSection}>
                            <View style={styles.iconContainer}>
                                <MaterialCommunityIcons 
                                    name="credit-card-outline" 
                                    size={24} 
                                    color={Colors.dark.primary} 
                                />
                            </View>
                            <View>
                                <Text style={styles.bankName}>{bank}</Text>
                                <Text style={styles.cardType}>{cardName}</Text>
                            </View>
                        </View>
                        
                        {/* Status Badge */}
                        <View style={[styles.badge, { backgroundColor: `${ urgency.badgeColor } 15` }]}>
                            <Text style={[styles.badgeText, { color: urgency.badgeColor }]}>
                                {urgency.badgeText}
                            </Text>
                        </View>
                    </View>

                    {/* Divider */}
                    <View style={styles.divider} />

                    {/* Info Row */}
                    <View style={styles.infoRow}>
                        <View style={styles.infoItem}>
                            <MaterialCommunityIcons 
                                name={urgency.icon} 
                                size={20} 
                                color={urgency.accentColor} 
                            />
                            <Text style={[styles.infoText, { color: urgency.accentColor }]}>
                                {urgency.statusText}
                            </Text>
                        </View>
                        <Text style={styles.dateText}>{dueDate}</Text>
                    </View>

                    {/* Action Buttons Row */}
                    <View style={styles.actionRow}>
                        {!isPaid && (
                            <TouchableOpacity 
                                style={[styles.actionButton, styles.markPaidButton]} 
                                onPress={onMarkPaid}
                            >
                                <LinearGradient
                                    colors={Colors.dark.gradientSuccess}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                    style={styles.buttonGradient}
                                >
                                    <MaterialCommunityIcons name="check-bold" size={16} color="#fff" />
                                    <Text style={styles.actionButtonText}>Mark Paid</Text>
                                </LinearGradient>
                            </TouchableOpacity>
                        )}
                        
                        <TouchableOpacity 
                            style={styles.deleteButton} 
                            onPress={onDelete}
                        >
                            <MaterialCommunityIcons name="delete-outline" size={20} color={Colors.dark.danger} />
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        marginHorizontal: 20,
        marginVertical: 8,
        borderRadius: 20,
        overflow: 'visible',
    },
    glowBackground: {
        ...StyleSheet.absoluteFillObject,
        borderRadius: 20,
        opacity: 0.1,
    },
    cardContent: {
        flexDirection: 'row',
        borderRadius: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
        overflow: 'hidden',
       shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
        elevation: 8,
    },
    accentBorder: {
        width: 6,
    },
    mainContent: {
        flex: 1,
        padding: 16,
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    titleSection: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        flex: 1,
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 12,
        backgroundColor: 'rgba(255, 215, 0, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    bankName: {
        fontSize: 18,
        fontWeight: '700',
        color: Colors.dark.text,
        letterSpacing: 0.3,
    },
    cardType: {
        fontSize: 13,
        color: Colors.dark.textSecondary,
        marginTop: 2,
    },
    badge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
    },
    badgeText: {
        fontSize: 11,
        fontWeight: '800',
        letterSpacing: 0.5,
    },
    divider: {
        height: 1,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        marginVertical: 12,
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    infoItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    infoText: {
        fontSize: 15,
        fontWeight: '600',
    },
    dateText: {
        fontSize: 14,
        color: Colors.dark.textSecondary,
        fontWeight: '500',
    },
    actionRow: {
        flexDirection: 'row',
        gap: 12,
        alignItems: 'center',
    },
    actionButton: {
        flex: 1,
        borderRadius: 12,
        overflow: 'hidden',
    },
    markPaidButton: {
        height: 44,
    },
    buttonGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 12,
        paddingHorizontal: 16,
    },
    actionButtonText: {
        color: '#fff',
        fontSize: 15,
        fontWeight: '700',
    },
    deleteButton: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
    },
});
