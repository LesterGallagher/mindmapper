const IndexedDBStorage = require('./indexeddb-wrapper.js');

const logError = console.error;

window.storageEstimateWrapper = function storageEstimateWrapper() {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
        return navigator.storage.estimate();
    }

    if ('webkitTemporaryStorage' in navigator
        && 'queryUsageAndQuota' in navigator.webkitTemporaryStorage) {
        return new Promise(function (resolve, reject) {
            navigator.webkitTemporaryStorage.queryUsageAndQuota(
                function (usage, quota) { resolve({ usage: usage, quota: quota }); },
                reject
            );
        });
    }

    return Promise.resolve({ usage: NaN, quota: NaN });
};

function savableFormat(mindmaps) {
    var retObj = {};
    Object.keys(mindmaps).forEach(function (key) {
        const mm = mindmaps[key];
        retObj[key] = { 
            static: {
                name: mm.static.name,
                timestamp: mm.static.timestamp,
                id: mm.static.id
            },
            type: mm.type, 
            room: mm.room
        };
    });
    return retObj;
}

const indexedDBStorage = new IndexedDBStorage('data');
const indexDBItemPrefix = 'mindmap-items-';
const mindmapsLocalstorageName = 'mindmaper-mindmaps-storage-v2';
let cachedMindmaps = undefined;

let lastPromise = Promise.resolve();

const getMindmaps = () => {
    return new Promise(function (resolve, reject) {
        if (cachedMindmaps !== undefined) {
            resolve(cachedMindmaps);
        } else {
            const set = JSON.parse(localStorage.getItem(mindmapsLocalstorageName) || '{}') || {};
            let mindmapItemsPromises = Object.keys(set).map(function (mindmapUrl) {
                return Promise.resolve();
            });
            Promise.all(mindmapItemsPromises).then(function () {
                cachedMindmaps = set;
                resolve(cachedMindmaps);
            }).catch(err => {
                logError(err)
                reject();
            });
        }
    });
}

class Storage {
    constructor() {
        try {
            var testIfICanAccesLocalStorageBecauseOfCookieSecurity = localStorage.getItem('test');
        } catch (err) {
            if (err.code === 18) {
                alert('You\'ve blocked mindmapper from settings cookies on the mindmaper website.'
                    + ' We don\'t send cookies or use cookies, except for anonimized analytics.'
                    + ' By blocking cookies you\'ve also blocked the saving of mindmaps, bookmarks, favorites etc.'
                    + ' You can read our privacy statement here: https://esstudio.site/privacy-policy', {
                        title: 'Crash'
                    })
            }
            logError(err);
        }
    }

    static isFirstTimeAppOpening = () => {
        return !localStorage.getItem(mindmapsLocalstorageName);
    }

    static storageEstimateWrapper = () => this.storageEstimateWrapper();

    static getDB = () => indexedDBStorage;

    putMindmap = (parsedMindmap, skipLastPromise = false) => {
        return lastPromise = new Promise((resolve, reject) => {
            (skipLastPromise ? Promise.resolve() : lastPromise).then(() => {
                return getMindmaps();
            }).then(function (mindmaps) {
                mindmaps[parsedMindmap.static.id] = parsedMindmap;
                cachedMindmaps = mindmaps;
                return indexedDBStorage.set(indexDBItemPrefix + parsedMindmap.static.id, parsedMindmap).then(function () {
                    var fmt = savableFormat(mindmaps);
                    try {
                        localStorage.setItem(mindmapsLocalstorageName, JSON.stringify(fmt));
                    } catch (domException) {
                        if (domException.name === 'QuotaExceededError'
                            || domException.name === 'NS_ERROR_DOM_QUOTA_REACHED') {
                            alert('Unable to store data because their is not enough space.');
                        }
                    }
                    resolve();
                });
            }).catch(err => {
                logError(err)
                resolve();
            });
        });
    }

    shouldWeakPut = (parsedMindmap, skipLastPromise = false) => {
        return lastPromise = new Promise((resolve, reject) => {
            // only put if mindmap doesn't already exist 
            // and if the older mindmap has another should_update_token


            (skipLastPromise ? Promise.resolve() : lastPromise).then(() => {
                return getMindmaps();
            }).then(function (mindmaps) {
                var should = !mindmaps[parsedMindmap.static.id]
                    || mindmaps[parsedMindmap.static.id].should_update_token !== parsedMindmap.should_update_token;
                resolve(should);
            }).catch(err => {
                logError(err)
                resolve(true);
            });
        });
    }
    tryWeakPut = parsedMindmap => {
        // only put if mindmap doesn't already exist 
        // and if the older mindmap has another should_update_token
        return lastPromise = new Promise((resolve, reject) => {
            lastPromise.then(() => {
                return this.shouldWeakPut(parsedMindmap, true);
            }).then((shouldWeakPut) => {
                if (shouldWeakPut) {
                    this.putMindmap(parsedMindmap, true).then(() => {
                        resolve(true);
                    });
                } else {
                    resolve(false);
                }
            }).catch(resolve);
        });
    }
    getMindmaps = () => {
        return lastPromise = lastPromise.then(function () {
            return getMindmaps();
        });
    }
    deleteMindmap = mindmap => {
        return this.deleteMindmapKey(mindmap.static.id);
    }
    deleteMindmapKey = mindmapKey => {
        return lastPromise = new Promise(function (resolve, reject) {
            lastPromise.then(function () {
                return getMindmaps();
            }).then(function (mindmaps) {
                return indexedDBStorage.delete(indexDBItemPrefix + mindmapKey).then(function () {
                    delete mindmaps[mindmapKey];
                    cachedMindmaps = mindmaps;
                    try {
                        localStorage.setItem(mindmapsLocalstorageName, JSON.stringify(cachedMindmaps));
                    } catch (domException) {
                        if (domException.name === 'QuotaExceededError'
                            || domException.name === 'NS_ERROR_DOM_QUOTA_REACHED') {
                            alert('Unable to store data because you\'ve reached the maximum storage quota.');
                        }
                    }
                    resolve();
                });
            }).catch(resolve);
        });
    }
}

module.exports = new Storage();
