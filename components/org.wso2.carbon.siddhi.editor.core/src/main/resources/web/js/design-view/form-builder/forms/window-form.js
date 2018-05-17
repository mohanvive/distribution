/**
 * Copyright (c) 2018, WSO2 Inc. (http://www.wso2.org) All Rights Reserved.
 *
 * WSO2 Inc. licenses this file to you under the Apache License,
 * Version 2.0 (the "License"); you may not use this file except
 * in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied. See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

define(['require', 'log', 'jquery', 'lodash', 'attribute', 'window'],
    function (require, log, $, _, Attribute, Window) {

        /**
         * @class WindowForm Creates a forms to collect data from a window
         * @constructor
         * @param {Object} options Rendering options for the view
         */
        var WindowForm = function (options) {
            if (options !== undefined) {
                this.configurationData = options.configurationData;
                this.application = options.application;
                this.formUtils = options.formUtils;
                this.consoleListManager = options.application.outputController;
                var currentTabId = this.application.tabController.activeTab.cid;
                this.designViewContainer = $('#design-container-' + currentTabId);
                this.toggleViewButton = $('#toggle-view-button-' + currentTabId);
            }
        };

        /**
         * @function generate form when defining a form
         * @param i id for the element
         * @param formConsole Console which holds the form
         * @param formContainer Container which holds the form
         */
        WindowForm.prototype.generateDefineForm = function (i, formConsole, formContainer) {
            var self = this;
            var propertyDiv = $('<div id="property-header"><h3>Define Window </h3></div>' +
                '<div id="define-window" class="define-window"></div>');
            formContainer.append(propertyDiv);

            // generate the form to define a window
            var editor = new JSONEditor(formContainer[0], {
                schema: {
                    type: "object",
                    title: "Window",
                    properties: {
                        name: {
                            type: "string",
                            title: "Name",
                            minLength: 1,
                            required: true,
                            propertyOrder: 1
                        },
                        attributes: {
                            required: true,
                            propertyOrder: 2,
                            type: "array",
                            format: "table",
                            title: "Attributes",
                            uniqueItems: true,
                            minItems: 1,
                            items: {
                                type: "object",
                                title : 'Attribute',
                                properties: {
                                    name: {
                                        title: "Name",
                                        type: "string",
                                        minLength: 1
                                    },
                                    type: {
                                        title: "Type",
                                        type: "string",
                                        enum: [
                                            "string",
                                            "int",
                                            "long",
                                            "float",
                                            "double",
                                            "boolean"
                                        ],
                                        default: "string"
                                    }
                                }
                            }
                        },
                        functionName: {
                            type: "string",
                            title: "Function Name",
                            minLength: 1,
                            required: true,
                            propertyOrder: 3
                        },
                        parameters: {
                            required: true,
                            propertyOrder: 4,
                            type: "array",
                            format: "table",
                            title: "Parameters",
                            uniqueItems: true,
                            minItems: 1,
                            items: {
                                type: "object",
                                title : 'Parameter',
                                properties: {
                                    parameterValue: {
                                        type: "string",
                                        minLength: 1
                                    }
                                }
                            }
                        },
                        outputEventType: {
                            type: "string",
                            title: "Output Event Type",
                            propertyOrder: 5,
                            enum: [
                                "current events",
                                "expired events",
                                "all events"
                            ],
                            default: "current events"
                        }
                    }
                },
                show_errors: "always",
                disable_properties: false,
                disable_array_delete_all_rows: true,
                disable_array_delete_last_row: true,
                display_required_only: true,
                no_additional_properties: true
            });

            formContainer.append('<div id="submit"><button type="button" class="btn btn-default">Submit</button></div>');

            // 'Submit' button action
            var submitButtonElement = $(formContainer).find('#submit')[0];
            submitButtonElement.addEventListener('click', function () {

                var errors = editor.validate();
                if(errors.length) {
                    return;
                }
                var isWindowNameUsed = self.formUtils.isDefinitionElementNameUnique(editor.getValue().name);
                if (isWindowNameUsed) {
                    alert("Window name \"" + editor.getValue().name + "\" is already used.");
                    return;
                }
                // add the new out window to the window array
                var windowOptions = {};
                _.set(windowOptions, 'id', i);
                _.set(windowOptions, 'name', editor.getValue().name);
                _.set(windowOptions, 'function', editor.getValue().functionName);
                var parameters = [];
                _.forEach(editor.getValue().parameters, function (parameter) {
                    parameters.push(parameter.parameterValue);
                });
                _.set(windowOptions, 'parameters', parameters);
                if (editor.getValue().outputEventType !== undefined) {
                    if(editor.getValue().outputEventType === "all events"){
                        _.set(windowOptions, 'outputEventType', 'all_events');
                    } else if(editor.getValue().outputEventType === "current events"){
                        _.set(windowOptions, 'outputEventType', 'current_events');
                    } else if(editor.getValue().outputEventType === "expired events"){
                        _.set(windowOptions, 'outputEventType', 'expired_events');
                    }
                } else {
                    _.set(windowOptions, 'outputEventType', 'all_events');
                }
                var window = new Window(windowOptions);
                _.forEach(editor.getValue().attributes, function (attribute) {
                    var attributeObject = new Attribute(attribute);
                    window.addAttribute(attributeObject);
                });
                self.configurationData.getSiddhiAppConfig().addWindow(window);

                var textNode = $('#'+i).find('.windowNameNode');
                textNode.html(editor.getValue().name);

                // close the form window
                self.consoleListManager.removeFormConsole(formConsole);

                self.designViewContainer.removeClass('disableContainer');
                self.toggleViewButton.removeClass('disableContainer');
            });
            return editor.getValue().name;
        };

        /**
         * @function generate properties form for a window
         * @param element selected element(window)
         * @param formConsole Console which holds the form
         * @param formContainer Container which holds the form
         */
        WindowForm.prototype.generatePropertiesForm = function (element, formConsole, formContainer) {
            var self = this;
            self.designViewContainer.addClass('disableContainer');
            self.toggleViewButton.addClass('disableContainer');

            var id = $(element).parent().attr('id');
            // retrieve the window information from the collection
            var clickedElement = self.configurationData.getSiddhiAppConfig().getWindow(id);
            if(clickedElement === undefined) {
                var errorMessage = 'unable to find clicked element';
                log.error(errorMessage);
            }
            var name = clickedElement.getName();
            var attributes = clickedElement.getAttributeList();
            var functionName = clickedElement.getFunction();
            var savedParameterValues = clickedElement.getParameters();

            var parameters = [];
            _.forEach(savedParameterValues, function (savedParameterValue) {
                var parameterObject = {
                    parameterValue: savedParameterValue
                };
                parameters.push(parameterObject);
            });

            var outputEventType = '';
            var savedOutputEventType = clickedElement.getOutputEventType();
            if (savedOutputEventType === undefined) {
                outputEventType = 'all events';
            } else if (savedOutputEventType === 'all_events') {
                outputEventType = 'all events';
            } else if (savedOutputEventType === 'current_events') {
                outputEventType = 'current events';
            } else if (savedOutputEventType === 'expired_events') {
                outputEventType = 'expired events';
            }
            var fillWith = {
                name : name,
                attributes : attributes,
                functionName : functionName,
                parameters : parameters,
                outputEventType : outputEventType
            };
            var editor = new JSONEditor(formContainer[0], {
                schema: {
                    type: "object",
                    title: "Window",
                    properties: {
                        name: {
                            type: "string",
                            title: "Name",
                            minLength: 1,
                            required: true,
                            propertyOrder: 1
                        },
                        attributes: {
                            required: true,
                            propertyOrder: 2,
                            type: "array",
                            format: "table",
                            title: "Attributes",
                            uniqueItems: true,
                            minItems: 1,
                            items: {
                                type: "object",
                                title : 'Attribute',
                                properties: {
                                    name: {
                                        title: "Name",
                                        type: "string",
                                        minLength: 1
                                    },
                                    type: {
                                        title: "Type",
                                        type: "string",
                                        enum: [
                                            "string",
                                            "int",
                                            "long",
                                            "float",
                                            "double",
                                            "boolean"
                                        ],
                                        default: "string"
                                    }
                                }
                            }
                        },
                        functionName: {
                            type: "string",
                            title: "Function Name",
                            minLength: 1,
                            required: true,
                            propertyOrder: 3
                        },
                        parameters: {
                            required: true,
                            propertyOrder: 4,
                            type: "array",
                            format: "table",
                            title: "Parameters",
                            uniqueItems: true,
                            minItems: 1,
                            items: {
                                type: "object",
                                title : 'Parameter',
                                properties: {
                                    parameterValue: {
                                        type: "string",
                                        minLength: 1
                                    }
                                }
                            }
                        },
                        outputEventType: {
                            type: "string",
                            title: "Output Event Type",
                            propertyOrder: 5,
                            enum: [
                                "current events",
                                "expired events",
                                "all events"
                            ],
                            default: "current events"
                        }
                    }
                },
                show_errors: "always",
                disable_properties: false,
                disable_array_delete_all_rows: true,
                disable_array_delete_last_row: true,
                display_required_only: true,
                no_additional_properties: true,
                startval: fillWith
            });
            formContainer.append('<div id="form-submit"><button type="button" ' +
                'class="btn btn-default">Submit</button></div>' +
                '<div id="form-cancel"><button type="button" class="btn btn-default">Cancel</button></div>');

            // 'Submit' button action
            var submitButtonElement = $(formContainer).find('#form-submit')[0];
            submitButtonElement.addEventListener('click', function () {

                var errors = editor.validate();
                if(errors.length) {
                    return;
                }
                var isWindowNameUsed = self.formUtils.isDefinitionElementNameUnique(editor.getValue().name,
                    clickedElement.getId());
                if (isWindowNameUsed) {
                    alert("Window name \"" + editor.getValue().name + "\" is already used.");
                    return;
                }
                self.designViewContainer.removeClass('disableContainer');
                self.toggleViewButton.removeClass('disableContainer');

                var config = editor.getValue();

                // update selected window model
                clickedElement.setName(config.name);
                clickedElement.setFunction(config.function);
                var parameters = [];
                _.forEach(config.parameters, function (parameter) {
                    parameters.push(parameter.parameterValue);
                });
                clickedElement.setParameters(parameters);
                clickedElement.setOutputEventType(config.outputEventType);
                if (config.outputEventType !== undefined) {
                    if(config.outputEventType === "all events"){
                        clickedElement.setOutputEventType('all_events');
                    } else if(config.outputEventType === "current events"){
                        clickedElement.setOutputEventType('current_events');
                    } else if(config.outputEventType === "expired events"){
                        clickedElement.setOutputEventType('expired_events');
                    }
                } else {
                    clickedElement.setOutputEventType('all_events');
                }
                // removing all elements from attribute list
                clickedElement.clearAttributeList();
                // adding new attributes to the attribute list
                _.forEach(config.attributes, function (attribute) {
                    var attributeObject = new Attribute(attribute);
                    clickedElement.addAttribute(attributeObject);
                });

                var textNode = $(element).parent().find('.windowNameNode');
                textNode.html(config.name);

                // close the form window
                self.consoleListManager.removeFormConsole(formConsole);
            });

            // 'Cancel' button action
            var cancelButtonElement = $(formContainer).find('#form-cancel')[0];
            cancelButtonElement.addEventListener('click', function () {
                self.designViewContainer.removeClass('disableContainer');
                self.toggleViewButton.removeClass('disableContainer');

                // close the form window
                self.consoleListManager.removeFormConsole(formConsole);
            });
        };

        return WindowForm;
    });
