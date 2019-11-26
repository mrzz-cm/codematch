package com.example.codematchfrontend;

import androidx.appcompat.app.AppCompatActivity;

import android.os.Bundle;
import android.view.View;
import android.widget.Button;
import android.widget.Toast;

import com.google.android.material.textfield.TextInputLayout;

import org.jetbrains.annotations.NotNull;
import org.json.JSONException;
import org.json.JSONObject;

import java.io.IOException;

import okhttp3.Call;
import okhttp3.Callback;
import okhttp3.MediaType;
import okhttp3.Request;
import okhttp3.RequestBody;
import okhttp3.Response;

public class RatingView extends AppCompatActivity {
    private TextInputLayout textInputRating;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_rating_view);
        textInputRating = findViewById(R.id.rating_input);

        Button confirmRating = findViewById(R.id.confirm_rating);

        confirmRating.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View view) {
                submitRating();
            }
        });
    }


    private boolean validateRating() {
        String ratingInput = textInputRating.getEditText().getText().toString().trim();
        if (ratingInput.isEmpty()) {
            textInputRating.setError("Field Can't be Empty!");
            return false;


        } else if (ratingInput.length() > 1) {
            textInputRating.setError("Too Many characters!");
            return false;
        } else {
            textInputRating.setError(null);
            return true;
        }

    }

    public void confirmInput(View view) {
        if (!validateRating()) {
            return;
        }
        String input = "Thank you for rating : " + textInputRating.getEditText().getText().toString();
        Toast.makeText(this, input, Toast.LENGTH_SHORT).show();

    }

    private void submitRating() {
        // get the question data
        String ratingInput = textInputRating.getEditText().getText().toString().trim();

        JSONObject jsonObject = new JSONObject();
        try {
            jsonObject.put("rating", ratingInput);
        } catch (JSONException e) {
            e.printStackTrace();
        }

        MediaType JSON = MediaType.parse("application/json; charset=utf-8");
        RequestBody body = RequestBody.create(jsonObject.toString(), JSON);

        Request send_rating_request = new Request.Builder()
                .url(GlobalUtils.BASE_URL + "/questions/close/" + GlobalUtils.EMAIL)
                .addHeader("Authorization", "Bearer " + GlobalUtils.API_KEY)
                .post(body)
                .build();

        GlobalUtils.HTTP_CLIENT.newCall(send_rating_request).enqueue(new Callback() {
            @Override
            public void onFailure(@NotNull Call call, @NotNull IOException e) {
                System.out.println("Error: " + e.toString());
            }

            @Override
            public void onResponse(@NotNull Call call, @NotNull Response response) {
                System.out.println("Question create request returned code " + response.code());
            }
        });
    }

}
