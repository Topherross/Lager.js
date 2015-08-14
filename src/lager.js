/**
 * Created by christopherross on 8/6/15.
 */

(function (window) {
    'use strict';

    /**
     * @var iDB = indexedDB
     */
    var iDB = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB,
    //iDBTransaction = window.IDBTransaction || window.webkitIDBTransaction || window.msIDBTransaction,
    //iDBKeyRange = window.IDBKeyRange || window.webkitIDBKeyRange || window.msIDBKeyRange,
        Lager;

    Lager = {
        db: null,

        create: function (database_name, database_version, store_name) {
            window.console.log('Creating DB…');

            var tx = iDB.open(database_name, parseInt(database_version, 10));

            tx.onsuccess = function (event) {
                this.db = event.target.result;
                window.console.log('DB Created!');
            }.bind(this);

            tx.onerror = function () {
                window.console.error('Request Error:', this.errorCode);
            };

            tx.onupgradeneeded = function (event) {
                window.console.log('Upgrade Needed');
                event.target.result.createObjectStore(store_name, {keyPath: 'id', autoIncrement: true});
            };

            return this;
        },

        destroy: function (database_name) {
            var tx = iDB.deleteDatabase(database_name);

            tx.onsuccess = function () {
                this.db = null;
                window.console.log('Deleted database: ' + database_name + ' successfully');
            }.bind(this);

            tx.onerror = function () {
                window.console.error('Could not delete database: ' + database_name);
            };

            tx.onblocked = function () {
                window.console.warn('Could not delete database: ' + database_name + ' due to the operation being blocked.');
            };

            return this;
        },

        insert: function (store_name, data) {

            var store = this.db.transaction(store_name, 'readwrite').objectStore(store_name),
                tx;

            try {
                tx = store.add(data);
            } catch (e) {
                if (e.name === 'DataCloneError') {
                    window.console.error('This engine does not know how to clone a Blob.');
                }
                throw e;
            }

            tx.onsuccess = function () {
                window.console.log('Insertion into ' + store_name + ' successful');
            };

            tx.onerror = function () {
                window.console.error('Add Record Error: ', this.error);
            };

            return this;
        },

        getById: function (store_name, key, callback) {
            var store = this.db.transaction(store_name, 'readonly').objectStore(store_name),
                tx = store.get(parseInt(key, 10)),
                record;

            tx.onsuccess = function () {
                record = this.result;

                if (undefined === record) {
                    record = 'Record: ' + key + ' not found.';
                }

                if (typeof callback === 'function') {
                    callback(record);
                }
            };

            tx.onerror = function () {
                window.console.error('getByKey:', this.errorCode);
            };

            return this;
        },

        getAll: function (store_name, callback) {
            var store = this.db.transaction(store_name, 'readonly').objectStore(store_name),
                tx = store.openCursor(),
                records = [],
                cursor;

            tx.onsuccess = function () {
                cursor = this.result;

                if (!cursor) {
                    if (typeof callback === 'function') {
                        callback(records);
                    }
                    return;
                }

                records.push(cursor.value);
                cursor.continue();
            };

            tx.onerror = function () {
                window.console.error('getAll:', this.errorCode);
            };

            return this;
        },

        deleteAll: function (store_name, callback) {
            var store = this.db.transaction(store_name, 'readwrite').objectStore(store_name),
                tx = store.clear();

            tx.onsuccess = function () {
                window.console.log('All Records Deleted.');

                if (typeof callback === 'function') {
                    callback();
                }
            };

            tx.onerror = function () {
                window.console.error('deleteAll:', this.errorCode);
            };

            return this;
        },

        deleteById: function (store_name, key, callback) {
            var store = this.db.transaction(store_name, 'readwrite').objectStore(store_name),
                tx = store.get(parseInt(key, 10)),
                message,
                record;

            tx.onsuccess = function () {
                record = this.result;

                if (undefined === record) {
                    message = 'Record: ' + key + ' not found.';

                    if (typeof callback === 'function') {
                        callback(message);
                    }
                    return;
                }

                window.console.log('Record: ' + key + ' found.');

                tx = store.delete(parseInt(key, 10));

                tx.onsuccess = function () {
                    message = 'Record: ' + key + ' deleted.';

                    if (typeof callback === 'function') {
                        callback(message);
                    }
                };

                tx.onerror = function () {
                    message = 'ERROR: deletePublication:' + this.errorCode;

                    if (typeof callback === 'function') {
                        callback(message);
                    }
                };
            };

            tx.onerror = function () {
                message = 'ERROR: deleteById:' + this.errorCode;

                if (typeof callback === 'function') {
                    callback(message);
                }
            };

            return this;
        }
    };

    if (typeof module === 'object' && typeof module.exports === 'object') {
        module.exports = Lager;
    } else {
        window.Lager = Lager;
    }
}(window));