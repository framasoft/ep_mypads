# MyPads

Ce dépôt git héberge le code source du plugin MyPads pour Etherpad.

## Description

MyPads est considéré comme stable.

MyPads propose la gestion :

* des utilisateurs et leur authentification;
* de groupes de pads, illimités par utilisateur, partageables;
* des pads associés, avec le choix d'inviter des utilisateurs inscrits à les utiliser, d'y mettre un mot de passe ou de les rendre publics.

## Installation

MyPads est publié sur NPM. Vous pouvez de fait l'installer directement depuis l'interface d'administration d'etherpad.
ATTENTION: si vous désinstallez MyPads, toutes les données associées seront définitivement *supprimées*.

### Installation manuelle

Vous pouvez installer MyPads depuis les sources. Pour cela :

* cloner ce dépôt git où bon vous semble;
* rendez-vous dans le répertoire de votre instance Etherpad;
* entrez la commande `npm install /chemin/de/votre/clone/ep_mypads`;
* relancez votre instance Etherpad et vous devriez voir *ep_mypads* dans votre interface d'administration et ainsi pouvoir directement le tester;
* la page d'accueil est disponible sur http://votreinstance/mypads/index.html

## Feuille de route

Elle est disponible au travers [des étapes et tickets](https://git.framasoft.org/framasoft/ep_mypads/issues).
