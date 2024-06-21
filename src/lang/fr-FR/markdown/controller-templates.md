# Modèles de Contrôleur
Les modèles de contrôleur vous permettent de configurer la mise en page des boutons par contrôleur et par analyseur.

Vous pouvez désactiver la `Synchronisation Cloud` dans Steam pour éviter que vos configurations de contrôleur SRM soient écrasées. Vous pouvez trouver ce réglage dans `Steam > Paramètres > Cloud`.

Pour créer un modèle personnalisé:
* Ouvrir Steam.
* Connectez le contrôleur pour lequel vous voulez configurer un modèle.
* Faites un clic droit sur n'importe quel jeu et cliquez sur `Gérer > Configuration du contrôleur`.
* Configurez les boutons comme bon vous semble.
* Appuyez sur `Options de configuration` puis `Exporter la configuration`.
* Nommez le modèle dans la forme: `Titre du modèle (SRM)`. Vous devez terminer le nom par `(SRM)` ou SRM ignorera le modèle.
* Répétez pour autant de types de contrôleur différents que vous voulez configurer.

Dans l'analyseur SRM:
* Appuyer sur `Re-Fetch Controller Templates` pour extraire des modèles pour tous les types de contrôleur à partir de Steam. Cela effacera vos modèles actuellement sélectionné s'il ne fait pas partie des modèles disponibles dans Steam.

Actuellement SRM tire tous les modèles par défaut (fait par Valve) pour chaque contrôleur ainsi que tous les modèles définis par l'utilisateur qui se terminent par `(SRM)`.

* Sélectionnez vos modèles et enregistrez l'analyseur. The controller configsets will be applied once you hit `Save to Steam` in the Add Games.

* Pour annuler la configuration du contrôleur, vous pouvez soit `Retirer toutes les entrées d'application et contrôleur ajoutées` dans les paramètres généraux (cela supprime toutes les modifications apportées à vos données Steam) ou appuyer sur `Unset All Controllers` dans l'analyseur (cela supprime uniquement les paramètres du contrôleur pour le répertoire Steam et l'utilisateur spécifié dans cet analyseur).

Once this is done you can parse and add games to steam as usual, and the templates will be applied to all the titles in the parser.


