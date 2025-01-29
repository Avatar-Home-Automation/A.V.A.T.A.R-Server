# WebRadio

Cette page d'information que vous lisez est au format [Markdown](https://fr.wikipedia.org/wiki/Markdown).
Markdown est le format d'écriture adopté par [GitHub](https://github.com/) pour les pages de Readme. 
Son format d'écriture est très simple et ne nécessite aucunes connaissances particulières.

Cette page a été générée automatiquement avec le plugin mais il est vivement recommandé de la modifier en documentant les fonctionnalités du plugin.
Utilisez un fichier d'information d'un plugin existant comme exemple ou visitez le site [http://demo.showdownjs.com](http://demo.showdownjs.com) pour connaitre la syntaxe d'écriture.

## Règles vocales pour tester le plugin
- test la commande une
- test la commande une dans le Salon
- test la commande une dans la Cuisine


## Dans le fichier de propriétés:
### L'objet "rules":

``` json
"rules": {
	"test": ["one","1"]
}
```

N'importe quelle phrase avec les termes "1" dans la phrase valide l'intention de la règle en relation.
Pour cette raison, il est vivement conseillé d'utiliser la validation d'une intention par termes **uniquement** pour des termes qui ne risquent pas trop souvent d'être dans d'autres phrases.

Si vous voulez quand même utiliser cette possibilité et qu'un conflit apparait avec une autre règle, vous pouvez choisir **l'ordre** de validation des règles des plugins.
Pour plus d'information, référez-vous à la documentation de développement.


<br><br><br><br>