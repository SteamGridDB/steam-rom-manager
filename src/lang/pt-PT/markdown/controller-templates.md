# Modelos de Comando
Os modelos de comando permitem-lhe configurar o ''layout'' do botão por comando e por analisador.

You may want to disable `Cloud Synchronization` in Steam to avoid having your SRM assigned controller configs get overwritten. You may find the setting under `Steam > Settings > Cloud`.

Para criar um modelo personalizado:
* Abra o Steam.
* Ligue o comando em que pretende configurar um modelo.
* Clique com o botão direito em qualquer jogo e aperte `Gerir > Layout do Comando`.
* Configure os botões como o mais adequado.
* Hit `Export Config` then `Save new template binding`.
* Name the template in the form: `Template Title (SRM)`. You must end the name with `(SRM)` or SRM will not pick up the template.
* Repeat for as many different types of controller as you want to configure.

No analisador SRM:
* Hit `Re-Fetch Controller Templates` to pull templates for all controller types from steam. This will clear your currently selected template if it is not one of the templates available in Steam.

Currently, SRM pulls all of the default (Valve made) templates for each controller as well as all of the user defined templates that end in `(SRM)`.

* Select your templates and save the parser. The controller configsets will be applied once you hit `Save to Steam` in the Add Games.

* To unset controller configs, you may either `Remove All Added App Entries` from global settings (this deletes all SRM made changes to your steam data) or hit `Unset All Controllers` in the parser (this only removes controller settings for the steam directory and user specified in that parser).

Once this is done you can parse and add games to steam as usual, and the templates will be applied to all the titles in the parser.


