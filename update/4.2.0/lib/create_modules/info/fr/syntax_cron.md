# label_module

Cette page d'information que vous lisez est au format [Markdown](https://fr.wikipedia.org/wiki/Markdown).
Markdown est le format d'écriture adopté par [GitHub](https://github.com/) pour les pages de Readme. 
Son format d'écriture est très simple et ne nécessite aucunes connaissances particulières.

Cette page a été générée automatiquement avec le plugin mais il est vivement recommandé de la modifier en documentant les fonctionnalités du plugin.
Utilisez un fichier d'information d'un plugin existant comme exemple ou visitez le site [http://demo.showdownjs.com](http://demo.showdownjs.com) pour connaitre la syntaxe d'écriture.

## Règles pour tester le plugin
- test la commande une
- test la commande une dans le Salon
- test la commande une dans la Cuisine

## Dans le fichier de propriétés:
### L'objet "rules":

``` json
"rules": {
	"test": ["test * (command|order)"]
}
```

La syntaxe (command|order) permet d'avoir une reconnaissance validée avec "command" ou "order".
Pour connaitre les possibilités d'écriture des règles, référez-vous à la documentation.

<br>
## Le Cron
Cron est le diminutif de crontab.
Il s’agit d’une fonctionnalité très utile pour des tâches routinières.
L'objet Cron.[module].time du fichier de propriétés permet de régler le cron du plugin.

Visitez le site [Cron](https://fr.wikipedia.org/wiki/Cron) pour savoir comment régler un Cron.

<br><br><br><br>