'use strict';

var _postcss = require('postcss');

var _postcssValueParser = require('postcss-value-parser');

var _postcssValueParser2 = _interopRequireDefault(_postcssValueParser);

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _helpers = require('./helpers');

var _loader = require('./loader');

var _parsers = require('./parsers');

var parser = _interopRequireWildcard(_parsers);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

module.exports = (0, _postcss.plugin)('postcss-sketch', function (opts) {
    opts = _lodash2.default.assignIn({
        debugMode: false,
        noCache: false,
        cssModulesMode: false
    }, opts || {});
    if (_lodash2.default.get(opts, 'debugMode', false)) (0, _loader.enableDebugMode)();
    if (_lodash2.default.get(opts, 'noCache', false)) (0, _loader.disableCache)();
    return function (css, result) {
        (0, _loader.clearLoaderCache)();

        // Runs through all of the nodes (declorations) in the file
        css.walkDecls(function (decl) {
            if (decl.value.indexOf('sketch(') !== -1) {
                var parsedValue = (0, _postcssValueParser2.default)(decl.value);

                var file = parsedValue.nodes[0].nodes[0].value;

                // Resolve the file reference.
                var fileRef = void 0;
                if (decl.source.input.file) fileRef = _path2.default.join(_path2.default.dirname(decl.source.input.file), file); // Relative to CSS File
                else fileRef = _path2.default.join(file); // No CSS file, probably testing

                // Retrieve the sketch JSON dump
                var sketchData = (0, _loader.getSketchJSON)(_path2.default.resolve(fileRef));

                // Add a dependency.
                result.messages.push({
                    type: 'dependency',
                    file: fileRef,
                    parent: css.source.input.file
                });

                // Image SVG - Very basic POC - must set the width and height of the container manually.
                // All references saved inline
                // DO NOT ABUSE :)
                if (parsedValue.nodes[1].value.indexOf('.backgroundSVG') === 0) {
                    var symbolName = parsedValue.nodes[1].value.substr(15);
                    var symbol = (0, _helpers.findSymbol)(sketchData.pages, symbolName);
                    if (symbol) {
                        var svg = (0, _loader.getSketchImage)(fileRef, symbol.objectID, 'svg');
                        decl.value = 'url(data:image/svg+xml;base64,' + svg.toString('base64') + ')';
                    }
                }

                // Image PNG - Very basic POC - must set the width and height of the container manually.
                // DO NOT ABUSE :)
                if (parsedValue.nodes[1].value.indexOf('.backgroundPNG') === 0) {
                    var _symbolName = parsedValue.nodes[1].value.substr(15);
                    var _symbol = (0, _helpers.findSymbol)(sketchData.pages, _symbolName);
                    if (_symbol) {
                        var png = (0, _loader.getSketchImage)(fileRef, _symbol.objectID, 'png');
                        decl.value = 'url(data:image/png;base64,' + png.toString('base64') + ')';
                        (0, _helpers.appendRules)(decl.parent, {
                            prop: 'background-size',
                            value: '100% 100%'
                        });
                    }
                }

                // Symbols
                if (parsedValue.nodes[1].value.indexOf('.symbol') === 0) {
                    if (parsedValue.nodes[1].value.indexOf('.symbol.deep') === 0) {
                        var _symbolName2 = parsedValue.nodes[1].value.substr(13);
                        var _symbol2 = (0, _helpers.findSymbol)(sketchData.pages, _symbolName2);
                        if (!_symbol2) {
                            decl.warn(result, 'Missing symbol deep: ' + _symbolName2);
                        } else {
                            parser.processLayer(_symbol2, decl.parent, opts);
                        }
                    } else {
                        // Symbols
                        var _symbolName3 = parsedValue.nodes[1].value.substr(8);
                        var _symbol3 = (0, _helpers.findSymbol)(sketchData.pages, _symbolName3);
                        if (!_symbol3) {
                            decl.warn(result, 'Missing symbol: ' + _symbolName3);
                        } else {
                            parser.processLayer(_symbol3, decl.parent, opts, false);
                        }
                    }
                    // Finally remove it...
                    decl.remove();
                }

                // Shared Styles
                if (parsedValue.nodes[1].value.indexOf('.sharedStyle') === 0) {
                    var sharedStyleName = parsedValue.nodes[1].value.substr(13);
                    var style = _lodash2.default.find(sketchData.layerStyles.objects, ['name', sharedStyleName]);
                    if (!style) {
                        decl.warn(result, 'Missing shared style: ' + sharedStyleName);
                    } else {
                        // Do the font color...
                        if (_lodash2.default.has(style.value, 'contextSettings.opacity') && _lodash2.default.get(style.value, 'contextSettings.opacity', 1) < 1) {
                            decl.cloneBefore({
                                prop: 'opacity',
                                value: _lodash2.default.get(style.value, 'contextSettings.opacity', 1)
                            });
                        }

                        // Do the background...
                        var fill = _lodash2.default.find(style.value.fills, ['isEnabled', 1]);
                        if (fill) {
                            if (fill.fillType === 0) {
                                // Background-color
                                decl.cloneBefore({
                                    prop: 'background-color',
                                    value: _lodash2.default.get(fill, 'color.value')
                                });
                            }

                            if (fill.fillType === 1) {
                                // Gradient
                                var gradRule = void 0;
                                /* eslint-disable */
                                switch (fill.gradient.gradientType) {
                                    default:
                                    case 0:
                                        gradRule = 'linear-gradient(90deg, ';
                                        break;
                                    case 1:
                                        gradRule = 'radial-gradient(' + (0, _helpers.percentUnit)(fill.gradient.from.x) + ' ' + (0, _helpers.percentUnit)(fill.gradient.to.y) + ', ';
                                        break;
                                }
                                /* eslint-enable */
                                fill.gradient.stops.forEach(function (stop, idx) {
                                    if (idx > 0) gradRule += ', ';
                                    gradRule += stop.color.value + ' ' + Math.round(stop.position * 100) + '%';
                                });
                                gradRule += ')';
                                decl.cloneBefore({
                                    prop: 'background-image',
                                    value: gradRule
                                });
                            }
                        }

                        // Do the border...
                        var border = _lodash2.default.find(style.value.borders, ['isEnabled', 1]);
                        if (border) {
                            decl.cloneBefore({
                                prop: 'border',
                                value: _lodash2.default.get(border, 'thickness') + 'px solid ' + _lodash2.default.get(border, 'color.value')
                            });
                        }

                        // Do the box shadow...
                        var shadow = _lodash2.default.find(style.value.shadows, ['isEnabled', 1]);
                        if (shadow) {
                            var shadowRule = (0, _helpers.convUnit)(shadow.offsetX);
                            shadowRule += ' ' + (0, _helpers.convUnit)(shadow.offsetY);
                            shadowRule += ' ' + (0, _helpers.convUnit)(shadow.blurRadius);
                            shadowRule += ' ' + (0, _helpers.convUnit)(shadow.spread);
                            shadowRule += ' ' + shadow.color.value;
                            decl.cloneBefore({
                                prop: 'box-shadow',
                                value: shadowRule
                            });
                        }

                        // Finally remove it...
                        decl.remove();
                    }
                }

                // Text Styles...
                if (parsedValue.nodes[1].value.indexOf('.textStyle') === 0) {
                    var textStyleName = parsedValue.nodes[1].value.substr(11);
                    var _style = _lodash2.default.find(sketchData.layerTextStyles.objects, ['name', textStyleName]);
                    if (!_style) {
                        decl.warn(result, 'Missing text style: ' + textStyleName);
                    } else {
                        var textStyle = _style.value.textStyle;
                        (0, _helpers.appendRules)(decl.parent, parser.textStyle(textStyle));
                    }
                    // Remove original
                    decl.remove();
                }
            }
        });
    };
});

// Local imports...
/* eslint-disable complexity */