/**
 * Copyright (c), 2013-2014 IMD - International Institute for Management Development, Switzerland.
 *
 * See the file license.txt for copying permission.
 */

/**
 * To use Quink as a component:
 *      - include the prebuilt/quink directory
 *      - load this script
 */
(function (global) {
    'use strict';

    var QUINK_ROOT = 'quink',
        JS_DIR = QUINK_ROOT + '/js',
        JSLIB_DIR = JS_DIR + '/lib',
        RES_DIR = QUINK_ROOT + '/resources',
        CSS_DIR = RES_DIR + '/css',
        root;

    function getDir(dir) {
        var r = root || './';
        return r + dir;
    }

    function loadScripts() {
        var script = document.createElement('script'),
            head = document.getElementsByTagName('head')[0];
        script.setAttribute('data-main', getDir(JS_DIR) + '/main.js');
        script.setAttribute('src', getDir(JSLIB_DIR) + '/require.js');
        script.onload = function () {
            console.log('Loaded require.js');
        };
        head.appendChild(script);
    }

    function loadStyleSheet() {
        var head = document.getElementsByTagName('head')[0],
            link = document.createElement('link');
        link.setAttribute('rel', 'stylesheet');
        link.setAttribute('href', getDir(CSS_DIR) + '/quink.css');
        link.onload = function () {
            console.log('Loaded css');
        };
        head.appendChild(link);
    }

    function calcRoot() {
        var scripts = document.querySelectorAll('script'),
            len = scripts.length,
            i, src, qi;
        for (i = 0; i < len; i++) {
            src = scripts[i].getAttribute('src');
            if (src) {
                qi = src.indexOf('quink.js');
                if (qi >= 0) {
                    root = src.substr(0, qi);
                    global.QUINK.root = root;
                    break;
                }
            }
        }
    }

    global.QUINK = global.QUINK || {};
    calcRoot();
    loadStyleSheet();
    loadScripts();

}(window));
