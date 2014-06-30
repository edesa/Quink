/**
 * Copyright (c), 2013-2014 IMD - International Institute for Management Development, Switzerland.
 *
 * See the file license.txt for copying permission.
 */

define([
    'locrange/LocRange',
    'util/Type'
], function (LocRange, Type) {
    'use strict';

    /**
     * A locatable range that won't mutate the DOM. If DOM mutation is needed in order to locate the
     * range then the range will be unlocatable and an indicator set.
     */
    var SafeLocRange = function (range, isDown) {
        this.isLocatable = true;
        Type.callSuper(this, 'constructor', range, isDown);
    };

    Type.inheritFrom(SafeLocRange, LocRange);

    SafeLocRange.prototype.locateByWrapping = function () {
        this.isLocatable = false;
        return undefined;
    };

    SafeLocRange.prototype.locateUsingEl = function () {
        this.isLocatable = false;
        return undefined;
    };

    SafeLocRange.prototype.getX = function () {
        return this.isLocatable && Type.callSuper(this, 'getX');
    };

    SafeLocRange.prototype.getTop = function () {
        return this.isLocatable && Type.callSuper(this, 'getTop');
    };

    SafeLocRange.prototype.getBottom = function () {
        return this.isLocatable && Type.callSuper(this, 'getBottom');
    };

    return SafeLocRange;
});
