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
    'Underscore',
    'util/PubSub'
], function (_, PubSub) {
    'use strict';

    var NavStateMgr = function (nav) {
        this.nav = nav;
        this.states = [];
        PubSub.subscribe('editable.change', this.onEditableChange.bind(this));
    };

    NavStateMgr.prototype.getStateFor = function (editable) {
        var state = _.find(this.states, function (state) {
                return state.editable === editable;
            });
        if (!state) {
            state = {
                editable: editable,
                selRange: null,
                activeSelEnd: null,
                xAnchor: null
            };
            this.states.push(state);
        }
        return state;
    };

    NavStateMgr.prototype.onEditableChange = function (data) {
        var state = this.getStateFor(data.newEditable);
        this.nav.setState(state);
    };

    var theInstance;

    function init(nav, selector) {
        if (!theInstance) {
            theInstance = new NavStateMgr(nav, selector);
        }
    }

    return {
        init: init
    };
});
