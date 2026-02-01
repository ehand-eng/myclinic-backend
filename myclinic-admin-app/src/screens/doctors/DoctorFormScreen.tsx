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
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import { Button, Input, Card } from '../../components';
import { doctorService } from '../../api/services';
import { Doctor } from '../../types';
import { colors, spacing, fontSizes, commonStyles } from '../../styles/theme';

interface RouteParams {
    mode: 'add' | 'edit';
    doctor?: Doctor;
}

const DoctorFormScreen: React.FC = () => {
    const navigation = useNavigation();
    const route = useRoute();
    const { mode, doctor } = route.params as RouteParams;
    const { selectedDispensary } = useAuth();

    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: doctor?.name || '',
        specialization: doctor?.specialization || '',
        email: doctor?.email || '',
        phone: doctor?.phone || '',
        qualifications: doctor?.qualifications?.join(', ') || '',
        experience: doctor?.experience?.toString() || '',
        isActive: doctor?.isActive ?? true,
    });
    const [errors, setErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        navigation.setOptions({
            title: mode === 'add' ? 'Add Doctor' : 'Edit Doctor',
        });
    }, [mode, navigation]);

    const validate = () => {
        const newErrors: Record<string, string> = {};

        if (!formData.name.trim()) {
            newErrors.name = 'Doctor name is required';
        }

        if (!formData.specialization.trim()) {
            newErrors.specialization = 'Specialization is required';
        }

        if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
            newErrors.email = 'Please enter a valid email';
        }

        if (formData.experience && isNaN(Number(formData.experience))) {
            newErrors.experience = 'Experience must be a number';
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
            const doctorData = {
                name: formData.name.trim(),
                specialization: formData.specialization.trim(),
                email: formData.email.trim() || undefined,
                phone: formData.phone.trim() || undefined,
                qualifications: formData.qualifications
                    ? formData.qualifications.split(',').map((q) => q.trim())
                    : [],
                experience: formData.experience ? Number(formData.experience) : undefined,
                isActive: formData.isActive,
                dispensaries: [selectedDispensary._id],
            };

            if (mode === 'add') {
                await doctorService.create(doctorData);
                Alert.alert('Success', 'Doctor added successfully');
            } else if (doctor) {
                await doctorService.update(doctor._id, doctorData);
                Alert.alert('Success', 'Doctor updated successfully');
            }

            navigation.goBack();
        } catch (error: any) {
            const message = error.response?.data?.message || 'Failed to save doctor';
            Alert.alert('Error', message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            style={commonStyles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
                <Card>
                    <Input
                        label="Doctor Name *"
                        value={formData.name}
                        onChangeText={(text) => setFormData({ ...formData, name: text })}
                        error={errors.name}
                        placeholder="Enter doctor's full name"
                    />

                    <Input
                        label="Specialization *"
                        value={formData.specialization}
                        onChangeText={(text) => setFormData({ ...formData, specialization: text })}
                        error={errors.specialization}
                        placeholder="e.g., General Medicine, Cardiology"
                    />

                    <Input
                        label="Email"
                        value={formData.email}
                        onChangeText={(text) => setFormData({ ...formData, email: text })}
                        error={errors.email}
                        placeholder="doctor@email.com"
                        keyboardType="email-address"
                        autoCapitalize="none"
                    />

                    <Input
                        label="Phone"
                        value={formData.phone}
                        onChangeText={(text) => setFormData({ ...formData, phone: text })}
                        placeholder="+94 77 123 4567"
                        keyboardType="phone-pad"
                    />

                    <Input
                        label="Qualifications"
                        value={formData.qualifications}
                        onChangeText={(text) => setFormData({ ...formData, qualifications: text })}
                        placeholder="MBBS, MD, FRCP (comma separated)"
                    />

                    <Input
                        label="Experience (years)"
                        value={formData.experience}
                        onChangeText={(text) => setFormData({ ...formData, experience: text })}
                        error={errors.experience}
                        placeholder="Years of experience"
                        keyboardType="numeric"
                    />

                    <View style={styles.switchRow}>
                        <View style={styles.switchLabel}>
                            <Text style={styles.labelText}>Active Status</Text>
                            <Text style={styles.helperText}>
                                Inactive doctors won't appear in bookings
                            </Text>
                        </View>
                        <Switch
                            value={formData.isActive}
                            onValueChange={(value) => setFormData({ ...formData, isActive: value })}
                            trackColor={{ false: colors.border, true: colors.primaryLight }}
                            thumbColor={formData.isActive ? colors.primary : colors.textLight}
                        />
                    </View>
                </Card>

                <View style={styles.buttonContainer}>
                    <Button
                        title={mode === 'add' ? 'Add Doctor' : 'Save Changes'}
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
    switchRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: spacing.md,
        borderTopWidth: 1,
        borderTopColor: colors.borderLight,
        marginTop: spacing.md,
    },
    switchLabel: {
        flex: 1,
    },
    labelText: {
        fontSize: fontSizes.md,
        fontWeight: '500',
        color: colors.text,
    },
    helperText: {
        fontSize: fontSizes.sm,
        color: colors.textSecondary,
        marginTop: 2,
    },
    buttonContainer: {
        marginTop: spacing.md,
    },
    cancelBtn: {
        marginTop: spacing.sm,
    },
});

export default DoctorFormScreen;
