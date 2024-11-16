# label_module

This information page you are reading is in [Markdown](https://en.wikipedia.org/wiki/Markdown) format.
Markdown is the writing format adopted by [GitHub](https://github.com/) for Readme pages. 
Its writing format is very simple and does not require any special knowledge.

This page was automatically generated with the plugin but it is highly recommended to modify it by documenting the plugin’s features.
Use an information file from an existing plugin as an example or visit [http://demo.showdownjs.com](http://demo.showdownjs.com) for writing syntax.

## Voice rules to test the plugin
- test the command one
- test the command one in the living room
- test the command one in the kitchen

## In the property file:
### "rules":

``` json
"rules": {
	"test": ["test * (command|order)"]
}
```

The syntax (command|order) allows to have a recognition validated with "command" or "order".
To know the possibilities of writing rules, refer to the development documentation.

The other objects in the property file are automatically generated for widget management.
See the documentation for more information.

<br>
## Cron
Cron is short for crontab.
This is a very useful feature for routine tasks.
The Cron object.[module].time of the properties file allows to set the cron of the plugin.

Visit [Cron](https://fr.wikipedia.org/wiki/Cron) to learn how to set up a Cron.

<br><br><br><br>