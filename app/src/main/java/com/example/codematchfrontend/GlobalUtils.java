package com.example.codematchfrontend;

import android.content.Context;
import android.content.res.Resources;

import java.io.IOException;

import okhttp3.OkHttpClient;

class GlobalUtils {
    private static final String TAG = GlobalUtils.class.getSimpleName();
    static String BASE_URL;
    static String OAUTH_CLIENT_SECRET;
    static String API_KEY = "";
    static String EMAIL = "";
    static String FIREBASE_TOKEN = "";
    static final OkHttpClient HTTP_CLIENT = new OkHttpClient();

    /**
     * Initialize each configuration global variable by reading from the configuration file
     *
     * @param context Application context
     * @throws Resources.NotFoundException Unable to find the config file
     * @throws IOException                 Failed reading configuration file
     */
    protected static void initializeFromConfig(Context context)
            throws Resources.NotFoundException, IOException {
        BASE_URL = Helper.getConfigValue(context, "baseUrl");
        OAUTH_CLIENT_SECRET = Helper.getConfigValue(context, "oauthClientSecret");
    }

    protected static int createID() {
        return (int) System.currentTimeMillis();
    }
}