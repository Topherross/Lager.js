(function () {
    'use strict';

    //@TODO Change to const when ES6 becomes standard.
    var DB_NAME = 'stash_entries',
        DB_VERSION = 2,
        DB_STORE_NAME = 'entries';

    var form = document.querySelector('#contact_form'),
        output = document.querySelector('#output_target'),
        output_header = document.querySelector('#output_header'),
        dbs_content = document.querySelector('#dbs_content'),
        dbs_add_wrap = document.querySelector('#dbs_add_wrap'),
        $state = null,
        manager;

    function getAllRecordsHtml(database, store, records) {
        var ul = document.createElement('ul'), li, i, h6, del, view;

        if (undefined !== records && records.length > 0) {

            for (i = 0; i < records.length; i++) {
                view = document.createElement('button');
                del = document.createElement('button');
                li = document.createElement('li');
                h6 = document.createElement('h6');

                del.setAttribute('class', 'icon-button delete destroy-record');
                del.setAttribute('data-db', database);
                del.setAttribute('data-store', store);
                del.setAttribute('data-record', records[i].id);
                view.setAttribute('class', 'icon-button view view-record');
                view.setAttribute('data-db', database);
                view.setAttribute('data-store', store);
                view.setAttribute('data-record', records[i].id);
                view.innerHTML = 'View';
                del.innerHTML = 'Delete';
                h6.innerHTML = 'Key: ' + records[i].id;

                h6.appendChild(del);
                h6.appendChild(view);
                li.appendChild(h6);

                ul.appendChild(li);
            }

        }

        return ul;
    }

    function getRecordHtml(record) {
        var ul = document.createElement('ul'), li, i;

        if (undefined !== record) {
            console.log('Record Found!');

            if (typeof record !== 'string') {
                for (i in record) {
                    if (record.hasOwnProperty(i) && i !== 'length' && i !== '') {
                        li = document.createElement('li');

                        li.innerHTML = '<strong>' + i + '</strong>: ' + record[i];

                        ul.appendChild(li);
                    }

                }
            } else {
                li = document.createElement('li');
                li.innerHTML = record;
                ul.appendChild(li);
            }
        }

        return ul;
    }

    function getStoreHtml(stores, db) {
        var ul = document.createElement('ul'), li, h5, store, view, del_all, toggle, arrow;

        for (store in stores) {
            if (stores.hasOwnProperty(store) && store !== 'length') {
                li = document.createElement('li');
                h5 = document.createElement('h5');

                h5.innerHTML = stores[store];

                Lager.getAllRecords(db, stores[store], {
                    onSuccess: function (ret) {
                        if (ret.records.length > 0) {
                            del_all = document.createElement('button');
                            toggle = document.createElement('button');
                            arrow = document.createElement('span');
                            del_all.setAttribute('class', 'icon-button delete delete-all-records');
                            del_all.setAttribute('data-db', ret.database);
                            del_all.setAttribute('data-store', ret.store);
                            del_all.innerHTML = 'Delete All';
                            arrow.setAttribute('class', 'arrow toggle-arrow toggle-records-arrow');
                            toggle.setAttribute('class', 'toggle toggle-records');

                            toggle.innerHTML = arrow.outerHTML + ret.store;
                            h5.innerHTML = del_all.outerHTML + toggle.outerHTML;

                            li.appendChild(getAllRecordsHtml(ret.database, ret.store, ret.records));
                        }
                    }
                });

                li.appendChild(h5);
                ul.appendChild(li);
            }
        }

        return ul;
    }

    function getDBHtml(dbs) {
        var ul = document.createElement('ul'), li, h4, record, del, toggle, arrow;

        for (record in dbs) {
            if (dbs.hasOwnProperty(record) && record !== 'length') {
                li = document.createElement('li');
                del = document.createElement('button');
                h4 = document.createElement('h4');

                del.setAttribute('class', 'icon-button delete destroy-db');
                del.setAttribute('data-db', record);
                del.innerHTML = 'Delete';

                if (dbs[record].objectStoreNames.length > 0) {
                    toggle = document.createElement('button');
                    arrow = document.createElement('span');
                    arrow.setAttribute('class', 'arrow toggle-arrow toggle-store-arrow');
                    toggle.setAttribute('class', 'toggle toggle-stores');

                    toggle.innerHTML = arrow.outerHTML + record;
                    h4.innerHTML = del.outerHTML + toggle.outerHTML;
                    li.appendChild(h4);
                    li.appendChild(getStoreHtml(dbs[record].objectStoreNames, record));
                } else {
                    h4.innerHTML = record;
                    h4.appendChild(del);
                    li.appendChild(h4);
                }

                ul.appendChild(li);
            }
        }

        return ul;
    }

    function getAddDBHtml() {
        var wrap, form, db, store, submit, cancel;

        wrap = document.createElement('div');
        form = document.createElement('form');
        db = document.createElement('input');
        store = document.createElement('input');
        submit = document.createElement('button');
        cancel = document.createElement('button');

        wrap.setAttribute('id', 'add_db_form_wrap');
        db.setAttribute('type', 'text');
        db.setAttribute('name', 'database');
        db.setAttribute('placeholder', 'Database Name');
        store.setAttribute('type', 'text');
        store.setAttribute('name', 'store');
        store.setAttribute('placeholder', 'Store Name');
        submit.setAttribute('type', 'submit');
        cancel.setAttribute('class', 'cancel-add-db');
        submit.innerHTML = 'Add';
        cancel.innerHTML = 'Cancel';

        form.appendChild(db);
        form.appendChild(store);
        form.appendChild(cancel);
        form.appendChild(submit);
        wrap.appendChild(form);

        form.addEventListener('submit', function (event) {
            event.preventDefault();

            if (db.value === '') {
                return;
            }
            dbs_add_wrap.innerHTML = '';
            Lager.createDB(db.value.split(' ').join('_'), 1, store.value === '' ? db.value.split(' ').join('_') + '_store' : store.value.split(' ').join('_'), {
                onSuccess: function () {
                    Lager.getAllDB(function (dbs) {
                        dbs_content.innerHTML = '';
                        dbs_content.appendChild(getDBHtml(dbs));
                    });
                }
            });
        }, false);

        return wrap;
    }

    function hideToolbar() {
        dbs_add_wrap.innerHTML = '';
        return document.body.classList.remove('menu-open');
    }

    function showToolbar() {
        return document.body.classList.add('menu-open');
    }

    function stateManager() {
        if (undefined === this) {
            console.error("stateManager must be created with the 'new' keyword.");
        }

        var state_els = document.querySelectorAll('.page-state'),
            states = {},
            state,
            page,
            default_page = null,
            hide = function (el) {
                el.style.display = 'none';
            },
            show = function (el) {
                el.style.display = 'block';
            };

        if (state_els !== null) {
            for (state = 0; state < state_els.length; state++) {
                page = state_els[state].getAttribute('data-state');
                states[page] = state_els[state];

                if (state_els[state].classList.contains('default-state') && $state === null && default_page === null) {
                    default_page = page;
                }
            }
        }

        this.setState = function (state) {
            if (states.hasOwnProperty(state)) {
                hideToolbar();
                if ($state !== null) {
                    hide(states[$state]);
                }

                show(states[state]);
                $state = state;
            }

            return this;
        };

        this.getCurrentState = function () {
            return $state;
        };

        if (default_page !== null) {
            this.setState(default_page);
        }
    }

    function toCapFirst(string) {
        var str_array = string.split(' '), i;

        for (i = 0; i < str_array.length; i += 1) {
            str_array[i] = str_array[i].charAt(0).toUpperCase() + str_array[i].slice(1);
        }

        return str_array.join(' ');
    }

    Lager.createDB('test_1', 1, 'test_1_store');
    Lager.createDB('test_2', 1, 'test_2_store');
    Lager.createDB('test_3', 1, 'test_3_store');
    Lager.createDB('test_4', 1, 'test_4_store', {
        onSuccess: function () {
//                Lager.createStore('test_4', 'test', {
//                    indices: [
//                        ['email', 'email', true, false],
//                        ['first_name', 'first_name', false, false],
//                        ['last_name', 'last_name', false, false]
//                    ]
//                });
            Lager.createDB(DB_NAME, DB_VERSION, DB_STORE_NAME, {
                onSuccess: function () {
                    Lager.getAllDB(function (dbs) {
                        dbs_content.innerHTML = '';
                        dbs_content.appendChild(getDBHtml(dbs));
                    });
                }
            });
        }
    });

    manager = new stateManager();

    form.addEventListener('submit', function (event) {
        hideToolbar();
        event.preventDefault();

        var data = {}, i, type, selection;

        for (i = 0; i < form.elements.length; i++) {
            type = form.elements[i].type.toLowerCase();

            if (undefined !== type && (type !== "submit" && type !== "reset" && type !== "button")) {
                if ((type === "radio" || type === "checkbox")) {
                    if (!form.elements[i].checked) {
                        data[form.elements[i].name] = "";
                    } else {
                        data[form.elements[i].name] = form.elements[i].value;
                    }
                } else if (type === "select-multiple") {
                    for (selection = 0; selection < form.elements[i].children.length; selection++) {
                        if (form.elements[i].children[selection].selected) {
                            data[form.elements[i].name] = form.elements[i].children[selection].value;
                        }
                    }
                } else {
                    data[form.elements[i].name] = form.elements[i].value;
                }
            }
        }

        Lager.insertRecord(DB_NAME, DB_STORE_NAME, data, {
            onSuccess: function () {
                Lager.getAllDB(function (dbs) {
                    dbs_content.innerHTML = '';
                    dbs_content.appendChild(getDBHtml(dbs));
                });
            }
        });

    }, false);

    document.body.addEventListener('click', function (event) {
        var target = event.target || event.srcElement,
            db = target.getAttribute('data-db');

        if (target.classList.contains('destroy-db')) {
            console.log('Destroy DB: ' + db + ' Clicked!');

            Lager.destroyDB(db, {
                onSuccess: function () {
                    target.parentNode.parentNode.parentNode.removeChild(target.parentNode.parentNode);
                }
            });
        }

        if (target.classList.contains('add-db')) {
            console.log('Add DB Clicked!');
            dbs_add_wrap.innerHTML = '';
            dbs_add_wrap.appendChild(getAddDBHtml());
        }

        if (target.classList.contains('cancel-add-db')) {
            console.log('Cancel Add DB Clicked!');
            dbs_add_wrap.innerHTML = '';
        }

        if (target.classList.contains('view-store')) {
            console.log('View Store: ' + target.getAttribute('data-store') + ' Clicked!');
            output.innerHTML = output_header.innerHTML = '';

            Lager.getAllRecords(target.getAttribute('data-db'), target.getAttribute('data-store'), {
                onSuccess: function (ret) {
                    output.innerHTML = '';
                    if (ret.records.length > 0) {
                        output.appendChild(getAllRecordsHtml(ret.database, ret.store, ret.records));
                    } else {
                        output.innerHTML = 'No records found in: ' + target.getAttribute('data-db') + ' > ' + target.getAttribute('data-store');
                    }
                }
            });

            output_header.innerHTML = 'All Records in: ' + target.getAttribute('data-db') + ' > ' + target.getAttribute('data-store');
            manager.setState('output');
        }

        if (target.hasAttribute('id') && target.getAttribute('id') === "toolbar_toggle") {
            console.log('Toggle Toolbar Clicked!');

            window.scrollTo(0, 0);
            if (document.body.classList.contains('menu-open')) {
                hideToolbar();
            } else {
                showToolbar();
            }
        }

        if (target.hasAttribute('id') && target.getAttribute('id') === "back") {
            console.log('Back to Registration Form Clicked!');

            hideToolbar();
            manager.setState('form');
            output.innerHTML = '';
        }

        if (target.classList.contains('toggle') || target.classList.contains('toggle-arrow')) {
            if (target.classList.contains('open') || target.parentNode.classList.contains('open')) {
                var i, o, children;
                if (target.classList.contains('toggle-arrow')) {
                    target.parentNode.classList.remove('open');
                    target.parentNode.parentNode.parentNode.classList.remove('open');
                    children = target.parentNode.parentNode.parentNode.querySelectorAll('ul .open');

                    if (children !== null) {
                        for (i = 0; i < children.length; i += 1) {
                            if (children[i].classList.contains('open')) {
                                children[i].classList.remove('open');
                            }
                        }
                    }
                } else {
                    target.classList.remove('open');
                    target.parentNode.parentNode.classList.remove('open');
                    children = target.parentNode.parentNode.querySelectorAll('ul .open');

                    if (children !== null) {
                        for (o = 0; o < children.length; o += 1) {
                            if (children[o].classList.contains('open')) {
                                children[o].classList.remove('open');
                            }
                        }
                    }
                }
            } else {
                if (target.classList.contains('toggle-arrow')) {
                    target.parentNode.classList.add('open');
                    target.parentNode.parentNode.parentNode.classList.add('open');
                } else {
                    target.classList.add('open');
                    target.parentNode.parentNode.classList.add('open');
                }
            }
        }

        if (target.classList.contains('destroy-record')) {
            window.console.log('Destroy Record ' + target.getAttribute('data-record') + ' Clicked!');

            Lager.deleteRecordById(target.getAttribute('data-db'), target.getAttribute('data-store'), target.getAttribute('data-record'), {
                onSuccess: function () {
                    target.parentNode.parentNode.parentNode.removeChild(target.parentNode.parentNode);
                }
            });
        }

        if (target.classList.contains('delete-all-records')) {
            window.console.log('Destroy All Records from ' + target.getAttribute('data-store') + ' Clicked!');
            Lager.deleteAllRecords(target.getAttribute('data-db'), target.getAttribute('data-store'), {
                onSuccess: function (ret) {
                    Lager.getAllDB(function (dbs) {
                        dbs_content.innerHTML = '';
                        dbs_content.appendChild(getDBHtml(dbs));
                    });
                }
            });
        }

        if (target.classList.contains('view-record')) {
            window.console.log('View Record ' + target.getAttribute('data-record') + ' Clicked!');
            Lager.getRecordById(target.getAttribute('data-db'), target.getAttribute('data-store'), target.getAttribute('data-record'), {
                onSuccess: function (ret) {
                    console.log(getRecordHtml(ret.record));
                    hideToolbar();
                    output.innerHTML = output_header.innerHTML = '';
                    output_header.innerHTML = 'Record ' + ret.record.id;
                    output.appendChild(getRecordHtml(ret.record));
                    manager.setState('output');
                }
            });
        }

    }, false);

}());
