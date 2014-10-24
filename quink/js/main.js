/**
 * Copyright (c), 2013-2014 IMD - International Institute for Management Development, Switzerland.
 *
 * See the file license.txt for copying permission.
 */

require.config({
    // Dev only for Mobile Safari to stop it caching the JS.
    // urlArgs: "bust=" + (new Date()).getTime(),

    paths: {
        jquery: 'lib/jquery-2.1.1',
        rangy: 'lib/rangy-core',
        textrange: 'lib/rangy-textrange',
        cssapplier: 'lib/rangy-cssclassapplier',
        Underscore: 'lib/underscore'
    },

    shim: {
        'Underscore': {
            exports: '_'
        },
        'rangy': {
            exports: 'rangy'
        },
        'textrange': [ 'rangy' ],
        'cssapplier': [ 'rangy' ]
    }
});

require([
    'App'
], function (App) {
    'use strict';

    App.init();
});
