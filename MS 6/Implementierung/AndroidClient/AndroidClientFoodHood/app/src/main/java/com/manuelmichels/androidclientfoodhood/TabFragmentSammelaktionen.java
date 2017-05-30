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
import android.os.Bundle;
import android.support.design.widget.FloatingActionButton;
import android.support.v4.app.Fragment;
import android.util.Log;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.ImageView;
import android.widget.RelativeLayout;
import android.widget.TextView;
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
import org.osmdroid.views.overlay.Overlay;
import org.osmdroid.views.overlay.OverlayItem;
import org.osmdroid.views.overlay.PathOverlay;

import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Calendar;
import java.util.Date;
import java.util.Locale;

/**
 * Created by manuelmichels on 09.01.16.
 * Diese Klasse implementiert die Logik für den Tab "Sammelaktionen"
 */
public class TabFragmentSammelaktionen extends Fragment {

    JSONObject terminTemp = new JSONObject();
    JSONObject situation = new JSONObject();
    JSONObject situationZielstandort = new JSONObject();
    JSONObject tempLocation = new JSONObject();
    JSONObject sammelaktion;

    RequestServer requestServer;
    TerminFinder terminFinder;

    TextView sammelaktioninformationen;
    FloatingActionButton postSammelaktion;
    MapView map;
    IMapController mapController;
    ItemizedIconOverlay<OverlayItem> currentLocationOverlay;
    final ArrayList<OverlayItem> items = new ArrayList<OverlayItem>();
    DefaultResourceProxyImpl resourceProxy;

    Drawable myCurrentLocationMarker;

    Bitmap bitmap;
    Drawable myCurrentLocationMarkerScaled;
    PathOverlay polylineOne;
    PathOverlay polylineTwo;

    Boolean getResponseArrived = false;
    Boolean situationsanalyseEnabled = false;

    /**
     * @param geschwindigkeitsGenauigkeit Die Größe des Arrays gibt hier die Anzahl der Location Änderungen an, nach dem eine neue Durschnittsgeschwindkigeit erstellst wird.
     */
    int geschwindigkeitsGenauigkeit = 5;
    float speed = 0f;
    int i = 0;
    float[] averagespeed = new float[geschwindigkeitsGenauigkeit];
    float sum = 0f;
    float averagesum;

