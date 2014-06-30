/**
 * Copyright (c), 2013-2014 IMD - International Institute for Management Development, Switzerland.
 *
 * See the file license.txt for copying permission.
 */

define([
    'Underscore',
    'util/PubSub'
], function (_, PubSub) {
    'use strict';

    var NavStateMgr = function (nav) {
        this.nav = nav;
        this.states = [];
        PubSub.subscribe('editable.focus', this.onEditableChange.bind(this));
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

    NavStateMgr.prototype.onEditableChange = function (editable) {
        var state = this.getStateFor(editable);
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
