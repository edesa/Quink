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
    'util/Type',
    'keyhandler/KeyHandler',
    'util/PubSub'
], function (Type, KeyHandler, PubSub) {
    'use strict';

    var InsertKeyHandler = function (selector, mgr) {
        Type.callSuper(this, 'constructor', selector, mgr);
        this.events = [];
    };

    Type.inheritFrom(InsertKeyHandler, KeyHandler);

    InsertKeyHandler.prototype.MODE_SWITCH_DELAY = 300;

    InsertKeyHandler.prototype.handleInsert = function (event) {
        PubSub.publish('char.insert', event);
    };

    /**
     * The mode switch key has to be able to be inserted into the document by being entered
     * twice in succession within a given time frame.
     */
    InsertKeyHandler.prototype.keyListener = function (event) {
        if (event.keyCode === this.MODE_SWITCH_KEY_CODE) {
            if (this.timeout) {
                // Had a mode switch key, now followed by another mode switch key before the timeout.
                this.reset();
                this.handleInsert(event);
            } else {
                // The initial mode switch key - wait to see what's next
                event.preventDefault();
                this.timeout = setTimeout(this.afterSwitchDelay.bind(this), this.MODE_SWITCH_DELAY);
            }
        } else {
            if (this.timeout) {
                event.preventDefault();
                this.events.push(event);
                this.afterSwitchDelay();
            } else {
                this.handleInsert(event);
            }
        }
    };

    /**
     * Invoked after the mode switch timeout has taken place with nothing happening to
     * prevent the mode switch. Switch the mode and re-fire any event that has happened during
     * the timeout.
     */
    InsertKeyHandler.prototype.afterSwitchDelay = function () {
        this.switchMode();
        this.events.forEach(function (event) {
            this.getContainer().trigger(event);
        }.bind(this));
        this.reset();
    };

    InsertKeyHandler.prototype.reset = function () {
        if (this.timeout) {
            clearTimeout(this.timeout);
            this.timeout = null;
        }
        this.events.length = 0;
    };

    return InsertKeyHandler;
});
