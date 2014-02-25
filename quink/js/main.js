/**
 * Quink, Copyright (c) 2013-2014 IMD - International Institute for Management Development, Switzerland.
 *
 * This file is part of Quink.
 * 
 * Quink is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Lesser General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Quink is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public License
 * along with Quink.  If not, see <http://www.gnu.org/licenses/>.
 */

require.config({
    baseUrl: 'quink/js',
    // Dev only for Mobile Safari to stop it caching the JS.
    // urlArgs: "bust=" + (new Date()).getTime(),

    paths: {
        jquery: 'lib/jquery-1.10.2',
        rangy: 'lib/rangy-core',
        textrange: 'lib/rangy-textrange',
        Underscore: 'lib/underscore'
    },

    shim: {
        'Underscore': {
            exports: '_'
        },
        'rangy': {
            exports: 'rangy'
        },
        'textrange': [ 'rangy' ]
    }
});

require([
    'App'
], function (App) {
    'use strict';

    App.init();
});
