import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Alert,
    Switch,
    KeyboardAvoidingView,
    Platform,
    TouchableOpacity,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { format, addDays } from 'date-fns';
import { useAuth } from '../../context/AuthContext';
import { Button, Input, Card } from '../../components';
import { timeSlotService } from '../../api/services';
import { Doctor } from '../../types';
import { colors, spacing, fontSizes, borderRadius, commonStyles } from '../../styles/theme';

interface RouteParams {
    doctor: Doctor;
}

const AbsentFormScreen: React.FC = () => {
    const navigation = useNavigation();
    const route = useRoute();
    const { doctor } = route.params as RouteParams;
    const { selectedDispensary } = useAuth();

    const [isLoading, setIsLoading] = useState(false);
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [formData, setFormData] = useState({
        isModifiedSession: false,
        startTime: '09:00',
        endTime: '12:00',
        maxPatients: '20',
        minutesPerPatient: '15',
        reason: '',
    });
    const [errors, setErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        navigation.setOptions({
            title: 'Add Absence / Modified Session',
        });
    }, [navigation]);

    const validate = () => {
        const newErrors: Record<string, string> = {};

        if (formData.isModifiedSession) {
            if (!formData.startTime) {
                newErrors.startTime = 'Start time is required';
            }
            if (!formData.endTime) {
                newErrors.endTime = 'End time is required';
            }
            if (formData.startTime >= formData.endTime) {
                newErrors.endTime = 'End time must be after start time';
            }
            if (!formData.maxPatients || isNaN(Number(formData.maxPatients))) {
                newErrors.maxPatients = 'Valid max patients is required';
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async () => {
        if (!validate()) return;
        if (!selectedDispensary) {
            Alert.alert('Error', 'Please select a dispensary');
            return;
        }

        setIsLoading(true);

        try {
            const data: any = {
                doctorId: doctor._id,
                dispensaryId: selectedDispensary._id,
                date: format(selectedDate, "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'"),
                isModifiedSession: formData.isModifiedSession,
                reason: formData.reason || undefined,
            };

            if (formData.isModifiedSession) {
                data.startTime = formData.startTime;
                data.endTime = formData.endTime;
                data.maxPatients = Number(formData.maxPatients);
                data.minutesPerPatient = Number(formData.minutesPerPatient);
            }

            await timeSlotService.createAbsent(data);
            Alert.alert(
                'Success',
                formData.isModifiedSession
                    ? 'Modified session created successfully'
                    : 'Absence marked successfully'
            );
            navigation.goBack();
        } catch (error: any) {
            const message = error.response?.data?.message || 'Failed to save';
            Alert.alert('Error', message);
        } finally {
            setIsLoading(false);
        }
    };

    // Simple date selection - next 30 days
    const dates = Array.from({ length: 30 }, (_, i) => addDays(new Date(), i));

    return (
        <KeyboardAvoidingView
            style={commonStyles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
                <Card title="Select Date">
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        <View style={styles.dateRow}>
                            {dates.map((date) => (
                                <TouchableOpacity
                                    key={date.toISOString()}
                                    style={[
                                        styles.dateItem,
                                        format(date, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd') &&
                                        styles.dateItemActive,
                                    ]}
                                    onPress={() => setSelectedDate(date)}
                                >
                                    <Text
                                        style={[
                                            styles.dateDay,
                                            format(date, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd') &&
                                            styles.dateTextActive,
                                        ]}
                                    >
                                        {format(date, 'EEE')}
                                    </Text>
                                    <Text
                                        style={[
                                            styles.dateNum,
                                            format(date, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd') &&
                                            styles.dateTextActive,
                                        ]}
                                    >
                                        {format(date, 'd')}
                                    </Text>
                                    <Text
                                        style={[
                                            styles.dateMonth,
                                            format(date, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd') &&
                                            styles.dateTextActive,
                                        ]}
                                    >
                                        {format(date, 'MMM')}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </ScrollView>
                </Card>

                <Card title="Entry Type">
                    <View style={styles.typeRow}>
                        <TouchableOpacity
                            style={[styles.typeBtn, !formData.isModifiedSession && styles.typeBtnActive]}
                            onPress={() => setFormData({ ...formData, isModifiedSession: false })}
                        >
                            <Text
                                style={[styles.typeText, !formData.isModifiedSession && styles.typeTextActive]}
                            >
                                Mark Absent
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.typeBtn, formData.isModifiedSession && styles.typeBtnActive]}
                            onPress={() => setFormData({ ...formData, isModifiedSession: true })}
                        >
                            <Text
                                style={[styles.typeText, formData.isModifiedSession && styles.typeTextActive]}
                            >
                                Modified Session
                            </Text>
                        </TouchableOpacity>
                    </View>

                    {formData.isModifiedSession && (
                        <>
                            <View style={styles.timeRow}>
                                <View style={styles.timeInput}>
                                    <Input
                                        label="Start Time *"
                                        value={formData.startTime}
                                        onChangeText={(text) => setFormData({ ...formData, startTime: text })}
                                        error={errors.startTime}
                                        placeholder="09:00"
                                    />
                                </View>
                                <View style={styles.timeInput}>
                                    <Input
                                        label="End Time *"
                                        value={formData.endTime}
                                        onChangeText={(text) => setFormData({ ...formData, endTime: text })}
                                        error={errors.endTime}
                                        placeholder="12:00"
                                    />
                                </View>
                            </View>

                            <Input
                                label="Maximum Patients *"
                                value={formData.maxPatients}
                                onChangeText={(text) => setFormData({ ...formData, maxPatients: text })}
                                error={errors.maxPatients}
                                placeholder="Maximum number of patients"
                                keyboardType="numeric"
                            />

                            <Input
                                label="Minutes Per Patient"
                                value={formData.minutesPerPatient}
                                onChangeText={(text) => setFormData({ ...formData, minutesPerPatient: text })}
                                placeholder="Average consultation time"
                                keyboardType="numeric"
                            />
                        </>
                    )}

                    <Input
                        label="Reason (Optional)"
                        value={formData.reason}
                        onChangeText={(text) => setFormData({ ...formData, reason: text })}
                        placeholder="Enter reason..."
                        multiline
                        numberOfLines={3}
                    />
                </Card>

                <View style={styles.buttonContainer}>
                    <Button
                        title={formData.isModifiedSession ? 'Create Modified Session' : 'Mark as Absent'}
                        onPress={handleSubmit}
                        loading={isLoading}
                    />
                    <Button
                        title="Cancel"
                        variant="outline"
                        onPress={() => navigation.goBack()}
                        style={styles.cancelBtn}
                    />
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    content: {
        padding: spacing.md,
    },
    dateRow: {
        flexDirection: 'row',
        paddingVertical: spacing.sm,
    },
    dateItem: {
        alignItems: 'center',
        padding: spacing.sm,
        marginRight: spacing.sm,
        borderRadius: borderRadius.md,
        borderWidth: 1,
        borderColor: colors.border,
        minWidth: 60,
    },
    dateItemActive: {
        backgroundColor: colors.primary,
        borderColor: colors.primary,
    },
    dateDay: {
        fontSize: fontSizes.sm,
        color: colors.textSecondary,
    },
    dateNum: {
        fontSize: fontSizes.xl,
        fontWeight: 'bold',
        color: colors.text,
        marginVertical: 2,
    },
    dateMonth: {
        fontSize: fontSizes.sm,
        color: colors.textSecondary,
    },
    dateTextActive: {
        color: colors.textWhite,
    },
    typeRow: {
        flexDirection: 'row',
        marginBottom: spacing.md,
    },
    typeBtn: {
        flex: 1,
        padding: spacing.md,
        borderRadius: borderRadius.md,
        borderWidth: 1,
        borderColor: colors.border,
        alignItems: 'center',
        marginHorizontal: spacing.xs,
    },
    typeBtnActive: {
        backgroundColor: colors.primary,
        borderColor: colors.primary,
    },
    typeText: {
        fontSize: fontSizes.md,
        fontWeight: '500',
        color: colors.text,
    },
    typeTextActive: {
        color: colors.textWhite,
    },
    timeRow: {
        flexDirection: 'row',
        marginHorizontal: -spacing.xs,
    },
    timeInput: {
        flex: 1,
        paddingHorizontal: spacing.xs,
    },
    buttonContainer: {
        marginTop: spacing.md,
    },
    cancelBtn: {
        marginTop: spacing.sm,
    },
});

export default AbsentFormScreen;
