# A.V.A.T.A.R Server

![GitHub repo size](https://img.shields.io/github/repo-size/Avatar-Home-Automation/A.V.A.T.A.R-Server)
![GitHub Release](https://img.shields.io/github/v/release/Avatar-Home-Automation/A.V.A.T.A.R-Server)
![GitHub Release Date](https://img.shields.io/github/release-date/Avatar-Home-Automation/A.V.A.T.A.R-Server)
![GitHub License](https://img.shields.io/github/license/Avatar-Home-Automation/A.V.A.T.A.R-Server)

A.V.A.T.A.R is an open source client-server speech recognition assistant dedicated to the design of [intelligent homes](https://en.wikipedia.org/wiki/Home_automation) and the [Internet of Things](https://en.wikipedia.org/wiki/Internet_of_things)

<p align="center"><img src="assets/img/A.V.A.T.A.R.png" width="100%" height="100%"/></p>

The principle is to dictate a rule via a client, which is sent to the server. The server translates it into English and analyzes it using [Natural Language Processing (NLP)](https://en.wikipedia.org/wiki/Natural_language_processing). If an intention is found, the server triggers the associated script. These scripts (or plugins) developed in [Node.js](https://nodejs.org/) interact with all connected objects that can be controlled (home automation box, TV box, TV, Wi-Fi speaker, Sonos, lamp, gadget...), Open Data (TV programs, cinema schedules, world weather, wikipedia...) or even other voice assistants (like Google assistant)

A.V.A.T.A.R is the “core” of your applications, so all you have to do is develop plugins that interact with what you want to drive, and A.V.A.T.A.R takes care of the rest. To this end, A.V.A.T.A.R offers you a development API and a host of tools for easily creating and managing your plugins, as well as a library of plugins made by the community of contributors.  

If you want to dispense with voice recognition, A.V.A.T.A.R also offers a tool for creating and managing button widgets in server and client interfaces. These widgets also interact with home automation boxes.  

You can also add your own JS/HTML/CSS windows to the application.

## Supported platforms

A.V.A.T.A.R server was developed on Windows 10 and Linux (Debian 12) using [Electron](https://www.electronjs.org/) framework and [Node.js](https://nodejs.org/)

* Windows (Windows 10 and up): `ia32 (x86)`, `x64 (amd64)`, `arm64` ![Static Badge](https://img.shields.io/badge/test-ok-brightgreen) ![Static Badge](https://img.shields.io/badge/release-100%25-brightgreen?style=plastic)
* Mac0S (Big Sur and up): `64-bit Intel` and `Apple Silicon / ARM binaries` for macOS.	![Static Badge](https://img.shields.io/badge/test-ok-brightgreen) ![Static Badge](https://img.shields.io/badge/release-100%25-brightgreen?style=plastic)
* Linux (Ubuntu 18.04 and newer, Fedora 32 and newer, Debian 10 and newer): `x64 (amd64)`, `arm64` ![Static Badge](https://img.shields.io/badge/test-ok-brightgreen) ![Static Badge](https://img.shields.io/badge/release-100%25-brightgreen?style=plastic)
* Raspberry Pi (Raspberry Pi OS): `arm64`. Server only, no voices and voice regognition for clients  ![Static Badge](https://img.shields.io/badge/test-ok-brightgreen) ![Static Badge]![Static Badge](https://img.shields.io/badge/release-100%25-brightgreen?style=plastic)


## Installation

Follow the [installation documentation](https://avatar-home-automation.github.io/docs/)

**Note:** At least, one [A.V.A.T.A.R client](https://github.com/Avatar-Home-Automation/A.V.A.T.A.R-Client) is needed to use the application

## License
Free software under [MIT license](https://github.com/avatar-home-automation/A.V.A.T.A.R-Server/blob/master/LICENSE)
