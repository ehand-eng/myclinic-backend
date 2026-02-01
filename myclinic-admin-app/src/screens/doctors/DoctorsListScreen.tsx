import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    RefreshControl,
    Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import { Card, LoadingSpinner, EmptyState, Button } from '../../components';
import { doctorService } from '../../api/services';
import { Doctor } from '../../types';
import { colors, spacing, fontSizes, borderRadius, commonStyles } from '../../styles/theme';

const DoctorsListScreen: React.FC = () => {
    const navigation = useNavigation<any>();
    const { selectedDispensary } = useAuth();
    const [doctors, setDoctors] = useState<Doctor[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);

    const loadDoctors = useCallback(async () => {
        if (!selectedDispensary) return;

        try {
            const data = await doctorService.getByDispensary(selectedDispensary._id);
            setDoctors(data);
        } catch (error) {
            console.error('Error loading doctors:', error);
            Alert.alert('Error', 'Failed to load doctors');
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    }, [selectedDispensary]);

    useEffect(() => {
        loadDoctors();
    }, [loadDoctors]);

    const handleRefresh = () => {
        setIsRefreshing(true);
        loadDoctors();
    };

    const handleAddDoctor = () => {
        navigation.navigate('DoctorForm', { mode: 'add' });
    };

    const handleEditDoctor = (doctor: Doctor) => {
        navigation.navigate('DoctorForm', { mode: 'edit', doctor });
    };

    const handleDeleteDoctor = (doctor: Doctor) => {
        Alert.alert(
            'Delete Doctor',
            `Are you sure you want to remove ${doctor.name} from this dispensary?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await doctorService.delete(doctor._id);
                            loadDoctors();
                            Alert.alert('Success', 'Doctor removed successfully');
                        } catch (error) {
                            Alert.alert('Error', 'Failed to delete doctor');
                        }
                    },
                },
            ]
        );
    };

    const handleManageFees = (doctor: Doctor) => {
        navigation.navigate('FeeForm', { doctor });
    };

    const handleManageTimeSlots = (doctor: Doctor) => {
        navigation.navigate('TimeSlotsList', { doctor });
    };

    if (isLoading) {
        return <LoadingSpinner message="Loading doctors..." />;
    }

    const renderDoctorItem = ({ item }: { item: Doctor }) => (
        <Card>
            <View style={styles.doctorHeader}>
                <View style={styles.avatarContainer}>
                    <Ionicons name="person" size={24} color={colors.primary} />
                </View>
                <View style={styles.doctorInfo}>
                    <Text style={styles.doctorName}>{item.name}</Text>
                    <Text style={styles.specialization}>{item.specialization}</Text>
                </View>
                <View style={[styles.statusDot, { backgroundColor: item.isActive ? colors.success : colors.error }]} />
            </View>

            {item.phone && (
                <View style={styles.detailRow}>
                    <Ionicons name="call-outline" size={16} color={colors.textSecondary} />
                    <Text style={styles.detailText}>{item.phone}</Text>
                </View>
            )}

            {item.email && (
                <View style={styles.detailRow}>
                    <Ionicons name="mail-outline" size={16} color={colors.textSecondary} />
                    <Text style={styles.detailText}>{item.email}</Text>
                </View>
            )}

            <View style={styles.actionButtons}>
                <TouchableOpacity style={styles.actionBtn} onPress={() => handleManageTimeSlots(item)}>
                    <Ionicons name="time-outline" size={18} color={colors.info} />
                    <Text style={[styles.actionText, { color: colors.info }]}>Time Slots</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionBtn} onPress={() => handleManageFees(item)}>
                    <Ionicons name="cash-outline" size={18} color={colors.success} />
                    <Text style={[styles.actionText, { color: colors.success }]}>Fees</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionBtn} onPress={() => handleEditDoctor(item)}>
                    <Ionicons name="create-outline" size={18} color={colors.warning} />
                    <Text style={[styles.actionText, { color: colors.warning }]}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionBtn} onPress={() => handleDeleteDoctor(item)}>
                    <Ionicons name="trash-outline" size={18} color={colors.error} />
                    <Text style={[styles.actionText, { color: colors.error }]}>Delete</Text>
                </TouchableOpacity>
            </View>
        </Card>
    );

    return (
        <View style={commonStyles.container}>
            <FlatList
                data={doctors}
                renderItem={renderDoctorItem}
                keyExtractor={(item) => item._id}
                contentContainerStyle={styles.list}
                refreshControl={
                    <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
                }
                ListEmptyComponent={
                    <EmptyState
                        icon="medical-outline"
                        title="No Doctors Found"
                        message="Add doctors to your dispensary to get started"
                        action={<Button title="Add Doctor" onPress={handleAddDoctor} />}
                    />
                }
            />

            <TouchableOpacity style={styles.fab} onPress={handleAddDoctor}>
                <Ionicons name="add" size={28} color={colors.textWhite} />
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    list: {
        padding: spacing.md,
        paddingBottom: spacing.xxl * 2,
    },
    doctorHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: spacing.md,
    },
    avatarContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: colors.primaryLight + '20',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: spacing.md,
    },
    doctorInfo: {
        flex: 1,
    },
    doctorName: {
        fontSize: fontSizes.lg,
        fontWeight: '600',
        color: colors.text,
    },
    specialization: {
        fontSize: fontSizes.sm,
        color: colors.textSecondary,
        marginTop: 2,
    },
    statusDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
    },
    detailRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: spacing.xs,
    },
    detailText: {
        fontSize: fontSizes.sm,
        color: colors.textSecondary,
        marginLeft: spacing.sm,
    },
    actionButtons: {
        flexDirection: 'row',
        marginTop: spacing.md,
        borderTopWidth: 1,
        borderTopColor: colors.borderLight,
        paddingTop: spacing.md,
    },
    actionBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: spacing.xs,
    },
    actionText: {
        fontSize: fontSizes.sm,
        marginLeft: spacing.xs,
        fontWeight: '500',
    },
    fab: {
        position: 'absolute',
        right: spacing.lg,
        bottom: spacing.lg,
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
    },
});

export default DoctorsListScreen;
