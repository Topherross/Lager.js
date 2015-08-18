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
        $dbs = {},
        Storage,
        Logger,
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

    Storage = {
        getDbs: function (callback) {
            if (undefined !== callback && typeof callback === 'function') {
                callback($dbs);
            }

            return this;
        },

        setDbs: function (callback) {
            var db, dbs = [], store, stores;

            for (db in $dbs) {
                if ($dbs.hasOwnProperty(db) && db !== 'length') {
                    stores = [];
                    if ($dbs[db].objectStoreNames.length > 0) {
                        for (store in $dbs[db].objectStoreNames) {
                            if ($dbs[db].objectStoreNames.hasOwnProperty(store) && store !== 'length') {
                                stores.push($dbs[db].objectStoreNames[store]);
                            }
                        }

                    }
                    dbs.push({database: $dbs[db].name, version: $dbs[db].version, stores: stores});
                }
            }

            localStorage.setItem('dbs', JSON.stringify(dbs));

            if (undefined !== callback && typeof callback === 'function') {
                callback(localStorage.getItem('dbs'));
            }

            return this;
        }
    };

    Lager = {
        getAllDB: function (callback) {
            Storage.getDbs(function (dbs) {
                if (undefined !== callback && typeof callback === 'function') {
                    callback(dbs);
                }
            });

            return this;
        },

        getDB: function (database_name, callback) {
            Storage.getDbs(function (dbs) {
                var db = dbs.hasOwnProperty(database_name) ? dbs[database_name] : null;
                if (undefined !== callback && typeof callback === 'function') {
                    callback(db);
                }
            });

            return this;
        },

        createDB: function (database_name, database_version, store_name, options) {
            options = options || {};
            var tx = iDB.open(database_name, parseInt(database_version, 10)),
                message,
                $options = {
                    onSuccess: options.onSuccess || null,
                    onError: options.onError || null
                };

            tx.onsuccess = function (event) {
                $dbs[database_name] = event.target.result;
                Storage.setDbs();
                message = 'DB ' + database_name + '(Version ' + database_version + ') Created!';
                Logger.log(message);

                $dbs[database_name].onversionchange = function () {
                    this.close();
                };

                if ($options.onSuccess !== null && typeof $options.onSuccess === 'function') {
                    $options.onSuccess({database: database_name, store: store_name, message: message});
                }
            }.bind(this);

            tx.onerror = function () {
                message = 'Request Error:' + this.errorCode;
                Logger.error(message);

                if ($options.onError !== null && typeof $options.onError === 'function') {
                    $options.onError({database: database_name, store: store_name, message: message});
                }
            };

            tx.onupgradeneeded = function () {
                message = 'Upgrade Needed';
                Logger.log(message);

                this.result.createObjectStore(store_name, {keyPath: 'id', autoIncrement: true});
                message = 'Store ' + store_name + ' successfully created!';
                Logger.log(message);

                if ($options.onSuccess !== null && typeof $options.onSuccess === 'function') {
                    $options.onSuccess({database: database_name, store: store_name, message: message});
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
                delete $dbs[database_name];
                Storage.setDbs();
                message = 'Deleted database: ' + database_name + ' successfully.';
                Logger.log(message);

                if ($options.onSuccess !== null && typeof $options.onSuccess === 'function') {
                    $options.onSuccess({database: database_name, message: message});
                }
            }.bind(this);

            tx.onerror = function () {
                message = 'Could not delete database: ' + database_name + '.';
                Logger.error(message);

                if ($options.onError !== null && typeof $options.onError === 'function') {
                    $options.onError({database: database_name, message: message});
                }
            };

            tx.onblocked = function () {
                message = 'Could not delete database: ' + database_name + ' due to the operation being blocked.';
                Logger.warn(message);

                if ($options.onError !== null && typeof $options.onError === 'function') {
                    $options.onError({database: database_name, message: message});
                }
            };

            return this;
        },

        insertRecord: function (database_name, store_name, data, options) {
            options = options || {};
            var store = $dbs[database_name].transaction(store_name, 'readwrite').objectStore(store_name),
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
                    Logger.error(message);

                    if ($options.onError !== null && typeof $options.onError === 'function') {
                        $options.onError({database: database_name, store: store_name, message: message});
                    }
                }
                throw e;
            }

            tx.onsuccess = function () {
                message = 'Insertion into ' + store_name + ' successful.';
                Logger.log(message);

                if ($options.onSuccess !== null && typeof $options.onSuccess === 'function') {
                    $options.onSuccess({database: database_name, store: store_name, message: message});
                }
            };

            tx.onerror = function () {
                message = 'Add Record Error: ' + this.error;
                Logger.error(message);

                if ($options.onError !== null && typeof $options.onError === 'function') {
                    $options.onError({database: database_name, store: store_name, message: message});
                }
            };

            return this;
        },

        getRecordById: function (database_name, store_name, key, options) {
            options = options || {};
            var store = $dbs[database_name].transaction(store_name, 'readonly').objectStore(store_name),
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
                    $options.onSuccess({database: database_name, store: store_name, record: record});
                }
            };

            tx.onerror = function () {
                Logger.error('getByKey:' + this.errorCode);

                if ($options.onError !== null && typeof $options.onError === 'function') {
                    $options.onError({database: database_name, store: store_name, record: record});
                }
            };

            return this;
        },

        deleteRecordById: function (database_name, store_name, key, options) {
            options = options || {};
            var store = $dbs[database_name].transaction(store_name, 'readwrite').objectStore(store_name),
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
                    Logger.warn(message);

                    if ($options.onSuccess !== null && typeof $options.onSuccess === 'function') {
                        $options.onSuccess({database: database_name, store: store_name, message: message});
                    }
                    return;
                }

                Logger.log('Record: ' + key + ' found.');

                tx = store.delete(parseInt(key, 10));

                tx.onsuccess = function () {
                    message = 'Record: ' + key + ' deleted.';
                    Logger.log(message);

                    if ($options.onSuccess !== null && typeof $options.onSuccess === 'function') {
                        $options.onSuccess({database: database_name, store: store_name, message: message});
                    }
                };

                tx.onerror = function () {
                    message = 'ERROR: deletePublication:' + this.errorCode;
                    Logger.error(message);

                    if ($options.onError !== null && typeof $options.onError === 'function') {
                        $options.onError({database: database_name, store: store_name, message: message});
                    }
                };
            };

            tx.onerror = function () {
                message = 'ERROR: deleteById:' + this.errorCode;
                Logger.error(message);

                if ($options.onError !== null && typeof $options.onError === 'function') {
                    $options.onError({database: database_name, store: store_name, message: message});
                }
            };

            return this;
        },

        getAllRecords: function (database_name, store_name, options) {
            options = options || {};
            var store = $dbs[database_name].transaction(store_name, 'readonly').objectStore(store_name),
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

                if (undefined === cursor || !cursor) {
                    message = 'Lookup complete!';
                    if ($options.onSuccess !== null && typeof $options.onSuccess === 'function') {
                        $options.onSuccess({database: database_name, store: store_name, records: records, message: message});
                    }
                    return;
                }

                Logger.log('Cursor at ' + cursor.key);
                records.push(cursor.value);
                cursor.continue();
            };

            tx.onerror = function () {
                message = 'getAll:' + this.errorCode;
                Logger.error(message);

                if ($options.onError !== null && typeof $options.onError === 'function') {
                    $options.onError({database: database_name, store: store_name, message: message});
                }
            };

            return this;
        },

        deleteAllRecords: function (database_name, store_name, options) {
            options = options || {};
            var store = $dbs[database_name].transaction(store_name, 'readwrite').objectStore(store_name),
                tx = store.clear(),
                message,
                $options = {
                    onSuccess: options.onSuccess || null,
                    onError: options.onError || null
                };

            tx.onsuccess = function () {
                message = 'All Records Deleted.';
                Logger.log(message);

                if ($options.onSuccess !== null && typeof $options.onSuccess === 'function') {
                    $options.onSuccess({database: database_name, store: store_name, message: message});
                }
            };

            tx.onerror = function () {
                message = 'deleteAll:' + this.errorCode;
                Logger.error(message);

                if ($options.onError !== null && typeof $options.onError === 'function') {
                    $options.onError({database: database_name, store: store_name, message: message});
                }
            };

            return this;
        }
    };

    if (localStorage.getItem('dbs') === null) {
        Storage.setDbs();
    } else {
        var db, dbs = JSON.parse(localStorage.getItem('dbs')), store, stores;

        if (dbs !== null) {
            for (db in dbs) {
                if (dbs.hasOwnProperty(db) && db !== 'length' && !$dbs.hasOwnProperty(db)) {
                    Lager.createDB(dbs[db].database, dbs[db].version, undefined === dbs[db].stores[0] ? dbs[db].database + '_store' : dbs[db].stores[0]);
                    //if ($dbs[db].objectStoreNames.length > 0) {
                    //    for (store in $dbs[db].objectStoreNames) {
                    //        if ($dbs[db].objectStoreNames.hasOwnProperty(store) && store !== 'length') {
                    //            stores.push($dbs[db].objectStoreNames[store]);
                    //        }
                    //    }
                    //
                    //}
                    //dbs.push({database: db, stores: stores});
                }
            }
        }
    }

    if (typeof module === 'object' && typeof module.exports === 'object') {
        module.exports = Lager;
    } else {
        window.Lager = Lager;
    }
}(window));