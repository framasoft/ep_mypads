#!/bin/bash
po2json -i po/mypads.en.po -t static/l10n/en.json --progress none -o po/mypads.default.json
for i in po/mypads.*.po
do
    j=$(echo $i | cut -d '.' -f 2 | cut -d '/' -f 2)
    po2json -i $i -t po/mypads.default.json --progress none | ./.renest_json.pl -f po/mypads.default.json > po/$j.json
    mv po/$j.json static/l10n/
done
po2json -i po/mail.en.po -t templates/mail_en.json --progress none -o po/mail.default.json
for i in po/mail.*.po
do
    j=$(echo $i | cut -d '.' -f 2 | cut -d '/' -f 2)
    po2json -i $i -t po/mail.default.json --progress none | ./.renest_json.pl -f po/mail.default.json > po/mail_$j.json
    mv po/mail_$j.json templates/
done
npm run frontend:build
