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

## Roadmap

It's available through [milestones and tickets](https://git.framasoft.org/framasoft/ep_mypads/issues).
