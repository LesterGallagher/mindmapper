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

function savableFormat(mindviews) {
    var retObj = {};
    Object.keys(mindviews).forEach(function (key) {
        const mm = mindviews[key];
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
const indexDBItemPrefix = 'mindview-items-';
const mindviewsLocalstorageName = 'mindviewer-mindviews-storage-v2';
let cachedMindviews = undefined;

let lastPromise = Promise.resolve();

const getMindviews = () => {
    return new Promise(function (resolve, reject) {
        if (cachedMindviews !== undefined) {
            resolve(cachedMindviews);
        } else {
            const set = JSON.parse(localStorage.getItem(mindviewsLocalstorageName) || '{}') || {};
            let mindviewItemsPromises = Object.keys(set).map(function (id) {
                return indexedDBStorage.get(indexDBItemPrefix + id)
                    .then(mm => {
                        set[id] = mm;
                    });
            });
            Promise.all(mindviewItemsPromises).then(function () {
                cachedMindviews = set;
                resolve(cachedMindviews);
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
                alert('You\'ve blocked mindviewer from settings cookies on the mindviewer website.'
                    + ' We don\'t send cookies or use cookies, except for anonimized analytics.'
                    + ' By blocking cookies you\'ve also blocked the saving of mindviews, bookmarks, favorites etc.'
                    + ' You can read our privacy statement here: https://esstudio.site/privacy-policy', {
                        title: 'Crash'
                    })
            }
            logError(err);
        }
    }

    static isFirstTimeAppOpening = () => {
        return !localStorage.getItem(mindviewsLocalstorageName);
    }

    static storageEstimateWrapper = () => this.storageEstimateWrapper();

    static getDB = () => indexedDBStorage;

    putMindview = (parsedMindview, skipLastPromise = false) => {
        return lastPromise = new Promise((resolve, reject) => {
            (skipLastPromise ? Promise.resolve() : lastPromise).then(() => {
                return getMindviews();
            }).then(function (mindviews) {
                mindviews[parsedMindview.static.id] = parsedMindview;
                cachedMindviews = mindviews;
                return indexedDBStorage.set(indexDBItemPrefix + parsedMindview.static.id, parsedMindview).then(function () {
                    var fmt = savableFormat(mindviews);
                    try {
                        localStorage.setItem(mindviewsLocalstorageName, JSON.stringify(fmt));
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

    shouldWeakPut = (parsedMindview, skipLastPromise = false) => {
        return lastPromise = new Promise((resolve, reject) => {
            // only put if mindview doesn't already exist 
            // and if the older mindview has another should_update_token


            (skipLastPromise ? Promise.resolve() : lastPromise).then(() => {
                return getMindviews();
            }).then(function (mindviews) {
                var should = !mindviews[parsedMindview.static.id]
                    || mindviews[parsedMindview.static.id].should_update_token !== parsedMindview.should_update_token;
                resolve(should);
            }).catch(err => {
                logError(err)
                resolve(true);
            });
        });
    }
    tryWeakPut = parsedMindview => {
        // only put if mindview doesn't already exist 
        // and if the older mindview has another should_update_token
        return lastPromise = new Promise((resolve, reject) => {
            lastPromise.then(() => {
                return this.shouldWeakPut(parsedMindview, true);
            }).then((shouldWeakPut) => {
                if (shouldWeakPut) {
                    this.putMindview(parsedMindview, true).then(() => {
                        resolve(true);
                    });
                } else {
                    resolve(false);
                }
            }).catch(resolve);
        });
    }
    getMindviews = () => {
        return lastPromise = lastPromise.then(function () {
            return getMindviews();
        });
    }
    deleteMindview = mindview => {
        return this.deleteMindviewKey(mindview.static.id);
    }
    deleteMindviewKey = mindviewKey => {
        return lastPromise = new Promise(function (resolve, reject) {
            lastPromise.then(function () {
                return getMindviews();
            }).then(function (mindviews) {
                return indexedDBStorage.delete(indexDBItemPrefix + mindviewKey).then(function () {
                    delete mindviews[mindviewKey];
                    cachedMindviews = mindviews;
                    try {
                        localStorage.setItem(mindviewsLocalstorageName, JSON.stringify(cachedMindviews));
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
