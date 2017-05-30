package com.manuelmichels.androidclientfoodhood;

import android.support.v4.app.Fragment;
import android.support.v4.app.FragmentManager;
import android.support.v4.app.FragmentStatePagerAdapter;

/**
 * Created by manuelmichels on 09.01.16.
 */
public class PagerAdapter extends FragmentStatePagerAdapter {

    int mNumOfTabs;

    public PagerAdapter(FragmentManager fm, int NumOfTabs) {
        super(fm);
        this.mNumOfTabs = NumOfTabs;
    }

    @Override
    public Fragment getItem(int position) {

        switch (position) {
            case 0:
                TabFragmentAngebote tab1 = new TabFragmentAngebote();
                return tab1;
            case 1:
                TabFragmentSammelaktionen tab2 = new TabFragmentSammelaktionen();
                return tab2;
            case 2:
                TabFragmenteTransportaktionen tab3 = new TabFragmenteTransportaktionen();
                return tab3;
            default:
                return null;
        }
    }

    @Override
    public int getCount() {
        return mNumOfTabs;
    }

}
