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

    /**
     * Implements a minimal inheritance system.
     */
    function inheritFrom(Sub, Base) {
        var args = Array.prototype.slice.call(arguments, 2);
        Sub.prototype = new Base(args);
    }

    /**
     * Relies on the fact that the inheritance was done using the fnction above.
     */
    function callSuper(obj, funcName) {
        var func = obj.constructor.prototype[funcName],
            args, result;
        if (_.isFunction(func)) {
            // Remove the args used by this function
            args = Array.prototype.slice.call(arguments, 2);
            result = func.apply(obj, args);
        }
        return result;
    }

    function addToSuper(obj, key, value) {
        obj.constructor.prototype[key] = value;
    }

    return {
        inheritFrom: inheritFrom,
        callSuper: callSuper,
        addToSuper: addToSuper
    };
});
