/**
 * Copyright (c), 2013-2014 IMD - International Institute for Management Development, Switzerland.
 *
 * See the file license.txt for copying permission.
 */

define([
    'jquery',
    'util/Event'
], function ($, Event) {
    'use strict';

    /**
     * This is what's returned to clients as part of the selection change publication.
     * isCollapsed refers to the original unlocated range. The locatable range will not be
     * collapsed as collapsed ranges have no location on the page.
     */
    var LocatableRange = function (safeRange, isCollapsed) {
        this.safeRange = safeRange;
        this.collapsed = isCollapsed;
    };

    LocatableRange.prototype.getEditable = function () {
        var el = this.safeRange.getRange().startContainer;
        return Event.getEditable(el);
    };

    LocatableRange.prototype.getX = function () {
        return this.safeRange.getX();
    };

    LocatableRange.prototype.getTop = function () {
        return this.safeRange.getTop();
    };

    LocatableRange.prototype.getBottom = function () {
        return this.safeRange.getBottom();
    };

    LocatableRange.prototype.getEditableScrollTop = function () {
        return this.getEditable().scrollTop();
    };

    LocatableRange.prototype.isLocatable = function () {
        return this.safeRange.isLocatable;
    };

    LocatableRange.prototype.isCollapsed = function () {
        return this.collapsed;
    };

    return LocatableRange;
});
