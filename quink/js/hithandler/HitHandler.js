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

/**
 * Copyright (c), 2013-2014 IMD - International Institute for Management Development, Switzerland.
 *
 * See the file license.txt for copying permission.
 */
define([
    'Underscore',
    'jquery',
    'util/Event',
    'base/ListenerMgr'
], function (_, $, Event, ListenerMgr) {
    'use strict';

    var HitHandler = function () {
        this.registry = new ListenerMgr();
        this.defRegistry = new ListenerMgr();
    };

    HitHandler.prototype.DOUBLE_TAP_THRESHOLD = 300;

    HitHandler.prototype.init = function (selector) {
        $(document).on(Event.eventName('end'), selector, this.onHit.bind(this));
    };

    /**
     * Listeners in this registry get the first chance to handle an event.
     */
    HitHandler.prototype.getRegistry = function () {
        return this.registry;
    };

    /**
     * Listeners in this registry are the default handlers only given the chance to handle events
     * that are not handled by any listeners in the other registry.
     */
    HitHandler.prototype.getDefaultRegistry = function () {
        return this.defRegistry;
    };

    HitHandler.prototype.reset = function () {
        if (this.timeout) {
            clearTimeout(this.timeout);
            this.timeout = null;
        }
        this.ts = null;
    };

    HitHandler.prototype.onSingleHit = function (event) {
        this.reset();
        this.currentEditable = event.delegateTarget;
        this.dispatch({
            hitType: 'single',
            event: event
        });
    };

    HitHandler.prototype.onHit = function (event) {
        var now = new Date().getTime();
        if (this.ts && (now - this.ts < this.DOUBLE_TAP_THRESHOLD)) {
            this.reset();
            this.dispatch({
                hitType: 'double',
                event: event
            });
        } else {
            this.ts = now;
            this.timeout = _.delay(this.onSingleHit.bind(this), this.DOUBLE_TAP_THRESHOLD, event);
        }
    };

    HitHandler.prototype.dispatch = function (hit) {
        if (!this.getRegistry().dispatch(hit)) {
            this.getDefaultRegistry().dispatch(hit);
        }
    };

    HitHandler.prototype.manageListeners = function (listener, isDefault, funcName) {
        var reg = isDefault ? this.getDefaultRegistry() : this.getRegistry();
        reg[funcName](listener);
    };

    HitHandler.prototype.register = function (listener, isDefault) {
        this.manageListeners(listener, isDefault, 'register');
    };

    HitHandler.prototype.deregister = function (listener, isDefault) {
        this.manageListeners(listener, isDefault, 'deregister');
    };

    var theInstance = new HitHandler();

    return {
        init: _.bind(theInstance.init, theInstance),
        register: _.bind(theInstance.register, theInstance),
        deregister: _.bind(theInstance.deregister, theInstance)
    };
});
