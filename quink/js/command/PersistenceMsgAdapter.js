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
    'command/PersistenceHandler',
    'util/PubSub'
], function (PersistenceHandler, PubSub) {
    'use strict';

    var PersistenceMsgAdapter = function () {
    };

    /**
     * Map of published commands to handler function names.
     */
    PersistenceMsgAdapter.prototype.cmdMap = {
        'autosave': 'autoSave',
        'unloadsave': 'unloadSave',
        'save': 'save',
        'submit': 'submit'
    };

    PersistenceMsgAdapter.prototype.handle = function (opId) {
        var ar = opId.split('.'),
            opName, op, func, handled, result;
        if (ar[0] === 'persist') {
            opName = ar[1];
            op = this.cmdMap[opName];
            func = (typeof PersistenceHandler[op] === 'function') && PersistenceHandler[op];
            if (func) {
                result = func.call(this.handler);
                if (result && typeof result.then === 'function') {
                    // Assume it's a Promise
                    result.done(function () {
                        PubSub.publish('command.executed', opId);
                    }).fail(function () {
                        PubSub.publish('error.persist', {
                            operation: opName
                        });
                    });
                }
            } else {
                console.log('No persistence function: ' + op);
            }
            handled = true;
        }
        return handled;
    };

    var theInstance;

    function create() {
        if (!theInstance) {
            theInstance = new PersistenceMsgAdapter();
        }
        return theInstance;
    }

    return {
        create: create
    };
});
