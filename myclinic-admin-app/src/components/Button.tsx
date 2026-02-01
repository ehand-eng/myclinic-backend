import React from 'react';
import {
    TouchableOpacity,
    Text,
    StyleSheet,
    ActivityIndicator,
    ViewStyle,
    TextStyle,
} from 'react-native';
import { colors, borderRadius, spacing, fontSizes } from '../styles/theme';

interface ButtonProps {
    title: string;
    onPress: () => void;
    variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'success';
    size?: 'small' | 'medium' | 'large';
    loading?: boolean;
    disabled?: boolean;
    style?: ViewStyle;
    textStyle?: TextStyle;
    icon?: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({
    title,
    onPress,
    variant = 'primary',
    size = 'medium',
    loading = false,
    disabled = false,
    style,
    textStyle,
    icon,
}) => {
    const getButtonStyle = () => {
        const baseStyle: ViewStyle = {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: borderRadius.md,
        };

        // Size styles
        switch (size) {
            case 'small':
                baseStyle.paddingHorizontal = spacing.md;
                baseStyle.paddingVertical = spacing.sm;
                break;
            case 'large':
                baseStyle.paddingHorizontal = spacing.xl;
                baseStyle.paddingVertical = spacing.lg;
                break;
            default:
                baseStyle.paddingHorizontal = spacing.lg;
                baseStyle.paddingVertical = spacing.md;
        }

        // Variant styles
        switch (variant) {
            case 'secondary':
                baseStyle.backgroundColor = colors.secondary;
                break;
            case 'outline':
                baseStyle.backgroundColor = colors.transparent;
                baseStyle.borderWidth = 1;
                baseStyle.borderColor = colors.primary;
                break;
            case 'danger':
                baseStyle.backgroundColor = colors.error;
                break;
            case 'success':
                baseStyle.backgroundColor = colors.success;
                break;
            default:
                baseStyle.backgroundColor = colors.primary;
        }

        if (disabled || loading) {
            baseStyle.opacity = 0.6;
        }

        return baseStyle;
    };

    const getTextStyle = () => {
        const baseTextStyle: TextStyle = {
            fontWeight: '600',
        };

        // Size styles
        switch (size) {
            case 'small':
                baseTextStyle.fontSize = fontSizes.sm;
                break;
            case 'large':
                baseTextStyle.fontSize = fontSizes.xl;
                break;
            default:
                baseTextStyle.fontSize = fontSizes.md;
        }

        // Variant styles
        if (variant === 'outline') {
            baseTextStyle.color = colors.primary;
        } else {
            baseTextStyle.color = colors.textWhite;
        }

        return baseTextStyle;
    };

    return (
        <TouchableOpacity
            style={[getButtonStyle(), style]}
            onPress={onPress}
            disabled={disabled || loading}
            activeOpacity={0.7}
        >
            {loading ? (
                <ActivityIndicator
                    color={variant === 'outline' ? colors.primary : colors.textWhite}
                    size="small"
                />
            ) : (
                <>
                    {icon && <>{icon}</>}
                    <Text style={[getTextStyle(), icon && { marginLeft: spacing.sm }, textStyle]}>
                        {title}
                    </Text>
                </>
            )}
        </TouchableOpacity>
    );
};

export default Button;
