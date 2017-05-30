package com.manuelmichels.androidclientfoodhood;

import android.content.Context;
import android.graphics.Bitmap;
import android.graphics.Color;
import android.graphics.Paint;
import android.graphics.drawable.BitmapDrawable;
import android.graphics.drawable.Drawable;
import android.location.Location;
import android.location.LocationListener;
import android.location.LocationManager;
import android.os.Build;
import android.os.Bundle;
import android.support.v4.app.Fragment;
import android.util.Log;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.ImageView;
import android.widget.RelativeLayout;
import android.widget.Toast;

import com.android.volley.Response;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;
import org.osmdroid.DefaultResourceProxyImpl;
import org.osmdroid.api.IMapController;
import org.osmdroid.tileprovider.tilesource.TileSourceFactory;
import org.osmdroid.util.GeoPoint;
import org.osmdroid.views.MapView;
import org.osmdroid.views.overlay.ItemizedIconOverlay;
import org.osmdroid.views.overlay.OverlayItem;
import org.osmdroid.views.overlay.PathOverlay;

import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Date;


/**
 * Created by manuelmichels on 09.01.16.
 */
public class TabFragmentSammelaktionen extends Fragment {

    JSONObject terminTemp = new JSONObject();
    JSONObject situation = new JSONObject();
    JSONObject tempLocation = new JSONObject();

    MapView map;
    IMapController mapController;
    ItemizedIconOverlay<OverlayItem> currentLocationOverlay;
    final ArrayList<OverlayItem> items = new ArrayList<OverlayItem>();
    DefaultResourceProxyImpl resourceProxy;

