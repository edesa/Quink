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
    'util/PubSub',
    'util/Type',
    'base/ListenerMgr'
], function (_, PubSub, Type, ListenerMgr) {
    'use strict';

    var CommandSubscriber = function () {
        PubSub.subscribe('command.exec', _.bind(this.onReceive, this));
    };

    Type.inheritFrom(CommandSubscriber, ListenerMgr);

    CommandSubscriber.prototype.onReceive = function (msg) {
        this.dispatch(msg);
    };

    var instance = new CommandSubscriber();

    return {
        register: _.bind(instance.register, instance),
        deregister: _.bind(instance.deregister, instance)
    };
});
