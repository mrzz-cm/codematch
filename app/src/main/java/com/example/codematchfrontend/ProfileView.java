package com.example.codematchfrontend;

import androidx.appcompat.app.ActionBar;
import androidx.appcompat.app.AppCompatActivity;
import androidx.appcompat.widget.Toolbar;
import androidx.recyclerview.widget.DividerItemDecoration;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;

import android.app.Dialog;
import android.content.Intent;
import android.os.Bundle;
import android.text.method.ScrollingMovementMethod;
import android.view.View;
import android.view.Window;
import android.widget.Button;
import android.widget.EditText;
import android.widget.TextView;

import com.google.android.material.floatingactionbutton.FloatingActionButton;

import java.util.LinkedList;

public class ProfileView extends AppCompatActivity implements CoursesListAdapter.CoursesListClickListener{

    private LinkedList<String> courses;
    private RecyclerView coursesView;
    private RecyclerView.LayoutManager layoutManager;
    private CoursesListAdapter adapter;


    /** Called when the user taps the notificationviewbutton button */
    public void switchTabtoNotifyView(View view) {
        // Do something in response to button
        Intent intent = new Intent(this, NotifyView.class);
        startActivity(intent);
    }
    public void switchTabtoPostingView(View view) {
        // Do something in response to button
        Intent intent = new Intent(this, PostingView.class);
        startActivity(intent);
    }
    public void switchTabToProfileView(View view ) {
        Intent intent = new Intent (this, ProfileView.class);
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
}
