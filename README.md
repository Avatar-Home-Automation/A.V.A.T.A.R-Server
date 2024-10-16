# A.V.A.T.A.R Server

A.V.A.T.A.R is an open source client-server web-based speech recognition assistant dedicated to the design of [intelligent homes](https://en.wikipedia.org/wiki/Home_automation) and the [Internet of Things](https://en.wikipedia.org/wiki/Internet_of_things).  

The principle is to dictate a rule via a client, which is sent to the server. The server translates it into English and analyzes it using [Natural Language Processing (NLP)](https://en.wikipedia.org/wiki/Natural_language_processing).  
If an intention is found, the server triggers the associated script. These scripts (or plugins) developed in [Node.js](https://nodejs.org/) interact with all the connected objects that can be controlled (home automation box, TV box, TV, Wi-Fi speaker, Sonos, lamp, gadget...), Open Data (TV programs, cinema schedules, world weather, wikipedia...) or even Google Assistant.

## ★ Supported platforms

A.V.A.T.A.R was developed on Windows 10 and Linux (Debian 12) using [Electron](https://www.electronjs.org/) framework

<br>

<span style="font-size:12px;">
|System| Version |Arch |Server |Client| Comment |
|:-----|:---|:---|:----------:|:----------:|:----------|
|Windows|>= 10|ia32 (x86)<br>x64 (amd64)<br>arm64| ![ok](assets/images/ok.png) | ![ok](assets/images/ok.png) | The ultimate platform for voice choices|
|Linux| Debian >= 12<br>Fedora >= 32<br>Ubuntu >= 18.04|x64 (amd64)<br>arm64 | ![ok](assets/images/ok.png) | ![ok](assets/images/ok.png) | Available voices by `espeak`|
|Mac0S| >= Bic Sur|x64 (amd64)<br>arm64|![ok](assets/images/ok.png) | ![ok](assets/images/ok.png) | Available voices |
|Raspberry Pi| Raspberry Pi OS| arm64 | ![ok](assets/images/ok.png)| ![ko](assets/images/ko.png)| No voice and voice recognition available for the client|
</span>

## ★ Installation

Follow the [installation documentation](https://avatar-home-automation.github.io/docs/)

## ★ License
Free software under [MIT license](https://github.com/avatar-home-automation/A.V.A.T.A.R-Server/blob/master/LICENSE)
