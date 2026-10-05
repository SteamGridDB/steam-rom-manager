# Quiver Launcher Parser

This parser imports apps from [Quiver Launcher](https://github.com/tgeorgiadis/quiver-launcher), a launcher for downloading, installing and running apps from GitHub and GitLab releases. Apps installed in Quiver Launcher's `Apps` folder and apps using a custom install path are both supported.

When an app folder contains several executables, launch the app once from Quiver Launcher and pick the one to use: the parser reuses that choice. If the parser stops working, Quiver Launcher may have changed the structure of its library files; in this case please let the developers of SRM know.
