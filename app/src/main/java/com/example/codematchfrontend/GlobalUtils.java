package com.example.codematchfrontend;

import android.content.Context;
import android.content.res.Resources;

import java.io.IOException;

import okhttp3.OkHttpClient;

class GlobalUtils {
    private static final String TAG = GlobalUtils.class.getSimpleName();
    static String BASE_URL;
    static String API_KEY = "";
    static String EMAIL = "";
    static String FIREBASE_TOKEN = "";
    static final OkHttpClient HTTP_CLIENT = new OkHttpClient();

    /**
     * Initialize each configuration global variable by reading from the configuration file
     * @param context Application context
     * @throws Resources.NotFoundException Unable to find the config file
     * @throws IOException Failed reading configuration file
     */
    static void initializeFromConfig(Context context)
            throws Resources.NotFoundException, IOException {
        BASE_URL = Helper.getConfigValue(context, "baseUrl");
    }

    static int createID() {
        int id = (int)System.currentTimeMillis();
        return id;
    }
}