package com.example.codematchfrontend;

import okhttp3.OkHttpClient;

//import java.text.SimpleDateFormat;
import java.util.Date;
//import java.util.Locale;

public class Global {
    public static String BASE_URL = "https://cm.johnramsden.ca/";
    public static String API_KEY = "";
    public static String EMAIL = "";
    public static String FIREBASE_TOKEN = "";
    public static OkHttpClient HTTP_CLIENT = new OkHttpClient();
    public static int createID() {
        Date now = new Date();
        int id = (int)System.currentTimeMillis();
        return id;
    }
}