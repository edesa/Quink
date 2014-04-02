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
/*global */
require(['Underscore','jquery','ext/PluginAdapterContext'], function (_, $, Context) {
    'use strict';
    //the iframe component
    var $iframe,
        BODY_TAG_NAME = "body";
    /**
     * Plugin API method - see Quink-Plugin-Notes document
     * (i) add the plugin markup to the DOM (re-using any plugin artifacts that have been previously downloaded)
     * (ii) show the plugin, ready to be used
     *
     * @param data - used to supply the open function with any data that is to be used by the plugin.
     *
     */
    function open(data) {
        console.log('[' + new Date().toISOString() + ']' + 'DeviantArtPlugin.open(data) called');
        //add the iframe to the HTML
        $iframe.appendTo(BODY_TAG_NAME);
        $iframe.removeClass('qk_invisible');
        console.log('[' + new Date().toISOString() + ']' + 'DeviantArtPlugin publishing opened event');
        Context.publish('opened');
    }

    /**
     * Plugin API method - see Quink-Plugin-Notes document
     *
     * Publish on a saved topic and as part of the publication include the serialised data to be saved
     */
    function save() {
        console.log('[' + new Date().toISOString() + ']' + 'DeviantArtPlugin.save() called');
        console.log('[' + new Date().toISOString() + ']' + 'DeviantArtPlugin publishing saved event');
        closePlugin('saved');
    }

    /**
     * Plugin API method - see Quink-Plugin-Notes document
     *
     * When ready to exit, publish on an exited topic
     */
    function exit() {
        console.log('[' + new Date().toISOString() + ']' + 'DeviantArtPlugin.exit() called');
        closePlugin('exited');
    }

    /**
     * save() and exit() API functions call this to remove the iframe
     * containing the image uploader so that control can pass back to the main form
     */
    function closePlugin(topic, data) {
        $iframe.addClass('qk_invisible');
        $iframe.detach();
        console.log('[' + new Date().toISOString() + ']' + 'DeviantArtPlugin publishing ' + topic + ' event');
        Context.publish(topic, data);
    }

    function fetchPluginArtifacts() {
        console.log('[' + new Date().toISOString() + ']' + 'DeviantArtPlugin.fetchPluginArtifacts() called');
        var url = Context.adapterUrl('deviantart-muro/deviantart-muro-embed.css');
        $.get(url).done(function (data) {
            $('<style>').html(data).appendTo('head');
            var url = Context.adapterUrl('deviantart-muro/deviantart-muro-embed.html');
            $.get(url).done(function (data) {
                $iframe = $(data);
                console.log('[' + new Date().toISOString() + ']' + 'DeviantArtPlugin publishing loaded event');
                Context.publish('loaded', {
                    open: open,
                    save: save,
                    exit: exit
                });
                console.log('DeviantArtPlugin.fetchPluginArtifacts() download markup successful');
            }).fail(function (jqxhr, textStatus, error) {
                console.log('DeviantArtPlugin.fetchPluginArtifacts() failed to load deviantart muro markup from: ' + url + '. ' + jqxhr.status + '. ' + error);
            });
        }).fail(function (jqxhr, textStatus, error) {
            console.log('Failed to load image upload css from: ' + url + '. ' + jqxhr.status + '. ' + error);
        });
    }
    fetchPluginArtifacts();
});
