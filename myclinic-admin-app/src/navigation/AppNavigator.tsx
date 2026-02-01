import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';
import { LoadingSpinner } from '../components';
import { colors } from '../styles/theme';

// Auth Screens
import LoginScreen from '../screens/auth/LoginScreen';
import DispensarySelectScreen from '../screens/auth/DispensarySelectScreen';

// Dashboard Screen
import DashboardScreen from '../screens/dashboard/DashboardScreen';

// Doctor Screens
import DoctorsListScreen from '../screens/doctors/DoctorsListScreen';
import DoctorFormScreen from '../screens/doctors/DoctorFormScreen';
import FeeFormScreen from '../screens/doctors/FeeFormScreen';

// Time Slot Screens
import TimeSlotsListScreen from '../screens/timeslots/TimeSlotsListScreen';
import TimeSlotFormScreen from '../screens/timeslots/TimeSlotFormScreen';
import AbsentListScreen from '../screens/timeslots/AbsentListScreen';
import AbsentFormScreen from '../screens/timeslots/AbsentFormScreen';

// Booking Screens
import BookingsListScreen from '../screens/bookings/BookingsListScreen';
import BookingDetailScreen from '../screens/bookings/BookingDetailScreen';
import WalkInBookingScreen from '../screens/bookings/WalkInBookingScreen';

// Check-in Screens
import CheckInSessionScreen from '../screens/checkin/CheckInSessionScreen';

// Report Screens
import ReportsMenuScreen from '../screens/reports/ReportsMenuScreen';
import DailyReportScreen from '../screens/reports/DailyReportScreen';
import MonthlyReportScreen from '../screens/reports/MonthlyReportScreen';
import DoctorPerformanceReportScreen from '../screens/reports/DoctorPerformanceReportScreen';

// Types
import { Doctor, TimeSlotConfig, FormattedBooking } from '../types';

export type RootStackParamList = {
    // Auth
    Login: undefined;
    DispensarySelect: undefined;

    // Main
    Dashboard: undefined;

    // Doctors
    DoctorsList: undefined;
    DoctorForm: { mode: 'add' | 'edit'; doctor?: Doctor };
    FeeForm: { doctor: Doctor };

    // Time Slots
    TimeSlotsList: { doctor?: Doctor } | undefined;
    TimeSlotForm: { mode: 'add' | 'edit'; doctor: Doctor; timeSlot?: TimeSlotConfig };
    AbsentList: { doctor: Doctor };
    AbsentForm: { doctor: Doctor };

    // Bookings
    BookingsList: undefined;
    BookingDetail: { booking: FormattedBooking };
    WalkInBooking: undefined;

    // Check-in
    CheckInSession: undefined;

    // Reports
    ReportsMenu: undefined;
    DailyReport: undefined;
    MonthlyReport: undefined;
    DoctorPerformanceReport: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

const AuthStack = () => (
    <Stack.Navigator
        screenOptions={{
            headerShown: false,
        }}
    >
        <Stack.Screen name="Login" component={LoginScreen} />
    </Stack.Navigator>
);

const DispensaryStack = () => (
    <Stack.Navigator
        screenOptions={{
            headerShown: false,
        }}
    >
        <Stack.Screen name="DispensarySelect" component={DispensarySelectScreen} />
    </Stack.Navigator>
);

const MainStack = () => (
    <Stack.Navigator
        screenOptions={{
            headerStyle: {
                backgroundColor: colors.surface,
            },
            headerTintColor: colors.text,
            headerTitleStyle: {
                fontWeight: '600',
            },
        }}
    >
        {/* Dashboard */}
        <Stack.Screen
            name="Dashboard"
            component={DashboardScreen}
            options={{ headerShown: false }}
        />

        {/* Doctors */}
        <Stack.Screen
            name="DoctorsList"
            component={DoctorsListScreen}
            options={{ title: 'Doctors' }}
        />
        <Stack.Screen
            name="DoctorForm"
            component={DoctorFormScreen}
            options={{ title: 'Doctor' }}
        />
        <Stack.Screen
            name="FeeForm"
            component={FeeFormScreen}
            options={{ title: 'Manage Fees' }}
        />

        {/* Time Slots */}
        <Stack.Screen
            name="TimeSlotsList"
            component={TimeSlotsListScreen}
            options={{ title: 'Time Slots' }}
        />
        <Stack.Screen
            name="TimeSlotForm"
            component={TimeSlotFormScreen}
            options={{ title: 'Time Slot' }}
        />
        <Stack.Screen
            name="AbsentList"
            component={AbsentListScreen}
            options={{ title: 'Absences' }}
        />
        <Stack.Screen
            name="AbsentForm"
            component={AbsentFormScreen}
            options={{ title: 'Add Absence' }}
        />

        {/* Bookings */}
        <Stack.Screen
            name="BookingsList"
            component={BookingsListScreen}
            options={{ title: 'Bookings' }}
        />
        <Stack.Screen
            name="BookingDetail"
            component={BookingDetailScreen}
            options={{ title: 'Booking Details' }}
        />
        <Stack.Screen
            name="WalkInBooking"
            component={WalkInBookingScreen}
            options={{ title: 'Walk-in Booking' }}
        />

        {/* Check-in */}
        <Stack.Screen
            name="CheckInSession"
            component={CheckInSessionScreen}
            options={{ title: 'Check-In' }}
        />

        {/* Reports */}
        <Stack.Screen
            name="ReportsMenu"
            component={ReportsMenuScreen}
            options={{ title: 'Reports' }}
        />
        <Stack.Screen
            name="DailyReport"
            component={DailyReportScreen}
            options={{ title: 'Daily Report' }}
        />
        <Stack.Screen
            name="MonthlyReport"
            component={MonthlyReportScreen}
            options={{ title: 'Monthly Summary' }}
        />
        <Stack.Screen
            name="DoctorPerformanceReport"
            component={DoctorPerformanceReportScreen}
            options={{ title: 'Doctor Performance' }}
        />
    </Stack.Navigator>
);

const AppNavigator: React.FC = () => {
    const { isAuthenticated, isLoading, selectedDispensary, dispensaries } = useAuth();

    if (isLoading) {
        return <LoadingSpinner message="Loading..." />;
    }

    return (
        <NavigationContainer>
            {!isAuthenticated ? (
                <AuthStack />
            ) : !selectedDispensary && dispensaries.length > 1 ? (
                <DispensaryStack />
            ) : (
                <MainStack />
            )}
        </NavigationContainer>
    );
};

export default AppNavigator;
