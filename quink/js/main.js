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
        'rangy-core': 'lib/rangy-core',
        'rangy-textrange': 'lib/rangy-textrange',
        'rangy-classapplier': 'lib/rangy-classapplier',
        Underscore: 'lib/underscore',
        text: 'lib/text',
        resources: '../resources'
    },

    shim: {
        'Underscore': {
            exports: '_'
        }
    }
});

define([
    'App'
], function (App) {
    'use strict';

    App.init();
    return QUINK;
});

// require([
//     'App'
// ], function (App) {
//     'use strict';
//
//     App.init();
// });
