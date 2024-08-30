# itch.io Parser specific inputs

## substituição do caminho AppData itch.io

Por padrão, o Gerente de ROM Steam assume seu cochilo. os dados do aplicativo estão localizados em `%APPDATA%\itch` nas janelas `$HOME/. onfig/itch` no linux e `$HOME/Library/Application Support/itch` em macos. Este campo permite que você substitua esse caminho se sua instalação do Amazon Games estiver em outro lugar.

## redirecionamento de unidade Windows-on-Linux

No Linux, locais de aplicativos Windows são gravados com caminhos Windows, mesmo se executando no Proton/Wine. Se definido, este campo substitui a raiz dos caminhos do jogo. For example, this would change a `C:\\Path\To\Game.exe` to `<field value>/Path/To/Game.exe`.

Este campo só tem efeito nos sistemas Linux.
