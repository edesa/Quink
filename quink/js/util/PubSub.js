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
    'Underscore'
], function (_) {
    'use strict';

    /**
     * Subscriptions are stored as follows. Top level is an object where each property name is
     * a topic. The value of each topic is another object that contains all the subscribers for
     * that topic.
     * The subscriptions for a topic is an object where the properties are the ids of the
     * subscribers. The value of the ids is an array of functions that will be called when
     * a message is published on that topic.
     */
    var PubSub = function () {
        this.subscribers = {};
        this.id = 0;
    };

    PubSub.prototype.subscribe = function (topic, func) {
        var subs = this.subscribers;
        if (!subs[topic]) {
            subs[topic] = [];
        }
        subs[topic].push({ func: func, id: this.id });
        return this.id++;
    };

    PubSub.prototype.unsubscribe = function (id) {
        var subs = this.subscribers,
            topicName, topic, i;
        for (topicName in subs) {
            if (subs.hasOwnProperty(topicName)) {
                topic = subs[topicName];
                for (i = topic.length - 1; i >= 0; i--) {
                    if (topic[i].id === id) {
                        topic.splice(i, 1);
                        if (topic.length === 0) {
                            delete subs[topicName];
                        }
                        return;
                    }
                }
            }
        }
    };

    PubSub.prototype.publish = function (topic, message) {
        var subs = this.subscribers;
        _.each(subs[topic], function (sub) {
            sub.func(message, topic);
        });
    };

    var instance = new PubSub();

    return {
        publish: _.bind(instance.publish, instance),
        subscribe: _.bind(instance.subscribe, instance),
        unsubscribe: _.bind(instance.unsubscribe, instance)
    };
});
