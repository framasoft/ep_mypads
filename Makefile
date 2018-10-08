locales:
	json2po -P -i static/l10n/en.json -t static/l10n/en.json -o po/mypads.pot
	json2po -P -i templates/mail_en.json -t templates/mail_en.json -o po/mail.pot

push-locales: locales
	zanata-cli -q -B push --errors --project-version `git branch | grep \* | cut -d ' ' -f2-`

pull-locales:
	zanata-cli -q -B pull  --min-doc-percent 75 --errors --project-version `git branch | grep \* | cut -d ' ' -f2-`
	./.po2json.sh

stats-locales:
	zanata-cli -q stats  --project-version `git branch | grep \* | cut -d ' ' -f2-`

contributors-locales:
	@echo "Master version:"
	@curl -s -H "Accept: application/json" -H "X-Auth-User: `grep trad.framasoft.org.username ~/.config/zanata.ini | sed 's@.*=@@'`" -H "X-Auth-Token: `grep trad.framasoft.org.key ~/.config/zanata.ini | sed 's@.*=@@'`" https://trad.framasoft.org/rest/project/mypads/version/master/contributors/2018-01-01..`date +%Y-%m-%d` | jq  '[group_by(.languageTeams)[]| {lang: .[0].languageTeams[], users: [.[].username]}]' -r | ./.translators.pl
	@echo "Development version:"
	@curl -s -H "Accept: application/json" -H "X-Auth-User: `grep trad.framasoft.org.username ~/.config/zanata.ini | sed 's@.*=@@'`" -H "X-Auth-Token: `grep trad.framasoft.org.key ~/.config/zanata.ini | sed 's@.*=@@'`" https://trad.framasoft.org/rest/project/mypads/version/development/contributors/2018-01-01..`date +%Y-%m-%d` | jq  '[group_by(.languageTeams)[]| {lang: .[0].languageTeams[], users: [.[].username]}]' -r | ./.translators.pl

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
