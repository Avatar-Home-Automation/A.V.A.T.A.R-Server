# World time

![worldTime](../../core/plugins/worldTime/assets/images/worldTime.png =100x*)

World time lets you find out the time in all the world's major cities.  

## Rules

### Default location
- `what time is it`: Returns the time for the default location

### Major world city
- `what time is it in new york`: Returns the time for New York city
- `in new york, what time is it`: Returns the time for New York city

## Parameters
* `default.zone`: The default city (the _timeZone_) if no city is in the rule
* `default.speech`: The default city to speak if no city is in the rule

## Adding a language
You can localize A.V.A.T.A.R speech by adding a language pack to the _WorldTime/locales_ folder, copying an existing pack and modifying the key values.
