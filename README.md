#What is Quink?

Quink is an extensible, end-user friendly in-page WYSIWYG HTML editor - designed for mobile first.

It allows developers to add rich input and self editing areas into web pages and web apps.

You can find a demo at http://www.quink.mobi

It uses the content editable features of modern browsers.

##Versatile and Extensible

###Clean plugin architecture

* Plugin Adapters allow content editors that know nothing of Quink
* Plugins can be loaded from different hosts into an iFrame
* Simple / minimal interface requirement: load, open (existing content if possible), save/access new content
* Content associated with plugin using css classes on divs/elements.
* Plugins lazy loaded when activated by user

###Simple to add to your page
* Single line script load
* Small bootstrap script allows for site-specific setup
* Configuration using json configuration files

###Keyboard mappings for commands
* Keyboard driven navigation (vi-like mapping in this repo) and selection
* Keyboard mapping possible for all commands
* Allowances for limited mobile keyboards missing control/command keys.

##Getting Started
* Clone the repo
* Build using build.sh in the /build folder
* Copy the /prebuilt folder onto your server
* Load Quink into your page using the path you set up: `<script type="text/javascript" src="[YOUR (relative) PATH]/quink.js"></script>`
* Add one or more contenteditable divs to your page: `<div contenteditable="true"></div>`
* Try it out
