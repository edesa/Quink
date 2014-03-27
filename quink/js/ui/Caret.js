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
    'jquery',
    'util/DomUtil',
    'util/Env',
    'util/PubSub'
], function ($, DomUtil, Env, PubSub) {
    'use strict';

    var Caret = function () {
    };

    Caret.prototype.idNum = 1;
    Caret.prototype.ID_PREFIX = 'qk_caret_id';

    /**
     * The width and height of the caret in pixels as defined in the css.
     */
    Caret.prototype.CARET_WIDTH = 5;
    Caret.prototype.CARET_HEIGHT = 5;


    Caret.prototype.init = function () {
        this.id = this.ID_PREFIX + this.idNum++;
        PubSub.subscribe('selection.change', this.onSelectionChange.bind(this));
        PubSub.subscribe('window.scroll', this.onScroll.bind(this));
        PubSub.subscribe('editable.scroll', this.onScroll.bind(this));
        $('<div>').addClass('qk_caret qk_hidden').attr('id', this.id).appendTo('body');
        return this;
    };

    Caret.prototype.onSelectionChange = function (func) {
        this.locRange = func();
        if (this.locRange) {
            this.docScrollTop = $(document).scrollTop();
            this.editableScrollTop = this.locRange.getEditableScrollTop();
            this.showCaret();
        }
    };

    /**
     * Recalculate the editable scroll delta and show the caret.
     */
    Caret.prototype.onScroll = function (event) {
        var scrollDelta = 0,
            scrollable = event.delegateTarget;
        if (scrollable !== window) {
            scrollDelta = $(scrollable).scrollTop() - this.editableScrollTop;
        }
        this.showCaret(scrollDelta);
    };

    /**
     * Returns the y coordinate for the visible caret or undefined if the caret shouldn't be shown.
     */
    Caret.prototype.showCaretAt = function (locRange, offset) {
        var visibleBounds, top, showAt;
        if (locRange && locRange.isLocatable() && locRange.isCollapsed()) {
            top = this.docScrollTop - offset + locRange.getBottom() - 2;
            visibleBounds = DomUtil.getVisibleBounds(locRange.getEditable());
            if (top >= visibleBounds.top && top + this.CARET_HEIGHT <= visibleBounds.bottom) {
                showAt = top;
            }
        }
        return showAt;
    };

    Caret.prototype.showCaret = function (scrollOffset) {
        var locRange = this.locRange,
            el = $('#' + this.id),
            top = this.showCaretAt(locRange, scrollOffset || 0);
        if (top !== undefined) {
            el.removeClass('qk_hidden').css({
                left: locRange.getX() - this.CARET_WIDTH,
                top: top
            });
        } else {
            el.addClass('qk_hidden');
        }
    };

    function init() {
        var dflt = Env.isIos() ? 'on' : 'off',
            caret;
        if (Env.getParam('caret', dflt) === 'on') {
            caret = new Caret().init();
        }
        return caret;
    }

    return {
        init: init
    };
});
