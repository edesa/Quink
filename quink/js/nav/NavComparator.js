/**
 * Copyright (c), 2013-2014 IMD - International Institute for Management Development, Switzerland.
 *
 * See the file license.txt for copying permission.
 */

define([
], function () {
    'use strict';

    var NavComparator = function () {};

    NavComparator.prototype.setDown = function (isDown) {
        this.isLineBefore = isDown ? this.isAbove : this.isBelow;
    };

    NavComparator.prototype.isAbove = function (first, second) {
        return first.getBottom() < second.getBottom();
    };

    NavComparator.prototype.isBelow = function (first, second) {
        return first.getBottom() > second.getBottom();
    };

    return NavComparator;
});
