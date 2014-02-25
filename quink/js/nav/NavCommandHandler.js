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
    'nav/Nav',
    'nav/LineChangeContext',
    'nav/LineEndContext',
    'nav/NavStateMgr',
    'util/PubSub'
], function (Nav, LineChangeContext, LineEndContext, NavStateMgr, PubSub) {
    'use strict';

    var NavCommandHandler = function () {
        this.andSelect = false;
        this.nav = new Nav();
        NavStateMgr.init(this.nav);
    };

    NavCommandHandler.prototype.isSelect = function () {
        return this.andSelect;
    };

    NavCommandHandler.prototype.toggleSelect = function () {
        this.andSelect = !this.andSelect;
        this.publishState('navandselect', this.andSelect);
    };

    NavCommandHandler.prototype.lineUp = function () {
        this.nav.lineAndSelect(false, this.isSelect(), new LineChangeContext(false));
        this.publish('line', 'up');
    };

    NavCommandHandler.prototype.lineDown = function () {
        this.nav.lineAndSelect(true, this.isSelect(), new LineChangeContext(true));
        this.publish('line', 'down');
    };

    NavCommandHandler.prototype.lineStart = function () {
        this.nav.lineAndSelect(false, this.isSelect(), new LineEndContext(false));
        this.publish('line', 'start');
    };

    NavCommandHandler.prototype.lineEnd = function () {
        this.nav.lineAndSelect(true, this.isSelect(), new LineEndContext(true));
        this.publish('line', 'end');
    };

    NavCommandHandler.prototype.wordPrev = function () {
        this.nav.acrossAndSelect('word', -1, this.isSelect());
        this.publish('word', 'left');
    };

    NavCommandHandler.prototype.wordNext = function () {
        this.nav.acrossAndSelect('word', 1, this.isSelect());
        this.publish('word', 'right');
    };

    NavCommandHandler.prototype.charPrev = function () {
        this.nav.acrossAndSelect('character', -1, this.isSelect());
        this.publish('character', 'left');
    };

    NavCommandHandler.prototype.charNext = function () {
        this.nav.acrossAndSelect('character', 1, this.isSelect());
        this.publish('character', 'right');
    };

    NavCommandHandler.prototype.publish = function (unit, direction) {
        PubSub.publish('nav.executed', {
            unit: unit,
            direction: direction
        });
    };

    NavCommandHandler.prototype.publishState = function (name, value) {
        var data = {};
        data[name] = value;
        PubSub.publish('nav.executed', data);
    };

    return NavCommandHandler;
});
