# Analyseur Battle.net

Cet analyseur importe des jeux depuis `Battle.net` afin que les artwork puissent être choisies pour eux et puissent être ajoutées à Steam. Si cela ne fonctionne pas, c'est parce que Blizzard EA a modifié la structure de leur basse de donnée xml, dans ce cas, veuillez informer les développeurs de SRM et nous résoudrons le problème.

L'analyseur `Battle.net` est quelque peu spécial en ce sens qu'il utilise un script shell à `${srmDir}/scripts/bnet. s1` afin de lancer `Battle.net`, attendez un temps approprié, puis lancez le titre réel.
