package com.foodhood.googlemapspoc;

import android.Manifest;
import android.app.Activity;
import android.content.Context;
import android.content.pm.PackageManager;
import android.graphics.Color;
import android.location.Criteria;
import android.location.Location;
import android.location.LocationManager;
import android.net.ConnectivityManager;
import android.net.Network;
import android.net.NetworkInfo;
import android.os.AsyncTask;
import android.support.v4.app.ActivityCompat;
import android.support.v4.app.FragmentActivity;
import android.os.Bundle;
import android.util.Log;
import android.view.View;
import android.widget.Button;
import android.widget.TextView;
import com.android.volley.AuthFailureError;
import com.android.volley.Cache;
import com.android.volley.Request;
import com.android.volley.RequestQueue;
import com.android.volley.Response;
import com.android.volley.VolleyError;
import com.android.volley.VolleyLog;
import com.android.volley.toolbox.BasicNetwork;
import com.android.volley.toolbox.DiskBasedCache;
import com.android.volley.toolbox.HurlStack;
import com.android.volley.toolbox.JsonObjectRequest;
import com.android.volley.toolbox.StringRequest;
import com.android.volley.toolbox.Volley;
import com.google.android.gms.common.ConnectionResult;
import com.google.android.gms.common.api.GoogleApiClient;
import com.google.android.gms.location.LocationServices;
import com.google.android.gms.maps.CameraUpdateFactory;
import com.google.android.gms.maps.GoogleMap;
import com.google.android.gms.maps.OnMapReadyCallback;
import com.google.android.gms.maps.SupportMapFragment;
import com.google.android.gms.maps.model.LatLng;
import com.google.android.gms.maps.model.MarkerOptions;
import org.json.JSONException;
import org.json.JSONObject;
import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.OutputStreamWriter;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.HashMap;
import java.util.Map;

import static android.location.LocationManager.GPS_PROVIDER;

public class MapsActivity extends FragmentActivity implements OnMapReadyCallback,GoogleApiClient.ConnectionCallbacks, GoogleApiClient.OnConnectionFailedListener {

    //Map & Locationservice Client
    private GoogleMap mMap;
    private GoogleApiClient mGoogleApiClient;

    //Code für den Request zum aktiveiren des GPS 
    final int PERMISSION_REQUEST_GPS= 2;

    //Textviews
    private TextView tvIsConnected, tvGPSactivated, tvGeoLoc, tvPost;

    //Buttons
    private Button btnPost, btnTraceGeo,btnCheckGPSandNetwork;

