/**
 * Copyright (c), 2013-2014 IMD - International Institute for Management Development, Switzerland.
 *
 * See the file license.txt for copying permission.
 */

define([
    'jquery',
    'rangy',
    'ext/PluginMgr',
    'util/PubSub',
    'util/FocusTracker',
    'ext/PluginContext',
    'hithandler/HitHandler'
], function ($, rangy, PluginMgr, PubSub, FocusTracker, Context, HitHandler) {
    'use strict';

    var InsertCommandHandler = function () {
        PubSub.subscribe('plugin.saved', this.onPluginSave.bind(this));
        PubSub.subscribe('plugin.exited', this.onPluginCancel.bind(this));
        PubSub.subscribe('insert.text', this.onTextInsert.bind(this));
        PubSub.subscribe('insert.html', this.onHtmlInsert.bind(this));
        HitHandler.register(this);
    };

    /**
     * Remove focus from the editable so that the virtiual keyboard will slide out on
     * the iPad.
     */
    InsertCommandHandler.prototype.loadPlugin = function (id) {
        FocusTracker.removeFocus();
        PluginMgr.loadPlugin(id);
    };

    InsertCommandHandler.prototype.insert = function (contentType) {
        this.loadPlugin(contentType);
    };

    /**
     * Only act on double hits even though single are also accepted (which prevents them being
     * passed to the default hit listeners).
     */
    InsertCommandHandler.prototype.handle = function (event) {
        var ctx = PluginMgr.identifyPlugin(event.event),
            handled;
        if (ctx) {
            if (event.hitType === 'double') {
                this.loadPlugin(ctx);
            }
            handled = true;
        }
        return handled;
    };

    /**
     * On the iPad there are cases where there is no saved range (e.g. manually slide the keyboard
     * out). In these cases the best that can be done is to programmatically create a range.
     */
    InsertCommandHandler.prototype.onPluginSave = function (data) {
        var range = FocusTracker.createFocus();
        try {
            Context.commit(data, range);
            rangy.getSelection().setSingleRange(range);
            PubSub.publish('editable.range', range);
        } finally {
            Context.destroy();
        }
    };

    InsertCommandHandler.prototype.onPluginCancel = function () {
        Context.destroy();
        FocusTracker.restoreFocus();
    };

    /**
     * Inserts text into the current editable at the cursor location.
     */
    InsertCommandHandler.prototype.onTextInsert = function (text) {
        var range, node;
        range = FocusTracker.createFocus();
        node = document.createTextNode(text);
        if (!range.collapsed) {
            range.deleteContents();
        }
        range.insertNode(node);
        range.setStartAfter(node);
        range.collapse(false);
        rangy.getSelection().setSingleRange(range);
        PubSub.publish('editable.range', range);
    };

    /**
     * Inserts html into the current editable at the cursor location.
     */
    InsertCommandHandler.prototype.onHtmlInsert = function (html) {
        var range, nodes;
        range = FocusTracker.createFocus();
        if (!range.collapsed) {
            range.deleteContents();
        }
        nodes = $(html);
        nodes.each(function () {
            range.insertNode(this);
            range.setStartAfter(this);
            range.collapse(false);
        });
        rangy.getSelection().setSingleRange(range);
        PubSub.publish('editable.range', range);
    };

    return InsertCommandHandler;
});
