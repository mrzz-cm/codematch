package com.example.codematchfrontend;

import android.content.Context;
import android.os.Handler;
import android.os.Looper;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
//import android.widget.AdapterView;
import android.widget.TextView;

import org.jetbrains.annotations.NotNull;
import org.json.JSONException;
import org.json.JSONObject;

import java.io.IOException;
import java.util.LinkedList;

import androidx.recyclerview.widget.RecyclerView;
import okhttp3.Call;
import okhttp3.Callback;
import okhttp3.Request;
import okhttp3.Response;

public class NotifyViewAdapter extends RecyclerView.Adapter<NotifyViewAdapter.NotifyViewHolder> {

    private LinkedList<String> dataset;
    public NotificationItemClickListener clickListener;

    public class NotifyViewHolder extends RecyclerView.ViewHolder implements View.OnClickListener{
        public TextView itemView;

        public NotifyViewHolder(View itemView) {
            super(itemView);
            this.itemView = itemView.findViewById(R.id.notificationname);

            // set the click listener
            itemView.setOnClickListener(this);
        }

        @Override
        public void onClick(View view) {
            clickListener.onItemClick(view, getAdapterPosition());
        }
    }

    public NotifyViewAdapter(Context context, LinkedList<String> dataset) {
        this.dataset = dataset;
        clickListener = (NotificationItemClickListener) context;
    }

    @Override
    public NotifyViewHolder onCreateViewHolder(ViewGroup parent, int viewType) {
        View view = LayoutInflater.from(parent.getContext())
                .inflate(R.layout.notificationtextlayout, parent, false);
        return new NotifyViewHolder(view);
    }

    @Override
    public void onBindViewHolder(NotifyViewHolder holder, int position) {
        final NotifyViewHolder finalHolder = holder;

        String questionID = dataset.get(position);

        Request get_question_title_request = new Request.Builder()
                .url(GlobalUtils.BASE_URL + "/questions/" + questionID)
                .addHeader("Authorization", "Bearer " + GlobalUtils.API_KEY)
                .build();

        GlobalUtils.HTTP_CLIENT.newCall(get_question_title_request).enqueue(new Callback() {
            @Override
            public void onFailure(@NotNull Call call, @NotNull IOException e) {
                System.out.println("Error: "+ e.toString());
            }

            @Override
            public void onResponse(@NotNull Call call, @NotNull Response response) throws IOException {
                System.out.println("Get question (title) returned code " + response.code());
                try {
                    final JSONObject jsonObject = new JSONObject(response.body().string());
                    if (jsonObject.has("title")){
                        new Handler(Looper.getMainLooper()).post(new Runnable(){
                            @Override
                            public void run() {
                                try {
                                    finalHolder.itemView.setText(jsonObject.get("title").toString());
                                } catch (JSONException e) {
                                    e.printStackTrace();
                                }
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
    public int getItemCount() {
        return this.dataset.size();
    }

    public interface NotificationItemClickListener {
        void onItemClick(View view, int position);
    }
}
