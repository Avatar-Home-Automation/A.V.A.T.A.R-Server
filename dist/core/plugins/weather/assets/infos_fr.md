# Weather forecast

Affiche les prévisions météorologiques à 4 jours dans une fenêtre

![weather](../../core/plugins/weather/assets/images/meteo-displayed.png =150x*)

## Configuration

### Par le site de [météo France](https://meteofrance.com/widgets) (Préféré pour la France)

1. Ouvrez un navigateur et connectez-vous au site [météo France](https://meteofrance.com/widgets)
2. Sélectionnez votre ville et copiez le code html
3. Ouvrez le fichier <plugin\>/weather.html et remplacez l'élément `iframe` par le nouveau code html `iframe`.

### Par un site météo de votre choix

1. Ouvrez un navigateur et connectez-vous au site web
2. Obtenez le code html de votre ville
2. Ouvrez le fichier <plugin\>/weather.html
3. Remplacez la valeur `https://meteofrance.com` dans le `Content-Security-Policy` par l'adresse de votre site web.
4. Remplacer l'élément `iframe` par le nouveau code html
5. Si nécessaire, modifiez les paramètres d'affichage de la fenêtre (voir ci-dessous).

## Paramètres

**Ne supprimez pas les propriétés dans les propriétés du plugin, elles sont nécessaires au widget bouton !**

Vous pouvez modifier :

- `win.width`, `win.height`, `win.opacity` pour modifier l'affichage de la fenêtre
- `devTools` pour afficher la console Chromium de la fenêtre

<br><br><br>