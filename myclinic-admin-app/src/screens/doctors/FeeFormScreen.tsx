import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Alert,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import { Button, Input, Card, LoadingSpinner } from '../../components';
import { feeService } from '../../api/services';
import { Doctor, DoctorDispensaryFee } from '../../types';
import { colors, spacing, fontSizes, commonStyles } from '../../styles/theme';

interface RouteParams {
    doctor: Doctor;
}

const FeeFormScreen: React.FC = () => {
    const navigation = useNavigation();
    const route = useRoute();
    const { doctor } = route.params as RouteParams;
    const { selectedDispensary } = useAuth();

    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [existingFee, setExistingFee] = useState<DoctorDispensaryFee | null>(null);
    const [formData, setFormData] = useState({
        doctorFee: '',
        dispensaryFee: '',
        bookingCommission: '',
        channelPartnerFee: '0',
    });
    const [errors, setErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        navigation.setOptions({
            title: `Fees - ${doctor.name}`,
        });
        loadExistingFees();
    }, [doctor, navigation]);

    const loadExistingFees = async () => {
        if (!selectedDispensary) return;

        try {
            const fee = await feeService.getByDoctorAndDispensary(doctor._id, selectedDispensary._id);
            if (fee) {
                setExistingFee(fee);
                setFormData({
                    doctorFee: fee.doctorFee?.toString() || '',
                    dispensaryFee: fee.dispensaryFee?.toString() || '',
                    bookingCommission: fee.bookingCommission?.toString() || '',
                    channelPartnerFee: fee.channelPartnerFee?.toString() || '0',
                });
            }
        } catch (error) {
            // No existing fee, that's okay
        } finally {
            setIsLoading(false);
        }
    };

    const validate = () => {
        const newErrors: Record<string, string> = {};

        if (!formData.doctorFee || isNaN(Number(formData.doctorFee))) {
            newErrors.doctorFee = 'Valid doctor fee is required';
        }

        if (!formData.dispensaryFee || isNaN(Number(formData.dispensaryFee))) {
            newErrors.dispensaryFee = 'Valid dispensary fee is required';
        }

        if (!formData.bookingCommission || isNaN(Number(formData.bookingCommission))) {
            newErrors.bookingCommission = 'Valid booking commission is required';
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

        setIsSaving(true);

        try {
            const feeData = {
                doctorId: doctor._id,
                dispensaryId: selectedDispensary._id,
                doctorFee: Number(formData.doctorFee),
                dispensaryFee: Number(formData.dispensaryFee),
                bookingCommission: Number(formData.bookingCommission),
                channelPartnerFee: Number(formData.channelPartnerFee || 0),
            };

            if (existingFee) {
                await feeService.updateFees(doctor._id, selectedDispensary._id, {
                    doctorFee: feeData.doctorFee,
                    dispensaryFee: feeData.dispensaryFee,
                    bookingCommission: feeData.bookingCommission,
                    channelPartnerFee: feeData.channelPartnerFee,
                });
            } else {
                await feeService.assignFees(feeData);
            }

            Alert.alert('Success', 'Fee configuration saved successfully');
            navigation.goBack();
        } catch (error: any) {
            const message = error.response?.data?.message || 'Failed to save fee configuration';
            Alert.alert('Error', message);
        } finally {
            setIsSaving(false);
        }
    };

    const totalFee =
        (Number(formData.doctorFee) || 0) +
        (Number(formData.dispensaryFee) || 0) +
        (Number(formData.bookingCommission) || 0) +
        (Number(formData.channelPartnerFee) || 0);

    if (isLoading) {
        return <LoadingSpinner message="Loading fee configuration..." />;
    }

    return (
        <KeyboardAvoidingView
            style={commonStyles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
                <Card title="Fee Configuration" subtitle={`For ${doctor.name} at ${selectedDispensary?.name}`}>
                    <Input
                        label="Doctor Fee (Rs.) *"
                        value={formData.doctorFee}
                        onChangeText={(text) => setFormData({ ...formData, doctorFee: text })}
                        error={errors.doctorFee}
                        placeholder="Enter doctor's consultation fee"
                        keyboardType="numeric"
                    />

                    <Input
                        label="Dispensary Fee (Rs.) *"
                        value={formData.dispensaryFee}
                        onChangeText={(text) => setFormData({ ...formData, dispensaryFee: text })}
                        error={errors.dispensaryFee}
                        placeholder="Enter dispensary service fee"
                        keyboardType="numeric"
                    />

                    <Input
                        label="Booking Commission (Rs.) *"
                        value={formData.bookingCommission}
                        onChangeText={(text) => setFormData({ ...formData, bookingCommission: text })}
                        error={errors.bookingCommission}
                        placeholder="Enter booking commission"
                        keyboardType="numeric"
                    />

                    <Input
                        label="Channel Partner Fee (Rs.)"
                        value={formData.channelPartnerFee}
                        onChangeText={(text) => setFormData({ ...formData, channelPartnerFee: text })}
                        placeholder="Enter channel partner fee (optional)"
                        keyboardType="numeric"
                    />

                    <View style={styles.totalContainer}>
                        <Text style={styles.totalLabel}>Total Fee:</Text>
                        <Text style={styles.totalAmount}>Rs. {totalFee.toLocaleString()}</Text>
                    </View>
                </Card>

                <View style={styles.buttonContainer}>
                    <Button
                        title="Save Fee Configuration"
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
    totalContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: spacing.md,
        marginTop: spacing.md,
        borderTopWidth: 1,
        borderTopColor: colors.border,
    },
    totalLabel: {
        fontSize: fontSizes.lg,
        fontWeight: '600',
        color: colors.text,
    },
    totalAmount: {
        fontSize: fontSizes.xl,
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

export default FeeFormScreen;
