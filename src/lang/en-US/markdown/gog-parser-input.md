# GOG Galaxy Parser Specific Inputs

## Galaxy Path Override
By default Steam ROM Manager assumes your Galaxy Client is located at `C:\Program Files (x86)\GOG Galaxy\GalaxyClient.exe`. This field allows you to override that path if your GOG Galaxy installation is elsewhere.

This field is actually only necessary if you enable launch via GOG Galaxy (see below), as otherwise SRM has no need of the location of the Galaxy Client.

## Launch Via GOG Galaxy `[Recommend disabled]`

What it sounds like, this toggle let's you set whether games will launch via GOG Galaxy or directly. Note that for some games launching from GOG Galaxy may fail, and the Steam overlay will most likely not work.

## Parse Linked Executables from GOG Galaxy

If enabled, SRM will pull in not only GOG games aquired from GOG Galaxy's store, but also those you have manually linked executables for in GOG Galaxy. This is desirable if those games are not being parsed into SRM elsewhere.
A caveat is that because GOG Galaxy does not store the names of such games, SRM will use the directory name of the executable: `C:\\path\\to\\Hoa\\LaunchHoa.exe` would be assigned the title `Hoa`.