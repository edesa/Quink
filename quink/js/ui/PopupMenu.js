/**
 * Copyright (c), 2013-2014 IMD - International Institute for Management Development, Switzerland.
 *
 * See the file license.txt for copying permission.
 */

define([
    'Underscore',
    'jquery',
    'ui/Mask',
    'util/Event',
    'util/Env',
    'util/ViewportRelative'
], function (_, $, Mask, Event, Env, ViewportRelative) {
    'use strict';

    var menuTpl;

    var PopupMenu = function (menuDef, callback, stateFunc, isMultiSelect) {
        this.menuDef = menuDef;
        this.callback = callback;
        this.stateFunc = stateFunc;
        this.isMultiSelect = isMultiSelect;
        this.state = [];
    };

    PopupMenu.prototype.MENU_ITEM_SELECTOR = '.qk_popup_menu_item';
    PopupMenu.prototype.HIDDEN_CSS = 'qk_invisible';

    PopupMenu.prototype.updateUiState = function (markup, state) {
        if (state) {
            markup.find('.qk_popup_menu_item[data-value="' + state + '"] .qk_popup_menu_item_state').toggleClass(this.HIDDEN_CSS);
        }
    };

    PopupMenu.prototype.updateState = function (state, newValue) {
        var index = state.indexOf(newValue),
            result = {};
        if (index >= 0) {
            state.splice(index, 1);
            result.deselected = newValue;
        } else {
            if (this.isMultiSelect) {
                state.push(newValue);
            } else {
                result.deselected = state[0];
                state[0] = newValue;
            }
            result.selected = newValue;
        }
        return result;
    };

    PopupMenu.prototype.onSelect = function (event) {
        var menuItem = $(event.target).closest(this.MENU_ITEM_SELECTOR),
            id = menuItem.attr('data-value'),
            selectedDef = _.find(this.menuDef, function (def) {
                return def.value === id;
            }),
            newValue = selectedDef.value,
            delta = {};
        event.preventDefault(); // stops the menu being focused
        if (newValue !== 'close') {
            delta = this.updateState(this.state, newValue);
            this.updateUiState(this.menu, delta.selected);
            this.updateUiState(this.menu, delta.deselected);
        }
        this.callback(delta.selected, delta.deselected, this.state);
        if (!this.isMultiSelect || newValue === 'close') {
            this.hide();
        }
    };

    PopupMenu.prototype.applyState = function (markup, menuState) {
        var HIDDEN_CSS = this.HIDDEN_CSS;
        markup.find('.qk_popup_menu_item').each(function () {
            var itemEl = $(this),
                stateEl = itemEl.find('.qk_popup_menu_item_state'),
                id = itemEl.attr('data-value'),
                func = menuState.indexOf(id) >= 0 ? stateEl.removeClass : stateEl.addClass;
            func.call(stateEl, HIDDEN_CSS);
        });
    };

    PopupMenu.prototype.createMenu = function (def) {
        var markup = $(menuTpl({options: def}));
        markup.on(Event.eventName('start'), this.MENU_ITEM_SELECTOR, this.onSelect.bind(this));
        markup.find('.qk_popup_menu_item_state').addClass(this.HIDDEN_CSS);
        return markup;
    };

    PopupMenu.prototype.doShowMenu = function (menu, x, y) {
        var vpRight = document.documentElement.clientWidth || window.innerWidth || 0,
            vpBottom = document.documentElement.clientHeight || window.height || 0,
            hScroll = document.documentElement.scrollLeft || document.body.scrollLeft || 0,
            vScroll = document.documentElement.scrollTop || document.body.scrollTop || 0;
        menu.css({
            top: -500,
            left: -500
        });
        menu.removeClass('qk_hidden'); // so that the menu has a width
        if (x + menu.outerWidth() > vpRight + hScroll) {
            x -= menu.outerWidth();
        }
        if (y + menu.outerHeight() > vpBottom + vScroll) {
            y -= menu.outerHeight();
        }
        menu.css({
            top: y,
            left: x
        });
        this.vpMenu.adjust();
    };

    PopupMenu.prototype.show = function (x, y) {
        var menu = this.menu;
        if (!menu) {
            this.menu = this.createMenu(this.menuDef);
            menu = this.menu;
            this.mask = Mask.create(this.hide.bind(this), 0);
            menu.appendTo('body');
            this.vpMenu = ViewportRelative.create(menu, {
                top: y
            });
        }
        this.state = (this.stateFunc && this.stateFunc(this.menuDef)) || this.state;
        this.applyState(menu, this.state);
        this.mask.show();
        this.doShowMenu(menu, x, y);
    };

    PopupMenu.prototype.hide = function () {
        this.menu.addClass('qk_hidden');
        this.mask.hide();
        this.state = [];
    };

    PopupMenu.prototype.destroy = function () {
        this.menu.remove();
    };

    function create(menuDef, callback, stateFunc, isMultiSelect) {
        return new PopupMenu(menuDef, callback, stateFunc, isMultiSelect);
    }

    function init() {
        return $.get(Env.resource('menu.tpl')).done(function (tpl) {
            menuTpl = _.template(tpl);
        });
    }

    return {
        create: create,
        init: init
    };
});
