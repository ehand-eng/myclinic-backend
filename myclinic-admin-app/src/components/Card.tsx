import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { colors, spacing, fontSizes, borderRadius, shadows } from '../styles/theme';

interface CardProps {
    children: React.ReactNode;
    title?: string;
    subtitle?: string;
    style?: ViewStyle;
    headerRight?: React.ReactNode;
}

const Card: React.FC<CardProps> = ({ children, title, subtitle, style, headerRight }) => {
    return (
        <View style={[styles.card, style]}>
            {(title || subtitle || headerRight) && (
                <View style={styles.header}>
                    <View style={styles.headerText}>
                        {title && <Text style={styles.title}>{title}</Text>}
                        {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
                    </View>
                    {headerRight && <View>{headerRight}</View>}
                </View>
            )}
            {children}
        </View>
    );
};

const styles = StyleSheet.create({
    card: {
        backgroundColor: colors.card,
        borderRadius: borderRadius.lg,
        padding: spacing.md,
        marginBottom: spacing.md,
        ...shadows.md,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: spacing.md,
    },
    headerText: {
        flex: 1,
    },
    title: {
        fontSize: fontSizes.lg,
        fontWeight: '600',
        color: colors.text,
    },
    subtitle: {
        fontSize: fontSizes.sm,
        color: colors.textSecondary,
        marginTop: spacing.xs,
    },
});

export default Card;
