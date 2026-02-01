import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Alert,
    Image,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { Button, Input } from '../../components';
import { colors, spacing, fontSizes, borderRadius, shadows } from '../../styles/theme';

const LoginScreen: React.FC = () => {
    const { login, isLoading } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

    const validate = () => {
        const newErrors: { email?: string; password?: string } = {};

        if (!email.trim()) {
            newErrors.email = 'Email is required';
        } else if (!/\S+@\S+\.\S+/.test(email)) {
            newErrors.email = 'Please enter a valid email';
        }

        if (!password) {
            newErrors.password = 'Password is required';
        } else if (password.length < 6) {
            newErrors.password = 'Password must be at least 6 characters';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleLogin = async () => {
        if (!validate()) return;

        try {
            await login(email.trim().toLowerCase(), password);
        } catch (error: any) {
            const message = error.response?.data?.message || 'Login failed. Please try again.';
            Alert.alert('Login Error', message);
        }
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                keyboardShouldPersistTaps="handled"
            >
                <View style={styles.logoContainer}>
                    <View style={styles.logoPlaceholder}>
                        <Text style={styles.logoText}>MC</Text>
                    </View>
                    <Text style={styles.appName}>MyClinic Admin</Text>
                    <Text style={styles.tagline}>Dispensary Management Made Easy</Text>
                </View>

                <View style={styles.formCard}>
                    <Text style={styles.welcomeText}>Welcome Back</Text>
                    <Text style={styles.subText}>Sign in to continue</Text>

                    <Input
                        label="Email"
                        value={email}
                        onChangeText={setEmail}
                        error={errors.email}
                        placeholder="Enter your email"
                        keyboardType="email-address"
                        autoCapitalize="none"
                        autoCorrect={false}
                    />

                    <Input
                        label="Password"
                        value={password}
                        onChangeText={setPassword}
                        error={errors.password}
                        placeholder="Enter your password"
                        secureTextEntry
                    />

                    <Button
                        title="Sign In"
                        onPress={handleLogin}
                        loading={isLoading}
                        style={styles.loginButton}
                    />
                </View>

                <Text style={styles.footerText}>
                    Contact your administrator if you need access
                </Text>
            </ScrollView>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.primary,
    },
    scrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
        padding: spacing.lg,
    },
    logoContainer: {
        alignItems: 'center',
        marginBottom: spacing.xl,
    },
    logoPlaceholder: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: colors.textWhite,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: spacing.md,
    },
    logoText: {
        fontSize: fontSizes.xxxl,
        fontWeight: 'bold',
        color: colors.primary,
    },
    appName: {
        fontSize: fontSizes.xxl,
        fontWeight: 'bold',
        color: colors.textWhite,
        marginBottom: spacing.xs,
    },
    tagline: {
        fontSize: fontSizes.md,
        color: 'rgba(255, 255, 255, 0.8)',
    },
    formCard: {
        backgroundColor: colors.surface,
        borderRadius: borderRadius.xl,
        padding: spacing.lg,
        ...shadows.lg,
    },
    welcomeText: {
        fontSize: fontSizes.xxl,
        fontWeight: 'bold',
        color: colors.text,
        marginBottom: spacing.xs,
    },
    subText: {
        fontSize: fontSizes.md,
        color: colors.textSecondary,
        marginBottom: spacing.lg,
    },
    loginButton: {
        marginTop: spacing.md,
    },
    footerText: {
        textAlign: 'center',
        color: 'rgba(255, 255, 255, 0.7)',
        fontSize: fontSizes.sm,
        marginTop: spacing.xl,
    },
});

export default LoginScreen;
