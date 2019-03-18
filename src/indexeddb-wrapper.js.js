module.exports = class IndexedDBStorage {
    constructor(name) {
        this.name = name;
        var self = this;
        this.ready = new Promise(function (resolve, reject) {
            var request = (window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB)
                .open(location.origin);

            request.onupgradeneeded = function (e) {
                self.db = e.target.result;
                self.db.createObjectStore(name);
            };

            request.onsuccess = function (e) {
                self.db = e.target.result;
                resolve();
            };

            request.onerror = function (e) {
                self.db = e.target.result;
                reject(e);
            };
        });
    }
    
    get = key => {
        var self = this;
        return this.ready.then(function () {
            return new Promise(function (resolve, reject) {
                var request = self.getStore().get(key);
                request.onsuccess = function (e) { resolve(e.target.result); };
                request.onerror = reject;
            });
        });
    }

    getStore = () => {
        var transaction = this.db.transaction([this.name], 'readwrite');
        transaction.onabort = function (e) {
            var error = e.target.error;
            if (error.name === 'QuotaExceededError') {
                alert('Unable to store data because you\'ve reached the maximum storage quota.', { cancelable: true, cancelable: true });
            }
        };
        return transaction.objectStore(this.name);
    }

    set = (key, value) => new Promise((resolve, reject) => this.ready.then(() => {
        var request = this.getStore().put(value, key);
        request.onsuccess = e => {
            resolve();
        };
        request.onerror = reject;
    }))

    delete = (key) => this.ready.then(() => new Promise((resolve, reject) => {
        var request = this.getStore().delete(key);
        request.onsuccess = resolve;
        request.onerror = reject;
    }))

    deleteDatabase = () => {
        window.indexedDB.deleteDatabase(location.origin);
    }
}