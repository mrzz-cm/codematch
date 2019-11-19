package com.example.codematchfrontend;

import java.io.IOException;

import okhttp3.OkHttpClient;


public class GlobalUtils {
    static Helper getBASEID = new Helper();
    public static String BASE_URL;

    static {
        try {
            BASE_URL = getBASEID.getPropValues();
        } catch (IOException e) {
            e.printStackTrace();
        }
    }

    public static String API_KEY = "";
    public static String EMAIL = "";
    public static String FIREBASE_TOKEN = "";
    public static OkHttpClient HTTP_CLIENT = new OkHttpClient();
    public static int createID() {
        int id = (int)System.currentTimeMillis();
        return id;
    }
}