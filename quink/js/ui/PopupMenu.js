/**
 * Copyright (c), 2013-2014 IMD - International Institute for Management Development, Switzerland.
 *
 * See the file license.txt for copying permission.
 */

define([
    'Underscore',
    'jquery',
    'util/Event',
    'util/Env'
], function (_, $, Event, Env) {
    'use strict';

    var PopupMenu = function (menuDef, callback) {
        this.menuDef = menuDef;
        this.callback = callback;
        this.downloadTpl();
    };

    PopupMenu.prototype.MENU_ITEM_SELECTOR = '.qk_popup_menu_item';

    PopupMenu.prototype.onSelect = function (event) {
        var menuItem = $(event.target).closest(this.MENU_ITEM_SELECTOR),
            id = menuItem.attr('id'),
            selectedDef = _.find(this.menuDef.options, function (def) {
                return def.value === id;
            });
        event.preventDefault(); // stops the menu being focused
        this.callback(selectedDef, this);
    };

    PopupMenu.prototype.downloadTpl = function () {
        $.get(Env.resource('menu.tpl')).done(function (tpl) {
            this.menuTpl = _.template(tpl);
        }.bind(this));
    };

    PopupMenu.prototype.applyState = function (markup, menuState) {
        markup.find('.qk_popup_menu_item').each(function () {
            var itemEl = $(this),
                stateEl = itemEl.find('.qk_popup_menu_item_state'),
                id = itemEl.attr('id'),
                func = menuState.indexOf(id) >= 0 ? stateEl.removeClass : stateEl.addClass;
            func.call(stateEl, 'qk_hidden');
        });
    };

    PopupMenu.prototype.createMenu = function (def) {
        var markup = $(this.menuTpl(def));
        markup.on(Event.eventName('start'), this.MENU_ITEM_SELECTOR, this.onSelect.bind(this));
        return markup;
    };

    PopupMenu.prototype.show = function (x, y, menuState) {
        var menu = this.menu;
        if (!menu) {
            this.menu = this.createMenu(this.menuDef);
            menu = this.menu;
            menu.appendTo('body');
        }
        this.applyState(menu, menuState);
        menu.css({
            top: y,
            left: x
        });
        menu.removeClass('qk_hidden');
    };

    PopupMenu.prototype.hide = function () {
        this.menu.addClass('qk_hidden');
    };

    return PopupMenu;
});
