# MyPads

Ce dépôt git héberge le code source du plugin MyPads pour Etherpad.

## Description

MyPads est considéré comme stable.

MyPads propose la gestion :

* des utilisateurs et leur authentification;
* de groupes de pads, illimités par utilisateur, partageables;
* des pads associés, avec le choix d'inviter des utilisateurs inscrits à les utiliser, d'y mettre un mot de passe ou de les rendre publics.

## Installation

MyPads est publié sur NPM. Vous pouvez de fait l'installer directement depuis l'interface d'administration d'etherpad. Vous pourriez avoir besoin de redémarrer votre instance une fois le plugin installé.
ATTENTION: si vous désinstallez MyPads, toutes les données associées seront définitivement *supprimées*.

**NB** MyPads ne fonctionne qu'avec NodeJS 4.

### Installation manuelle

Vous pouvez installer MyPads depuis les sources. Pour cela :

* cloner ce dépôt git où bon vous semble;
* rendez-vous dans le répertoire de votre instance Etherpad;
* entrez la commande `npm install /chemin/de/votre/clone/ep_mypads`;
* relancez votre instance Etherpad et vous devriez voir *ep_mypads* dans votre interface d'administration et ainsi pouvoir directement le tester;
* la page d'accueil est disponible sur http://votreinstance/mypads/index.html

### Configuration

Vous pouvez configurer MyPads pour utiliser de l'authentication LDAP.
Pour cela, ajoutez une section `ep_mypads`, contenant une section `ldap`, dans le fichier `settings.json` d'Etherpad :

```
"ep_mypads": {
    "ldap": {
        // L'URL de votre LDAP
        "url": "ldaps://ldap.example.org",
        // L'utilisateur LDAP servant à la connexion initiale
        "bindDN": "uid=ldap,ou=users,dc=example,dc=org",
        // Son mot de passe
        "bindCredentials": "S3cr3t",
        // Où rechercher les utilisateurs
        "searchBase": "ou=users,dc=example,dc=org",
        // Un filtre LDAP ({{username}} est remplacé par l'identifiant de l'utilisateur)
        "searchFilter": "(uid={{username}})",
        // Mappage des propriétés LDAP pour MyPads
        "properties": {
            // Quelle propriété LDAP sera utilisée comme login de l'utilisateur ?
            "login": "uid",
            // comme son adresse email
            "email": "mail",
            // comme son prénom
            "firstname": "givenName",
            // comme son nom de famille
            "lastname": "sn"
        },
        // Language par défaut des utilisateurs créés par le LDAP
        "defaultLang": "fr" // Default langage for LDAP created users
    }
}
```

A part `properties` et `defaultLang`, tous les paramètres de configuration de la section `ldap` sont des paramètres de configuration de `ldapauth-fork` (le module utilisé pour l'authentification LDAP.
Vous pouvez y ajouter d'autres paramètres, il vous suffit de vous rendre sur <https://www.npmjs.com/package/ldapauth-fork#ldapauth-config-options> pour les connaître.

**NB** Lorsque vous utilisez l'authentification LDAP, l'enregistrement de nouveaux comptes est désactivé.

## Feuille de route

Elle est disponible au travers [des étapes et tickets](https://git.framasoft.org/framasoft/ep_mypads/issues).
