import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { Dispensary } from '../../types';
import { colors, spacing, fontSizes, borderRadius, shadows, commonStyles } from '../../styles/theme';

const DispensarySelectScreen: React.FC = () => {
    const { dispensaries, selectDispensary, logout } = useAuth();

    const handleSelectDispensary = (dispensary: Dispensary) => {
        selectDispensary(dispensary);
    };

    const renderDispensaryItem = ({ item }: { item: Dispensary }) => (
        <TouchableOpacity
            style={styles.dispensaryCard}
            onPress={() => handleSelectDispensary(item)}
            activeOpacity={0.7}
        >
            <View style={styles.dispensaryIcon}>
                <Ionicons name="business" size={32} color={colors.primary} />
            </View>
            <View style={styles.dispensaryInfo}>
                <Text style={styles.dispensaryName}>{item.name}</Text>
                <Text style={styles.dispensaryAddress}>{item.address}</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color={colors.textLight} />
        </TouchableOpacity>
    );

    return (
        <View style={commonStyles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Select Dispensary</Text>
                <Text style={styles.subtitle}>
                    Choose the dispensary you want to manage
                </Text>
            </View>

            <FlatList
                data={dispensaries}
                renderItem={renderDispensaryItem}
                keyExtractor={(item) => item._id}
                contentContainerStyle={styles.list}
                showsVerticalScrollIndicator={false}
            />

            <TouchableOpacity style={styles.logoutButton} onPress={logout}>
                <Ionicons name="log-out-outline" size={20} color={colors.error} />
                <Text style={styles.logoutText}>Sign Out</Text>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    header: {
        padding: spacing.lg,
        paddingTop: spacing.xxl,
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
    },
    list: {
        padding: spacing.lg,
    },
    dispensaryCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.surface,
        borderRadius: borderRadius.lg,
        padding: spacing.md,
        marginBottom: spacing.md,
        ...shadows.md,
    },
    dispensaryIcon: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: colors.primaryLight + '20',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: spacing.md,
    },
    dispensaryInfo: {
        flex: 1,
    },
    dispensaryName: {
        fontSize: fontSizes.lg,
        fontWeight: '600',
        color: colors.text,
        marginBottom: spacing.xs,
    },
    dispensaryAddress: {
        fontSize: fontSizes.sm,
        color: colors.textSecondary,
    },
    logoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: spacing.md,
        marginBottom: spacing.lg,
    },
    logoutText: {
        fontSize: fontSizes.md,
        color: colors.error,
        marginLeft: spacing.sm,
        fontWeight: '500',
    },
});

export default DispensarySelectScreen;
