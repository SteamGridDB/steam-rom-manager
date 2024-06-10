## Configurações gerais
### Check for updates on start `[Recommend enabled]`
Check if an update for SRM is available and prompt to update each time SRM launches.
### Auto kill Steam `[Recommend enabled]`
SRM will attempt to kill all running instances of Steam whenever it needs to read/write collections information (specifically when saving to steam from `Add Games` and when removing all games from `Settings`).
### Auto restart Steam `[Recommend enabled]`
SRM will attempt to restart Steam after killing it and completing whatever collections related task required killing Steam in the first place. Requires `Auto kill Steam` to be enabled.
### Modo offline `[Recomendado desativado]`
Quando a SRM habilitada não faz solicitações de rede, útil se você quiser usar apenas SRM para imagens locais.
### Limpar log automaticamente antes de testar os analisadores `[Recomendado ativado]`
Quando habilitado, o log é limpo cada vez que um analisador é testado.
## Add Games
### Mostrar imagens Steam atuais por padrão `[Recomendado ativado]`
Quando ativado esta configuração diz SRM para o padrão para qualquer arte que esteja atualmente no vapor para um determinado aplicativo. Se estiver desativado, então toda vez que a SRM for executada (e salva) todas as artes serão redefinidas.
### Remover atalhos para analisadores desativados `[Recomendado desativado]`
Quando ativado desabilitar um analisador e executando SRM removerá todas as entradas adicionadas e artes para o analisador desabilitado. Útil se você quiser que sua biblioteca Steam esteja em correspondência 1-1 com analisadores ativados.
### Disable saving of steam categories `[Recommend disabled]`
SRM will not write any collections information when saving to Steam. This allows SRM to perform its tasks while Steam is still running, at the obvious cost that added games will not be categorized.
### Hide Steam username from preview
Steam does not allow user's to alter their Steam usernames. In some cases (childish names, dead names, etc), users may no longer wish to see their Steam usernames. This setting hides it from `Add Games`.
### Remove all added games and controllers
Undo all SRM added changes from Steam.
### Remove all controllers only
Undo all SRM added controller settings from Steam.
## Configurações difusas do matcher
### Resultados correspondentes a registro `[Recomendação desativada]`
Quando ativado mais logs detalhados aparecem para o matcher de título incerto no `log de eventos`. Útil para depuração de correspondências difusas incorretas.
### Reset fuzzy list
Redefine a lista armazenada de títulos usados para correspondência incerta à lista de títulos retornados pelo `SteamGridDB` (remove qualquer usuário adicionado títulos).
### Reset fuzzy cache
Limpa o cache de títulos que coincidem difusas já foram vistos (tente isso se as alterações feitas na lista difusa não resultam em alterações para títulos na SRM).

## Configurações de visualização de imagem
### Pré-carregamento recuperado imagens `[Recomendado desativado]`
Quando ativado, a SRM vai puxar todas as artes disponíveis para cada jogo, ao invés de puxar uma peça de arte de cada vez, enquanto o usuário navega pelas imagens. Não ative isso, a menos que você tenha uma boa razão e uma biblioteca muito pequena de jogos, caso contrário, ele pode resultar em solicitações de rede muito grandes (lentas).
### Ativar provedor
Global setting to enable/disable particular image providers. Current options are `SteamGridDB` and `Steam Official`.
### DNS manual override
Set this if you want SRM to do DNS resolution internally, as opposed to relying on your system's default DNS server. This solves many timeout issues on the Steam Deck.
### Batch size for image downloads
Number of images SRM will attempt to download at once when saving to Steam. May help to lower this if you are receiving timeout errors from SGDB.
### Nuke artwork choice cache
SRM attempts to remember your artwork choices, this button forcibly forgets all of them.
### Nuke local artwork backups
This deletes all artwork backups created for parsers with `Backup artwork locally` enabled.
## Variáveis e Predefinições da Comunidade
### Forçar download de variáveis personalizadas.
Redefine o arquivo JSON de variáveis personalizadas que é usado para certas predefinições para qualquer coisa que seu estado atual esteja no github. Útil se o arquivo JSON de variáveis personalizadas tiver sido corrompido.
### Forçar download de variáveis personalizadas.
Redefine os arquivos JSON para as predefinições do analisador para o que estiver no github, a SRM. Útil se sua lista de predefinições não estiver atualizando automaticamente por algum motivo, ou se tiver sido corrompida. Útil se sua lista de predefinições não estiver atualizando automaticamente por algum motivo, ou se tiver sido corrompida.
### Force download shell scripts
Re fetches the shell scripts SRM uses to perform certain tasks.
