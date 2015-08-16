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
        Logger,
        $logger,
        Lager;

    Logger = {
        log: function (message) {
            if (undefined !== window.console) {
                window.console.log(message);
            }

            return this;
        },

        warn: function (message) {
            if (undefined !== window.console) {
                window.console.warn(message);
            }

            return this;
        },

        error: function (message) {
            if (undefined !== window.console) {
                window.console.error(message);
            }

            return this;
        }
    };

    $logger = Object.create(Logger);
    Lager = {
        dbs: {},

        createDB: function (database_name, database_version, store_name, options) {
            options = options || {};
            var tx = iDB.open(database_name, parseInt(database_version, 10)),
                message,
                $options = {
                    onSuccess: options.onSuccess || null,
                    onError: options.onError || null
                };

            tx.onsuccess = function (event) {
                this.dbs[database_name] = event.target.result;
                message = 'DB ' + database_name + '(Version ' + database_version + ') Created!';
                $logger.log(message);

                if ($options.onSuccess !== null && typeof $options.onSuccess === 'function') {
                    $options.onSuccess(message);
                }
            }.bind(this);

            tx.onerror = function () {
                message = 'Request Error:' + this.errorCode;
                $logger.error(message);

                if ($options.onError !== null && typeof $options.onError === 'function') {
                    $options.onError(message);
                }
            };

            tx.onupgradeneeded = function () {
                message = 'Upgrade Needed';
                $logger.log(message);

                this.result.createObjectStore(store_name, {keyPath: 'id', autoIncrement: true});
                message = 'Store ' + store_name + ' successfully created!';
                $logger.log(message);

                if ($options.onSuccess !== null && typeof $options.onSuccess === 'function') {
                    $options.onSuccess(message);
                }
            };

            return this;
        },

        destroyDB: function (database_name, options) {
            options = options || {};
            var tx = iDB.deleteDatabase(database_name),
                message,
                $options = {
                    onSuccess: options.onSuccess || null,
                    onError: options.onError || null
                };

            tx.onsuccess = function () {
                delete this.dbs[database_name];
                message = 'Deleted database: ' + database_name + ' successfully.';
                $logger.log(message);

                if ($options.onSuccess !== null && typeof $options.onSuccess === 'function') {
                    $options.onSuccess(message);
                }
            }.bind(this);

            tx.onerror = function () {
                message = 'Could not delete database: ' + database_name + '.';
                $logger.error(message);

                if ($options.onError !== null && typeof $options.onError === 'function') {
                    $options.onError(message);
                }
            };

            tx.onblocked = function () {
                message = 'Could not delete database: ' + database_name + ' due to the operation being blocked.';
                $logger.warn(message);

                if ($options.onError !== null && typeof $options.onError === 'function') {
                    $options.onError(message);
                }
            };

            return this;
        },

        insertRecord: function (database_name, store_name, data, options) {
            options = options || {};
            var store = this.dbs[database_name].transaction(store_name, 'readwrite').objectStore(store_name),
                message,
                tx,
                $options = {
                    onSuccess: options.onSuccess || null,
                    onError: options.onError || null
                };

            try {
                tx = store.add(data);
            } catch (e) {
                if (e.name === 'DataCloneError') {
                    message = 'This engine does not know how to clone a Blob.';
                    $logger.error(message);

                    if ($options.onError !== null && typeof $options.onError === 'function') {
                        $options.onError(message);
                    }
                }
                throw e;
            }

            tx.onsuccess = function () {
                message = 'Insertion into ' + store_name + ' successful.';
                $logger.log(message);

                if ($options.onSuccess !== null && typeof $options.onSuccess === 'function') {
                    $options.onSuccess(message);
                }
            };

            tx.onerror = function () {
                message = 'Add Record Error: ' + this.error;
                $logger.error(message);

                if ($options.onError !== null && typeof $options.onError === 'function') {
                    $options.onError(message);
                }
            };

            return this;
        },

        getRecordById: function (database_name, store_name, key, options) {
            options = options || {};
            var store = this.dbs[database_name].transaction(store_name, 'readonly').objectStore(store_name),
                tx = store.get(parseInt(key, 10)),
                record = null,
                $options = {
                    onSuccess: options.onSuccess || null,
                    onError: options.onError || null
                };

            tx.onsuccess = function () {
                record = this.result;

                if (undefined === record) {
                    record = 'Record: ' + key + ' not found.';
                }

                if ($options.onSuccess !== null && typeof $options.onSuccess === 'function') {
                    $options.onSuccess(record);
                }
            };

            tx.onerror = function () {
                $logger.error('getByKey:' + this.errorCode);

                if ($options.onError !== null && typeof $options.onError === 'function') {
                    $options.onError(record);
                }
            };

            return this;
        },

        getAllRecords: function (database_name, store_name, options) {
            options = options || {};
            var store = this.dbs[database_name].transaction(store_name, 'readonly').objectStore(store_name),
                tx = store.openCursor(),
                records = [],
                cursor,
                message,
                $options = {
                    onSuccess: options.onSuccess || null,
                    onError: options.onError || null
                };

            tx.onsuccess = function () {
                cursor = this.result;

                if (!cursor) {
                    message = 'Lookup complete!';
                    if ($options.onSuccess !== null && typeof $options.onSuccess === 'function') {
                        $options.onSuccess(records, message);
                    }
                    return;
                }

                $logger.log('Cursor at ' + cursor.keyPath);
                records.push(cursor.value);
                cursor.continue();
            };

            tx.onerror = function () {
                message = 'getAll:' + this.errorCode;
                $logger.error(message);

                if ($options.onError !== null && typeof $options.onError === 'function') {
                    $options.onError(message);
                }
            };

            return this;
        },

        deleteAllRecords: function (database_name, store_name, options) {
            options = options || {};
            var store = this.dbs[database_name].transaction(store_name, 'readwrite').objectStore(store_name),
                tx = store.clear(),
                message,
                $options = {
                    onSuccess: options.onSuccess || null,
                    onError: options.onError || null
                };

            tx.onsuccess = function () {
                message = 'All Records Deleted.';
                $logger.log(message);

                if ($options.onSuccess !== null && typeof $options.onSuccess === 'function') {
                    $options.onSuccess(message);
                }
            };

            tx.onerror = function () {
                message = 'deleteAll:' + this.errorCode;
                $logger.error(message);

                if ($options.onError !== null && typeof $options.onError === 'function') {
                    $options.onError(message);
                }
            };

            return this;
        },

        deleteRecordById: function (database_name, store_name, key, options) {
            options = options || {};
            var store = this.dbs[database_name].transaction(store_name, 'readwrite').objectStore(store_name),
                tx = store.get(parseInt(key, 10)),
                message,
                record,
                $options = {
                    onSuccess: options.onSuccess || null,
                    onError: options.onError || null
                };

            tx.onsuccess = function () {
                record = this.result;

                if (undefined === record) {
                    message = 'Record: ' + key + ' not found.';
                    $logger.warn(message);

                    if ($options.onSuccess !== null && typeof $options.onSuccess === 'function') {
                        $options.onSuccess(message);
                    }
                    return;
                }

                $logger.log('Record: ' + key + ' found.');

                tx = store.delete(parseInt(key, 10));

                tx.onsuccess = function () {
                    message = 'Record: ' + key + ' deleted.';
                    $logger.log(message);

                    if ($options.onSuccess !== null && typeof $options.onSuccess === 'function') {
                        $options.onSuccess(message);
                    }
                };

                tx.onerror = function () {
                    message = 'ERROR: deletePublication:' + this.errorCode;
                    $logger.error(message);

                    if ($options.onError !== null && typeof $options.onError === 'function') {
                        $options.onError(message);
                    }
                };
            };

            tx.onerror = function () {
                message = 'ERROR: deleteById:' + this.errorCode;
                $logger.error(message);

                if ($options.onError !== null && typeof $options.onError === 'function') {
                    $options.onError(message);
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