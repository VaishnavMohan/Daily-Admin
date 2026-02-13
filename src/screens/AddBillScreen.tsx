import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { BlurView } from 'expo-blur';
import Colors from '../constants/Colors';
import { NeonTextInput } from '../components/NeonTextInput';
import { Button } from '../components/Button';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StorageService } from '../services/StorageService';

export const AddBillScreen = ({ navigation }: any) => {
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
            <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill} />

            <ScrollView contentContainerStyle={styles.content}>
                <Text style={styles.headerTitle}>Add New Reminder</Text>

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
                    {categories.map((cat) => (
                        <TouchableOpacity
                            key={cat}
                            style={[
                                styles.chip,
                                category === cat && styles.chipActive
                            ]}
                            onPress={() => setCategory(cat)}
                        >
                            <Text style={[
                                styles.chipText,
                                category === cat && styles.chipTextActive
                            ]}>{cat}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                <View style={{ marginTop: 40 }}>
                    <Button label="Save Reminder" onPress={handleSave} />
                </View>

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
        paddingTop: 40,
    },
    headerTitle: {
        fontSize: 28,
        color: Colors.dark.white,
        fontWeight: 'bold',
        marginBottom: 40,
    },
    label: {
        color: Colors.dark.gray,
        fontSize: 12,
        marginBottom: 12,
        textTransform: 'uppercase',
        letterSpacing: 1,
        fontWeight: '600',
    },
    categoryContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
    },
    chip: {
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
        marginBottom: 10,
    },
    chipActive: {
        backgroundColor: 'rgba(107, 250, 225, 0.15)', // Neon Teal Tint
        borderColor: Colors.dark.primary,
    },
    chipText: {
        color: Colors.dark.gray,
        fontSize: 14,
    },
    chipTextActive: {
        color: Colors.dark.primary,
        fontWeight: 'bold',
    },
});
