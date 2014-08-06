/**
 * Copyright (c), 2013-2014 IMD - International Institute for Management Development, Switzerland.
 *
 * See the file license.txt for copying permission.
 */

define([
    'jquery',
    'util/Env',
    'util/Event',
    'util/FocusTracker',
    'util/PubSub',
    'util/DomUtil'
], function ($, Env, Event, FocusTracker, PubSub, DomUtil) {
    'use strict';

    var InfoCommandHandler = function () {
        this.info = {};
        this.mask = $('<div>').addClass('qk_mask')
            .on('touchmove', function (event) {
                event.preventDefault();
            });
        this.fetchContainerMarkup();
    };

    /**
     * Need to make sure that the info content is scrollable where needed, but nothing else can
     * be scrolled. The latter is an issue on iOS.
     */
    InfoCommandHandler.prototype.initInfoContainer = function (data) {
        var me = this;
        this.infoContainer = $(data);
        this.infoContainer.find('.qk_info_close_button').on(Event.eventName('end'), function (event) {
            event.preventDefault();
            me.infoContainer.detach();
            me.mask.detach();
            $(document.body).removeClass('qk_no_scroll');
            FocusTracker.restoreFocus();
            PubSub.publish('info.closed');
        });
        this.infoContainer.on('touchmove', function (event) {
            var content = $(event.delegateTarget).find('.qk_info_content');
            if (content[0].scrollHeight <= content.outerHeight()) {
                event.preventDefault();
            }
        });
    };

    InfoCommandHandler.prototype.fetchContainerMarkup = function () {
        var url = Env.resource('infocontainer.html'),
            me = this;
        $.get(url, function (data) {
            me.initInfoContainer(data);
            console.log('info container markup downloaded');
        }).fail(function (jqXhr, textStatus, error) {
            console.log('Failed to download info container markup from: ' + url + '. ' + jqXhr.status + ' ' + error);
        });
    };

    InfoCommandHandler.prototype.show = function (id) {
        if (!!this.getContent(id)) {
            this.addToDom(id);
        } else {
            this.fetch(id);
        }
    };

    InfoCommandHandler.prototype.getContent = function (id) {
        return this.info[id];
    };

    InfoCommandHandler.prototype.fetch = function (id) {
        var url = Env.resource(id + '.html'),
            me = this;
        $.get(url, function (data) {
            console.log('Downloaded ' + url);
            me.info[id] = data;
            me.addToDom(id);
        }).fail(function (jqXhr, textStatus, error) {
            console.log('Failed to download content from: ' + url + '. ' + jqXhr.status + ' ' + error);
        });
    };

    InfoCommandHandler.prototype.addToDom = function (id) {
        var infoContainer;
        PubSub.publish('info.open', id);
        FocusTracker.removeFocus();
        this.mask.appendTo('body');
        $(document.body).addClass('qk_no_scroll');
        infoContainer = this.infoContainer.find('.qk_info_content');
        infoContainer.html(this.getContent(id));
        DomUtil.makeQuinkRelative(infoContainer[0]);
        this.infoContainer.appendTo('body');
    };

    return InfoCommandHandler;
});
