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
    'jquery',
    'command/CommandSubscriber',
    'util/PubSub',
    'util/Env',
    'util/ViewportRelative'
], function (_, $, CommandSubscriber, PubSub, Env, ViewportRelative) {
    'use strict';

    var CommandStateBar = function () {
        CommandSubscriber.register(this);
    };

    /**
     * The command state bar should display the icons for those commands that are currently
     * active at the insertion point.
     */
    CommandStateBar.prototype.onStateChange = function (state) {
        _.each(state, function (val, cmd) {
            var selector = '[data-cmd="' + cmd + '"]',
                item, func;
            if (typeof val === 'string') {
                this.bar.find(selector).each(function () {
                    var item = $(this),
                        func = item.attr('data-cmd-args') === val ? item.removeClass : item.addClass;
                    func.call(item, 'qk_hidden');
                });
            } else {
                item = this.bar.find(selector);
                func = val ? item.removeClass : item.addClass;
                func.call(item, 'qk_hidden');
            }
        }, this);
    };

    CommandStateBar.prototype.handle = function (msg) {
        var handled;
        if (/^ui\.status\./.test(msg)) {
            if (/\.toggle$/.test(msg)) {
                this.toggleVisibleState();
            } else {
                this.setVisibleState(/\.on$/.test(msg));
            }
            PubSub.publish('command.executed', {
                cmd: msg,
                result: true
            });
            handled = true;
        }
        return handled;
    };

    CommandStateBar.prototype.toggleVisibleState = function () {
        var func = this.bar.hasClass('qk_hidden') ? this.bar.removeClass : this.bar.addClass;
        func.call(this.bar, 'qk_hidden');
    };

    CommandStateBar.prototype.setVisibleState = function (isVisible) {
        var func = isVisible ? this.bar.removeClass : this.bar.addClass;
        func.call(this.bar, 'qk_hidden');
    };

    CommandStateBar.prototype.onDownload = function (data) {
        this.bar = $(data).appendTo('body');
        PubSub.subscribe('command.state', this.onStateChange.bind(this));
        this.vpBar = ViewportRelative.create(this.bar, {
            top: 5
        });
        if (Env.getParam('statusbar', 'on') === 'on') {
            PubSub.publish('command.exec', 'ui.status.on');
        }
    };

    CommandStateBar.prototype.init = function () {
        return $.get(Env.resource('commandstatebar.html')).done(this.onDownload.bind(this));
    };

    function create() {
        var stateBar = new CommandStateBar();
        return stateBar.init();
    }

    return {
        create: create
    };
});
