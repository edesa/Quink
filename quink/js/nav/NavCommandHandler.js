/**
 * Copyright (c), 2013-2014 IMD - International Institute for Management Development, Switzerland.
 *
 * See the file license.txt for copying permission.
 */

define([
    'nav/Nav',
    'nav/LineChangeContext',
    'nav/LineEndContext',
    'nav/NavStateMgr'
], function (Nav, LineChangeContext, LineEndContext, NavStateMgr) {
    'use strict';

    var NavCommandHandler = function () {
        this.andSelect = false;
        this.nav = new Nav();
        NavStateMgr.init(this.nav);
    };

    NavCommandHandler.prototype.isSelect = function () {
        return this.andSelect;
    };

    NavCommandHandler.prototype.selectToggle = function () {
        this.andSelect = !this.andSelect;
        return true;
    };

    NavCommandHandler.prototype.selectOn = function () {
        this.andSelect = true;
        return true;
    };

    NavCommandHandler.prototype.selectOff = function () {
        this.andSelect = false;
        return true;
    };

    NavCommandHandler.prototype.lineUp = function () {
        return this.nav.lineAndSelect(false, this.isSelect(), new LineChangeContext(false));
    };

    NavCommandHandler.prototype.lineDown = function () {
        return this.nav.lineAndSelect(true, this.isSelect(), new LineChangeContext(true));
    };

    NavCommandHandler.prototype.lineStart = function () {
        return this.nav.lineAndSelect(false, this.isSelect(), new LineEndContext(false));
    };

    NavCommandHandler.prototype.lineEnd = function () {
        return this.nav.lineAndSelect(true, this.isSelect(), new LineEndContext(true));
    };

    NavCommandHandler.prototype.wordPrev = function () {
        return this.nav.acrossAndSelect('word', -1, this.isSelect());
    };

    NavCommandHandler.prototype.wordNext = function () {
        return this.nav.acrossAndSelect('word', 1, this.isSelect());
    };

    NavCommandHandler.prototype.charPrev = function () {
        return this.nav.acrossAndSelect('character', -1, this.isSelect());
    };

    NavCommandHandler.prototype.charNext = function () {
        return this.nav.acrossAndSelect('character', 1, this.isSelect());
    };

    return NavCommandHandler;
});
