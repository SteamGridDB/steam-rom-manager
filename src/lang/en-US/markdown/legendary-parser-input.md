# Legendary Parser Specific Inputs

## Legendary Path Override

By default Steam ROM Manager uses `(Get-Command legendary).Path` on Windows and `which legendary` on Linux and Mac to determine the location of your Legendary executable. This field allows you to override that path.

Specifying the correct location of the Legendary executable is only necessary if you enable launch via Legendary (see below), as otherwise SRM has no need of the location of Legendary's executable.

## Legendary `installed.json` Path Override

Most users shouldn't use this, as they use the standard `Legendary` installation where installed games manifest will be located at `~/.config/legendary/installed.json`. 

If, however, for some reason your installed games manifest is located in a non-typical location then you can specify the correct manifest path here.

## Launch via Legendary `[Recommend enabled]`

What it sounds like, this toggle determines whether games launch via Legendary or directly. Launching via Legendary provides access to Epic's online services.
