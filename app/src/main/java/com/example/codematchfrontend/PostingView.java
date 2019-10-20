package com.example.codematchfrontend;

import androidx.appcompat.app.AppCompatActivity;

import android.os.Bundle;
import android.view.View;
import android.widget.Button;
import android.widget.EditText;

public class PostingView extends AppCompatActivity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_posting_view);

        getSupportActionBar().setDisplayHomeAsUpEnabled(true);

        Button postButton = (Button) findViewById(R.id.postQuestionButton);
        postButton.setOnClickListener(new View.OnClickListener(){
            @Override
            public void onClick(View view) {
                postQuestion();
            }
        });
    }

    private void postQuestion() {
        // get the question data
        String question = ((EditText) findViewById(R.id.questionText)).getText().toString();
        String courseIDs = ((EditText) findViewById(R.id.coursesInput)).getText().toString();


        
    }
}
