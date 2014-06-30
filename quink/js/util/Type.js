/**
 * Copyright (c), 2013-2014 IMD - International Institute for Management Development, Switzerland.
 *
 * See the file license.txt for copying permission.
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
