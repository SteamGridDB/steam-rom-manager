# What is Steam's APP ID?

Steam uses APP ID to identify games. For non-Steam games they are generated using:

- Executable;
- Final app title.

If you use `RetroArch` or similar emulators to add the same game, but on different consoles, you will encounter a problem where only **one** title is added and others just disappear. This is due to duplicate APP IDs.

## Adding identical titles from different consoles

Steam APP ID must not be identical. This can be achieved by changing **Title modifier** value or enabling **Append arguments to executable**. Second option adds a third variable to APP ID:

- Executable;
- Final app title;
- Command line arguments.

Большинство командной строки будет содержать уникальный путь игры, который позволит генерировать уникальные APP ID.
