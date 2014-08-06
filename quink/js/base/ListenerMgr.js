/**
 * Copyright (c), 2013-2014 IMD - International Institute for Management Development, Switzerland.
 *
 * See the file license.txt for copying permission.
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
