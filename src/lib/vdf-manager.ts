import { VDF_ListData, SteamDirectory, PreviewData, AppImages, VDF_ListItem } from "../models";
import { VDF_Error } from './vdf-error';
import { vdf } from './helpers';
import { APP } from '../variables';

export class VDF_Manager {
    private data: VDF_ListData = {};

    private get lang() {
        return APP.lang.vdfManager;
    }

    prepare(data: SteamDirectory[] | PreviewData) {
        return Promise.resolve().then(() => {
            if (data instanceof Array) {
                if (data.length > 0)
                    return vdf.generateListFromDirectoryList(data);
                else
                    throw new VDF_Error(this.lang.error.emptyDirectoryList);
            }
            else
                return vdf.generateListFromPreviewData(data);
        }).then((generatedData) => {
            if (generatedData.numberOfGeneratedEntries > 0) {
                this.data = generatedData.data;
                if (generatedData.errors.length > 0)
                    return new VDF_Error(generatedData.errors);
            }
            else {
                if (generatedData.errors.length > 0)
                    throw new VDF_Error(generatedData.errors);
                else
                    throw new VDF_Error(APP.lang.vdfManager.error.noUsersFound);
            }
        });
    }

    read(options?: { shortcuts?: boolean, addedItems?: boolean, screenshots?: boolean }) {
        let promises: Promise<any>[] = [];
        let readShortcuts = options !== undefined ? options.shortcuts : true;
        let readAddedItems = options !== undefined ? options.addedItems : true;
        let readScreenshots = options !== undefined ? options.screenshots : true;

        for (let steamDirectory in this.data) {
            for (let userId in this.data[steamDirectory]) {
                if (readShortcuts)
                    promises.push(this.data[steamDirectory][userId].shortcuts.read());
                if (readAddedItems)
                    promises.push(this.data[steamDirectory][userId].addedItems.read());
                if (readScreenshots)
                    promises.push(this.data[steamDirectory][userId].screenshots.read());
            }
        }

        return Promise.all(promises);
    }

    write(options?: { shortcuts?: boolean, addedItems?: boolean, screenshots?: boolean }) {
        let promises: Promise<VDF_Error>[] = []
        let writeShortcuts = options !== undefined ? options.shortcuts : true;
        let writeAddedItems = options !== undefined ? options.addedItems : true;
        let writeScreenshots = options !== undefined ? options.screenshots : true;

        for (let steamDirectory in this.data) {
            for (let userId in this.data[steamDirectory]) {
                /* if (writeShortcuts)
                    promises.push(this.data[steamDirectory][userId].shortcuts.write() as Promise<undefined>); */
                /* if (writeAddedItems)
                    promises.push(this.data[steamDirectory][userId].addedItems.write() as Promise<undefined>); */
                if (writeScreenshots)
                    promises.push(this.data[steamDirectory][userId].screenshots.write());
            }
        }

        return Promise.all(promises).then((errors) => {
            if (errors.length > 0) {
                let error = new VDF_Error(errors);
                if (error.valid)
                    return error;
            }
        });
    }

    backup(options?: { shortcuts?: boolean, screenshots?: boolean }) {
        let promises: Promise<void>[] = []
        let backupShortcuts = options !== undefined ? options.shortcuts : true;
        let backupScreenshots = options !== undefined ? options.screenshots : true;

        for (let steamDirectory in this.data) {
            for (let userId in this.data[steamDirectory]) {
                if (backupShortcuts) {
                    promises.push(this.data[steamDirectory][userId].shortcuts.backup('backup', true));
                    promises.push(this.data[steamDirectory][userId].shortcuts.backup('firstbackup'));
                }
                if (backupScreenshots) {
                    promises.push(this.data[steamDirectory][userId].screenshots.backup('backup', true));
                    promises.push(this.data[steamDirectory][userId].screenshots.backup('firstbackup'));
                }
            }
        }

        return Promise.all(promises);
    }

    forEach(callback: (steamDirectory: string, userId: string, listItem: VDF_ListItem) => void) {
        for (let steamDirectory in this.data) {
            for (let userId in this.data[steamDirectory]) {
                callback(steamDirectory, userId, this.data[steamDirectory][userId]);
            }
        }
    }

    mergeData(previewData: PreviewData, images: AppImages) {
        return Promise.resolve().then(() => {
            this.forEach((steamDirectory, userId, listItem) => {
                let apps = previewData[steamDirectory][userId].apps;

                if (listItem.shortcuts.invalid || listItem.addedItems.invalid || listItem.screenshots.invalid)
                    return;

                for (let appId in apps) {
                    let app = apps[appId];

                    if (app.status === 'add') {
                        let item = listItem.shortcuts.getItem(appId);
                        let imageIndex = app.currentImageIndex;
                        let appImages = images[app.imagePool].content;

                        if (item !== undefined) {
                            item.appname = app.title;
                            item.exe = app.executableLocation;
                            item.StartDir = app.startInDirectory;
                            item.LaunchOptions = app.argumentString;
                            item.tags = app.steamCategories;
                            item.icon = app.icons.length > 0 ? app.icons[app.currentIconIndex] : '';
                        }
                        else {
                            listItem.shortcuts.addItem(appId, {
                                appname: app.title,
                                exe: app.executableLocation,
                                StartDir: app.startInDirectory,
                                LaunchOptions: app.argumentString,
                                tags: app.steamCategories,
                                icon: app.icons.length > 0 ? app.icons[app.currentIconIndex] : ''
                            });
                        }

                        listItem.addedItems.addItem(appId);

                        if (appImages.length > 0 && imageIndex !== -1 && appImages[imageIndex] !== undefined) {
                            listItem.screenshots.addItem({ appId, title: app.title, url: appImages[imageIndex].imageUrl });
                        }
                    }
                    else if (app.status === 'remove') {
                        listItem.shortcuts.removeItem(appId);
                        listItem.addedItems.removeItem(appId);
                        listItem.screenshots.removeItem(appId);

                        app.steamImage = undefined;
                        if (app.currentImageIndex === -1)
                            app.currentImageIndex = 0;
                    }
                }
            });
        }).catch((error) => {
            throw new VDF_Error(this.lang.error.couldNotMergeEntries__i.interpolate({ error }));
        });
    }

    removeAllAddedEntries() {
        return Promise.resolve().then(() => {
            this.forEach((steamDirectory, userId, listItem) => {
                let apps = listItem.addedItems.data;

                if (listItem.shortcuts.invalid || listItem.addedItems.invalid || listItem.screenshots.invalid)
                    return;

                for (let appId in apps) {
                    let app = apps[appId];
                    listItem.shortcuts.removeItem(appId);
                    listItem.screenshots.removeItem(appId);
                }

                listItem.addedItems.data = {};
            });
        }).catch((error) => {
            throw new VDF_Error(this.lang.error.couldNotRemoveEntries__i.interpolate({ error }));
        });
    }
}