package com.example.codematchfrontend;

import android.util.Log;

import com.google.firebase.messaging.FirebaseMessagingService;
import com.google.firebase.messaging.RemoteMessage;

public class NotificationsModule extends FirebaseMessagingService {
    @Override
    public void onMessageReceived(RemoteMessage remoteMessage) {
        // TODO: Handle FCM messages here.
        // If the application is in the foreground handle both data and notification messages here.
        // Also if you intend on generating your own notifications as a result of a received FCM
        // message, here is where that should be initiated.
        Log.d("notifications", "From: " + remoteMessage.getFrom());
        Log.d("notifications", "Notification Message Body: " + remoteMessage.getNotification().getBody());

    }

    @Override
    public void onNewToken(String token) {
        Log.d("notifications", "Refreshed token: " + token);

        // If you want to send messages to this application instance or
        // manage this apps subscriptions on the server side, send the
        // Instance ID token to your app server.
        System.out.println("firebase token " + token);
    }
}
