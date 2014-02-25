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
    'rangy',
    'ext/PluginMgr',
    'util/PubSub',
    'util/FocusTracker',
    'ext/PluginContext',
    'hithandler/HitHandler'
], function (rangy, PluginMgr, PubSub, FocusTracker, Context, HitHandler) {
    'use strict';

    var InsertCommandHandler = function () {
        PubSub.subscribe('plugin.saved', this.onPluginSave.bind(this));
        PubSub.subscribe('plugin.exited', this.onPluginCancel.bind(this));
        HitHandler.register(this);
    };

    /**
     * Remove focus from the editable so that the virtiual keyboard will slide out on
     * the iPad.
     */
    InsertCommandHandler.prototype.loadPlugin = function (id) {
        FocusTracker.saveState();
        FocusTracker.getEditable().blur();
        PluginMgr.loadPlugin(id);
    };

    InsertCommandHandler.prototype.insert = function (contentType) {
        this.loadPlugin(contentType);
    };

    /**
     * Accept all hits within a plugin.
     * Storing the plugin definition within the event is a bit crappy, but possibly
     * better than storing it in this handler and definitely better than re-running identifyPlugin.
     */
    InsertCommandHandler.prototype.accept = function (event) {
        var ctx = PluginMgr.identifyPlugin(event.event);
        if (ctx) {
            event.pluginCtx = ctx;
        }
        return !!ctx;
    };

    /**
     * Only act on double hits even though single are also accepted (which prevents them being
     * passed to the default hit listeners).
     */
    InsertCommandHandler.prototype.handle = function (event) {
        if (event.hitType === 'double') {
            this.loadPlugin(event.pluginCtx);
        }
    };

    /**
     * On the iPad there are cases where there is no saved range (e.g. manually slide the keyboard
     * out). In these cases the best that can be done is to programmatically create a range.
     */
    InsertCommandHandler.prototype.onPluginSave = function (data) {
        var range = FocusTracker.restoreFocus();
        if (!range) {
            range = rangy.createRange();
            range.setStart(FocusTracker.getEditable()[0], 0);
            range.collapse(true);
        }
        Context.commit(data, range);
        Context.destroy();
    };

    InsertCommandHandler.prototype.onPluginCancel = function () {
        Context.destroy();
        FocusTracker.restoreFocus();
    };

    return InsertCommandHandler;
});
