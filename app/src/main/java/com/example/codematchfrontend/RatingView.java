package com.example.codematchfrontend;

import androidx.appcompat.app.AppCompatActivity;

import android.os.Bundle;
import android.view.View;
import android.widget.EditText;
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

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_rating_view);
        textInputRating = findViewById(R.id.rating_input);
    }
    private TextInputLayout textInputRating;


    private boolean validateRating() {
        String ratingInput = textInputRating.getEditText().getText().toString().trim();
        if (ratingInput.isEmpty()) {
            textInputRating.setError("Field Can't be Empty!");
            return false;

        } else {
            textInputRating.setError(null);
            return true;
        }

    }

    public void confirmInput(View view) {
        if(!validateRating()) {
            return;
        }
        String input = "rating:" +textInputRating.getEditText().getText().toString();
        Toast.makeText(this,input,Toast.LENGTH_SHORT).show();


    }
    private void submitRating() {
        // get the question data
        String ratingInput = textInputRating.getEditText().getText().toString().trim();

        JSONObject jsonObject = new JSONObject();
        try {
            jsonObject.put("userId", Global.EMAIL);
            jsonObject.put("rating", ratingInput);
        } catch (JSONException e) {
            e.printStackTrace();
        }

        MediaType JSON = MediaType.parse("application/json; charset=utf-8");
        RequestBody body = RequestBody.create(jsonObject.toString(), JSON);

        Request notify_questions_create_request = new Request.Builder()
                .url(Global.BASE_URL + "/questions/create")
                .addHeader("Authorization", "Bearer " + Global.API_KEY)
                .post(body)
                .build();

        Global.HTTP_CLIENT.newCall(notify_questions_create_request).enqueue(new Callback() {
            @Override
            public void onFailure(@NotNull Call call, @NotNull IOException e) {
                System.out.println("Error: "+ e.toString());
            }

            @Override
            public void onResponse(@NotNull Call call, @NotNull Response response) throws IOException {
                System.out.println("Question create request returned code " + response.code());
            }
        });
    }


}
