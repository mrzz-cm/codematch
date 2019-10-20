package com.example.codematchfrontend;

import androidx.appcompat.app.AppCompatActivity;
import androidx.recyclerview.widget.DividerItemDecoration;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;

import android.os.Bundle;
import android.view.View;
import android.widget.TextView;

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
    }


    @Override
    public void onItemClick(View view, int position) {
        System.out.println(position + " clicked\n");
    }
}
