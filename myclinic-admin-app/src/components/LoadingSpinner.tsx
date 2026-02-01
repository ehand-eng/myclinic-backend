import React from 'react';
import { View, ActivityIndicator, StyleSheet, Text } from 'react-native';
import { colors, fontSizes, spacing, commonStyles } from '../styles/theme';

interface LoadingSpinnerProps {
    message?: string;
    size?: 'small' | 'large';
    fullScreen?: boolean;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
    message,
    size = 'large',
    fullScreen = true,
}) => {
    const content = (
        <>
            <ActivityIndicator size={size} color={colors.primary} />
            {message && <Text style={styles.message}>{message}</Text>}
        </>
    );

    if (fullScreen) {
        return <View style={commonStyles.loader}>{content}</View>;
    }

    return <View style={styles.inline}>{content}</View>;
};

const styles = StyleSheet.create({
    inline: {
        padding: spacing.lg,
        alignItems: 'center',
        justifyContent: 'center',
    },
    message: {
        marginTop: spacing.md,
        fontSize: fontSizes.md,
        color: colors.textSecondary,
        textAlign: 'center',
    },
});

export default LoadingSpinner;
