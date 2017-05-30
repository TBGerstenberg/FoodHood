package com.manuelmichels.androidclientfoodhood;

import android.content.Context;
import android.text.format.DateFormat;
import android.view.View;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;
import android.util.Log;

import java.io.BufferedReader;
import java.io.FileInputStream;
import java.io.FileNotFoundException;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStreamReader;
import java.text.SimpleDateFormat;
import java.util.Calendar;
import java.util.Date;

/**
 * Created by manuelmichels on 21.12.15.
 */
public class TerminFinder {

    JSONArray terminArray = new JSONArray();
    String termindata;

    Context context;

    /**
     * Konstruktor bei dem der Context gesetzt wird.
     */
    public TerminFinder(Context context){
        this.context =  context.getApplicationContext();
    }

    /**
     * Initialisiert das zu Speichernde JSON Termin Object.
     */
    public void SetJsonObejct(){

        JSONObject termin1 = new JSONObject();
        JSONObject termin2 = new JSONObject();
        JSONObject termin3 = new JSONObject();
        JSONObject termin4 = new JSONObject();

        JSONObject adresse = new JSONObject();

        /**
         * Wochentage werden als Integer dargestellt (Montag = 1, Dienstag =2,.., Sonntag =0)
         * Die Termine sind im Prototyp vorgefertigte Platzhalter
         */
        try {


            adresse.put("locality","Cologne");
            adresse.put("region", "NRW");
            adresse.put("country-name","Germany");
            adresse.put("street-address", "Domstraße");
            adresse.put("postal-code","50668");

            termin1.put("wochentag","1");
            termin1.put("von","9");
            termin1.put("bis","12");
            termin1.put("wiederholung","wöchentlich");
            termin1.put("adresse", adresse);

            termin2.put("wochentag","5");
            termin2.put("von","18");
            termin2.put("bis","20");
            termin2.put("wiederholung","wöchentlich");
            termin2.put("adresse", adresse);

            termin3.put("wochentag","6");
            termin3.put("von","21");
            termin3.put("bis","22");
            termin3.put("wiederholung","wöchentlich");
            termin3.put("adresse", adresse);

            termin4.put("wochentag","0");
            termin4.put("von","18");
            termin4.put("bis","19");
            termin4.put("wiederholung","wöchentlich");
            termin4.put("adresse", adresse);

            terminArray.put(termin1);
            terminArray.put(termin2);
            terminArray.put(termin3);
            terminArray.put(termin4);

        } catch (JSONException e) {
            e.printStackTrace();
        }

    }

    /**
     *Speichert das JsonObject auf dem Android Client
     */
    public void writeFile(View view) {

        String filename = "TerminData.json";
        try {
            FileOutputStream fileOutputStream = context.openFileOutput(filename, Context.MODE_WORLD_READABLE);
            fileOutputStream.write(terminArray.toString().getBytes());
            fileOutputStream.close();
        } catch (FileNotFoundException e) {
            e.printStackTrace();
        } catch (IOException e){
            e.printStackTrace();
        }

    }

    /**
     * Ließt das gespeicherte File in ein Json Object aus.
     */
    public void readFile(){
        try {
            String message;
            FileInputStream fileInputStream = context.openFileInput("TerminData.json");
            InputStreamReader inputStreamReader = new InputStreamReader(fileInputStream);
            BufferedReader bufferedReader = new BufferedReader(inputStreamReader);
            StringBuffer stringBuffer = new StringBuffer();
            while((message=bufferedReader.readLine()) != null){

                stringBuffer.append(message + "\n");
            }
            termindata = stringBuffer.toString();

        } catch (FileNotFoundException e) {
            e.printStackTrace();
        } catch (IOException e) {
            e.printStackTrace();
        }

    }
    /**
     * @return Das JSON Object mit dem nächsten anstehenden Termin.
     */
    public JSONObject findNextTermin() throws JSONException {
        readFile();
        /**
         * Datum Objekt mit dem aktuellen Datum.
         */
        Date date = new Date();

        JSONObject temp = null;
        Boolean terminGefunden = false;

        for(int i=0;i<terminArray.length();i++){
            /**
             *Prüfe ob der Termin heute ist und liegt der Termin heute noch in der Zukunft
             */
            if(Integer.parseInt(terminArray.getJSONObject(i).get("wochentag").toString()) == date.getDay() && date.getHours() < Integer.parseInt(terminArray.getJSONObject(i).get("von").toString())){
                /**
                 *Prüfung welcher Termin als nächstes ansteht
                 */

                if(temp==null || (Integer.parseInt(terminArray.getJSONObject(i).get("von").toString()) < Integer.parseInt(temp.get("von").toString()))){

                    temp = terminArray.getJSONObject(i);
                    terminGefunden = true;

                }
            }
        }
        if(terminGefunden){
            Log.v("Termin","TerminGefunden");
            return temp;
        }
        else{
            temp = null;
            return temp;
        }
    }
}
