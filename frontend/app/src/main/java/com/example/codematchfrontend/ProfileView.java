package com.example.codematchfrontend;

import androidx.appcompat.app.AppCompatActivity;
import androidx.appcompat.widget.Toolbar;
import androidx.recyclerview.widget.DividerItemDecoration;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;

import okhttp3.Call;
import okhttp3.Callback;
import okhttp3.MediaType;
import okhttp3.Request;
import okhttp3.RequestBody;
import okhttp3.Response;

import android.content.Intent;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.view.Menu;
import android.view.MenuInflater;
import android.view.MenuItem;
import android.view.View;
import android.widget.Button;
import android.widget.EditText;
import android.widget.TextView;

import org.jetbrains.annotations.NotNull;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.io.IOException;
import java.util.LinkedList;

public class ProfileView extends AppCompatActivity implements CoursesListAdapter.CoursesListClickListener {

    private LinkedList<String> courses;

    private CoursesListAdapter adapter;


    /**
     * User taps notificationViewButton
     */
    public void switchTabToNotifyView() {
        Intent intent = new Intent(this, NotifyView.class);
        intent.setFlags(Intent.FLAG_ACTIVITY_REORDER_TO_FRONT);
        startActivity(intent);
    }

    /**
     * User taps postingViewButton
     */
    public void switchTabToPostingView() {
        Intent intent = new Intent(this, PostingView.class);
        intent.setFlags(Intent.FLAG_ACTIVITY_REORDER_TO_FRONT);
        startActivity(intent);
    }

    /**
     * User taps profileViewButton
     */
    public void switchTabToProfileView() {
        Intent intent = new Intent(this, ProfileView.class);
        intent.setFlags(Intent.FLAG_ACTIVITY_REORDER_TO_FRONT);
        startActivity(intent);
    }

    /**
     * Create a ProfileView
     * @param savedInstanceState State to restore
     */
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        RecyclerView.LayoutManager layoutManager;
        RecyclerView coursesView;
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

        courses = new LinkedList<>();
        adapter = new CoursesListAdapter(this, this.courses);
        coursesView.setAdapter(adapter);

        Button addCourseButton = findViewById(R.id.addcoursebutton);
        final EditText course_input_text = findViewById(R.id.addCourseText);
        addCourseButton.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View view) {
                addcourse(course_input_text.getText().toString());
                course_input_text.getText().clear();
            }
        });
        updateRating();
        updateAllCourses();
    }

    /**
     * Update a users rating
     */
    private void updateRating() {
        final TextView ratingView = findViewById(R.id.rating);
        Request get_rating_request = new Request.Builder()
                .url(GlobalUtils.BASE_URL + "/user/" + GlobalUtils.EMAIL)
                .addHeader("Authorization", "Bearer " + GlobalUtils.API_KEY)
                .build();

        GlobalUtils.HTTP_CLIENT.newCall(get_rating_request).enqueue(new Callback() {
            @Override
            public void onFailure(@NotNull Call call, @NotNull IOException e) {
                System.out.println("Error: " + e.toString());
            }

            @Override
            public void onResponse(@NotNull Call call, @NotNull Response response) throws IOException {
                System.out.println("Get all courses returned code " + response.code());
                try {
                    JSONObject jsonObject = new JSONObject(response.body().string());
                    if (jsonObject.has("points")) {
                        try {
                            final int rating = jsonObject.getInt("points");
                            new Handler(Looper.getMainLooper()).post(new Runnable() {
                                @Override
                                public void run() {
                                    ratingView.setText(Integer.toString(rating));
                                }
                            });
                        } catch (JSONException e) {
                            e.printStackTrace();
                        }
                    }
                } catch (JSONException e) {
                    e.printStackTrace();
                }

            }
        });
    }

    /**
     * Update a user's courses
     */
    private void updateAllCourses() {
        this.courses.clear();
        adapter.notifyDataSetChanged();

        System.out.println("updating all courses");
        System.out.println("id pasted to get courses: " + GlobalUtils.EMAIL);
        Request get_all_courses_request = new Request.Builder()
                .url(GlobalUtils.BASE_URL + "/user/" + GlobalUtils.EMAIL)
                .addHeader("Authorization", "Bearer " + GlobalUtils.API_KEY)
                .build();

        GlobalUtils.HTTP_CLIENT.newCall(get_all_courses_request).enqueue(new Callback() {
            @Override
            public void onFailure(@NotNull Call call, @NotNull IOException e) {
                System.out.println("Error: " + e.toString());
            }

            @Override
            public void onResponse(@NotNull Call call, @NotNull Response response) throws IOException {
                System.out.println("Get all courses returned code " + response.code());
                try {
                    JSONObject jsonObject = new JSONObject(response.body().string());
                    if (jsonObject.has("courses")) {
                        JSONArray array = jsonObject.getJSONArray("courses");
                        for (int i = 0; i < array.length(); i++) {
                            String course_id = array.getString(i);
                            addCourseUpdate(course_id);
                        }
                    }
                } catch (JSONException e) {
                    e.printStackTrace();
                }

            }
        });
    }

    @Override
    public void onItemClick(View view, int position) {}

    /**
     * Add a course to a user
     * @param course Course to add
     */
    private void addcourse(String course) {
        if (!courses.contains(course)) {
            courses.add(course);

            // send course information to the backend
            JSONObject jsonObject = new JSONObject();
            try {
                jsonObject.put("userId", GlobalUtils.EMAIL);
                jsonObject.put("courseId", course);
            } catch (JSONException e) {
                e.printStackTrace();
            }

            MediaType JSON = MediaType.parse("application/json; charset=utf-8");
            RequestBody body = RequestBody.create(jsonObject.toString(), JSON);

            Request post_course_request = new Request.Builder()
                    .url(GlobalUtils.BASE_URL + "/user/add-course")
                    .addHeader("Authorization", "Bearer " + GlobalUtils.API_KEY)
                    .post(body)
                    .build();

            GlobalUtils.HTTP_CLIENT.newCall(post_course_request).enqueue(new Callback() {
                @Override
                public void onFailure(@NotNull Call call, @NotNull IOException e) {
                    System.out.println("Error: " + e.toString());
                }

                @Override
                public void onResponse(@NotNull Call call, @NotNull Response response) throws IOException {
                    System.out.println("Post course request returned code " + response.code());
                }
            });
        }
    }

    /**
     * Add cousre update to application
     * @param course Course to add
     */
    private void addCourseUpdate(final String course) {
        if (!courses.contains(course)) {
            new Handler(Looper.getMainLooper()).post(new Runnable() {
                @Override
                public void run() {
                    courses.add(course);
                    adapter.notifyItemInserted(courses.size() - 1);
                }
            });
        }
    }

    /**
     * Trigger upon creation of the options menu
     * @param menu Menu to create
     * @return true on success
     */
    @Override
    public boolean onCreateOptionsMenu(Menu menu) {
        MenuInflater inflater = getMenuInflater();
        inflater.inflate(R.menu.toolbar_menu, menu);
        return true;
    }

    /**
     * Trigger options based on an item selection
     * @param item item selected
     * @return
     */
    @Override
    public boolean onOptionsItemSelected(MenuItem item) {
        switch (item.getItemId()) {
            case R.id.postingViewButton:
                switchTabToPostingView();
                break;
            case R.id.notifyViewButton:
                switchTabToNotifyView();
                break;
            case R.id.profileViewButton:
                switchTabToProfileView();
                break;
            default:
                return super.onOptionsItemSelected(item);
        }
        return true;
    }

}
