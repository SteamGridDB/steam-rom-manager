# GOG Galaxy Parser Specific Inputs

## Sobrescrever caminho da Galáxia
Por padrão Steam ROM Manager pressupõe que seu Galaxy Client está localizado em `C:\ProgramFiles (x86)\GOG GalaxyClient.exe`. Este campo permite que você substitua esse caminho se sua instalação do Amazon Games estiver em outro lugar.

Este campo só é necessário se você ativar o lançamento via GOG Galaxy (veja abaixo), como de outra forma a SRM não precisa da localização do Cliente Galaxy.

## Inicie a Via Epic Games loja `[Recomendado ativado]`

Como parece, este alternador permite que você defina se os jogos serão executados via Amazon Games ou diretamente. Note que para alguns jogos rodando o GOG Galaxy pode falhar, e a sobreposição da Steam provavelmente não funcionará.

## Parse Linked Executables from GOG Galaxy

If enabled, SRM will pull in not only GOG games aquired from GOG Galaxy's store, but also those you have manually linked executables for in GOG Galaxy. This is desirable if those games are not being parsed into SRM elsewhere. A caveat is that because GOG Galaxy does not store the names of such games, SRM will use the directory name of the executable: `C:\\path\\to\\Hoa\\LaunchHoa.exe` would be assigned the title `Hoa`.