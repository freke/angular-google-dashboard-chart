/**
 * @description Google Chart Api Directive Module for AngularJS
 * @version 0.0.1
 * @author David AAberg <davabe@hotmail.com>
 * @author GitHub contributors
 * @license MIT
 * @year 2013
 */
(function (document, window, angular) {
    'use strict';

    angular.module('googlechart', [])
        .value('googleChartApiConfig', {
        version: '1',
        optionalSettings: {
            packages: ['corechart', 'controls']
        }
    })
        .provider('googleJsapiUrl', function () {
        var protocol = 'https:',
            url = '//www.google.com/jsapi';

        this.setProtocol = function (newProtocol) {
            protocol = newProtocol;
        };

        this.setUrl = function (newUrl) {
            url = newUrl;
        };

        this.$get = function () {
            return (protocol || '') + url;
        };
    })
        .factory('googleChartApiPromise', ['$rootScope', '$q', 'googleChartApiConfig', 'googleJsapiUrl', function ($rootScope, $q, apiConfig, googleJsapiUrl) {
        var apiReady, onLoad, head, script;
        apiReady = $q.defer();
        onLoad = function () {
            // override callback function
            var settings = {
                callback: function () {
                    var oldCb = apiConfig.optionalSettings.callback;
                    $rootScope.$apply(function () {
                        apiReady.resolve();
                    });

                    if (angular.isFunction(oldCb)) {
                        oldCb.call(this);
                    }
                }
            };

            settings = angular.extend({}, apiConfig.optionalSettings, settings);

            window.google.load('visualization', apiConfig.version, settings);
        };
        head = document.getElementsByTagName('head')[0];
        script = document.createElement('script');

        script.setAttribute('type', 'text/javascript');
        script.src = googleJsapiUrl;

        if (script.addEventListener) { // Standard browsers (including IE9+)
            script.addEventListener('load', onLoad, false);
        } else { // IE8 and below
            script.onreadystatechange = function () {
                if (script.readyState === 'loaded' || script.readyState === 'complete') {
                    script.onreadystatechange = null;
                    onLoad();
                }
            };
        }

        head.appendChild(script);

        return apiReady.promise;
    }])
        .directive('googleDashboard', ['$timeout', '$rootScope', 'googleChartApiPromise', function ($timeout, $rootScope, googleChartApiPromise) {
        return {
            restrict: 'E',
            scope: {
                dashboard: '='
            },
            link: function ($scope, $elm, $attrs) {
                /* Watches, to refresh the dashboard when its data, formatters, options, view,
                        or type change. All other values intentionally disregarded to avoid double
                        calls to the draw function. Please avoid making changes to these objects
                        directly from this directive.*/

                function draw() {
                    if (!draw.triggered) {
                        draw.triggered = true;
                        $timeout(function () {
                            var dashboard = new google.visualization.Dashboard($elm[0]);
                            dashboard.bind($scope.controllers, $scope.charts);

                            $timeout(function () {
                                dashboard.draw($scope.dashboard.data);
                                draw.triggered = false;
                            });
                        }, 0, true);
                    }
                }

                function drawAsync() {
                    googleChartApiPromise.then(function () {
                        draw();
                    });
                }

                $scope.$watch(function () {
                    if ($scope.dashboard) {
                        return {
                            data: $scope.dashboard.data
                        };
                    }
                    return $scope.dashboard;
                }, function () {
                    drawAsync();
                }, true); // true is for deep object equality checking

                // Redraw the chart if the window is resized
                var resizeHandler = $rootScope.$on('resizeMsg', function () {
                    $timeout(function () {
                        drawAsync();
                    });
                });

                //Cleanup resize handler.
                $scope.$on('$destroy', function () {
                    resizeHandler();
                });
            },
            controller: function ($scope) {
                $scope.controllers = [];
                $scope.charts = [];

                this.addController = function (controller) {
                    $scope.controllers.push(controller);
                };

                this.addChart = function (chart) {
                    $scope.charts.push(chart);
                };
            }
        };
    }])
        .directive('googleController', ['googleChartApiPromise', function (googleChartApiPromise) {
        return {
            restrict: 'E',
            scope: {
                controller: '='
            },
            require: '^googleDashboard',
            link: function ($scope, $elm, $attrs, googleDashboard) {
                googleChartApiPromise.then(function () {
                    var controlWraperArgs, controlWrapper;
                    controlWraperArgs = {
                        controlType: $scope.controller.type,
                        containerId: $elm[0],
                        options: $scope.controller.options
                    };
                    controlWrapper = new google.visualization.ControlWrapper(controlWraperArgs);
                    googleDashboard.addController(controlWrapper);
                });
            }
        };
    }])
        .directive('googleChart', ['$timeout', 'googleChartApiPromise', function ($timeout, googleChartApiPromise) {
        return {
            restrict: 'E',
            scope: {
                chart: '=',
                onSelect: '&'
            },
            require: '^googleDashboard',
            link: function ($scope, $elm, $attrs, googleDashboard) {
                $scope.$watch(function () {
                    if ($scope.chart) {
                        return {
                            selected: $scope.chart.selected
                        };
                    }
                    return $scope.chart;
                }, function () {
                    select();
                }, true); // true is for deep object equality checking

                googleChartApiPromise.then(function () {
                    var chartWrapperArgs = {
                        chartType: $scope.chart.type,
                        containerId: $elm[0],
                        view: $scope.chart.view,
                        options: $scope.chart.options
                    };
                    $scope.chartWrapper = new google.visualization.ChartWrapper(chartWrapperArgs);

                    google.visualization.events.addListener($scope.chartWrapper, 'select', function () {
                        var selectedItem = $scope.chartWrapper.getChart().getSelection()[0];
                        $scope.$apply(function () {
                            $scope.onSelect({
                                selectedItem: selectedItem
                            });
                        });
                    });

                    googleDashboard.addChart($scope.chartWrapper);
                });

                function select() {
                    if ($scope.chartWrapper !== undefined) {
                        $timeout(function () {
                            $scope.chartWrapper.getChart().setSelection($scope.chart.selected);
                        }, 0, true);
                    }
                }
            }
        };
    }])
        .run(['$rootScope', '$window', function ($rootScope, $window) {
        angular.element($window).bind('resize', function () {
            $rootScope.$emit('resizeMsg');
        });
    }]);

})(document, window, window.angular);