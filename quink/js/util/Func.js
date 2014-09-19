/**
 * Copyright (c), 2013-2014 IMD - International Institute for Management Development, Switzerland.
 *
 * See the file license.txt for copying permission.
 */

/*global QUINK */

define([
], function () {
    'use strict';

    function checkContext(ctx, name) {
        return ctx && typeof ctx[name] === 'function' && ctx;
    }

    function getContext(ctx, name) {
        return checkContext(ctx, name) || checkContext(QUINK, name) || checkContext(window, name);
    }

    function getBound(ctx, name) {
        var context = getContext(ctx, name);
        return context && context[name].bind(context);
    }

    /**
     * Tries to execute the named function searching for it in ctx, QUINK and window.
     * Arguments to the function should be passed after the function name.
     */
    function exec(ctx, name) {
        var context = getContext(ctx, name),
            result;
        if (context) {
            result = context[name].apply(context, Array.prototype.slice.call(arguments, 2));
        } else {
            console.log('no function: ' + name);
        }
        return result;
    }

    return {
        exec: exec,
        getBound: getBound
    };
});
