package com.manuelmichels.androidclientfoodhood;

import android.Manifest;
import android.content.Context;
import android.content.pm.PackageManager;
import android.location.Location;
import android.location.LocationListener;
import android.location.LocationManager;
import android.os.Bundle;
import android.widget.TextView;

import org.json.JSONException;
import org.json.JSONObject;

/**
 * Created by manuelmichels on 20.12.15.
 */
public class FortbewegungsmittelAnalyse {

    Context context;

    float speed = 0f;
    int geschwindigkeitsGenauigkeit = 50;
    int i = 0;
    //Die Größe des Arrays gibt hier die Anzahl der Location Änderungen an, nach dem eine neue Durschnittsgeschwindkigeit erstellst wird.
    float[] averagespeed = new float[geschwindigkeitsGenauigkeit];
    float sum = 0f;
    float averagesum;

    JSONObject ergebnis = new JSONObject();

    public FortbewegungsmittelAnalyse(Context context) {
        this.context = context;
    }


    public void erfasseFortbewegungsmittel() {

        LocationManager locationManager = (LocationManager) context.getSystemService(Context.LOCATION_SERVICE);

        final LocationListener locationListener = new LocationListener() {

            public void onLocationChanged(Location location) {
                speed = location.getSpeed();
                averagespeed[i] = speed;

                if (i >= geschwindigkeitsGenauigkeit - 1) {

                    for (int j = 0; j < averagespeed.length; j++) {
                        sum = sum + averagespeed[j];
                    }
                    averagesum = sum / geschwindigkeitsGenauigkeit;
                    i = 0;


                    //currentspeed.setText("Durschnittsgeschwindigkeit in Meter pro Sekunde: \n" + averagesum + '\n');

                    if (averagesum <= 2) {
                        try {
                            ergebnis.put("Fortbewegungsmittel", "zu Fuß");
                        } catch (JSONException e) {
                            e.printStackTrace();
                        }
                        //fortbewegung.setText("Sie sind zu Fuß unterwegs");
                    } else if (averagesum > 2 && averagesum <= 5) {
                        try {
                            ergebnis.put("Fortbewegungsmittel", "Fahrrad");
                        } catch (JSONException e) {
                            e.printStackTrace();
                        }
                    } else if (averagesum > 5 && averagesum <= 14) {
                        try {
                            ergebnis.put("Fortbewegungsmittel", "Bahn");
                        } catch (JSONException e) {
                            e.printStackTrace();
                        }
                    } else {
                        try {
                            ergebnis.put("Fortbewegungsmittel", "Auto");
                        } catch (JSONException e) {
                            e.printStackTrace();
                        }
                        //Vmax würde bei einem auto deutlich höher sein als bei den anderen Fortbewegungsmitteln.

                    }

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

        //locationManager.requestLocationUpdates(LocationManager.GPS_PROVIDER, 0, 0, locationListener);


    }
}
