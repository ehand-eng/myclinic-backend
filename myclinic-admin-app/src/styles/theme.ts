import { StyleSheet } from 'react-native';

// Color palette
export const colors = {
    primary: '#2563eb',
    primaryDark: '#1d4ed8',
    primaryLight: '#3b82f6',
    secondary: '#64748b',
    success: '#22c55e',
    warning: '#f59e0b',
    error: '#ef4444',
    info: '#0ea5e9',

    background: '#f8fafc',
    surface: '#ffffff',
    card: '#ffffff',

    text: '#1e293b',
    textSecondary: '#64748b',
    textLight: '#94a3b8',
    textWhite: '#ffffff',

    border: '#e2e8f0',
    borderLight: '#f1f5f9',

    overlay: 'rgba(0, 0, 0, 0.5)',
    transparent: 'transparent',
};

// Spacing
export const spacing = {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
};

// Font sizes
export const fontSizes = {
    xs: 10,
    sm: 12,
    md: 14,
    lg: 16,
    xl: 18,
    xxl: 24,
    xxxl: 32,
};

// Border radius
export const borderRadius = {
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
    full: 9999,
};

// Shadows
export const shadows = {
    sm: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    md: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    lg: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 5,
    },
};

// Common styles
export const commonStyles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    content: {
        flex: 1,
        padding: spacing.md,
    },
    card: {
        backgroundColor: colors.card,
        borderRadius: borderRadius.lg,
        padding: spacing.md,
        ...shadows.md,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    spaceBetween: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    center: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    title: {
        fontSize: fontSizes.xxl,
        fontWeight: 'bold',
        color: colors.text,
    },
    subtitle: {
        fontSize: fontSizes.lg,
        fontWeight: '600',
        color: colors.text,
    },
    text: {
        fontSize: fontSizes.md,
        color: colors.text,
    },
    textSecondary: {
        fontSize: fontSizes.md,
        color: colors.textSecondary,
    },
    textSmall: {
        fontSize: fontSizes.sm,
        color: colors.textSecondary,
    },
    input: {
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: borderRadius.md,
        padding: spacing.md,
        fontSize: fontSizes.md,
        color: colors.text,
    },
    button: {
        backgroundColor: colors.primary,
        borderRadius: borderRadius.md,
        padding: spacing.md,
        alignItems: 'center',
        justifyContent: 'center',
    },
    buttonText: {
        color: colors.textWhite,
        fontSize: fontSizes.lg,
        fontWeight: '600',
    },
    buttonOutline: {
        backgroundColor: colors.transparent,
        borderWidth: 1,
        borderColor: colors.primary,
        borderRadius: borderRadius.md,
        padding: spacing.md,
        alignItems: 'center',
        justifyContent: 'center',
    },
    buttonOutlineText: {
        color: colors.primary,
        fontSize: fontSizes.lg,
        fontWeight: '600',
    },
    divider: {
        height: 1,
        backgroundColor: colors.border,
        marginVertical: spacing.md,
    },
    badge: {
        paddingHorizontal: spacing.sm,
        paddingVertical: spacing.xs,
        borderRadius: borderRadius.full,
    },
    badgeText: {
        fontSize: fontSizes.sm,
        fontWeight: '600',
    },
    loader: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: spacing.xl,
    },
    emptyStateText: {
        fontSize: fontSizes.lg,
        color: colors.textSecondary,
        textAlign: 'center',
        marginTop: spacing.md,
    },
    errorText: {
        fontSize: fontSizes.sm,
        color: colors.error,
        marginTop: spacing.xs,
    },
    sectionHeader: {
        fontSize: fontSizes.md,
        fontWeight: '600',
        color: colors.textSecondary,
        marginBottom: spacing.sm,
        marginTop: spacing.md,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
});

// Status colors
export const getStatusColor = (status: string) => {
    switch (status) {
        case 'scheduled':
            return colors.info;
        case 'checked_in':
            return colors.warning;
        case 'completed':
            return colors.success;
        case 'cancelled':
            return colors.error;
        case 'no_show':
            return colors.secondary;
        default:
            return colors.secondary;
    }
};

// Status labels
export const getStatusLabel = (status: string) => {
    switch (status) {
        case 'scheduled':
            return 'Scheduled';
        case 'checked_in':
            return 'Checked In';
        case 'completed':
            return 'Completed';
        case 'cancelled':
            return 'Cancelled';
        case 'no_show':
            return 'No Show';
        default:
            return status;
    }
};
