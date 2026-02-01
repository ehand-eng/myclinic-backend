import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, Dispensary } from '../types';
import { authService, dispensaryService } from '../api/services';

interface AuthContextType {
    user: User | null;
    dispensaries: Dispensary[];
    selectedDispensary: Dispensary | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (email: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
    selectDispensary: (dispensary: Dispensary) => void;
    refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [dispensaries, setDispensaries] = useState<Dispensary[]>([]);
    const [selectedDispensary, setSelectedDispensary] = useState<Dispensary | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Check for existing auth on mount
    useEffect(() => {
        checkAuth();
    }, []);

    const checkAuth = async () => {
        try {
            const token = await AsyncStorage.getItem('authToken');
            const userData = await AsyncStorage.getItem('userData');

            if (token && userData) {
                const parsedUser = JSON.parse(userData) as User;
                setUser(parsedUser);

                // Load dispensaries
                if (parsedUser.dispensaryIds && parsedUser.dispensaryIds.length > 0) {
                    const dispensaryList = await dispensaryService.getByIds(parsedUser.dispensaryIds);
                    setDispensaries(dispensaryList);

                    // Auto-select if only one dispensary
                    if (dispensaryList.length === 1) {
                        setSelectedDispensary(dispensaryList[0]);
                    } else {
                        // Check for saved selection
                        const savedDispensaryId = await AsyncStorage.getItem('selectedDispensaryId');
                        if (savedDispensaryId) {
                            const savedDispensary = dispensaryList.find((d) => d._id === savedDispensaryId);
                            if (savedDispensary) {
                                setSelectedDispensary(savedDispensary);
                            }
                        }
                    }
                }
            }
        } catch (error) {
            console.error('Auth check error:', error);
            await logout();
        } finally {
            setIsLoading(false);
        }
    };

    const login = async (email: string, password: string) => {
        setIsLoading(true);
        try {
            const response = await authService.login(email, password);

            // Store auth data
            await AsyncStorage.setItem('authToken', response.token);
            await AsyncStorage.setItem('userData', JSON.stringify(response.user));
            await AsyncStorage.setItem('userRole', response.user.role);

            setUser(response.user);

            // Load dispensaries
            if (response.user.dispensaryIds && response.user.dispensaryIds.length > 0) {
                const dispensaryList = await dispensaryService.getByIds(response.user.dispensaryIds);
                setDispensaries(dispensaryList);

                if (dispensaryList.length === 1) {
                    setSelectedDispensary(dispensaryList[0]);
                    await AsyncStorage.setItem('selectedDispensaryId', dispensaryList[0]._id);
                }
            }
        } catch (error) {
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    const logout = async () => {
        try {
            await AsyncStorage.multiRemove([
                'authToken',
                'userData',
                'userRole',
                'selectedDispensaryId',
            ]);
            setUser(null);
            setDispensaries([]);
            setSelectedDispensary(null);
        } catch (error) {
            console.error('Logout error:', error);
        }
    };

    const selectDispensary = async (dispensary: Dispensary) => {
        setSelectedDispensary(dispensary);
        await AsyncStorage.setItem('selectedDispensaryId', dispensary._id);
    };

    const refreshUser = async () => {
        try {
            const userData = await authService.getMe();
            setUser(userData);
            await AsyncStorage.setItem('userData', JSON.stringify(userData));
        } catch (error) {
            console.error('Error refreshing user:', error);
        }
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                dispensaries,
                selectedDispensary,
                isAuthenticated: !!user,
                isLoading,
                login,
                logout,
                selectDispensary,
                refreshUser,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export default AuthContext;