    //Variablen zur Standortbestimmung
    private Location letzterStandort;
    private Double laengengrad;
    private Double breitengrad;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_maps);

        // Obtain the SupportMapFragment and get notified when the map is ready to be used.
        SupportMapFragment mapFragment = (SupportMapFragment) getSupportFragmentManager()
                .findFragmentById(R.id.map);
        mapFragment.getMapAsync(this);

        //Instanziiere Client für Google Play Services API
        mGoogleApiClient = new GoogleApiClient.Builder(this.getBaseContext())
                .addConnectionCallbacks(this)
                .addOnConnectionFailedListener(this)
                .addApi(LocationServices.API)
                .build();;

        //Views und Buttons referenzieren
        tvIsConnected = (TextView) findViewById(R.id.tvIsConnected);
        tvGPSactivated = (TextView) findViewById(R.id.tvGPSactivated);
        tvGeoLoc = (TextView) findViewById(R.id.tvGeoloc);
        tvPost=(TextView) findViewById(R.id.tvPost);
        btnCheckGPSandNetwork = (Button) findViewById(R.id.btnCheckGPSandNetwork);
        btnPost = (Button) findViewById(R.id.btnPost);
        btnTraceGeo = (Button) findViewById(R.id.btnTraceGeo);

        //Onclick für den Check von GPS-Sensor;- und Netzwerkstatus
        btnCheckGPSandNetwork.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {

                if (isConnected()) {
                    tvIsConnected.setBackgroundColor(Color.GREEN);
                    tvIsConnected.setText("You are connected");
                } else {
                    tvIsConnected.setBackgroundColor(Color.RED);
                    tvIsConnected.setText("You are NOT connected");
                }

                if (isGPSEnabled(v.getContext())) {
                    tvGPSactivated.setBackgroundColor(Color.GREEN);
                    tvGPSactivated.setText("GPS active");
                } else {
                    tvGPSactivated.setBackgroundColor(Color.RED);
                    tvGPSactivated.setText("GPS inactive");
                }
            }
        });

        //Onclick für den Button der den Verbindungsaufbau zu GooglePlay Services auslöst
        btnPost.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                Log.d("Buttonclick", "PostButton Clicked");
                postLocation();
            }
        });

        //Onclick für den Button der den Verbindungsaufbau zu GooglePlay Services auslöst
        btnTraceGeo.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                Log.d("Buttonclick", "TraceGeoButton Clicked");
                mGoogleApiClient.connect();
            }
        });
    }

    //Play Services APIClient Methods
    //Triggered bei erfolgreichem Verbindungsaufbau über den GoogleApiClient
    @Override
    public void onConnected(Bundle bundle) {
        letzterStandort = LocationServices.FusedLocationApi.getLastLocation(this.mGoogleApiClient);

        if (letzterStandort != null) {
            laengengrad=letzterStandort.getLongitude();
            breitengrad=letzterStandort.getLatitude();
            tvGeoLoc.setText("Akuteller Standort: " + String.valueOf(laengengrad) + "°N und " + String.valueOf(breitengrad) + "°W");

            LatLng demolocation = new LatLng(breitengrad,laengengrad);
            mMap.addMarker(new MarkerOptions().position(demolocation).title("Standort während Demo"));
            mMap.moveCamera(CameraUpdateFactory.newLatLng(demolocation));
        }
    }

    @Override
    public void onConnectionSuspended(int i) {

    }

    @Override
    public void onConnectionFailed(ConnectionResult connectionResult) {

    }

    /**
     * Manipulates the map once available.
     * This callback is triggered when the map is ready to be used.
     * This is where we can add markers or lines, add listeners or move the camera. In this case,
     * we just add a marker near Sydney, Australia.
     * If Google Play services is not installed on the device, the user will be prompted to install
     * it inside the SupportMapFragment. This method will only be triggered once the user has
     * installed Google Play services and returned to the app.
     */
    @Override
    public void onMapReady(GoogleMap googleMap) {
        mMap = googleMap;

        // Add a marker in Sydney and move the camera
        LatLng sydney = new LatLng(-34, 151);
        mMap.addMarker(new MarkerOptions().position(sydney).title("Marker in Sydney"));
        mMap.moveCamera(CameraUpdateFactory.newLatLng(sydney));
    }

    //Prüft (unabhängig von Google Play Services) ob der Gerätestandort über GPS abrufbar ist
    public boolean isGPSEnabled(Context mContext) {
        LocationManager locationManager = (LocationManager)
                mContext.getSystemService(Context.LOCATION_SERVICE);
        return locationManager.isProviderEnabled(GPS_PROVIDER);
    }

    @Override
    public void onRequestPermissionsResult(int requestCode, String[] permissions, int[] grantResults) {
        if (requestCode == PERMISSION_REQUEST_GPS
                && grantResults[0] == PackageManager.PERMISSION_GRANTED) {
            getGPS();
        }
    }

    private double[] getGPS() {
        Log.d("getGPS", "called");

        if (ActivityCompat.checkSelfPermission(this, Manifest.permission.ACCESS_FINE_LOCATION) != PackageManager.PERMISSION_GRANTED &&
                ActivityCompat.checkSelfPermission(this, Manifest.permission.ACCESS_COARSE_LOCATION) != PackageManager.PERMISSION_GRANTED) {
            ActivityCompat.requestPermissions(this,new String[]{Manifest.permission.ACCESS_COARSE_LOCATION,Manifest.permission.ACCESS_FINE_LOCATION},PERMISSION_REQUEST_GPS);
            return null;
        }

        else {

            /*locationManager.requestLocationUpdates(locationProvider, 0, 0, locationListener);
*/
            LocationManager lm = (LocationManager) getSystemService(Context.LOCATION_SERVICE);
            Criteria criteria = new Criteria();
            criteria.setAccuracy(Criteria.NO_REQUIREMENT);
            String provider = lm.getBestProvider(criteria, true);

            Location mostRecentLocation = lm.getLastKnownLocation(lm.NETWORK_PROVIDER);

            if(mostRecentLocation != null) {
                double latitude=mostRecentLocation.getLatitude();
                double longitude=mostRecentLocation.getLongitude();
                return new double[]{longitude, latitude};
            }
        }
        return new double[2];
    }

    //Prüft ob eine Verbindung mit einem Netzprovider besteht
    public boolean isConnected(){
        ConnectivityManager connMgr = (ConnectivityManager) getSystemService(Activity.CONNECTIVITY_SERVICE);
        NetworkInfo networkInfo = connMgr.getActiveNetworkInfo();
        return networkInfo != null && networkInfo.isConnected();
    }

    public void postLocation() {

        // Requestqueue anlegen
        RequestQueue queue = Volley.newRequestQueue(this);

        //Request Body, später in JSON umgewandelt
        HashMap<String, String> params = new HashMap<String, String>();

        //Fülle JSON Parameter für den Request
        if (letzterStandort != null) {
            params.put("laengengrad", String.valueOf(letzterStandort.getLongitude()));
            params.put("breitengrad", String.valueOf(letzterStandort.getLatitude()));
        }

        //localhost:3000 funktioniert nur bei Debugging mit Chomes Port-Forwarding ,
        //Im Emulator muss die Loopback-Adresse 10.0.2.2:3000 verwendet werden
        JsonObjectRequest myRequest = new JsonObjectRequest(
                Request.Method.POST,
                "http://localhost:3000",
                new JSONObject(params),

                new Response.Listener<JSONObject>() {
                    @Override
                    public void onResponse(JSONObject response) {

                        try {
                            tvPost.setText(response.toString());
                            VolleyLog.v("Response:%n %s", response.toString(4));
                        } catch (JSONException e) {
                            e.printStackTrace();
                        }

                    }
                },
                new Response.ErrorListener() {
                    @Override
                    public void onErrorResponse(VolleyError error) {
                        VolleyLog.e("Error: ", error.getMessage());
                    }
                }) {

            @Override
            public Map<String, String> getHeaders() throws AuthFailureError {
                HashMap<String, String> headers = new HashMap<String, String>();
                headers.put("Content-Type", "application/json; charset=utf-8");
                headers.put("User-agent", "My useragent");
                return headers;
            }
        };

        queue.add(myRequest);
    }
}


