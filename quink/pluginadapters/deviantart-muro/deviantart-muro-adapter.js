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
/*
 *
 * Makes use of the deviantArt API. This discussion from the muro API web page describes the notification mechanism:
 *
 * Embedded deviantART muro communicates with the embedding site via the DOM window.postMessage() mechanism,
 * sending messages representing events happening within the application.
 *
 * The embedding site can also communciate with the embedded deviantART muro, sending commands and queries via
 * iframe.contentWindow.postMessage(). Commands should be considered those messages designed to make
 * deviantART muro take some action, whereas queries are side-effect-free requests for information.
 *
 * The type of an API message is determined by the type property of the passed message and will be one of:
 *
 * - command for sending a command to the application.
 * - query for sending a query to the application.
 * - or the name of the event being received from the application.
 *
 */
require(['Underscore', 'jquery', 'ext/PluginAdapterContext'], function (_, $, Context) {
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
        console.log('[' + new Date().toISOString() + ']' + 'DeviantArtPlugin.save() called');

        window.addEventListener('message', handleQueryImageReply, false);

        $iframe[0].contentWindow.postMessage({
            type: 'query',
            query: 'image'
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

    function isSizeInPixels($imageHTML) {
        return $imageHTML.width() > 0 && /px$/.test($imageHTML.css("width"));
    }

    /**
     *
     * @param $imageHTML - a jquery object for which the size is in pixels
     *
     */
    function getImageComputedSizeInPixels($imageHTML) {
        var imageWidth, imageHeight;
        //guard condition
        if (!(isSizeInPixels($imageHTML))) {
            throw new Error("getImageComputedSizeInPixels can only be called when size is in pixels");
        }
        imageHeight = $imageHTML.height();
        imageWidth = $imageHTML.width();
        return {
            height: imageHeight,
            width: imageWidth
        };
    }
    /**
     *
     * @param $image - an image wrapped by jQuery
     */
    function getImageNaturalSize($imageHTML) {
        var imageWidth, imageHeight;
        //guard condition
        imageHeight = $imageHTML[0].naturalHeight;
        imageWidth = $imageHTML[0].naturalWidth;
        return {
            height: imageHeight,
            width: imageWidth
        };
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
        var size, $imageHTML;
        if (message.data && message.data.type === 'ready') {
            if (imageHTML) {
                $imageHTML = $(imageHTML);
                if (isSizeInPixels($imageHTML)) {
                    size = getImageComputedSizeInPixels($imageHTML);
                } else {
                    size = getImageNaturalSize($imageHTML);
                }
                console.log('[' + new Date().toISOString() + ']' + 'DeviantArtPlugin.handleDeviantArtReady width=' + size.width);
                console.log('[' + new Date().toISOString() + ']' + 'DeviantArtPlugin.handleDeviantArtReady height=' + size.height);
                window.addEventListener('message', handleNewCanvasCommandComplete, false);
                $iframe[0].contentWindow.postMessage({
                    type: 'command',
                    command: 'newCanvas',
                    width: size.width,
                    height: size.height,
                    layerData: {
                        url: $(imageHTML).attr('src'),
                        width: size.width,
                        height: size.height
                    }
                }, '*');
                imageHTML = null;
            } else {
                //no image to load so we are finished
                Context.publish('opened');
            }
        }
    }

    /**
     *
     * Respond to deviantArt importLayer commandComplete message by publishing the "opened" message
     *
     * @param message - the message from deviantArt
     */

    function handleNewCanvasCommandComplete(message) {
        if (message.data && message.data.command === 'newCanvas' && message.data.type === 'commandComplete') {
            //deviantArt has loaded the image, so we are finished
            Context.publish('opened');
        }
    }

    /**
     * save() and exit() API functions call this to remove the iframe
     * containing the image uploader so that control can pass back to the main form
     */
    function closePlugin(topic, data) {
        window.removeEventListener('message', handleQueryImageReply, false);
        window.removeEventListener('message', handleDeviantArtReady, false);
        window.removeEventListener('message', handleNewCanvasCommandComplete, false);
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
                exit: exit,
                dom: $iframe[0].parentNode
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
