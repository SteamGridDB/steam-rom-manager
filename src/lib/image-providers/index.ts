export const imageProviders = {
    'SteamGridDB': require('./steamgriddb.worker'),
    'retrogaming.cloud': require('./retrogaming-cloud.worker')
};

export function availableProviders(){
    return Object.keys(imageProviders);
};