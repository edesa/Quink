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

/*global embedded_svg_edit */
require([
    'Underscore',
    'jquery',
    'ext/PluginAdapterContext'
], function (_, $, Context) {
    'use strict';
    //the iframe and the imageUploader component
    var frame,
        imageUploader;
    /**
     * Runs func every delay milliseconds until func returns true.
     * (same technique as method draw and svg edit to wait till DOM is loaded)
     */
    function until(func, delay) {
        if (!func()) {
            _.delay(until, delay, func, delay);
        }
    }

    /**
     * Called by function configureForEmbed to
     * size the body of the iframe to match the body of the containing document. Anything else
     * doesn't seem to work on iOS. Specifically trying to do it all in css using height 100%
     * results in an iframe that's too tall for the viewport.
     * The timeout is to allow the reflow to take place after resizing the iframe's body. The
     * additional resize is needed on desktop Chrome which won't have resized the iframe to
     * accommodate the changed body size. The additional iframe resize breaks the layout on iOS
     * which will have already resized the frame.
     */
    function sizeFrame() {
        var reqHeight = window.innerHeight,
            initialHeight = frame.height();
        frame.contents().find('body').height(reqHeight);
        setTimeout(function () {
            if (frame.height() === initialHeight) {
                frame.height(reqHeight);
            }
        }, 0);
    }

    /**
     * Called from open() function (via underscore until) to
     * set up the frame to be embedded
     *
     * If data is provided, load with the image so that it can be viewed and, optionally, changed
     */
    function configureForEmbed(data)  {
        if (data) {
            until(_.partial(imageUploader.setImage, data), 100);
        }
        sizeFrame();
        setTimeout(function () {
            frame.removeClass('qk_invisible');
            Context.publish('opened');
        }, 0);

        return true;
    }
    /**
     *
     * remove the iframe containing the image uploader so that control can pass back to the main form
     * called by functions save() and exit()
     *
     */
    function closePlugin(topic, data) {
        frame.detach();
        frame.addClass('qk_invisible');
        window.removeEventListener('orientationchange', sizeFrame, false);
        Context.publish(topic, data);
    }

    /**
     * Callback
     *
     * set up in fetchMarkup call when opening the plugin.
     * ("save" menu option -> save() method
     */
    function save() {
        imageUploader.getImageElementAsString()(function (data, error) {
            if (error) {
                console.log('save error: ' + error);
            } else {
                closePlugin('saved', data);
            }
        });
    }

    /**
     * Callback
     *
     * set up in fetchMarkup call when opening the plugin.
     * ("exit" menu option -> exit() method
     */
    function exit() {
        closePlugin('exited');
    }

    /**
     * Callback
     *
     * established in fetchMarkup's Context.publish call
     * "open plugin" -> open() method
     * (fetchScript() completes before this call is issued)
     *
     * Loads the image upload DOM nodes into the document and configures it to run embedded.
     */
    function open(data) {
        frame.appendTo('body');
        window.addEventListener('orientationchange', sizeFrame, false);
        until(_.partial(configureForEmbed, data), 100);
    }
    //called by function fetchCss to
    //get the markup that comprises the UI for this plugin
    function fetchMarkup() {
        var url = Context.adapterUrl('image-upload/ImageUploadEmbed.html');
        $.get(url).done(function (data) {
            frame = $(data);
                imageUploader = new embedded_image_upload(frame[0]);
            //associate methods in this object with the lifecycle callbacks for plugins
            Context.publish('loaded', {
                open: open,
                save: save,
                exit: exit,
                dom: frame[0].parentNode
            });
        }).fail(function (jqxhr, textStatus, error) {
                console.log('Failed to load image upload markup from: ' + url + '. ' + jqxhr.status + '. ' + error);
            });
    }

    //called by function fetchScript to
    //get the style sheet that comprises the UI for this plugin
    function fetchCss() {
        var url = Context.adapterUrl('image-upload/ImageUploadEmbed.css');
        $.get(url).done(function (data) {
            $('<style>').html(data).appendTo('head');
            fetchMarkup();
        }).fail(function (jqxhr, textStatus, error) {
                console.log('Failed to load image upload css from: ' + url + '. ' + jqxhr.status + '. ' + error);
            });
    }

    /**
     * Get the scripts, then the css, which gets the html
     */
    function fetchPluginArtifacts() {
        var url = Context.pluginUrl('image-upload/embedapi.js');
        $.getScript(url).done(function () {
            fetchCss();
        }).fail(function (jqxhr, textStatus, error) {
                console.log('Failed to load embed-image-upload from: ' + url + '. ' + jqxhr.status + '. ' + error);
            });
    }
    //immediately run fetchScript to set things up
    fetchPluginArtifacts();
});
