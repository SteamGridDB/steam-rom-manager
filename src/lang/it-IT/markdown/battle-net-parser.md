# Battle.net Parser

Questo analizzatore importa giochi dall'app `Battle.net`, in modo che gli artwork possano essere scelti per loro e possano essere aggiunti a Steam. Se non funziona è perché Blizzard ha modificato la struttura dei propri file di database, in questo caso si prega di far sapere agli sviluppatori di SRM e risolveremo il problema.

Il parser `Battle.net` è un po 'speciale in quanto utilizza uno script di shell su `${srmDir}/scripts/bnet. s1` per avviare `Battle.net`, attendi una giusta quantità di tempo, e solo allora lancia il titolo.
