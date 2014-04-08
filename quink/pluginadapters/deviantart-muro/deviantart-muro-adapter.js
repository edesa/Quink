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
        BODY_TAG_NAME = "body",
        IMAGE_TAG = "<img>",
        imageHTML;
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
        window.addEventListener('message', handleDeviantArtReady, false);
        //add the iframe to the HTML
        $iframe.appendTo(BODY_TAG_NAME);
        $iframe.removeClass('qk_invisible');
        if (data) {
            imageHTML = data;
        } else {
            console.log('[' + new Date().toISOString() + ']' + 'DeviantArtPlugin publishing opened event');
            Context.publish('opened');
        }
    }
    /**
     * Plugin API method - see Quink-Plugin-Notes document
     *
     * Publish on a saved topic and as part of the publication include the serialised data to be saved
     */
    function save() {
        window.addEventListener('message', handleQueryImageReply, false);

        console.log('[' + new Date().toISOString() + ']' + 'DeviantArtPlugin.save() called');
        //reply listener was registered in the open method
        $iframe[0].contentWindow.postMessage({
            type:      'query',
            query:   'image'
        }, '*');
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
     *
     * @param message
     */
    function handleQueryImageReply(message) {
        console.log('[' + new Date().toISOString() + ']' + 'handleQueryImageReply message.data=' + JSON.stringify(message.data));
        //only handle replies to query image
        if (message.data && message.data.image) {
            var $image = $(IMAGE_TAG);
            $image.attr('src', message.data.image);
            console.log('[' + new Date().toISOString() + ']' + 'DeviantArtPlugin publishing saved event');
            closePlugin('saved', $image[0].outerHTML);
        }
    }
    /**
     * deviantArt issues a number of messages. The data.type values encountered during debugging (so actually issued by this implementation) are:
     *
     * gotDeviationId
     *
     * ready
     *
     * @param message
     */
    function handleDeviantArtReady(message) {
        if (message.data && message.data.type === 'ready') {
            if (imageHTML) {
                $iframe[0].contentWindow.postMessage({
                    type: 'command',
                    command: 'importLayer',
                    layerData: {
                        url: $(imageHTML).attr('src'),
                        width: 300,
                        height: 300
                    }
                }, '*');
            }
            //only handle replies to query image
            Context.publish('opened');
        }
//
//        if (message.data && message.data.image) {
//            var $image = $(IMAGE_TAG);
//            $image.attr('src', message.data.image);
//            closePlugin('saved', $image[0].outerHTML);
//        }
    }
    /**
     * save() and exit() API functions call this to remove the iframe
     * containing the image uploader so that control can pass back to the main form
     */
    function closePlugin(topic, data) {
        window.removeEventListener('message', handleQueryImageReply, false);
        window.removeEventListener('message', handleDeviantArtReady, false);
        $iframe.addClass('qk_invisible');
        $iframe.detach();
        console.log('[' + new Date().toISOString() + ']' + 'DeviantArtPlugin publishing ' + topic + ' event');
        Context.publish(topic, data);
    }
    function downloadHTML() {
        var url = Context.adapterUrl('deviantart-muro/deviantart-muro-embed.html');
        $.get(url).done(function (data) {
            $iframe = $(data);
            console.log('[' + new Date().toISOString() + ']' + 'DeviantArtPlugin publishing loaded event');
            //associate methods in this object with the lifecycle callbacks for plugins
            Context.publish('loaded', {
                open: open,
                save: save,
                exit: exit
            });
            console.log('DeviantArtPlugin.fetchPluginArtifacts() download HTML successful');
        }).fail(function (jqxhr, textStatus, error) {
            console.log('DeviantArtPlugin.fetchPluginArtifacts() failed to load deviantart muro markup from: ' + url + '. ' + jqxhr.status + '. ' + error);
        });
    }

    function downloadCSSAndHTML() {
        var url = Context.adapterUrl('deviantart-muro/deviantart-muro-embed.css');
        $.get(url).done(function (data) {
            $('<style>').html(data).appendTo('head');
            console.log('DeviantArtPlugin.fetchPluginArtifacts() download CSS successful');
            downloadHTML();
        }).fail(function (jqxhr, textStatus, error) {
            console.log('Failed to load deviantArt css from: ' + url + '. ' + jqxhr.status + '. ' + error);
        });
    }

    function fetchPluginArtifacts() {
        console.log('[' + new Date().toISOString() + ']' + 'DeviantArtPlugin.fetchPluginArtifacts() called');
        downloadCSSAndHTML();
    }
    fetchPluginArtifacts();
});
