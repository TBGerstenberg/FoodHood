package com.manuelmichels.androidclientfoodhood;

import android.content.Context;
import android.net.Uri;
import android.util.Log;
import android.widget.Toast;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.io.UnsupportedEncodingException;
import java.util.HashMap;
import java.util.Map;

import com.android.volley.AuthFailureError;
import com.android.volley.Request;
import com.android.volley.RequestQueue;
import com.android.volley.Response;
import com.android.volley.VolleyError;
import com.android.volley.VolleyLog;
import com.android.volley.toolbox.JsonObjectRequest;
import com.android.volley.toolbox.Volley;

/**
 * Created by manuelmichels on 22.12.15.
 */
public class RequestServer {

    Context context;

    public RequestServer(Context context){
        this.context = context;
    }

    /**
     * Sendet ein JsonObject an einen Server.
     * @param jsonObject ApplicationData des Requests
     * @param method 0=Get, 1=Post, 2=Put, 3=Delete, 7=Patch
     * @param url die vollständige url des Servers, Mit Portnumber
     */
    public void sendRequestToServer(JSONObject jsonObject, String url, int method, Response.Listener responseListener){

        RequestQueue queue = Volley.newRequestQueue(context);

        JsonObjectRequest myRequest = new JsonObjectRequest(
                method,
                url,
                jsonObject,

                responseListener,

                new Response.ErrorListener() {
                    @Override
                    public void onErrorResponse(VolleyError error) {
                        VolleyLog.e("Error: ", error.toString());
                    }
                })
        {
            @Override
            public Map<String, String> getHeaders ()throws AuthFailureError {
                HashMap<String, String> headers = new HashMap<String, String>();
                headers.put("Content-Type", "application/json");
                headers.put("Accept", "application/json");
            return headers;
        }
        };

// Add the request to the RequestQueue.
        queue.add(myRequest);
    }
}
