import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fontSizes, spacing, commonStyles } from '../styles/theme';

interface EmptyStateProps {
    icon?: keyof typeof Ionicons.glyphMap;
    title: string;
    message?: string;
    action?: React.ReactNode;
}

const EmptyState: React.FC<EmptyStateProps> = ({ icon = 'folder-open-outline', title, message, action }) => {
    return (
        <View style={commonStyles.emptyState}>
            <Ionicons name={icon} size={64} color={colors.textLight} />
            <Text style={styles.title}>{title}</Text>
            {message && <Text style={styles.message}>{message}</Text>}
            {action && <View style={styles.action}>{action}</View>}
        </View>
    );
};

const styles = StyleSheet.create({
    title: {
        fontSize: fontSizes.xl,
        fontWeight: '600',
        color: colors.textSecondary,
        marginTop: spacing.md,
        textAlign: 'center',
    },
    message: {
        fontSize: fontSizes.md,
        color: colors.textLight,
        marginTop: spacing.sm,
        textAlign: 'center',
        paddingHorizontal: spacing.lg,
    },
    action: {
        marginTop: spacing.lg,
    },
});

export default EmptyState;
