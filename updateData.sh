#!/bin/bash

new=0

csvJ="corona_erkrankungen_jena.csv"
wget -q -O $csvJ 'https://opendata.jena.de/dataset/2cc7773d-beba-43ad-9808-a420a67ffcb3/resource/d3ba07b6-fb19-451b-b902-5b18d8e8cbad/download/corona_erkrankungen_jena.csv'

if [[ $(stat -c %s 'jena.csv') -lt $(stat -c %s $csvJ) ]]
then
	# echo 'Neu'
	mv $csvJ 'jena.csv'
	git add 'jena.csv'
	new=1
else
	# echo 'Alt'
	rm $csvJ
fi

csvTh="thueringen.csv"

newestSearch="https://mobile.twitter.com/search?q=%28%23COVID19-Fallzahlen%29+%28from%3ASozialesTH%29+%28since%3A$(date +%Y-%m-%d)%29"

newLine=$(http "$newestSearch" | pup 'div.tweet-text' 'text{}' |\
	sed -rn '
		/Stand/{s/^.*Stand ([0-9]*)\.([0-9]*)\., ([0-9]*) Uhr\):.*$/1 \1.\2.20 \3:00/;p}
		/Infizierte insgesamt/{s/^.*Infizierte insgesamt[^0-9]+([.0-9]+).*$/2 \1/;s/\.//;p}
		/Verstorbene/{s/^.*Verstorbene[^0-9]+([.0-9]+).*$/4 \1/;s/\.//;p}
		/Genesene/{s/^.*Genesene[^0-9]+([.0-9]+).*$/3 \1/;s/\.//;p}
		/Patienten station/{s/^.*Patienten station[^0-9]+([.0-9]+).*$/5 \1/;s/\.//;p}
		/schwere Verl/{s/^.*schwere Verl[^0-9]+([.0-9]+).*$/6 \1/;s/\.//;p}' |\
    	sort |\
	sed 's/^..//' |\
	sed 'N;N;N;N;N;s/\n/,/g')

if [[ -n "$newLine" ]] && [[ $(tail -1 "$csvTh" | cut -d, -f1) != $(echo $newLine | cut -d, -f1) ]]
then
	# echo 'Neu'
	echo "$newLine" >> $csvTh
	git add $csvTh
	new=1
else
	# echo 'Alt'
	echo "" > /dev/null
fi

if [[ $new -eq 1 ]]
then
	git commit -m 'Neue Daten um '"$(date)"
	git push
fi
