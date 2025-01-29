# Weather forecast

Displays 4-day weather forecast in a window

![weather](../../core/plugins/weather/assets/images/meteo-displayed.png =150x*)

## Configuration

### By [météo France](https://meteofrance.com/widgets) website (prefered for France)

1. Open a browser and connect to the [météo France](https://meteofrance.com/widgets) website
2. Select your city and get the html code
3. Open the <plugin\>/weather.html file and replace the `iframe` element by the new `iframe` html code

### By a weather website of your choice

1. Open a browser and connect to the website
2. Get the html code for your city
2. Open the <plugin\>/weather.html file
3. Replace the `https://meteofrance.com` value in the `Content-Security-Policy` by your web site adress
4. Replace the `iframe` element by the new html code
5. If needed, modify the window display parameters (see below)

## Parameters

**Do not remove properties in the plugin properties, they are needed by the button widget !**

You can modify:

- `win.width`, `win.height`, `win.opacity` to change the window display
- `devTools` to display de Chromium console of the window

<br><br><br>