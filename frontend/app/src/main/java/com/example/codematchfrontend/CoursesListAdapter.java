package com.example.codematchfrontend;

import android.content.Context;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.TextView;

import java.util.List;

import androidx.recyclerview.widget.RecyclerView;

public class CoursesListAdapter extends RecyclerView.Adapter<CoursesListAdapter.CoursesListHolder>{
    private List<String> dataset;
    public CoursesListAdapter.CoursesListClickListener clickListener;


    public CoursesListAdapter(Context ctx, List<String> data) {
        this.dataset = data;
        clickListener = (CoursesListClickListener) ctx;
    }

    public class CoursesListHolder extends RecyclerView.ViewHolder implements View.OnClickListener{
        public TextView itemView;

        public CoursesListHolder(View itemView) {
            super(itemView);
            this.itemView = itemView.findViewById(R.id.course_name);

            // set the click listener
            itemView.setOnClickListener(this);
        }

        @Override
        public void onClick(View view) {
            clickListener.onItemClick(view, getAdapterPosition());
        }
    }

    @Override
    public CoursesListAdapter.CoursesListHolder onCreateViewHolder(ViewGroup parent, int viewType) {
        View view = LayoutInflater.from(parent.getContext())
                .inflate(R.layout.courses_entry_layout, parent, false);
        return new CoursesListAdapter.CoursesListHolder(view);    }

    @Override
    public void onBindViewHolder(CoursesListAdapter.CoursesListHolder holder, int position) {
        holder.itemView.setText(dataset.get(position));
    }

    @Override
    public int getItemCount() {
        return dataset.size();
    }

    public interface CoursesListClickListener {
        void onItemClick(View view, int position);
    }
}
