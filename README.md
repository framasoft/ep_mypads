[![](https://framagit.org/assets/favicon-075eba76312e8421991a0c1f89a89ee81678bcde72319dd3e8047e2a47cd3a42.ico)](https://framagit.org)

![English:](https://upload.wikimedia.org/wikipedia/commons/thumb/a/ae/Flag_of_the_United_Kingdom.svg/20px-Flag_of_the_United_Kingdom.svg.png) **Framasoft uses GitLab** for the development of its free softwares. Our Github repositories are only mirrors.
If you want to work with us, **fork us on [framagit.org](https://framagit.org)**. (no registration needed, you can sign in with your Github account)

![Français :](https://upload.wikimedia.org/wikipedia/commons/thumb/c/c3/Flag_of_France.svg/20px-Flag_of_France.svg.png) **Framasoft utilise GitLab** pour le développement de ses logiciels libres. Nos dépôts Github ne sont que des miroirs.
Si vous souhaitez travailler avec nous, **forkez-nous sur [framagit.org](https://framagit.org)**. (l'inscription n'est pas nécessaire, vous pouvez vous connecter avec votre compte Github)
* * *

MyPads
============
**This git repo hosts the MyPads plugin for etherpad**.

## Description

MyPads is considered as stable.

MyPads manages :

* users and their authentication;
* groups of pads per user, unlimited, sharable;
* attached pads, with choice between invite known users to use them, making them private with password or letting them public.

## Installation

At the moment, MyPads is publicly available on NPM. So you can install it from etherpad administration. You may need a reboot of your etherpad instance after the plugin install.
WARNING: if you uninstall MyPads, all its data will be definitely *removed*.

### Manual install

You can install MyPads from source. In order to do that :

* clone this git repository where you want to;
* go into the directory of your Etherpad instance;
* type the command `npm install /path/of/your/clone/of/ep_mypads`
* restart your Etherpad instance and you should see *ep_mypads* listed into your administration back-end
* homepage is available at http://youretherpad/mypads/index.html

## Configuration

Configure an admin user in Etherpad's `settings.json` and use those credentials in http://youretherpad/mypads/?/admin

## Roadmap

It's available through [milestones and tickets](https://git.framasoft.org/framasoft/ep_mypads/issues).
