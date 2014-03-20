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
    'util/Env',
    'util/PubSub'
], function ($, Env, PubSub) {
    'use strict';

    var Caret = function () {
    };

    Caret.prototype.idNum = 1;
    Caret.prototype.idPrefix = 'qk_caret_id';

    Caret.prototype.init = function () {
        this.id = this.idPrefix + this.idNum++;
        PubSub.subscribe('selection.change', this.onSelectionChange.bind(this));
        $('<div>').addClass('qk_caret qk_hidden').attr('id', this.id).appendTo('body');
        return this;
    };

    Caret.prototype.onSelectionChange = function (func) {
        var locRange = func(),
            el = $('#' + this.id);
        if (locRange.isLocatable() && locRange.isCollapsed()) {
            el.removeClass('qk_hidden').css({
                left: locRange.getX() - 5,
                top: locRange.getBottom() - 2
            });
        } else {
            el.addClass('qk_hidden');
        }
    };

    function init() {
        var caret;
        if (Env.getParam('caret', 'off') === 'on') {
            caret = new Caret().init();
        }
        return caret;
    }

    return {
        init: init
    };
});
