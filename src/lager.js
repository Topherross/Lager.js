/**
 * Created by christopherross on 8/6/15.
 */

(function (window) {
    'use strict';

    var iDB = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB,
    //iDBTransaction = window.IDBTransaction || window.webkitIDBTransaction || window.msIDBTransaction,
    //iDBKeyRange = window.IDBKeyRange || window.webkitIDBKeyRange || window.msIDBKeyRange,
        Lager;

    Lager = {
        db: null,

        create: function (database_name, database_version, store_name) {
            window.console.log("Creating DB…");

            var req = iDB.open(database_name, parseInt(database_version, 10));

            req.onsuccess = function (event) {
                this.db = event.target.result;
                window.console.log("DB Created!");
            }.bind(this);

            req.onerror = function () {
                window.console.error("Request Error:", this.errorCode);
            };

            req.onupgradeneeded = function (event) {
                window.console.log("Upgrade Needed");
                event.target.result.createObjectStore(store_name, {keyPath: 'id', autoIncrement: true});
            };

            return this;
        },

        insert: function (store_name, data) {

            var store = this.db.transaction(store_name, 'readwrite').objectStore(store_name),
                req;

            try {
                req = store.add(data);
            } catch (e) {
                if (e.name === 'DataCloneError') {
                    window.console.error("This engine doesn't know how to clone a Blob.");
                }
                throw e;
            }

            req.onsuccess = function () {
                window.console.log("Insertion into " + store_name + " successful");
            };

            req.onerror = function () {
                window.console.error("Add Record Error: ", this.error);
            };

            return this;
        },

        getById: function (store_name, key, callback) {
            var store = this.db.transaction(store_name, 'readonly').objectStore(store_name),
                req = store.get(parseInt(key, 10)),
                record;

            req.onsuccess = function () {
                record = this.result;

                if (undefined === record) {
                    record = 'Record: ' + key + ' not found.';
                }

                if (typeof callback === "function") {
                    callback(record);
                }
            };

            req.onerror = function () {
                window.console.error("getByKey:", this.errorCode);
            };

            return this;
        },

        getAll: function (store_name, callback) {
            var store = this.db.transaction(store_name, 'readonly').objectStore(store_name),
                req = store.openCursor(),
                records = [],
                cursor;

            req.onsuccess = function () {
                cursor = this.result;

                if (!cursor) {
                    if (typeof callback === "function") {
                        callback(records);
                    }
                    return;
                }

                records.push(cursor.value);
                cursor.continue();
            };

            req.onerror = function () {
                window.console.error("getAll:", this.errorCode);
            };

            return this;
        },

        deleteAll: function (store_name, callback) {
            var store = this.db.transaction(store_name, 'readwrite').objectStore(store_name),
                req = store.clear();

            req.onsuccess = function () {
                window.console.log('All Records Deleted.');

                if (typeof callback === "function") {
                    callback();
                }
            };

            req.onerror = function () {
                window.console.error("deleteAll:", this.errorCode);
            };

            return this;
        },

        deleteById: function (store_name, key, callback) {
            var store = this.db.transaction(store_name, 'readwrite').objectStore(store_name),
                req = store.get(parseInt(key, 10)),
                message,
                record;

            req.onsuccess = function () {
                record = this.result;

                if (undefined === record) {
                    message = 'Record: ' + key + ' not found.';

                    if (typeof callback === "function") {
                        callback(message);
                    }
                    return;
                }

                window.console.log('Record: ' + key + ' found.');

                req = store.delete(parseInt(key, 10));

                req.onsuccess = function () {
                    message = 'Record: ' + key + ' deleted.';

                    if (typeof callback === "function") {
                        callback(message);
                    }
                };

                req.onerror = function () {
                    message = "ERROR: deletePublication:" + this.errorCode;

                    if (typeof callback === "function") {
                        callback(message);
                    }
                };
            };

            req.onerror = function () {
                message = "ERROR: deleteById:" + this.errorCode;

                if (typeof callback === "function") {
                    callback(message);
                }
            };

            return this;
        }
    };

    if (typeof module === "object" && typeof module.exports === "object") {
        module.exports = Lager;
    } else {
        window.Lager = Lager;
    }
}(window));