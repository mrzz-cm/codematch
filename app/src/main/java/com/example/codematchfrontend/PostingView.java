package com.example.codematchfrontend;

import androidx.appcompat.app.AppCompatActivity;
import androidx.appcompat.widget.Toolbar;
import okhttp3.Call;
import okhttp3.Callback;
import okhttp3.MediaType;
import okhttp3.Request;
import okhttp3.RequestBody;
import okhttp3.Response;

import android.app.Activity;
//import android.content.Context;
import android.content.Intent;
import android.os.Bundle;
import android.view.Menu;
import android.view.MenuInflater;
import android.view.MenuItem;
import android.view.View;
import android.widget.Button;
import android.widget.EditText;
import android.widget.Toast;

import org.jetbrains.annotations.NotNull;
import org.json.JSONException;
import org.json.JSONObject;

import java.io.IOException;

public class PostingView extends AppCompatActivity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_posting_view);

        setTitle("Post a new question");
        Toolbar toolbar = findViewById(R.id.toolbar);
        setSupportActionBar(toolbar);

        getSupportActionBar().setDisplayHomeAsUpEnabled(true);

        Button postButton = (Button) findViewById(R.id.postQuestionButton);
        postButton.setOnClickListener(new View.OnClickListener(){
            @Override
            public void onClick(View view) {
                postQuestion();
                ((EditText) findViewById(R.id.questionText)).getText().clear();
                ((EditText) findViewById(R.id.coursesInput)).getText().clear();
                ((EditText) findViewById(R.id.questionTitleText)).getText().clear();
            }
        });

        Button uploadImageButton = (Button) findViewById(R.id.attachImageButton);
        uploadImageButton.setOnClickListener(new View.OnClickListener(){

            @Override
            public void onClick(View view) {
                pickImage();
            }
        });
    }

    private void pickImage() {
        Intent intent = new Intent(Intent.ACTION_GET_CONTENT);
        intent.setType("image/*");
        startActivityForResult(intent, 0);
    }

    @Override
    public void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);

        if (requestCode == 0 && resultCode == Activity.RESULT_OK) {
            if (data == null) {
                return;
            } else {
//                Uri image = data.getData();
//                InputStream imageStream = null;
//                try{
//                    imageStream = getContentResolver().openInputStream(image);
//                } catch (FileNotFoundException e) {
//                    e.printStackTrace();
//                }

                System.out.println("detected image");
//                Bitmap bitmapedimage = BitmapFactory.decodeStream(imageStream);

            }
        }
    }

    private void postQuestion() {
        // get the question data
        String question = ((EditText) findViewById(R.id.questionText)).getText().toString();
        String courseIDs = ((EditText) findViewById(R.id.coursesInput)).getText().toString();
        String questionTitle = ((EditText) findViewById(R.id.questionTitleText)).getText().toString();

        JSONObject jsonObject = new JSONObject();
        try {
            jsonObject.put("userId", GlobalUtils.EMAIL);
            jsonObject.put("title", questionTitle);
            jsonObject.put("courseCode", courseIDs);
            jsonObject.put("questionText", question);
        } catch (JSONException e) {
            e.printStackTrace();
        }

        MediaType JSON = MediaType.parse("application/json; charset=utf-8");
        RequestBody body = RequestBody.create(jsonObject.toString(), JSON);

        Request notify_questions_create_request = new Request.Builder()
                .url(GlobalUtils.BASE_URL + "/questions/create")
                .addHeader("Authorization", "Bearer " + GlobalUtils.API_KEY)
                .post(body)
                .build();

        GlobalUtils.HTTP_CLIENT.newCall(notify_questions_create_request).enqueue(new Callback() {
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
    @Override
    public boolean onCreateOptionsMenu(Menu menu) {
        MenuInflater inflater = getMenuInflater();
        inflater.inflate(R.menu.toolbar_menu, menu);
        return true;
    }
    public void switchTabToNotifyView() {
        // Do something in response to button
        Intent intent = new Intent(this, NotifyView.class);
        intent.setFlags(Intent.FLAG_ACTIVITY_REORDER_TO_FRONT);
        startActivity(intent);
    }
    public void switchTabToPostingView() {
        // Do something in response to button
        Intent intent = new Intent(this, PostingView.class);
        intent.setFlags(Intent.FLAG_ACTIVITY_REORDER_TO_FRONT);
        startActivity(intent);
    }
    public void switchTabToProfileView() {
        Intent intent = new Intent (this, ProfileView.class);
        intent.setFlags(Intent.FLAG_ACTIVITY_REORDER_TO_FRONT);
        startActivity(intent);
    }
    @Override
    public boolean onOptionsItemSelected(MenuItem item) {
        switch(item.getItemId()) {
            case R.id.postingViewButton:
                Toast.makeText(this, "Posting View selected!!", Toast.LENGTH_SHORT).show();
                switchTabToPostingView();
                break;
            case R.id.notifyViewButton:
                Toast.makeText(this, "Notification View selected!!", Toast.LENGTH_SHORT).show();
                switchTabToNotifyView();
                break;
            case R.id.profileViewButton:
                Toast.makeText(this, "Profile View selected!!", Toast.LENGTH_SHORT).show();
                switchTabToProfileView();
                break;
            default: return super.onOptionsItemSelected(item);
        }
        return true;
    }

}
