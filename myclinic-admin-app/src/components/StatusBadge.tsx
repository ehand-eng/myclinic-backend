import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { colors, fontSizes, spacing, borderRadius } from '../styles/theme';
import { getStatusColor, getStatusLabel } from '../styles/theme';

interface StatusBadgeProps {
    status: string;
    style?: ViewStyle;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status, style }) => {
    const backgroundColor = getStatusColor(status);
    const label = getStatusLabel(status);

    return (
        <View style={[styles.badge, { backgroundColor }, style]}>
            <Text style={styles.text}>{label}</Text>
        </View>
    );
};

const styles = StyleSheet.create({
    badge: {
        paddingHorizontal: spacing.sm,
        paddingVertical: spacing.xs,
        borderRadius: borderRadius.full,
    },
    text: {
        fontSize: fontSizes.xs,
        fontWeight: '600',
        color: colors.textWhite,
        textTransform: 'uppercase',
    },
});

export default StatusBadge;
