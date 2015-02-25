/**
 * Copyright (c), 2013-2014 IMD - International Institute for Management Development, Switzerland.
 *
 * See the file license.txt for copying permission.
 */

/**
 * To use Quink as a component:
 *      - include the prebuilt/quink directory
 *      - load this script which must be in the same directory as quink
 */
(function (global) {
    'use strict';

    var QUINK_ROOT = 'quink',
        JS_DIR = QUINK_ROOT + '/js',
        JSLIB_DIR = JS_DIR + '/lib',
        RES_DIR = QUINK_ROOT + '/resources',
        CSS_DIR = RES_DIR + '/css',
        isAmdLoad = false,
        root;

    /**
     * Very simple check to see if there's a url query parameter with the given name. Value, including
     * the '=' is optional.
     */
    function hasQueryParam(name) {
        return new RegExp('[?&]' + name + '=?').test(location.search);
    }

    function getDir(dir) {
        var r = root || './';
        return r + dir;
    }

    /**
     * Loads main.js directly. This assumes main.js is the result of a build that will include an AMD loader.
     */
    function loadScripts() {
        var script = document.createElement('script'),
            head = document.getElementsByTagName('head')[0];
        script.setAttribute('src', getDir(JS_DIR) + '/main.js');
        head.appendChild(script);
    }

    /**
     * Loads main.js using require.js.
     */
    function loadRequireScripts() {
        var script = document.createElement('script'),
            head = document.getElementsByTagName('head')[0];
        script.setAttribute('data-main', getDir(JS_DIR) + '/main.js');
        script.setAttribute('src', getDir(JSLIB_DIR) + '/require.js');
        head.appendChild(script);
    }

    function loadStyleSheet() {
        var head = document.getElementsByTagName('head')[0],
            link = document.createElement('link');
        link.setAttribute('rel', 'stylesheet');
        link.setAttribute('href', getDir(CSS_DIR) + '/quink.css');
        head.appendChild(link);
    }

    /**
     * Works out the root directory for the quink distribution. Additionally decides whether to load scripts
     * or to leave that to require.js.
     */
    function calcRoot() {
        var scripts = document.querySelectorAll('script'),
            len = scripts.length,
            i, src, qi, script;
        for (i = 0; i < len; i++) {
            script = scripts[i];
            src = script.getAttribute('src');
            if (src) {
                qi = src.indexOf('quink.js');
                if (qi >= 0) {
                    root = src.substr(0, qi);
                    global.QUINK.root = root;
                    isAmdLoad = !!script.getAttribute('data-amdload');
                    break;
                }
            }
        }
    }

    global.QUINK = global.QUINK || {};
    calcRoot();
    loadStyleSheet();
    if (!isAmdLoad) {
        if (hasQueryParam('userequire')) {
            loadRequireScripts();
        } else {
            loadScripts();
        }
    }

}(window));
