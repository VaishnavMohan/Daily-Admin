
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Linking, ScrollView } from 'react-native';
import { BlurView } from 'expo-blur';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Colors from '../constants/Colors';
import { Button } from '../components/Button';

const Avatar = ({ name, status }: { name: string, status: 'paid' | 'pending' }) => (
    <View style={styles.avatarContainer}>
        <View style={[styles.avatarCircle, status === 'pending' ? styles.avatarPending : styles.avatarPaid]}>
            <Text style={styles.avatarText}>{name.charAt(0)}</Text>
        </View>
        <Text style={styles.avatarName}>{name}</Text>
        <Text style={[styles.avatarStatus, { color: status === 'paid' ? Colors.dark.success : Colors.dark.error }]}>
            {status === 'paid' ? 'Paid' : 'Pending'}
        </Text>
    </View>
);

export const SplitBillScreen = () => {
    const RENT_TOTAL = 20000;
    const MY_SHARE = 10000;
    const OTHERS_SHARE = 10000;

    const handleRemind = () => {
        const message = `Hey Rahul, just a reminder that house rent of ₹${OTHERS_SHARE} is due. Please pay soon!`;
        const url = `whatsapp://send?text=${encodeURIComponent(message)}`;

        Linking.canOpenURL(url).then(supported => {
            if (supported) {
                return Linking.openURL(url);
            } else {
                console.log("WhatsApp not installed");
                // Fallback or alert
            }
        });
    };

    return (
        <View style={styles.container}>
            <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill} />

            <ScrollView contentContainerStyle={styles.content}>
                <Text style={styles.headerTitle}>Split Expenses</Text>

                <View style={styles.card}>
                    <MaterialCommunityIcons name="home-city-outline" size={40} color={Colors.dark.primary} style={{ marginBottom: 10 }} />
                    <Text style={styles.cardTitle}>House Rent (Feb)</Text>
                    <Text style={styles.cardAmount}>₹{RENT_TOTAL.toLocaleString()}</Text>

                    <View style={styles.divider} />

                    <View style={styles.participants}>
                        <Avatar name="Me" status="paid" />
                        <Avatar name="Rahul" status="pending" />
                    </View>

                    <View style={styles.statusRow}>
                        <Text style={styles.statusLabel}>Total Pending:</Text>
                        <Text style={styles.statusValue}>₹{OTHERS_SHARE.toLocaleString()}</Text>
                    </View>
                </View>

                <View style={{ marginTop: 40 }}>
                    <Button label="Remind Rahul on WhatsApp" onPress={handleRemind} />
                </View>

                <TouchableOpacity style={styles.historyButton}>
                    <Text style={styles.historyText}>View Past Splits</Text>
                </TouchableOpacity>

            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.dark.background,
    },
    content: {
        padding: 24,
        paddingTop: 60,
    },
    headerTitle: {
        fontSize: 28,
        color: Colors.dark.white,
        fontWeight: 'bold',
        marginBottom: 30,
    },
    card: {
        backgroundColor: 'rgba(30,30,30,0.6)',
        borderRadius: 24,
        padding: 24,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    cardTitle: {
        color: Colors.dark.gray,
        fontSize: 14,
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 8,
    },
    cardAmount: {
        color: Colors.dark.white,
        fontSize: 36,
        fontWeight: 'bold',
        marginBottom: 20,
    },
    divider: {
        height: 1,
        backgroundColor: 'rgba(255,255,255,0.1)',
        width: '100%',
        marginBottom: 20,
    },
    participants: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        width: '100%',
        marginBottom: 20,
    },
    avatarContainer: {
        alignItems: 'center',
    },
    avatarCircle: {
        width: 60,
        height: 60,
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
        borderWidth: 2,
    },
    avatarPaid: {
        borderColor: Colors.dark.success,
        backgroundColor: 'rgba(52, 199, 89, 0.1)',
    },
    avatarPending: {
        borderColor: Colors.dark.error,
        backgroundColor: 'rgba(255, 59, 48, 0.1)',
    },
    avatarText: {
        color: Colors.dark.white,
        fontSize: 24,
        fontWeight: 'bold',
    },
    avatarName: {
        color: Colors.dark.white,
        fontSize: 14,
        marginBottom: 4,
    },
    avatarStatus: {
        fontSize: 12,
        fontWeight: '600',
    },
    statusRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
        backgroundColor: 'rgba(0,0,0,0.3)',
        borderRadius: 12,
        padding: 16,
    },
    statusLabel: {
        color: Colors.dark.gray,
        fontSize: 14,
    },
    statusValue: {
        color: Colors.dark.error,
        fontSize: 16,
        fontWeight: 'bold',
    },
    historyButton: {
        marginTop: 20,
        alignSelf: 'center',
    },
    historyText: {
        color: Colors.dark.gray,
        fontSize: 14,
        textAlign: 'center',
    },
});
