package com.example.codematchfrontend;

import androidx.appcompat.app.AppCompatActivity;
import androidx.recyclerview.widget.DividerItemDecoration;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;

import android.app.Dialog;
import android.content.Intent;
import android.os.Bundle;
import android.text.method.ScrollingMovementMethod;
import android.view.LayoutInflater;
import android.view.View;
import android.view.Window;
import android.widget.Button;
import android.widget.TextView;

import com.google.android.material.floatingactionbutton.FloatingActionButton;

import java.util.LinkedList;

public class NotifyView extends AppCompatActivity implements NotifyViewAdapter.NotificationItemClickListener{

    private RecyclerView newQuestionsView;
    private RecyclerView.LayoutManager layoutManager;
    private NotifyViewAdapter adapter;
    private LinkedList<String> notifications;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_notify_view);

        setTitle("Questions matched for you");

        newQuestionsView = (RecyclerView) findViewById(R.id.notifications_list);

        layoutManager = new LinearLayoutManager(this);
        newQuestionsView.setLayoutManager(layoutManager);

        DividerItemDecoration dividerItemDecoration = new DividerItemDecoration(newQuestionsView.getContext(),
                DividerItemDecoration.VERTICAL);
        newQuestionsView.addItemDecoration(dividerItemDecoration);

        // debug: initialize notifiacations
        notifications = new LinkedList<String>();
        notifications.add("test1");
        notifications.add("test2");
        notifications.add("test2");
        notifications.add("test2");
        notifications.add("test2");
        notifications.add("test2");
        notifications.add("test2");
        notifications.add("test2");
        notifications.add("test2");
        notifications.add("test2");
        notifications.add("test2");
        notifications.add("test2");

        adapter = new NotifyViewAdapter(this, this.notifications);
        newQuestionsView.setAdapter(adapter);

        FloatingActionButton postNewQuestionFAB = (FloatingActionButton) findViewById(R.id.postQuestionFAB);

        postNewQuestionFAB.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View view) {
                goToQuestionView();
            }
        });
    }

    public void switchTabToProfileView(View view ) {
        Intent intent = new Intent (this, ProfileView.class);
        startActivity(intent);
    }


    @Override
    public void onItemClick(View view, int position) {
        System.out.println(position + " clicked\n");

        final int pressed_position = position;

        final Dialog dialog = new Dialog(this);
        dialog.requestWindowFeature(Window.FEATURE_NO_TITLE);
        dialog.setContentView(R.layout.view_question_popup);
        dialog.setCanceledOnTouchOutside(true);

        TextView questionText = (TextView) dialog.findViewById(R.id.question_text);
        questionText.setMovementMethod(new ScrollingMovementMethod());

        Button close = (Button) dialog.findViewById(R.id.close_dialog);

        Button yes = (Button) dialog.findViewById(R.id.alertbox_yes);
        Button no = (Button) dialog.findViewById(R.id.alertbox_no);

        yes.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                removeNotificationAtPosition(pressed_position);
                dialog.cancel();
                //code the functionality when YES button is clicked
            }
        });

        no.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                removeNotificationAtPosition(pressed_position);
                dialog.cancel();
                //code the functionality when NO button is clicked
            }
        });

        close.setOnClickListener(new View.OnClickListener(){

            @Override
            public void onClick(View view) {
                dialog.cancel();
            }
        });
        dialog.show();
    }

    private void removeNotificationAtPosition(int position) {
        this.notifications.remove(position);
        adapter.notifyItemRemoved(position);
    }

    public void goToQuestionView() {
        Intent postQuestionIntent = new Intent(this, PostingView.class);
        startActivity(postQuestionIntent);
    }
}
