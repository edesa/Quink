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

    var PopupMenu = function (menuDef, callback, isMultiSelect) {
        this.menuDef = menuDef;
        this.callback = callback;
        this.isMultiSelect = isMultiSelect;
        this.hiddenCss = isMultiSelect ? 'qk_invisible' : 'qk_hidden';
        this.downloadTpl();
    };

    PopupMenu.prototype.MENU_ITEM_SELECTOR = '.qk_popup_menu_item';

    PopupMenu.prototype.updateState = function (markup, state) {
        markup.find('.qk_popup_menu_item[id="' + state + '"] .qk_popup_menu_item_state').toggleClass(this.hiddenCss);
    };

    PopupMenu.prototype.onSelect = function (event) {
        var menuItem = $(event.target).closest(this.MENU_ITEM_SELECTOR),
            id = menuItem.attr('id'),
            selectedDef = _.find(this.menuDef.options, function (def) {
                return def.value === id;
            });
        event.preventDefault(); // stops the menu being focused
        if (this.isMultiSelect && selectedDef.value !== 'close') {
            this.updateState(this.menu, selectedDef.value);
        }
        this.callback(selectedDef, this);
        if (!this.isMultiSelect || selectedDef.value === 'close') {
            this.hide();
        }
    };

    PopupMenu.prototype.downloadTpl = function () {
        $.get(Env.resource('menu.tpl')).done(function (tpl) {
            this.menuTpl = _.template(tpl);
        }.bind(this));
    };

    PopupMenu.prototype.applyState = function (markup, menuState) {
        var hiddenCss = this.hiddenCss;
        markup.find('.qk_popup_menu_item').each(function () {
            var itemEl = $(this),
                stateEl = itemEl.find('.qk_popup_menu_item_state'),
                id = itemEl.attr('id'),
                func = menuState.indexOf(id) >= 0 ? stateEl.removeClass : stateEl.addClass;
            func.call(stateEl, hiddenCss);
        });
    };

    PopupMenu.prototype.createMask = function () {
        return $('<div>').addClass('qk_mask')
            .css('opacity', '0')
            .on('touchmove', function (event) {
                event.preventDefault();
            })
            .on(Event.eventName('start'), function (event) {
                event.preventDefault();
                this.hide();
            }.bind(this));
    };

    PopupMenu.prototype.createMenu = function (def) {
        var markup = $(this.menuTpl(def));
        markup.on(Event.eventName('start'), this.MENU_ITEM_SELECTOR, this.onSelect.bind(this));
        markup.find('.qk_popup_menu_item_state').addClass(this.hiddenCss);
        return markup;
    };

    PopupMenu.prototype.show = function (x, y, menuState) {
        var menu = this.menu;
        if (!menu) {
            this.menu = this.createMenu(this.menuDef);
            menu = this.menu;
            this.mask = this.createMask();
            menu.appendTo('body');
        }
        if (this.isMultiSelect) {
            this.applyState(menu, menuState);
        }
        this.mask.appendTo('body');
        menu.css({
            top: y,
            left: x
        });
        menu.removeClass('qk_hidden');
    };

    PopupMenu.prototype.hide = function () {
        this.menu.addClass('qk_hidden');
        this.mask.detach();
    };

    return PopupMenu;
});
