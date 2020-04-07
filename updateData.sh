#!/bin/bash

wget -q -O 'corona_erkrankungen_jena.csv' 'https://opendata.jena.de/dataset/2cc7773d-beba-43ad-9808-a420a67ffcb3/resource/d3ba07b6-fb19-451b-b902-5b18d8e8cbad/download/corona_erkrankungen_jena.csv'

if [[ $(stat -c %s 'offiziell.csv') -lt $(stat -c %s 'corona_erkrankungen_jena.csv') ]]
then
	# echo 'Neu'
	mv 'corona_erkrankungen_jena.csv' 'offiziell.csv'
	git add 'offiziell.csv'
	git commit -m 'Neue Daten'
	git push
else
	# echo 'Alt'
	rm 'corona_erkrankungen_jena.csv'
fi
