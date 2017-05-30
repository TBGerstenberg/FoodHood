package com.manuelmichels.pubnubproofofconcept;

import android.support.v7.app.AppCompatActivity;
import android.os.Bundle;
import android.view.View;
import android.widget.Button;
import com.pubnub.api.*;

public class MainActivity extends AppCompatActivity {

    Pubnub pubnub = new Pubnub("pub-c-4086ea86-8bbb-4597-aee3-8f6a7bda621c", "sub-c-b991972e-8460-11e5-a558-0619f8945a4f", false);


    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);
        Button button = (Button)findViewById(R.id.PubBut);

        button.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {

                Callback callback = new Callback() {
                    public void successCallback(String channel, Object response) {
                        System.out.println(response.toString());
                    }
                    public void errorCallback(String channel, PubnubError error) {
                        System.out.println(error.toString());
                    }
                };
                pubnub.publish("MyChannel", "Diese Nachricht kommt vom AndroidClient", callback);

            }

        });


        try {
            pubnub.subscribe("MyChannel", new Callback() {

                @Override
                public void connectCallback(String channel, Object message) {
                    System.out.println("SUBSCRIBE : CONNECT on channel:" + channel
                            + " : " + message.getClass() + " : "
                            + message.toString());
                }

                @Override
                public void disconnectCallback(String channel, Object message) {
                    System.out.println("SUBSCRIBE : DISCONNECT on channel:" + channel
                            + " : " + message.getClass() + " : "
                            + message.toString());
                }

                public void reconnectCallback(String channel, Object message) {
                    System.out.println("SUBSCRIBE : RECONNECT on channel:" + channel
                            + " : " + message.getClass() + " : "
                            + message.toString());
                }

                @Override
                public void successCallback(String channel, Object message) {
                    System.out.println("SUBSCRIBE : " + channel + " : "
                            + message.getClass() + " : " + message.toString());
                }

                @Override
                public void errorCallback(String channel, PubnubError error) {
                    System.out.println("SUBSCRIBE : ERROR on channel " + channel
                            + " : " + error.toString());
                }
            });
        } catch (PubnubException e) {
            e.printStackTrace();
        }





    }
}
