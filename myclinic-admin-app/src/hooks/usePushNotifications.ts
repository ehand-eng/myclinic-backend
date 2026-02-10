import { useState, useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import axios from 'axios';
import { API_BASE_URL, API_ENDPOINTS } from '../api/config';
import { useAuth } from '../context/AuthContext';

// Set notification handler for when app is in foreground
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
    }),
});

interface PushNotificationState {
    expoPushToken?: string;
    notification?: Notifications.Notification;
}

export const usePushNotifications = () => {
    const [expoPushToken, setExpoPushToken] = useState<string | undefined>();
    const [notification, setNotification] = useState<Notifications.Notification | undefined>();
    const notificationListener = useRef<any>();
    const responseListener = useRef<any>();
    const { user } = useAuth(); // To link token to user

    useEffect(() => {
        registerForPushNotificationsAsync().then((token) => {
            setExpoPushToken(token);
            if (token && user) {
                saveTokenToBackend(token, user.id);
            }
        });

        // Listen for incoming notifications (foreground)
        notificationListener.current = Notifications.addNotificationReceivedListener((notification) => {
            setNotification(notification);
        });

        // Listen for user tapping on notification
        responseListener.current = Notifications.addNotificationResponseReceivedListener((response) => {
            console.log('User tapped notification:', response);
            // You can navigate here if needed
        });

        return () => {
            if (notificationListener.current) {
                Notifications.removeNotificationSubscription(notificationListener.current);
            }
            if (responseListener.current) {
                Notifications.removeNotificationSubscription(responseListener.current);
            }
        };
    }, [user]);

    const saveTokenToBackend = async (token: string, userId: string) => {
        try {
            await axios.post(`${API_BASE_URL}${API_ENDPOINTS.FCM_TOKEN}`, {
                token: token,
                userId: userId,
                platform: Platform.OS,
            });
            console.log('FCM Token saved to backend');
        } catch (error) {
            console.error('Error saving FCM token:', error);
        }
    };

    const subscribeToTopic = async (topic: string) => {
        if (!expoPushToken) return;
        try {
            await axios.post(`${API_BASE_URL}${API_ENDPOINTS.FCM_SUBSCRIBE}`, {
                token: expoPushToken,
                topic: topic,
            });
            console.log(`Subscribed to ${topic}`);
        } catch (error) {
            console.error('Error subscribing to topic:', error);
        }
    };

    const unsubscribeFromTopic = async (topic: string) => {
        if (!expoPushToken) return;
        try {
            await axios.post(`${API_BASE_URL}${API_ENDPOINTS.FCM_UNSUBSCRIBE}`, {
                token: expoPushToken,
                topic: topic,
            });
            console.log(`Unsubscribed from ${topic}`);
        } catch (error) {
            console.error('Error unsubscribing from topic:', error);
        }
    };

    return {
        expoPushToken,
        notification,
        subscribeToTopic,
        unsubscribeFromTopic
    };
};

async function registerForPushNotificationsAsync() {
    let token;

    if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('queue_updates', {
            name: 'Queue Updates',
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#FF231F7C',
        });
    }

    if (Device.isDevice) {
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;

        if (existingStatus !== 'granted') {
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
        }

        if (finalStatus !== 'granted') {
            console.log('Failed to get push token for push notification!');
            return;
        }

        // Get the token - specifically looking for FCM if configured in app.json, 
        // otherwise getting Expo's standard token which works with their service.
        // Since backend uses firebase-admin, passing the device token (FCM) is preferred if using direct FCM.
        // However, if using Expo Push API, use getExpoPushTokenAsync().
        // The user wants FCM directly -> let's get DevicePushToken (FCM token)
        // BUT Expo Go only supports ExpoPushToken.
        // Development Builds support DevicePushToken.
        // We will try getDevicePushTokenAsync() first, assuming standalone/dev client.
        try {
            // This returns the native FCM token
            const tokenData = await Notifications.getDevicePushTokenAsync();
            token = tokenData.data;
            console.log("Device Push Token (FCM):", token);
        } catch (e) {
            console.log("Error getting device token (maybe in Expo Go?), trying Expo token:", e);
            // Fallback for testing in Expo Go (won't work with direct FCM backend unless through Expo service)
            // But since backend uses admin.messaging().send() directly to FCM, we need the NATIVE FCM token.
            // Expo Go cannot give a native FCM token that works with your own Firebase project easily.
            // So this guide assumes Development Build / APK.
        }
    } else {
        console.log('Must use physical device for Push Notifications');
    }

    return token;
}
