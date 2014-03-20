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
    };

    Type.inheritFrom(InsertKeyHandler, KeyHandler);

    InsertKeyHandler.prototype.MODE_SWITCH_DELAY = 300;

    InsertKeyHandler.prototype.handleInsert = function (event) {
        PubSub.publish('insert.char', event);
    };

    /**
     * The mode switch key has to be able to be inserted into the document by being entered
     * twice in succession within a given time frame.
     */
    InsertKeyHandler.prototype.keyListener = function (event) {
        if (event.keyCode === this.MODE_SWITCH_KEY_CODE) {
            if (this.timeout) {
                // Had a mode switch key, now followed by another mode switch key before the timeout.
                event.preventDefault();
                this.switchMode();
                this.reset();
            } else {
                // The initial mode switch key - wait to see what's next
                event.preventDefault();
                this.saveEventKey(event);
                this.timeout = setTimeout(this.afterSwitchDelay.bind(this), this.MODE_SWITCH_DELAY);
            }
        } else {
            if (this.timeout) {
                this.afterSwitchDelay();
                this.handleInsert(event);
            } else {
                this.handleInsert(event);
            }
        }
    };

    /**
     * This is completely wrong but as far as I can see it's the best that can be done right now.
     * keydown events don't provide the character pressed, just the key. keypress events do provide
     * the character but they happen too late. This tries to work out the character that the user
     * wanted to enter using the keydown event however it's unlikely to work in all cases.
     * This does not do the right thing if caps lock is pressed.
     */
    InsertKeyHandler.prototype.saveEventKey = function (event) {
        var kc = event.keyCode;
        if (kc >= 65 && kc <= 90 && !event.shiftKey) {
            kc += 32;
        }
        this.saveKey = String.fromCharCode(kc);
    };

    /**
     * Invoked after the mode switch timeout has taken place which means that there wasn't a second
     * mode switch key within the interval, so don't do the mode switch. Insert the initial
     * mode switch key into the document.
     */
    InsertKeyHandler.prototype.afterSwitchDelay = function () {
        PubSub.publish('insert.text', this.saveKey);
        this.reset();
    };

    InsertKeyHandler.prototype.reset = function () {
        if (this.timeout) {
            clearTimeout(this.timeout);
            this.timeout = null;
        }
        this.saveKey = null;
    };

    return InsertKeyHandler;
});
