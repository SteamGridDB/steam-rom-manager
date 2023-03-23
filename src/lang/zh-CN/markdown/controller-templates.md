# Controller Templates
Controller templates allow you to configure the button layout per controller and per parser.

You may want to disable `Cloud Synchronization` in Steam to avoid having your SRM assigned controller configs get overwritten. You may find the setting under `Steam > Settings > Cloud`. You may find the setting under `Steam > Settings > Cloud`.

To make a template:
* Open Steam.
* Connect the controller you want to configure a template for.
* Right click on any game and hit `Manage > Controller Layout`.
* Configure the buttons as you see fit.
* Hit `Export Config` then `Save new template binding`.
* Name the template in the form: `Template Title (SRM)`. Name the template in the form: `Template Title (SRM)`. You must end the name with `(SRM)` or SRM will not pick up the template.
* Repeat for as many different types of controller as you want to configure.

In the SRM parser:
* Hit `Fetch Controller Templates` to pull templates for all controller types from steam. This will clear your currently selected template if it is not one of the templates available in Steam. This will clear your currently selected template if it is not one of the templates available in Steam.
* Select your templates and save the parser.

Once this is done you can generate and save the preview as usual, and the template will be applied to all the titles in the parser.


