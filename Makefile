locales:
	json2po -P -i static/l10n/en.json -t static/l10n/en.json -o po/mypads.pot

push-locales: locales
	zanata-cli -q -B push

pull-locales:
	zanata-cli -q -B pull --min-doc-percent 50
	./.po2json.sh

stats-locales:
	zanata-cli -q stats

build:
	npm run frontend:build

watch:
	npm run frontend:watch

mockup:
	npm run mockupserver

lint:
	npm run lint

test:
	npm run test
	npm run test-ldap
