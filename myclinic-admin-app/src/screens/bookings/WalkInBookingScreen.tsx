import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Alert,
    KeyboardAvoidingView,
    Platform,
    TouchableOpacity,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useNavigation } from '@react-navigation/native';
import { format, addDays } from 'date-fns';
import { useAuth } from '../../context/AuthContext';
import { Button, Input, Card, LoadingSpinner } from '../../components';
import { bookingService, doctorService, timeSlotService, feeService } from '../../api/services';
import { Doctor, Session, DoctorDispensaryFee } from '../../types';
import { colors, spacing, fontSizes, borderRadius, commonStyles } from '../../styles/theme';

const WalkInBookingScreen: React.FC = () => {
    const navigation = useNavigation();
    const { selectedDispensary, user } = useAuth();

    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [doctors, setDoctors] = useState<Doctor[]>([]);
    const [sessions, setSessions] = useState<Session[]>([]);
    const [fees, setFees] = useState<DoctorDispensaryFee | null>(null);

    const [selectedDate, setSelectedDate] = useState(new Date());
    const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
    const [selectedSession, setSelectedSession] = useState<Session | null>(null);

    const [formData, setFormData] = useState({
        patientName: '',
        patientPhone: '',
        patientEmail: '',
        symptoms: '',
    });
    const [errors, setErrors] = useState<Record<string, string>>({});

    // Load doctors
    useEffect(() => {
        const loadDoctors = async () => {
            if (!selectedDispensary) return;
            try {
                const data = await doctorService.getByDispensary(selectedDispensary._id);
                setDoctors(data);
            } catch (error) {
                console.error('Error loading doctors:', error);
            } finally {
                setIsLoading(false);
            }
        };
        loadDoctors();
    }, [selectedDispensary]);

    // Load sessions when doctor or date changes
    useEffect(() => {
        const loadSessions = async () => {
            if (!selectedDispensary || !selectedDoctor) {
                setSessions([]);
                return;
            }
            try {
                const dateStr = format(selectedDate, 'yyyy-MM-dd');
                const response = await timeSlotService.getSessions(
                    selectedDoctor._id,
                    selectedDispensary._id,
                    dateStr
                );
                setSessions(response.sessions || []);
                setSelectedSession(null);
            } catch (error) {
                console.error('Error loading sessions:', error);
                setSessions([]);
            }
        };
        loadSessions();
    }, [selectedDispensary, selectedDoctor, selectedDate]);

    // Load fees when doctor is selected
    useEffect(() => {
        const loadFees = async () => {
            if (!selectedDispensary || !selectedDoctor) {
                setFees(null);
                return;
            }
            try {
                const feeData = await feeService.getByDoctorAndDispensary(
                    selectedDoctor._id,
                    selectedDispensary._id
                );
                setFees(feeData);
            } catch (error) {
                console.error('Error loading fees:', error);
                setFees(null);
            }
        };
        loadFees();
    }, [selectedDispensary, selectedDoctor]);

    const validate = () => {
        const newErrors: Record<string, string> = {};

        if (!selectedDoctor) {
            newErrors.doctor = 'Please select a doctor';
        }

        if (!selectedSession) {
            newErrors.session = 'Please select a session';
        }

        if (!formData.patientName.trim()) {
            newErrors.patientName = 'Patient name is required';
        }

        if (!formData.patientPhone.trim()) {
            newErrors.patientPhone = 'Phone number is required';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async () => {
        if (!validate()) return;
        if (!selectedDispensary || !selectedDoctor || !selectedSession) {
            Alert.alert('Error', 'Please fill all required fields');
            return;
        }

        setIsSaving(true);

        try {
            const bookingData = {
                doctorId: selectedDoctor._id,
                dispensaryId: selectedDispensary._id,
                bookingDate: format(selectedDate, 'yyyy-MM-dd'),
                patientName: formData.patientName.trim(),
                patientPhone: formData.patientPhone.trim(),
                patientEmail: formData.patientEmail.trim() || undefined,
                symptoms: formData.symptoms.trim() || undefined,
                timeSlotConfigId: selectedSession.timeSlotConfigId,
                userRole: 'dispensary-admin',
                bookedUser: user?.id,
                fees: {
                    doctorFee: fees?.doctorFee || 0,
                    dispensaryFee: fees?.dispensaryFee || 0,
                    bookingCommission: fees?.bookingCommission || 0,
                    channelPartnerFee: fees?.channelPartnerFee || 0,
                    totalFee: (fees?.doctorFee || 0) + (fees?.dispensaryFee || 0) + (fees?.bookingCommission || 0),
                },
            };

            const result = await bookingService.create(bookingData);
            Alert.alert(
                'Booking Created',
                `Appointment #${result.appointmentNumber} created successfully.\nEstimated time: ${result.estimatedTime}`,
                [{ text: 'OK', onPress: () => navigation.goBack() }]
            );
        } catch (error: any) {
            const message = error.response?.data?.message || 'Failed to create booking';
            Alert.alert('Error', message);
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return <LoadingSpinner message="Loading..." />;
    }

    // Date options - today and next 7 days
    const dateOptions = Array.from({ length: 7 }, (_, i) => addDays(new Date(), i));

    return (
        <KeyboardAvoidingView
            style={commonStyles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
                <Card title="Booking Details">
                    {/* Doctor Selection */}
                    <Text style={styles.label}>Doctor *</Text>
                    <View style={styles.pickerContainer}>
                        <Picker
                            selectedValue={selectedDoctor?._id || ''}
                            onValueChange={(value) => {
                                const doctor = doctors.find((d) => d._id === value);
                                setSelectedDoctor(doctor || null);
                            }}
                        >
                            <Picker.Item label="Select a doctor" value="" />
                            {doctors.map((doctor) => (
                                <Picker.Item
                                    key={doctor._id}
                                    label={`${doctor.name} - ${doctor.specialization}`}
                                    value={doctor._id}
                                />
                            ))}
                        </Picker>
                    </View>
                    {errors.doctor && <Text style={styles.error}>{errors.doctor}</Text>}

                    {/* Date Selection */}
                    <Text style={styles.label}>Date *</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dateScroll}>
                        {dateOptions.map((date) => (
                            <TouchableOpacity
                                key={date.toISOString()}
                                style={[
                                    styles.dateChip,
                                    format(date, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd') &&
                                    styles.dateChipActive,
                                ]}
                                onPress={() => setSelectedDate(date)}
                            >
                                <Text
                                    style={[
                                        styles.dateChipText,
                                        format(date, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd') &&
                                        styles.dateChipTextActive,
                                    ]}
                                >
                                    {format(date, 'EEE, MMM d')}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>

                    {/* Session Selection */}
                    {selectedDoctor && (
                        <>
                            <Text style={styles.label}>Session *</Text>
                            {sessions.length === 0 ? (
                                <Text style={styles.noSessions}>No sessions available for this date</Text>
                            ) : (
                                <View style={styles.sessionsContainer}>
                                    {sessions.map((session, index) => (
                                        <TouchableOpacity
                                            key={index}
                                            style={[
                                                styles.sessionChip,
                                                selectedSession?.timeSlotConfigId === session.timeSlotConfigId &&
                                                styles.sessionChipActive,
                                            ]}
                                            onPress={() => setSelectedSession(session)}
                                        >
                                            <Text
                                                style={[
                                                    styles.sessionChipText,
                                                    selectedSession?.timeSlotConfigId === session.timeSlotConfigId &&
                                                    styles.sessionChipTextActive,
                                                ]}
                                            >
                                                {session.timeSlot}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            )}
                            {errors.session && <Text style={styles.error}>{errors.session}</Text>}
                        </>
                    )}
                </Card>

                <Card title="Patient Information">
                    <Input
                        label="Patient Name *"
                        value={formData.patientName}
                        onChangeText={(text) => setFormData({ ...formData, patientName: text })}
                        error={errors.patientName}
                        placeholder="Enter patient's full name"
                    />

                    <Input
                        label="Phone Number *"
                        value={formData.patientPhone}
                        onChangeText={(text) => setFormData({ ...formData, patientPhone: text })}
                        error={errors.patientPhone}
                        placeholder="e.g., 0771234567"
                        keyboardType="phone-pad"
                    />

                    <Input
                        label="Email (Optional)"
                        value={formData.patientEmail}
                        onChangeText={(text) => setFormData({ ...formData, patientEmail: text })}
                        placeholder="patient@email.com"
                        keyboardType="email-address"
                        autoCapitalize="none"
                    />

                    <Input
                        label="Symptoms (Optional)"
                        value={formData.symptoms}
                        onChangeText={(text) => setFormData({ ...formData, symptoms: text })}
                        placeholder="Describe symptoms..."
                        multiline
                        numberOfLines={3}
                    />
                </Card>

                {/* Fee Summary */}
                {fees && (
                    <Card title="Fee Summary">
                        <View style={styles.feeRow}>
                            <Text style={styles.feeLabel}>Doctor Fee</Text>
                            <Text style={styles.feeValue}>Rs. {fees.doctorFee?.toLocaleString()}</Text>
                        </View>
                        <View style={styles.feeRow}>
                            <Text style={styles.feeLabel}>Dispensary Fee</Text>
                            <Text style={styles.feeValue}>Rs. {fees.dispensaryFee?.toLocaleString()}</Text>
                        </View>
                        <View style={styles.feeRow}>
                            <Text style={styles.feeLabel}>Booking Commission</Text>
                            <Text style={styles.feeValue}>Rs. {fees.bookingCommission?.toLocaleString()}</Text>
                        </View>
                        <View style={styles.totalRow}>
                            <Text style={styles.totalLabel}>Total</Text>
                            <Text style={styles.totalValue}>
                                Rs. {((fees.doctorFee || 0) + (fees.dispensaryFee || 0) + (fees.bookingCommission || 0)).toLocaleString()}
                            </Text>
                        </View>
                    </Card>
                )}

                <View style={styles.buttonContainer}>
                    <Button
                        title="Create Booking"
                        onPress={handleSubmit}
                        loading={isSaving}
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
    label: {
        fontSize: fontSizes.sm,
        fontWeight: '600',
        color: colors.text,
        marginBottom: spacing.xs,
        marginTop: spacing.md,
    },
    pickerContainer: {
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: borderRadius.md,
        overflow: 'hidden',
    },
    error: {
        fontSize: fontSizes.sm,
        color: colors.error,
        marginTop: spacing.xs,
    },
    dateScroll: {
        marginTop: spacing.sm,
    },
    dateChip: {
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        borderRadius: borderRadius.full,
        borderWidth: 1,
        borderColor: colors.border,
        marginRight: spacing.sm,
    },
    dateChipActive: {
        backgroundColor: colors.primary,
        borderColor: colors.primary,
    },
    dateChipText: {
        fontSize: fontSizes.sm,
        color: colors.text,
    },
    dateChipTextActive: {
        color: colors.textWhite,
        fontWeight: '600',
    },
    noSessions: {
        fontSize: fontSizes.md,
        color: colors.textSecondary,
        fontStyle: 'italic',
        marginTop: spacing.sm,
    },
    sessionsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginTop: spacing.sm,
    },
    sessionChip: {
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        borderRadius: borderRadius.md,
        borderWidth: 1,
        borderColor: colors.border,
        marginRight: spacing.sm,
        marginBottom: spacing.sm,
    },
    sessionChipActive: {
        backgroundColor: colors.primary,
        borderColor: colors.primary,
    },
    sessionChipText: {
        fontSize: fontSizes.md,
        color: colors.text,
    },
    sessionChipTextActive: {
        color: colors.textWhite,
        fontWeight: '600',
    },
    feeRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: spacing.xs,
    },
    feeLabel: {
        fontSize: fontSizes.md,
        color: colors.textSecondary,
    },
    feeValue: {
        fontSize: fontSizes.md,
        color: colors.text,
    },
    totalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: spacing.sm,
        marginTop: spacing.sm,
        borderTopWidth: 1,
        borderTopColor: colors.border,
    },
    totalLabel: {
        fontSize: fontSizes.lg,
        fontWeight: '600',
        color: colors.text,
    },
    totalValue: {
        fontSize: fontSizes.lg,
        fontWeight: 'bold',
        color: colors.primary,
    },
    buttonContainer: {
        marginTop: spacing.md,
    },
    cancelBtn: {
        marginTop: spacing.sm,
    },
});

export default WalkInBookingScreen;
