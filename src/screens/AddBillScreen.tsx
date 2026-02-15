import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Colors from '../constants/Colors';
import { NeonTextInput } from '../components/NeonTextInput';
import { Button } from '../components/Button';
import { StorageService } from '../services/StorageService';

export const AddBillScreen = ({ navigation }: any) => {
    const insets = useSafeAreaInsets();
    const [name, setName] = useState('');
    const [amount, setAmount] = useState('');
    const [date, setDate] = useState('');
    const [category, setCategory] = useState('Subscription');

    const categories = ['Subscription', 'Credit Card', 'Rent', 'Utility', 'Insurance'];

    const handleSave = async () => {
        if (!name || !amount || !date) {
            Alert.alert('Missing Fields', 'Please fill all details.');
            return;
        }

        const newBill = {
            id: Date.now().toString(),
            title: name,
            amount: parseFloat(amount),
            dueDate: date,
            category: category,
            status: 'pending',
            icon: 'file-document-outline',
            payUrl: ''
        };

        await StorageService.addBill(newBill as any);

        Alert.alert('Success', 'Reminder Added!', [
            { text: 'OK', onPress: () => navigation.goBack() }
        ]);
    };

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={Colors.dark.gradients.AppBackground as any}
                style={StyleSheet.absoluteFill}
            />

            <View style={{ flex: 1, paddingTop: insets.top }}>
                <View style={styles.headerBar}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton} activeOpacity={0.7}>
                        <MaterialCommunityIcons name="arrow-left" size={22} color={Colors.dark.white} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Add New Reminder</Text>
                    <View style={{ width: 40 }} />
                </View>

                <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                    <NeonTextInput
                        label="What is this for?"
                        placeholder="e.g. Netflix, HDFC Card"
                        value={name}
                        onChangeText={setName}
                    />

                    <NeonTextInput
                        label="Amount (₹)"
                        placeholder="0.00"
                        keyboardType="numeric"
                        value={amount}
                        onChangeText={setAmount}
                    />

                    <NeonTextInput
                        label="Due Date"
                        placeholder="DD/MM/YYYY"
                        value={date}
                        onChangeText={setDate}
                    />

                    <Text style={styles.label}>Category</Text>
                    <View style={styles.categoryContainer}>
                        {categories.map((cat) => {
                            const isActive = category === cat;
                            return (
                                <TouchableOpacity
                                    key={cat}
                                    style={[styles.chip, isActive && styles.chipActive]}
                                    onPress={() => setCategory(cat)}
                                    activeOpacity={0.7}
                                >
                                    {isActive && (
                                        <LinearGradient
                                            colors={['rgba(56, 189, 248, 0.18)', 'rgba(56, 189, 248, 0.05)']}
                                            style={StyleSheet.absoluteFill}
                                            start={{ x: 0, y: 0 }}
                                            end={{ x: 1, y: 1 }}
                                        />
                                    )}
                                    <Text style={[
                                        styles.chipText,
                                        isActive && styles.chipTextActive
                                    ]}>{cat}</Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>

                    <View style={{ marginTop: 40 }}>
                        <Button label="Save Reminder" onPress={handleSave} />
                    </View>

                </ScrollView>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.dark.background,
    },
    headerBar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.06)',
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 14,
        backgroundColor: 'rgba(255,255,255,0.08)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    headerTitle: {
        fontSize: 20,
        color: Colors.dark.white,
        fontWeight: '700',
        letterSpacing: -0.3,
    },
    content: {
        padding: 24,
        paddingTop: 24,
        paddingBottom: 100,
    },
    label: {
        color: Colors.dark.textTertiary,
        fontSize: 12,
        marginBottom: 12,
        textTransform: 'uppercase',
        letterSpacing: 1,
        fontWeight: '700',
    },
    categoryContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
    },
    chip: {
        paddingVertical: 10,
        paddingHorizontal: 18,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        marginBottom: 10,
        overflow: 'hidden',
        position: 'relative',
        backgroundColor: 'rgba(255,255,255,0.03)',
    },
    chipActive: {
        borderColor: `${Colors.dark.primary}60`,
    },
    chipText: {
        color: Colors.dark.textSecondary,
        fontSize: 14,
        fontWeight: '500',
    },
    chipTextActive: {
        color: Colors.dark.primary,
        fontWeight: '700',
    },
});
