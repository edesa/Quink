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

define([
], function () {
    'use strict';

    var QUINK_ROOT = 'quink',
        RES_DIR = QUINK_ROOT + '/resources',
        PLUGIN_DIR = QUINK_ROOT + '/plugins',
        PLUGIN_ADAPTER_DIR = QUINK_ROOT + '/pluginadapters',
        DIR_INDEX_FILE_NAME = 'index.html',
        root,
        rootRegExp,
        autoSaveUrl,
        saveUrl,
        urlParams = {};

    function resource(name) {
        return root + RES_DIR + '/' + name;
    }

    function plugin(name) {
        return root + PLUGIN_DIR + '/' + name;
    }

    function pluginAdapter(name) {
        return root + PLUGIN_ADAPTER_DIR + '/' + name;
    }

    function setRoot(value) {
        root = value || './';
        if (!/\/$/.test(root)) {
            root += '/';
        }
        rootRegExp = new RegExp('^' + root);
    }

    /**
     * Makes a value relative to the Quink root. To be of any use the value will be a url path.
     * This allows Quink to be deployed anywhere and keeps quink relative paths working.
     * Protect against adding the Quink root to the start of the same string more than once.
     */
    function makeQuinkRelative(value) {
        var result = value;
        if (!rootRegExp.test(result)) {
            if (/^\//.test(result)) {
                result = result.substr(1);
            }
            result = root + result;
        }
        return result;
    }

    function getParam(name, def) {
        var val = urlParams[name];
        return val === undefined ? def : val;
    }

    /**
     * Where auto save persists to.
     */
    function getAutoSaveUrl() {
        return autoSaveUrl;
    }

    /**
     * Where a user initiated save persists to.
     */
    function getSaveUrl() {
        return saveUrl;
    }

    /**
     * Assumes that the submit param, if present, is the last query parameter. This means that
     * the submit param value doesn't need to be encoded (although it really should be).
     */
    function getSubmitUrl() {
        var url = location.href,
            index = url.lastIndexOf('submit=');
        return index >= 0 ? url.substring(index + 7) : undefined;
    }

    /**
     * http://stackoverflow.com/a/2880929
     * Multiple params with the same name will result in only the last value being used.
     */
    function parseParams() {
        var search = location.search.substr(1),
            regex = /([^&=]+)=?([^&]*)/g,
            decode = function (s) {
                return decodeURIComponent(s.replace(/\+/g, " "));
            },
            match;
        while ((match = regex.exec(search)) !== null) {
            urlParams[decode(match[1])] = decode(match[2]);
        }
    }

    /**
      * Tests for a ul ending with a trailing '/'. This isn't really right as a directory url
      * doesnt have to end with a trailing slash, but it won't be possible to know if it's
      * a directory url unless it does and most servers will append the trailing slash onto
      * directory urls to avoid potential security problems.
      */
    function isDir(url) {
        return url.search(/\/$/) >= 0;
    }

    /**
     * Makes sure that the url refers to a file. If it's a directory then a file name is
     * added to make it a file url. This is to stop auto save from silently doing nothing if
     * the document url is a directory url. In that case auto save sucessfully saves back
     * to the directory utl, but does not update the user's document.
     * It's server rules that dictate what happens if a user navigates to a directory url
     * so anything we do here will be wrong in some situations. Hopefully this will be right
     * most of the time.
     */
    function ensureUrlIsFile(srcUrl) {
        var url = srcUrl;
        if (isDir(url)) {
            url += DIR_INDEX_FILE_NAME;
        }
        return url;
    }

    function isIos() {
        return /iPhone|iPad|iPod/i.test(navigator.platform);
    }

    function isAndroidChrome() {
        return /Android.*Chrome/.test(navigator.userAgent);
    }

    function init() {
        var origin = location.href.split('?')[0];
        setRoot(window.QUINK.root);
        delete window.QUINK.root;
        parseParams();
        autoSaveUrl = ensureUrlIsFile(getParam('autosave', origin));
        saveUrl = ensureUrlIsFile(origin);
    }

    return {
        resource: resource,
        plugin: plugin,
        pluginAdapter: pluginAdapter,
        setRoot: setRoot,
        init: init,
        getParam: getParam,
        getAutoSaveUrl: getAutoSaveUrl,
        getSaveUrl: getSaveUrl,
        getSubmitUrl: getSubmitUrl,
        makeQuinkRelative: makeQuinkRelative,
        isIos: isIos,
        isAndroidChrome: isAndroidChrome
    };
});
