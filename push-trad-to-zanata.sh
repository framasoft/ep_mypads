#!/bin/bash
FILE=$1
if [[ ! -e static/l10n/$FILE.json ]]
then
    echo "static/l10n/$FILE.json does not exist. Exiting."
    exit 1
else
    LOCALE=$(echo $FILE | sed -e "s@_@-@g")
    json2po -i static/l10n/$FILE.json -t static/l10n/en.json -o po/$FILE.po
    zanata-cli -q -B push --push-type trans -l $LOCALE
fi

