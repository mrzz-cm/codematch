package com.example.codematchfrontend;

import android.content.Context;
import android.content.res.Resources;

import java.io.IOException;

import okhttp3.OkHttpClient;

class GlobalUtils {
    protected static String BASE_URL;
    protected static String OAUTH_CLIENT_SECRET;
    protected static String API_KEY = "";
    protected static String EMAIL = "";
    protected static String FIREBASE_TOKEN = "";
    protected static final OkHttpClient HTTP_CLIENT = new OkHttpClient();

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