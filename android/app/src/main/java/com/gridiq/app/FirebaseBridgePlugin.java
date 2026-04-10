package com.gridiq.app;

import android.content.Intent;
import android.util.Log;

import androidx.activity.result.ActivityResult;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.ActivityCallback;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.google.android.gms.auth.api.signin.GoogleSignIn;
import com.google.android.gms.auth.api.signin.GoogleSignInAccount;
import com.google.android.gms.auth.api.signin.GoogleSignInClient;
import com.google.android.gms.auth.api.signin.GoogleSignInOptions;
import com.google.android.gms.common.api.ApiException;
import com.google.android.gms.tasks.Task;

/**
 * FirebaseBridgePlugin — Capacitor plugin that exposes native Android
 * capabilities to the GridIQ WebView layer.
 *
 * Methods:
 *  signInWithGoogle — performs native Google Sign-In and returns an ID token
 *                     that the JS layer passes to Firebase signInWithCredential.
 */
@CapacitorPlugin(name = "FirebaseBridge")
public class FirebaseBridgePlugin extends Plugin {

    private static final String TAG = "FirebaseBridgePlugin";

    // Web OAuth 2.0 client ID from google-services.json (client_type: 3).
    // This is the correct client to request an ID token against.
    private static final String WEB_CLIENT_ID =
        "862615362572-3fscmfje0cmo7v6tlllblapl3rmdnlvg.apps.googleusercontent.com";

    @PluginMethod
    public void signInWithGoogle(PluginCall call) {
        GoogleSignInOptions gso = new GoogleSignInOptions.Builder(
                GoogleSignInOptions.DEFAULT_SIGN_IN)
                .requestIdToken(WEB_CLIENT_ID)
                .requestEmail()
                .requestProfile()
                .build();

        GoogleSignInClient client = GoogleSignIn.getClient(getActivity(), gso);

        // Sign out first so the account picker always appears.
        client.signOut().addOnCompleteListener(task -> {
            Intent signInIntent = client.getSignInIntent();
            startActivityForResult(call, signInIntent, "handleGoogleSignInResult");
        });
    }

    @ActivityCallback
    private void handleGoogleSignInResult(PluginCall call, ActivityResult result) {
        if (call == null) return;
        try {
            Task<GoogleSignInAccount> task =
                GoogleSignIn.getSignedInAccountFromIntent(result.getData());
            GoogleSignInAccount account = task.getResult(ApiException.class);

            String idToken = account.getIdToken();
            if (idToken == null) {
                call.reject("Google Sign-In succeeded but returned no ID token. " +
                            "Ensure the Web Client ID is correct and SHA-1 is registered.");
                return;
            }

            JSObject ret = new JSObject();
            ret.put("idToken",      idToken);
            ret.put("displayName",  account.getDisplayName());
            ret.put("email",        account.getEmail());
            ret.put("photoUrl",     account.getPhotoUrl() != null
                                    ? account.getPhotoUrl().toString() : null);
            call.resolve(ret);

        } catch (ApiException e) {
            Log.e(TAG, "Google Sign-In failed, status=" + e.getStatusCode(), e);
            call.reject("Google Sign-In failed (status " + e.getStatusCode() + ")",
                        String.valueOf(e.getStatusCode()), e);
        }
    }
}
