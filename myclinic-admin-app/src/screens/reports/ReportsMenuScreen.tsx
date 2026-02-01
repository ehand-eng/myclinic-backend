import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { Card } from '../../components';
import { colors, spacing, fontSizes, borderRadius, shadows, commonStyles } from '../../styles/theme';

const ReportsMenuScreen: React.FC = () => {
    const navigation = useNavigation<any>();

    const reportOptions = [
        {
            id: 'daily',
            title: 'Daily Report',
            description: 'View bookings and statistics for a specific day',
            icon: 'today',
            color: colors.primary,
            screen: 'DailyReport',
        },
        {
            id: 'monthly',
            title: 'Monthly Summary',
            description: 'View monthly booking trends and statistics',
            icon: 'calendar',
            color: colors.success,
            screen: 'MonthlyReport',
        },
        {
            id: 'doctor',
            title: 'Doctor Performance',
            description: 'View performance metrics for each doctor',
            icon: 'medical',
            color: colors.info,
            screen: 'DoctorPerformanceReport',
        },
    ];

    return (
        <ScrollView style={commonStyles.container} contentContainerStyle={styles.content}>
            <Text style={styles.title}>Reports</Text>
            <Text style={styles.subtitle}>Select a report type to view</Text>

            {reportOptions.map((option) => (
                <TouchableOpacity
                    key={option.id}
                    onPress={() => navigation.navigate(option.screen)}
                    activeOpacity={0.7}
                >
                    <Card style={styles.reportCard}>
                        <View style={styles.cardContent}>
                            <View style={[styles.iconContainer, { backgroundColor: option.color + '20' }]}>
                                <Ionicons name={option.icon as any} size={32} color={option.color} />
                            </View>
                            <View style={styles.textContainer}>
                                <Text style={styles.cardTitle}>{option.title}</Text>
                                <Text style={styles.cardDescription}>{option.description}</Text>
                            </View>
                            <Ionicons name="chevron-forward" size={24} color={colors.textLight} />
                        </View>
                    </Card>
                </TouchableOpacity>
            ))}
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    content: {
        padding: spacing.md,
    },
    title: {
        fontSize: fontSizes.xxl,
        fontWeight: 'bold',
        color: colors.text,
        marginBottom: spacing.xs,
    },
    subtitle: {
        fontSize: fontSizes.md,
        color: colors.textSecondary,
        marginBottom: spacing.lg,
    },
    reportCard: {
        marginBottom: spacing.md,
    },
    cardContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    iconContainer: {
        width: 64,
        height: 64,
        borderRadius: 32,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: spacing.md,
    },
    textContainer: {
        flex: 1,
    },
    cardTitle: {
        fontSize: fontSizes.lg,
        fontWeight: '600',
        color: colors.text,
        marginBottom: spacing.xs,
    },
    cardDescription: {
        fontSize: fontSizes.sm,
        color: colors.textSecondary,
    },
});

export default ReportsMenuScreen;
