import React, { useState } from 'react';
import { View, TextInput, Text, StyleSheet, TextInputProps, Animated } from 'react-native';
import Colors from '../constants/Colors';

interface NeonTextInputProps extends TextInputProps {
    label: string;
    error?: string;
}

export const NeonTextInput = ({ label, style, error, ...props }: NeonTextInputProps) => {
    const [isFocused, setIsFocused] = useState(false);

    // Professional clean input style
    return (
        <View style={styles.container}>
            <Text style={styles.label}>{label}</Text>
            <TextInput
                style={[
                    styles.input,
                    isFocused && styles.inputFocused,
                    error && styles.inputError,
                    style,
                ]}
                placeholderTextColor="#9CA3AF" // Gray 400
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                cursorColor={Colors.dark.primary}
                selectionColor={`${Colors.dark.primary}40`}
                {...props}
            />
            {error && <Text style={styles.errorText}>{error}</Text>}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        width: '100%',
    },
    label: {
        color: Colors.dark.textSecondary,
        fontSize: 13,
        fontWeight: '500',
        marginBottom: 8,
    },
    input: {
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        paddingHorizontal: 16,
        paddingVertical: 14,
        fontSize: 16,
        color: '#fff',
    },
    inputFocused: {
        borderColor: Colors.dark.primary,
        borderWidth: 1.5,
        backgroundColor: 'rgba(56, 189, 248, 0.05)',
    },
    inputError: {
        borderColor: Colors.dark.danger,
    },
    errorText: {
        color: Colors.dark.danger,
        fontSize: 12,
        marginTop: 4,
    }
});
