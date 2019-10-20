package com.example.codematchfrontend;

import androidx.appcompat.app.AppCompatActivity;

import android.app.Activity;
import android.content.Context;
import android.content.Intent;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.net.Uri;
import android.os.Bundle;
import android.view.View;
import android.widget.Button;
import android.widget.EditText;

import java.io.FileNotFoundException;
import java.io.InputStream;

public class PostingView extends AppCompatActivity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_posting_view);

        setTitle("Post a new question");
//        getSupportActionBar().setDisplayHomeAsUpEnabled(true);

        Button postButton = (Button) findViewById(R.id.postQuestionButton);
        postButton.setOnClickListener(new View.OnClickListener(){
            @Override
            public void onClick(View view) {
                postQuestion();
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
                Uri image = data.getData();
                InputStream imageStream = null;
                try{
                    imageStream = getContentResolver().openInputStream(image);
                } catch (FileNotFoundException e) {
                    e.printStackTrace();
                }

                System.out.println("detected image");
                Bitmap bitmapedimage = BitmapFactory.decodeStream(imageStream);

            }
        }
    }

    private void postQuestion() {
        // get the question data
        String question = ((EditText) findViewById(R.id.questionText)).getText().toString();
        String courseIDs = ((EditText) findViewById(R.id.coursesInput)).getText().toString();

    }
}
