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
	"test": ["one","1"]
}
```

Any sentence with the terms "1" in the sentence validates the intent of the rule in relation.
For this reason, it is strongly recommended to use the validation of an intention by terms **only** for terms that are not too often likely to be in other sentences.

If you still want to use this possibility and a conflict appears with another rule, you can choose **the order** of validation of the plugin rules.
For more information, refer to the development documentation.


### "clients":
Example of property values to execute an action based on a room.
This is an example, you can save your properties as you wish but keep in mind that this is a good practice.

<br><br><br><br>