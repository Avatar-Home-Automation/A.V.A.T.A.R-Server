# A.V.A.T.A.R Server

![GitHub repo size](https://img.shields.io/github/repo-size/Avatar-Home-Automation/A.V.A.T.A.R-Server)
![GitHub Release](https://img.shields.io/github/v/release/Avatar-Home-Automation/A.V.A.T.A.R-Server)
![GitHub Release Date](https://img.shields.io/github/release-date/Avatar-Home-Automation/A.V.A.T.A.R-Server)
![GitHub License](https://img.shields.io/github/license/Avatar-Home-Automation/A.V.A.T.A.R-Server)

A.V.A.T.A.R is an open source client-server speech recognition assistant dedicated to the design of [intelligent homes](https://en.wikipedia.org/wiki/Home_automation) and the [Internet of Things](https://en.wikipedia.org/wiki/Internet_of_things)

<p align="center"><img src="assets/img/A.V.A.T.A.R.png" width="100%" height="100%"/></p>

## Principe d'utilisation

The principle is to dictate a rule via a client, which is sent to the server. The server translates it into English and analyzes it using [Natural Language Processing (NLP)](https://en.wikipedia.org/wiki/Natural_language_processing). If an intention is found, the server triggers the associated script. These scripts (or plugins) developed in [Node.js](https://nodejs.org/) interact with all connected objects that can be controlled (home automation box, TV box, TV, Wi-Fi speaker, lamp, gadget...), Open Data (TV programs, cinema schedules, world weather, wikipedia...) or even other voice assistants (like Google assistant).

A.V.A.T.A.R is the “core” of your applications, so all you have to do is develop plugins that interact with what you want to manage, and A.V.A.T.A.R takes care of the rest. To this end, A.V.A.T.A.R offers you a development API and a host of tools for easily creating and managing your plugins, as well as a library of plugins made by the community of contributors.  

If you want to dispense with voice recognition (or using it with), A.V.A.T.A.R also offers a tool for creating and managing button widgets in server and client interfaces to do what you want. These widgets also interact with home automation boxes.  
You can also add your own JS/HTML/CSS to the application to create your own graphical windows.

## Objectif d'utilisation

Bien que ce soit une application qui peut être utilisée comme gadget amusant et de manière ponctuelle sur un pc, 
l'idée principale de cette application est la [domotisation](https://en.wikipedia.org/wiki/Home_automation) de la maison et 
pouvoir intéragir vocalement avec tous ses [objects connectés](https://en.wikipedia.org/wiki/Internet_of_things).

Bien sûr aujourd'hui, il existe une multitude de produits de reconnaissance vocale, inclus même dans les box domotiques. 
malheureusement, elle reste relativement très simple et aucune ne permet une liberté totale. 
Par exemples, de pouvoir réaliser des dialogues de questions/réponses orientant une décision, 
de construire des scénarios exactement comme souhaité en incluant n'importe quel object connecté même en dehors d'une [box domotique](https://homey.app/en-fr/).

Par exemple, j'ai toujours voulu pouvoir choisir vocalement ma musique sur Sonos. 
Beaucoups de boxes domotiques ont une connection avec ces enceintes Wifi mais la gestion est très simple, 
je n'ose même pas vous dire comment lancer une musique sur certaines de ces box... 
J'ai donc simplement développé un plugin pour pouvoir lancer n'importe quelle musique en dialoguant avec mon système Sonos, 
en donnant son titre, un album ou un artiste et en incluant un mode question/réponse pour une recherche plus fine. Sans parler de la gestion de l'enceinte elle-même.

Bien sûr, il faut avoir des connaissances en développement [Node.js](https://nodejs.org/). 
A.V.A.T.A.R est fait aussi pour ceux qui ont envie d'apprendre à développer au travers de projets concrets et 
avoir ensuite la satisfaction de les réaliser eux-même exactement comme ils le souhaitent. 
Heureusement, le Node.js est un langage très accessible et pouvant être rapidement apprivoisé. 
Il existe aussi une multitude de sites d'apprentissage et de forums d'entraides.

L'idée ultime est d'avoir un client A.V.A.T.A.R dans chaque pièce de la maison servant d'assistant vocale et disposé, suivant le besoin, 
comme tablette murale avec une interface graphique et des widgets des périphériques de cette pièce en mode plan pour un contrôle tactile 
ou bien plus simplement disposé comme un petit pc sans écran comme assistant vocale uniquement. 

Coté serveur A.V.A.T.A.R, celui-ci peut être disposé comme tablette graphique dans la pièce principale regroupant toutes les widgets des périphériques 
de toutes les pièces pour un mode tactile de gestion globale. 
Cette tablette graphique pourra aussi recevoir un client A.V.A.T.A.R pour la reconnaissance vocale dans cette pièce.

Pour le microphone et l'enceinte, pour une installation simple en mode tablette murale sans invertissement, 
on pourra utiliser ceux du PC ou pour une installation plus élaborée avec une reconnaissance vocale accessible 
de partout dans la pièce et pérène, [une interface audio](https://www.behringer.com/product.html?modelCode=0805-AAR) connecté au client A.V.A.T.A.R via USB 
avec suivant la taille de la pièce un ou plusieurs 
[microphones discrets XLR](https://www.rondson.com/microphones-filaires/128-microphone-a-encastrer-pour-montage-discret.html) 
et des [enceintes Wifi](https://www.sonos.com/en-us/home) par exemple. 


## Supported platforms

A.V.A.T.A.R client was developed on Windows 10/11, linux (Debian 12) and macOS Sonoma using [Electron](https://www.electronjs.org/) framework and [Node.js](https://nodejs.org/)

* Windows (Windows 10 and up): `ia32 (x86)`, `x64 (amd64)`, `arm64` ![Static Badge](https://img.shields.io/badge/release-tested-brightgreen)
* macOS (Sonoma and up): `64-bit Intel` and `Apple Silicon / ARM binaries` for macOS.	![Static Badge](https://img.shields.io/badge/release-tested-brightgreen)
* linux (Ubuntu, Fedora, Debian): `x64 (amd64)`, `arm64` ![Static Badge](https://img.shields.io/badge/release-tested-brightgreen)
* Raspberry Pi (Raspberry Pi OS): `arm64` ![Static Badge](https://img.shields.io/badge/release-tested-brightgreen)

## Installation

Follow the [installation documentation](https://avatar-home-automation.github.io/docs/)

**Note:** At least, one [A.V.A.T.A.R client](https://github.com/Avatar-Home-Automation/A.V.A.T.A.R-Client) is needed to use the application


## License
Free software under [MIT license](https://github.com/avatar-home-automation/A.V.A.T.A.R-Server/blob/master/LICENSE)
