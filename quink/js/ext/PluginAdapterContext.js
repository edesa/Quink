/**
 * Copyright (c), 2013-2014 IMD - International Institute for Management Development, Switzerland.
 *
 * See the file license.txt for copying permission.
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
