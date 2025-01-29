# World time

![worldTime](../../core/plugins/worldTime/assets/images/worldTime.png =100x*)

World time vous permet de connaître l'heure dans toutes les grandes villes du monde. 

## Règles

### Emplacement par défaut
- `what time is it`: Retourne l'heure de l'emplacement par défaut

### Grande ville du monde
- `what time is it in new york`: Retourne l'heure pour la ville de New York
- `in new york, what time is it`: Retourne l'heure pour la ville de New York

## Paramètres
* `default.zone`: La ville par défaut (la _timeZone_) si aucune ville n'est mentionnée dans la règle
* `default.speech`: La ville à utiliser pour le dialogue d'A.V.A.T.A.R si aucune ville n'est mentionnée dans la règle.

## Ajouter un langage
Vous pouvez localiser le dialogue d'A.V.A.T.A.R en ajoutant un pack de langues dans le dossier _WorldTime/locales_, en copiant un pack existant et en modifiant les valeurs de clés.
