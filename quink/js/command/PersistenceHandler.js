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

/*global alert, QUINK */
define([
    'Underscore',
    'jquery',
    'util/Env',
    'util/DomUtil'
], function (_, $, Env, DomUtil) {
    'use strict';

    var PersistenceHandler = function () {
    };

    PersistenceHandler.prototype.emptyNode = function (node) {
        while (node.firstChild) {
            node.removeChild(node.firstChild);
        }
        return node;
    };

    PersistenceHandler.prototype.createDoc = function (pageSrc) {
        var doc = document.implementation.createHTMLDocument();
        doc.documentElement.innerHTML = pageSrc;
        return doc;
    };

    PersistenceHandler.prototype.setPageSrc = function (src) {
        this.origDoc = this.createDoc(src);
    };

    PersistenceHandler.prototype.copyBody = function (srcDoc, destDoc) {
        var srcBody = srcDoc.body,
            destBody = destDoc.body,
            srcNodes, i, length, node, iNode;
        if (srcBody.hasChildNodes()) {
            srcNodes = srcBody.childNodes;
            for (i = 0, length = srcNodes.length; i < length; i++) {
                node = srcNodes[i];
                if (DomUtil.isWithinDocument(node)) {
                    iNode = destDoc.importNode(node, true);
                    if (iNode.nodeType === 1) {
                        iNode.classList.remove('qk_command_mode');
                    }
                    destBody.appendChild(iNode);
                }
            }
        }
        return destDoc;
    };

    /**
     * Returns the original page updated with the current body minus any Quink specific artifacts.
     */
    PersistenceHandler.prototype.updateBody = function (srcDoc, destDoc) {
        this.emptyNode(destDoc.body);
        return this.copyBody(srcDoc, destDoc);
    };

    /**
     * Serialize the doc type. Will probably always be just dt.name, but the rest left in
     * just in case. Taken from http://stackoverflow.com/a/10409553.
     */
    PersistenceHandler.prototype.getDocTypeString = function (doc) {
        var dt;
        if (!this.docTypeString) {
            dt = doc.doctype;
            this.docTypeString = '<!DOCTYPE ' +
                dt.name +
                (dt.publicId ? ' PUBLIC "' +  dt.publicId + '"' : '') +
                (dt.systemId ? ' "' + dt.systemId + '"' : '') + '>';
        }
        return this.docTypeString;
    };

    /**
     * To provide callbacks on success or failure, attach to the returned promise object.
     * done and fail are the usual options but there are others.
     */
    PersistenceHandler.prototype.persistPage = function (theDoc, method, url, func, opts) {
        var doc = this.updateBody(document, theDoc),
            docType = this.getDocTypeString(doc),
            options;
        if (_.isFunction(func)) {
            doc = func.call(this, doc);
        }
        options = _.extend({
            url: url,
            method: method,
            data: docType + '\n' + doc.documentElement.outerHTML
        }, opts);
        return $.ajax(options);
    };

    /**
     * Removes the Quink script tag and any contenteditable attributes from the page.
     */
    PersistenceHandler.prototype.makeReadOnly = function (doc) {
        var scriptTag = doc.querySelector('script[src*="quink.js"]'),
            editables = doc.querySelectorAll('[contenteditable="true"]'),
            i, length, ed;
        if (scriptTag) {
            scriptTag.parentNode.removeChild(scriptTag);
        }
        for (i = 0, length = editables.length; i < length; i++) {
            ed = editables[i];
            ed.removeAttribute('contenteditable');
            ed.classList.remove('qk_command_mode');
        }
        return doc;
    };

    PersistenceHandler.prototype.doAutoSave = function (opts) {
        return this.isAutoSaveLocal() ?
            this.autoSaveLocalStorage(this.origDoc) :
            this.persistPage(this.origDoc, 'PUT', Env.getAutoSaveUrl(), null, opts);
    };

    /**
     * Invoked when leaving the page. Have to make the call synchronous for the
     * process to succeed in that scenario.
     */
    PersistenceHandler.prototype.unloadSave = function () {
        return this.doAutoSave({
            async: false
        });
    };

    PersistenceHandler.prototype.getLocalStorageKey = function () {
        return window.location.pathname.toLowerCase();
    };

    PersistenceHandler.prototype.autoSaveLocalStorage = function (theDoc) {
        var doc = this.updateBody(document, theDoc),
            docType = this.getDocTypeString(doc),
            key = this.getLocalStorageKey(),
            deferred = $.Deferred();
        try {
            window.localStorage.setItem(key, docType + '\n' + doc.documentElement.outerHTML);
            deferred.resolve();
        } catch (e) {
            deferred.reject(e);
        }
        return deferred.promise();
    };

    PersistenceHandler.prototype.isAutoSaveLocal = function () {
        return Env.getParam('autosaveto') === 'browser' && window.localStorage !== undefined;
    };

    /**
     * Used by auto save for all cases other than page unload.
     */
    PersistenceHandler.prototype.autoSave = function () {
        return this.doAutoSave();
    };

    /**
     * User initiated save. Delete the auto save if local storage is being used and if the user initiated
     * save was successful.
     */
    PersistenceHandler.prototype.save = function () {
        var promise = typeof QUINK.save === 'function' ?
            this.customSave(this.origDoc, QUINK.save, Env.getSaveUrl()) :
            this.persistPage(this.origDoc, 'PUT', Env.getSaveUrl());
        return promise.then(function () {
            if (this.isAutoSaveLocal()) {
                this.removeAutoSaveLocal();
            }
        }.bind(this), function () {
            console.log('Save failed!');
        });
    };

    PersistenceHandler.prototype.removeAutoSaveLocal = function () {
        var key = this.getLocalStorageKey();
        window.localStorage.removeItem(key);
    };

    /**
     * Invoke save function provided via the config object. Currently doesn't do any checking of
     * the return value which should be a jQuery Promise.
     */
    PersistenceHandler.prototype.customSave = function (theDoc, func, url) {
        var doc = this.updateBody(document, theDoc),
            docType = this.getDocTypeString(doc);
        return func.call(null, docType, doc, $, url);
    };

    /**
     * The submitted document should be read only so the original document is copied
     * to avoid having to replace script tags in the right place after the submission.
     * Although this is pretty inefficient in most cases a submit will be the last action
     * in an editing session.
     */
    PersistenceHandler.prototype.submit = function () {
        var url = Env.getSubmitUrl(),
            doc = document.implementation.createHTMLDocument('');
        doc.documentElement.innerHTML = this.origDoc.documentElement.innerHTML;
        return this.persistPage(doc, 'POST', url, this.makeReadOnly).done(function () {
            alert('Submitted');
        });
    };

    PersistenceHandler.prototype.autoSaveExists = function () {
        var key = this.getLocalStorageKey();
        return window.localStorage !== undefined && !!window.localStorage.getItem(key);
    };

    /**
     * This isn't right as it only replaces the body and not the header. Replacing the header doesn't re-apply
     * the sylesheets to the new content to the resulting display is wrong.
     * TODO replace the full document and evaluate scripts.
     */
    PersistenceHandler.prototype.applyAutoSave = function () {
        var key = this.getLocalStorageKey(),
            savedState = window.localStorage.getItem(key),
            doc = document.implementation.createHTMLDocument();
        doc.documentElement.innerHTML = savedState;
        $(document.body).replaceWith(doc.body);
    };


    var theInstance = new PersistenceHandler();

    return {
        setPageSrc: theInstance.setPageSrc.bind(theInstance),
        autoSaveExists: theInstance.autoSaveExists.bind(theInstance),
        applyAutoSave:  theInstance.applyAutoSave.bind(theInstance),
        submit: theInstance.submit.bind(theInstance),
        save: theInstance.save.bind(theInstance),
        unloadSave: theInstance.unloadSave.bind(theInstance),
        autoSave: theInstance.autoSave.bind(theInstance)
    };
});
