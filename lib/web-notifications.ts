import { fcmService, isFirebaseSupported } from './firebase';
import { fcmApi } from './api-client';

let isInitialized = false;
let registrationToken: string | null = null;

/**
 * Initialize Web Push Notifications
 * Tailored from Capacitor-style implementation to pure Web implementation
 */
export async function initializePushNotifications(userId?: string): Promise<void> {
    console.log('🚀 [ZEFAST LOG] initializePushNotifications() called at:', new Date().toISOString());

    // Prevent multiple initializations
    if (isInitialized) {
        console.log('⚠️ [ZEFAST LOG] Push notifications already initialized, skipping...');
        return;
    }

    console.log('🔍 [ZEFAST LOG] Checking platform compatibility...');

    // Check if browser supports push notifications
    if (!isFirebaseSupported()) {
        console.log('❌ [ZEFAST LOG] Push notifications not supported by this browser - exiting');
        return;
    }

    console.log('✅ [ZEFAST LOG] Browser supports Push Notifications - Initializing');

    try {
        // Check current permission status
        console.log('🔐 [ZEFAST LOG] Checking current push notification permissions...');
        const currentPermission = Notification.permission;
        console.log('🔐 [ZEFAST LOG] Current permission status:', currentPermission);

        // If permission not granted, request it
        if (currentPermission === 'default') {
            console.log('📋 [ZEFAST LOG] Requesting notification permissions...');
            const permission = await Notification.requestPermission();
            console.log('📋 [ZEFAST LOG] Permission request result:', permission);

            if (permission !== 'granted') {
                console.warn('🚫 [ZEFAST LOG] Push notification permission not granted by user');
                return;
            }
        } else if (currentPermission === 'denied') {
            console.warn('🚫 [ZEFAST LOG] Push notification permission denied by user. User must enable it in browser settings.');
            return;
        }

        console.log('✅ [ZEFAST LOG] Notification permission granted, setting up listeners...');

        // Web doesn't have "channels" like Android does natively in the same way, 
        // but we simulate the requested behavior for consistency and future Android integration (e.g. via TWA/PWA)
        console.log('✅ [ZEFAST LOG] High priority notification channel "zefast_foreground" configured (conceptually for web)');

        // Register service worker
        console.log('🛠 [ZEFAST LOG] Registering Service Worker...');
        await fcmService.registerServiceWorker();

        // Setup foreground message listener
        console.log('👂 [ZEFAST LOG] Adding push notification event listeners...');
        fcmService.setupForegroundListener(async (payload) => {
            console.log('📨 [ZEFAST LOG] Push notification received while app in foreground:', {
                title: payload.notification?.title,
                body: payload.notification?.body,
                data: payload.data,
                timestamp: new Date().toISOString(),
            });

            // Show browser notification for foreground messages
            // This provides the "native-like" feel in web apps
            if (Notification.permission === 'granted') {
                const title = payload.notification?.title || 'Zefast Notification';
                const options: NotificationOptions = {
                    body: payload.notification?.body || '',
                    icon: '/logo.png', // Fallback to logo
                    badge: '/badge.png', // Ensure this exists or use logo
                    tag: 'zefast_foreground', // Custom tag for grouping/replacing
                    data: payload.data,
                    requireInteraction: true, // Keep it visible until user acts
                };

                // Create the notification
                const notification = new Notification(title, options);

                notification.onclick = (event) => {
                    console.log('👆 [ZEFAST LOG] Push notification action performed:', {
                        notification_title: title,
                        notification_data: payload.data,
                        timestamp: new Date().toISOString(),
                    });
                    window.focus();
                    // Logic for navigation can go here
                };

                console.log('✅ [ZEFAST LOG] Local notification shown for foreground push notification');
            }
        });

        // Get FCM Token
        console.log('📝 [ZEFAST LOG] Getting FCM Registration Token...');
        const token = await fcmService.refreshToken();

        if (token) {
            console.log('🔔 [ZEFAST LOG] Push registration success! Token received:', {
                token_preview: token.substring(0, 30) + '...',
                full_token_length: token.length,
                timestamp: new Date().toISOString(),
            });
            registrationToken = token;

            console.log('📱 [ZEFAST LOG] Platform: web, sending token to backend...');
            await fcmApi.registerToken(token, 'web', userId);
            console.log('✅ [ZEFAST LOG] Token registered successfully on backend');
        } else {
            console.warn('❌ [ZEFAST LOG] Failed to get FCM token');
        }

        isInitialized = true;
        console.log('✅ [ZEFAST LOG] Push notifications initialized successfully!');

    } catch (error) {
        console.error('❌ [ZEFAST LOG] Error initializing push notifications:', error);
    }
}