    /**
     * @param geschwindigkeitsGenauigkeit Die Größe des Arrays gibt hier die Anzahl der Location Änderungen an, nach dem eine neue Durschnittsgeschwindkigeit erstellst wird.
     */
    int geschwindigkeitsGenauigkeit = 3;
    float speed = 0f;
    int i = 0;
    float[] averagespeed = new float[geschwindigkeitsGenauigkeit];
    float sum = 0f;
    float averagesum;
    @Override
    public View onCreateView(LayoutInflater inflater, ViewGroup container, Bundle savedInstanceState) {

        RelativeLayout relativeLayout = (RelativeLayout) inflater.inflate(R.layout.tab_fragment_sammelaktionen, container, false);
        map = (MapView) relativeLayout.findViewById(R.id.map);

        map.setTileSource(TileSourceFactory.MAPNIK);
        map.setBuiltInZoomControls(true);
        map.setMultiTouchControls(true);
        mapController = map.getController();
        mapController.setZoom(14);
        GeoPoint startPoint = new GeoPoint(50.9334990, 6.8751070);
        mapController.setCenter(startPoint);

        final RequestServer requestServer = new RequestServer(getContext().getApplicationContext());
        final TerminFinder terminFinder = new TerminFinder(getContext().getApplicationContext());

        ImageView trackMe = (ImageView) relativeLayout.findViewById(R.id.trackMe);

        trackMe.setOnClickListener(new View.OnClickListener() {

            @Override
            public void onClick(View v) {
                terminFinder.SetJsonObejct();
                terminFinder.writeFile(v);

                try {
                    terminTemp = terminFinder.findNextTermin();

                    if (terminTemp == null) {
                        Toast.makeText(getContext().getApplicationContext(), "Kein anstehender Termin", Toast.LENGTH_LONG).show();
                        return;
                    }

                    /**
                     * Zusammenbauen des Datums für die Kommunikation mit dem Server
                     */
                    SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSSZ");

                    Date date = new Date();
                    date.setHours(terminTemp.getInt("von"));
                    date.setMinutes(0);
                    date.setSeconds(0);

                    String formatedDateStartzeitpunk = sdf.format(new Date());
                    String formatedDateEndzeitpunkt = sdf.format(date);

                    situation.put("startzeitpunkt", formatedDateStartzeitpunk);
                    situation.put("endzeitpunkt", formatedDateEndzeitpunkt);
                    situation.put("endstandort", terminTemp.get("adresse"));

                } catch (JSONException e) {
                    e.printStackTrace();
                }
                //outputTerminData.setText("Ihr nächster Termin ist:\n" + situation);
            }
        });

        LocationManager locationManager = (LocationManager) getContext().getSystemService(Context.LOCATION_SERVICE);
        final LocationListener locationListener = new LocationListener() {
            /**
             * Wird immer dann aufgerufen wenn sich die Location verändert
             */
            public void onLocationChanged(Location location) {
                speed = location.getSpeed();
                averagespeed[i] = speed;

                Log.v("Ort", "Standort:" + location);

                try {
                    tempLocation.put("latitude",location.getLatitude());
                    tempLocation.put("longitude",location.getLongitude());

                    situation.put("startstandort", tempLocation);

                    GeoPoint myLocation = new GeoPoint(location.getLatitude(), location.getLongitude());
                    mapController.setCenter(myLocation);

                } catch (JSONException e) {
                    e.printStackTrace();
                }
                //outputStandort.setText("Standort: \n" + location);
                /*try {
                    outputFortbewegungsmittel.setText("Ihr aktuelles Fortbewegungsmittel ist: \n" + situation.get("fortbewegungsmittel"));
                } catch (JSONException e) {
                    e.printStackTrace();
                }*/

                //Führe die Berechnung nur alle x(geschwindigkeitsGenauigkeit) Veränderungen durch.
                if (i >= geschwindigkeitsGenauigkeit - 1) {

                    for (int j = 0; j < averagespeed.length; j++) {
                        sum = sum + averagespeed[j];
                    }
                    averagesum = sum / geschwindigkeitsGenauigkeit;
                    //i wieder auf 0 setzen, um die nächsten x Veränderungen zählen zu können.
                    i = 0;
                    //currentspeed.setText("Durschnittsgeschwindigkeit in Meter pro Sekunde: \n" + averagesum + '\n');

                    if (averagesum <= 2) {
                        try {
                            situation.put("fortbewegungsmittel", "zu Fuß");
                            situation.put("transportgewicht", 15);
                        } catch (JSONException e) {
                            e.printStackTrace();
                        }
                        //fortbewegung.setText("Sie sind zu Fuß unterwegs");
                    } else if (averagesum > 2 && averagesum <= 5) {
                        try {
                            situation.put("fortbewegungsmittel", "Fahrrad");
                            situation.put("transportgewicht", 13);
                        } catch (JSONException e) {
                            e.printStackTrace();
                        }
                    } else if (averagesum > 5 && averagesum <= 14) {
                        try {
                            situation.put("fortbewegungsmittel", "Bahn");
                            situation.put("transportgewicht", 15);
                        } catch (JSONException e) {
                            e.printStackTrace();
                        }
                    } else {
                        try {
                            situation.put("fortbewegungsmittel", "Auto");
                            situation.put("transportgewicht", 20);
                        } catch (JSONException e) {
                            e.printStackTrace();
                        }
                    }

                    /*try {
                        outputFortbewegungsmittel.setText("Ihr aktuelles Fortbewegungsmittel ist:\n" + situation.get("Fortbewgungsmittel"));
                    } catch (JSONException e) {
                        e.printStackTrace();
                    }*/

                    try {
                        /**
                         * Json zusammenbauen das dem Server geschickt wird.
                         * @param reichweite würde eigentlich vom User eingestellt werden können, im Prototypen aber nicht berücksichtigt. In sekunden angegeben
                         */
                        situation.put("reichweite", 3000);

                    } catch (JSONException e) {
                        e.printStackTrace();
                    }

                    Log.v("RequestSituation", situation.toString());

                    /**
                     *Sende dem Server das JsonObject mit dem nächsten anstehenden Termin, dem Standort und dem Fortbewegungsmittel
                     */
                    requestServer.sendRequestToServer(situation, "http://localhost:3000/Benutzer/1/Situation", 2, SituationPutResponseListener);
                    /**
                     *Frage die Vorschlaege für einen Benutzer ab
                     */
                    requestServer.sendRequestToServer(situation,"http://localhost:3000/Benutzer/1/Situation/Sammelaktionen",0,VorschlaegeGetResponseListener);
                    sum = 0f;
                    averagesum = 0f;
                }
                i++;
            }

            public void onStatusChanged(String provider, int status, Bundle extras) {
            }

            public void onProviderEnabled(String provider) {
            }

            public void onProviderDisabled(String provider) {
            }
        };
        locationManager.requestLocationUpdates(LocationManager.GPS_PROVIDER, 1, 1, locationListener);

        return relativeLayout;
    }

