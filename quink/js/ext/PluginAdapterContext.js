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

/**
 * Intended to be used by the plugin adapter implementation.
 * Surfaces enough for the adapter to get at the plugin artifacts and to use the PubSub mechanism.
 * Removes the need for the plugin adapter to know the topic on which it publishes.
 */
define([
    'ext/PluginContext',
    'util/PubSub',
    'util/Env'
], function (Context, PubSub, Env) {
    'use strict';

    function publish(suffix, msg) {
        PubSub.publish(Context.getDefinition()['topic-prefix'] + '.' + suffix, msg);
    }

    function pluginUrl(name) {
        return Env.plugin(name);
    }

    function adapterUrl(name) {
        return Env.pluginAdapter(name);
    }

    return {
        publish: publish,
        pluginUrl: pluginUrl,
        adapterUrl: adapterUrl
    };
});
