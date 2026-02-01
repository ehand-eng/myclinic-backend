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
import { useNavigation, useRoute } from '@react-navigation/native';
import { format, addMonths, subMonths } from 'date-fns';
import { useAuth } from '../../context/AuthContext';
import { Card, LoadingSpinner, EmptyState, Button } from '../../components';
import { timeSlotService } from '../../api/services';
import { Doctor, AbsentTimeSlot } from '../../types';
import { colors, spacing, fontSizes, borderRadius, commonStyles } from '../../styles/theme';

interface RouteParams {
    doctor: Doctor;
}

const AbsentListScreen: React.FC = () => {
    const navigation = useNavigation<any>();
    const route = useRoute();
    const { doctor } = route.params as RouteParams;
    const { selectedDispensary } = useAuth();

    const [absentSlots, setAbsentSlots] = useState<AbsentTimeSlot[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [currentMonth, setCurrentMonth] = useState(new Date());

    const loadData = useCallback(async () => {
        if (!selectedDispensary) return;

        try {
            const startDate = format(currentMonth, 'yyyy-MM-01');
            const endDate = format(addMonths(currentMonth, 1), 'yyyy-MM-01');

            const data = await timeSlotService.getAbsentSlots(
                doctor._id,
                selectedDispensary._id,
                startDate,
                endDate
            );
            setAbsentSlots(data);
        } catch (error) {
            console.error('Error loading absent slots:', error);
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    }, [selectedDispensary, doctor, currentMonth]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    useEffect(() => {
        navigation.setOptions({
            title: `Absences - ${doctor.name}`,
        });
    }, [doctor, navigation]);

    const handleRefresh = () => {
        setIsRefreshing(true);
        loadData();
    };

    const handlePreviousMonth = () => {
        setCurrentMonth(subMonths(currentMonth, 1));
        setIsLoading(true);
    };

    const handleNextMonth = () => {
        setCurrentMonth(addMonths(currentMonth, 1));
        setIsLoading(true);
    };

    const handleAddAbsent = () => {
        navigation.navigate('AbsentForm', { doctor });
    };

    const handleDeleteAbsent = (item: AbsentTimeSlot) => {
        Alert.alert(
            'Remove Entry',
            `Are you sure you want to remove this ${item.isModifiedSession ? 'modified session' : 'absence'}?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Remove',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await timeSlotService.deleteAbsent(item._id);
                            loadData();
                            Alert.alert('Success', 'Entry removed successfully');
                        } catch (error) {
                            Alert.alert('Error', 'Failed to remove entry');
                        }
                    },
                },
            ]
        );
    };

    if (isLoading) {
        return <LoadingSpinner message="Loading..." />;
    }

    const renderItem = ({ item }: { item: AbsentTimeSlot }) => (
        <Card>
            <View style={styles.itemHeader}>
                <View style={[
                    styles.typeBadge,
                    { backgroundColor: item.isModifiedSession ? colors.warning + '20' : colors.error + '20' }
                ]}>
                    <Ionicons
                        name={item.isModifiedSession ? 'time' : 'close-circle'}
                        size={16}
                        color={item.isModifiedSession ? colors.warning : colors.error}
                    />
                    <Text style={[
                        styles.typeText,
                        { color: item.isModifiedSession ? colors.warning : colors.error }
                    ]}>
                        {item.isModifiedSession ? 'Modified Session' : 'Absent'}
                    </Text>
                </View>
                <TouchableOpacity onPress={() => handleDeleteAbsent(item)}>
                    <Ionicons name="trash-outline" size={20} color={colors.error} />
                </TouchableOpacity>
            </View>

            <Text style={styles.dateText}>
                {format(new Date(item.date), 'EEEE, MMMM d, yyyy')}
            </Text>

            {item.isModifiedSession && item.startTime && item.endTime && (
                <Text style={styles.timeText}>
                    {item.startTime} - {item.endTime} • {item.maxPatients} patients
                </Text>
            )}

            {item.reason && (
                <Text style={styles.reasonText}>Reason: {item.reason}</Text>
            )}
        </Card>
    );

    return (
        <View style={commonStyles.container}>
            {/* Month Navigation */}
            <View style={styles.monthNav}>
                <TouchableOpacity onPress={handlePreviousMonth} style={styles.navBtn}>
                    <Ionicons name="chevron-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={styles.monthText}>{format(currentMonth, 'MMMM yyyy')}</Text>
                <TouchableOpacity onPress={handleNextMonth} style={styles.navBtn}>
                    <Ionicons name="chevron-forward" size={24} color={colors.text} />
                </TouchableOpacity>
            </View>

            <FlatList
                data={absentSlots.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())}
                renderItem={renderItem}
                keyExtractor={(item) => item._id}
                contentContainerStyle={styles.list}
                refreshControl={
                    <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
                }
                ListEmptyComponent={
                    <EmptyState
                        icon="calendar-outline"
                        title="No Absences or Modified Sessions"
                        message="Add absences or modified sessions for this month"
                        action={<Button title="Add Entry" onPress={handleAddAbsent} />}
                    />
                }
            />

            <TouchableOpacity style={styles.fab} onPress={handleAddAbsent}>
                <Ionicons name="add" size={28} color={colors.textWhite} />
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    monthNav: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: spacing.md,
        backgroundColor: colors.surface,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    navBtn: {
        padding: spacing.sm,
    },
    monthText: {
        fontSize: fontSizes.lg,
        fontWeight: '600',
        color: colors.text,
    },
    list: {
        padding: spacing.md,
        paddingBottom: spacing.xxl * 2,
    },
    itemHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.sm,
    },
    typeBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: spacing.sm,
        paddingVertical: spacing.xs,
        borderRadius: borderRadius.full,
    },
    typeText: {
        fontSize: fontSizes.sm,
        fontWeight: '600',
        marginLeft: spacing.xs,
    },
    dateText: {
        fontSize: fontSizes.md,
        fontWeight: '600',
        color: colors.text,
    },
    timeText: {
        fontSize: fontSizes.sm,
        color: colors.textSecondary,
        marginTop: spacing.xs,
    },
    reasonText: {
        fontSize: fontSizes.sm,
        color: colors.textSecondary,
        marginTop: spacing.xs,
        fontStyle: 'italic',
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

export default AbsentListScreen;
