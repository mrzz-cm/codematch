package com.example.codematchfrontend;

import androidx.appcompat.app.AppCompatActivity;
import androidx.recyclerview.widget.DividerItemDecoration;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;
import okhttp3.Call;
import okhttp3.Callback;
import okhttp3.MediaType;
import okhttp3.Request;
import okhttp3.RequestBody;
import okhttp3.Response;

import android.app.Dialog;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.content.Intent;
import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.text.method.ScrollingMovementMethod;
import android.view.LayoutInflater;
import android.view.Menu;
import android.view.MenuInflater;
import android.view.MenuItem;
import android.view.View;
import android.view.Window;
import android.widget.Button;
import android.widget.TextView;
import android.widget.Toast;

import com.google.android.material.floatingactionbutton.FloatingActionButton;

import org.jetbrains.annotations.NotNull;
import org.json.JSONException;
import org.json.JSONObject;

import java.io.IOException;
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

        notifications = new LinkedList<String>();
        update_all_questions();

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

    private void update_all_questions() {
        System.out.println("updating all questions");
        System.out.println("id passted to get questions: " + Global.EMAIL);
        Request get_all_questions_request = new Request.Builder()
                .url(Global.BASE_URL + "/user/" + Global.EMAIL)
                .addHeader("Authorization", "Bearer " + Global.API_KEY)
                .build();

        Global.HTTP_CLIENT.newCall(get_all_questions_request).enqueue(new Callback() {
            @Override
            public void onFailure(@NotNull Call call, @NotNull IOException e) {
                System.out.println("Error: "+ e.toString());
            }

            @Override
            public void onResponse(@NotNull Call call, @NotNull Response response) throws IOException {
                System.out.println("Get all questions returned code " + response.code());
                try {
                    JSONObject jsonObject = new JSONObject(response.body().string());
                    if (jsonObject.has("currentQuestion")){
                        if (!jsonObject.isNull("currentQuestion")){
                            final String question_id = jsonObject.get("currentQuestion").toString();
                            new Handler(Looper.getMainLooper()).post(new Runnable(){
                                @Override
                                public void run() {
                                    addNotification(question_id);
                                }
                            });
                        }
                    }
                } catch (JSONException e) {
                    e.printStackTrace();
                }
            }
        });
    }


    @Override
    public void onItemClick(View view, int position) {
        System.out.println(position + " clicked\n");

        final int pressed_position = position;

        final Dialog dialog = new Dialog(this);
        dialog.requestWindowFeature(Window.FEATURE_NO_TITLE);
        dialog.setContentView(R.layout.view_question_popup);
        dialog.setCanceledOnTouchOutside(true);

        final TextView questionText = (TextView) dialog.findViewById(R.id.question_text);
        final TextView titleText = (TextView) dialog.findViewById(R.id.question_title);

        // get the question data and update the fields
        final String questionID = notifications.get(position);

        Request get_question_data_request = new Request.Builder()
                .url(Global.BASE_URL + "/questions/" + questionID)
                .addHeader("Authorization", "Bearer " + Global.API_KEY)
                .build();

        Global.HTTP_CLIENT.newCall(get_question_data_request).enqueue(new Callback() {
            @Override
            public void onFailure(@NotNull Call call, @NotNull IOException e) {
                System.out.println("Error: "+ e.toString());
            }

            @Override
            public void onResponse(@NotNull Call call, @NotNull Response response) throws IOException {
                System.out.println("Get question data returned code " + response.code());
                try {
                    final JSONObject jsonObject = new JSONObject(response.body().string());
                    if (jsonObject.has("title")){
                        titleText.setText(jsonObject.get("title").toString());
                    }
                    if (jsonObject.has("questionText")){
                        questionText.setText(jsonObject.get("questionText").toString());
                    }
                } catch (JSONException e) {
                    e.printStackTrace();
                }
            }
        });

        questionText.setMovementMethod(new ScrollingMovementMethod());

        Button close = (Button) dialog.findViewById(R.id.close_dialog);

        Button yes = (Button) dialog.findViewById(R.id.alertbox_yes);
        Button no = (Button) dialog.findViewById(R.id.alertbox_no);

        yes.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                JSONObject jsonObject = new JSONObject();
                try {
                    jsonObject.put("userId", Global.EMAIL);
                    jsonObject.put("questionId", questionID);
                } catch (JSONException e) {
                    e.printStackTrace();
                }

                MediaType JSON = MediaType.parse("application/json; charset=utf-8");
                RequestBody body = RequestBody.create(jsonObject.toString(), JSON);

                Request notify_question_accepted = new Request.Builder()
                        .url(Global.BASE_URL + "/questions/accept")
                        .addHeader("Authorization", "Bearer " + Global.API_KEY)
                        .post(body)
                        .build();

                 Global.HTTP_CLIENT.newCall(notify_question_accepted).enqueue(new Callback() {
                     @Override
                     public void onFailure(@NotNull Call call, @NotNull IOException e) {

                     }

                     @Override
                     public void onResponse(@NotNull Call call, @NotNull Response response) throws IOException {
                         int statuscode = response.code();
                         System.out.println("Accept question return " + statuscode + "\n");
                     }
                 });

                removeNotificationAtPosition(pressed_position);
                dialog.cancel();
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

    @Override
    protected void onResume() {
        super.onResume();
        update_all_questions();
    }

    private void removeNotificationAtPosition(int position) {
        this.notifications.remove(position);
        adapter.notifyItemRemoved(position);
    }

    private void addNotification(String notification) {
        if (this.notifications.contains(notification)){
            System.out.println("WARNING: TRIED TO ADD SAME QUESTION ID TWICE");
        } else {
            this.notifications.add(notification);
            adapter.notifyItemInserted(notifications.size() - 1);
        }
    }

    public void goToQuestionView() {
        Intent postQuestionIntent = new Intent(this, PostingView.class);
        startActivity(postQuestionIntent);
    }
    @Override
    public boolean onCreateOptionsMenu(Menu menu) {
        MenuInflater inflater = getMenuInflater();
        inflater.inflate(R.menu.toolbar_menu, menu);
        return true;
    }
    public void switchTabToProfileView(View view) {
        // Do something in response to button
        Intent intent = new Intent(this, ProfileView.class);
        startActivity(intent);
    }
    public void switchTabToNotifyView() {
        // Do something in response to button
        Intent intent = new Intent(this, NotifyView.class);
        startActivity(intent);
    }
    public void switchTabToPostingView() {
        // Do something in response to button
        Intent intent = new Intent(this, PostingView.class);
        startActivity(intent);
    }
    public void switchTabToProfileView() {
        Intent intent = new Intent (this, ProfileView.class);
        startActivity(intent);
    }
    public void switchTabToRatingView(View view) {
        Intent intent = new Intent (this, RatingView.class);
        startActivity(intent);
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

}
