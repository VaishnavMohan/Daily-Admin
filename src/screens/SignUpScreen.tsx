
import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Colors from '../constants/Colors';
import { supabase } from '../services/SupabaseClient';
import Animated, { FadeInDown } from 'react-native-reanimated';

export const SignUpScreen = ({ navigation }: any) => {
    const insets = useSafeAreaInsets();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const isValidEmail = (email: string) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    };

    const handleSignUp = async () => {
        if (!email || !password) {
            Alert.alert("Error", "Please fill in all fields");
            return;
        }

        if (!isValidEmail(email)) {
            Alert.alert("Error", "Please enter a valid email address");
            return;
        }

        if (password.length < 6) {
            Alert.alert("Error", "Password must be at least 6 characters long");
            return;
        }

        setLoading(true);
        const { error } = await supabase.auth.signUp({
            email,
            password,
        });

        if (error) {
            Alert.alert("Sign Up Failed", error.message);
        } else {
            Alert.alert("Success", "Check your email for the confirmation link!");
            navigation.navigate('Login');
        }
        setLoading(false);
    };

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={Colors.dark.gradients.AppBackground as any}
                style={StyleSheet.absoluteFill}
            />

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <ScrollView contentContainerStyle={[styles.content, { paddingTop: insets.top + 40 }]}>

                    <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                        <MaterialCommunityIcons name="arrow-left" size={24} color={Colors.dark.text} />
                    </TouchableOpacity>

                    <Animated.View entering={FadeInDown.delay(100).springify()} style={styles.header}>
                        <Text style={styles.title}>Create Account</Text>
                        <Text style={styles.subtitle}>Join Daily Admin to sync your life.</Text>
                    </Animated.View>

                    <Animated.View entering={FadeInDown.delay(200).springify()} style={styles.form}>
                        <View style={styles.inputWrap}>
                            <MaterialCommunityIcons name="email-outline" size={20} color={Colors.dark.textSecondary} style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                placeholder="Email"
                                placeholderTextColor={Colors.dark.textTertiary}
                                value={email}
                                onChangeText={setEmail}
                                autoCapitalize="none"
                                keyboardType="email-address"
                            />
                        </View>

                        <View style={styles.inputWrap}>
                            <MaterialCommunityIcons name="lock-outline" size={20} color={Colors.dark.textSecondary} style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                placeholder="Password"
                                placeholderTextColor={Colors.dark.textTertiary}
                                value={password}
                                onChangeText={setPassword}
                                secureTextEntry
                            />
                        </View>

                        <TouchableOpacity
                            style={styles.signupBtn}
                            onPress={handleSignUp}
                            disabled={loading}
                        >
                            <LinearGradient
                                colors={['#38BDF8', '#0EA5E9']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                style={styles.signupBtnGradient}
                            >
                                {loading ? (
                                    <ActivityIndicator color="#fff" />
                                ) : (
                                    <Text style={styles.signupBtnText}>Sign Up</Text>
                                )}
                            </LinearGradient>
                        </TouchableOpacity>

                        <View style={styles.footer}>
                            <Text style={styles.footerText}>Already have an account?</Text>
                            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                                <Text style={styles.linkText}>Sign In</Text>
                            </TouchableOpacity>
                        </View>

                    </Animated.View>

                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.dark.background,
    },
    content: {
        flexGrow: 1,
        paddingHorizontal: 24,
    },
    backBtn: {
        marginBottom: 24,
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.05)',
    },
    header: {
        marginBottom: 32,
    },
    title: {
        fontSize: 32,
        fontWeight: '800',
        color: '#fff',
        letterSpacing: 0.5,
    },
    subtitle: {
        fontSize: 16,
        color: Colors.dark.textSecondary,
        marginTop: 8,
    },
    form: {
        width: '100%',
    },
    inputWrap: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        height: 56,
    },
    inputIcon: {
        marginLeft: 16,
        marginRight: 12,
    },
    input: {
        flex: 1,
        color: '#fff',
        fontSize: 16,
        height: '100%',
    },
    signupBtn: {
        marginTop: 16,
        borderRadius: 16,
        overflow: 'hidden',
        height: 56,
        shadowColor: '#38BDF8',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    signupBtnGradient: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    signupBtnText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '700',
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 24,
        gap: 6,
    },
    footerText: {
        color: Colors.dark.textSecondary,
        fontSize: 14,
    },
    linkText: {
        color: Colors.dark.primary,
        fontSize: 14,
        fontWeight: '700',
    }
});
