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

    var PopupMenu = function (menuDef, callback, isMultiSelect) {
        this.menuDef = menuDef;
        this.callback = callback;
        this.isMultiSelect = isMultiSelect;
        this.hiddenCss = isMultiSelect ? 'qk_invisible' : 'qk_hidden';
        this.addCloseDef(this.menuDef, this.isMultiSelect);
    };

    PopupMenu.prototype.MENU_ITEM_SELECTOR = '.qk_popup_menu_item';

    PopupMenu.prototype.addCloseDef = function (menuDef, isMultiSelect) {
        menuDef.push({
            label: isMultiSelect ? 'close' : 'cancel',
            value: 'close'
        });
    };

    PopupMenu.prototype.updateState = function (markup, state) {
        markup.find('.qk_popup_menu_item[id="' + state + '"] .qk_popup_menu_item_state').toggleClass(this.hiddenCss);
    };

    PopupMenu.prototype.onSelect = function (event) {
        var menuItem = $(event.target).closest(this.MENU_ITEM_SELECTOR),
            id = menuItem.attr('id'),
            selectedDef = _.find(this.menuDef, function (def) {
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

    PopupMenu.prototype.createMenu = function (def) {
        var markup = $(menuTpl({options: def}));
        markup.on(Event.eventName('start'), this.MENU_ITEM_SELECTOR, this.onSelect.bind(this));
        markup.find('.qk_popup_menu_item_state').addClass(this.hiddenCss);
        return markup;
    };

    PopupMenu.prototype.show = function (x, y, menuState) {
        var menu = this.menu,
            created;
        if (!menu) {
            this.menu = this.createMenu(this.menuDef);
            menu = this.menu;
            this.mask = Mask.create(this.hide.bind(this), 0);
            menu.appendTo('body');
            this.vpMenu = ViewportRelative.create(menu, {
                top: y
            });
            created = true;
        }
        if (this.isMultiSelect) {
            this.applyState(menu, menuState);
        }
        this.mask.show();
        menu.css({
            top: y,
            left: x
        });
        this.vpMenu.adjust();
        menu.removeClass('qk_hidden');
    };

    PopupMenu.prototype.hide = function () {
        this.menu.addClass('qk_hidden');
        this.mask.hide();
    };

    function create(menuDef, callback, isMultiSelect) {
        return new PopupMenu(menuDef, callback, isMultiSelect);
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
