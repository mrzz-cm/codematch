package com.example.codematchfrontend;

import androidx.appcompat.app.ActionBar;
import androidx.appcompat.app.AppCompatActivity;
import androidx.appcompat.widget.Toolbar;
import androidx.core.app.NotificationCompat;
import androidx.core.app.NotificationManagerCompat;
import androidx.recyclerview.widget.DividerItemDecoration;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;

import android.app.Dialog;
import android.app.PendingIntent;
import android.content.Intent;
import android.os.Bundle;
import android.text.method.ScrollingMovementMethod;
import android.view.Menu;
import android.view.MenuInflater;
import android.view.MenuItem;
import android.view.View;
import android.view.Window;
import android.widget.Button;
import android.widget.EditText;
import android.widget.TextView;
import android.widget.Toast;

import com.google.android.material.floatingactionbutton.FloatingActionButton;

import java.util.LinkedList;

import static com.example.codematchfrontend.Global.createID;

public class ProfileView extends AppCompatActivity implements CoursesListAdapter.CoursesListClickListener{

    private LinkedList<String> courses;
    private RecyclerView coursesView;
    private RecyclerView.LayoutManager layoutManager;
    private CoursesListAdapter adapter;


    /** Called when the user taps the notificationviewbutton button */
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
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_profile_view);

        Toolbar toolbar = findViewById(R.id.toolbar);
        setSupportActionBar(toolbar);


        coursesView = (RecyclerView) findViewById(R.id.courseList);

        layoutManager = new LinearLayoutManager(this);
        coursesView.setLayoutManager(layoutManager);

        DividerItemDecoration dividerItemDecoration = new DividerItemDecoration(coursesView.getContext(),
                DividerItemDecoration.VERTICAL);
        coursesView.addItemDecoration(dividerItemDecoration);

        // debug: initialize courses
        courses = new LinkedList<String>();
        courses.add("test1");
        courses.add("test2");
        courses.add("test2");
        courses.add("test2");
        courses.add("test2");
        courses.add("test2");

        adapter = new CoursesListAdapter(this, this.courses);
        coursesView.setAdapter(adapter);

        Button addCourseButton = findViewById(R.id.addcoursebutton);
        final EditText course_input_text = findViewById(R.id.addCourseText);
        addCourseButton.setOnClickListener(new View.OnClickListener(){
            @Override
            public void onClick(View view) {
                addcourse(course_input_text.getText().toString());
                course_input_text.getText().clear();
            }
        });
    }

    @Override
    public void onItemClick(View view, int position) {
        System.out.println("clicked at " + position);
        final int pressed_position = position;

        final Dialog dialog = new Dialog(this);
        dialog.requestWindowFeature(Window.FEATURE_NO_TITLE);
        dialog.setContentView(R.layout.course_delete_popup);
        dialog.setCanceledOnTouchOutside(true);

        Button yes = (Button) dialog.findViewById(R.id.delete_course_yes);
        Button no = (Button) dialog.findViewById(R.id.delete_course_no);

        yes.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                removeCourseAtPosition(pressed_position);
                dialog.cancel();
            }
        });

        no.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                dialog.cancel();
            }
        });

        dialog.show();
    }

    private void removeCourseAtPosition(int position) {
        this.courses.remove(position);
        adapter.notifyItemRemoved(position);
    }

    private void addcourse(String course) {

    }
    @Override
    public boolean onCreateOptionsMenu(Menu menu) {
        MenuInflater inflater = getMenuInflater();
        inflater.inflate(R.menu.toolbar_menu, menu);
        return true;
    }

    @Override
     public boolean onOptionsItemSelected(MenuItem item) {
        switch(item.getItemId()) {
            case R.id.postingViewButton:
                Toast.makeText(this, "Posting View selected!!", Toast.LENGTH_SHORT).show();
                switchTabToPostingView();
                return true;
            case R.id.notifyViewButton:
                Toast.makeText(this, "Notification View selected!!", Toast.LENGTH_SHORT).show();
                switchTabToNotifyView();

                return true;
            case R.id.profileViewButton:
                Toast.makeText(this, "Profile View selected!!", Toast.LENGTH_SHORT).show();
                switchTabToProfileView();
            default: return super.onOptionsItemSelected(item);
        }
    }

    public void deleteProfile() {
        /* This method is to enable the user to delete their profile from codematch and all associated data

         */
    }


    String CHANNEL_ID = "1";



// move to NotificationsModule
    public void newNotification (String textTitle, String textContent) {
        //Activity FLAG_ACTIVITY_NEW_TASK = NotifyView;
        Intent intent = new Intent(this.getApplicationContext(), NotifyView.class);
        intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TASK);
        PendingIntent pendingIntent = PendingIntent.getActivity(this, 0, intent, 0);


        NotificationCompat.Builder builder = new NotificationCompat.Builder(this, CHANNEL_ID)
                .setSmallIcon(R.drawable.ic_notification_icon)
                .setContentTitle(textTitle)
                .setContentText(textContent)
                .setStyle(new NotificationCompat.BigTextStyle()
                        .bigText(textContent))
                .setPriority(NotificationCompat.PRIORITY_DEFAULT)
                .setContentIntent(pendingIntent)
                .setAutoCancel(true);
        int notificationId = createID();
        //startActivity(intent);

        NotificationManagerCompat notificationManager = NotificationManagerCompat.from(this);
        notificationManager.notify(notificationId, builder.build());



    }
    public void pushNotificationTest (View view) {
        newNotification("Test", "Wow, this is a test of the fact That it's a long ass 'string!!!");
    }

    }
