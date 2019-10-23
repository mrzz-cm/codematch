package com.example.codematchfrontend;

import androidx.appcompat.app.AppCompatActivity;
import okhttp3.Call;
import okhttp3.Callback;
import okhttp3.FormBody;
import okhttp3.MediaType;
import okhttp3.MultipartBody;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.RequestBody;
import okhttp3.Response;

import android.accounts.AccountManager;
import android.content.Intent;
import android.os.Bundle;
import android.os.Handler;
import android.os.StrictMode;
import android.util.Log;
import android.view.View;
import android.widget.Toast;

import com.google.android.gms.auth.api.signin.*;
import com.google.android.gms.common.SignInButton;
import com.google.android.gms.common.api.ApiException;
import com.google.android.gms.tasks.OnCompleteListener;
import com.google.android.gms.tasks.Task;
import com.google.firebase.iid.FirebaseInstanceId;
import com.google.firebase.iid.InstanceIdResult;

import org.json.JSONException;
import org.json.JSONObject;

import java.io.IOException;


public class LoginView extends AppCompatActivity {
    GoogleSignInClient mGoogleSignInClient;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_login_view);

        SignInButton googleButton = findViewById(R.id.sign_in_button);
        googleButton.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                switch (v.getId()) {
                    case R.id.sign_in_button:
                        signIn();
                        break;
                }
            }
        });

        // make sure we update the firebase token first
        FirebaseInstanceId.getInstance().getInstanceId()
                .addOnCompleteListener(new OnCompleteListener<InstanceIdResult>() {
                    @Override
                    public void onComplete(Task<InstanceIdResult> task) {
                        if (!task.isSuccessful()) {
                            Log.w("notifications", "getInstanceId failed", task.getException());
                            return;
                        }

                        // Get new Instance ID token
                        String token = task.getResult().getToken();
                        System.out.println("Firebase token changed to " + token);
                        Global.FIREBASE_TOKEN = token;
                    }
                });

        GoogleSignInOptions gso = new GoogleSignInOptions.Builder(GoogleSignInOptions.DEFAULT_SIGN_IN)
                .requestEmail()
                .requestId()
                .requestIdToken(getString(R.string.default_web_client_id))
                .requestServerAuthCode(getString(R.string.default_web_client_id))
                .build();
        mGoogleSignInClient = GoogleSignIn.getClient(this, gso);

        GoogleSignInAccount account = GoogleSignIn.getLastSignedInAccount(this);
        updateUI(account);
    }

    private void signIn(){
        Intent signInIntent = mGoogleSignInClient.getSignInIntent();
        startActivityForResult(signInIntent, 3);
    }

    @Override
    protected void onStart() {
        super.onStart();
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        if (requestCode == 3) {

            Task<GoogleSignInAccount> task = GoogleSignIn.getSignedInAccountFromIntent(data);
            handleSignInResult(task);
        }
    }

    private void handleSignInResult (Task<GoogleSignInAccount> task) {
        System.out.println("called sign in button");
        try {
            GoogleSignInAccount account = task.getResult(ApiException.class);

            // signed in successfully, show the notification UI
            Global.EMAIL = account.getEmail();
            sendAccessToken(account);
        } catch (ApiException e) {
            System.out.println("signInResult:failed code=" + e.getStatusCode());
            updateUI(null);
        }
    }

    private void updateUI(GoogleSignInAccount account) {
        if (account == null) {
            Toast toast = Toast.makeText(getApplicationContext(),
                    "Unable to sign in, try again",
                    Toast.LENGTH_SHORT);

            toast.show();
        } else {
            Intent intent = new Intent(this, NotifyView.class);
            startActivity(intent);
        }
    }

    // this method gets the access token from google and sends it to the backend,
    // then updates the key for future requests. Should only be called when a  new user
    // is signed in
    private void sendAccessToken(GoogleSignInAccount account) {
        final GoogleSignInAccount faccount = account;

        String authcode = account.getServerAuthCode();
        final OkHttpClient client = Global.HTTP_CLIENT;
        RequestBody requestBody = new FormBody.Builder()
                .add("grant_type", "authorization_code")
                .add("client_id", getString(R.string.default_web_client_id))
                .add("client_secret", "CLIENT_SECRET")
                .add("redirect_uri","")
                .add("code", authcode)
                .build();

        final Request request = new Request.Builder()
                .url("https://www.googleapis.com/oauth2/v4/token")
                .post(requestBody)
                .build();

        client.newCall(request).enqueue(new Callback() {

            public void onFailure(Call call, IOException e) {
                Log.e("a", e.toString());
            }

            public void onResponse(Call call2, Response response) throws IOException {
                try {
                    JSONObject jsonObject = new JSONObject(response.body().string());
                    String message = jsonObject.toString(5);

                    Request getServerTokenRequest = new Request.Builder()
                            .url(Global.BASE_URL + "/auth/token?access_token=" + jsonObject.get("access_token"))
                            .build();
                    Call call = client.newCall(getServerTokenRequest);
                    response = call.execute();

                    Global.API_KEY = response.body().string();

                    System.out.println("Api key updated to " + Global.API_KEY + "\n");
                    notify_create_account( jsonObject.get("access_token").toString());
                    notifyFirebaseToken();

                    updateUI(faccount);
                } catch (JSONException e) {
                    e.printStackTrace();
                }
            }
        });
    }

    private void notify_create_account( String google_access_token) {
        JSONObject jsonObject = new JSONObject();
        try {
            jsonObject.put("access_token", google_access_token);
        } catch (JSONException e) {
            e.printStackTrace();
        }

        MediaType JSON = MediaType.parse("application/json; charset=utf-8");
        RequestBody body = RequestBody.create(jsonObject.toString(), JSON);

        Request notify_create_account_request = new Request.Builder()
                .url(Global.BASE_URL + "/user/register")
                .addHeader("Authorization", "Bearer " + Global.API_KEY)
                .post(body)
                .build();

        Response response = null;
        try {
            response = Global.HTTP_CLIENT.newCall(notify_create_account_request).execute();
            int statuscode = response.code();
            System.out.println("Create account return " + statuscode + "\n");
        } catch (IOException e) {
            e.printStackTrace();
        }

    }

    private void notifyFirebaseToken() {
        JSONObject jsonObject = new JSONObject();
        try {
            jsonObject.put("userId", Global.EMAIL);
            jsonObject.put("fcmToken", Global.FIREBASE_TOKEN);
        } catch (JSONException e) {
            e.printStackTrace();
        }

        MediaType JSON = MediaType.parse("application/json; charset=utf-8");
        RequestBody body = RequestBody.create(jsonObject.toString(), JSON);

        Request notify_send_firebase_key = new Request.Builder()
                .url(Global.BASE_URL + "/notifications/register")
                .addHeader("Authorization", "Bearer " + Global.API_KEY)
                .post(body)
                .build();

        Response response = null;
        try {
            response = Global.HTTP_CLIENT.newCall(notify_send_firebase_key).execute();
            int statuscode = response.code();
            System.out.println("Send firebase key return " + statuscode + "\n");
        } catch (IOException e) {
            e.printStackTrace();
        }
    }

    @Override
    protected void onResume() {
        super.onResume();
    }
}
