# How a game's title is made

Every game's title goes through the steps below, in order. Each step starts from the title the step above it produced, and each step's result can be used as a variable.

**A step that doesn't change the title passes on the title it got.** For example, if no custom variable matches a game, `${customVariableTitle}`{.noWrap} is the same as `${shortcutTitle}`{.noWrap}, and if fuzzy matching is off or finds no match, `${fuzzyTitle}`{.noWrap} is the same as `${customVariableTitle}`{.noWrap}.

<div style="display: flex; flex-direction: column; align-items: stretch; gap: 0.25em; margin: 1.5em 0;">
<div style="padding: 0.6em 0.9em; border: 1px solid var(--srm-border-strong); border-left: 4px solid var(--srm-accent); border-radius: var(--srm-radius-md); background: var(--srm-surface-raised);"><strong>1. Extracted title</strong> &nbsp;<code>${title}</code><br><span style="color: var(--srm-text-muted);">What the parser found: for example the part of the file name matched by <code>${title}</code> in a glob, or the name a launcher gives the game.</span></div>
<div style="text-align: center; color: var(--srm-text-subtle);">↓</div>
<div style="padding: 0.6em 0.9em; border: 1px solid var(--srm-border-strong); border-left: 4px solid var(--srm-accent); border-radius: var(--srm-radius-md); background: var(--srm-surface-raised);"><strong>2. Shortcut passthrough</strong> &nbsp;<code>${shortcutTitle}</code><br><span style="color: var(--srm-text-muted);">Only with "Follow .lnk or .desktop" on: on Linux, the name inside a <code>.desktop</code> file. Otherwise the title from step 1.</span></div>
<div style="text-align: center; color: var(--srm-text-subtle);">↓</div>
<div style="padding: 0.6em 0.9em; border: 1px solid var(--srm-border-strong); border-left: 4px solid var(--srm-accent); border-radius: var(--srm-radius-md); background: var(--srm-surface-raised);"><strong>3. Title from custom variable</strong> &nbsp;<code>${customVariableTitle}</code><br><span style="color: var(--srm-text-muted);">The custom variable that matches the title from step 1, if "Title from custom variable" is set up and one matches. Otherwise the title from step 2.</span></div>
<div style="text-align: center; color: var(--srm-text-subtle);">↓</div>
<div style="padding: 0.6em 0.9em; border: 1px solid var(--srm-border-strong); border-left: 4px solid var(--srm-accent); border-radius: var(--srm-radius-md); background: var(--srm-surface-raised);"><strong>4. Fuzzy matching</strong> &nbsp;<code>${fuzzyTitle}</code><br><span style="color: var(--srm-text-muted);">The title from step 3, matched against SteamGridDB's list of games. If fuzzy matching is off or finds no match: the title from step 3.</span></div>
<div style="text-align: center; color: var(--srm-text-subtle);">↓</div>
<div style="padding: 0.6em 0.9em; border: 1px solid var(--srm-border-strong); border-left: 4px solid var(--srm-accent); border-radius: var(--srm-radius-md); background: var(--srm-surface-raised);"><strong>5. Title modifier</strong> &nbsp;<code>${finalTitle}</code><br><span style="color: var(--srm-text-muted);">The "Title modifier" field, which can use any of the variables above (<code>${fuzzyTitle}</code> if it's empty).</span></div>
<div style="text-align: center; color: var(--srm-text-subtle);">↓</div>
<div style="padding: 0.6em 0.9em; border: 1px dashed var(--srm-border-strong); border-radius: var(--srm-radius-md);"><strong>6. Exceptions</strong><br><span style="color: var(--srm-text-muted);">A new title set for the game in Exceptions (or on the Add Games page) replaces the title from step 5. Otherwise the title from step 5 is the title in Steam.</span></div>
</div>

Steps 3 and 4 only apply to the Glob, Glob-regex and Manual parsers. For the other parsers (Epic, GOG Galaxy, Steam...) they pass the title on unchanged.

The other fields that support variables (executable arguments, artwork search queries, image pool...) are filled in after step 5, so they can use `${finalTitle}`{.noWrap} too. The title in Steam (step 6) is also part of the game's APP ID: changing it makes a new shortcut, which replaces the old one.
