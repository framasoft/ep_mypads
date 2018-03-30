push-locales:
	json2po -P -i static/l10n/en.json -t static/l10n/en.json -o po/mypads.pot
	zanata-cli -q -B push

pull-locales:
	zanata-cli -q -B pull
	./.po2json.sh

stats-locales:
	zanata-cli -q stats
