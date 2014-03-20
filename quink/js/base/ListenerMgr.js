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
    'Underscore'
], function (_) {
    'use strict';

    var ListenerMgr = function () {
        this.id = 0;
        this.listeners = {};
    };

    /**
     * filter is a function that returns true if the handler wishes to handle the message.
     * handler is a function that processes accepted messages.
     */
    ListenerMgr.prototype.register = function (listener) {
        var id = (this.id++).toString();
        if (_.isFunction(listener.handle)) {
            this.listeners[id] = listener;
        } else {
            throw new Error('Attempt to register an unusable command adapter.');
        }
        return id;
    };

    /**
     * To unregister, pass in the identifier returned from the register call.
     */
    ListenerMgr.prototype.deregister = function (id) {
        delete this.listeners[id];
    };

    ListenerMgr.prototype.dispatch = function (obj) {
        var dispatched;
        _.each(this.listeners, function (listener) {
            var handled = listener.handle(obj);
            dispatched = dispatched || handled;
        });
        return dispatched;
    };

    return ListenerMgr;
});