    @Override
    public View onCreateView(LayoutInflater inflater, ViewGroup container, Bundle savedInstanceState) {

        RelativeLayout relativeLayout = (RelativeLayout) inflater.inflate(R.layout.tab_fragment_sammelaktionen, container, false);

        myCurrentLocationMarker = getContext().getResources().getDrawable(R.drawable.ic_place_black_36dp);
        bitmap = ((BitmapDrawable) myCurrentLocationMarker).getBitmap();
        /**
         *Die größe des Markers verändern
         */
        myCurrentLocationMarkerScaled = new BitmapDrawable(getResources(), Bitmap.createScaledBitmap(bitmap, 50, 50, true));


        final ImageView trackMe = (ImageView) relativeLayout.findViewById(R.id.trackMe);

        /**
         *Inatilisieren der Map
         */
        map = (MapView) relativeLayout.findViewById(R.id.map);
        map.setTileSource(TileSourceFactory.MAPNIK);
        map.setBuiltInZoomControls(true);
        map.setMultiTouchControls(true);
        mapController = map.getController();
        mapController.setZoom(14);
        GeoPoint startPoint = new GeoPoint(50.9334990, 6.8751070);
        mapController.setCenter(startPoint);

        /**
         * Anlegen der beiden Polylines, die später die Routen der Vorschlaege darstellen.
         */
        polylineOne = new PathOverlay(Color.BLUE,getContext().getApplicationContext());
        polylineTwo = new PathOverlay(Color.BLUE,getContext().getApplicationContext());

        requestServer = new RequestServer(getContext().getApplicationContext());
        terminFinder = new TerminFinder(getContext().getApplicationContext());

        trackMe.setOnClickListener(new View.OnClickListener() {

            @Override
            public void onClick(View view) {
                FindTermin();
                if(situationsanalyseEnabled){
                    situationsanalyseEnabled = false;
                    trackMe.setImageResource(R.mipmap.track_me);
                    Toast.makeText(getContext().getApplicationContext(),"Situationsanalyse deaktiviert",Toast.LENGTH_SHORT).show();

                }
                else{
                    situationsanalyseEnabled = true;
                    trackMe.setImageResource(R.mipmap.track_me_white);
                    Toast.makeText(getContext().getApplicationContext(),"Situationsanalyse aktiviert",Toast.LENGTH_SHORT).show();
                }
            }
        });

        postSammelaktion = (FloatingActionButton) relativeLayout.findViewById(R.id.postSammelaktion);
        postSammelaktion.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                if (sammelaktion==null) {
                    Toast.makeText(getContext().getApplicationContext(), "Keine Sammelaktion ausgewählt", Toast.LENGTH_LONG).show();
                    return;
                }
                Log.v("POSTRequest",sammelaktion.toString());
                requestServer.sendRequestToServer(sammelaktion, "http://10.0.3.2:3000/Sammelaktion", 1, SammelaktionPOSTResponseListener);
            }
        });

        sammelaktioninformationen = (TextView) relativeLayout.findViewById(R.id.sammelaktionInformationen);

        LocationManager locationManager = (LocationManager) getContext().getSystemService(Context.LOCATION_SERVICE);
        final LocationListener locationListener = new LocationListener() {
            /**
             * Wird immer dann aufgerufen wenn sich die Location verändert
             */
            public void onLocationChanged(Location location) {
                if(!situationsanalyseEnabled){
                    return;
                }
                speed = location.getSpeed();
                averagespeed[i] = speed;

                Log.v("Ort", "Standort:" + location);

                try {
                    tempLocation.put("latitude", location.getLatitude());
                    tempLocation.put("longitude", location.getLongitude());

                    situation.put("startstandort", tempLocation);

                    GeoPoint myLocation = new GeoPoint(location.getLatitude(), location.getLongitude());
                    mapController.setCenter(myLocation);

                } catch (JSONException e) {
                    e.printStackTrace();
                }

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
                            situation.put("transportgewicht", 3);
                        } catch (JSONException e) {
                            e.printStackTrace();
                        }
                    } else if (averagesum > 2 && averagesum <= 5) {
                        try {
                            situation.put("fortbewegungsmittel", "Fahrrad");
                            situation.put("transportgewicht", 4);
                        } catch (JSONException e) {
                            e.printStackTrace();
                        }
                    } else if (averagesum > 5 && averagesum <= 14) {
                        try {
                            situation.put("fortbewegungsmittel", "Bahn");
                            situation.put("transportgewicht", 5);
                        } catch (JSONException e) {
                            e.printStackTrace();
                        }
                    } else {
                        try {
                            situation.put("fortbewegungsmittel", "Auto");
                            situation.put("transportgewicht", 15);
                        } catch (JSONException e) {
                            e.printStackTrace();
                        }
                    }
                    try {
                        /**
                         * Json zusammenbauen das dem Server geschickt wird.
                         * @param reichweite würde eigentlich vom User eingestellt werden können, im Prototypen aber nicht berücksichtigt. In Sekunden angegeben
                         */
                        situation.put("reichweite", 6000);

                        /**
                         * Für den Prototyp, zur besseren Demonstration der Testdaten.
                         */
                        situation.put("transportgewicht", 15);

                    } catch (JSONException e) {
                        e.printStackTrace();
                    }

                    /**
                     *Sende dem Server das JsonObject mit dem nächsten anstehenden Termin, dem Standort und dem Fortbewegungsmittel
                     */
                    Log.v("SituationBeforePut", situation.toString());
                    requestServer.sendRequestToServer(situation, "http://10.0.3.2:3000/Benutzer/1/Situation", 2, SituationPutResponseListener);

                    /**
                     * Dem Server wird eine zweite Situation geschickt um auch Vorschläge für Sammelaktionen beim Endstandort zu erhalten.
                     */
                    situationZielstandort = situation;
                    try {

                        /**
                         * Setze den Startstandort auf den Zielstandort um Vorschlaege im Zielgebiet zu erhalten.
                         */
                        situationZielstandort.put("startstandort", situation.get("endstandort"));

                    } catch (JSONException e) {
                        e.printStackTrace();
                    }

                    /**
                     * Zurücksetzen der Werte um eine neue Durschnittsgeschwindigkeit berechnen zu können.
                     */
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
            Log.v("ResponsePut",response.toString());
            Toast.makeText(getContext().getApplicationContext(),"Situation wurde erfolgreich verschickt",Toast.LENGTH_LONG).show();
            /**
             *Frage die Vorschlaege für einen Benutzer ab wenn vorher die aktuelle Situation geupdated wurde.
             */
            requestServer.sendNetworkRequestToServer(null, "http://10.0.3.2:3000/Benutzer/1/Situation/Sammelaktionen", 0, VorschlaegeGetResponseListener);
        }
    };

    Response.Listener SituationPutResponseListenerTwo = new Response.Listener<JSONObject>() {
        @Override
        public void onResponse(JSONObject response) {
            Log.v("ResponsePut",response.toString());
            Toast.makeText(getContext().getApplicationContext(),"Situation wurde erfolgreich verschickt",Toast.LENGTH_LONG).show();
            /**
             *Frage die Vorschlaege für einen Benutzer ab wenn vorher die aktuelle Situation geupdated wurde.
             */
            requestServer.sendRequestToServer(null, "http://10.0.3.2:3000/Benutzer/1/Situation/Sammelaktionen", 0, VorschlaegeGetResponseListenerTwo);
        }
    };

    /**
     * Der ResponseListener, der die Response eines Get Request auf Sammelaktionsvorschläge verarbeitet.
     */
    Response.Listener VorschlaegeGetResponseListener = new Response.Listener<JSONObject>() {


        @Override
        public void onResponse(JSONObject response) {

            Log.v("StatusCode",response.toString());

            /**
             * Null setzen um die Informationen über die alte Sammelaktion zu löschen.
             */
            sammelaktioninformationen.setText("");

            /**
             * Falls keine Sammelaktion auf die aktuelle Situation passt, gib dem User ein Feedback darüber
             */
            if(response.length() == 0 ){
                Toast.makeText(getContext().getApplicationContext(),"Keine Sammelaktion gefunden",Toast.LENGTH_LONG).show();
            }

            sammelaktion = response;

            Log.v("ResponseGet",response.toString());
            JSONArray pathCoordinates = null;
            JSONArray angeboteArray = new JSONArray();
            JSONArray angeboteLocation = new JSONArray();
            double gesamtgewicht = 0;
            String fortbewegungsmittel = null;

            /**
             *Extrahieren der Response
             */
            try {
                pathCoordinates = response.getJSONArray("routegeometry");
                angeboteArray = response.getJSONArray("route");
                gesamtgewicht = (double)response.get("gesamtgewicht");
                fortbewegungsmittel = response.get("fortbewegungsmittel").toString();

                for(int i=0; i<angeboteArray.length();i++){
                    angeboteLocation.put(i, angeboteArray.getJSONObject(i).get("geolocation"));
                }

                /**
                 * Speichere die Spendenstandorte um diese auf der Karte markieren zu können
                 */
                for(int i=0;i<angeboteLocation.length();i++){
                    double lat = (double) angeboteLocation.getJSONObject(i).get("lat");
                    double lng = (double) angeboteLocation.getJSONObject(i).get("lng");

                    GeoPoint geoPoint = new GeoPoint(lat,lng);

                    OverlayItem myLocationOverlayItem = new OverlayItem("Angebotsstandort","", geoPoint);

                    myLocationOverlayItem.setMarker(myCurrentLocationMarkerScaled);

                    /**
                     *Die Marker zu einem Overlay hinzufügen
                     */
                    items.add(myLocationOverlayItem);
                }

            } catch (JSONException e) {
                e.printStackTrace();
            }

            int counter=0;
            double[] allPathCoordinates = new double[pathCoordinates.length()*2];

            /**
             *Die Koordinatenpaare in ein Double Array speichern.
             */
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

            /**
             * Füge der Polyline Koordinatenpaare hinzu.
             */
            for(int z=0;z<allPathCoordinates.length-1;z=z+2) {
                GeoPoint geoPoint = new GeoPoint(allPathCoordinates[z],allPathCoordinates[z+1]);
                polylineOne.addPoint(geoPoint);
            }

            /**
             * Den Style der Polyline konfigurieren
             */
            Paint pPaint = polylineOne.getPaint();
            pPaint.setStrokeWidth(7);
            polylineOne.setPaint(pPaint);


            /**
             * Proxy wird benutzt um Icon zu laden. https://github.com/osmdroid/osmdroid/wiki/How-to-use-the-osmdroid-library
             */
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
            items.clear();

            /**
             * Informationen über die akuelle Sammelaktion anzeigen
             */
            sammelaktioninformationen.append("\n Gesamtgewicht: "+String.format("%.2f", gesamtgewicht) + "KG");
            sammelaktioninformationen.append("\n Fortbewegungsmittel: " +fortbewegungsmittel);
            sammelaktioninformationen.append("\n Anzahl Ziele: " + angeboteArray.length());

            /**
             * Füge die Overlays's(Polyline und Marker) der Karte hinzu
             */
            addMapOverlay(polylineOne);
            addMapOverlay(currentLocationOverlay);

            /**
             * Nachdem der eine Vorschlag präsentiert ist, update die Situation auf den Standort des Termins.
             */
            requestServer.sendRequestToServer(situationZielstandort, "http://10.0.3.2:3000/Benutzer/1/Situation", 2, SituationPutResponseListenerTwo);
        }
    };


    Response.Listener VorschlaegeGetResponseListenerTwo = new Response.Listener<JSONObject>() {
        @Override
        public void onResponse(JSONObject response) {

            /**
             * Null setzen um die Informationen über die alte Sammelaktion zu löschen.
             */
            sammelaktioninformationen.setText("");

            /**
             * Falls keine Sammelaktion auf die aktuelle Situation passt, gib dem User ein Feedback darüber
             */
            if(response.length() == 0 ){
                Toast.makeText(getContext().getApplicationContext(),"Keine Sammelaktion gefunden",Toast.LENGTH_LONG).show();
            }

            sammelaktion = response;

            Log.v("ResponseGet",response.toString());
            JSONArray pathCoordinates = null;
            JSONArray angeboteArray = new JSONArray();
            JSONArray angeboteLocation = new JSONArray();
            double gesamtgewicht = 0;
            String fortbewegungsmittel = null;

            /**
             *Extrahieren der Response
             */
            try {
                pathCoordinates = response.getJSONArray("routegeometry");
                angeboteArray = response.getJSONArray("route");
                gesamtgewicht = (double)response.get("gesamtgewicht");
                fortbewegungsmittel = response.get("fortbewegungsmittel").toString();

                for(int i=0; i<angeboteArray.length();i++){
                    angeboteLocation.put(i, angeboteArray.getJSONObject(i).get("geolocation"));
                }

                /**
                 * Speichere die Spendenstandorte um diese auf der Karte markieren zu können
                 */
                for(int i=0;i<angeboteLocation.length();i++){
                    double lat = (double) angeboteLocation.getJSONObject(i).get("lat");
                    double lng = (double) angeboteLocation.getJSONObject(i).get("lng");

                    GeoPoint geoPoint = new GeoPoint(lat,lng);

                    OverlayItem myLocationOverlayItem = new OverlayItem("Angebotsstandort","", geoPoint);
                    myLocationOverlayItem.setMarker(myCurrentLocationMarkerScaled);

                    /**
                     *Die Marker zu einem Overlay hinzufügen
                     */
                    items.add(myLocationOverlayItem);
                }

            } catch (JSONException e) {
                e.printStackTrace();
            }

            int counter=0;
            double[] allPathCoordinates = new double[pathCoordinates.length()*2];

            /**
             *Die Koordinatenpaare in ein Double Array speichern.
             */
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

            /**
             * Füge der Polyline Koordinatenpaare hinzu.
             */
            for(int z=0;z<allPathCoordinates.length-1;z=z+2) {
                GeoPoint geoPoint = new GeoPoint(allPathCoordinates[z],allPathCoordinates[z+1]);
                polylineTwo.addPoint(geoPoint);
            }

            /**
             * Den Style der Polyline konfigurieren
             */
            Paint pPaint = polylineTwo.getPaint();
            pPaint.setStrokeWidth(7);
            polylineTwo.setPaint(pPaint);

            /**
             * Proxy wird benutzt um Icon zu laden. https://github.com/osmdroid/osmdroid/wiki/How-to-use-the-osmdroid-library
             */
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
            items.clear();

            /**
             * Informationen über die akuelle Sammelaktion anzeigen
             */
            sammelaktioninformationen.append("\n Gesamtgewicht: "+String.format("%.2f", gesamtgewicht) + "KG");
            sammelaktioninformationen.append("\n Fortbewegungsmittel: " +fortbewegungsmittel);
            sammelaktioninformationen.append("\n Anzahl Ziele: " + angeboteArray.length());

            /**
             * Füge die Overlays's(Polyline und Marker) der Karte hinzu
             */
            addMapOverlay(polylineTwo);
            addMapOverlay(currentLocationOverlay);
        }
    };

    Response.Listener SammelaktionPOSTResponseListener = new Response.Listener<JSONObject>() {
        @Override
        public void onResponse(JSONObject response) {
            Log.v("ResponsePOST", response.toString());
            Toast.makeText(getContext().getApplicationContext(),"Situation wurde erfolgreich verschickt",Toast.LENGTH_LONG).show();
        }
    };

    public void FindTermin(){

        terminFinder.SetJsonObejct();
        terminFinder.writeFile();

        try {
            terminTemp = terminFinder.findNextTermin();

            if (terminTemp == null) {
                Toast.makeText(getContext().getApplicationContext(), "Kein anstehender Termin", Toast.LENGTH_LONG).show();
                return;
            }

            /**
             * Zusammenbauen des Datums für die Kommunikation mit dem Server
             */
            Locale.setDefault(Locale.GERMAN);
            SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSSZ");

            Date date =Calendar.getInstance().getTime();
            Log.v("Startzeitpunk", date.toString());
            date.setHours(terminTemp.getInt("von"));
            date.setMinutes(0);
            date.setSeconds(0);

            String formatedDateStartzeitpunk = sdf.format(new Date());
            Log.v("Startzeitpunk",formatedDateStartzeitpunk);
            String formatedDateEndzeitpunkt = sdf.format(date);

            situation.put("startzeitpunkt", formatedDateStartzeitpunk);
            situation.put("endzeitpunkt", formatedDateEndzeitpunkt);
            situation.put("endstandort", terminTemp.get("standort"));

        } catch (JSONException e) {
            e.printStackTrace();
        }
    }

    /**
     * Fügt ein Overlay zu der Mapview hinzu.
     * @param overlay Dieser Overlay wird gezeichnet
     */
    public void addMapOverlay (Overlay overlay){
        map.getOverlays().add(overlay);
        Log.v("map", map.getOverlays().toString());
    }
}