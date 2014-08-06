/**
 * Copyright (c), 2013-2014 IMD - International Institute for Management Development, Switzerland.
 *
 * See the file license.txt for copying permission.
 */

define([
], function () {
    'use strict';

    var Position = function (x, y) {
        this.x = x;
        this.y = y;
    };

    Position.prototype.getX = function () {
        return this.x;
    };

    Position.prototype.getBottom = function () {
        return this.y;
    };

    return Position;
});
