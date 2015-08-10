/**
 * Created by christopherross on 8/6/15.
 */

(function(window, document){
    'use strict';

    var iDB = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB,
        iDBTransaction = window.IDBTransaction || window.webkitIDBTransaction || window.msIDBTransaction,
        iDBKeyRange = window.IDBKeyRange || window.webkitIDBKeyRange || window.msIDBKeyRange,
        Lager;

    Lager = {
        db: null,

        create: function (database_name, database_version, store_name) {
            console.log("Creating DB…");

            var req = iDB.open(database_name, parseInt(database_version));

            req.onsuccess = function (event) {
              this.db = event.target.result;
              console.log("DB Created!");
            }.bind(this);

            req.onerror = function () {
              console.error("Request Error:", this.errorCode);
            };

            req.onupgradeneeded = function (event) {
              console.log("Upgrade Needed");
              event.target.result.createObjectStore(store_name, { keyPath: 'id', autoIncrement: true });
            };

            return this;
        },

        insert: function (store_name, data) {

            var store = this.db.transaction(store_name, 'readwrite').objectStore(store_name),
                req;

            try {
              req = store.add(data);
            } catch (e) {
              if (e.name == 'DataCloneError') {
                  console.error("This engine doesn't know how to clone a Blob.");
              }
              throw e;
            }

            req.onsuccess = function () {
              console.log("Insertion into " + store_name + " successful");
            };

            req.onerror = function() {
              console.error("Add Record Error: ", this.error);
            };

            return this;
        },

        getByKey: function (store_name, key, value) {
            var store = $db.transaction(store_name, 'readonly').objectStore(store_name),
                req;
        },

        getAll: function (store_name, callback) {
            var store = this.db.transaction([store_name], 'readonly').objectStore(store_name),
                cursor = store.openCursor(),
                records = [];

            cursor.onsuccess = function() {
                var cursor = this.result;

                if (!cursor) {
                    return;
                }

                records.push(cursor.value);
                cursor.continue();
            };

            return this;
        }
    };

    if (typeof module === "object" && typeof module.exports === "object") {
        module.exports = Lager;
    } else {
        window.Lager = Lager;
    }
})(window, document);