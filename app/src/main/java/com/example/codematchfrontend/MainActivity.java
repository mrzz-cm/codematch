package com.example.codematchfrontend;

import androidx.appcompat.app.AppCompatActivity;

import android.content.Intent;
import android.os.Bundle;
import android.view.View;

public class MainActivity extends AppCompatActivity {

    /** Called when the user taps the notificationviewbutton button */
    public void switchTabtoNotifyView(View view) {
        // Do something in response to button
        Intent intent = new Intent(this, NotifyView.class);
        startActivity(intent);
    }
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);
    }
}
