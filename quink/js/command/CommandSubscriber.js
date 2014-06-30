/**
 * Copyright (c), 2013-2014 IMD - International Institute for Management Development, Switzerland.
 *
 * See the file license.txt for copying permission.
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
