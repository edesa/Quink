/**
 * Copyright (c), 2013-2014 IMD - International Institute for Management Development, Switzerland.
 *
 * See the file license.txt for copying permission.
 */

define([
    'jquery'
], function ($) {
    'use strict';

    var PluginContext = function (def) {
        if (def.def) {
            this.container = def.el;
            this.definition = def.def;
        } else {
            this.container = def.container;
            this.definition = def;
        }
    };

    PluginContext.prototype.getContainer = function () {
        return this.container;
    };

    PluginContext.prototype.isEdit = function () {
        return this.getContainer() instanceof $;
    };

    /**
     * Returns the data that the containing element current holds. The containing element can be
     * created by the plugin or by Quink. In the former case the element and its content are returned.
     * In the latter case only the content is returned.
     */
    PluginContext.prototype.getContainerData = function () {
        var data = null,
            cont;
        if (this.isEdit()) {
            cont = this.getContainer();
            if (this.getDefinition().container.pluginCreated) {
                // Use outerHTML if possible as it's more efficient
                if (cont[0].outerHTML !== undefined) {
                    data = cont[0].outerHTML;
                } else {
                    data = $('<div>').append(cont.clone()).html();
                }
            } else {
                data = cont.html();
            }
        }
        return data;
    };

    /**
     * The plugin data replaces anything in the existing range.
     */
    PluginContext.prototype.commit = function (data, range) {
        var cfg, el, cls;
        if (this.isEdit()) {
            if (!this.getDefinition().container.pluginCreated) {
                this.getContainer().html(data);
            } else {
                this.getContainer().replaceWith(data);
            }
        } else {
            cfg = this.getContainer();
            if (!cfg.pluginCreated) {
                cls = cfg['class'];
                el = document.createElement(cfg.element);
                if (cls) {
                    el.setAttribute('class', cls);
                }
                el.innerHTML = data;
            } else {
                el = $(data)[0];
            }
            if (!range.collapsed) {
                range.deleteContents();
            }
            range.insertNode(el);
            range.setStartAfter(el);
            range.collapse(false);
        }
    };

    PluginContext.prototype.getDefinition = function () {
        return this.definition;
    };

    var theInstance;

    function create(def) {
        if (theInstance) {
            throw new Error('Plugin context already exists');
        }
        theInstance = new PluginContext(def);
    }

    function destroy() {
        theInstance = null;
    }

    function getContainer() {
        return theInstance.getContainer();
    }

    function getData() {
        return theInstance.getContainerData();
    }

    function commit(data, range) {
        theInstance.commit(data, range);
    }

    function getDefinition() {
        return theInstance.getDefinition();
    }

    return {
        create: create,
        destroy: destroy,
        getContainer: getContainer,
        getData: getData,
        commit: commit,
        getDefinition: getDefinition
    };
});
