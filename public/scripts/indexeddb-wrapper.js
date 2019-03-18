  /* Indexed DB Wrapper */
  "use strict";

  function _instanceof(left, right) {
      if (
          right != null &&
          typeof Symbol !== "undefined" &&
          right[Symbol.hasInstance]
      ) {
          return right[Symbol.hasInstance](left);
      } else {
          return left instanceof right;
      }
  }

  function _classCallCheck(instance, Constructor) {
      if (!_instanceof(instance, Constructor)) {
          throw new TypeError("Cannot call a class as a function");
      }
  }

  function _defineProperty(obj, key, value) {
      if (key in obj) {
          Object.defineProperty(obj, key, {
              value: value,
              enumerable: true,
              configurable: true,
              writable: true
          });
      } else {
          obj[key] = value;
      }
      return obj;
  }

  var IndexedDBStorage = function IndexedDBStorage(name) {
      var _this = this;

      _classCallCheck(this, IndexedDBStorage);

      _defineProperty(this, "get", function (key) {
          var self = _this;
          return _this.ready.then(function () {
              return new Promise(function (resolve, reject) {
                  var request = self.getStore().get(key);

                  request.onsuccess = function (e) {
                      resolve(e.target.result);
                  };

                  request.onerror = reject;
              });
          });
      });

      _defineProperty(this, "getStore", function () {
          var transaction = _this.db.transaction([_this.name], "readwrite");

          transaction.onabort = function (e) {
              var error = e.target.error;

              if (error.name === "QuotaExceededError") {
                  alert(
                      "Unable to store data because you've reached the maximum storage quota.",
                      _defineProperty(
                          {
                              cancelable: true
                          },
                          "cancelable",
                          true
                      )
                  );
              }
          };

          return transaction.objectStore(_this.name);
      });

      _defineProperty(this, "set", function (key, value) {
          return new Promise(function (resolve, reject) {
              return _this.ready.then(function () {
                  var request = _this.getStore().put(value, key);

                  request.onsuccess = function (e) {
                      resolve();
                  };

                  request.onerror = reject;
              });
          });
      });

      _defineProperty(this, "delete", function (key) {
          return _this.ready.then(function () {
              return new Promise(function (resolve, reject) {
                  var request = _this.getStore().delete(key);

                  request.onsuccess = resolve;
                  request.onerror = reject;
              });
          });
      });

      _defineProperty(this, "deleteDatabase", function () {
          window.indexedDB.deleteDatabase(location.origin);
      });

      this.name = name;

      var _self = this;

      this.ready = new Promise(function (resolve, reject) {
          var request = (
              window.indexedDB ||
              window.mozIndexedDB ||
              window.webkitIndexedDB
          ).open(location.origin);

          request.onupgradeneeded = function (e) {
              _self.db = e.target.result;

              _self.db.createObjectStore(name);
          };

          request.onsuccess = function (e) {
              _self.db = e.target.result;
              resolve();
          };

          request.onerror = function (e) {
              _self.db = e.target.result;
              reject(e);
          };
      });
  };