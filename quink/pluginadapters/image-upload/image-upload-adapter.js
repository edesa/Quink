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

require([
        'Underscore',
        'jquery',
        'ext/PluginAdapterContext'
    ], function (_, $, Context) {
        'use strict';
        //the iframe and the imageUploader component
        var $iframe,
            imgData,
            $mask,
            BODY_TAG_NAME = 'body';

        //two finger scroll on trackpad appears as the mousewheel event
        $mask = $('<div>').addClass('qk_mask')
            .on('touchstart touchmove touchend click mousewheel', function (event) {
                event.preventDefault();
            });
        /**
         * Plugin API method - see Quink-Plugin-Notes document
         * (i) add the plugin markup to the DOM (re-using any plugin artifacts that have been previously downloaded)
         * (ii) show the plugin, ready to be used
         *
         * @param data - used to supply the open function with any data that is to be used by the plugin.
         *
         */
        function open(data) {
            imgData = data;
            $iframe.appendTo(BODY_TAG_NAME);
            $mask.appendTo(BODY_TAG_NAME);
            $iframe[0].contentWindow.addEventListener('message', iframeReady, false);
            window.addEventListener('orientationchange', sizeFrame, false);
        }

        /**
         * Plugin API method - see Quink-Plugin-Notes document
         *
         * Publish on a saved topic and as part of the publication include the serialised data to be saved
         */
        function save() {
            var data = $iframe[0].contentWindow.imageUploader.getImageElementAsString();
            closePlugin('saved', data);
        }

        /**
         * Plugin API method - see Quink-Plugin-Notes document
         *
         * When ready to exit, publish on an exited topic
         */
        function exit() {
            closePlugin('exited');
        }

        /**
         * save() and exit() API functions call this to remove the iframe
         * containing the image uploader so that control can pass back to the main form
         */
        function closePlugin(topic, data) {
            $iframe[0].contentWindow.removeEventListener('message', iframeReady, false);
            $iframe.addClass('qk_invisible');
            $iframe.detach();
            $mask.detach();
            window.removeEventListener('orientationchange', sizeFrame, false);
            Context.publish(topic, data);
        }

        /**
         * Comment brought forward from other code:
         *
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
            console.log('[' + new Date().toISOString() + ']' + "sizeFrame event");
            //I didn't experience the issues in the comment, above, so disabling this code
//        var reqHeight = window.innerHeight,
//            initialHeight = frame.height();
//        frame.contents().find('body').height(reqHeight);
//        setTimeout(function () {
//            if (frame.height() === initialHeight) {
//                frame.height(reqHeight);
//            }
//        }, 0);
        }

        /**
         * Respond to message from iframe so that existing image can be populated
         *
         * If data is provided, load with the image so that it can be viewed and, optionally, changed
         */
        function iframeReady(e) {
            if (e.data === "imageUploadReady") {
                if (imgData) {
                    //imageUploader has already been set as a global variable
                    $iframe[0].contentWindow.imageUploader.setImage(imgData);
                }
            }
            sizeFrame();
            setTimeout(function () {
                $iframe.removeClass('qk_invisible');
                Context.publish('opened');
            }, 0);
        }

        //called by function fetchCss to
        //get the markup that comprises the UI for this plugin
        function downloadHTML() {
            var url = Context.adapterUrl('image-upload/image-upload-embed.html');
            $.get(url).done(function (data) {
                $iframe = $(data);
                //associate methods in this object with the lifecycle callbacks for plugins
                Context.publish('loaded', {
                    open: open,
                    save: save,
                    exit: exit,
                    dom: $iframe[0].parentNode
                });
            }).fail(function (jqxhr, textStatus, error) {
                console.log('Failed to load image upload markup from: ' + url + '. ' + jqxhr.status + '. ' + error);
            });
        }

        //called by function fetchScript to
        //get the style sheet that comprises the UI for this plugin
        function downloadCSSAndHTML() {
            var url = Context.adapterUrl('image-upload/image-upload-embed.css');
            $.get(url).done(function (data) {
                $('<style>').html(data).appendTo('head');
                downloadHTML();
            }).fail(function (jqxhr, textStatus, error) {
                console.log('Failed to load image upload css from: ' + url + '. ' + jqxhr.status + '. ' + error);
            });
        }

        /**
         * Get the scripts, then the css, which gets the html
         */
        function fetchPluginArtifacts() {
            //var url = Context.adapterUrl('image-upload/embed-api.js');
            //$.getScript(url).done(function () {
            downloadCSSAndHTML();
            //}).fail(function (jqxhr, textStatus, error) {
            //    console.log('Failed to load embed-image-upload from: ' + url + '. ' + jqxhr.status + '. ' + error);
            //});
        }

        //immediately run fetchScript to set things up
        fetchPluginArtifacts();
    }
)
;
