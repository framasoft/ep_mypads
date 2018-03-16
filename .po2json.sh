#!/bin/bash
po2json -i po/en.po -t static/l10n/en.json --progress none -o po/default.json
for i in po/*.po
do
    j=$(echo $i | cut -d '.' -f 1 | cut -d '/' -f 2)
    po2json -i $i -t static/l10n/en.json --progress none | ./.renest_json.pl > po/$j.json
    mv po/$j.json static/l10n/
done
npm run frontend:build
