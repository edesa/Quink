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
    'jquery',
    'util/Env',
    'util/PubSub'
], function ($, Env, PubSub) {
    'use strict';

    /**
     * Downloads resources that are passed in as the arguments to this function. If a file name
     * has no directory part it's assumed to be located in the resources directory.
     * Each file downloaded results in a publication that uses the file's base name without the
     * extension as part of the topic name. So 'foo.html' would result in a publication using
     * the topic 'download.foo'.
     * Once all files have been downloaded an additional publication of 'download.all' is made.
     * Failed downloads result in a 'download.fail' publication.
     */
    function download() {
        var jqXhrArray = Array.prototype.slice.call(arguments, 0).map(function (name) {
                var fullName = name.indexOf('/') < 0 ? Env.resource(name) : name;
                return $.get(fullName).done(function (data) {
                    var index = name.indexOf('.'),
                        id;
                    index = index < 0 ? 0 : index;
                    id = name.substr(0, index);
                    PubSub.publish('download.' + id, data);
                });
            });
        $.when.apply(null, jqXhrArray).then(function () {
            PubSub.publish('download.all');
        }, function () {
            PubSub.publish('download.fail');
        });
    }

    return {
        download: download
    };
});
