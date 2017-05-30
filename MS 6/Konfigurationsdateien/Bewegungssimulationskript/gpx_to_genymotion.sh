#!/bin/bash
#Ursprüngliches Script von: https://gitlab.com/coveros/genymotion
#Das Script wurde noch manipuliert.

gps="gps.tmp"
#clean up our file
if [ -f $gps ]; then
  rm $gps
fi

#loop through each of our values in our gpx file
while IFS='' read -r line || [[ -n "$line" ]]; do
  #if this is a line with latitude and longitude information on it
  if [[ $line == \<trkpt* ]]; then
    #extract each 'interesting' value from our trkpt element
    lat=$(echo "$line" | sed -E 's/[^0-9\,-]*([0-9\,-]+)[^0-9\,-]*([0-9\,-]+)[^0-9\,-]*([0-9\,-]+)[^0-9\,-]*([0-9\,-]+)T([0-9\.-\:]+).*/\1/g')
    lon=$(echo "$line" | sed -E 's/[^0-9\,-]*([0-9\,-]+)[^0-9\,-]*([0-9\,-]+)[^0-9\,-]*([0-9\,-]+)[^0-9\,-]*([0-9\,-]+)T([0-9\.-\:]+).*/\2/g')
    ele=$(echo "$line" | sed -E 's/[^0-9\,-]*([0-9\,-]+)[^0-9\,-]*([0-9\,-]+)[^0-9\,-]*([0-9\,-]+)[^0-9\,-]*([0-9\,-]+)T([0-9\.-\:]+).*/\3/g')
    day=$(echo "$line" | sed -E 's/[^0-9\,-]*([0-9\,-]+)[^0-9\,-]*([0-9\,-]+)[^0-9\,-]*([0-9\,-]+)[^0-9\,-]*([0-9\,-]+)T([0-9\.-\:]+).*/\4/g')
    tim=$(echo "$line" | sed -E 's/[^0-9\,-]*([0-9\,-]+)[^0-9\,-]*([0-9\,-]+)[^0-9\,-]*([0-9\,-]+)[^0-9\,-]*([0-9\,-]+)T([0-9\.-\:]+).*/\5/g')

    #set our values into one file that can be read into genymotion
    echo "gps setlatitude $lat" >> $gps
    echo "gps setlongitude $lon" >> $gps
    echo "gps setaltitude $ele" >> $gps
    echo "gps setbearing 0" >>$gps
    echo "pause 2" >> $gps

    #save off our old values
    old_lat=$lat
    old_lon=$lon
    old_ele=$ele
    old_day=$day
    old_tim=$tim

  fi
done < "$1"

#Hier muss der Pfad zur genyshell executable stehen
./genyshell -f $gps
rm $gps
