/**
 * Copyright (c), 2013-2014 IMD - International Institute for Management Development, Switzerland.
 *
 * See the file license.txt for copying permission.
 */

define([
    'locrange/LocRange',
    'nav/Position'
], function (LocRange, Position) {
    'use strict';

    var NavContext = function () {
        // A LocRange.
        this.best = null;

        // A LocRange. The end point for the navigation.
        this.result = null;
    };

    NavContext.prototype.setNavStart = function (origin) {
        this.start = new LocRange(origin.cloneRange(), this.isDown).locate();
    };

    NavContext.prototype.setOrigin = function (xAnchor) {
        this.origin = new Position(xAnchor.getX(), this.start.getBottom());
    };

    NavContext.prototype.clear = function () {
        this.start.detach();
    };

    NavContext.prototype.compare = function (dirRange) {
        return this.comparator.compare(dirRange, this).process();
    };

    NavContext.prototype.getNavStart = function () {
        return this.start.getNavStart();
    };

    /**
     * Indicates whether navigation using this context should result in a change to
     * the x-anchor.
     */
    NavContext.prototype.shouldSetXAnchor = function () {
        return false;
    };

    return NavContext;
});
