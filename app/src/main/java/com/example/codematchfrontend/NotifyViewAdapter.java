package com.example.codematchfrontend;

import android.content.Context;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.AdapterView;
import android.widget.TextView;

import java.util.LinkedList;

import androidx.recyclerview.widget.RecyclerView;

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
        holder.itemView.setText(dataset.get(position));
    }

    @Override
    public int getItemCount() {
        return this.dataset.size();
    }

    public interface NotificationItemClickListener {
        void onItemClick(View view, int position);
    }
}
