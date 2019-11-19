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
//import android.app.NotificationChannel;
//import android.app.NotificationManager;
import android.content.Intent;
//import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.text.method.ScrollingMovementMethod;
//import android.view.LayoutInflater;
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



    private NotifyViewAdapter adapter;
    private LinkedList<String> notifications;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        RecyclerView newQuestionsView;
        RecyclerView.LayoutManager layoutManager;
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
        updateAllQuestions();

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

    private void updateAllQuestions() {
        System.out.println("updating all questions");
        System.out.println("id passted to get questions: " + GlobalUtils.EMAIL);
        Request get_all_questions_request = new Request.Builder()
                .url(GlobalUtils.BASE_URL + "/user/" + GlobalUtils.EMAIL)
                .addHeader("Authorization", "Bearer " + GlobalUtils.API_KEY)
                .build();

        GlobalUtils.HTTP_CLIENT.newCall(get_all_questions_request).enqueue(new Callback() {
            @Override
            public void onFailure(@NotNull Call call, @NotNull IOException e) {
                System.out.println("Error: "+ e.toString());
            }

            @Override
            public void onResponse(@NotNull Call call, @NotNull Response response) throws IOException {
                System.out.println("Get all questions returned code " + response.code());
                try {
                    JSONObject jsonObject = new JSONObject(response.body().string());
                    if (jsonObject.has("currentQuestion") && !jsonObject.isNull("currentQuestion")){
                        final String question_id = jsonObject.get("currentQuestion").toString();
                        new Handler(Looper.getMainLooper()).post(new Runnable(){
                            @Override
                            public void run() {
                                addNotification(question_id);
                            }
                        });
                    }
                } catch (JSONException e) {
                    e.printStackTrace();
                }
            }
        });
    }


    @Override
    public void onItemClick(View view, int position) {
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
                .url(GlobalUtils.BASE_URL + "/questions/" + questionID)
                .addHeader("Authorization", "Bearer " + GlobalUtils.API_KEY)
                .build();

        GlobalUtils.HTTP_CLIENT.newCall(get_question_data_request).enqueue(new Callback() {
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

        setupClickListeners(close, yes, no, questionID, pressed_position, dialog);
        dialog.show();
    }

    private void setupClickListeners(Button close, Button yes, Button no, String questionID_param, int pressed_position_param, Dialog dialog_param) {
        final String questionID = questionID_param;
        final int pressed_position = pressed_position_param;
        final Dialog dialog = dialog_param;

        yes.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                JSONObject jsonObject = new JSONObject();
                try {
                    jsonObject.put("userId", GlobalUtils.EMAIL);
                    jsonObject.put("questionId", questionID);
                } catch (JSONException e) {
                    e.printStackTrace();
                }

                MediaType JSON = MediaType.parse("application/json; charset=utf-8");
                RequestBody body = RequestBody.create(jsonObject.toString(), JSON);

                Request notify_question_accepted = new Request.Builder()
                        .url(GlobalUtils.BASE_URL + "/questions/accept")
                        .addHeader("Authorization", "Bearer " + GlobalUtils.API_KEY)
                        .post(body)
                        .build();

                GlobalUtils.HTTP_CLIENT.newCall(notify_question_accepted).enqueue(new Callback() {
                    @Override
                    public void onFailure(@NotNull Call call, @NotNull IOException e) {
                        System.out.println("Notify question accepted failed");
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
    }

    @Override
    protected void onResume() {
        super.onResume();
        updateAllQuestions();
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