    /**
     * Der ResponseListener, der die Response eines PUT Request auf eine Situation verarbeitet.
     */
    Response.Listener SituationPutResponseListener = new Response.Listener<JSONObject>() {
        @Override
        public void onResponse(JSONObject response) {
            Log.v("Response",response.toString());
            Toast.makeText(getContext().getApplicationContext(),"Situation wurde erfolgreich verschickt",Toast.LENGTH_LONG).show();
        }
    };

    /**
     * Der ResponseListener, der die Response eines Get Request auf Sammelaktionsvorschläge verarbeitet.
     */
    Response.Listener VorschlaegeGetResponseListener = new Response.Listener<JSONObject>() {
        @Override
        public void onResponse(JSONObject response) {

            Log.v("ResponseGet",response.toString());
            JSONArray pathCoordinates = null;
            JSONArray angeboteArray;
            JSONArray angeboteLocation = new JSONArray();

            /**
             *Extrahieren der Response
             */
            try {
                pathCoordinates = response.getJSONArray("routegeometry");
                angeboteArray = response.getJSONArray("route");
                for(int i=0; i<angeboteArray.length();i++){
                    angeboteLocation.put(i, angeboteArray.getJSONObject(i).get("geolocation"));
                }

                Log.v("ResponseGetLocation",angeboteLocation.toString());

                /**
                 * Speichere die Spendenstandorte um diese auf der Karte markieren zu können
                 */
                for(int i=0;i<angeboteLocation.length();i++){
                    double lat = (double) angeboteLocation.getJSONObject(i).get("lat");
                    double lng = (double) angeboteLocation.getJSONObject(i).get("lng");

                    GeoPoint geoPoint = new GeoPoint(lat,lng);

                    OverlayItem myLocationOverlayItem = new OverlayItem("Angebotsstandort","", geoPoint);

                    Drawable myCurrentLocationMarker = getContext().getResources().getDrawable(R.drawable.ic_place_black_36dp);

                    /**
                     *Die größe des Markers verändern
                     */
                    Bitmap bitmap = ((BitmapDrawable) myCurrentLocationMarker).getBitmap();
                    Drawable myCurrentLocationMarkerScaled = new BitmapDrawable(getResources(), Bitmap.createScaledBitmap(bitmap, 50, 50, true));

                    myLocationOverlayItem.setMarker(myCurrentLocationMarkerScaled);

                    items.add(myLocationOverlayItem);
                }

            } catch (JSONException e) {
                e.printStackTrace();
            }

            int counter=0;
            double[] allPathCoordinates = new double[pathCoordinates.length()*2];

            for(int i=0;i<pathCoordinates.length();i++){
                for(int j=0;j<=1;j++) {
                    try {
                        allPathCoordinates[counter] = (double) pathCoordinates.getJSONArray(i).get(j);
                        counter++;
                    } catch (JSONException e) {
                        e.printStackTrace();
                    }
                }
            }
            PathOverlay polyline = new PathOverlay(Color.BLUE,getContext().getApplicationContext());

            for(int z=0;z<allPathCoordinates.length-1;z=z+2) {
                GeoPoint geoPoint = new GeoPoint(allPathCoordinates[z],allPathCoordinates[z+1]);
                polyline.addPoint(geoPoint);
            }

            Paint pPaint = polyline.getPaint();
            pPaint.setStrokeWidth(7);
            polyline.setPaint(pPaint);

            resourceProxy = new DefaultResourceProxyImpl(getContext().getApplicationContext());
            currentLocationOverlay = new ItemizedIconOverlay<OverlayItem>(items,
                    new ItemizedIconOverlay.OnItemGestureListener<OverlayItem>() {
                        public boolean onItemSingleTapUp(final int index, final OverlayItem item) {
                            return true;
                        }
                        public boolean onItemLongPress(final int index, final OverlayItem item) {
                            return true;
                        }
                    },resourceProxy);


            /**
             * Füge die Overlays's(Polyline und Marker) der Karte hinzu
             */
            map.getOverlays().add(polyline);
            map.getOverlays().add(currentLocationOverlay);

        }
    };


}
