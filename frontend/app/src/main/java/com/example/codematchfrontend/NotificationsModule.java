package com.example.codematchfrontend;

import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;

import com.google.firebase.messaging.FirebaseMessagingService;
import com.google.firebase.messaging.RemoteMessage;

import androidx.core.app.NotificationCompat;
import androidx.core.app.NotificationManagerCompat;

public class NotificationsModule extends FirebaseMessagingService {
    private String CHANNEL_ID = "1";

    @Override
    public void onMessageReceived(RemoteMessage remoteMessage) {
        // TODO: Handle FCM messages here.
        // If the application is in the foreground handle both data and notification messages here.
        // Also if you intend on generating your own notifications as a result of a received FCM
        // message, here is where that should be initiated.
        System.out.println("RECEIVED NOTIFICATION");
        System.out.println("notifications" + "From: " + remoteMessage.getFrom());
        System.out.println("notifications" + "Notification Message Body: " + remoteMessage.getNotification().getBody());

        System.out.println("remote message: " + remoteMessage);

        String titleString = remoteMessage.getNotification().getTitle();

        String bodyString = remoteMessage.getNotification().getBody();

        String notificationType = bodyString.split("\\s")[0];

        System.out.println("notification type: " + notificationType);

        if ("basic".equals(notificationType)) {
            newNotification(getApplicationContext(), titleString, "");
        } else if ("helperMatch".equals(notificationType)) {
            newHelperMatchNotification(getApplicationContext(), titleString, "", bodyString);
        } else if ("".equals(notificationType)) {
            newRatingNotification(getApplicationContext(), titleString, "", "");
        }
    }

    @Override
    public void onNewToken(String token) {
        // If you want to send messages to this application instance or
        // manage this apps subscriptions on the server side, send the
        // Instance ID token to your app server.
        System.out.println("firebase token " + token);
        GlobalUtils.FIREBASE_TOKEN = token;
    }

    public void newNotification(Context ctx, String textTitle, String textContent) {
        Intent intent = new Intent(ctx, NotifyView.class);
        intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TASK);
        PendingIntent pendingIntent = PendingIntent.getActivity(ctx, 0, intent, 0);


        NotificationCompat.Builder builder = new NotificationCompat.Builder(this, CHANNEL_ID)
                .setSmallIcon(R.drawable.ic_notification_icon)
                .setContentTitle(textTitle)
                .setContentText(textContent)
                .setStyle(new NotificationCompat.BigTextStyle()
                        .bigText(textContent))
                .setPriority(NotificationCompat.PRIORITY_DEFAULT)
                .setContentIntent(pendingIntent)
                .setAutoCancel(true);
        int notificationId = GlobalUtils.createID();

        NotificationManagerCompat notificationManager = NotificationManagerCompat.from(ctx);
        notificationManager.notify(notificationId, builder.build());
    }

    public void newMatchFoundNotification(Context ctx, String textTitle, String textContent) {
        Intent intent = new Intent(ctx, NotifyView.class);
        intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TASK);
        PendingIntent pendingIntent = PendingIntent.getActivity(ctx, 0, intent, 0);


        NotificationCompat.Builder builder = new NotificationCompat.Builder(this, CHANNEL_ID)
                .setSmallIcon(R.drawable.ic_notification_icon)
                .setContentTitle(textTitle)
                .setContentText(textContent)
                .setStyle(new NotificationCompat.BigTextStyle()
                        .bigText(textContent))
                .setPriority(NotificationCompat.PRIORITY_DEFAULT)
                .setContentIntent(pendingIntent)
                .setAutoCancel(true);
        int notificationId = GlobalUtils.createID();

        NotificationManagerCompat notificationManager = NotificationManagerCompat.from(ctx);
        notificationManager.notify(notificationId, builder.build());
    }

    public void newHelperMatchNotification(Context ctx, String textTitle, String textContent, String data) {
        Intent intent = new Intent(ctx, NotifyView.class);
        intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TASK);
        PendingIntent pendingIntent = PendingIntent.getActivity(ctx, 0, intent, 0);

        NotificationCompat.Builder builder = new NotificationCompat.Builder(this, CHANNEL_ID)
                .setSmallIcon(R.drawable.ic_notification_icon)
                .setContentTitle(textTitle)
                .setContentText(textContent)
                .setStyle(new NotificationCompat.BigTextStyle()
                        .bigText(textContent))
                .setPriority(NotificationCompat.PRIORITY_DEFAULT)
                .setContentIntent(pendingIntent)
                .setAutoCancel(true);
        int notificationId = GlobalUtils.createID();

        NotificationManagerCompat notificationManager = NotificationManagerCompat.from(ctx);
        notificationManager.notify(notificationId, builder.build());
    }

    public void newRatingNotification(Context ctx, String textTitle, String textContent, String data) {
        Intent intent = new Intent(ctx, RatingView.class);
        intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TASK);
        PendingIntent pendingIntent = PendingIntent.getActivity(ctx, 0, intent, 0);

        NotificationCompat.Builder builder = new NotificationCompat.Builder(this, CHANNEL_ID)
                .setSmallIcon(R.drawable.ic_notification_icon)
                .setContentTitle(textTitle)
                .setContentText(textContent)
                .setStyle(new NotificationCompat.BigTextStyle()
                        .bigText(textContent))
                .setPriority(NotificationCompat.PRIORITY_DEFAULT)
                .setContentIntent(pendingIntent)
                .setAutoCancel(true);
        int notificationId = GlobalUtils.createID();

        NotificationManagerCompat notificationManager = NotificationManagerCompat.from(ctx);
        notificationManager.notify(notificationId, builder.build());
    }


}
