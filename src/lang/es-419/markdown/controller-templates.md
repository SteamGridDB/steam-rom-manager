# Plantillas de controlador
Las plantillas de controladores le permiten configurar el diseño de botones por controlador y por parser.

Es posible que quieras desactivar `Cloud Synchronization` en Steam para evitar que se sobrescriban las configuraciones de tu controlador asignado por SRM. Puedes encontrar los ajustes en `Steam > Ajustes > Nube`.

Para crear una plantilla personalizada:
* Abrir Steam.
* Conecta el control con el que quieras configurar la plantilla.
* Click derecho sobre cualquier juego y presiona `Administrar > Distribución del mando`.
* Configure los botones según considere adecuado.
* Presione `Exportar Configuración` y después `Guuardar la nueva asignación de botones`.
* . Debes agregar `(SRM)` al final del nombre, de otra manera SRM no seleccionará la plantilla.
* Repítalo por cada uno de los mandos que quiera configurar.

En el parser de SRM:
* . This will clear your currently selected template if it is not one of the templates available in Steam.

Currently, SRM pulls all of the default (Valve made) templates for each controller as well as all of the user defined templates that end in `(SRM)`.

* Seleccione las plantillas y guarde el parser. The controller configsets will be applied once you hit `Save to Steam` in the Add Games.

* Para deshacer los ajustes del mando, puede o bien `Elimina Todas Las Aplicaciones Añadidas` desde la configuración global (esto eliminará todos los cambios realizados por SRM en tus datos de steam) o pulse `Desactivar Todos Los Mandos` en el parser (esto solo elimina la configuración de los mandos para el directorio de steam y el usuario especificado en ese parser).

Once this is done you can parse and add games to steam as usual, and the templates will be applied to all the titles in the parser.


