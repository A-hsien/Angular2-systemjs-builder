System.registerDynamic("@angular/compiler/src/offline_compiler.js", ["@angular/core", "./compile_metadata", "../src/facade/exceptions", "../src/facade/collection", "./output/output_ast", "./util"], true, function($__require, exports, module) {
  "use strict";
  ;
  var define,
      global = this,
      GLOBAL = this;
  var core_1 = $__require('@angular/core');
  var compile_metadata_1 = $__require('./compile_metadata');
  var exceptions_1 = $__require('../src/facade/exceptions');
  var collection_1 = $__require('../src/facade/collection');
  var o = $__require('./output/output_ast');
  var util_1 = $__require('./util');
  var _COMPONENT_FACTORY_IDENTIFIER = new compile_metadata_1.CompileIdentifierMetadata({
    name: 'ComponentFactory',
    runtime: core_1.ComponentFactory,
    moduleUrl: util_1.assetUrl('core', 'linker/component_factory')
  });
  var SourceModule = (function() {
    function SourceModule(moduleUrl, source) {
      this.moduleUrl = moduleUrl;
      this.source = source;
    }
    return SourceModule;
  }());
  exports.SourceModule = SourceModule;
  var StyleSheetSourceWithImports = (function() {
    function StyleSheetSourceWithImports(source, importedUrls) {
      this.source = source;
      this.importedUrls = importedUrls;
    }
    return StyleSheetSourceWithImports;
  }());
  exports.StyleSheetSourceWithImports = StyleSheetSourceWithImports;
  var NormalizedComponentWithViewDirectives = (function() {
    function NormalizedComponentWithViewDirectives(component, directives, pipes) {
      this.component = component;
      this.directives = directives;
      this.pipes = pipes;
    }
    return NormalizedComponentWithViewDirectives;
  }());
  exports.NormalizedComponentWithViewDirectives = NormalizedComponentWithViewDirectives;
  var OfflineCompiler = (function() {
    function OfflineCompiler(_directiveNormalizer, _templateParser, _styleCompiler, _viewCompiler, _outputEmitter, _xhr) {
      this._directiveNormalizer = _directiveNormalizer;
      this._templateParser = _templateParser;
      this._styleCompiler = _styleCompiler;
      this._viewCompiler = _viewCompiler;
      this._outputEmitter = _outputEmitter;
      this._xhr = _xhr;
    }
    OfflineCompiler.prototype.normalizeDirectiveMetadata = function(directive) {
      return this._directiveNormalizer.normalizeDirective(directive);
    };
    OfflineCompiler.prototype.compileTemplates = function(components) {
      var _this = this;
      if (components.length === 0) {
        throw new exceptions_1.BaseException('No components given');
      }
      var statements = [];
      var exportedVars = [];
      var moduleUrl = _templateModuleUrl(components[0].component);
      components.forEach(function(componentWithDirs) {
        var compMeta = componentWithDirs.component;
        _assertComponent(compMeta);
        var compViewFactoryVar = _this._compileComponent(compMeta, componentWithDirs.directives, componentWithDirs.pipes, statements);
        exportedVars.push(compViewFactoryVar);
        var hostMeta = compile_metadata_1.createHostComponentMeta(compMeta.type, compMeta.selector);
        var hostViewFactoryVar = _this._compileComponent(hostMeta, [compMeta], [], statements);
        var compFactoryVar = compMeta.type.name + "NgFactory";
        statements.push(o.variable(compFactoryVar).set(o.importExpr(_COMPONENT_FACTORY_IDENTIFIER, [o.importType(compMeta.type)]).instantiate([o.literal(compMeta.selector), o.variable(hostViewFactoryVar), o.importExpr(compMeta.type)], o.importType(_COMPONENT_FACTORY_IDENTIFIER, [o.importType(compMeta.type)], [o.TypeModifier.Const]))).toDeclStmt(null, [o.StmtModifier.Final]));
        exportedVars.push(compFactoryVar);
      });
      return this._codegenSourceModule(moduleUrl, statements, exportedVars);
    };
    OfflineCompiler.prototype.loadAndCompileStylesheet = function(stylesheetUrl, shim, suffix) {
      var _this = this;
      return this._xhr.get(stylesheetUrl).then(function(cssText) {
        var compileResult = _this._styleCompiler.compileStylesheet(stylesheetUrl, cssText, shim);
        var importedUrls = [];
        compileResult.dependencies.forEach(function(dep) {
          importedUrls.push(dep.moduleUrl);
          dep.valuePlaceholder.moduleUrl = _stylesModuleUrl(dep.moduleUrl, dep.isShimmed, suffix);
        });
        return new StyleSheetSourceWithImports(_this._codgenStyles(stylesheetUrl, shim, suffix, compileResult), importedUrls);
      });
    };
    OfflineCompiler.prototype._compileComponent = function(compMeta, directives, pipes, targetStatements) {
      var styleResult = this._styleCompiler.compileComponent(compMeta);
      var parsedTemplate = this._templateParser.parse(compMeta, compMeta.template.template, directives, pipes, compMeta.type.name);
      var viewResult = this._viewCompiler.compileComponent(compMeta, parsedTemplate, o.variable(styleResult.stylesVar), pipes);
      collection_1.ListWrapper.addAll(targetStatements, _resolveStyleStatements(compMeta.type.moduleUrl, styleResult));
      collection_1.ListWrapper.addAll(targetStatements, _resolveViewStatements(viewResult));
      return viewResult.viewFactoryVar;
    };
    OfflineCompiler.prototype._codgenStyles = function(inputUrl, shim, suffix, stylesCompileResult) {
      return this._codegenSourceModule(_stylesModuleUrl(inputUrl, shim, suffix), stylesCompileResult.statements, [stylesCompileResult.stylesVar]);
    };
    OfflineCompiler.prototype._codegenSourceModule = function(moduleUrl, statements, exportedVars) {
      return new SourceModule(moduleUrl, this._outputEmitter.emitStatements(moduleUrl, statements, exportedVars));
    };
    return OfflineCompiler;
  }());
  exports.OfflineCompiler = OfflineCompiler;
  function _resolveViewStatements(compileResult) {
    compileResult.dependencies.forEach(function(dep) {
      dep.factoryPlaceholder.moduleUrl = _templateModuleUrl(dep.comp);
    });
    return compileResult.statements;
  }
  function _resolveStyleStatements(containingModuleUrl, compileResult) {
    var containingSuffix = _splitSuffix(containingModuleUrl)[1];
    compileResult.dependencies.forEach(function(dep) {
      dep.valuePlaceholder.moduleUrl = _stylesModuleUrl(dep.moduleUrl, dep.isShimmed, containingSuffix);
    });
    return compileResult.statements;
  }
  function _templateModuleUrl(comp) {
    var urlWithSuffix = _splitSuffix(comp.type.moduleUrl);
    return urlWithSuffix[0] + ".ngfactory" + urlWithSuffix[1];
  }
  function _stylesModuleUrl(stylesheetUrl, shim, suffix) {
    return shim ? stylesheetUrl + ".shim" + suffix : "" + stylesheetUrl + suffix;
  }
  function _assertComponent(meta) {
    if (!meta.isComponent) {
      throw new exceptions_1.BaseException("Could not compile '" + meta.type.name + "' because it is not a component.");
    }
  }
  function _splitSuffix(path) {
    var lastDot = path.lastIndexOf('.');
    if (lastDot !== -1) {
      return [path.substring(0, lastDot), path.substring(lastDot)];
    } else {
      return [path, ''];
    }
  }
  return module.exports;
});

System.registerDynamic("@angular/compiler/src/provider_parser.js", ["../src/facade/lang", "../src/facade/collection", "./template_ast", "./compile_metadata", "./identifiers", "./parse_util"], true, function($__require, exports, module) {
  "use strict";
  ;
  var define,
      global = this,
      GLOBAL = this;
  var __extends = (this && this.__extends) || function(d, b) {
    for (var p in b)
      if (b.hasOwnProperty(p))
        d[p] = b[p];
    function __() {
      this.constructor = d;
    }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
  };
  var lang_1 = $__require('../src/facade/lang');
  var collection_1 = $__require('../src/facade/collection');
  var template_ast_1 = $__require('./template_ast');
  var compile_metadata_1 = $__require('./compile_metadata');
  var identifiers_1 = $__require('./identifiers');
  var parse_util_1 = $__require('./parse_util');
  var ProviderError = (function(_super) {
    __extends(ProviderError, _super);
    function ProviderError(message, span) {
      _super.call(this, span, message);
    }
    return ProviderError;
  }(parse_util_1.ParseError));
  exports.ProviderError = ProviderError;
  var ProviderViewContext = (function() {
    function ProviderViewContext(component, sourceSpan) {
      var _this = this;
      this.component = component;
      this.sourceSpan = sourceSpan;
      this.errors = [];
      this.viewQueries = _getViewQueries(component);
      this.viewProviders = new compile_metadata_1.CompileTokenMap();
      _normalizeProviders(component.viewProviders, sourceSpan, this.errors).forEach(function(provider) {
        if (lang_1.isBlank(_this.viewProviders.get(provider.token))) {
          _this.viewProviders.add(provider.token, true);
        }
      });
    }
    return ProviderViewContext;
  }());
  exports.ProviderViewContext = ProviderViewContext;
  var ProviderElementContext = (function() {
    function ProviderElementContext(_viewContext, _parent, _isViewRoot, _directiveAsts, attrs, refs, _sourceSpan) {
      var _this = this;
      this._viewContext = _viewContext;
      this._parent = _parent;
      this._isViewRoot = _isViewRoot;
      this._directiveAsts = _directiveAsts;
      this._sourceSpan = _sourceSpan;
      this._transformedProviders = new compile_metadata_1.CompileTokenMap();
      this._seenProviders = new compile_metadata_1.CompileTokenMap();
      this._hasViewContainer = false;
      this._attrs = {};
      attrs.forEach(function(attrAst) {
        return _this._attrs[attrAst.name] = attrAst.value;
      });
      var directivesMeta = _directiveAsts.map(function(directiveAst) {
        return directiveAst.directive;
      });
      this._allProviders = _resolveProvidersFromDirectives(directivesMeta, _sourceSpan, _viewContext.errors);
      this._contentQueries = _getContentQueries(directivesMeta);
      var queriedTokens = new compile_metadata_1.CompileTokenMap();
      this._allProviders.values().forEach(function(provider) {
        _this._addQueryReadsTo(provider.token, queriedTokens);
      });
      refs.forEach(function(refAst) {
        _this._addQueryReadsTo(new compile_metadata_1.CompileTokenMetadata({value: refAst.name}), queriedTokens);
      });
      if (lang_1.isPresent(queriedTokens.get(identifiers_1.identifierToken(identifiers_1.Identifiers.ViewContainerRef)))) {
        this._hasViewContainer = true;
      }
      this._allProviders.values().forEach(function(provider) {
        var eager = provider.eager || lang_1.isPresent(queriedTokens.get(provider.token));
        if (eager) {
          _this._getOrCreateLocalProvider(provider.providerType, provider.token, true);
        }
      });
    }
    ProviderElementContext.prototype.afterElement = function() {
      var _this = this;
      this._allProviders.values().forEach(function(provider) {
        _this._getOrCreateLocalProvider(provider.providerType, provider.token, false);
      });
    };
    Object.defineProperty(ProviderElementContext.prototype, "transformProviders", {
      get: function() {
        return this._transformedProviders.values();
      },
      enumerable: true,
      configurable: true
    });
    Object.defineProperty(ProviderElementContext.prototype, "transformedDirectiveAsts", {
      get: function() {
        var sortedProviderTypes = this._transformedProviders.values().map(function(provider) {
          return provider.token.identifier;
        });
        var sortedDirectives = collection_1.ListWrapper.clone(this._directiveAsts);
        collection_1.ListWrapper.sort(sortedDirectives, function(dir1, dir2) {
          return sortedProviderTypes.indexOf(dir1.directive.type) - sortedProviderTypes.indexOf(dir2.directive.type);
        });
        return sortedDirectives;
      },
      enumerable: true,
      configurable: true
    });
    Object.defineProperty(ProviderElementContext.prototype, "transformedHasViewContainer", {
      get: function() {
        return this._hasViewContainer;
      },
      enumerable: true,
      configurable: true
    });
    ProviderElementContext.prototype._addQueryReadsTo = function(token, queryReadTokens) {
      this._getQueriesFor(token).forEach(function(query) {
        var queryReadToken = lang_1.isPresent(query.read) ? query.read : token;
        if (lang_1.isBlank(queryReadTokens.get(queryReadToken))) {
          queryReadTokens.add(queryReadToken, true);
        }
      });
    };
    ProviderElementContext.prototype._getQueriesFor = function(token) {
      var result = [];
      var currentEl = this;
      var distance = 0;
      var queries;
      while (currentEl !== null) {
        queries = currentEl._contentQueries.get(token);
        if (lang_1.isPresent(queries)) {
          collection_1.ListWrapper.addAll(result, queries.filter(function(query) {
            return query.descendants || distance <= 1;
          }));
        }
        if (currentEl._directiveAsts.length > 0) {
          distance++;
        }
        currentEl = currentEl._parent;
      }
      queries = this._viewContext.viewQueries.get(token);
      if (lang_1.isPresent(queries)) {
        collection_1.ListWrapper.addAll(result, queries);
      }
      return result;
    };
    ProviderElementContext.prototype._getOrCreateLocalProvider = function(requestingProviderType, token, eager) {
      var _this = this;
      var resolvedProvider = this._allProviders.get(token);
      if (lang_1.isBlank(resolvedProvider) || ((requestingProviderType === template_ast_1.ProviderAstType.Directive || requestingProviderType === template_ast_1.ProviderAstType.PublicService) && resolvedProvider.providerType === template_ast_1.ProviderAstType.PrivateService) || ((requestingProviderType === template_ast_1.ProviderAstType.PrivateService || requestingProviderType === template_ast_1.ProviderAstType.PublicService) && resolvedProvider.providerType === template_ast_1.ProviderAstType.Builtin)) {
        return null;
      }
      var transformedProviderAst = this._transformedProviders.get(token);
      if (lang_1.isPresent(transformedProviderAst)) {
        return transformedProviderAst;
      }
      if (lang_1.isPresent(this._seenProviders.get(token))) {
        this._viewContext.errors.push(new ProviderError("Cannot instantiate cyclic dependency! " + token.name, this._sourceSpan));
        return null;
      }
      this._seenProviders.add(token, true);
      var transformedProviders = resolvedProvider.providers.map(function(provider) {
        var transformedUseValue = provider.useValue;
        var transformedUseExisting = provider.useExisting;
        var transformedDeps;
        if (lang_1.isPresent(provider.useExisting)) {
          var existingDiDep = _this._getDependency(resolvedProvider.providerType, new compile_metadata_1.CompileDiDependencyMetadata({token: provider.useExisting}), eager);
          if (lang_1.isPresent(existingDiDep.token)) {
            transformedUseExisting = existingDiDep.token;
          } else {
            transformedUseExisting = null;
            transformedUseValue = existingDiDep.value;
          }
        } else if (lang_1.isPresent(provider.useFactory)) {
          var deps = lang_1.isPresent(provider.deps) ? provider.deps : provider.useFactory.diDeps;
          transformedDeps = deps.map(function(dep) {
            return _this._getDependency(resolvedProvider.providerType, dep, eager);
          });
        } else if (lang_1.isPresent(provider.useClass)) {
          var deps = lang_1.isPresent(provider.deps) ? provider.deps : provider.useClass.diDeps;
          transformedDeps = deps.map(function(dep) {
            return _this._getDependency(resolvedProvider.providerType, dep, eager);
          });
        }
        return _transformProvider(provider, {
          useExisting: transformedUseExisting,
          useValue: transformedUseValue,
          deps: transformedDeps
        });
      });
      transformedProviderAst = _transformProviderAst(resolvedProvider, {
        eager: eager,
        providers: transformedProviders
      });
      this._transformedProviders.add(token, transformedProviderAst);
      return transformedProviderAst;
    };
    ProviderElementContext.prototype._getLocalDependency = function(requestingProviderType, dep, eager) {
      if (eager === void 0) {
        eager = null;
      }
      if (dep.isAttribute) {
        var attrValue = this._attrs[dep.token.value];
        return new compile_metadata_1.CompileDiDependencyMetadata({
          isValue: true,
          value: lang_1.normalizeBlank(attrValue)
        });
      }
      if (lang_1.isPresent(dep.query) || lang_1.isPresent(dep.viewQuery)) {
        return dep;
      }
      if (lang_1.isPresent(dep.token)) {
        if ((requestingProviderType === template_ast_1.ProviderAstType.Directive || requestingProviderType === template_ast_1.ProviderAstType.Component)) {
          if (dep.token.equalsTo(identifiers_1.identifierToken(identifiers_1.Identifiers.Renderer)) || dep.token.equalsTo(identifiers_1.identifierToken(identifiers_1.Identifiers.ElementRef)) || dep.token.equalsTo(identifiers_1.identifierToken(identifiers_1.Identifiers.ChangeDetectorRef)) || dep.token.equalsTo(identifiers_1.identifierToken(identifiers_1.Identifiers.TemplateRef))) {
            return dep;
          }
          if (dep.token.equalsTo(identifiers_1.identifierToken(identifiers_1.Identifiers.ViewContainerRef))) {
            this._hasViewContainer = true;
          }
        }
        if (dep.token.equalsTo(identifiers_1.identifierToken(identifiers_1.Identifiers.Injector))) {
          return dep;
        }
        if (lang_1.isPresent(this._getOrCreateLocalProvider(requestingProviderType, dep.token, eager))) {
          return dep;
        }
      }
      return null;
    };
    ProviderElementContext.prototype._getDependency = function(requestingProviderType, dep, eager) {
      if (eager === void 0) {
        eager = null;
      }
      var currElement = this;
      var currEager = eager;
      var result = null;
      if (!dep.isSkipSelf) {
        result = this._getLocalDependency(requestingProviderType, dep, eager);
      }
      if (dep.isSelf) {
        if (lang_1.isBlank(result) && dep.isOptional) {
          result = new compile_metadata_1.CompileDiDependencyMetadata({
            isValue: true,
            value: null
          });
        }
      } else {
        while (lang_1.isBlank(result) && lang_1.isPresent(currElement._parent)) {
          var prevElement = currElement;
          currElement = currElement._parent;
          if (prevElement._isViewRoot) {
            currEager = false;
          }
          result = currElement._getLocalDependency(template_ast_1.ProviderAstType.PublicService, dep, currEager);
        }
        if (lang_1.isBlank(result)) {
          if (!dep.isHost || this._viewContext.component.type.isHost || identifiers_1.identifierToken(this._viewContext.component.type).equalsTo(dep.token) || lang_1.isPresent(this._viewContext.viewProviders.get(dep.token))) {
            result = dep;
          } else {
            result = dep.isOptional ? result = new compile_metadata_1.CompileDiDependencyMetadata({
              isValue: true,
              value: null
            }) : null;
          }
        }
      }
      if (lang_1.isBlank(result)) {
        this._viewContext.errors.push(new ProviderError("No provider for " + dep.token.name, this._sourceSpan));
      }
      return result;
    };
    return ProviderElementContext;
  }());
  exports.ProviderElementContext = ProviderElementContext;
  function _transformProvider(provider, _a) {
    var useExisting = _a.useExisting,
        useValue = _a.useValue,
        deps = _a.deps;
    return new compile_metadata_1.CompileProviderMetadata({
      token: provider.token,
      useClass: provider.useClass,
      useExisting: useExisting,
      useFactory: provider.useFactory,
      useValue: useValue,
      deps: deps,
      multi: provider.multi
    });
  }
  function _transformProviderAst(provider, _a) {
    var eager = _a.eager,
        providers = _a.providers;
    return new template_ast_1.ProviderAst(provider.token, provider.multiProvider, provider.eager || eager, providers, provider.providerType, provider.sourceSpan);
  }
  function _normalizeProviders(providers, sourceSpan, targetErrors, targetProviders) {
    if (targetProviders === void 0) {
      targetProviders = null;
    }
    if (lang_1.isBlank(targetProviders)) {
      targetProviders = [];
    }
    if (lang_1.isPresent(providers)) {
      providers.forEach(function(provider) {
        if (lang_1.isArray(provider)) {
          _normalizeProviders(provider, sourceSpan, targetErrors, targetProviders);
        } else {
          var normalizeProvider;
          if (provider instanceof compile_metadata_1.CompileProviderMetadata) {
            normalizeProvider = provider;
          } else if (provider instanceof compile_metadata_1.CompileTypeMetadata) {
            normalizeProvider = new compile_metadata_1.CompileProviderMetadata({
              token: new compile_metadata_1.CompileTokenMetadata({identifier: provider}),
              useClass: provider
            });
          } else {
            targetErrors.push(new ProviderError("Unknown provider type " + provider, sourceSpan));
          }
          if (lang_1.isPresent(normalizeProvider)) {
            targetProviders.push(normalizeProvider);
          }
        }
      });
    }
    return targetProviders;
  }
  function _resolveProvidersFromDirectives(directives, sourceSpan, targetErrors) {
    var providersByToken = new compile_metadata_1.CompileTokenMap();
    directives.forEach(function(directive) {
      var dirProvider = new compile_metadata_1.CompileProviderMetadata({
        token: new compile_metadata_1.CompileTokenMetadata({identifier: directive.type}),
        useClass: directive.type
      });
      _resolveProviders([dirProvider], directive.isComponent ? template_ast_1.ProviderAstType.Component : template_ast_1.ProviderAstType.Directive, true, sourceSpan, targetErrors, providersByToken);
    });
    var directivesWithComponentFirst = directives.filter(function(dir) {
      return dir.isComponent;
    }).concat(directives.filter(function(dir) {
      return !dir.isComponent;
    }));
    directivesWithComponentFirst.forEach(function(directive) {
      _resolveProviders(_normalizeProviders(directive.providers, sourceSpan, targetErrors), template_ast_1.ProviderAstType.PublicService, false, sourceSpan, targetErrors, providersByToken);
      _resolveProviders(_normalizeProviders(directive.viewProviders, sourceSpan, targetErrors), template_ast_1.ProviderAstType.PrivateService, false, sourceSpan, targetErrors, providersByToken);
    });
    return providersByToken;
  }
  function _resolveProviders(providers, providerType, eager, sourceSpan, targetErrors, targetProvidersByToken) {
    providers.forEach(function(provider) {
      var resolvedProvider = targetProvidersByToken.get(provider.token);
      if (lang_1.isPresent(resolvedProvider) && resolvedProvider.multiProvider !== provider.multi) {
        targetErrors.push(new ProviderError("Mixing multi and non multi provider is not possible for token " + resolvedProvider.token.name, sourceSpan));
      }
      if (lang_1.isBlank(resolvedProvider)) {
        resolvedProvider = new template_ast_1.ProviderAst(provider.token, provider.multi, eager, [provider], providerType, sourceSpan);
        targetProvidersByToken.add(provider.token, resolvedProvider);
      } else {
        if (!provider.multi) {
          collection_1.ListWrapper.clear(resolvedProvider.providers);
        }
        resolvedProvider.providers.push(provider);
      }
    });
  }
  function _getViewQueries(component) {
    var viewQueries = new compile_metadata_1.CompileTokenMap();
    if (lang_1.isPresent(component.viewQueries)) {
      component.viewQueries.forEach(function(query) {
        return _addQueryToTokenMap(viewQueries, query);
      });
    }
    component.type.diDeps.forEach(function(dep) {
      if (lang_1.isPresent(dep.viewQuery)) {
        _addQueryToTokenMap(viewQueries, dep.viewQuery);
      }
    });
    return viewQueries;
  }
  function _getContentQueries(directives) {
    var contentQueries = new compile_metadata_1.CompileTokenMap();
    directives.forEach(function(directive) {
      if (lang_1.isPresent(directive.queries)) {
        directive.queries.forEach(function(query) {
          return _addQueryToTokenMap(contentQueries, query);
        });
      }
      directive.type.diDeps.forEach(function(dep) {
        if (lang_1.isPresent(dep.query)) {
          _addQueryToTokenMap(contentQueries, dep.query);
        }
      });
    });
    return contentQueries;
  }
  function _addQueryToTokenMap(map, query) {
    query.selectors.forEach(function(token) {
      var entry = map.get(token);
      if (lang_1.isBlank(entry)) {
        entry = [];
        map.add(token, entry);
      }
      entry.push(query);
    });
  }
  return module.exports;
});

System.registerDynamic("@angular/compiler/src/template_parser.js", ["@angular/core", "../core_private", "../src/facade/collection", "../src/facade/lang", "../src/facade/exceptions", "./expression_parser/ast", "./expression_parser/parser", "./html_parser", "./html_tags", "./parse_util", "./template_ast", "./selector", "./schema/element_schema_registry", "./template_preparser", "./style_url_resolver", "./html_ast", "./util", "./identifiers", "./provider_parser"], true, function($__require, exports, module) {
  "use strict";
  ;
  var define,
      global = this,
      GLOBAL = this;
  var __extends = (this && this.__extends) || function(d, b) {
    for (var p in b)
      if (b.hasOwnProperty(p))
        d[p] = b[p];
    function __() {
      this.constructor = d;
    }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
  };
  var core_1 = $__require('@angular/core');
  var core_private_1 = $__require('../core_private');
  var collection_1 = $__require('../src/facade/collection');
  var lang_1 = $__require('../src/facade/lang');
  var exceptions_1 = $__require('../src/facade/exceptions');
  var ast_1 = $__require('./expression_parser/ast');
  var parser_1 = $__require('./expression_parser/parser');
  var html_parser_1 = $__require('./html_parser');
  var html_tags_1 = $__require('./html_tags');
  var parse_util_1 = $__require('./parse_util');
  var template_ast_1 = $__require('./template_ast');
  var selector_1 = $__require('./selector');
  var element_schema_registry_1 = $__require('./schema/element_schema_registry');
  var template_preparser_1 = $__require('./template_preparser');
  var style_url_resolver_1 = $__require('./style_url_resolver');
  var html_ast_1 = $__require('./html_ast');
  var util_1 = $__require('./util');
  var identifiers_1 = $__require('./identifiers');
  var provider_parser_1 = $__require('./provider_parser');
  var BIND_NAME_REGEXP = /^(?:(?:(?:(bind-)|(var-)|(let-)|(ref-|#)|(on-)|(bindon-))(.+))|\[\(([^\)]+)\)\]|\[([^\]]+)\]|\(([^\)]+)\))$/g;
  var TEMPLATE_ELEMENT = 'template';
  var TEMPLATE_ATTR = 'template';
  var TEMPLATE_ATTR_PREFIX = '*';
  var CLASS_ATTR = 'class';
  var PROPERTY_PARTS_SEPARATOR = '.';
  var ATTRIBUTE_PREFIX = 'attr';
  var CLASS_PREFIX = 'class';
  var STYLE_PREFIX = 'style';
  var TEXT_CSS_SELECTOR = selector_1.CssSelector.parse('*')[0];
  exports.TEMPLATE_TRANSFORMS = new core_1.OpaqueToken('TemplateTransforms');
  var TemplateParseError = (function(_super) {
    __extends(TemplateParseError, _super);
    function TemplateParseError(message, span, level) {
      _super.call(this, span, message, level);
    }
    return TemplateParseError;
  }(parse_util_1.ParseError));
  exports.TemplateParseError = TemplateParseError;
  var TemplateParseResult = (function() {
    function TemplateParseResult(templateAst, errors) {
      this.templateAst = templateAst;
      this.errors = errors;
    }
    return TemplateParseResult;
  }());
  exports.TemplateParseResult = TemplateParseResult;
  var TemplateParser = (function() {
    function TemplateParser(_exprParser, _schemaRegistry, _htmlParser, _console, transforms) {
      this._exprParser = _exprParser;
      this._schemaRegistry = _schemaRegistry;
      this._htmlParser = _htmlParser;
      this._console = _console;
      this.transforms = transforms;
    }
    TemplateParser.prototype.parse = function(component, template, directives, pipes, templateUrl) {
      var result = this.tryParse(component, template, directives, pipes, templateUrl);
      var warnings = result.errors.filter(function(error) {
        return error.level === parse_util_1.ParseErrorLevel.WARNING;
      });
      var errors = result.errors.filter(function(error) {
        return error.level === parse_util_1.ParseErrorLevel.FATAL;
      });
      if (warnings.length > 0) {
        this._console.warn("Template parse warnings:\n" + warnings.join('\n'));
      }
      if (errors.length > 0) {
        var errorString = errors.join('\n');
        throw new exceptions_1.BaseException("Template parse errors:\n" + errorString);
      }
      return result.templateAst;
    };
    TemplateParser.prototype.tryParse = function(component, template, directives, pipes, templateUrl) {
      var htmlAstWithErrors = this._htmlParser.parse(template, templateUrl);
      var errors = htmlAstWithErrors.errors;
      var result;
      if (htmlAstWithErrors.rootNodes.length > 0) {
        var uniqDirectives = removeDuplicates(directives);
        var uniqPipes = removeDuplicates(pipes);
        var providerViewContext = new provider_parser_1.ProviderViewContext(component, htmlAstWithErrors.rootNodes[0].sourceSpan);
        var parseVisitor = new TemplateParseVisitor(providerViewContext, uniqDirectives, uniqPipes, this._exprParser, this._schemaRegistry);
        result = html_ast_1.htmlVisitAll(parseVisitor, htmlAstWithErrors.rootNodes, EMPTY_ELEMENT_CONTEXT);
        errors = errors.concat(parseVisitor.errors).concat(providerViewContext.errors);
      } else {
        result = [];
      }
      if (errors.length > 0) {
        return new TemplateParseResult(result, errors);
      }
      if (lang_1.isPresent(this.transforms)) {
        this.transforms.forEach(function(transform) {
          result = template_ast_1.templateVisitAll(transform, result);
        });
      }
      return new TemplateParseResult(result, errors);
    };
    TemplateParser.decorators = [{type: core_1.Injectable}];
    TemplateParser.ctorParameters = [{type: parser_1.Parser}, {type: element_schema_registry_1.ElementSchemaRegistry}, {type: html_parser_1.HtmlParser}, {type: core_private_1.Console}, {
      type: undefined,
      decorators: [{type: core_1.Optional}, {
        type: core_1.Inject,
        args: [exports.TEMPLATE_TRANSFORMS]
      }]
    }];
    return TemplateParser;
  }());
  exports.TemplateParser = TemplateParser;
  var TemplateParseVisitor = (function() {
    function TemplateParseVisitor(providerViewContext, directives, pipes, _exprParser, _schemaRegistry) {
      var _this = this;
      this.providerViewContext = providerViewContext;
      this._exprParser = _exprParser;
      this._schemaRegistry = _schemaRegistry;
      this.errors = [];
      this.directivesIndex = new Map();
      this.ngContentCount = 0;
      this.selectorMatcher = new selector_1.SelectorMatcher();
      collection_1.ListWrapper.forEachWithIndex(directives, function(directive, index) {
        var selector = selector_1.CssSelector.parse(directive.selector);
        _this.selectorMatcher.addSelectables(selector, directive);
        _this.directivesIndex.set(directive, index);
      });
      this.pipesByName = new Map();
      pipes.forEach(function(pipe) {
        return _this.pipesByName.set(pipe.name, pipe);
      });
    }
    TemplateParseVisitor.prototype._reportError = function(message, sourceSpan, level) {
      if (level === void 0) {
        level = parse_util_1.ParseErrorLevel.FATAL;
      }
      this.errors.push(new TemplateParseError(message, sourceSpan, level));
    };
    TemplateParseVisitor.prototype._parseInterpolation = function(value, sourceSpan) {
      var sourceInfo = sourceSpan.start.toString();
      try {
        var ast = this._exprParser.parseInterpolation(value, sourceInfo);
        this._checkPipes(ast, sourceSpan);
        if (lang_1.isPresent(ast) && ast.ast.expressions.length > core_private_1.MAX_INTERPOLATION_VALUES) {
          throw new exceptions_1.BaseException("Only support at most " + core_private_1.MAX_INTERPOLATION_VALUES + " interpolation values!");
        }
        return ast;
      } catch (e) {
        this._reportError("" + e, sourceSpan);
        return this._exprParser.wrapLiteralPrimitive('ERROR', sourceInfo);
      }
    };
    TemplateParseVisitor.prototype._parseAction = function(value, sourceSpan) {
      var sourceInfo = sourceSpan.start.toString();
      try {
        var ast = this._exprParser.parseAction(value, sourceInfo);
        this._checkPipes(ast, sourceSpan);
        return ast;
      } catch (e) {
        this._reportError("" + e, sourceSpan);
        return this._exprParser.wrapLiteralPrimitive('ERROR', sourceInfo);
      }
    };
    TemplateParseVisitor.prototype._parseBinding = function(value, sourceSpan) {
      var sourceInfo = sourceSpan.start.toString();
      try {
        var ast = this._exprParser.parseBinding(value, sourceInfo);
        this._checkPipes(ast, sourceSpan);
        return ast;
      } catch (e) {
        this._reportError("" + e, sourceSpan);
        return this._exprParser.wrapLiteralPrimitive('ERROR', sourceInfo);
      }
    };
    TemplateParseVisitor.prototype._parseTemplateBindings = function(value, sourceSpan) {
      var _this = this;
      var sourceInfo = sourceSpan.start.toString();
      try {
        var bindingsResult = this._exprParser.parseTemplateBindings(value, sourceInfo);
        bindingsResult.templateBindings.forEach(function(binding) {
          if (lang_1.isPresent(binding.expression)) {
            _this._checkPipes(binding.expression, sourceSpan);
          }
        });
        bindingsResult.warnings.forEach(function(warning) {
          _this._reportError(warning, sourceSpan, parse_util_1.ParseErrorLevel.WARNING);
        });
        return bindingsResult.templateBindings;
      } catch (e) {
        this._reportError("" + e, sourceSpan);
        return [];
      }
    };
    TemplateParseVisitor.prototype._checkPipes = function(ast, sourceSpan) {
      var _this = this;
      if (lang_1.isPresent(ast)) {
        var collector = new PipeCollector();
        ast.visit(collector);
        collector.pipes.forEach(function(pipeName) {
          if (!_this.pipesByName.has(pipeName)) {
            _this._reportError("The pipe '" + pipeName + "' could not be found", sourceSpan);
          }
        });
      }
    };
    TemplateParseVisitor.prototype.visitExpansion = function(ast, context) {
      return null;
    };
    TemplateParseVisitor.prototype.visitExpansionCase = function(ast, context) {
      return null;
    };
    TemplateParseVisitor.prototype.visitText = function(ast, parent) {
      var ngContentIndex = parent.findNgContentIndex(TEXT_CSS_SELECTOR);
      var expr = this._parseInterpolation(ast.value, ast.sourceSpan);
      if (lang_1.isPresent(expr)) {
        return new template_ast_1.BoundTextAst(expr, ngContentIndex, ast.sourceSpan);
      } else {
        return new template_ast_1.TextAst(ast.value, ngContentIndex, ast.sourceSpan);
      }
    };
    TemplateParseVisitor.prototype.visitAttr = function(ast, contex) {
      return new template_ast_1.AttrAst(ast.name, ast.value, ast.sourceSpan);
    };
    TemplateParseVisitor.prototype.visitComment = function(ast, context) {
      return null;
    };
    TemplateParseVisitor.prototype.visitElement = function(element, parent) {
      var _this = this;
      var nodeName = element.name;
      var preparsedElement = template_preparser_1.preparseElement(element);
      if (preparsedElement.type === template_preparser_1.PreparsedElementType.SCRIPT || preparsedElement.type === template_preparser_1.PreparsedElementType.STYLE) {
        return null;
      }
      if (preparsedElement.type === template_preparser_1.PreparsedElementType.STYLESHEET && style_url_resolver_1.isStyleUrlResolvable(preparsedElement.hrefAttr)) {
        return null;
      }
      var matchableAttrs = [];
      var elementOrDirectiveProps = [];
      var elementOrDirectiveRefs = [];
      var elementVars = [];
      var events = [];
      var templateElementOrDirectiveProps = [];
      var templateMatchableAttrs = [];
      var templateElementVars = [];
      var hasInlineTemplates = false;
      var attrs = [];
      var lcElName = html_tags_1.splitNsName(nodeName.toLowerCase())[1];
      var isTemplateElement = lcElName == TEMPLATE_ELEMENT;
      element.attrs.forEach(function(attr) {
        var hasBinding = _this._parseAttr(isTemplateElement, attr, matchableAttrs, elementOrDirectiveProps, events, elementOrDirectiveRefs, elementVars);
        var hasTemplateBinding = _this._parseInlineTemplateBinding(attr, templateMatchableAttrs, templateElementOrDirectiveProps, templateElementVars);
        if (!hasBinding && !hasTemplateBinding) {
          attrs.push(_this.visitAttr(attr, null));
          matchableAttrs.push([attr.name, attr.value]);
        }
        if (hasTemplateBinding) {
          hasInlineTemplates = true;
        }
      });
      var elementCssSelector = createElementCssSelector(nodeName, matchableAttrs);
      var directiveMetas = this._parseDirectives(this.selectorMatcher, elementCssSelector);
      var references = [];
      var directiveAsts = this._createDirectiveAsts(isTemplateElement, element.name, directiveMetas, elementOrDirectiveProps, elementOrDirectiveRefs, element.sourceSpan, references);
      var elementProps = this._createElementPropertyAsts(element.name, elementOrDirectiveProps, directiveAsts);
      var isViewRoot = parent.isTemplateElement || hasInlineTemplates;
      var providerContext = new provider_parser_1.ProviderElementContext(this.providerViewContext, parent.providerContext, isViewRoot, directiveAsts, attrs, references, element.sourceSpan);
      var children = html_ast_1.htmlVisitAll(preparsedElement.nonBindable ? NON_BINDABLE_VISITOR : this, element.children, ElementContext.create(isTemplateElement, directiveAsts, isTemplateElement ? parent.providerContext : providerContext));
      providerContext.afterElement();
      var projectionSelector = lang_1.isPresent(preparsedElement.projectAs) ? selector_1.CssSelector.parse(preparsedElement.projectAs)[0] : elementCssSelector;
      var ngContentIndex = parent.findNgContentIndex(projectionSelector);
      var parsedElement;
      if (preparsedElement.type === template_preparser_1.PreparsedElementType.NG_CONTENT) {
        if (lang_1.isPresent(element.children) && element.children.length > 0) {
          this._reportError("<ng-content> element cannot have content. <ng-content> must be immediately followed by </ng-content>", element.sourceSpan);
        }
        parsedElement = new template_ast_1.NgContentAst(this.ngContentCount++, hasInlineTemplates ? null : ngContentIndex, element.sourceSpan);
      } else if (isTemplateElement) {
        this._assertAllEventsPublishedByDirectives(directiveAsts, events);
        this._assertNoComponentsNorElementBindingsOnTemplate(directiveAsts, elementProps, element.sourceSpan);
        parsedElement = new template_ast_1.EmbeddedTemplateAst(attrs, events, references, elementVars, providerContext.transformedDirectiveAsts, providerContext.transformProviders, providerContext.transformedHasViewContainer, children, hasInlineTemplates ? null : ngContentIndex, element.sourceSpan);
      } else {
        this._assertOnlyOneComponent(directiveAsts, element.sourceSpan);
        var ngContentIndex_1 = hasInlineTemplates ? null : parent.findNgContentIndex(projectionSelector);
        parsedElement = new template_ast_1.ElementAst(nodeName, attrs, elementProps, events, references, providerContext.transformedDirectiveAsts, providerContext.transformProviders, providerContext.transformedHasViewContainer, children, hasInlineTemplates ? null : ngContentIndex_1, element.sourceSpan);
      }
      if (hasInlineTemplates) {
        var templateCssSelector = createElementCssSelector(TEMPLATE_ELEMENT, templateMatchableAttrs);
        var templateDirectiveMetas = this._parseDirectives(this.selectorMatcher, templateCssSelector);
        var templateDirectiveAsts = this._createDirectiveAsts(true, element.name, templateDirectiveMetas, templateElementOrDirectiveProps, [], element.sourceSpan, []);
        var templateElementProps = this._createElementPropertyAsts(element.name, templateElementOrDirectiveProps, templateDirectiveAsts);
        this._assertNoComponentsNorElementBindingsOnTemplate(templateDirectiveAsts, templateElementProps, element.sourceSpan);
        var templateProviderContext = new provider_parser_1.ProviderElementContext(this.providerViewContext, parent.providerContext, parent.isTemplateElement, templateDirectiveAsts, [], [], element.sourceSpan);
        templateProviderContext.afterElement();
        parsedElement = new template_ast_1.EmbeddedTemplateAst([], [], [], templateElementVars, templateProviderContext.transformedDirectiveAsts, templateProviderContext.transformProviders, templateProviderContext.transformedHasViewContainer, [parsedElement], ngContentIndex, element.sourceSpan);
      }
      return parsedElement;
    };
    TemplateParseVisitor.prototype._parseInlineTemplateBinding = function(attr, targetMatchableAttrs, targetProps, targetVars) {
      var templateBindingsSource = null;
      if (attr.name == TEMPLATE_ATTR) {
        templateBindingsSource = attr.value;
      } else if (attr.name.startsWith(TEMPLATE_ATTR_PREFIX)) {
        var key = attr.name.substring(TEMPLATE_ATTR_PREFIX.length);
        templateBindingsSource = (attr.value.length == 0) ? key : key + ' ' + attr.value;
      }
      if (lang_1.isPresent(templateBindingsSource)) {
        var bindings = this._parseTemplateBindings(templateBindingsSource, attr.sourceSpan);
        for (var i = 0; i < bindings.length; i++) {
          var binding = bindings[i];
          if (binding.keyIsVar) {
            targetVars.push(new template_ast_1.VariableAst(binding.key, binding.name, attr.sourceSpan));
          } else if (lang_1.isPresent(binding.expression)) {
            this._parsePropertyAst(binding.key, binding.expression, attr.sourceSpan, targetMatchableAttrs, targetProps);
          } else {
            targetMatchableAttrs.push([binding.key, '']);
            this._parseLiteralAttr(binding.key, null, attr.sourceSpan, targetProps);
          }
        }
        return true;
      }
      return false;
    };
    TemplateParseVisitor.prototype._parseAttr = function(isTemplateElement, attr, targetMatchableAttrs, targetProps, targetEvents, targetRefs, targetVars) {
      var attrName = this._normalizeAttributeName(attr.name);
      var attrValue = attr.value;
      var bindParts = lang_1.RegExpWrapper.firstMatch(BIND_NAME_REGEXP, attrName);
      var hasBinding = false;
      if (lang_1.isPresent(bindParts)) {
        hasBinding = true;
        if (lang_1.isPresent(bindParts[1])) {
          this._parseProperty(bindParts[7], attrValue, attr.sourceSpan, targetMatchableAttrs, targetProps);
        } else if (lang_1.isPresent(bindParts[2])) {
          var identifier = bindParts[7];
          if (isTemplateElement) {
            this._reportError("\"var-\" on <template> elements is deprecated. Use \"let-\" instead!", attr.sourceSpan, parse_util_1.ParseErrorLevel.WARNING);
            this._parseVariable(identifier, attrValue, attr.sourceSpan, targetVars);
          } else {
            this._reportError("\"var-\" on non <template> elements is deprecated. Use \"ref-\" instead!", attr.sourceSpan, parse_util_1.ParseErrorLevel.WARNING);
            this._parseReference(identifier, attrValue, attr.sourceSpan, targetRefs);
          }
        } else if (lang_1.isPresent(bindParts[3])) {
          if (isTemplateElement) {
            var identifier = bindParts[7];
            this._parseVariable(identifier, attrValue, attr.sourceSpan, targetVars);
          } else {
            this._reportError("\"let-\" is only supported on template elements.", attr.sourceSpan);
          }
        } else if (lang_1.isPresent(bindParts[4])) {
          var identifier = bindParts[7];
          this._parseReference(identifier, attrValue, attr.sourceSpan, targetRefs);
        } else if (lang_1.isPresent(bindParts[5])) {
          this._parseEvent(bindParts[7], attrValue, attr.sourceSpan, targetMatchableAttrs, targetEvents);
        } else if (lang_1.isPresent(bindParts[6])) {
          this._parseProperty(bindParts[7], attrValue, attr.sourceSpan, targetMatchableAttrs, targetProps);
          this._parseAssignmentEvent(bindParts[7], attrValue, attr.sourceSpan, targetMatchableAttrs, targetEvents);
        } else if (lang_1.isPresent(bindParts[8])) {
          this._parseProperty(bindParts[8], attrValue, attr.sourceSpan, targetMatchableAttrs, targetProps);
          this._parseAssignmentEvent(bindParts[8], attrValue, attr.sourceSpan, targetMatchableAttrs, targetEvents);
        } else if (lang_1.isPresent(bindParts[9])) {
          this._parseProperty(bindParts[9], attrValue, attr.sourceSpan, targetMatchableAttrs, targetProps);
        } else if (lang_1.isPresent(bindParts[10])) {
          this._parseEvent(bindParts[10], attrValue, attr.sourceSpan, targetMatchableAttrs, targetEvents);
        }
      } else {
        hasBinding = this._parsePropertyInterpolation(attrName, attrValue, attr.sourceSpan, targetMatchableAttrs, targetProps);
      }
      if (!hasBinding) {
        this._parseLiteralAttr(attrName, attrValue, attr.sourceSpan, targetProps);
      }
      return hasBinding;
    };
    TemplateParseVisitor.prototype._normalizeAttributeName = function(attrName) {
      return attrName.toLowerCase().startsWith('data-') ? attrName.substring(5) : attrName;
    };
    TemplateParseVisitor.prototype._parseVariable = function(identifier, value, sourceSpan, targetVars) {
      if (identifier.indexOf('-') > -1) {
        this._reportError("\"-\" is not allowed in variable names", sourceSpan);
      }
      targetVars.push(new template_ast_1.VariableAst(identifier, value, sourceSpan));
    };
    TemplateParseVisitor.prototype._parseReference = function(identifier, value, sourceSpan, targetRefs) {
      if (identifier.indexOf('-') > -1) {
        this._reportError("\"-\" is not allowed in reference names", sourceSpan);
      }
      targetRefs.push(new ElementOrDirectiveRef(identifier, value, sourceSpan));
    };
    TemplateParseVisitor.prototype._parseProperty = function(name, expression, sourceSpan, targetMatchableAttrs, targetProps) {
      this._parsePropertyAst(name, this._parseBinding(expression, sourceSpan), sourceSpan, targetMatchableAttrs, targetProps);
    };
    TemplateParseVisitor.prototype._parsePropertyInterpolation = function(name, value, sourceSpan, targetMatchableAttrs, targetProps) {
      var expr = this._parseInterpolation(value, sourceSpan);
      if (lang_1.isPresent(expr)) {
        this._parsePropertyAst(name, expr, sourceSpan, targetMatchableAttrs, targetProps);
        return true;
      }
      return false;
    };
    TemplateParseVisitor.prototype._parsePropertyAst = function(name, ast, sourceSpan, targetMatchableAttrs, targetProps) {
      targetMatchableAttrs.push([name, ast.source]);
      targetProps.push(new BoundElementOrDirectiveProperty(name, ast, false, sourceSpan));
    };
    TemplateParseVisitor.prototype._parseAssignmentEvent = function(name, expression, sourceSpan, targetMatchableAttrs, targetEvents) {
      this._parseEvent(name + "Change", expression + "=$event", sourceSpan, targetMatchableAttrs, targetEvents);
    };
    TemplateParseVisitor.prototype._parseEvent = function(name, expression, sourceSpan, targetMatchableAttrs, targetEvents) {
      var parts = util_1.splitAtColon(name, [null, name]);
      var target = parts[0];
      var eventName = parts[1];
      var ast = this._parseAction(expression, sourceSpan);
      targetMatchableAttrs.push([name, ast.source]);
      targetEvents.push(new template_ast_1.BoundEventAst(eventName, target, ast, sourceSpan));
    };
    TemplateParseVisitor.prototype._parseLiteralAttr = function(name, value, sourceSpan, targetProps) {
      targetProps.push(new BoundElementOrDirectiveProperty(name, this._exprParser.wrapLiteralPrimitive(value, ''), true, sourceSpan));
    };
    TemplateParseVisitor.prototype._parseDirectives = function(selectorMatcher, elementCssSelector) {
      var _this = this;
      var directives = collection_1.ListWrapper.createFixedSize(this.directivesIndex.size);
      selectorMatcher.match(elementCssSelector, function(selector, directive) {
        directives[_this.directivesIndex.get(directive)] = directive;
      });
      return directives.filter(function(dir) {
        return lang_1.isPresent(dir);
      });
    };
    TemplateParseVisitor.prototype._createDirectiveAsts = function(isTemplateElement, elementName, directives, props, elementOrDirectiveRefs, sourceSpan, targetReferences) {
      var _this = this;
      var matchedReferences = new Set();
      var component = null;
      var directiveAsts = directives.map(function(directive) {
        if (directive.isComponent) {
          component = directive;
        }
        var hostProperties = [];
        var hostEvents = [];
        var directiveProperties = [];
        _this._createDirectiveHostPropertyAsts(elementName, directive.hostProperties, sourceSpan, hostProperties);
        _this._createDirectiveHostEventAsts(directive.hostListeners, sourceSpan, hostEvents);
        _this._createDirectivePropertyAsts(directive.inputs, props, directiveProperties);
        elementOrDirectiveRefs.forEach(function(elOrDirRef) {
          if ((elOrDirRef.value.length === 0 && directive.isComponent) || (directive.exportAs == elOrDirRef.value)) {
            targetReferences.push(new template_ast_1.ReferenceAst(elOrDirRef.name, identifiers_1.identifierToken(directive.type), elOrDirRef.sourceSpan));
            matchedReferences.add(elOrDirRef.name);
          }
        });
        return new template_ast_1.DirectiveAst(directive, directiveProperties, hostProperties, hostEvents, sourceSpan);
      });
      elementOrDirectiveRefs.forEach(function(elOrDirRef) {
        if (elOrDirRef.value.length > 0) {
          if (!collection_1.SetWrapper.has(matchedReferences, elOrDirRef.name)) {
            _this._reportError("There is no directive with \"exportAs\" set to \"" + elOrDirRef.value + "\"", elOrDirRef.sourceSpan);
          }
          ;
        } else if (lang_1.isBlank(component)) {
          var refToken = null;
          if (isTemplateElement) {
            refToken = identifiers_1.identifierToken(identifiers_1.Identifiers.TemplateRef);
          }
          targetReferences.push(new template_ast_1.ReferenceAst(elOrDirRef.name, refToken, elOrDirRef.sourceSpan));
        }
      });
      return directiveAsts;
    };
    TemplateParseVisitor.prototype._createDirectiveHostPropertyAsts = function(elementName, hostProps, sourceSpan, targetPropertyAsts) {
      var _this = this;
      if (lang_1.isPresent(hostProps)) {
        collection_1.StringMapWrapper.forEach(hostProps, function(expression, propName) {
          var exprAst = _this._parseBinding(expression, sourceSpan);
          targetPropertyAsts.push(_this._createElementPropertyAst(elementName, propName, exprAst, sourceSpan));
        });
      }
    };
    TemplateParseVisitor.prototype._createDirectiveHostEventAsts = function(hostListeners, sourceSpan, targetEventAsts) {
      var _this = this;
      if (lang_1.isPresent(hostListeners)) {
        collection_1.StringMapWrapper.forEach(hostListeners, function(expression, propName) {
          _this._parseEvent(propName, expression, sourceSpan, [], targetEventAsts);
        });
      }
    };
    TemplateParseVisitor.prototype._createDirectivePropertyAsts = function(directiveProperties, boundProps, targetBoundDirectiveProps) {
      if (lang_1.isPresent(directiveProperties)) {
        var boundPropsByName = new Map();
        boundProps.forEach(function(boundProp) {
          var prevValue = boundPropsByName.get(boundProp.name);
          if (lang_1.isBlank(prevValue) || prevValue.isLiteral) {
            boundPropsByName.set(boundProp.name, boundProp);
          }
        });
        collection_1.StringMapWrapper.forEach(directiveProperties, function(elProp, dirProp) {
          var boundProp = boundPropsByName.get(elProp);
          if (lang_1.isPresent(boundProp)) {
            targetBoundDirectiveProps.push(new template_ast_1.BoundDirectivePropertyAst(dirProp, boundProp.name, boundProp.expression, boundProp.sourceSpan));
          }
        });
      }
    };
    TemplateParseVisitor.prototype._createElementPropertyAsts = function(elementName, props, directives) {
      var _this = this;
      var boundElementProps = [];
      var boundDirectivePropsIndex = new Map();
      directives.forEach(function(directive) {
        directive.inputs.forEach(function(prop) {
          boundDirectivePropsIndex.set(prop.templateName, prop);
        });
      });
      props.forEach(function(prop) {
        if (!prop.isLiteral && lang_1.isBlank(boundDirectivePropsIndex.get(prop.name))) {
          boundElementProps.push(_this._createElementPropertyAst(elementName, prop.name, prop.expression, prop.sourceSpan));
        }
      });
      return boundElementProps;
    };
    TemplateParseVisitor.prototype._createElementPropertyAst = function(elementName, name, ast, sourceSpan) {
      var unit = null;
      var bindingType;
      var boundPropertyName;
      var parts = name.split(PROPERTY_PARTS_SEPARATOR);
      var securityContext;
      if (parts.length === 1) {
        boundPropertyName = this._schemaRegistry.getMappedPropName(parts[0]);
        securityContext = this._schemaRegistry.securityContext(elementName, boundPropertyName);
        bindingType = template_ast_1.PropertyBindingType.Property;
        if (!this._schemaRegistry.hasProperty(elementName, boundPropertyName)) {
          this._reportError("Can't bind to '" + boundPropertyName + "' since it isn't a known native property", sourceSpan);
        }
      } else {
        if (parts[0] == ATTRIBUTE_PREFIX) {
          boundPropertyName = parts[1];
          if (boundPropertyName.toLowerCase().startsWith('on')) {
            this._reportError(("Binding to event attribute '" + boundPropertyName + "' is disallowed ") + ("for security reasons, please use (" + boundPropertyName.slice(2) + ")=..."), sourceSpan);
          }
          securityContext = this._schemaRegistry.securityContext(elementName, this._schemaRegistry.getMappedPropName(boundPropertyName));
          var nsSeparatorIdx = boundPropertyName.indexOf(':');
          if (nsSeparatorIdx > -1) {
            var ns = boundPropertyName.substring(0, nsSeparatorIdx);
            var name_1 = boundPropertyName.substring(nsSeparatorIdx + 1);
            boundPropertyName = html_tags_1.mergeNsAndName(ns, name_1);
          }
          bindingType = template_ast_1.PropertyBindingType.Attribute;
        } else if (parts[0] == CLASS_PREFIX) {
          boundPropertyName = parts[1];
          bindingType = template_ast_1.PropertyBindingType.Class;
          securityContext = core_private_1.SecurityContext.NONE;
        } else if (parts[0] == STYLE_PREFIX) {
          unit = parts.length > 2 ? parts[2] : null;
          boundPropertyName = parts[1];
          bindingType = template_ast_1.PropertyBindingType.Style;
          securityContext = core_private_1.SecurityContext.STYLE;
        } else {
          this._reportError("Invalid property name '" + name + "'", sourceSpan);
          bindingType = null;
          securityContext = null;
        }
      }
      return new template_ast_1.BoundElementPropertyAst(boundPropertyName, bindingType, securityContext, ast, unit, sourceSpan);
    };
    TemplateParseVisitor.prototype._findComponentDirectiveNames = function(directives) {
      var componentTypeNames = [];
      directives.forEach(function(directive) {
        var typeName = directive.directive.type.name;
        if (directive.directive.isComponent) {
          componentTypeNames.push(typeName);
        }
      });
      return componentTypeNames;
    };
    TemplateParseVisitor.prototype._assertOnlyOneComponent = function(directives, sourceSpan) {
      var componentTypeNames = this._findComponentDirectiveNames(directives);
      if (componentTypeNames.length > 1) {
        this._reportError("More than one component: " + componentTypeNames.join(','), sourceSpan);
      }
    };
    TemplateParseVisitor.prototype._assertNoComponentsNorElementBindingsOnTemplate = function(directives, elementProps, sourceSpan) {
      var _this = this;
      var componentTypeNames = this._findComponentDirectiveNames(directives);
      if (componentTypeNames.length > 0) {
        this._reportError("Components on an embedded template: " + componentTypeNames.join(','), sourceSpan);
      }
      elementProps.forEach(function(prop) {
        _this._reportError("Property binding " + prop.name + " not used by any directive on an embedded template", sourceSpan);
      });
    };
    TemplateParseVisitor.prototype._assertAllEventsPublishedByDirectives = function(directives, events) {
      var _this = this;
      var allDirectiveEvents = new Set();
      directives.forEach(function(directive) {
        collection_1.StringMapWrapper.forEach(directive.directive.outputs, function(eventName, _) {
          allDirectiveEvents.add(eventName);
        });
      });
      events.forEach(function(event) {
        if (lang_1.isPresent(event.target) || !collection_1.SetWrapper.has(allDirectiveEvents, event.name)) {
          _this._reportError("Event binding " + event.fullName + " not emitted by any directive on an embedded template", event.sourceSpan);
        }
      });
    };
    return TemplateParseVisitor;
  }());
  var NonBindableVisitor = (function() {
    function NonBindableVisitor() {}
    NonBindableVisitor.prototype.visitElement = function(ast, parent) {
      var preparsedElement = template_preparser_1.preparseElement(ast);
      if (preparsedElement.type === template_preparser_1.PreparsedElementType.SCRIPT || preparsedElement.type === template_preparser_1.PreparsedElementType.STYLE || preparsedElement.type === template_preparser_1.PreparsedElementType.STYLESHEET) {
        return null;
      }
      var attrNameAndValues = ast.attrs.map(function(attrAst) {
        return [attrAst.name, attrAst.value];
      });
      var selector = createElementCssSelector(ast.name, attrNameAndValues);
      var ngContentIndex = parent.findNgContentIndex(selector);
      var children = html_ast_1.htmlVisitAll(this, ast.children, EMPTY_ELEMENT_CONTEXT);
      return new template_ast_1.ElementAst(ast.name, html_ast_1.htmlVisitAll(this, ast.attrs), [], [], [], [], [], false, children, ngContentIndex, ast.sourceSpan);
    };
    NonBindableVisitor.prototype.visitComment = function(ast, context) {
      return null;
    };
    NonBindableVisitor.prototype.visitAttr = function(ast, context) {
      return new template_ast_1.AttrAst(ast.name, ast.value, ast.sourceSpan);
    };
    NonBindableVisitor.prototype.visitText = function(ast, parent) {
      var ngContentIndex = parent.findNgContentIndex(TEXT_CSS_SELECTOR);
      return new template_ast_1.TextAst(ast.value, ngContentIndex, ast.sourceSpan);
    };
    NonBindableVisitor.prototype.visitExpansion = function(ast, context) {
      return ast;
    };
    NonBindableVisitor.prototype.visitExpansionCase = function(ast, context) {
      return ast;
    };
    return NonBindableVisitor;
  }());
  var BoundElementOrDirectiveProperty = (function() {
    function BoundElementOrDirectiveProperty(name, expression, isLiteral, sourceSpan) {
      this.name = name;
      this.expression = expression;
      this.isLiteral = isLiteral;
      this.sourceSpan = sourceSpan;
    }
    return BoundElementOrDirectiveProperty;
  }());
  var ElementOrDirectiveRef = (function() {
    function ElementOrDirectiveRef(name, value, sourceSpan) {
      this.name = name;
      this.value = value;
      this.sourceSpan = sourceSpan;
    }
    return ElementOrDirectiveRef;
  }());
  function splitClasses(classAttrValue) {
    return lang_1.StringWrapper.split(classAttrValue.trim(), /\s+/g);
  }
  exports.splitClasses = splitClasses;
  var ElementContext = (function() {
    function ElementContext(isTemplateElement, _ngContentIndexMatcher, _wildcardNgContentIndex, providerContext) {
      this.isTemplateElement = isTemplateElement;
      this._ngContentIndexMatcher = _ngContentIndexMatcher;
      this._wildcardNgContentIndex = _wildcardNgContentIndex;
      this.providerContext = providerContext;
    }
    ElementContext.create = function(isTemplateElement, directives, providerContext) {
      var matcher = new selector_1.SelectorMatcher();
      var wildcardNgContentIndex = null;
      var component = directives.find(function(directive) {
        return directive.directive.isComponent;
      });
      if (lang_1.isPresent(component)) {
        var ngContentSelectors = component.directive.template.ngContentSelectors;
        for (var i = 0; i < ngContentSelectors.length; i++) {
          var selector = ngContentSelectors[i];
          if (lang_1.StringWrapper.equals(selector, '*')) {
            wildcardNgContentIndex = i;
          } else {
            matcher.addSelectables(selector_1.CssSelector.parse(ngContentSelectors[i]), i);
          }
        }
      }
      return new ElementContext(isTemplateElement, matcher, wildcardNgContentIndex, providerContext);
    };
    ElementContext.prototype.findNgContentIndex = function(selector) {
      var ngContentIndices = [];
      this._ngContentIndexMatcher.match(selector, function(selector, ngContentIndex) {
        ngContentIndices.push(ngContentIndex);
      });
      collection_1.ListWrapper.sort(ngContentIndices);
      if (lang_1.isPresent(this._wildcardNgContentIndex)) {
        ngContentIndices.push(this._wildcardNgContentIndex);
      }
      return ngContentIndices.length > 0 ? ngContentIndices[0] : null;
    };
    return ElementContext;
  }());
  function createElementCssSelector(elementName, matchableAttrs) {
    var cssSelector = new selector_1.CssSelector();
    var elNameNoNs = html_tags_1.splitNsName(elementName)[1];
    cssSelector.setElement(elNameNoNs);
    for (var i = 0; i < matchableAttrs.length; i++) {
      var attrName = matchableAttrs[i][0];
      var attrNameNoNs = html_tags_1.splitNsName(attrName)[1];
      var attrValue = matchableAttrs[i][1];
      cssSelector.addAttribute(attrNameNoNs, attrValue);
      if (attrName.toLowerCase() == CLASS_ATTR) {
        var classes = splitClasses(attrValue);
        classes.forEach(function(className) {
          return cssSelector.addClassName(className);
        });
      }
    }
    return cssSelector;
  }
  var EMPTY_ELEMENT_CONTEXT = new ElementContext(true, new selector_1.SelectorMatcher(), null, null);
  var NON_BINDABLE_VISITOR = new NonBindableVisitor();
  var PipeCollector = (function(_super) {
    __extends(PipeCollector, _super);
    function PipeCollector() {
      _super.apply(this, arguments);
      this.pipes = new Set();
    }
    PipeCollector.prototype.visitPipe = function(ast, context) {
      this.pipes.add(ast.name);
      ast.exp.visit(this);
      this.visitAll(ast.args, context);
      return null;
    };
    return PipeCollector;
  }(ast_1.RecursiveAstVisitor));
  exports.PipeCollector = PipeCollector;
  function removeDuplicates(items) {
    var res = [];
    items.forEach(function(item) {
      var hasMatch = res.filter(function(r) {
        return r.type.name == item.type.name && r.type.moduleUrl == item.type.moduleUrl && r.type.runtime == item.type.runtime;
      }).length > 0;
      if (!hasMatch) {
        res.push(item);
      }
    });
    return res;
  }
  return module.exports;
});

System.registerDynamic("@angular/compiler/src/output/abstract_js_emitter.js", ["../../src/facade/lang", "../../src/facade/exceptions", "./output_ast", "./abstract_emitter"], true, function($__require, exports, module) {
  "use strict";
  ;
  var define,
      global = this,
      GLOBAL = this;
  var __extends = (this && this.__extends) || function(d, b) {
    for (var p in b)
      if (b.hasOwnProperty(p))
        d[p] = b[p];
    function __() {
      this.constructor = d;
    }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
  };
  var lang_1 = $__require('../../src/facade/lang');
  var exceptions_1 = $__require('../../src/facade/exceptions');
  var o = $__require('./output_ast');
  var abstract_emitter_1 = $__require('./abstract_emitter');
  var AbstractJsEmitterVisitor = (function(_super) {
    __extends(AbstractJsEmitterVisitor, _super);
    function AbstractJsEmitterVisitor() {
      _super.call(this, false);
    }
    AbstractJsEmitterVisitor.prototype.visitDeclareClassStmt = function(stmt, ctx) {
      var _this = this;
      ctx.pushClass(stmt);
      this._visitClassConstructor(stmt, ctx);
      if (lang_1.isPresent(stmt.parent)) {
        ctx.print(stmt.name + ".prototype = Object.create(");
        stmt.parent.visitExpression(this, ctx);
        ctx.println(".prototype);");
      }
      stmt.getters.forEach(function(getter) {
        return _this._visitClassGetter(stmt, getter, ctx);
      });
      stmt.methods.forEach(function(method) {
        return _this._visitClassMethod(stmt, method, ctx);
      });
      ctx.popClass();
      return null;
    };
    AbstractJsEmitterVisitor.prototype._visitClassConstructor = function(stmt, ctx) {
      ctx.print("function " + stmt.name + "(");
      if (lang_1.isPresent(stmt.constructorMethod)) {
        this._visitParams(stmt.constructorMethod.params, ctx);
      }
      ctx.println(") {");
      ctx.incIndent();
      if (lang_1.isPresent(stmt.constructorMethod)) {
        if (stmt.constructorMethod.body.length > 0) {
          ctx.println("var self = this;");
          this.visitAllStatements(stmt.constructorMethod.body, ctx);
        }
      }
      ctx.decIndent();
      ctx.println("}");
    };
    AbstractJsEmitterVisitor.prototype._visitClassGetter = function(stmt, getter, ctx) {
      ctx.println("Object.defineProperty(" + stmt.name + ".prototype, '" + getter.name + "', { get: function() {");
      ctx.incIndent();
      if (getter.body.length > 0) {
        ctx.println("var self = this;");
        this.visitAllStatements(getter.body, ctx);
      }
      ctx.decIndent();
      ctx.println("}});");
    };
    AbstractJsEmitterVisitor.prototype._visitClassMethod = function(stmt, method, ctx) {
      ctx.print(stmt.name + ".prototype." + method.name + " = function(");
      this._visitParams(method.params, ctx);
      ctx.println(") {");
      ctx.incIndent();
      if (method.body.length > 0) {
        ctx.println("var self = this;");
        this.visitAllStatements(method.body, ctx);
      }
      ctx.decIndent();
      ctx.println("};");
    };
    AbstractJsEmitterVisitor.prototype.visitReadVarExpr = function(ast, ctx) {
      if (ast.builtin === o.BuiltinVar.This) {
        ctx.print('self');
      } else if (ast.builtin === o.BuiltinVar.Super) {
        throw new exceptions_1.BaseException("'super' needs to be handled at a parent ast node, not at the variable level!");
      } else {
        _super.prototype.visitReadVarExpr.call(this, ast, ctx);
      }
      return null;
    };
    AbstractJsEmitterVisitor.prototype.visitDeclareVarStmt = function(stmt, ctx) {
      ctx.print("var " + stmt.name + " = ");
      stmt.value.visitExpression(this, ctx);
      ctx.println(";");
      return null;
    };
    AbstractJsEmitterVisitor.prototype.visitCastExpr = function(ast, ctx) {
      ast.value.visitExpression(this, ctx);
      return null;
    };
    AbstractJsEmitterVisitor.prototype.visitInvokeFunctionExpr = function(expr, ctx) {
      var fnExpr = expr.fn;
      if (fnExpr instanceof o.ReadVarExpr && fnExpr.builtin === o.BuiltinVar.Super) {
        ctx.currentClass.parent.visitExpression(this, ctx);
        ctx.print(".call(this");
        if (expr.args.length > 0) {
          ctx.print(", ");
          this.visitAllExpressions(expr.args, ctx, ',');
        }
        ctx.print(")");
      } else {
        _super.prototype.visitInvokeFunctionExpr.call(this, expr, ctx);
      }
      return null;
    };
    AbstractJsEmitterVisitor.prototype.visitFunctionExpr = function(ast, ctx) {
      ctx.print("function(");
      this._visitParams(ast.params, ctx);
      ctx.println(") {");
      ctx.incIndent();
      this.visitAllStatements(ast.statements, ctx);
      ctx.decIndent();
      ctx.print("}");
      return null;
    };
    AbstractJsEmitterVisitor.prototype.visitDeclareFunctionStmt = function(stmt, ctx) {
      ctx.print("function " + stmt.name + "(");
      this._visitParams(stmt.params, ctx);
      ctx.println(") {");
      ctx.incIndent();
      this.visitAllStatements(stmt.statements, ctx);
      ctx.decIndent();
      ctx.println("}");
      return null;
    };
    AbstractJsEmitterVisitor.prototype.visitTryCatchStmt = function(stmt, ctx) {
      ctx.println("try {");
      ctx.incIndent();
      this.visitAllStatements(stmt.bodyStmts, ctx);
      ctx.decIndent();
      ctx.println("} catch (" + abstract_emitter_1.CATCH_ERROR_VAR.name + ") {");
      ctx.incIndent();
      var catchStmts = [abstract_emitter_1.CATCH_STACK_VAR.set(abstract_emitter_1.CATCH_ERROR_VAR.prop('stack')).toDeclStmt(null, [o.StmtModifier.Final])].concat(stmt.catchStmts);
      this.visitAllStatements(catchStmts, ctx);
      ctx.decIndent();
      ctx.println("}");
      return null;
    };
    AbstractJsEmitterVisitor.prototype._visitParams = function(params, ctx) {
      this.visitAllObjects(function(param) {
        return ctx.print(param.name);
      }, params, ctx, ',');
    };
    AbstractJsEmitterVisitor.prototype.getBuiltinMethodName = function(method) {
      var name;
      switch (method) {
        case o.BuiltinMethod.ConcatArray:
          name = 'concat';
          break;
        case o.BuiltinMethod.SubscribeObservable:
          name = 'subscribe';
          break;
        case o.BuiltinMethod.bind:
          name = 'bind';
          break;
        default:
          throw new exceptions_1.BaseException("Unknown builtin method: " + method);
      }
      return name;
    };
    return AbstractJsEmitterVisitor;
  }(abstract_emitter_1.AbstractEmitterVisitor));
  exports.AbstractJsEmitterVisitor = AbstractJsEmitterVisitor;
  return module.exports;
});

System.registerDynamic("@angular/compiler/src/output/output_jit.js", ["../../src/facade/lang", "./abstract_emitter", "./abstract_js_emitter", "../util"], true, function($__require, exports, module) {
  "use strict";
  ;
  var define,
      global = this,
      GLOBAL = this;
  var __extends = (this && this.__extends) || function(d, b) {
    for (var p in b)
      if (b.hasOwnProperty(p))
        d[p] = b[p];
    function __() {
      this.constructor = d;
    }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
  };
  var lang_1 = $__require('../../src/facade/lang');
  var abstract_emitter_1 = $__require('./abstract_emitter');
  var abstract_js_emitter_1 = $__require('./abstract_js_emitter');
  var util_1 = $__require('../util');
  function jitStatements(sourceUrl, statements, resultVar) {
    var converter = new JitEmitterVisitor();
    var ctx = abstract_emitter_1.EmitterVisitorContext.createRoot([resultVar]);
    converter.visitAllStatements(statements, ctx);
    return lang_1.evalExpression(sourceUrl, resultVar, ctx.toSource(), converter.getArgs());
  }
  exports.jitStatements = jitStatements;
  var JitEmitterVisitor = (function(_super) {
    __extends(JitEmitterVisitor, _super);
    function JitEmitterVisitor() {
      _super.apply(this, arguments);
      this._evalArgNames = [];
      this._evalArgValues = [];
    }
    JitEmitterVisitor.prototype.getArgs = function() {
      var result = {};
      for (var i = 0; i < this._evalArgNames.length; i++) {
        result[this._evalArgNames[i]] = this._evalArgValues[i];
      }
      return result;
    };
    JitEmitterVisitor.prototype.visitExternalExpr = function(ast, ctx) {
      var value = ast.value.runtime;
      var id = this._evalArgValues.indexOf(value);
      if (id === -1) {
        id = this._evalArgValues.length;
        this._evalArgValues.push(value);
        var name = lang_1.isPresent(ast.value.name) ? util_1.sanitizeIdentifier(ast.value.name) : 'val';
        this._evalArgNames.push(util_1.sanitizeIdentifier("jit_" + name + id));
      }
      ctx.print(this._evalArgNames[id]);
      return null;
    };
    return JitEmitterVisitor;
  }(abstract_js_emitter_1.AbstractJsEmitterVisitor));
  return module.exports;
});

System.registerDynamic("@angular/compiler/src/output/dart_emitter.js", ["../../src/facade/lang", "../../src/facade/exceptions", "./output_ast", "./abstract_emitter"], true, function($__require, exports, module) {
  "use strict";
  ;
  var define,
      global = this,
      GLOBAL = this;
  var __extends = (this && this.__extends) || function(d, b) {
    for (var p in b)
      if (b.hasOwnProperty(p))
        d[p] = b[p];
    function __() {
      this.constructor = d;
    }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
  };
  var lang_1 = $__require('../../src/facade/lang');
  var exceptions_1 = $__require('../../src/facade/exceptions');
  var o = $__require('./output_ast');
  var abstract_emitter_1 = $__require('./abstract_emitter');
  var _debugModuleUrl = 'asset://debug/lib';
  function debugOutputAstAsDart(ast) {
    var converter = new _DartEmitterVisitor(_debugModuleUrl);
    var ctx = abstract_emitter_1.EmitterVisitorContext.createRoot([]);
    var asts;
    if (lang_1.isArray(ast)) {
      asts = ast;
    } else {
      asts = [ast];
    }
    asts.forEach(function(ast) {
      if (ast instanceof o.Statement) {
        ast.visitStatement(converter, ctx);
      } else if (ast instanceof o.Expression) {
        ast.visitExpression(converter, ctx);
      } else if (ast instanceof o.Type) {
        ast.visitType(converter, ctx);
      } else {
        throw new exceptions_1.BaseException("Don't know how to print debug info for " + ast);
      }
    });
    return ctx.toSource();
  }
  exports.debugOutputAstAsDart = debugOutputAstAsDart;
  var DartEmitter = (function() {
    function DartEmitter(_importGenerator) {
      this._importGenerator = _importGenerator;
    }
    DartEmitter.prototype.emitStatements = function(moduleUrl, stmts, exportedVars) {
      var _this = this;
      var srcParts = [];
      var converter = new _DartEmitterVisitor(moduleUrl);
      var ctx = abstract_emitter_1.EmitterVisitorContext.createRoot(exportedVars);
      converter.visitAllStatements(stmts, ctx);
      converter.importsWithPrefixes.forEach(function(prefix, importedModuleUrl) {
        srcParts.push("import '" + _this._importGenerator.getImportPath(moduleUrl, importedModuleUrl) + "' as " + prefix + ";");
      });
      srcParts.push(ctx.toSource());
      return srcParts.join('\n');
    };
    return DartEmitter;
  }());
  exports.DartEmitter = DartEmitter;
  var _DartEmitterVisitor = (function(_super) {
    __extends(_DartEmitterVisitor, _super);
    function _DartEmitterVisitor(_moduleUrl) {
      _super.call(this, true);
      this._moduleUrl = _moduleUrl;
      this.importsWithPrefixes = new Map();
    }
    _DartEmitterVisitor.prototype.visitExternalExpr = function(ast, ctx) {
      this._visitIdentifier(ast.value, ast.typeParams, ctx);
      return null;
    };
    _DartEmitterVisitor.prototype.visitDeclareVarStmt = function(stmt, ctx) {
      if (stmt.hasModifier(o.StmtModifier.Final)) {
        if (isConstType(stmt.type)) {
          ctx.print("const ");
        } else {
          ctx.print("final ");
        }
      } else if (lang_1.isBlank(stmt.type)) {
        ctx.print("var ");
      }
      if (lang_1.isPresent(stmt.type)) {
        stmt.type.visitType(this, ctx);
        ctx.print(" ");
      }
      ctx.print(stmt.name + " = ");
      stmt.value.visitExpression(this, ctx);
      ctx.println(";");
      return null;
    };
    _DartEmitterVisitor.prototype.visitCastExpr = function(ast, ctx) {
      ctx.print("(");
      ast.value.visitExpression(this, ctx);
      ctx.print(" as ");
      ast.type.visitType(this, ctx);
      ctx.print(")");
      return null;
    };
    _DartEmitterVisitor.prototype.visitDeclareClassStmt = function(stmt, ctx) {
      var _this = this;
      ctx.pushClass(stmt);
      ctx.print("class " + stmt.name);
      if (lang_1.isPresent(stmt.parent)) {
        ctx.print(" extends ");
        stmt.parent.visitExpression(this, ctx);
      }
      ctx.println(" {");
      ctx.incIndent();
      stmt.fields.forEach(function(field) {
        return _this._visitClassField(field, ctx);
      });
      if (lang_1.isPresent(stmt.constructorMethod)) {
        this._visitClassConstructor(stmt, ctx);
      }
      stmt.getters.forEach(function(getter) {
        return _this._visitClassGetter(getter, ctx);
      });
      stmt.methods.forEach(function(method) {
        return _this._visitClassMethod(method, ctx);
      });
      ctx.decIndent();
      ctx.println("}");
      ctx.popClass();
      return null;
    };
    _DartEmitterVisitor.prototype._visitClassField = function(field, ctx) {
      if (field.hasModifier(o.StmtModifier.Final)) {
        ctx.print("final ");
      } else if (lang_1.isBlank(field.type)) {
        ctx.print("var ");
      }
      if (lang_1.isPresent(field.type)) {
        field.type.visitType(this, ctx);
        ctx.print(" ");
      }
      ctx.println(field.name + ";");
    };
    _DartEmitterVisitor.prototype._visitClassGetter = function(getter, ctx) {
      if (lang_1.isPresent(getter.type)) {
        getter.type.visitType(this, ctx);
        ctx.print(" ");
      }
      ctx.println("get " + getter.name + " {");
      ctx.incIndent();
      this.visitAllStatements(getter.body, ctx);
      ctx.decIndent();
      ctx.println("}");
    };
    _DartEmitterVisitor.prototype._visitClassConstructor = function(stmt, ctx) {
      ctx.print(stmt.name + "(");
      this._visitParams(stmt.constructorMethod.params, ctx);
      ctx.print(")");
      var ctorStmts = stmt.constructorMethod.body;
      var superCtorExpr = ctorStmts.length > 0 ? getSuperConstructorCallExpr(ctorStmts[0]) : null;
      if (lang_1.isPresent(superCtorExpr)) {
        ctx.print(": ");
        superCtorExpr.visitExpression(this, ctx);
        ctorStmts = ctorStmts.slice(1);
      }
      ctx.println(" {");
      ctx.incIndent();
      this.visitAllStatements(ctorStmts, ctx);
      ctx.decIndent();
      ctx.println("}");
    };
    _DartEmitterVisitor.prototype._visitClassMethod = function(method, ctx) {
      if (lang_1.isPresent(method.type)) {
        method.type.visitType(this, ctx);
      } else {
        ctx.print("void");
      }
      ctx.print(" " + method.name + "(");
      this._visitParams(method.params, ctx);
      ctx.println(") {");
      ctx.incIndent();
      this.visitAllStatements(method.body, ctx);
      ctx.decIndent();
      ctx.println("}");
    };
    _DartEmitterVisitor.prototype.visitFunctionExpr = function(ast, ctx) {
      ctx.print("(");
      this._visitParams(ast.params, ctx);
      ctx.println(") {");
      ctx.incIndent();
      this.visitAllStatements(ast.statements, ctx);
      ctx.decIndent();
      ctx.print("}");
      return null;
    };
    _DartEmitterVisitor.prototype.visitDeclareFunctionStmt = function(stmt, ctx) {
      if (lang_1.isPresent(stmt.type)) {
        stmt.type.visitType(this, ctx);
      } else {
        ctx.print("void");
      }
      ctx.print(" " + stmt.name + "(");
      this._visitParams(stmt.params, ctx);
      ctx.println(") {");
      ctx.incIndent();
      this.visitAllStatements(stmt.statements, ctx);
      ctx.decIndent();
      ctx.println("}");
      return null;
    };
    _DartEmitterVisitor.prototype.getBuiltinMethodName = function(method) {
      var name;
      switch (method) {
        case o.BuiltinMethod.ConcatArray:
          name = '.addAll';
          break;
        case o.BuiltinMethod.SubscribeObservable:
          name = 'listen';
          break;
        case o.BuiltinMethod.bind:
          name = null;
          break;
        default:
          throw new exceptions_1.BaseException("Unknown builtin method: " + method);
      }
      return name;
    };
    _DartEmitterVisitor.prototype.visitTryCatchStmt = function(stmt, ctx) {
      ctx.println("try {");
      ctx.incIndent();
      this.visitAllStatements(stmt.bodyStmts, ctx);
      ctx.decIndent();
      ctx.println("} catch (" + abstract_emitter_1.CATCH_ERROR_VAR.name + ", " + abstract_emitter_1.CATCH_STACK_VAR.name + ") {");
      ctx.incIndent();
      this.visitAllStatements(stmt.catchStmts, ctx);
      ctx.decIndent();
      ctx.println("}");
      return null;
    };
    _DartEmitterVisitor.prototype.visitBinaryOperatorExpr = function(ast, ctx) {
      switch (ast.operator) {
        case o.BinaryOperator.Identical:
          ctx.print("identical(");
          ast.lhs.visitExpression(this, ctx);
          ctx.print(", ");
          ast.rhs.visitExpression(this, ctx);
          ctx.print(")");
          break;
        case o.BinaryOperator.NotIdentical:
          ctx.print("!identical(");
          ast.lhs.visitExpression(this, ctx);
          ctx.print(", ");
          ast.rhs.visitExpression(this, ctx);
          ctx.print(")");
          break;
        default:
          _super.prototype.visitBinaryOperatorExpr.call(this, ast, ctx);
      }
      return null;
    };
    _DartEmitterVisitor.prototype.visitLiteralArrayExpr = function(ast, ctx) {
      if (isConstType(ast.type)) {
        ctx.print("const ");
      }
      return _super.prototype.visitLiteralArrayExpr.call(this, ast, ctx);
    };
    _DartEmitterVisitor.prototype.visitLiteralMapExpr = function(ast, ctx) {
      if (isConstType(ast.type)) {
        ctx.print("const ");
      }
      if (lang_1.isPresent(ast.valueType)) {
        ctx.print("<String, ");
        ast.valueType.visitType(this, ctx);
        ctx.print(">");
      }
      return _super.prototype.visitLiteralMapExpr.call(this, ast, ctx);
    };
    _DartEmitterVisitor.prototype.visitInstantiateExpr = function(ast, ctx) {
      ctx.print(isConstType(ast.type) ? "const" : "new");
      ctx.print(' ');
      ast.classExpr.visitExpression(this, ctx);
      ctx.print("(");
      this.visitAllExpressions(ast.args, ctx, ",");
      ctx.print(")");
      return null;
    };
    _DartEmitterVisitor.prototype.visitBuiltintType = function(type, ctx) {
      var typeStr;
      switch (type.name) {
        case o.BuiltinTypeName.Bool:
          typeStr = 'bool';
          break;
        case o.BuiltinTypeName.Dynamic:
          typeStr = 'dynamic';
          break;
        case o.BuiltinTypeName.Function:
          typeStr = 'Function';
          break;
        case o.BuiltinTypeName.Number:
          typeStr = 'num';
          break;
        case o.BuiltinTypeName.Int:
          typeStr = 'int';
          break;
        case o.BuiltinTypeName.String:
          typeStr = 'String';
          break;
        default:
          throw new exceptions_1.BaseException("Unsupported builtin type " + type.name);
      }
      ctx.print(typeStr);
      return null;
    };
    _DartEmitterVisitor.prototype.visitExternalType = function(ast, ctx) {
      this._visitIdentifier(ast.value, ast.typeParams, ctx);
      return null;
    };
    _DartEmitterVisitor.prototype.visitArrayType = function(type, ctx) {
      ctx.print("List<");
      if (lang_1.isPresent(type.of)) {
        type.of.visitType(this, ctx);
      } else {
        ctx.print("dynamic");
      }
      ctx.print(">");
      return null;
    };
    _DartEmitterVisitor.prototype.visitMapType = function(type, ctx) {
      ctx.print("Map<String, ");
      if (lang_1.isPresent(type.valueType)) {
        type.valueType.visitType(this, ctx);
      } else {
        ctx.print("dynamic");
      }
      ctx.print(">");
      return null;
    };
    _DartEmitterVisitor.prototype._visitParams = function(params, ctx) {
      var _this = this;
      this.visitAllObjects(function(param) {
        if (lang_1.isPresent(param.type)) {
          param.type.visitType(_this, ctx);
          ctx.print(' ');
        }
        ctx.print(param.name);
      }, params, ctx, ',');
    };
    _DartEmitterVisitor.prototype._visitIdentifier = function(value, typeParams, ctx) {
      var _this = this;
      if (lang_1.isBlank(value.name)) {
        throw new exceptions_1.BaseException("Internal error: unknown identifier " + value);
      }
      if (lang_1.isPresent(value.moduleUrl) && value.moduleUrl != this._moduleUrl) {
        var prefix = this.importsWithPrefixes.get(value.moduleUrl);
        if (lang_1.isBlank(prefix)) {
          prefix = "import" + this.importsWithPrefixes.size;
          this.importsWithPrefixes.set(value.moduleUrl, prefix);
        }
        ctx.print(prefix + ".");
      }
      ctx.print(value.name);
      if (lang_1.isPresent(typeParams) && typeParams.length > 0) {
        ctx.print("<");
        this.visitAllObjects(function(type) {
          return type.visitType(_this, ctx);
        }, typeParams, ctx, ',');
        ctx.print(">");
      }
    };
    return _DartEmitterVisitor;
  }(abstract_emitter_1.AbstractEmitterVisitor));
  function getSuperConstructorCallExpr(stmt) {
    if (stmt instanceof o.ExpressionStatement) {
      var expr = stmt.expr;
      if (expr instanceof o.InvokeFunctionExpr) {
        var fn = expr.fn;
        if (fn instanceof o.ReadVarExpr) {
          if (fn.builtin === o.BuiltinVar.Super) {
            return expr;
          }
        }
      }
    }
    return null;
  }
  function isConstType(type) {
    return lang_1.isPresent(type) && type.hasModifier(o.TypeModifier.Const);
  }
  return module.exports;
});

System.registerDynamic("@angular/compiler/src/output/abstract_emitter.js", ["../../src/facade/lang", "../../src/facade/exceptions", "./output_ast"], true, function($__require, exports, module) {
  "use strict";
  ;
  var define,
      global = this,
      GLOBAL = this;
  var lang_1 = $__require('../../src/facade/lang');
  var exceptions_1 = $__require('../../src/facade/exceptions');
  var o = $__require('./output_ast');
  var _SINGLE_QUOTE_ESCAPE_STRING_RE = /'|\\|\n|\r|\$/g;
  exports.CATCH_ERROR_VAR = o.variable('error');
  exports.CATCH_STACK_VAR = o.variable('stack');
  var OutputEmitter = (function() {
    function OutputEmitter() {}
    return OutputEmitter;
  }());
  exports.OutputEmitter = OutputEmitter;
  var _EmittedLine = (function() {
    function _EmittedLine(indent) {
      this.indent = indent;
      this.parts = [];
    }
    return _EmittedLine;
  }());
  var EmitterVisitorContext = (function() {
    function EmitterVisitorContext(_exportedVars, _indent) {
      this._exportedVars = _exportedVars;
      this._indent = _indent;
      this._classes = [];
      this._lines = [new _EmittedLine(_indent)];
    }
    EmitterVisitorContext.createRoot = function(exportedVars) {
      return new EmitterVisitorContext(exportedVars, 0);
    };
    Object.defineProperty(EmitterVisitorContext.prototype, "_currentLine", {
      get: function() {
        return this._lines[this._lines.length - 1];
      },
      enumerable: true,
      configurable: true
    });
    EmitterVisitorContext.prototype.isExportedVar = function(varName) {
      return this._exportedVars.indexOf(varName) !== -1;
    };
    EmitterVisitorContext.prototype.println = function(lastPart) {
      if (lastPart === void 0) {
        lastPart = '';
      }
      this.print(lastPart, true);
    };
    EmitterVisitorContext.prototype.lineIsEmpty = function() {
      return this._currentLine.parts.length === 0;
    };
    EmitterVisitorContext.prototype.print = function(part, newLine) {
      if (newLine === void 0) {
        newLine = false;
      }
      if (part.length > 0) {
        this._currentLine.parts.push(part);
      }
      if (newLine) {
        this._lines.push(new _EmittedLine(this._indent));
      }
    };
    EmitterVisitorContext.prototype.removeEmptyLastLine = function() {
      if (this.lineIsEmpty()) {
        this._lines.pop();
      }
    };
    EmitterVisitorContext.prototype.incIndent = function() {
      this._indent++;
      this._currentLine.indent = this._indent;
    };
    EmitterVisitorContext.prototype.decIndent = function() {
      this._indent--;
      this._currentLine.indent = this._indent;
    };
    EmitterVisitorContext.prototype.pushClass = function(clazz) {
      this._classes.push(clazz);
    };
    EmitterVisitorContext.prototype.popClass = function() {
      return this._classes.pop();
    };
    Object.defineProperty(EmitterVisitorContext.prototype, "currentClass", {
      get: function() {
        return this._classes.length > 0 ? this._classes[this._classes.length - 1] : null;
      },
      enumerable: true,
      configurable: true
    });
    EmitterVisitorContext.prototype.toSource = function() {
      var lines = this._lines;
      if (lines[lines.length - 1].parts.length === 0) {
        lines = lines.slice(0, lines.length - 1);
      }
      return lines.map(function(line) {
        if (line.parts.length > 0) {
          return _createIndent(line.indent) + line.parts.join('');
        } else {
          return '';
        }
      }).join('\n');
    };
    return EmitterVisitorContext;
  }());
  exports.EmitterVisitorContext = EmitterVisitorContext;
  var AbstractEmitterVisitor = (function() {
    function AbstractEmitterVisitor(_escapeDollarInStrings) {
      this._escapeDollarInStrings = _escapeDollarInStrings;
    }
    AbstractEmitterVisitor.prototype.visitExpressionStmt = function(stmt, ctx) {
      stmt.expr.visitExpression(this, ctx);
      ctx.println(';');
      return null;
    };
    AbstractEmitterVisitor.prototype.visitReturnStmt = function(stmt, ctx) {
      ctx.print("return ");
      stmt.value.visitExpression(this, ctx);
      ctx.println(';');
      return null;
    };
    AbstractEmitterVisitor.prototype.visitIfStmt = function(stmt, ctx) {
      ctx.print("if (");
      stmt.condition.visitExpression(this, ctx);
      ctx.print(") {");
      var hasElseCase = lang_1.isPresent(stmt.falseCase) && stmt.falseCase.length > 0;
      if (stmt.trueCase.length <= 1 && !hasElseCase) {
        ctx.print(" ");
        this.visitAllStatements(stmt.trueCase, ctx);
        ctx.removeEmptyLastLine();
        ctx.print(" ");
      } else {
        ctx.println();
        ctx.incIndent();
        this.visitAllStatements(stmt.trueCase, ctx);
        ctx.decIndent();
        if (hasElseCase) {
          ctx.println("} else {");
          ctx.incIndent();
          this.visitAllStatements(stmt.falseCase, ctx);
          ctx.decIndent();
        }
      }
      ctx.println("}");
      return null;
    };
    AbstractEmitterVisitor.prototype.visitThrowStmt = function(stmt, ctx) {
      ctx.print("throw ");
      stmt.error.visitExpression(this, ctx);
      ctx.println(";");
      return null;
    };
    AbstractEmitterVisitor.prototype.visitCommentStmt = function(stmt, ctx) {
      var lines = stmt.comment.split('\n');
      lines.forEach(function(line) {
        ctx.println("// " + line);
      });
      return null;
    };
    AbstractEmitterVisitor.prototype.visitWriteVarExpr = function(expr, ctx) {
      var lineWasEmpty = ctx.lineIsEmpty();
      if (!lineWasEmpty) {
        ctx.print('(');
      }
      ctx.print(expr.name + " = ");
      expr.value.visitExpression(this, ctx);
      if (!lineWasEmpty) {
        ctx.print(')');
      }
      return null;
    };
    AbstractEmitterVisitor.prototype.visitWriteKeyExpr = function(expr, ctx) {
      var lineWasEmpty = ctx.lineIsEmpty();
      if (!lineWasEmpty) {
        ctx.print('(');
      }
      expr.receiver.visitExpression(this, ctx);
      ctx.print("[");
      expr.index.visitExpression(this, ctx);
      ctx.print("] = ");
      expr.value.visitExpression(this, ctx);
      if (!lineWasEmpty) {
        ctx.print(')');
      }
      return null;
    };
    AbstractEmitterVisitor.prototype.visitWritePropExpr = function(expr, ctx) {
      var lineWasEmpty = ctx.lineIsEmpty();
      if (!lineWasEmpty) {
        ctx.print('(');
      }
      expr.receiver.visitExpression(this, ctx);
      ctx.print("." + expr.name + " = ");
      expr.value.visitExpression(this, ctx);
      if (!lineWasEmpty) {
        ctx.print(')');
      }
      return null;
    };
    AbstractEmitterVisitor.prototype.visitInvokeMethodExpr = function(expr, ctx) {
      expr.receiver.visitExpression(this, ctx);
      var name = expr.name;
      if (lang_1.isPresent(expr.builtin)) {
        name = this.getBuiltinMethodName(expr.builtin);
        if (lang_1.isBlank(name)) {
          return null;
        }
      }
      ctx.print("." + name + "(");
      this.visitAllExpressions(expr.args, ctx, ",");
      ctx.print(")");
      return null;
    };
    AbstractEmitterVisitor.prototype.visitInvokeFunctionExpr = function(expr, ctx) {
      expr.fn.visitExpression(this, ctx);
      ctx.print("(");
      this.visitAllExpressions(expr.args, ctx, ',');
      ctx.print(")");
      return null;
    };
    AbstractEmitterVisitor.prototype.visitReadVarExpr = function(ast, ctx) {
      var varName = ast.name;
      if (lang_1.isPresent(ast.builtin)) {
        switch (ast.builtin) {
          case o.BuiltinVar.Super:
            varName = 'super';
            break;
          case o.BuiltinVar.This:
            varName = 'this';
            break;
          case o.BuiltinVar.CatchError:
            varName = exports.CATCH_ERROR_VAR.name;
            break;
          case o.BuiltinVar.CatchStack:
            varName = exports.CATCH_STACK_VAR.name;
            break;
          default:
            throw new exceptions_1.BaseException("Unknown builtin variable " + ast.builtin);
        }
      }
      ctx.print(varName);
      return null;
    };
    AbstractEmitterVisitor.prototype.visitInstantiateExpr = function(ast, ctx) {
      ctx.print("new ");
      ast.classExpr.visitExpression(this, ctx);
      ctx.print("(");
      this.visitAllExpressions(ast.args, ctx, ',');
      ctx.print(")");
      return null;
    };
    AbstractEmitterVisitor.prototype.visitLiteralExpr = function(ast, ctx) {
      var value = ast.value;
      if (lang_1.isString(value)) {
        ctx.print(escapeSingleQuoteString(value, this._escapeDollarInStrings));
      } else if (lang_1.isBlank(value)) {
        ctx.print('null');
      } else {
        ctx.print("" + value);
      }
      return null;
    };
    AbstractEmitterVisitor.prototype.visitConditionalExpr = function(ast, ctx) {
      ctx.print("(");
      ast.condition.visitExpression(this, ctx);
      ctx.print('? ');
      ast.trueCase.visitExpression(this, ctx);
      ctx.print(': ');
      ast.falseCase.visitExpression(this, ctx);
      ctx.print(")");
      return null;
    };
    AbstractEmitterVisitor.prototype.visitNotExpr = function(ast, ctx) {
      ctx.print('!');
      ast.condition.visitExpression(this, ctx);
      return null;
    };
    AbstractEmitterVisitor.prototype.visitBinaryOperatorExpr = function(ast, ctx) {
      var opStr;
      switch (ast.operator) {
        case o.BinaryOperator.Equals:
          opStr = '==';
          break;
        case o.BinaryOperator.Identical:
          opStr = '===';
          break;
        case o.BinaryOperator.NotEquals:
          opStr = '!=';
          break;
        case o.BinaryOperator.NotIdentical:
          opStr = '!==';
          break;
        case o.BinaryOperator.And:
          opStr = '&&';
          break;
        case o.BinaryOperator.Or:
          opStr = '||';
          break;
        case o.BinaryOperator.Plus:
          opStr = '+';
          break;
        case o.BinaryOperator.Minus:
          opStr = '-';
          break;
        case o.BinaryOperator.Divide:
          opStr = '/';
          break;
        case o.BinaryOperator.Multiply:
          opStr = '*';
          break;
        case o.BinaryOperator.Modulo:
          opStr = '%';
          break;
        case o.BinaryOperator.Lower:
          opStr = '<';
          break;
        case o.BinaryOperator.LowerEquals:
          opStr = '<=';
          break;
        case o.BinaryOperator.Bigger:
          opStr = '>';
          break;
        case o.BinaryOperator.BiggerEquals:
          opStr = '>=';
          break;
        default:
          throw new exceptions_1.BaseException("Unknown operator " + ast.operator);
      }
      ctx.print("(");
      ast.lhs.visitExpression(this, ctx);
      ctx.print(" " + opStr + " ");
      ast.rhs.visitExpression(this, ctx);
      ctx.print(")");
      return null;
    };
    AbstractEmitterVisitor.prototype.visitReadPropExpr = function(ast, ctx) {
      ast.receiver.visitExpression(this, ctx);
      ctx.print(".");
      ctx.print(ast.name);
      return null;
    };
    AbstractEmitterVisitor.prototype.visitReadKeyExpr = function(ast, ctx) {
      ast.receiver.visitExpression(this, ctx);
      ctx.print("[");
      ast.index.visitExpression(this, ctx);
      ctx.print("]");
      return null;
    };
    AbstractEmitterVisitor.prototype.visitLiteralArrayExpr = function(ast, ctx) {
      var useNewLine = ast.entries.length > 1;
      ctx.print("[", useNewLine);
      ctx.incIndent();
      this.visitAllExpressions(ast.entries, ctx, ',', useNewLine);
      ctx.decIndent();
      ctx.print("]", useNewLine);
      return null;
    };
    AbstractEmitterVisitor.prototype.visitLiteralMapExpr = function(ast, ctx) {
      var _this = this;
      var useNewLine = ast.entries.length > 1;
      ctx.print("{", useNewLine);
      ctx.incIndent();
      this.visitAllObjects(function(entry) {
        ctx.print(escapeSingleQuoteString(entry[0], _this._escapeDollarInStrings) + ": ");
        entry[1].visitExpression(_this, ctx);
      }, ast.entries, ctx, ',', useNewLine);
      ctx.decIndent();
      ctx.print("}", useNewLine);
      return null;
    };
    AbstractEmitterVisitor.prototype.visitAllExpressions = function(expressions, ctx, separator, newLine) {
      var _this = this;
      if (newLine === void 0) {
        newLine = false;
      }
      this.visitAllObjects(function(expr) {
        return expr.visitExpression(_this, ctx);
      }, expressions, ctx, separator, newLine);
    };
    AbstractEmitterVisitor.prototype.visitAllObjects = function(handler, expressions, ctx, separator, newLine) {
      if (newLine === void 0) {
        newLine = false;
      }
      for (var i = 0; i < expressions.length; i++) {
        if (i > 0) {
          ctx.print(separator, newLine);
        }
        handler(expressions[i]);
      }
      if (newLine) {
        ctx.println();
      }
    };
    AbstractEmitterVisitor.prototype.visitAllStatements = function(statements, ctx) {
      var _this = this;
      statements.forEach(function(stmt) {
        return stmt.visitStatement(_this, ctx);
      });
    };
    return AbstractEmitterVisitor;
  }());
  exports.AbstractEmitterVisitor = AbstractEmitterVisitor;
  function escapeSingleQuoteString(input, escapeDollar) {
    if (lang_1.isBlank(input)) {
      return null;
    }
    var body = lang_1.StringWrapper.replaceAllMapped(input, _SINGLE_QUOTE_ESCAPE_STRING_RE, function(match) {
      if (match[0] == '$') {
        return escapeDollar ? '\\$' : '$';
      } else if (match[0] == '\n') {
        return '\\n';
      } else if (match[0] == '\r') {
        return '\\r';
      } else {
        return "\\" + match[0];
      }
    });
    return "'" + body + "'";
  }
  exports.escapeSingleQuoteString = escapeSingleQuoteString;
  function _createIndent(count) {
    var res = '';
    for (var i = 0; i < count; i++) {
      res += '  ';
    }
    return res;
  }
  return module.exports;
});

System.registerDynamic("@angular/compiler/src/output/ts_emitter.js", ["./output_ast", "../../src/facade/lang", "../../src/facade/exceptions", "./abstract_emitter"], true, function($__require, exports, module) {
  "use strict";
  ;
  var define,
      global = this,
      GLOBAL = this;
  var __extends = (this && this.__extends) || function(d, b) {
    for (var p in b)
      if (b.hasOwnProperty(p))
        d[p] = b[p];
    function __() {
      this.constructor = d;
    }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
  };
  var o = $__require('./output_ast');
  var lang_1 = $__require('../../src/facade/lang');
  var exceptions_1 = $__require('../../src/facade/exceptions');
  var abstract_emitter_1 = $__require('./abstract_emitter');
  var _debugModuleUrl = 'asset://debug/lib';
  function debugOutputAstAsTypeScript(ast) {
    var converter = new _TsEmitterVisitor(_debugModuleUrl);
    var ctx = abstract_emitter_1.EmitterVisitorContext.createRoot([]);
    var asts;
    if (lang_1.isArray(ast)) {
      asts = ast;
    } else {
      asts = [ast];
    }
    asts.forEach(function(ast) {
      if (ast instanceof o.Statement) {
        ast.visitStatement(converter, ctx);
      } else if (ast instanceof o.Expression) {
        ast.visitExpression(converter, ctx);
      } else if (ast instanceof o.Type) {
        ast.visitType(converter, ctx);
      } else {
        throw new exceptions_1.BaseException("Don't know how to print debug info for " + ast);
      }
    });
    return ctx.toSource();
  }
  exports.debugOutputAstAsTypeScript = debugOutputAstAsTypeScript;
  var TypeScriptEmitter = (function() {
    function TypeScriptEmitter(_importGenerator) {
      this._importGenerator = _importGenerator;
    }
    TypeScriptEmitter.prototype.emitStatements = function(moduleUrl, stmts, exportedVars) {
      var _this = this;
      var converter = new _TsEmitterVisitor(moduleUrl);
      var ctx = abstract_emitter_1.EmitterVisitorContext.createRoot(exportedVars);
      converter.visitAllStatements(stmts, ctx);
      var srcParts = [];
      converter.importsWithPrefixes.forEach(function(prefix, importedModuleUrl) {
        srcParts.push("imp" + ("ort * as " + prefix + " from '" + _this._importGenerator.getImportPath(moduleUrl, importedModuleUrl) + "';"));
      });
      srcParts.push(ctx.toSource());
      return srcParts.join('\n');
    };
    return TypeScriptEmitter;
  }());
  exports.TypeScriptEmitter = TypeScriptEmitter;
  var _TsEmitterVisitor = (function(_super) {
    __extends(_TsEmitterVisitor, _super);
    function _TsEmitterVisitor(_moduleUrl) {
      _super.call(this, false);
      this._moduleUrl = _moduleUrl;
      this.importsWithPrefixes = new Map();
    }
    _TsEmitterVisitor.prototype.visitExternalExpr = function(ast, ctx) {
      this._visitIdentifier(ast.value, ast.typeParams, ctx);
      return null;
    };
    _TsEmitterVisitor.prototype.visitDeclareVarStmt = function(stmt, ctx) {
      if (ctx.isExportedVar(stmt.name)) {
        ctx.print("export ");
      }
      if (stmt.hasModifier(o.StmtModifier.Final)) {
        ctx.print("const");
      } else {
        ctx.print("var");
      }
      ctx.print(" " + stmt.name);
      if (lang_1.isPresent(stmt.type)) {
        ctx.print(":");
        stmt.type.visitType(this, ctx);
      }
      ctx.print(" = ");
      stmt.value.visitExpression(this, ctx);
      ctx.println(";");
      return null;
    };
    _TsEmitterVisitor.prototype.visitCastExpr = function(ast, ctx) {
      ctx.print("(<");
      ast.type.visitType(this, ctx);
      ctx.print(">");
      ast.value.visitExpression(this, ctx);
      ctx.print(")");
      return null;
    };
    _TsEmitterVisitor.prototype.visitDeclareClassStmt = function(stmt, ctx) {
      var _this = this;
      ctx.pushClass(stmt);
      if (ctx.isExportedVar(stmt.name)) {
        ctx.print("export ");
      }
      ctx.print("class " + stmt.name);
      if (lang_1.isPresent(stmt.parent)) {
        ctx.print(" extends ");
        stmt.parent.visitExpression(this, ctx);
      }
      ctx.println(" {");
      ctx.incIndent();
      stmt.fields.forEach(function(field) {
        return _this._visitClassField(field, ctx);
      });
      if (lang_1.isPresent(stmt.constructorMethod)) {
        this._visitClassConstructor(stmt, ctx);
      }
      stmt.getters.forEach(function(getter) {
        return _this._visitClassGetter(getter, ctx);
      });
      stmt.methods.forEach(function(method) {
        return _this._visitClassMethod(method, ctx);
      });
      ctx.decIndent();
      ctx.println("}");
      ctx.popClass();
      return null;
    };
    _TsEmitterVisitor.prototype._visitClassField = function(field, ctx) {
      if (field.hasModifier(o.StmtModifier.Private)) {
        ctx.print("private ");
      }
      ctx.print(field.name);
      if (lang_1.isPresent(field.type)) {
        ctx.print(":");
        field.type.visitType(this, ctx);
      } else {
        ctx.print(": any");
      }
      ctx.println(";");
    };
    _TsEmitterVisitor.prototype._visitClassGetter = function(getter, ctx) {
      if (getter.hasModifier(o.StmtModifier.Private)) {
        ctx.print("private ");
      }
      ctx.print("get " + getter.name + "()");
      if (lang_1.isPresent(getter.type)) {
        ctx.print(":");
        getter.type.visitType(this, ctx);
      }
      ctx.println(" {");
      ctx.incIndent();
      this.visitAllStatements(getter.body, ctx);
      ctx.decIndent();
      ctx.println("}");
    };
    _TsEmitterVisitor.prototype._visitClassConstructor = function(stmt, ctx) {
      ctx.print("constructor(");
      this._visitParams(stmt.constructorMethod.params, ctx);
      ctx.println(") {");
      ctx.incIndent();
      this.visitAllStatements(stmt.constructorMethod.body, ctx);
      ctx.decIndent();
      ctx.println("}");
    };
    _TsEmitterVisitor.prototype._visitClassMethod = function(method, ctx) {
      if (method.hasModifier(o.StmtModifier.Private)) {
        ctx.print("private ");
      }
      ctx.print(method.name + "(");
      this._visitParams(method.params, ctx);
      ctx.print("):");
      if (lang_1.isPresent(method.type)) {
        method.type.visitType(this, ctx);
      } else {
        ctx.print("void");
      }
      ctx.println(" {");
      ctx.incIndent();
      this.visitAllStatements(method.body, ctx);
      ctx.decIndent();
      ctx.println("}");
    };
    _TsEmitterVisitor.prototype.visitFunctionExpr = function(ast, ctx) {
      ctx.print("(");
      this._visitParams(ast.params, ctx);
      ctx.print("):");
      if (lang_1.isPresent(ast.type)) {
        ast.type.visitType(this, ctx);
      } else {
        ctx.print("void");
      }
      ctx.println(" => {");
      ctx.incIndent();
      this.visitAllStatements(ast.statements, ctx);
      ctx.decIndent();
      ctx.print("}");
      return null;
    };
    _TsEmitterVisitor.prototype.visitDeclareFunctionStmt = function(stmt, ctx) {
      if (ctx.isExportedVar(stmt.name)) {
        ctx.print("export ");
      }
      ctx.print("function " + stmt.name + "(");
      this._visitParams(stmt.params, ctx);
      ctx.print("):");
      if (lang_1.isPresent(stmt.type)) {
        stmt.type.visitType(this, ctx);
      } else {
        ctx.print("void");
      }
      ctx.println(" {");
      ctx.incIndent();
      this.visitAllStatements(stmt.statements, ctx);
      ctx.decIndent();
      ctx.println("}");
      return null;
    };
    _TsEmitterVisitor.prototype.visitTryCatchStmt = function(stmt, ctx) {
      ctx.println("try {");
      ctx.incIndent();
      this.visitAllStatements(stmt.bodyStmts, ctx);
      ctx.decIndent();
      ctx.println("} catch (" + abstract_emitter_1.CATCH_ERROR_VAR.name + ") {");
      ctx.incIndent();
      var catchStmts = [abstract_emitter_1.CATCH_STACK_VAR.set(abstract_emitter_1.CATCH_ERROR_VAR.prop('stack')).toDeclStmt(null, [o.StmtModifier.Final])].concat(stmt.catchStmts);
      this.visitAllStatements(catchStmts, ctx);
      ctx.decIndent();
      ctx.println("}");
      return null;
    };
    _TsEmitterVisitor.prototype.visitBuiltintType = function(type, ctx) {
      var typeStr;
      switch (type.name) {
        case o.BuiltinTypeName.Bool:
          typeStr = 'boolean';
          break;
        case o.BuiltinTypeName.Dynamic:
          typeStr = 'any';
          break;
        case o.BuiltinTypeName.Function:
          typeStr = 'Function';
          break;
        case o.BuiltinTypeName.Number:
          typeStr = 'number';
          break;
        case o.BuiltinTypeName.Int:
          typeStr = 'number';
          break;
        case o.BuiltinTypeName.String:
          typeStr = 'string';
          break;
        default:
          throw new exceptions_1.BaseException("Unsupported builtin type " + type.name);
      }
      ctx.print(typeStr);
      return null;
    };
    _TsEmitterVisitor.prototype.visitExternalType = function(ast, ctx) {
      this._visitIdentifier(ast.value, ast.typeParams, ctx);
      return null;
    };
    _TsEmitterVisitor.prototype.visitArrayType = function(type, ctx) {
      if (lang_1.isPresent(type.of)) {
        type.of.visitType(this, ctx);
      } else {
        ctx.print("any");
      }
      ctx.print("[]");
      return null;
    };
    _TsEmitterVisitor.prototype.visitMapType = function(type, ctx) {
      ctx.print("{[key: string]:");
      if (lang_1.isPresent(type.valueType)) {
        type.valueType.visitType(this, ctx);
      } else {
        ctx.print("any");
      }
      ctx.print("}");
      return null;
    };
    _TsEmitterVisitor.prototype.getBuiltinMethodName = function(method) {
      var name;
      switch (method) {
        case o.BuiltinMethod.ConcatArray:
          name = 'concat';
          break;
        case o.BuiltinMethod.SubscribeObservable:
          name = 'subscribe';
          break;
        case o.BuiltinMethod.bind:
          name = 'bind';
          break;
        default:
          throw new exceptions_1.BaseException("Unknown builtin method: " + method);
      }
      return name;
    };
    _TsEmitterVisitor.prototype._visitParams = function(params, ctx) {
      var _this = this;
      this.visitAllObjects(function(param) {
        ctx.print(param.name);
        if (lang_1.isPresent(param.type)) {
          ctx.print(":");
          param.type.visitType(_this, ctx);
        }
      }, params, ctx, ',');
    };
    _TsEmitterVisitor.prototype._visitIdentifier = function(value, typeParams, ctx) {
      var _this = this;
      if (lang_1.isBlank(value.name)) {
        throw new exceptions_1.BaseException("Internal error: unknown identifier " + value);
      }
      if (lang_1.isPresent(value.moduleUrl) && value.moduleUrl != this._moduleUrl) {
        var prefix = this.importsWithPrefixes.get(value.moduleUrl);
        if (lang_1.isBlank(prefix)) {
          prefix = "import" + this.importsWithPrefixes.size;
          this.importsWithPrefixes.set(value.moduleUrl, prefix);
        }
        ctx.print(prefix + ".");
      }
      ctx.print(value.name);
      if (lang_1.isPresent(typeParams) && typeParams.length > 0) {
        ctx.print("<");
        this.visitAllObjects(function(type) {
          return type.visitType(_this, ctx);
        }, typeParams, ctx, ',');
        ctx.print(">");
      }
    };
    return _TsEmitterVisitor;
  }(abstract_emitter_1.AbstractEmitterVisitor));
  return module.exports;
});

System.registerDynamic("@angular/compiler/src/output/output_interpreter.js", ["@angular/core", "../../src/facade/lang", "../../src/facade/async", "../../src/facade/exceptions", "../../src/facade/collection", "./output_ast", "./dart_emitter", "./ts_emitter"], true, function($__require, exports, module) {
  "use strict";
  ;
  var define,
      global = this,
      GLOBAL = this;
  var core_1 = $__require('@angular/core');
  var lang_1 = $__require('../../src/facade/lang');
  var async_1 = $__require('../../src/facade/async');
  var exceptions_1 = $__require('../../src/facade/exceptions');
  var collection_1 = $__require('../../src/facade/collection');
  var o = $__require('./output_ast');
  var dart_emitter_1 = $__require('./dart_emitter');
  var ts_emitter_1 = $__require('./ts_emitter');
  function interpretStatements(statements, resultVar, instanceFactory) {
    var stmtsWithReturn = statements.concat([new o.ReturnStatement(o.variable(resultVar))]);
    var ctx = new _ExecutionContext(null, null, null, null, new Map(), new Map(), new Map(), new Map(), instanceFactory);
    var visitor = new StatementInterpreter();
    var result = visitor.visitAllStatements(stmtsWithReturn, ctx);
    return lang_1.isPresent(result) ? result.value : null;
  }
  exports.interpretStatements = interpretStatements;
  var DynamicInstance = (function() {
    function DynamicInstance() {}
    Object.defineProperty(DynamicInstance.prototype, "props", {
      get: function() {
        return exceptions_1.unimplemented();
      },
      enumerable: true,
      configurable: true
    });
    Object.defineProperty(DynamicInstance.prototype, "getters", {
      get: function() {
        return exceptions_1.unimplemented();
      },
      enumerable: true,
      configurable: true
    });
    Object.defineProperty(DynamicInstance.prototype, "methods", {
      get: function() {
        return exceptions_1.unimplemented();
      },
      enumerable: true,
      configurable: true
    });
    Object.defineProperty(DynamicInstance.prototype, "clazz", {
      get: function() {
        return exceptions_1.unimplemented();
      },
      enumerable: true,
      configurable: true
    });
    return DynamicInstance;
  }());
  exports.DynamicInstance = DynamicInstance;
  function isDynamicInstance(instance) {
    if (lang_1.IS_DART) {
      return instance instanceof DynamicInstance;
    } else {
      return lang_1.isPresent(instance) && lang_1.isPresent(instance.props) && lang_1.isPresent(instance.getters) && lang_1.isPresent(instance.methods);
    }
  }
  function _executeFunctionStatements(varNames, varValues, statements, ctx, visitor) {
    var childCtx = ctx.createChildWihtLocalVars();
    for (var i = 0; i < varNames.length; i++) {
      childCtx.vars.set(varNames[i], varValues[i]);
    }
    var result = visitor.visitAllStatements(statements, childCtx);
    return lang_1.isPresent(result) ? result.value : null;
  }
  var _ExecutionContext = (function() {
    function _ExecutionContext(parent, superClass, superInstance, className, vars, props, getters, methods, instanceFactory) {
      this.parent = parent;
      this.superClass = superClass;
      this.superInstance = superInstance;
      this.className = className;
      this.vars = vars;
      this.props = props;
      this.getters = getters;
      this.methods = methods;
      this.instanceFactory = instanceFactory;
    }
    _ExecutionContext.prototype.createChildWihtLocalVars = function() {
      return new _ExecutionContext(this, this.superClass, this.superInstance, this.className, new Map(), this.props, this.getters, this.methods, this.instanceFactory);
    };
    return _ExecutionContext;
  }());
  var ReturnValue = (function() {
    function ReturnValue(value) {
      this.value = value;
    }
    return ReturnValue;
  }());
  var _DynamicClass = (function() {
    function _DynamicClass(_classStmt, _ctx, _visitor) {
      this._classStmt = _classStmt;
      this._ctx = _ctx;
      this._visitor = _visitor;
    }
    _DynamicClass.prototype.instantiate = function(args) {
      var _this = this;
      var props = new Map();
      var getters = new Map();
      var methods = new Map();
      var superClass = this._classStmt.parent.visitExpression(this._visitor, this._ctx);
      var instanceCtx = new _ExecutionContext(this._ctx, superClass, null, this._classStmt.name, this._ctx.vars, props, getters, methods, this._ctx.instanceFactory);
      this._classStmt.fields.forEach(function(field) {
        props.set(field.name, null);
      });
      this._classStmt.getters.forEach(function(getter) {
        getters.set(getter.name, function() {
          return _executeFunctionStatements([], [], getter.body, instanceCtx, _this._visitor);
        });
      });
      this._classStmt.methods.forEach(function(method) {
        var paramNames = method.params.map(function(param) {
          return param.name;
        });
        methods.set(method.name, _declareFn(paramNames, method.body, instanceCtx, _this._visitor));
      });
      var ctorParamNames = this._classStmt.constructorMethod.params.map(function(param) {
        return param.name;
      });
      _executeFunctionStatements(ctorParamNames, args, this._classStmt.constructorMethod.body, instanceCtx, this._visitor);
      return instanceCtx.superInstance;
    };
    _DynamicClass.prototype.debugAst = function() {
      return this._visitor.debugAst(this._classStmt);
    };
    return _DynamicClass;
  }());
  var StatementInterpreter = (function() {
    function StatementInterpreter() {}
    StatementInterpreter.prototype.debugAst = function(ast) {
      return lang_1.IS_DART ? dart_emitter_1.debugOutputAstAsDart(ast) : ts_emitter_1.debugOutputAstAsTypeScript(ast);
    };
    StatementInterpreter.prototype.visitDeclareVarStmt = function(stmt, ctx) {
      ctx.vars.set(stmt.name, stmt.value.visitExpression(this, ctx));
      return null;
    };
    StatementInterpreter.prototype.visitWriteVarExpr = function(expr, ctx) {
      var value = expr.value.visitExpression(this, ctx);
      var currCtx = ctx;
      while (currCtx != null) {
        if (currCtx.vars.has(expr.name)) {
          currCtx.vars.set(expr.name, value);
          return value;
        }
        currCtx = currCtx.parent;
      }
      throw new exceptions_1.BaseException("Not declared variable " + expr.name);
    };
    StatementInterpreter.prototype.visitReadVarExpr = function(ast, ctx) {
      var varName = ast.name;
      if (lang_1.isPresent(ast.builtin)) {
        switch (ast.builtin) {
          case o.BuiltinVar.Super:
          case o.BuiltinVar.This:
            return ctx.superInstance;
          case o.BuiltinVar.CatchError:
            varName = CATCH_ERROR_VAR;
            break;
          case o.BuiltinVar.CatchStack:
            varName = CATCH_STACK_VAR;
            break;
          default:
            throw new exceptions_1.BaseException("Unknown builtin variable " + ast.builtin);
        }
      }
      var currCtx = ctx;
      while (currCtx != null) {
        if (currCtx.vars.has(varName)) {
          return currCtx.vars.get(varName);
        }
        currCtx = currCtx.parent;
      }
      throw new exceptions_1.BaseException("Not declared variable " + varName);
    };
    StatementInterpreter.prototype.visitWriteKeyExpr = function(expr, ctx) {
      var receiver = expr.receiver.visitExpression(this, ctx);
      var index = expr.index.visitExpression(this, ctx);
      var value = expr.value.visitExpression(this, ctx);
      receiver[index] = value;
      return value;
    };
    StatementInterpreter.prototype.visitWritePropExpr = function(expr, ctx) {
      var receiver = expr.receiver.visitExpression(this, ctx);
      var value = expr.value.visitExpression(this, ctx);
      if (isDynamicInstance(receiver)) {
        var di = receiver;
        if (di.props.has(expr.name)) {
          di.props.set(expr.name, value);
        } else {
          core_1.reflector.setter(expr.name)(receiver, value);
        }
      } else {
        core_1.reflector.setter(expr.name)(receiver, value);
      }
      return value;
    };
    StatementInterpreter.prototype.visitInvokeMethodExpr = function(expr, ctx) {
      var receiver = expr.receiver.visitExpression(this, ctx);
      var args = this.visitAllExpressions(expr.args, ctx);
      var result;
      if (lang_1.isPresent(expr.builtin)) {
        switch (expr.builtin) {
          case o.BuiltinMethod.ConcatArray:
            result = collection_1.ListWrapper.concat(receiver, args[0]);
            break;
          case o.BuiltinMethod.SubscribeObservable:
            result = async_1.ObservableWrapper.subscribe(receiver, args[0]);
            break;
          case o.BuiltinMethod.bind:
            if (lang_1.IS_DART) {
              result = receiver;
            } else {
              result = receiver.bind(args[0]);
            }
            break;
          default:
            throw new exceptions_1.BaseException("Unknown builtin method " + expr.builtin);
        }
      } else if (isDynamicInstance(receiver)) {
        var di = receiver;
        if (di.methods.has(expr.name)) {
          result = lang_1.FunctionWrapper.apply(di.methods.get(expr.name), args);
        } else {
          result = core_1.reflector.method(expr.name)(receiver, args);
        }
      } else {
        result = core_1.reflector.method(expr.name)(receiver, args);
      }
      return result;
    };
    StatementInterpreter.prototype.visitInvokeFunctionExpr = function(stmt, ctx) {
      var args = this.visitAllExpressions(stmt.args, ctx);
      var fnExpr = stmt.fn;
      if (fnExpr instanceof o.ReadVarExpr && fnExpr.builtin === o.BuiltinVar.Super) {
        ctx.superInstance = ctx.instanceFactory.createInstance(ctx.superClass, ctx.className, args, ctx.props, ctx.getters, ctx.methods);
        ctx.parent.superInstance = ctx.superInstance;
        return null;
      } else {
        var fn = stmt.fn.visitExpression(this, ctx);
        return lang_1.FunctionWrapper.apply(fn, args);
      }
    };
    StatementInterpreter.prototype.visitReturnStmt = function(stmt, ctx) {
      return new ReturnValue(stmt.value.visitExpression(this, ctx));
    };
    StatementInterpreter.prototype.visitDeclareClassStmt = function(stmt, ctx) {
      var clazz = new _DynamicClass(stmt, ctx, this);
      ctx.vars.set(stmt.name, clazz);
      return null;
    };
    StatementInterpreter.prototype.visitExpressionStmt = function(stmt, ctx) {
      return stmt.expr.visitExpression(this, ctx);
    };
    StatementInterpreter.prototype.visitIfStmt = function(stmt, ctx) {
      var condition = stmt.condition.visitExpression(this, ctx);
      if (condition) {
        return this.visitAllStatements(stmt.trueCase, ctx);
      } else if (lang_1.isPresent(stmt.falseCase)) {
        return this.visitAllStatements(stmt.falseCase, ctx);
      }
      return null;
    };
    StatementInterpreter.prototype.visitTryCatchStmt = function(stmt, ctx) {
      try {
        return this.visitAllStatements(stmt.bodyStmts, ctx);
      } catch (e) {
        var childCtx = ctx.createChildWihtLocalVars();
        childCtx.vars.set(CATCH_ERROR_VAR, e);
        childCtx.vars.set(CATCH_STACK_VAR, e.stack);
        return this.visitAllStatements(stmt.catchStmts, childCtx);
      }
    };
    StatementInterpreter.prototype.visitThrowStmt = function(stmt, ctx) {
      throw stmt.error.visitExpression(this, ctx);
    };
    StatementInterpreter.prototype.visitCommentStmt = function(stmt, context) {
      return null;
    };
    StatementInterpreter.prototype.visitInstantiateExpr = function(ast, ctx) {
      var args = this.visitAllExpressions(ast.args, ctx);
      var clazz = ast.classExpr.visitExpression(this, ctx);
      if (clazz instanceof _DynamicClass) {
        return clazz.instantiate(args);
      } else {
        return lang_1.FunctionWrapper.apply(core_1.reflector.factory(clazz), args);
      }
    };
    StatementInterpreter.prototype.visitLiteralExpr = function(ast, ctx) {
      return ast.value;
    };
    StatementInterpreter.prototype.visitExternalExpr = function(ast, ctx) {
      return ast.value.runtime;
    };
    StatementInterpreter.prototype.visitConditionalExpr = function(ast, ctx) {
      if (ast.condition.visitExpression(this, ctx)) {
        return ast.trueCase.visitExpression(this, ctx);
      } else if (lang_1.isPresent(ast.falseCase)) {
        return ast.falseCase.visitExpression(this, ctx);
      }
      return null;
    };
    StatementInterpreter.prototype.visitNotExpr = function(ast, ctx) {
      return !ast.condition.visitExpression(this, ctx);
    };
    StatementInterpreter.prototype.visitCastExpr = function(ast, ctx) {
      return ast.value.visitExpression(this, ctx);
    };
    StatementInterpreter.prototype.visitFunctionExpr = function(ast, ctx) {
      var paramNames = ast.params.map(function(param) {
        return param.name;
      });
      return _declareFn(paramNames, ast.statements, ctx, this);
    };
    StatementInterpreter.prototype.visitDeclareFunctionStmt = function(stmt, ctx) {
      var paramNames = stmt.params.map(function(param) {
        return param.name;
      });
      ctx.vars.set(stmt.name, _declareFn(paramNames, stmt.statements, ctx, this));
      return null;
    };
    StatementInterpreter.prototype.visitBinaryOperatorExpr = function(ast, ctx) {
      var _this = this;
      var lhs = function() {
        return ast.lhs.visitExpression(_this, ctx);
      };
      var rhs = function() {
        return ast.rhs.visitExpression(_this, ctx);
      };
      switch (ast.operator) {
        case o.BinaryOperator.Equals:
          return lhs() == rhs();
        case o.BinaryOperator.Identical:
          return lhs() === rhs();
        case o.BinaryOperator.NotEquals:
          return lhs() != rhs();
        case o.BinaryOperator.NotIdentical:
          return lhs() !== rhs();
        case o.BinaryOperator.And:
          return lhs() && rhs();
        case o.BinaryOperator.Or:
          return lhs() || rhs();
        case o.BinaryOperator.Plus:
          return lhs() + rhs();
        case o.BinaryOperator.Minus:
          return lhs() - rhs();
        case o.BinaryOperator.Divide:
          return lhs() / rhs();
        case o.BinaryOperator.Multiply:
          return lhs() * rhs();
        case o.BinaryOperator.Modulo:
          return lhs() % rhs();
        case o.BinaryOperator.Lower:
          return lhs() < rhs();
        case o.BinaryOperator.LowerEquals:
          return lhs() <= rhs();
        case o.BinaryOperator.Bigger:
          return lhs() > rhs();
        case o.BinaryOperator.BiggerEquals:
          return lhs() >= rhs();
        default:
          throw new exceptions_1.BaseException("Unknown operator " + ast.operator);
      }
    };
    StatementInterpreter.prototype.visitReadPropExpr = function(ast, ctx) {
      var result;
      var receiver = ast.receiver.visitExpression(this, ctx);
      if (isDynamicInstance(receiver)) {
        var di = receiver;
        if (di.props.has(ast.name)) {
          result = di.props.get(ast.name);
        } else if (di.getters.has(ast.name)) {
          result = di.getters.get(ast.name)();
        } else if (di.methods.has(ast.name)) {
          result = di.methods.get(ast.name);
        } else {
          result = core_1.reflector.getter(ast.name)(receiver);
        }
      } else {
        result = core_1.reflector.getter(ast.name)(receiver);
      }
      return result;
    };
    StatementInterpreter.prototype.visitReadKeyExpr = function(ast, ctx) {
      var receiver = ast.receiver.visitExpression(this, ctx);
      var prop = ast.index.visitExpression(this, ctx);
      return receiver[prop];
    };
    StatementInterpreter.prototype.visitLiteralArrayExpr = function(ast, ctx) {
      return this.visitAllExpressions(ast.entries, ctx);
    };
    StatementInterpreter.prototype.visitLiteralMapExpr = function(ast, ctx) {
      var _this = this;
      var result = {};
      ast.entries.forEach(function(entry) {
        return result[entry[0]] = entry[1].visitExpression(_this, ctx);
      });
      return result;
    };
    StatementInterpreter.prototype.visitAllExpressions = function(expressions, ctx) {
      var _this = this;
      return expressions.map(function(expr) {
        return expr.visitExpression(_this, ctx);
      });
    };
    StatementInterpreter.prototype.visitAllStatements = function(statements, ctx) {
      for (var i = 0; i < statements.length; i++) {
        var stmt = statements[i];
        var val = stmt.visitStatement(this, ctx);
        if (val instanceof ReturnValue) {
          return val;
        }
      }
      return null;
    };
    return StatementInterpreter;
  }());
  function _declareFn(varNames, statements, ctx, visitor) {
    switch (varNames.length) {
      case 0:
        return function() {
          return _executeFunctionStatements(varNames, [], statements, ctx, visitor);
        };
      case 1:
        return function(d0) {
          return _executeFunctionStatements(varNames, [d0], statements, ctx, visitor);
        };
      case 2:
        return function(d0, d1) {
          return _executeFunctionStatements(varNames, [d0, d1], statements, ctx, visitor);
        };
      case 3:
        return function(d0, d1, d2) {
          return _executeFunctionStatements(varNames, [d0, d1, d2], statements, ctx, visitor);
        };
      case 4:
        return function(d0, d1, d2, d3) {
          return _executeFunctionStatements(varNames, [d0, d1, d2, d3], statements, ctx, visitor);
        };
      case 5:
        return function(d0, d1, d2, d3, d4) {
          return _executeFunctionStatements(varNames, [d0, d1, d2, d3, d4], statements, ctx, visitor);
        };
      case 6:
        return function(d0, d1, d2, d3, d4, d5) {
          return _executeFunctionStatements(varNames, [d0, d1, d2, d3, d4, d5], statements, ctx, visitor);
        };
      case 7:
        return function(d0, d1, d2, d3, d4, d5, d6) {
          return _executeFunctionStatements(varNames, [d0, d1, d2, d3, d4, d5, d6], statements, ctx, visitor);
        };
      case 8:
        return function(d0, d1, d2, d3, d4, d5, d6, d7) {
          return _executeFunctionStatements(varNames, [d0, d1, d2, d3, d4, d5, d6, d7], statements, ctx, visitor);
        };
      case 9:
        return function(d0, d1, d2, d3, d4, d5, d6, d7, d8) {
          return _executeFunctionStatements(varNames, [d0, d1, d2, d3, d4, d5, d6, d7, d8], statements, ctx, visitor);
        };
      case 10:
        return function(d0, d1, d2, d3, d4, d5, d6, d7, d8, d9) {
          return _executeFunctionStatements(varNames, [d0, d1, d2, d3, d4, d5, d6, d7, d8, d9], statements, ctx, visitor);
        };
      default:
        throw new exceptions_1.BaseException('Declaring functions with more than 10 arguments is not supported right now');
    }
  }
  var CATCH_ERROR_VAR = 'error';
  var CATCH_STACK_VAR = 'stack';
  return module.exports;
});

System.registerDynamic("@angular/compiler/src/output/interpretive_view.js", ["../../core_private", "../../src/facade/lang", "../../src/facade/exceptions"], true, function($__require, exports, module) {
  "use strict";
  ;
  var define,
      global = this,
      GLOBAL = this;
  var __extends = (this && this.__extends) || function(d, b) {
    for (var p in b)
      if (b.hasOwnProperty(p))
        d[p] = b[p];
    function __() {
      this.constructor = d;
    }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
  };
  var core_private_1 = $__require('../../core_private');
  var lang_1 = $__require('../../src/facade/lang');
  var exceptions_1 = $__require('../../src/facade/exceptions');
  var InterpretiveAppViewInstanceFactory = (function() {
    function InterpretiveAppViewInstanceFactory() {}
    InterpretiveAppViewInstanceFactory.prototype.createInstance = function(superClass, clazz, args, props, getters, methods) {
      if (superClass === core_private_1.AppView) {
        args = args.concat([null]);
        return new _InterpretiveAppView(args, props, getters, methods);
      } else if (superClass === core_private_1.DebugAppView) {
        return new _InterpretiveAppView(args, props, getters, methods);
      }
      throw new exceptions_1.BaseException("Can't instantiate class " + superClass + " in interpretative mode");
    };
    return InterpretiveAppViewInstanceFactory;
  }());
  exports.InterpretiveAppViewInstanceFactory = InterpretiveAppViewInstanceFactory;
  var _InterpretiveAppView = (function(_super) {
    __extends(_InterpretiveAppView, _super);
    function _InterpretiveAppView(args, props, getters, methods) {
      _super.call(this, args[0], args[1], args[2], args[3], args[4], args[5], args[6], args[7]);
      this.props = props;
      this.getters = getters;
      this.methods = methods;
    }
    _InterpretiveAppView.prototype.createInternal = function(rootSelector) {
      var m = this.methods.get('createInternal');
      if (lang_1.isPresent(m)) {
        return m(rootSelector);
      } else {
        return _super.prototype.createInternal.call(this, rootSelector);
      }
    };
    _InterpretiveAppView.prototype.injectorGetInternal = function(token, nodeIndex, notFoundResult) {
      var m = this.methods.get('injectorGetInternal');
      if (lang_1.isPresent(m)) {
        return m(token, nodeIndex, notFoundResult);
      } else {
        return _super.prototype.injectorGet.call(this, token, nodeIndex, notFoundResult);
      }
    };
    _InterpretiveAppView.prototype.destroyInternal = function() {
      var m = this.methods.get('destroyInternal');
      if (lang_1.isPresent(m)) {
        return m();
      } else {
        return _super.prototype.destroyInternal.call(this);
      }
    };
    _InterpretiveAppView.prototype.dirtyParentQueriesInternal = function() {
      var m = this.methods.get('dirtyParentQueriesInternal');
      if (lang_1.isPresent(m)) {
        return m();
      } else {
        return _super.prototype.dirtyParentQueriesInternal.call(this);
      }
    };
    _InterpretiveAppView.prototype.detectChangesInternal = function(throwOnChange) {
      var m = this.methods.get('detectChangesInternal');
      if (lang_1.isPresent(m)) {
        return m(throwOnChange);
      } else {
        return _super.prototype.detectChangesInternal.call(this, throwOnChange);
      }
    };
    return _InterpretiveAppView;
  }(core_private_1.DebugAppView));
  return module.exports;
});

System.registerDynamic("@angular/compiler/src/runtime_compiler.js", ["@angular/core", "../src/facade/lang", "../src/facade/exceptions", "../src/facade/collection", "../src/facade/async", "./compile_metadata", "./style_compiler", "./view_compiler/view_compiler", "./template_parser", "./directive_normalizer", "./metadata_resolver", "./config", "./output/output_ast", "./output/output_jit", "./output/output_interpreter", "./output/interpretive_view", "./xhr"], true, function($__require, exports, module) {
  "use strict";
  ;
  var define,
      global = this,
      GLOBAL = this;
  var core_1 = $__require('@angular/core');
  var lang_1 = $__require('../src/facade/lang');
  var exceptions_1 = $__require('../src/facade/exceptions');
  var collection_1 = $__require('../src/facade/collection');
  var async_1 = $__require('../src/facade/async');
  var compile_metadata_1 = $__require('./compile_metadata');
  var style_compiler_1 = $__require('./style_compiler');
  var view_compiler_1 = $__require('./view_compiler/view_compiler');
  var template_parser_1 = $__require('./template_parser');
  var directive_normalizer_1 = $__require('./directive_normalizer');
  var metadata_resolver_1 = $__require('./metadata_resolver');
  var config_1 = $__require('./config');
  var ir = $__require('./output/output_ast');
  var output_jit_1 = $__require('./output/output_jit');
  var output_interpreter_1 = $__require('./output/output_interpreter');
  var interpretive_view_1 = $__require('./output/interpretive_view');
  var xhr_1 = $__require('./xhr');
  var RuntimeCompiler = (function() {
    function RuntimeCompiler(_metadataResolver, _templateNormalizer, _templateParser, _styleCompiler, _viewCompiler, _xhr, _genConfig) {
      this._metadataResolver = _metadataResolver;
      this._templateNormalizer = _templateNormalizer;
      this._templateParser = _templateParser;
      this._styleCompiler = _styleCompiler;
      this._viewCompiler = _viewCompiler;
      this._xhr = _xhr;
      this._genConfig = _genConfig;
      this._styleCache = new Map();
      this._hostCacheKeys = new Map();
      this._compiledTemplateCache = new Map();
      this._compiledTemplateDone = new Map();
    }
    RuntimeCompiler.prototype.resolveComponent = function(componentType) {
      var compMeta = this._metadataResolver.getDirectiveMetadata(componentType);
      var hostCacheKey = this._hostCacheKeys.get(componentType);
      if (lang_1.isBlank(hostCacheKey)) {
        hostCacheKey = new Object();
        this._hostCacheKeys.set(componentType, hostCacheKey);
        assertComponent(compMeta);
        var hostMeta = compile_metadata_1.createHostComponentMeta(compMeta.type, compMeta.selector);
        this._loadAndCompileComponent(hostCacheKey, hostMeta, [compMeta], [], []);
      }
      return this._compiledTemplateDone.get(hostCacheKey).then(function(compiledTemplate) {
        return new core_1.ComponentFactory(compMeta.selector, compiledTemplate.viewFactory, componentType);
      });
    };
    RuntimeCompiler.prototype.clearCache = function() {
      this._styleCache.clear();
      this._compiledTemplateCache.clear();
      this._compiledTemplateDone.clear();
      this._hostCacheKeys.clear();
    };
    RuntimeCompiler.prototype._loadAndCompileComponent = function(cacheKey, compMeta, viewDirectives, pipes, compilingComponentsPath) {
      var _this = this;
      var compiledTemplate = this._compiledTemplateCache.get(cacheKey);
      var done = this._compiledTemplateDone.get(cacheKey);
      if (lang_1.isBlank(compiledTemplate)) {
        compiledTemplate = new CompiledTemplate();
        this._compiledTemplateCache.set(cacheKey, compiledTemplate);
        done = async_1.PromiseWrapper.all([this._compileComponentStyles(compMeta)].concat(viewDirectives.map(function(dirMeta) {
          return _this._templateNormalizer.normalizeDirective(dirMeta);
        }))).then(function(stylesAndNormalizedViewDirMetas) {
          var normalizedViewDirMetas = stylesAndNormalizedViewDirMetas.slice(1);
          var styles = stylesAndNormalizedViewDirMetas[0];
          var parsedTemplate = _this._templateParser.parse(compMeta, compMeta.template.template, normalizedViewDirMetas, pipes, compMeta.type.name);
          var childPromises = [];
          compiledTemplate.init(_this._compileComponent(compMeta, parsedTemplate, styles, pipes, compilingComponentsPath, childPromises));
          return async_1.PromiseWrapper.all(childPromises).then(function(_) {
            return compiledTemplate;
          });
        });
        this._compiledTemplateDone.set(cacheKey, done);
      }
      return compiledTemplate;
    };
    RuntimeCompiler.prototype._compileComponent = function(compMeta, parsedTemplate, styles, pipes, compilingComponentsPath, childPromises) {
      var _this = this;
      var compileResult = this._viewCompiler.compileComponent(compMeta, parsedTemplate, new ir.ExternalExpr(new compile_metadata_1.CompileIdentifierMetadata({runtime: styles})), pipes);
      compileResult.dependencies.forEach(function(dep) {
        var childCompilingComponentsPath = collection_1.ListWrapper.clone(compilingComponentsPath);
        var childCacheKey = dep.comp.type.runtime;
        var childViewDirectives = _this._metadataResolver.getViewDirectivesMetadata(dep.comp.type.runtime);
        var childViewPipes = _this._metadataResolver.getViewPipesMetadata(dep.comp.type.runtime);
        var childIsRecursive = collection_1.ListWrapper.contains(childCompilingComponentsPath, childCacheKey);
        childCompilingComponentsPath.push(childCacheKey);
        var childComp = _this._loadAndCompileComponent(dep.comp.type.runtime, dep.comp, childViewDirectives, childViewPipes, childCompilingComponentsPath);
        dep.factoryPlaceholder.runtime = childComp.proxyViewFactory;
        dep.factoryPlaceholder.name = "viewFactory_" + dep.comp.type.name;
        if (!childIsRecursive) {
          childPromises.push(_this._compiledTemplateDone.get(childCacheKey));
        }
      });
      var factory;
      if (lang_1.IS_DART || !this._genConfig.useJit) {
        factory = output_interpreter_1.interpretStatements(compileResult.statements, compileResult.viewFactoryVar, new interpretive_view_1.InterpretiveAppViewInstanceFactory());
      } else {
        factory = output_jit_1.jitStatements(compMeta.type.name + ".template.js", compileResult.statements, compileResult.viewFactoryVar);
      }
      return factory;
    };
    RuntimeCompiler.prototype._compileComponentStyles = function(compMeta) {
      var compileResult = this._styleCompiler.compileComponent(compMeta);
      return this._resolveStylesCompileResult(compMeta.type.name, compileResult);
    };
    RuntimeCompiler.prototype._resolveStylesCompileResult = function(sourceUrl, result) {
      var _this = this;
      var promises = result.dependencies.map(function(dep) {
        return _this._loadStylesheetDep(dep);
      });
      return async_1.PromiseWrapper.all(promises).then(function(cssTexts) {
        var nestedCompileResultPromises = [];
        for (var i = 0; i < result.dependencies.length; i++) {
          var dep = result.dependencies[i];
          var cssText = cssTexts[i];
          var nestedCompileResult = _this._styleCompiler.compileStylesheet(dep.moduleUrl, cssText, dep.isShimmed);
          nestedCompileResultPromises.push(_this._resolveStylesCompileResult(dep.moduleUrl, nestedCompileResult));
        }
        return async_1.PromiseWrapper.all(nestedCompileResultPromises);
      }).then(function(nestedStylesArr) {
        for (var i = 0; i < result.dependencies.length; i++) {
          var dep = result.dependencies[i];
          dep.valuePlaceholder.runtime = nestedStylesArr[i];
          dep.valuePlaceholder.name = "importedStyles" + i;
        }
        if (lang_1.IS_DART || !_this._genConfig.useJit) {
          return output_interpreter_1.interpretStatements(result.statements, result.stylesVar, new interpretive_view_1.InterpretiveAppViewInstanceFactory());
        } else {
          return output_jit_1.jitStatements(sourceUrl + ".css.js", result.statements, result.stylesVar);
        }
      });
    };
    RuntimeCompiler.prototype._loadStylesheetDep = function(dep) {
      var cacheKey = "" + dep.moduleUrl + (dep.isShimmed ? '.shim' : '');
      var cssTextPromise = this._styleCache.get(cacheKey);
      if (lang_1.isBlank(cssTextPromise)) {
        cssTextPromise = this._xhr.get(dep.moduleUrl);
        this._styleCache.set(cacheKey, cssTextPromise);
      }
      return cssTextPromise;
    };
    RuntimeCompiler.decorators = [{type: core_1.Injectable}];
    RuntimeCompiler.ctorParameters = [{type: metadata_resolver_1.CompileMetadataResolver}, {type: directive_normalizer_1.DirectiveNormalizer}, {type: template_parser_1.TemplateParser}, {type: style_compiler_1.StyleCompiler}, {type: view_compiler_1.ViewCompiler}, {type: xhr_1.XHR}, {type: config_1.CompilerConfig}];
    return RuntimeCompiler;
  }());
  exports.RuntimeCompiler = RuntimeCompiler;
  var CompiledTemplate = (function() {
    function CompiledTemplate() {
      var _this = this;
      this.viewFactory = null;
      this.proxyViewFactory = function(viewUtils, childInjector, contextEl) {
        return _this.viewFactory(viewUtils, childInjector, contextEl);
      };
    }
    CompiledTemplate.prototype.init = function(viewFactory) {
      this.viewFactory = viewFactory;
    };
    return CompiledTemplate;
  }());
  function assertComponent(meta) {
    if (!meta.isComponent) {
      throw new exceptions_1.BaseException("Could not compile '" + meta.type.name + "' because it is not a component.");
    }
  }
  return module.exports;
});

System.registerDynamic("@angular/compiler/src/facade/promise.js", [], true, function($__require, exports, module) {
  "use strict";
  ;
  var define,
      global = this,
      GLOBAL = this;
  var PromiseCompleter = (function() {
    function PromiseCompleter() {
      var _this = this;
      this.promise = new Promise(function(res, rej) {
        _this.resolve = res;
        _this.reject = rej;
      });
    }
    return PromiseCompleter;
  }());
  exports.PromiseCompleter = PromiseCompleter;
  var PromiseWrapper = (function() {
    function PromiseWrapper() {}
    PromiseWrapper.resolve = function(obj) {
      return Promise.resolve(obj);
    };
    PromiseWrapper.reject = function(obj, _) {
      return Promise.reject(obj);
    };
    PromiseWrapper.catchError = function(promise, onError) {
      return promise.catch(onError);
    };
    PromiseWrapper.all = function(promises) {
      if (promises.length == 0)
        return Promise.resolve([]);
      return Promise.all(promises);
    };
    PromiseWrapper.then = function(promise, success, rejection) {
      return promise.then(success, rejection);
    };
    PromiseWrapper.wrap = function(computation) {
      return new Promise(function(res, rej) {
        try {
          res(computation());
        } catch (e) {
          rej(e);
        }
      });
    };
    PromiseWrapper.scheduleMicrotask = function(computation) {
      PromiseWrapper.then(PromiseWrapper.resolve(null), computation, function(_) {});
    };
    PromiseWrapper.isPromise = function(obj) {
      return obj instanceof Promise;
    };
    PromiseWrapper.completer = function() {
      return new PromiseCompleter();
    };
    return PromiseWrapper;
  }());
  exports.PromiseWrapper = PromiseWrapper;
  return module.exports;
});

System.registerDynamic("@angular/compiler/src/facade/async.js", ["./lang", "./promise", "rxjs/Subject", "rxjs/observable/PromiseObservable", "rxjs/operator/toPromise", "rxjs/Observable"], true, function($__require, exports, module) {
  "use strict";
  ;
  var define,
      global = this,
      GLOBAL = this;
  var __extends = (this && this.__extends) || function(d, b) {
    for (var p in b)
      if (b.hasOwnProperty(p))
        d[p] = b[p];
    function __() {
      this.constructor = d;
    }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
  };
  var lang_1 = $__require('./lang');
  var promise_1 = $__require('./promise');
  exports.PromiseWrapper = promise_1.PromiseWrapper;
  exports.PromiseCompleter = promise_1.PromiseCompleter;
  var Subject_1 = $__require('rxjs/Subject');
  var PromiseObservable_1 = $__require('rxjs/observable/PromiseObservable');
  var toPromise_1 = $__require('rxjs/operator/toPromise');
  var Observable_1 = $__require('rxjs/Observable');
  exports.Observable = Observable_1.Observable;
  var Subject_2 = $__require('rxjs/Subject');
  exports.Subject = Subject_2.Subject;
  var TimerWrapper = (function() {
    function TimerWrapper() {}
    TimerWrapper.setTimeout = function(fn, millis) {
      return lang_1.global.setTimeout(fn, millis);
    };
    TimerWrapper.clearTimeout = function(id) {
      lang_1.global.clearTimeout(id);
    };
    TimerWrapper.setInterval = function(fn, millis) {
      return lang_1.global.setInterval(fn, millis);
    };
    TimerWrapper.clearInterval = function(id) {
      lang_1.global.clearInterval(id);
    };
    return TimerWrapper;
  }());
  exports.TimerWrapper = TimerWrapper;
  var ObservableWrapper = (function() {
    function ObservableWrapper() {}
    ObservableWrapper.subscribe = function(emitter, onNext, onError, onComplete) {
      if (onComplete === void 0) {
        onComplete = function() {};
      }
      onError = (typeof onError === "function") && onError || lang_1.noop;
      onComplete = (typeof onComplete === "function") && onComplete || lang_1.noop;
      return emitter.subscribe({
        next: onNext,
        error: onError,
        complete: onComplete
      });
    };
    ObservableWrapper.isObservable = function(obs) {
      return !!obs.subscribe;
    };
    ObservableWrapper.hasSubscribers = function(obs) {
      return obs.observers.length > 0;
    };
    ObservableWrapper.dispose = function(subscription) {
      subscription.unsubscribe();
    };
    ObservableWrapper.callNext = function(emitter, value) {
      emitter.next(value);
    };
    ObservableWrapper.callEmit = function(emitter, value) {
      emitter.emit(value);
    };
    ObservableWrapper.callError = function(emitter, error) {
      emitter.error(error);
    };
    ObservableWrapper.callComplete = function(emitter) {
      emitter.complete();
    };
    ObservableWrapper.fromPromise = function(promise) {
      return PromiseObservable_1.PromiseObservable.create(promise);
    };
    ObservableWrapper.toPromise = function(obj) {
      return toPromise_1.toPromise.call(obj);
    };
    return ObservableWrapper;
  }());
  exports.ObservableWrapper = ObservableWrapper;
  var EventEmitter = (function(_super) {
    __extends(EventEmitter, _super);
    function EventEmitter(isAsync) {
      if (isAsync === void 0) {
        isAsync = true;
      }
      _super.call(this);
      this._isAsync = isAsync;
    }
    EventEmitter.prototype.emit = function(value) {
      _super.prototype.next.call(this, value);
    };
    EventEmitter.prototype.next = function(value) {
      _super.prototype.next.call(this, value);
    };
    EventEmitter.prototype.subscribe = function(generatorOrNext, error, complete) {
      var schedulerFn;
      var errorFn = function(err) {
        return null;
      };
      var completeFn = function() {
        return null;
      };
      if (generatorOrNext && typeof generatorOrNext === 'object') {
        schedulerFn = this._isAsync ? function(value) {
          setTimeout(function() {
            return generatorOrNext.next(value);
          });
        } : function(value) {
          generatorOrNext.next(value);
        };
        if (generatorOrNext.error) {
          errorFn = this._isAsync ? function(err) {
            setTimeout(function() {
              return generatorOrNext.error(err);
            });
          } : function(err) {
            generatorOrNext.error(err);
          };
        }
        if (generatorOrNext.complete) {
          completeFn = this._isAsync ? function() {
            setTimeout(function() {
              return generatorOrNext.complete();
            });
          } : function() {
            generatorOrNext.complete();
          };
        }
      } else {
        schedulerFn = this._isAsync ? function(value) {
          setTimeout(function() {
            return generatorOrNext(value);
          });
        } : function(value) {
          generatorOrNext(value);
        };
        if (error) {
          errorFn = this._isAsync ? function(err) {
            setTimeout(function() {
              return error(err);
            });
          } : function(err) {
            error(err);
          };
        }
        if (complete) {
          completeFn = this._isAsync ? function() {
            setTimeout(function() {
              return complete();
            });
          } : function() {
            complete();
          };
        }
      }
      return _super.prototype.subscribe.call(this, schedulerFn, errorFn, completeFn);
    };
    return EventEmitter;
  }(Subject_1.Subject));
  exports.EventEmitter = EventEmitter;
  return module.exports;
});

System.registerDynamic("@angular/compiler/src/xhr.js", [], true, function($__require, exports, module) {
  "use strict";
  ;
  var define,
      global = this,
      GLOBAL = this;
  var XHR = (function() {
    function XHR() {}
    XHR.prototype.get = function(url) {
      return null;
    };
    return XHR;
  }());
  exports.XHR = XHR;
  return module.exports;
});

System.registerDynamic("@angular/compiler/src/html_ast.js", ["../src/facade/lang"], true, function($__require, exports, module) {
  "use strict";
  ;
  var define,
      global = this,
      GLOBAL = this;
  var lang_1 = $__require('../src/facade/lang');
  var HtmlTextAst = (function() {
    function HtmlTextAst(value, sourceSpan) {
      this.value = value;
      this.sourceSpan = sourceSpan;
    }
    HtmlTextAst.prototype.visit = function(visitor, context) {
      return visitor.visitText(this, context);
    };
    return HtmlTextAst;
  }());
  exports.HtmlTextAst = HtmlTextAst;
  var HtmlExpansionAst = (function() {
    function HtmlExpansionAst(switchValue, type, cases, sourceSpan, switchValueSourceSpan) {
      this.switchValue = switchValue;
      this.type = type;
      this.cases = cases;
      this.sourceSpan = sourceSpan;
      this.switchValueSourceSpan = switchValueSourceSpan;
    }
    HtmlExpansionAst.prototype.visit = function(visitor, context) {
      return visitor.visitExpansion(this, context);
    };
    return HtmlExpansionAst;
  }());
  exports.HtmlExpansionAst = HtmlExpansionAst;
  var HtmlExpansionCaseAst = (function() {
    function HtmlExpansionCaseAst(value, expression, sourceSpan, valueSourceSpan, expSourceSpan) {
      this.value = value;
      this.expression = expression;
      this.sourceSpan = sourceSpan;
      this.valueSourceSpan = valueSourceSpan;
      this.expSourceSpan = expSourceSpan;
    }
    HtmlExpansionCaseAst.prototype.visit = function(visitor, context) {
      return visitor.visitExpansionCase(this, context);
    };
    return HtmlExpansionCaseAst;
  }());
  exports.HtmlExpansionCaseAst = HtmlExpansionCaseAst;
  var HtmlAttrAst = (function() {
    function HtmlAttrAst(name, value, sourceSpan) {
      this.name = name;
      this.value = value;
      this.sourceSpan = sourceSpan;
    }
    HtmlAttrAst.prototype.visit = function(visitor, context) {
      return visitor.visitAttr(this, context);
    };
    return HtmlAttrAst;
  }());
  exports.HtmlAttrAst = HtmlAttrAst;
  var HtmlElementAst = (function() {
    function HtmlElementAst(name, attrs, children, sourceSpan, startSourceSpan, endSourceSpan) {
      this.name = name;
      this.attrs = attrs;
      this.children = children;
      this.sourceSpan = sourceSpan;
      this.startSourceSpan = startSourceSpan;
      this.endSourceSpan = endSourceSpan;
    }
    HtmlElementAst.prototype.visit = function(visitor, context) {
      return visitor.visitElement(this, context);
    };
    return HtmlElementAst;
  }());
  exports.HtmlElementAst = HtmlElementAst;
  var HtmlCommentAst = (function() {
    function HtmlCommentAst(value, sourceSpan) {
      this.value = value;
      this.sourceSpan = sourceSpan;
    }
    HtmlCommentAst.prototype.visit = function(visitor, context) {
      return visitor.visitComment(this, context);
    };
    return HtmlCommentAst;
  }());
  exports.HtmlCommentAst = HtmlCommentAst;
  function htmlVisitAll(visitor, asts, context) {
    if (context === void 0) {
      context = null;
    }
    var result = [];
    asts.forEach(function(ast) {
      var astResult = ast.visit(visitor, context);
      if (lang_1.isPresent(astResult)) {
        result.push(astResult);
      }
    });
    return result;
  }
  exports.htmlVisitAll = htmlVisitAll;
  return module.exports;
});

System.registerDynamic("@angular/compiler/src/html_lexer.js", ["../src/facade/lang", "../src/facade/collection", "./parse_util", "./html_tags"], true, function($__require, exports, module) {
  "use strict";
  ;
  var define,
      global = this,
      GLOBAL = this;
  var __extends = (this && this.__extends) || function(d, b) {
    for (var p in b)
      if (b.hasOwnProperty(p))
        d[p] = b[p];
    function __() {
      this.constructor = d;
    }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
  };
  var lang_1 = $__require('../src/facade/lang');
  var collection_1 = $__require('../src/facade/collection');
  var parse_util_1 = $__require('./parse_util');
  var html_tags_1 = $__require('./html_tags');
  (function(HtmlTokenType) {
    HtmlTokenType[HtmlTokenType["TAG_OPEN_START"] = 0] = "TAG_OPEN_START";
    HtmlTokenType[HtmlTokenType["TAG_OPEN_END"] = 1] = "TAG_OPEN_END";
    HtmlTokenType[HtmlTokenType["TAG_OPEN_END_VOID"] = 2] = "TAG_OPEN_END_VOID";
    HtmlTokenType[HtmlTokenType["TAG_CLOSE"] = 3] = "TAG_CLOSE";
    HtmlTokenType[HtmlTokenType["TEXT"] = 4] = "TEXT";
    HtmlTokenType[HtmlTokenType["ESCAPABLE_RAW_TEXT"] = 5] = "ESCAPABLE_RAW_TEXT";
    HtmlTokenType[HtmlTokenType["RAW_TEXT"] = 6] = "RAW_TEXT";
    HtmlTokenType[HtmlTokenType["COMMENT_START"] = 7] = "COMMENT_START";
    HtmlTokenType[HtmlTokenType["COMMENT_END"] = 8] = "COMMENT_END";
    HtmlTokenType[HtmlTokenType["CDATA_START"] = 9] = "CDATA_START";
    HtmlTokenType[HtmlTokenType["CDATA_END"] = 10] = "CDATA_END";
    HtmlTokenType[HtmlTokenType["ATTR_NAME"] = 11] = "ATTR_NAME";
    HtmlTokenType[HtmlTokenType["ATTR_VALUE"] = 12] = "ATTR_VALUE";
    HtmlTokenType[HtmlTokenType["DOC_TYPE"] = 13] = "DOC_TYPE";
    HtmlTokenType[HtmlTokenType["EXPANSION_FORM_START"] = 14] = "EXPANSION_FORM_START";
    HtmlTokenType[HtmlTokenType["EXPANSION_CASE_VALUE"] = 15] = "EXPANSION_CASE_VALUE";
    HtmlTokenType[HtmlTokenType["EXPANSION_CASE_EXP_START"] = 16] = "EXPANSION_CASE_EXP_START";
    HtmlTokenType[HtmlTokenType["EXPANSION_CASE_EXP_END"] = 17] = "EXPANSION_CASE_EXP_END";
    HtmlTokenType[HtmlTokenType["EXPANSION_FORM_END"] = 18] = "EXPANSION_FORM_END";
    HtmlTokenType[HtmlTokenType["EOF"] = 19] = "EOF";
  })(exports.HtmlTokenType || (exports.HtmlTokenType = {}));
  var HtmlTokenType = exports.HtmlTokenType;
  var HtmlToken = (function() {
    function HtmlToken(type, parts, sourceSpan) {
      this.type = type;
      this.parts = parts;
      this.sourceSpan = sourceSpan;
    }
    return HtmlToken;
  }());
  exports.HtmlToken = HtmlToken;
  var HtmlTokenError = (function(_super) {
    __extends(HtmlTokenError, _super);
    function HtmlTokenError(errorMsg, tokenType, span) {
      _super.call(this, span, errorMsg);
      this.tokenType = tokenType;
    }
    return HtmlTokenError;
  }(parse_util_1.ParseError));
  exports.HtmlTokenError = HtmlTokenError;
  var HtmlTokenizeResult = (function() {
    function HtmlTokenizeResult(tokens, errors) {
      this.tokens = tokens;
      this.errors = errors;
    }
    return HtmlTokenizeResult;
  }());
  exports.HtmlTokenizeResult = HtmlTokenizeResult;
  function tokenizeHtml(sourceContent, sourceUrl, tokenizeExpansionForms) {
    if (tokenizeExpansionForms === void 0) {
      tokenizeExpansionForms = false;
    }
    return new _HtmlTokenizer(new parse_util_1.ParseSourceFile(sourceContent, sourceUrl), tokenizeExpansionForms).tokenize();
  }
  exports.tokenizeHtml = tokenizeHtml;
  var $EOF = 0;
  var $TAB = 9;
  var $LF = 10;
  var $FF = 12;
  var $CR = 13;
  var $SPACE = 32;
  var $BANG = 33;
  var $DQ = 34;
  var $HASH = 35;
  var $$ = 36;
  var $AMPERSAND = 38;
  var $SQ = 39;
  var $MINUS = 45;
  var $SLASH = 47;
  var $0 = 48;
  var $SEMICOLON = 59;
  var $9 = 57;
  var $COLON = 58;
  var $LT = 60;
  var $EQ = 61;
  var $GT = 62;
  var $QUESTION = 63;
  var $LBRACKET = 91;
  var $RBRACKET = 93;
  var $LBRACE = 123;
  var $RBRACE = 125;
  var $COMMA = 44;
  var $A = 65;
  var $F = 70;
  var $X = 88;
  var $Z = 90;
  var $a = 97;
  var $f = 102;
  var $z = 122;
  var $x = 120;
  var $NBSP = 160;
  var CR_OR_CRLF_REGEXP = /\r\n?/g;
  function unexpectedCharacterErrorMsg(charCode) {
    var char = charCode === $EOF ? 'EOF' : lang_1.StringWrapper.fromCharCode(charCode);
    return "Unexpected character \"" + char + "\"";
  }
  function unknownEntityErrorMsg(entitySrc) {
    return "Unknown entity \"" + entitySrc + "\" - use the \"&#<decimal>;\" or  \"&#x<hex>;\" syntax";
  }
  var ControlFlowError = (function() {
    function ControlFlowError(error) {
      this.error = error;
    }
    return ControlFlowError;
  }());
  var _HtmlTokenizer = (function() {
    function _HtmlTokenizer(file, tokenizeExpansionForms) {
      this.file = file;
      this.tokenizeExpansionForms = tokenizeExpansionForms;
      this.peek = -1;
      this.nextPeek = -1;
      this.index = -1;
      this.line = 0;
      this.column = -1;
      this.expansionCaseStack = [];
      this.tokens = [];
      this.errors = [];
      this.input = file.content;
      this.length = file.content.length;
      this._advance();
    }
    _HtmlTokenizer.prototype._processCarriageReturns = function(content) {
      return lang_1.StringWrapper.replaceAll(content, CR_OR_CRLF_REGEXP, '\n');
    };
    _HtmlTokenizer.prototype.tokenize = function() {
      while (this.peek !== $EOF) {
        var start = this._getLocation();
        try {
          if (this._attemptCharCode($LT)) {
            if (this._attemptCharCode($BANG)) {
              if (this._attemptCharCode($LBRACKET)) {
                this._consumeCdata(start);
              } else if (this._attemptCharCode($MINUS)) {
                this._consumeComment(start);
              } else {
                this._consumeDocType(start);
              }
            } else if (this._attemptCharCode($SLASH)) {
              this._consumeTagClose(start);
            } else {
              this._consumeTagOpen(start);
            }
          } else if (isSpecialFormStart(this.peek, this.nextPeek) && this.tokenizeExpansionForms) {
            this._consumeExpansionFormStart();
          } else if (this.peek === $EQ && this.tokenizeExpansionForms) {
            this._consumeExpansionCaseStart();
          } else if (this.peek === $RBRACE && this.isInExpansionCase() && this.tokenizeExpansionForms) {
            this._consumeExpansionCaseEnd();
          } else if (this.peek === $RBRACE && this.isInExpansionForm() && this.tokenizeExpansionForms) {
            this._consumeExpansionFormEnd();
          } else {
            this._consumeText();
          }
        } catch (e) {
          if (e instanceof ControlFlowError) {
            this.errors.push(e.error);
          } else {
            throw e;
          }
        }
      }
      this._beginToken(HtmlTokenType.EOF);
      this._endToken([]);
      return new HtmlTokenizeResult(mergeTextTokens(this.tokens), this.errors);
    };
    _HtmlTokenizer.prototype._getLocation = function() {
      return new parse_util_1.ParseLocation(this.file, this.index, this.line, this.column);
    };
    _HtmlTokenizer.prototype._getSpan = function(start, end) {
      if (lang_1.isBlank(start)) {
        start = this._getLocation();
      }
      if (lang_1.isBlank(end)) {
        end = this._getLocation();
      }
      return new parse_util_1.ParseSourceSpan(start, end);
    };
    _HtmlTokenizer.prototype._beginToken = function(type, start) {
      if (start === void 0) {
        start = null;
      }
      if (lang_1.isBlank(start)) {
        start = this._getLocation();
      }
      this.currentTokenStart = start;
      this.currentTokenType = type;
    };
    _HtmlTokenizer.prototype._endToken = function(parts, end) {
      if (end === void 0) {
        end = null;
      }
      if (lang_1.isBlank(end)) {
        end = this._getLocation();
      }
      var token = new HtmlToken(this.currentTokenType, parts, new parse_util_1.ParseSourceSpan(this.currentTokenStart, end));
      this.tokens.push(token);
      this.currentTokenStart = null;
      this.currentTokenType = null;
      return token;
    };
    _HtmlTokenizer.prototype._createError = function(msg, span) {
      var error = new HtmlTokenError(msg, this.currentTokenType, span);
      this.currentTokenStart = null;
      this.currentTokenType = null;
      return new ControlFlowError(error);
    };
    _HtmlTokenizer.prototype._advance = function() {
      if (this.index >= this.length) {
        throw this._createError(unexpectedCharacterErrorMsg($EOF), this._getSpan());
      }
      if (this.peek === $LF) {
        this.line++;
        this.column = 0;
      } else if (this.peek !== $LF && this.peek !== $CR) {
        this.column++;
      }
      this.index++;
      this.peek = this.index >= this.length ? $EOF : lang_1.StringWrapper.charCodeAt(this.input, this.index);
      this.nextPeek = this.index + 1 >= this.length ? $EOF : lang_1.StringWrapper.charCodeAt(this.input, this.index + 1);
    };
    _HtmlTokenizer.prototype._attemptCharCode = function(charCode) {
      if (this.peek === charCode) {
        this._advance();
        return true;
      }
      return false;
    };
    _HtmlTokenizer.prototype._attemptCharCodeCaseInsensitive = function(charCode) {
      if (compareCharCodeCaseInsensitive(this.peek, charCode)) {
        this._advance();
        return true;
      }
      return false;
    };
    _HtmlTokenizer.prototype._requireCharCode = function(charCode) {
      var location = this._getLocation();
      if (!this._attemptCharCode(charCode)) {
        throw this._createError(unexpectedCharacterErrorMsg(this.peek), this._getSpan(location, location));
      }
    };
    _HtmlTokenizer.prototype._attemptStr = function(chars) {
      for (var i = 0; i < chars.length; i++) {
        if (!this._attemptCharCode(lang_1.StringWrapper.charCodeAt(chars, i))) {
          return false;
        }
      }
      return true;
    };
    _HtmlTokenizer.prototype._attemptStrCaseInsensitive = function(chars) {
      for (var i = 0; i < chars.length; i++) {
        if (!this._attemptCharCodeCaseInsensitive(lang_1.StringWrapper.charCodeAt(chars, i))) {
          return false;
        }
      }
      return true;
    };
    _HtmlTokenizer.prototype._requireStr = function(chars) {
      var location = this._getLocation();
      if (!this._attemptStr(chars)) {
        throw this._createError(unexpectedCharacterErrorMsg(this.peek), this._getSpan(location));
      }
    };
    _HtmlTokenizer.prototype._attemptCharCodeUntilFn = function(predicate) {
      while (!predicate(this.peek)) {
        this._advance();
      }
    };
    _HtmlTokenizer.prototype._requireCharCodeUntilFn = function(predicate, len) {
      var start = this._getLocation();
      this._attemptCharCodeUntilFn(predicate);
      if (this.index - start.offset < len) {
        throw this._createError(unexpectedCharacterErrorMsg(this.peek), this._getSpan(start, start));
      }
    };
    _HtmlTokenizer.prototype._attemptUntilChar = function(char) {
      while (this.peek !== char) {
        this._advance();
      }
    };
    _HtmlTokenizer.prototype._readChar = function(decodeEntities) {
      if (decodeEntities && this.peek === $AMPERSAND) {
        return this._decodeEntity();
      } else {
        var index = this.index;
        this._advance();
        return this.input[index];
      }
    };
    _HtmlTokenizer.prototype._decodeEntity = function() {
      var start = this._getLocation();
      this._advance();
      if (this._attemptCharCode($HASH)) {
        var isHex = this._attemptCharCode($x) || this._attemptCharCode($X);
        var numberStart = this._getLocation().offset;
        this._attemptCharCodeUntilFn(isDigitEntityEnd);
        if (this.peek != $SEMICOLON) {
          throw this._createError(unexpectedCharacterErrorMsg(this.peek), this._getSpan());
        }
        this._advance();
        var strNum = this.input.substring(numberStart, this.index - 1);
        try {
          var charCode = lang_1.NumberWrapper.parseInt(strNum, isHex ? 16 : 10);
          return lang_1.StringWrapper.fromCharCode(charCode);
        } catch (e) {
          var entity = this.input.substring(start.offset + 1, this.index - 1);
          throw this._createError(unknownEntityErrorMsg(entity), this._getSpan(start));
        }
      } else {
        var startPosition = this._savePosition();
        this._attemptCharCodeUntilFn(isNamedEntityEnd);
        if (this.peek != $SEMICOLON) {
          this._restorePosition(startPosition);
          return '&';
        }
        this._advance();
        var name_1 = this.input.substring(start.offset + 1, this.index - 1);
        var char = html_tags_1.NAMED_ENTITIES[name_1];
        if (lang_1.isBlank(char)) {
          throw this._createError(unknownEntityErrorMsg(name_1), this._getSpan(start));
        }
        return char;
      }
    };
    _HtmlTokenizer.prototype._consumeRawText = function(decodeEntities, firstCharOfEnd, attemptEndRest) {
      var tagCloseStart;
      var textStart = this._getLocation();
      this._beginToken(decodeEntities ? HtmlTokenType.ESCAPABLE_RAW_TEXT : HtmlTokenType.RAW_TEXT, textStart);
      var parts = [];
      while (true) {
        tagCloseStart = this._getLocation();
        if (this._attemptCharCode(firstCharOfEnd) && attemptEndRest()) {
          break;
        }
        if (this.index > tagCloseStart.offset) {
          parts.push(this.input.substring(tagCloseStart.offset, this.index));
        }
        while (this.peek !== firstCharOfEnd) {
          parts.push(this._readChar(decodeEntities));
        }
      }
      return this._endToken([this._processCarriageReturns(parts.join(''))], tagCloseStart);
    };
    _HtmlTokenizer.prototype._consumeComment = function(start) {
      var _this = this;
      this._beginToken(HtmlTokenType.COMMENT_START, start);
      this._requireCharCode($MINUS);
      this._endToken([]);
      var textToken = this._consumeRawText(false, $MINUS, function() {
        return _this._attemptStr('->');
      });
      this._beginToken(HtmlTokenType.COMMENT_END, textToken.sourceSpan.end);
      this._endToken([]);
    };
    _HtmlTokenizer.prototype._consumeCdata = function(start) {
      var _this = this;
      this._beginToken(HtmlTokenType.CDATA_START, start);
      this._requireStr('CDATA[');
      this._endToken([]);
      var textToken = this._consumeRawText(false, $RBRACKET, function() {
        return _this._attemptStr(']>');
      });
      this._beginToken(HtmlTokenType.CDATA_END, textToken.sourceSpan.end);
      this._endToken([]);
    };
    _HtmlTokenizer.prototype._consumeDocType = function(start) {
      this._beginToken(HtmlTokenType.DOC_TYPE, start);
      this._attemptUntilChar($GT);
      this._advance();
      this._endToken([this.input.substring(start.offset + 2, this.index - 1)]);
    };
    _HtmlTokenizer.prototype._consumePrefixAndName = function() {
      var nameOrPrefixStart = this.index;
      var prefix = null;
      while (this.peek !== $COLON && !isPrefixEnd(this.peek)) {
        this._advance();
      }
      var nameStart;
      if (this.peek === $COLON) {
        this._advance();
        prefix = this.input.substring(nameOrPrefixStart, this.index - 1);
        nameStart = this.index;
      } else {
        nameStart = nameOrPrefixStart;
      }
      this._requireCharCodeUntilFn(isNameEnd, this.index === nameStart ? 1 : 0);
      var name = this.input.substring(nameStart, this.index);
      return [prefix, name];
    };
    _HtmlTokenizer.prototype._consumeTagOpen = function(start) {
      var savedPos = this._savePosition();
      var lowercaseTagName;
      try {
        if (!isAsciiLetter(this.peek)) {
          throw this._createError(unexpectedCharacterErrorMsg(this.peek), this._getSpan());
        }
        var nameStart = this.index;
        this._consumeTagOpenStart(start);
        lowercaseTagName = this.input.substring(nameStart, this.index).toLowerCase();
        this._attemptCharCodeUntilFn(isNotWhitespace);
        while (this.peek !== $SLASH && this.peek !== $GT) {
          this._consumeAttributeName();
          this._attemptCharCodeUntilFn(isNotWhitespace);
          if (this._attemptCharCode($EQ)) {
            this._attemptCharCodeUntilFn(isNotWhitespace);
            this._consumeAttributeValue();
          }
          this._attemptCharCodeUntilFn(isNotWhitespace);
        }
        this._consumeTagOpenEnd();
      } catch (e) {
        if (e instanceof ControlFlowError) {
          this._restorePosition(savedPos);
          this._beginToken(HtmlTokenType.TEXT, start);
          this._endToken(['<']);
          return;
        }
        throw e;
      }
      var contentTokenType = html_tags_1.getHtmlTagDefinition(lowercaseTagName).contentType;
      if (contentTokenType === html_tags_1.HtmlTagContentType.RAW_TEXT) {
        this._consumeRawTextWithTagClose(lowercaseTagName, false);
      } else if (contentTokenType === html_tags_1.HtmlTagContentType.ESCAPABLE_RAW_TEXT) {
        this._consumeRawTextWithTagClose(lowercaseTagName, true);
      }
    };
    _HtmlTokenizer.prototype._consumeRawTextWithTagClose = function(lowercaseTagName, decodeEntities) {
      var _this = this;
      var textToken = this._consumeRawText(decodeEntities, $LT, function() {
        if (!_this._attemptCharCode($SLASH))
          return false;
        _this._attemptCharCodeUntilFn(isNotWhitespace);
        if (!_this._attemptStrCaseInsensitive(lowercaseTagName))
          return false;
        _this._attemptCharCodeUntilFn(isNotWhitespace);
        if (!_this._attemptCharCode($GT))
          return false;
        return true;
      });
      this._beginToken(HtmlTokenType.TAG_CLOSE, textToken.sourceSpan.end);
      this._endToken([null, lowercaseTagName]);
    };
    _HtmlTokenizer.prototype._consumeTagOpenStart = function(start) {
      this._beginToken(HtmlTokenType.TAG_OPEN_START, start);
      var parts = this._consumePrefixAndName();
      this._endToken(parts);
    };
    _HtmlTokenizer.prototype._consumeAttributeName = function() {
      this._beginToken(HtmlTokenType.ATTR_NAME);
      var prefixAndName = this._consumePrefixAndName();
      this._endToken(prefixAndName);
    };
    _HtmlTokenizer.prototype._consumeAttributeValue = function() {
      this._beginToken(HtmlTokenType.ATTR_VALUE);
      var value;
      if (this.peek === $SQ || this.peek === $DQ) {
        var quoteChar = this.peek;
        this._advance();
        var parts = [];
        while (this.peek !== quoteChar) {
          parts.push(this._readChar(true));
        }
        value = parts.join('');
        this._advance();
      } else {
        var valueStart = this.index;
        this._requireCharCodeUntilFn(isNameEnd, 1);
        value = this.input.substring(valueStart, this.index);
      }
      this._endToken([this._processCarriageReturns(value)]);
    };
    _HtmlTokenizer.prototype._consumeTagOpenEnd = function() {
      var tokenType = this._attemptCharCode($SLASH) ? HtmlTokenType.TAG_OPEN_END_VOID : HtmlTokenType.TAG_OPEN_END;
      this._beginToken(tokenType);
      this._requireCharCode($GT);
      this._endToken([]);
    };
    _HtmlTokenizer.prototype._consumeTagClose = function(start) {
      this._beginToken(HtmlTokenType.TAG_CLOSE, start);
      this._attemptCharCodeUntilFn(isNotWhitespace);
      var prefixAndName;
      prefixAndName = this._consumePrefixAndName();
      this._attemptCharCodeUntilFn(isNotWhitespace);
      this._requireCharCode($GT);
      this._endToken(prefixAndName);
    };
    _HtmlTokenizer.prototype._consumeExpansionFormStart = function() {
      this._beginToken(HtmlTokenType.EXPANSION_FORM_START, this._getLocation());
      this._requireCharCode($LBRACE);
      this._endToken([]);
      this._beginToken(HtmlTokenType.RAW_TEXT, this._getLocation());
      var condition = this._readUntil($COMMA);
      this._endToken([condition], this._getLocation());
      this._requireCharCode($COMMA);
      this._attemptCharCodeUntilFn(isNotWhitespace);
      this._beginToken(HtmlTokenType.RAW_TEXT, this._getLocation());
      var type = this._readUntil($COMMA);
      this._endToken([type], this._getLocation());
      this._requireCharCode($COMMA);
      this._attemptCharCodeUntilFn(isNotWhitespace);
      this.expansionCaseStack.push(HtmlTokenType.EXPANSION_FORM_START);
    };
    _HtmlTokenizer.prototype._consumeExpansionCaseStart = function() {
      this._requireCharCode($EQ);
      this._beginToken(HtmlTokenType.EXPANSION_CASE_VALUE, this._getLocation());
      var value = this._readUntil($LBRACE).trim();
      this._endToken([value], this._getLocation());
      this._attemptCharCodeUntilFn(isNotWhitespace);
      this._beginToken(HtmlTokenType.EXPANSION_CASE_EXP_START, this._getLocation());
      this._requireCharCode($LBRACE);
      this._endToken([], this._getLocation());
      this._attemptCharCodeUntilFn(isNotWhitespace);
      this.expansionCaseStack.push(HtmlTokenType.EXPANSION_CASE_EXP_START);
    };
    _HtmlTokenizer.prototype._consumeExpansionCaseEnd = function() {
      this._beginToken(HtmlTokenType.EXPANSION_CASE_EXP_END, this._getLocation());
      this._requireCharCode($RBRACE);
      this._endToken([], this._getLocation());
      this._attemptCharCodeUntilFn(isNotWhitespace);
      this.expansionCaseStack.pop();
    };
    _HtmlTokenizer.prototype._consumeExpansionFormEnd = function() {
      this._beginToken(HtmlTokenType.EXPANSION_FORM_END, this._getLocation());
      this._requireCharCode($RBRACE);
      this._endToken([]);
      this.expansionCaseStack.pop();
    };
    _HtmlTokenizer.prototype._consumeText = function() {
      var start = this._getLocation();
      this._beginToken(HtmlTokenType.TEXT, start);
      var parts = [];
      var interpolation = false;
      if (this.peek === $LBRACE && this.nextPeek === $LBRACE) {
        parts.push(this._readChar(true));
        parts.push(this._readChar(true));
        interpolation = true;
      } else {
        parts.push(this._readChar(true));
      }
      while (!this.isTextEnd(interpolation)) {
        if (this.peek === $LBRACE && this.nextPeek === $LBRACE) {
          parts.push(this._readChar(true));
          parts.push(this._readChar(true));
          interpolation = true;
        } else if (this.peek === $RBRACE && this.nextPeek === $RBRACE && interpolation) {
          parts.push(this._readChar(true));
          parts.push(this._readChar(true));
          interpolation = false;
        } else {
          parts.push(this._readChar(true));
        }
      }
      this._endToken([this._processCarriageReturns(parts.join(''))]);
    };
    _HtmlTokenizer.prototype.isTextEnd = function(interpolation) {
      if (this.peek === $LT || this.peek === $EOF)
        return true;
      if (this.tokenizeExpansionForms) {
        if (isSpecialFormStart(this.peek, this.nextPeek))
          return true;
        if (this.peek === $RBRACE && !interpolation && (this.isInExpansionCase() || this.isInExpansionForm()))
          return true;
      }
      return false;
    };
    _HtmlTokenizer.prototype._savePosition = function() {
      return [this.peek, this.index, this.column, this.line, this.tokens.length];
    };
    _HtmlTokenizer.prototype._readUntil = function(char) {
      var start = this.index;
      this._attemptUntilChar(char);
      return this.input.substring(start, this.index);
    };
    _HtmlTokenizer.prototype._restorePosition = function(position) {
      this.peek = position[0];
      this.index = position[1];
      this.column = position[2];
      this.line = position[3];
      var nbTokens = position[4];
      if (nbTokens < this.tokens.length) {
        this.tokens = collection_1.ListWrapper.slice(this.tokens, 0, nbTokens);
      }
    };
    _HtmlTokenizer.prototype.isInExpansionCase = function() {
      return this.expansionCaseStack.length > 0 && this.expansionCaseStack[this.expansionCaseStack.length - 1] === HtmlTokenType.EXPANSION_CASE_EXP_START;
    };
    _HtmlTokenizer.prototype.isInExpansionForm = function() {
      return this.expansionCaseStack.length > 0 && this.expansionCaseStack[this.expansionCaseStack.length - 1] === HtmlTokenType.EXPANSION_FORM_START;
    };
    return _HtmlTokenizer;
  }());
  function isNotWhitespace(code) {
    return !isWhitespace(code) || code === $EOF;
  }
  function isWhitespace(code) {
    return (code >= $TAB && code <= $SPACE) || (code === $NBSP);
  }
  function isNameEnd(code) {
    return isWhitespace(code) || code === $GT || code === $SLASH || code === $SQ || code === $DQ || code === $EQ;
  }
  function isPrefixEnd(code) {
    return (code < $a || $z < code) && (code < $A || $Z < code) && (code < $0 || code > $9);
  }
  function isDigitEntityEnd(code) {
    return code == $SEMICOLON || code == $EOF || !isAsciiHexDigit(code);
  }
  function isNamedEntityEnd(code) {
    return code == $SEMICOLON || code == $EOF || !isAsciiLetter(code);
  }
  function isSpecialFormStart(peek, nextPeek) {
    return peek === $LBRACE && nextPeek != $LBRACE;
  }
  function isAsciiLetter(code) {
    return code >= $a && code <= $z || code >= $A && code <= $Z;
  }
  function isAsciiHexDigit(code) {
    return code >= $a && code <= $f || code >= $A && code <= $F || code >= $0 && code <= $9;
  }
  function compareCharCodeCaseInsensitive(code1, code2) {
    return toUpperCaseCharCode(code1) == toUpperCaseCharCode(code2);
  }
  function toUpperCaseCharCode(code) {
    return code >= $a && code <= $z ? code - $a + $A : code;
  }
  function mergeTextTokens(srcTokens) {
    var dstTokens = [];
    var lastDstToken;
    for (var i = 0; i < srcTokens.length; i++) {
      var token = srcTokens[i];
      if (lang_1.isPresent(lastDstToken) && lastDstToken.type == HtmlTokenType.TEXT && token.type == HtmlTokenType.TEXT) {
        lastDstToken.parts[0] += token.parts[0];
        lastDstToken.sourceSpan.end = token.sourceSpan.end;
      } else {
        lastDstToken = token;
        dstTokens.push(lastDstToken);
      }
    }
    return dstTokens;
  }
  return module.exports;
});

System.registerDynamic("@angular/compiler/src/parse_util.js", [], true, function($__require, exports, module) {
  "use strict";
  ;
  var define,
      global = this,
      GLOBAL = this;
  var ParseLocation = (function() {
    function ParseLocation(file, offset, line, col) {
      this.file = file;
      this.offset = offset;
      this.line = line;
      this.col = col;
    }
    ParseLocation.prototype.toString = function() {
      return this.file.url + "@" + this.line + ":" + this.col;
    };
    return ParseLocation;
  }());
  exports.ParseLocation = ParseLocation;
  var ParseSourceFile = (function() {
    function ParseSourceFile(content, url) {
      this.content = content;
      this.url = url;
    }
    return ParseSourceFile;
  }());
  exports.ParseSourceFile = ParseSourceFile;
  var ParseSourceSpan = (function() {
    function ParseSourceSpan(start, end) {
      this.start = start;
      this.end = end;
    }
    ParseSourceSpan.prototype.toString = function() {
      return this.start.file.content.substring(this.start.offset, this.end.offset);
    };
    return ParseSourceSpan;
  }());
  exports.ParseSourceSpan = ParseSourceSpan;
  (function(ParseErrorLevel) {
    ParseErrorLevel[ParseErrorLevel["WARNING"] = 0] = "WARNING";
    ParseErrorLevel[ParseErrorLevel["FATAL"] = 1] = "FATAL";
  })(exports.ParseErrorLevel || (exports.ParseErrorLevel = {}));
  var ParseErrorLevel = exports.ParseErrorLevel;
  var ParseError = (function() {
    function ParseError(span, msg, level) {
      if (level === void 0) {
        level = ParseErrorLevel.FATAL;
      }
      this.span = span;
      this.msg = msg;
      this.level = level;
    }
    ParseError.prototype.toString = function() {
      var source = this.span.start.file.content;
      var ctxStart = this.span.start.offset;
      if (ctxStart > source.length - 1) {
        ctxStart = source.length - 1;
      }
      var ctxEnd = ctxStart;
      var ctxLen = 0;
      var ctxLines = 0;
      while (ctxLen < 100 && ctxStart > 0) {
        ctxStart--;
        ctxLen++;
        if (source[ctxStart] == "\n") {
          if (++ctxLines == 3) {
            break;
          }
        }
      }
      ctxLen = 0;
      ctxLines = 0;
      while (ctxLen < 100 && ctxEnd < source.length - 1) {
        ctxEnd++;
        ctxLen++;
        if (source[ctxEnd] == "\n") {
          if (++ctxLines == 3) {
            break;
          }
        }
      }
      var context = source.substring(ctxStart, this.span.start.offset) + '[ERROR ->]' + source.substring(this.span.start.offset, ctxEnd + 1);
      return this.msg + " (\"" + context + "\"): " + this.span.start;
    };
    return ParseError;
  }());
  exports.ParseError = ParseError;
  return module.exports;
});

System.registerDynamic("@angular/compiler/src/html_parser.js", ["@angular/core", "../src/facade/lang", "../src/facade/collection", "./html_ast", "./html_lexer", "./parse_util", "./html_tags"], true, function($__require, exports, module) {
  "use strict";
  ;
  var define,
      global = this,
      GLOBAL = this;
  var __extends = (this && this.__extends) || function(d, b) {
    for (var p in b)
      if (b.hasOwnProperty(p))
        d[p] = b[p];
    function __() {
      this.constructor = d;
    }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
  };
  var core_1 = $__require('@angular/core');
  var lang_1 = $__require('../src/facade/lang');
  var collection_1 = $__require('../src/facade/collection');
  var html_ast_1 = $__require('./html_ast');
  var html_lexer_1 = $__require('./html_lexer');
  var parse_util_1 = $__require('./parse_util');
  var html_tags_1 = $__require('./html_tags');
  var HtmlTreeError = (function(_super) {
    __extends(HtmlTreeError, _super);
    function HtmlTreeError(elementName, span, msg) {
      _super.call(this, span, msg);
      this.elementName = elementName;
    }
    HtmlTreeError.create = function(elementName, span, msg) {
      return new HtmlTreeError(elementName, span, msg);
    };
    return HtmlTreeError;
  }(parse_util_1.ParseError));
  exports.HtmlTreeError = HtmlTreeError;
  var HtmlParseTreeResult = (function() {
    function HtmlParseTreeResult(rootNodes, errors) {
      this.rootNodes = rootNodes;
      this.errors = errors;
    }
    return HtmlParseTreeResult;
  }());
  exports.HtmlParseTreeResult = HtmlParseTreeResult;
  var HtmlParser = (function() {
    function HtmlParser() {}
    HtmlParser.prototype.parse = function(sourceContent, sourceUrl, parseExpansionForms) {
      if (parseExpansionForms === void 0) {
        parseExpansionForms = false;
      }
      var tokensAndErrors = html_lexer_1.tokenizeHtml(sourceContent, sourceUrl, parseExpansionForms);
      var treeAndErrors = new TreeBuilder(tokensAndErrors.tokens).build();
      return new HtmlParseTreeResult(treeAndErrors.rootNodes, tokensAndErrors.errors.concat(treeAndErrors.errors));
    };
    HtmlParser.decorators = [{type: core_1.Injectable}];
    return HtmlParser;
  }());
  exports.HtmlParser = HtmlParser;
  var TreeBuilder = (function() {
    function TreeBuilder(tokens) {
      this.tokens = tokens;
      this.index = -1;
      this.rootNodes = [];
      this.errors = [];
      this.elementStack = [];
      this._advance();
    }
    TreeBuilder.prototype.build = function() {
      while (this.peek.type !== html_lexer_1.HtmlTokenType.EOF) {
        if (this.peek.type === html_lexer_1.HtmlTokenType.TAG_OPEN_START) {
          this._consumeStartTag(this._advance());
        } else if (this.peek.type === html_lexer_1.HtmlTokenType.TAG_CLOSE) {
          this._consumeEndTag(this._advance());
        } else if (this.peek.type === html_lexer_1.HtmlTokenType.CDATA_START) {
          this._closeVoidElement();
          this._consumeCdata(this._advance());
        } else if (this.peek.type === html_lexer_1.HtmlTokenType.COMMENT_START) {
          this._closeVoidElement();
          this._consumeComment(this._advance());
        } else if (this.peek.type === html_lexer_1.HtmlTokenType.TEXT || this.peek.type === html_lexer_1.HtmlTokenType.RAW_TEXT || this.peek.type === html_lexer_1.HtmlTokenType.ESCAPABLE_RAW_TEXT) {
          this._closeVoidElement();
          this._consumeText(this._advance());
        } else if (this.peek.type === html_lexer_1.HtmlTokenType.EXPANSION_FORM_START) {
          this._consumeExpansion(this._advance());
        } else {
          this._advance();
        }
      }
      return new HtmlParseTreeResult(this.rootNodes, this.errors);
    };
    TreeBuilder.prototype._advance = function() {
      var prev = this.peek;
      if (this.index < this.tokens.length - 1) {
        this.index++;
      }
      this.peek = this.tokens[this.index];
      return prev;
    };
    TreeBuilder.prototype._advanceIf = function(type) {
      if (this.peek.type === type) {
        return this._advance();
      }
      return null;
    };
    TreeBuilder.prototype._consumeCdata = function(startToken) {
      this._consumeText(this._advance());
      this._advanceIf(html_lexer_1.HtmlTokenType.CDATA_END);
    };
    TreeBuilder.prototype._consumeComment = function(token) {
      var text = this._advanceIf(html_lexer_1.HtmlTokenType.RAW_TEXT);
      this._advanceIf(html_lexer_1.HtmlTokenType.COMMENT_END);
      var value = lang_1.isPresent(text) ? text.parts[0].trim() : null;
      this._addToParent(new html_ast_1.HtmlCommentAst(value, token.sourceSpan));
    };
    TreeBuilder.prototype._consumeExpansion = function(token) {
      var switchValue = this._advance();
      var type = this._advance();
      var cases = [];
      while (this.peek.type === html_lexer_1.HtmlTokenType.EXPANSION_CASE_VALUE) {
        var expCase = this._parseExpansionCase();
        if (lang_1.isBlank(expCase))
          return;
        cases.push(expCase);
      }
      if (this.peek.type !== html_lexer_1.HtmlTokenType.EXPANSION_FORM_END) {
        this.errors.push(HtmlTreeError.create(null, this.peek.sourceSpan, "Invalid expansion form. Missing '}'."));
        return;
      }
      this._advance();
      var mainSourceSpan = new parse_util_1.ParseSourceSpan(token.sourceSpan.start, this.peek.sourceSpan.end);
      this._addToParent(new html_ast_1.HtmlExpansionAst(switchValue.parts[0], type.parts[0], cases, mainSourceSpan, switchValue.sourceSpan));
    };
    TreeBuilder.prototype._parseExpansionCase = function() {
      var value = this._advance();
      if (this.peek.type !== html_lexer_1.HtmlTokenType.EXPANSION_CASE_EXP_START) {
        this.errors.push(HtmlTreeError.create(null, this.peek.sourceSpan, "Invalid expansion form. Missing '{'.,"));
        return null;
      }
      var start = this._advance();
      var exp = this._collectExpansionExpTokens(start);
      if (lang_1.isBlank(exp))
        return null;
      var end = this._advance();
      exp.push(new html_lexer_1.HtmlToken(html_lexer_1.HtmlTokenType.EOF, [], end.sourceSpan));
      var parsedExp = new TreeBuilder(exp).build();
      if (parsedExp.errors.length > 0) {
        this.errors = this.errors.concat(parsedExp.errors);
        return null;
      }
      var sourceSpan = new parse_util_1.ParseSourceSpan(value.sourceSpan.start, end.sourceSpan.end);
      var expSourceSpan = new parse_util_1.ParseSourceSpan(start.sourceSpan.start, end.sourceSpan.end);
      return new html_ast_1.HtmlExpansionCaseAst(value.parts[0], parsedExp.rootNodes, sourceSpan, value.sourceSpan, expSourceSpan);
    };
    TreeBuilder.prototype._collectExpansionExpTokens = function(start) {
      var exp = [];
      var expansionFormStack = [html_lexer_1.HtmlTokenType.EXPANSION_CASE_EXP_START];
      while (true) {
        if (this.peek.type === html_lexer_1.HtmlTokenType.EXPANSION_FORM_START || this.peek.type === html_lexer_1.HtmlTokenType.EXPANSION_CASE_EXP_START) {
          expansionFormStack.push(this.peek.type);
        }
        if (this.peek.type === html_lexer_1.HtmlTokenType.EXPANSION_CASE_EXP_END) {
          if (lastOnStack(expansionFormStack, html_lexer_1.HtmlTokenType.EXPANSION_CASE_EXP_START)) {
            expansionFormStack.pop();
            if (expansionFormStack.length == 0)
              return exp;
          } else {
            this.errors.push(HtmlTreeError.create(null, start.sourceSpan, "Invalid expansion form. Missing '}'."));
            return null;
          }
        }
        if (this.peek.type === html_lexer_1.HtmlTokenType.EXPANSION_FORM_END) {
          if (lastOnStack(expansionFormStack, html_lexer_1.HtmlTokenType.EXPANSION_FORM_START)) {
            expansionFormStack.pop();
          } else {
            this.errors.push(HtmlTreeError.create(null, start.sourceSpan, "Invalid expansion form. Missing '}'."));
            return null;
          }
        }
        if (this.peek.type === html_lexer_1.HtmlTokenType.EOF) {
          this.errors.push(HtmlTreeError.create(null, start.sourceSpan, "Invalid expansion form. Missing '}'."));
          return null;
        }
        exp.push(this._advance());
      }
    };
    TreeBuilder.prototype._consumeText = function(token) {
      var text = token.parts[0];
      if (text.length > 0 && text[0] == '\n') {
        var parent_1 = this._getParentElement();
        if (lang_1.isPresent(parent_1) && parent_1.children.length == 0 && html_tags_1.getHtmlTagDefinition(parent_1.name).ignoreFirstLf) {
          text = text.substring(1);
        }
      }
      if (text.length > 0) {
        this._addToParent(new html_ast_1.HtmlTextAst(text, token.sourceSpan));
      }
    };
    TreeBuilder.prototype._closeVoidElement = function() {
      if (this.elementStack.length > 0) {
        var el = collection_1.ListWrapper.last(this.elementStack);
        if (html_tags_1.getHtmlTagDefinition(el.name).isVoid) {
          this.elementStack.pop();
        }
      }
    };
    TreeBuilder.prototype._consumeStartTag = function(startTagToken) {
      var prefix = startTagToken.parts[0];
      var name = startTagToken.parts[1];
      var attrs = [];
      while (this.peek.type === html_lexer_1.HtmlTokenType.ATTR_NAME) {
        attrs.push(this._consumeAttr(this._advance()));
      }
      var fullName = getElementFullName(prefix, name, this._getParentElement());
      var selfClosing = false;
      if (this.peek.type === html_lexer_1.HtmlTokenType.TAG_OPEN_END_VOID) {
        this._advance();
        selfClosing = true;
        if (html_tags_1.getNsPrefix(fullName) == null && !html_tags_1.getHtmlTagDefinition(fullName).isVoid) {
          this.errors.push(HtmlTreeError.create(fullName, startTagToken.sourceSpan, "Only void and foreign elements can be self closed \"" + startTagToken.parts[1] + "\""));
        }
      } else if (this.peek.type === html_lexer_1.HtmlTokenType.TAG_OPEN_END) {
        this._advance();
        selfClosing = false;
      }
      var end = this.peek.sourceSpan.start;
      var span = new parse_util_1.ParseSourceSpan(startTagToken.sourceSpan.start, end);
      var el = new html_ast_1.HtmlElementAst(fullName, attrs, [], span, span, null);
      this._pushElement(el);
      if (selfClosing) {
        this._popElement(fullName);
        el.endSourceSpan = span;
      }
    };
    TreeBuilder.prototype._pushElement = function(el) {
      if (this.elementStack.length > 0) {
        var parentEl = collection_1.ListWrapper.last(this.elementStack);
        if (html_tags_1.getHtmlTagDefinition(parentEl.name).isClosedByChild(el.name)) {
          this.elementStack.pop();
        }
      }
      var tagDef = html_tags_1.getHtmlTagDefinition(el.name);
      var parentEl = this._getParentElement();
      if (tagDef.requireExtraParent(lang_1.isPresent(parentEl) ? parentEl.name : null)) {
        var newParent = new html_ast_1.HtmlElementAst(tagDef.parentToAdd, [], [el], el.sourceSpan, el.startSourceSpan, el.endSourceSpan);
        this._addToParent(newParent);
        this.elementStack.push(newParent);
        this.elementStack.push(el);
      } else {
        this._addToParent(el);
        this.elementStack.push(el);
      }
    };
    TreeBuilder.prototype._consumeEndTag = function(endTagToken) {
      var fullName = getElementFullName(endTagToken.parts[0], endTagToken.parts[1], this._getParentElement());
      this._getParentElement().endSourceSpan = endTagToken.sourceSpan;
      if (html_tags_1.getHtmlTagDefinition(fullName).isVoid) {
        this.errors.push(HtmlTreeError.create(fullName, endTagToken.sourceSpan, "Void elements do not have end tags \"" + endTagToken.parts[1] + "\""));
      } else if (!this._popElement(fullName)) {
        this.errors.push(HtmlTreeError.create(fullName, endTagToken.sourceSpan, "Unexpected closing tag \"" + endTagToken.parts[1] + "\""));
      }
    };
    TreeBuilder.prototype._popElement = function(fullName) {
      for (var stackIndex = this.elementStack.length - 1; stackIndex >= 0; stackIndex--) {
        var el = this.elementStack[stackIndex];
        if (el.name == fullName) {
          collection_1.ListWrapper.splice(this.elementStack, stackIndex, this.elementStack.length - stackIndex);
          return true;
        }
        if (!html_tags_1.getHtmlTagDefinition(el.name).closedByParent) {
          return false;
        }
      }
      return false;
    };
    TreeBuilder.prototype._consumeAttr = function(attrName) {
      var fullName = html_tags_1.mergeNsAndName(attrName.parts[0], attrName.parts[1]);
      var end = attrName.sourceSpan.end;
      var value = '';
      if (this.peek.type === html_lexer_1.HtmlTokenType.ATTR_VALUE) {
        var valueToken = this._advance();
        value = valueToken.parts[0];
        end = valueToken.sourceSpan.end;
      }
      return new html_ast_1.HtmlAttrAst(fullName, value, new parse_util_1.ParseSourceSpan(attrName.sourceSpan.start, end));
    };
    TreeBuilder.prototype._getParentElement = function() {
      return this.elementStack.length > 0 ? collection_1.ListWrapper.last(this.elementStack) : null;
    };
    TreeBuilder.prototype._addToParent = function(node) {
      var parent = this._getParentElement();
      if (lang_1.isPresent(parent)) {
        parent.children.push(node);
      } else {
        this.rootNodes.push(node);
      }
    };
    return TreeBuilder;
  }());
  function getElementFullName(prefix, localName, parentElement) {
    if (lang_1.isBlank(prefix)) {
      prefix = html_tags_1.getHtmlTagDefinition(localName).implicitNamespacePrefix;
      if (lang_1.isBlank(prefix) && lang_1.isPresent(parentElement)) {
        prefix = html_tags_1.getNsPrefix(parentElement.name);
      }
    }
    return html_tags_1.mergeNsAndName(prefix, localName);
  }
  function lastOnStack(stack, element) {
    return stack.length > 0 && stack[stack.length - 1] === element;
  }
  return module.exports;
});

System.registerDynamic("@angular/compiler/src/html_tags.js", ["../src/facade/lang"], true, function($__require, exports, module) {
  "use strict";
  ;
  var define,
      global = this,
      GLOBAL = this;
  var lang_1 = $__require('../src/facade/lang');
  exports.NAMED_ENTITIES = {
    'Aacute': '\u00C1',
    'aacute': '\u00E1',
    'Acirc': '\u00C2',
    'acirc': '\u00E2',
    'acute': '\u00B4',
    'AElig': '\u00C6',
    'aelig': '\u00E6',
    'Agrave': '\u00C0',
    'agrave': '\u00E0',
    'alefsym': '\u2135',
    'Alpha': '\u0391',
    'alpha': '\u03B1',
    'amp': '&',
    'and': '\u2227',
    'ang': '\u2220',
    'apos': '\u0027',
    'Aring': '\u00C5',
    'aring': '\u00E5',
    'asymp': '\u2248',
    'Atilde': '\u00C3',
    'atilde': '\u00E3',
    'Auml': '\u00C4',
    'auml': '\u00E4',
    'bdquo': '\u201E',
    'Beta': '\u0392',
    'beta': '\u03B2',
    'brvbar': '\u00A6',
    'bull': '\u2022',
    'cap': '\u2229',
    'Ccedil': '\u00C7',
    'ccedil': '\u00E7',
    'cedil': '\u00B8',
    'cent': '\u00A2',
    'Chi': '\u03A7',
    'chi': '\u03C7',
    'circ': '\u02C6',
    'clubs': '\u2663',
    'cong': '\u2245',
    'copy': '\u00A9',
    'crarr': '\u21B5',
    'cup': '\u222A',
    'curren': '\u00A4',
    'dagger': '\u2020',
    'Dagger': '\u2021',
    'darr': '\u2193',
    'dArr': '\u21D3',
    'deg': '\u00B0',
    'Delta': '\u0394',
    'delta': '\u03B4',
    'diams': '\u2666',
    'divide': '\u00F7',
    'Eacute': '\u00C9',
    'eacute': '\u00E9',
    'Ecirc': '\u00CA',
    'ecirc': '\u00EA',
    'Egrave': '\u00C8',
    'egrave': '\u00E8',
    'empty': '\u2205',
    'emsp': '\u2003',
    'ensp': '\u2002',
    'Epsilon': '\u0395',
    'epsilon': '\u03B5',
    'equiv': '\u2261',
    'Eta': '\u0397',
    'eta': '\u03B7',
    'ETH': '\u00D0',
    'eth': '\u00F0',
    'Euml': '\u00CB',
    'euml': '\u00EB',
    'euro': '\u20AC',
    'exist': '\u2203',
    'fnof': '\u0192',
    'forall': '\u2200',
    'frac12': '\u00BD',
    'frac14': '\u00BC',
    'frac34': '\u00BE',
    'frasl': '\u2044',
    'Gamma': '\u0393',
    'gamma': '\u03B3',
    'ge': '\u2265',
    'gt': '>',
    'harr': '\u2194',
    'hArr': '\u21D4',
    'hearts': '\u2665',
    'hellip': '\u2026',
    'Iacute': '\u00CD',
    'iacute': '\u00ED',
    'Icirc': '\u00CE',
    'icirc': '\u00EE',
    'iexcl': '\u00A1',
    'Igrave': '\u00CC',
    'igrave': '\u00EC',
    'image': '\u2111',
    'infin': '\u221E',
    'int': '\u222B',
    'Iota': '\u0399',
    'iota': '\u03B9',
    'iquest': '\u00BF',
    'isin': '\u2208',
    'Iuml': '\u00CF',
    'iuml': '\u00EF',
    'Kappa': '\u039A',
    'kappa': '\u03BA',
    'Lambda': '\u039B',
    'lambda': '\u03BB',
    'lang': '\u27E8',
    'laquo': '\u00AB',
    'larr': '\u2190',
    'lArr': '\u21D0',
    'lceil': '\u2308',
    'ldquo': '\u201C',
    'le': '\u2264',
    'lfloor': '\u230A',
    'lowast': '\u2217',
    'loz': '\u25CA',
    'lrm': '\u200E',
    'lsaquo': '\u2039',
    'lsquo': '\u2018',
    'lt': '<',
    'macr': '\u00AF',
    'mdash': '\u2014',
    'micro': '\u00B5',
    'middot': '\u00B7',
    'minus': '\u2212',
    'Mu': '\u039C',
    'mu': '\u03BC',
    'nabla': '\u2207',
    'nbsp': '\u00A0',
    'ndash': '\u2013',
    'ne': '\u2260',
    'ni': '\u220B',
    'not': '\u00AC',
    'notin': '\u2209',
    'nsub': '\u2284',
    'Ntilde': '\u00D1',
    'ntilde': '\u00F1',
    'Nu': '\u039D',
    'nu': '\u03BD',
    'Oacute': '\u00D3',
    'oacute': '\u00F3',
    'Ocirc': '\u00D4',
    'ocirc': '\u00F4',
    'OElig': '\u0152',
    'oelig': '\u0153',
    'Ograve': '\u00D2',
    'ograve': '\u00F2',
    'oline': '\u203E',
    'Omega': '\u03A9',
    'omega': '\u03C9',
    'Omicron': '\u039F',
    'omicron': '\u03BF',
    'oplus': '\u2295',
    'or': '\u2228',
    'ordf': '\u00AA',
    'ordm': '\u00BA',
    'Oslash': '\u00D8',
    'oslash': '\u00F8',
    'Otilde': '\u00D5',
    'otilde': '\u00F5',
    'otimes': '\u2297',
    'Ouml': '\u00D6',
    'ouml': '\u00F6',
    'para': '\u00B6',
    'permil': '\u2030',
    'perp': '\u22A5',
    'Phi': '\u03A6',
    'phi': '\u03C6',
    'Pi': '\u03A0',
    'pi': '\u03C0',
    'piv': '\u03D6',
    'plusmn': '\u00B1',
    'pound': '\u00A3',
    'prime': '\u2032',
    'Prime': '\u2033',
    'prod': '\u220F',
    'prop': '\u221D',
    'Psi': '\u03A8',
    'psi': '\u03C8',
    'quot': '\u0022',
    'radic': '\u221A',
    'rang': '\u27E9',
    'raquo': '\u00BB',
    'rarr': '\u2192',
    'rArr': '\u21D2',
    'rceil': '\u2309',
    'rdquo': '\u201D',
    'real': '\u211C',
    'reg': '\u00AE',
    'rfloor': '\u230B',
    'Rho': '\u03A1',
    'rho': '\u03C1',
    'rlm': '\u200F',
    'rsaquo': '\u203A',
    'rsquo': '\u2019',
    'sbquo': '\u201A',
    'Scaron': '\u0160',
    'scaron': '\u0161',
    'sdot': '\u22C5',
    'sect': '\u00A7',
    'shy': '\u00AD',
    'Sigma': '\u03A3',
    'sigma': '\u03C3',
    'sigmaf': '\u03C2',
    'sim': '\u223C',
    'spades': '\u2660',
    'sub': '\u2282',
    'sube': '\u2286',
    'sum': '\u2211',
    'sup': '\u2283',
    'sup1': '\u00B9',
    'sup2': '\u00B2',
    'sup3': '\u00B3',
    'supe': '\u2287',
    'szlig': '\u00DF',
    'Tau': '\u03A4',
    'tau': '\u03C4',
    'there4': '\u2234',
    'Theta': '\u0398',
    'theta': '\u03B8',
    'thetasym': '\u03D1',
    'thinsp': '\u2009',
    'THORN': '\u00DE',
    'thorn': '\u00FE',
    'tilde': '\u02DC',
    'times': '\u00D7',
    'trade': '\u2122',
    'Uacute': '\u00DA',
    'uacute': '\u00FA',
    'uarr': '\u2191',
    'uArr': '\u21D1',
    'Ucirc': '\u00DB',
    'ucirc': '\u00FB',
    'Ugrave': '\u00D9',
    'ugrave': '\u00F9',
    'uml': '\u00A8',
    'upsih': '\u03D2',
    'Upsilon': '\u03A5',
    'upsilon': '\u03C5',
    'Uuml': '\u00DC',
    'uuml': '\u00FC',
    'weierp': '\u2118',
    'Xi': '\u039E',
    'xi': '\u03BE',
    'Yacute': '\u00DD',
    'yacute': '\u00FD',
    'yen': '\u00A5',
    'yuml': '\u00FF',
    'Yuml': '\u0178',
    'Zeta': '\u0396',
    'zeta': '\u03B6',
    'zwj': '\u200D',
    'zwnj': '\u200C'
  };
  (function(HtmlTagContentType) {
    HtmlTagContentType[HtmlTagContentType["RAW_TEXT"] = 0] = "RAW_TEXT";
    HtmlTagContentType[HtmlTagContentType["ESCAPABLE_RAW_TEXT"] = 1] = "ESCAPABLE_RAW_TEXT";
    HtmlTagContentType[HtmlTagContentType["PARSABLE_DATA"] = 2] = "PARSABLE_DATA";
  })(exports.HtmlTagContentType || (exports.HtmlTagContentType = {}));
  var HtmlTagContentType = exports.HtmlTagContentType;
  var HtmlTagDefinition = (function() {
    function HtmlTagDefinition(_a) {
      var _this = this;
      var _b = _a === void 0 ? {} : _a,
          closedByChildren = _b.closedByChildren,
          requiredParents = _b.requiredParents,
          implicitNamespacePrefix = _b.implicitNamespacePrefix,
          contentType = _b.contentType,
          closedByParent = _b.closedByParent,
          isVoid = _b.isVoid,
          ignoreFirstLf = _b.ignoreFirstLf;
      this.closedByChildren = {};
      this.closedByParent = false;
      if (lang_1.isPresent(closedByChildren) && closedByChildren.length > 0) {
        closedByChildren.forEach(function(tagName) {
          return _this.closedByChildren[tagName] = true;
        });
      }
      this.isVoid = lang_1.normalizeBool(isVoid);
      this.closedByParent = lang_1.normalizeBool(closedByParent) || this.isVoid;
      if (lang_1.isPresent(requiredParents) && requiredParents.length > 0) {
        this.requiredParents = {};
        this.parentToAdd = requiredParents[0];
        requiredParents.forEach(function(tagName) {
          return _this.requiredParents[tagName] = true;
        });
      }
      this.implicitNamespacePrefix = implicitNamespacePrefix;
      this.contentType = lang_1.isPresent(contentType) ? contentType : HtmlTagContentType.PARSABLE_DATA;
      this.ignoreFirstLf = lang_1.normalizeBool(ignoreFirstLf);
    }
    HtmlTagDefinition.prototype.requireExtraParent = function(currentParent) {
      if (lang_1.isBlank(this.requiredParents)) {
        return false;
      }
      if (lang_1.isBlank(currentParent)) {
        return true;
      }
      var lcParent = currentParent.toLowerCase();
      return this.requiredParents[lcParent] != true && lcParent != 'template';
    };
    HtmlTagDefinition.prototype.isClosedByChild = function(name) {
      return this.isVoid || lang_1.normalizeBool(this.closedByChildren[name.toLowerCase()]);
    };
    return HtmlTagDefinition;
  }());
  exports.HtmlTagDefinition = HtmlTagDefinition;
  var TAG_DEFINITIONS = {
    'base': new HtmlTagDefinition({isVoid: true}),
    'meta': new HtmlTagDefinition({isVoid: true}),
    'area': new HtmlTagDefinition({isVoid: true}),
    'embed': new HtmlTagDefinition({isVoid: true}),
    'link': new HtmlTagDefinition({isVoid: true}),
    'img': new HtmlTagDefinition({isVoid: true}),
    'input': new HtmlTagDefinition({isVoid: true}),
    'param': new HtmlTagDefinition({isVoid: true}),
    'hr': new HtmlTagDefinition({isVoid: true}),
    'br': new HtmlTagDefinition({isVoid: true}),
    'source': new HtmlTagDefinition({isVoid: true}),
    'track': new HtmlTagDefinition({isVoid: true}),
    'wbr': new HtmlTagDefinition({isVoid: true}),
    'p': new HtmlTagDefinition({
      closedByChildren: ['address', 'article', 'aside', 'blockquote', 'div', 'dl', 'fieldset', 'footer', 'form', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'header', 'hgroup', 'hr', 'main', 'nav', 'ol', 'p', 'pre', 'section', 'table', 'ul'],
      closedByParent: true
    }),
    'thead': new HtmlTagDefinition({closedByChildren: ['tbody', 'tfoot']}),
    'tbody': new HtmlTagDefinition({
      closedByChildren: ['tbody', 'tfoot'],
      closedByParent: true
    }),
    'tfoot': new HtmlTagDefinition({
      closedByChildren: ['tbody'],
      closedByParent: true
    }),
    'tr': new HtmlTagDefinition({
      closedByChildren: ['tr'],
      requiredParents: ['tbody', 'tfoot', 'thead'],
      closedByParent: true
    }),
    'td': new HtmlTagDefinition({
      closedByChildren: ['td', 'th'],
      closedByParent: true
    }),
    'th': new HtmlTagDefinition({
      closedByChildren: ['td', 'th'],
      closedByParent: true
    }),
    'col': new HtmlTagDefinition({
      requiredParents: ['colgroup'],
      isVoid: true
    }),
    'svg': new HtmlTagDefinition({implicitNamespacePrefix: 'svg'}),
    'math': new HtmlTagDefinition({implicitNamespacePrefix: 'math'}),
    'li': new HtmlTagDefinition({
      closedByChildren: ['li'],
      closedByParent: true
    }),
    'dt': new HtmlTagDefinition({closedByChildren: ['dt', 'dd']}),
    'dd': new HtmlTagDefinition({
      closedByChildren: ['dt', 'dd'],
      closedByParent: true
    }),
    'rb': new HtmlTagDefinition({
      closedByChildren: ['rb', 'rt', 'rtc', 'rp'],
      closedByParent: true
    }),
    'rt': new HtmlTagDefinition({
      closedByChildren: ['rb', 'rt', 'rtc', 'rp'],
      closedByParent: true
    }),
    'rtc': new HtmlTagDefinition({
      closedByChildren: ['rb', 'rtc', 'rp'],
      closedByParent: true
    }),
    'rp': new HtmlTagDefinition({
      closedByChildren: ['rb', 'rt', 'rtc', 'rp'],
      closedByParent: true
    }),
    'optgroup': new HtmlTagDefinition({
      closedByChildren: ['optgroup'],
      closedByParent: true
    }),
    'option': new HtmlTagDefinition({
      closedByChildren: ['option', 'optgroup'],
      closedByParent: true
    }),
    'pre': new HtmlTagDefinition({ignoreFirstLf: true}),
    'listing': new HtmlTagDefinition({ignoreFirstLf: true}),
    'style': new HtmlTagDefinition({contentType: HtmlTagContentType.RAW_TEXT}),
    'script': new HtmlTagDefinition({contentType: HtmlTagContentType.RAW_TEXT}),
    'title': new HtmlTagDefinition({contentType: HtmlTagContentType.ESCAPABLE_RAW_TEXT}),
    'textarea': new HtmlTagDefinition({
      contentType: HtmlTagContentType.ESCAPABLE_RAW_TEXT,
      ignoreFirstLf: true
    })
  };
  var DEFAULT_TAG_DEFINITION = new HtmlTagDefinition();
  function getHtmlTagDefinition(tagName) {
    var result = TAG_DEFINITIONS[tagName.toLowerCase()];
    return lang_1.isPresent(result) ? result : DEFAULT_TAG_DEFINITION;
  }
  exports.getHtmlTagDefinition = getHtmlTagDefinition;
  var NS_PREFIX_RE = /^@([^:]+):(.+)/g;
  function splitNsName(elementName) {
    if (elementName[0] != '@') {
      return [null, elementName];
    }
    var match = lang_1.RegExpWrapper.firstMatch(NS_PREFIX_RE, elementName);
    return [match[1], match[2]];
  }
  exports.splitNsName = splitNsName;
  function getNsPrefix(elementName) {
    return splitNsName(elementName)[0];
  }
  exports.getNsPrefix = getNsPrefix;
  function mergeNsAndName(prefix, localName) {
    return lang_1.isPresent(prefix) ? "@" + prefix + ":" + localName : localName;
  }
  exports.mergeNsAndName = mergeNsAndName;
  return module.exports;
});

System.registerDynamic("@angular/compiler/src/template_preparser.js", ["../src/facade/lang", "./html_tags"], true, function($__require, exports, module) {
  "use strict";
  ;
  var define,
      global = this,
      GLOBAL = this;
  var lang_1 = $__require('../src/facade/lang');
  var html_tags_1 = $__require('./html_tags');
  var NG_CONTENT_SELECT_ATTR = 'select';
  var NG_CONTENT_ELEMENT = 'ng-content';
  var LINK_ELEMENT = 'link';
  var LINK_STYLE_REL_ATTR = 'rel';
  var LINK_STYLE_HREF_ATTR = 'href';
  var LINK_STYLE_REL_VALUE = 'stylesheet';
  var STYLE_ELEMENT = 'style';
  var SCRIPT_ELEMENT = 'script';
  var NG_NON_BINDABLE_ATTR = 'ngNonBindable';
  var NG_PROJECT_AS = 'ngProjectAs';
  function preparseElement(ast) {
    var selectAttr = null;
    var hrefAttr = null;
    var relAttr = null;
    var nonBindable = false;
    var projectAs = null;
    ast.attrs.forEach(function(attr) {
      var lcAttrName = attr.name.toLowerCase();
      if (lcAttrName == NG_CONTENT_SELECT_ATTR) {
        selectAttr = attr.value;
      } else if (lcAttrName == LINK_STYLE_HREF_ATTR) {
        hrefAttr = attr.value;
      } else if (lcAttrName == LINK_STYLE_REL_ATTR) {
        relAttr = attr.value;
      } else if (attr.name == NG_NON_BINDABLE_ATTR) {
        nonBindable = true;
      } else if (attr.name == NG_PROJECT_AS) {
        if (attr.value.length > 0) {
          projectAs = attr.value;
        }
      }
    });
    selectAttr = normalizeNgContentSelect(selectAttr);
    var nodeName = ast.name.toLowerCase();
    var type = PreparsedElementType.OTHER;
    if (html_tags_1.splitNsName(nodeName)[1] == NG_CONTENT_ELEMENT) {
      type = PreparsedElementType.NG_CONTENT;
    } else if (nodeName == STYLE_ELEMENT) {
      type = PreparsedElementType.STYLE;
    } else if (nodeName == SCRIPT_ELEMENT) {
      type = PreparsedElementType.SCRIPT;
    } else if (nodeName == LINK_ELEMENT && relAttr == LINK_STYLE_REL_VALUE) {
      type = PreparsedElementType.STYLESHEET;
    }
    return new PreparsedElement(type, selectAttr, hrefAttr, nonBindable, projectAs);
  }
  exports.preparseElement = preparseElement;
  (function(PreparsedElementType) {
    PreparsedElementType[PreparsedElementType["NG_CONTENT"] = 0] = "NG_CONTENT";
    PreparsedElementType[PreparsedElementType["STYLE"] = 1] = "STYLE";
    PreparsedElementType[PreparsedElementType["STYLESHEET"] = 2] = "STYLESHEET";
    PreparsedElementType[PreparsedElementType["SCRIPT"] = 3] = "SCRIPT";
    PreparsedElementType[PreparsedElementType["OTHER"] = 4] = "OTHER";
  })(exports.PreparsedElementType || (exports.PreparsedElementType = {}));
  var PreparsedElementType = exports.PreparsedElementType;
  var PreparsedElement = (function() {
    function PreparsedElement(type, selectAttr, hrefAttr, nonBindable, projectAs) {
      this.type = type;
      this.selectAttr = selectAttr;
      this.hrefAttr = hrefAttr;
      this.nonBindable = nonBindable;
      this.projectAs = projectAs;
    }
    return PreparsedElement;
  }());
  exports.PreparsedElement = PreparsedElement;
  function normalizeNgContentSelect(selectAttr) {
    if (lang_1.isBlank(selectAttr) || selectAttr.length === 0) {
      return '*';
    }
    return selectAttr;
  }
  return module.exports;
});

System.registerDynamic("@angular/compiler/src/directive_normalizer.js", ["@angular/core", "../src/facade/lang", "../src/facade/exceptions", "../src/facade/async", "./compile_metadata", "./xhr", "./url_resolver", "./style_url_resolver", "./html_ast", "./html_parser", "./template_preparser"], true, function($__require, exports, module) {
  "use strict";
  ;
  var define,
      global = this,
      GLOBAL = this;
  var core_1 = $__require('@angular/core');
  var lang_1 = $__require('../src/facade/lang');
  var exceptions_1 = $__require('../src/facade/exceptions');
  var async_1 = $__require('../src/facade/async');
  var compile_metadata_1 = $__require('./compile_metadata');
  var xhr_1 = $__require('./xhr');
  var url_resolver_1 = $__require('./url_resolver');
  var style_url_resolver_1 = $__require('./style_url_resolver');
  var html_ast_1 = $__require('./html_ast');
  var html_parser_1 = $__require('./html_parser');
  var template_preparser_1 = $__require('./template_preparser');
  var DirectiveNormalizer = (function() {
    function DirectiveNormalizer(_xhr, _urlResolver, _htmlParser) {
      this._xhr = _xhr;
      this._urlResolver = _urlResolver;
      this._htmlParser = _htmlParser;
    }
    DirectiveNormalizer.prototype.normalizeDirective = function(directive) {
      if (!directive.isComponent) {
        return async_1.PromiseWrapper.resolve(directive);
      }
      return this.normalizeTemplate(directive.type, directive.template).then(function(normalizedTemplate) {
        return new compile_metadata_1.CompileDirectiveMetadata({
          type: directive.type,
          isComponent: directive.isComponent,
          selector: directive.selector,
          exportAs: directive.exportAs,
          changeDetection: directive.changeDetection,
          inputs: directive.inputs,
          outputs: directive.outputs,
          hostListeners: directive.hostListeners,
          hostProperties: directive.hostProperties,
          hostAttributes: directive.hostAttributes,
          lifecycleHooks: directive.lifecycleHooks,
          providers: directive.providers,
          viewProviders: directive.viewProviders,
          queries: directive.queries,
          viewQueries: directive.viewQueries,
          template: normalizedTemplate
        });
      });
    };
    DirectiveNormalizer.prototype.normalizeTemplate = function(directiveType, template) {
      var _this = this;
      if (lang_1.isPresent(template.template)) {
        return async_1.PromiseWrapper.resolve(this.normalizeLoadedTemplate(directiveType, template, template.template, directiveType.moduleUrl));
      } else if (lang_1.isPresent(template.templateUrl)) {
        var sourceAbsUrl = this._urlResolver.resolve(directiveType.moduleUrl, template.templateUrl);
        return this._xhr.get(sourceAbsUrl).then(function(templateContent) {
          return _this.normalizeLoadedTemplate(directiveType, template, templateContent, sourceAbsUrl);
        });
      } else {
        throw new exceptions_1.BaseException("No template specified for component " + directiveType.name);
      }
    };
    DirectiveNormalizer.prototype.normalizeLoadedTemplate = function(directiveType, templateMeta, template, templateAbsUrl) {
      var _this = this;
      var rootNodesAndErrors = this._htmlParser.parse(template, directiveType.name);
      if (rootNodesAndErrors.errors.length > 0) {
        var errorString = rootNodesAndErrors.errors.join('\n');
        throw new exceptions_1.BaseException("Template parse errors:\n" + errorString);
      }
      var visitor = new TemplatePreparseVisitor();
      html_ast_1.htmlVisitAll(visitor, rootNodesAndErrors.rootNodes);
      var allStyles = templateMeta.styles.concat(visitor.styles);
      var allStyleAbsUrls = visitor.styleUrls.filter(style_url_resolver_1.isStyleUrlResolvable).map(function(url) {
        return _this._urlResolver.resolve(templateAbsUrl, url);
      }).concat(templateMeta.styleUrls.filter(style_url_resolver_1.isStyleUrlResolvable).map(function(url) {
        return _this._urlResolver.resolve(directiveType.moduleUrl, url);
      }));
      var allResolvedStyles = allStyles.map(function(style) {
        var styleWithImports = style_url_resolver_1.extractStyleUrls(_this._urlResolver, templateAbsUrl, style);
        styleWithImports.styleUrls.forEach(function(styleUrl) {
          return allStyleAbsUrls.push(styleUrl);
        });
        return styleWithImports.style;
      });
      var encapsulation = templateMeta.encapsulation;
      if (encapsulation === core_1.ViewEncapsulation.Emulated && allResolvedStyles.length === 0 && allStyleAbsUrls.length === 0) {
        encapsulation = core_1.ViewEncapsulation.None;
      }
      return new compile_metadata_1.CompileTemplateMetadata({
        encapsulation: encapsulation,
        template: template,
        templateUrl: templateAbsUrl,
        styles: allResolvedStyles,
        styleUrls: allStyleAbsUrls,
        ngContentSelectors: visitor.ngContentSelectors
      });
    };
    DirectiveNormalizer.decorators = [{type: core_1.Injectable}];
    DirectiveNormalizer.ctorParameters = [{type: xhr_1.XHR}, {type: url_resolver_1.UrlResolver}, {type: html_parser_1.HtmlParser}];
    return DirectiveNormalizer;
  }());
  exports.DirectiveNormalizer = DirectiveNormalizer;
  var TemplatePreparseVisitor = (function() {
    function TemplatePreparseVisitor() {
      this.ngContentSelectors = [];
      this.styles = [];
      this.styleUrls = [];
      this.ngNonBindableStackCount = 0;
    }
    TemplatePreparseVisitor.prototype.visitElement = function(ast, context) {
      var preparsedElement = template_preparser_1.preparseElement(ast);
      switch (preparsedElement.type) {
        case template_preparser_1.PreparsedElementType.NG_CONTENT:
          if (this.ngNonBindableStackCount === 0) {
            this.ngContentSelectors.push(preparsedElement.selectAttr);
          }
          break;
        case template_preparser_1.PreparsedElementType.STYLE:
          var textContent = '';
          ast.children.forEach(function(child) {
            if (child instanceof html_ast_1.HtmlTextAst) {
              textContent += child.value;
            }
          });
          this.styles.push(textContent);
          break;
        case template_preparser_1.PreparsedElementType.STYLESHEET:
          this.styleUrls.push(preparsedElement.hrefAttr);
          break;
        default:
          break;
      }
      if (preparsedElement.nonBindable) {
        this.ngNonBindableStackCount++;
      }
      html_ast_1.htmlVisitAll(this, ast.children);
      if (preparsedElement.nonBindable) {
        this.ngNonBindableStackCount--;
      }
      return null;
    };
    TemplatePreparseVisitor.prototype.visitComment = function(ast, context) {
      return null;
    };
    TemplatePreparseVisitor.prototype.visitAttr = function(ast, context) {
      return null;
    };
    TemplatePreparseVisitor.prototype.visitText = function(ast, context) {
      return null;
    };
    TemplatePreparseVisitor.prototype.visitExpansion = function(ast, context) {
      return null;
    };
    TemplatePreparseVisitor.prototype.visitExpansionCase = function(ast, context) {
      return null;
    };
    return TemplatePreparseVisitor;
  }());
  return module.exports;
});

System.registerDynamic("@angular/compiler/src/directive_resolver.js", ["@angular/core", "../core_private", "../src/facade/lang", "../src/facade/exceptions", "../src/facade/collection"], true, function($__require, exports, module) {
  "use strict";
  ;
  var define,
      global = this,
      GLOBAL = this;
  var core_1 = $__require('@angular/core');
  var core_private_1 = $__require('../core_private');
  var lang_1 = $__require('../src/facade/lang');
  var exceptions_1 = $__require('../src/facade/exceptions');
  var collection_1 = $__require('../src/facade/collection');
  function _isDirectiveMetadata(type) {
    return type instanceof core_1.DirectiveMetadata;
  }
  var DirectiveResolver = (function() {
    function DirectiveResolver(_reflector) {
      if (lang_1.isPresent(_reflector)) {
        this._reflector = _reflector;
      } else {
        this._reflector = core_1.reflector;
      }
    }
    DirectiveResolver.prototype.resolve = function(type) {
      var typeMetadata = this._reflector.annotations(core_1.resolveForwardRef(type));
      if (lang_1.isPresent(typeMetadata)) {
        var metadata = typeMetadata.find(_isDirectiveMetadata);
        if (lang_1.isPresent(metadata)) {
          var propertyMetadata = this._reflector.propMetadata(type);
          return this._mergeWithPropertyMetadata(metadata, propertyMetadata, type);
        }
      }
      throw new exceptions_1.BaseException("No Directive annotation found on " + lang_1.stringify(type));
    };
    DirectiveResolver.prototype._mergeWithPropertyMetadata = function(dm, propertyMetadata, directiveType) {
      var inputs = [];
      var outputs = [];
      var host = {};
      var queries = {};
      collection_1.StringMapWrapper.forEach(propertyMetadata, function(metadata, propName) {
        metadata.forEach(function(a) {
          if (a instanceof core_1.InputMetadata) {
            if (lang_1.isPresent(a.bindingPropertyName)) {
              inputs.push(propName + ": " + a.bindingPropertyName);
            } else {
              inputs.push(propName);
            }
          }
          if (a instanceof core_1.OutputMetadata) {
            if (lang_1.isPresent(a.bindingPropertyName)) {
              outputs.push(propName + ": " + a.bindingPropertyName);
            } else {
              outputs.push(propName);
            }
          }
          if (a instanceof core_1.HostBindingMetadata) {
            if (lang_1.isPresent(a.hostPropertyName)) {
              host[("[" + a.hostPropertyName + "]")] = propName;
            } else {
              host[("[" + propName + "]")] = propName;
            }
          }
          if (a instanceof core_1.HostListenerMetadata) {
            var args = lang_1.isPresent(a.args) ? a.args.join(', ') : '';
            host[("(" + a.eventName + ")")] = propName + "(" + args + ")";
          }
          if (a instanceof core_1.ContentChildrenMetadata) {
            queries[propName] = a;
          }
          if (a instanceof core_1.ViewChildrenMetadata) {
            queries[propName] = a;
          }
          if (a instanceof core_1.ContentChildMetadata) {
            queries[propName] = a;
          }
          if (a instanceof core_1.ViewChildMetadata) {
            queries[propName] = a;
          }
        });
      });
      return this._merge(dm, inputs, outputs, host, queries, directiveType);
    };
    DirectiveResolver.prototype._merge = function(dm, inputs, outputs, host, queries, directiveType) {
      var mergedInputs = lang_1.isPresent(dm.inputs) ? collection_1.ListWrapper.concat(dm.inputs, inputs) : inputs;
      var mergedOutputs;
      if (lang_1.isPresent(dm.outputs)) {
        dm.outputs.forEach(function(propName) {
          if (collection_1.ListWrapper.contains(outputs, propName)) {
            throw new exceptions_1.BaseException("Output event '" + propName + "' defined multiple times in '" + lang_1.stringify(directiveType) + "'");
          }
        });
        mergedOutputs = collection_1.ListWrapper.concat(dm.outputs, outputs);
      } else {
        mergedOutputs = outputs;
      }
      var mergedHost = lang_1.isPresent(dm.host) ? collection_1.StringMapWrapper.merge(dm.host, host) : host;
      var mergedQueries = lang_1.isPresent(dm.queries) ? collection_1.StringMapWrapper.merge(dm.queries, queries) : queries;
      if (dm instanceof core_1.ComponentMetadata) {
        return new core_1.ComponentMetadata({
          selector: dm.selector,
          inputs: mergedInputs,
          outputs: mergedOutputs,
          host: mergedHost,
          exportAs: dm.exportAs,
          moduleId: dm.moduleId,
          queries: mergedQueries,
          changeDetection: dm.changeDetection,
          providers: dm.providers,
          viewProviders: dm.viewProviders
        });
      } else {
        return new core_1.DirectiveMetadata({
          selector: dm.selector,
          inputs: mergedInputs,
          outputs: mergedOutputs,
          host: mergedHost,
          exportAs: dm.exportAs,
          queries: mergedQueries,
          providers: dm.providers
        });
      }
    };
    DirectiveResolver.decorators = [{type: core_1.Injectable}];
    DirectiveResolver.ctorParameters = [{type: core_private_1.ReflectorReader}];
    return DirectiveResolver;
  }());
  exports.DirectiveResolver = DirectiveResolver;
  exports.CODEGEN_DIRECTIVE_RESOLVER = new DirectiveResolver(core_1.reflector);
  return module.exports;
});

System.registerDynamic("@angular/compiler/src/pipe_resolver.js", ["@angular/core", "../core_private", "../src/facade/lang", "../src/facade/exceptions"], true, function($__require, exports, module) {
  "use strict";
  ;
  var define,
      global = this,
      GLOBAL = this;
  var core_1 = $__require('@angular/core');
  var core_private_1 = $__require('../core_private');
  var lang_1 = $__require('../src/facade/lang');
  var exceptions_1 = $__require('../src/facade/exceptions');
  function _isPipeMetadata(type) {
    return type instanceof core_1.PipeMetadata;
  }
  var PipeResolver = (function() {
    function PipeResolver(_reflector) {
      if (lang_1.isPresent(_reflector)) {
        this._reflector = _reflector;
      } else {
        this._reflector = core_1.reflector;
      }
    }
    PipeResolver.prototype.resolve = function(type) {
      var metas = this._reflector.annotations(core_1.resolveForwardRef(type));
      if (lang_1.isPresent(metas)) {
        var annotation = metas.find(_isPipeMetadata);
        if (lang_1.isPresent(annotation)) {
          return annotation;
        }
      }
      throw new exceptions_1.BaseException("No Pipe decorator found on " + lang_1.stringify(type));
    };
    PipeResolver.decorators = [{type: core_1.Injectable}];
    PipeResolver.ctorParameters = [{type: core_private_1.ReflectorReader}];
    return PipeResolver;
  }());
  exports.PipeResolver = PipeResolver;
  exports.CODEGEN_PIPE_RESOLVER = new PipeResolver(core_1.reflector);
  return module.exports;
});

System.registerDynamic("@angular/compiler/src/view_resolver.js", ["@angular/core", "../core_private", "../src/facade/lang", "../src/facade/exceptions", "../src/facade/collection"], true, function($__require, exports, module) {
  "use strict";
  ;
  var define,
      global = this,
      GLOBAL = this;
  var core_1 = $__require('@angular/core');
  var core_private_1 = $__require('../core_private');
  var lang_1 = $__require('../src/facade/lang');
  var exceptions_1 = $__require('../src/facade/exceptions');
  var collection_1 = $__require('../src/facade/collection');
  var ViewResolver = (function() {
    function ViewResolver(_reflector) {
      this._cache = new collection_1.Map();
      if (lang_1.isPresent(_reflector)) {
        this._reflector = _reflector;
      } else {
        this._reflector = core_1.reflector;
      }
    }
    ViewResolver.prototype.resolve = function(component) {
      var view = this._cache.get(component);
      if (lang_1.isBlank(view)) {
        view = this._resolve(component);
        this._cache.set(component, view);
      }
      return view;
    };
    ViewResolver.prototype._resolve = function(component) {
      var compMeta;
      var viewMeta;
      this._reflector.annotations(component).forEach(function(m) {
        if (m instanceof core_1.ViewMetadata) {
          viewMeta = m;
        }
        if (m instanceof core_1.ComponentMetadata) {
          compMeta = m;
        }
      });
      if (lang_1.isPresent(compMeta)) {
        if (lang_1.isBlank(compMeta.template) && lang_1.isBlank(compMeta.templateUrl) && lang_1.isBlank(viewMeta)) {
          throw new exceptions_1.BaseException("Component '" + lang_1.stringify(component) + "' must have either 'template' or 'templateUrl' set.");
        } else if (lang_1.isPresent(compMeta.template) && lang_1.isPresent(viewMeta)) {
          this._throwMixingViewAndComponent("template", component);
        } else if (lang_1.isPresent(compMeta.templateUrl) && lang_1.isPresent(viewMeta)) {
          this._throwMixingViewAndComponent("templateUrl", component);
        } else if (lang_1.isPresent(compMeta.directives) && lang_1.isPresent(viewMeta)) {
          this._throwMixingViewAndComponent("directives", component);
        } else if (lang_1.isPresent(compMeta.pipes) && lang_1.isPresent(viewMeta)) {
          this._throwMixingViewAndComponent("pipes", component);
        } else if (lang_1.isPresent(compMeta.encapsulation) && lang_1.isPresent(viewMeta)) {
          this._throwMixingViewAndComponent("encapsulation", component);
        } else if (lang_1.isPresent(compMeta.styles) && lang_1.isPresent(viewMeta)) {
          this._throwMixingViewAndComponent("styles", component);
        } else if (lang_1.isPresent(compMeta.styleUrls) && lang_1.isPresent(viewMeta)) {
          this._throwMixingViewAndComponent("styleUrls", component);
        } else if (lang_1.isPresent(viewMeta)) {
          return viewMeta;
        } else {
          return new core_1.ViewMetadata({
            templateUrl: compMeta.templateUrl,
            template: compMeta.template,
            directives: compMeta.directives,
            pipes: compMeta.pipes,
            encapsulation: compMeta.encapsulation,
            styles: compMeta.styles,
            styleUrls: compMeta.styleUrls
          });
        }
      } else {
        if (lang_1.isBlank(viewMeta)) {
          throw new exceptions_1.BaseException("Could not compile '" + lang_1.stringify(component) + "' because it is not a component.");
        } else {
          return viewMeta;
        }
      }
      return null;
    };
    ViewResolver.prototype._throwMixingViewAndComponent = function(propertyName, component) {
      throw new exceptions_1.BaseException("Component '" + lang_1.stringify(component) + "' cannot have both '" + propertyName + "' and '@View' set at the same time\"");
    };
    ViewResolver.decorators = [{type: core_1.Injectable}];
    ViewResolver.ctorParameters = [{type: core_private_1.ReflectorReader}];
    return ViewResolver;
  }());
  exports.ViewResolver = ViewResolver;
  return module.exports;
});

System.registerDynamic("@angular/compiler/src/directive_lifecycle_reflector.js", ["../core_private", "../src/facade/lang"], true, function($__require, exports, module) {
  "use strict";
  ;
  var define,
      global = this,
      GLOBAL = this;
  var core_private_1 = $__require('../core_private');
  var lang_1 = $__require('../src/facade/lang');
  function hasLifecycleHook(lcInterface, token) {
    if (!(token instanceof lang_1.Type))
      return false;
    var proto = token.prototype;
    switch (lcInterface) {
      case core_private_1.LifecycleHooks.AfterContentInit:
        return !!proto.ngAfterContentInit;
      case core_private_1.LifecycleHooks.AfterContentChecked:
        return !!proto.ngAfterContentChecked;
      case core_private_1.LifecycleHooks.AfterViewInit:
        return !!proto.ngAfterViewInit;
      case core_private_1.LifecycleHooks.AfterViewChecked:
        return !!proto.ngAfterViewChecked;
      case core_private_1.LifecycleHooks.OnChanges:
        return !!proto.ngOnChanges;
      case core_private_1.LifecycleHooks.DoCheck:
        return !!proto.ngDoCheck;
      case core_private_1.LifecycleHooks.OnDestroy:
        return !!proto.ngOnDestroy;
      case core_private_1.LifecycleHooks.OnInit:
        return !!proto.ngOnInit;
      default:
        return false;
    }
  }
  exports.hasLifecycleHook = hasLifecycleHook;
  return module.exports;
});

System.registerDynamic("@angular/compiler/src/assertions.js", ["../src/facade/lang", "../src/facade/exceptions"], true, function($__require, exports, module) {
  "use strict";
  ;
  var define,
      global = this,
      GLOBAL = this;
  var lang_1 = $__require('../src/facade/lang');
  var exceptions_1 = $__require('../src/facade/exceptions');
  function assertArrayOfStrings(identifier, value) {
    if (!lang_1.assertionsEnabled() || lang_1.isBlank(value)) {
      return;
    }
    if (!lang_1.isArray(value)) {
      throw new exceptions_1.BaseException("Expected '" + identifier + "' to be an array of strings.");
    }
    for (var i = 0; i < value.length; i += 1) {
      if (!lang_1.isString(value[i])) {
        throw new exceptions_1.BaseException("Expected '" + identifier + "' to be an array of strings.");
      }
    }
  }
  exports.assertArrayOfStrings = assertArrayOfStrings;
  return module.exports;
});

System.registerDynamic("@angular/compiler/src/metadata_resolver.js", ["@angular/core", "../core_private", "../src/facade/lang", "../src/facade/collection", "../src/facade/exceptions", "./compile_metadata", "./directive_resolver", "./pipe_resolver", "./view_resolver", "./directive_lifecycle_reflector", "./util", "./assertions", "./url_resolver"], true, function($__require, exports, module) {
  "use strict";
  ;
  var define,
      global = this,
      GLOBAL = this;
  var __extends = (this && this.__extends) || function(d, b) {
    for (var p in b)
      if (b.hasOwnProperty(p))
        d[p] = b[p];
    function __() {
      this.constructor = d;
    }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
  };
  var core_1 = $__require('@angular/core');
  var core_private_1 = $__require('../core_private');
  var lang_1 = $__require('../src/facade/lang');
  var collection_1 = $__require('../src/facade/collection');
  var exceptions_1 = $__require('../src/facade/exceptions');
  var cpl = $__require('./compile_metadata');
  var directive_resolver_1 = $__require('./directive_resolver');
  var pipe_resolver_1 = $__require('./pipe_resolver');
  var view_resolver_1 = $__require('./view_resolver');
  var directive_lifecycle_reflector_1 = $__require('./directive_lifecycle_reflector');
  var util_1 = $__require('./util');
  var assertions_1 = $__require('./assertions');
  var url_resolver_1 = $__require('./url_resolver');
  var core_private_2 = $__require('../core_private');
  var CompileMetadataResolver = (function() {
    function CompileMetadataResolver(_directiveResolver, _pipeResolver, _viewResolver, _platformDirectives, _platformPipes, _reflector) {
      this._directiveResolver = _directiveResolver;
      this._pipeResolver = _pipeResolver;
      this._viewResolver = _viewResolver;
      this._platformDirectives = _platformDirectives;
      this._platformPipes = _platformPipes;
      this._directiveCache = new Map();
      this._pipeCache = new Map();
      this._anonymousTypes = new Map();
      this._anonymousTypeIndex = 0;
      if (lang_1.isPresent(_reflector)) {
        this._reflector = _reflector;
      } else {
        this._reflector = core_1.reflector;
      }
    }
    CompileMetadataResolver.prototype.sanitizeTokenName = function(token) {
      var identifier = lang_1.stringify(token);
      if (identifier.indexOf('(') >= 0) {
        var found = this._anonymousTypes.get(token);
        if (lang_1.isBlank(found)) {
          this._anonymousTypes.set(token, this._anonymousTypeIndex++);
          found = this._anonymousTypes.get(token);
        }
        identifier = "anonymous_token_" + found + "_";
      }
      return util_1.sanitizeIdentifier(identifier);
    };
    CompileMetadataResolver.prototype.getDirectiveMetadata = function(directiveType) {
      var meta = this._directiveCache.get(directiveType);
      if (lang_1.isBlank(meta)) {
        var dirMeta = this._directiveResolver.resolve(directiveType);
        var templateMeta = null;
        var changeDetectionStrategy = null;
        var viewProviders = [];
        var moduleUrl = staticTypeModuleUrl(directiveType);
        if (dirMeta instanceof core_1.ComponentMetadata) {
          assertions_1.assertArrayOfStrings('styles', dirMeta.styles);
          var cmpMeta = dirMeta;
          var viewMeta = this._viewResolver.resolve(directiveType);
          assertions_1.assertArrayOfStrings('styles', viewMeta.styles);
          templateMeta = new cpl.CompileTemplateMetadata({
            encapsulation: viewMeta.encapsulation,
            template: viewMeta.template,
            templateUrl: viewMeta.templateUrl,
            styles: viewMeta.styles,
            styleUrls: viewMeta.styleUrls
          });
          changeDetectionStrategy = cmpMeta.changeDetection;
          if (lang_1.isPresent(dirMeta.viewProviders)) {
            viewProviders = this.getProvidersMetadata(dirMeta.viewProviders);
          }
          moduleUrl = componentModuleUrl(this._reflector, directiveType, cmpMeta);
        }
        var providers = [];
        if (lang_1.isPresent(dirMeta.providers)) {
          providers = this.getProvidersMetadata(dirMeta.providers);
        }
        var queries = [];
        var viewQueries = [];
        if (lang_1.isPresent(dirMeta.queries)) {
          queries = this.getQueriesMetadata(dirMeta.queries, false);
          viewQueries = this.getQueriesMetadata(dirMeta.queries, true);
        }
        meta = cpl.CompileDirectiveMetadata.create({
          selector: dirMeta.selector,
          exportAs: dirMeta.exportAs,
          isComponent: lang_1.isPresent(templateMeta),
          type: this.getTypeMetadata(directiveType, moduleUrl),
          template: templateMeta,
          changeDetection: changeDetectionStrategy,
          inputs: dirMeta.inputs,
          outputs: dirMeta.outputs,
          host: dirMeta.host,
          lifecycleHooks: core_private_1.LIFECYCLE_HOOKS_VALUES.filter(function(hook) {
            return directive_lifecycle_reflector_1.hasLifecycleHook(hook, directiveType);
          }),
          providers: providers,
          viewProviders: viewProviders,
          queries: queries,
          viewQueries: viewQueries
        });
        this._directiveCache.set(directiveType, meta);
      }
      return meta;
    };
    CompileMetadataResolver.prototype.maybeGetDirectiveMetadata = function(someType) {
      try {
        return this.getDirectiveMetadata(someType);
      } catch (e) {
        if (e.message.indexOf('No Directive annotation') !== -1) {
          return null;
        }
        throw e;
      }
    };
    CompileMetadataResolver.prototype.getTypeMetadata = function(type, moduleUrl) {
      return new cpl.CompileTypeMetadata({
        name: this.sanitizeTokenName(type),
        moduleUrl: moduleUrl,
        runtime: type,
        diDeps: this.getDependenciesMetadata(type, null)
      });
    };
    CompileMetadataResolver.prototype.getFactoryMetadata = function(factory, moduleUrl) {
      return new cpl.CompileFactoryMetadata({
        name: this.sanitizeTokenName(factory),
        moduleUrl: moduleUrl,
        runtime: factory,
        diDeps: this.getDependenciesMetadata(factory, null)
      });
    };
    CompileMetadataResolver.prototype.getPipeMetadata = function(pipeType) {
      var meta = this._pipeCache.get(pipeType);
      if (lang_1.isBlank(meta)) {
        var pipeMeta = this._pipeResolver.resolve(pipeType);
        meta = new cpl.CompilePipeMetadata({
          type: this.getTypeMetadata(pipeType, staticTypeModuleUrl(pipeType)),
          name: pipeMeta.name,
          pure: pipeMeta.pure,
          lifecycleHooks: core_private_1.LIFECYCLE_HOOKS_VALUES.filter(function(hook) {
            return directive_lifecycle_reflector_1.hasLifecycleHook(hook, pipeType);
          })
        });
        this._pipeCache.set(pipeType, meta);
      }
      return meta;
    };
    CompileMetadataResolver.prototype.getViewDirectivesMetadata = function(component) {
      var _this = this;
      var view = this._viewResolver.resolve(component);
      var directives = flattenDirectives(view, this._platformDirectives);
      for (var i = 0; i < directives.length; i++) {
        if (!isValidType(directives[i])) {
          throw new exceptions_1.BaseException("Unexpected directive value '" + lang_1.stringify(directives[i]) + "' on the View of component '" + lang_1.stringify(component) + "'");
        }
      }
      return directives.map(function(type) {
        return _this.getDirectiveMetadata(type);
      });
    };
    CompileMetadataResolver.prototype.getViewPipesMetadata = function(component) {
      var _this = this;
      var view = this._viewResolver.resolve(component);
      var pipes = flattenPipes(view, this._platformPipes);
      for (var i = 0; i < pipes.length; i++) {
        if (!isValidType(pipes[i])) {
          throw new exceptions_1.BaseException("Unexpected piped value '" + lang_1.stringify(pipes[i]) + "' on the View of component '" + lang_1.stringify(component) + "'");
        }
      }
      return pipes.map(function(type) {
        return _this.getPipeMetadata(type);
      });
    };
    CompileMetadataResolver.prototype.getDependenciesMetadata = function(typeOrFunc, dependencies) {
      var _this = this;
      var params = lang_1.isPresent(dependencies) ? dependencies : this._reflector.parameters(typeOrFunc);
      if (lang_1.isBlank(params)) {
        params = [];
      }
      return params.map(function(param) {
        if (lang_1.isBlank(param)) {
          return null;
        }
        var isAttribute = false;
        var isHost = false;
        var isSelf = false;
        var isSkipSelf = false;
        var isOptional = false;
        var query = null;
        var viewQuery = null;
        var token = null;
        if (lang_1.isArray(param)) {
          param.forEach(function(paramEntry) {
            if (paramEntry instanceof core_1.HostMetadata) {
              isHost = true;
            } else if (paramEntry instanceof core_1.SelfMetadata) {
              isSelf = true;
            } else if (paramEntry instanceof core_1.SkipSelfMetadata) {
              isSkipSelf = true;
            } else if (paramEntry instanceof core_1.OptionalMetadata) {
              isOptional = true;
            } else if (paramEntry instanceof core_1.AttributeMetadata) {
              isAttribute = true;
              token = paramEntry.attributeName;
            } else if (paramEntry instanceof core_1.QueryMetadata) {
              if (paramEntry.isViewQuery) {
                viewQuery = paramEntry;
              } else {
                query = paramEntry;
              }
            } else if (paramEntry instanceof core_1.InjectMetadata) {
              token = paramEntry.token;
            } else if (isValidType(paramEntry) && lang_1.isBlank(token)) {
              token = paramEntry;
            }
          });
        } else {
          token = param;
        }
        if (lang_1.isBlank(token)) {
          return null;
        }
        return new cpl.CompileDiDependencyMetadata({
          isAttribute: isAttribute,
          isHost: isHost,
          isSelf: isSelf,
          isSkipSelf: isSkipSelf,
          isOptional: isOptional,
          query: lang_1.isPresent(query) ? _this.getQueryMetadata(query, null) : null,
          viewQuery: lang_1.isPresent(viewQuery) ? _this.getQueryMetadata(viewQuery, null) : null,
          token: _this.getTokenMetadata(token)
        });
      });
    };
    CompileMetadataResolver.prototype.getTokenMetadata = function(token) {
      token = core_1.resolveForwardRef(token);
      var compileToken;
      if (lang_1.isString(token)) {
        compileToken = new cpl.CompileTokenMetadata({value: token});
      } else {
        compileToken = new cpl.CompileTokenMetadata({identifier: new cpl.CompileIdentifierMetadata({
            runtime: token,
            name: this.sanitizeTokenName(token),
            moduleUrl: staticTypeModuleUrl(token)
          })});
      }
      return compileToken;
    };
    CompileMetadataResolver.prototype.getProvidersMetadata = function(providers) {
      var _this = this;
      return providers.map(function(provider) {
        provider = core_1.resolveForwardRef(provider);
        if (lang_1.isArray(provider)) {
          return _this.getProvidersMetadata(provider);
        } else if (provider instanceof core_1.Provider) {
          return _this.getProviderMetadata(provider);
        } else if (core_private_2.isProviderLiteral(provider)) {
          return _this.getProviderMetadata(core_private_2.createProvider(provider));
        } else {
          return _this.getTypeMetadata(provider, staticTypeModuleUrl(provider));
        }
      });
    };
    CompileMetadataResolver.prototype.getProviderMetadata = function(provider) {
      var compileDeps;
      if (lang_1.isPresent(provider.useClass)) {
        compileDeps = this.getDependenciesMetadata(provider.useClass, provider.dependencies);
      } else if (lang_1.isPresent(provider.useFactory)) {
        compileDeps = this.getDependenciesMetadata(provider.useFactory, provider.dependencies);
      }
      return new cpl.CompileProviderMetadata({
        token: this.getTokenMetadata(provider.token),
        useClass: lang_1.isPresent(provider.useClass) ? this.getTypeMetadata(provider.useClass, staticTypeModuleUrl(provider.useClass)) : null,
        useValue: convertToCompileValue(provider.useValue),
        useFactory: lang_1.isPresent(provider.useFactory) ? this.getFactoryMetadata(provider.useFactory, staticTypeModuleUrl(provider.useFactory)) : null,
        useExisting: lang_1.isPresent(provider.useExisting) ? this.getTokenMetadata(provider.useExisting) : null,
        deps: compileDeps,
        multi: provider.multi
      });
    };
    CompileMetadataResolver.prototype.getQueriesMetadata = function(queries, isViewQuery) {
      var _this = this;
      var compileQueries = [];
      collection_1.StringMapWrapper.forEach(queries, function(query, propertyName) {
        if (query.isViewQuery === isViewQuery) {
          compileQueries.push(_this.getQueryMetadata(query, propertyName));
        }
      });
      return compileQueries;
    };
    CompileMetadataResolver.prototype.getQueryMetadata = function(q, propertyName) {
      var _this = this;
      var selectors;
      if (q.isVarBindingQuery) {
        selectors = q.varBindings.map(function(varName) {
          return _this.getTokenMetadata(varName);
        });
      } else {
        selectors = [this.getTokenMetadata(q.selector)];
      }
      return new cpl.CompileQueryMetadata({
        selectors: selectors,
        first: q.first,
        descendants: q.descendants,
        propertyName: propertyName,
        read: lang_1.isPresent(q.read) ? this.getTokenMetadata(q.read) : null
      });
    };
    CompileMetadataResolver.decorators = [{type: core_1.Injectable}];
    CompileMetadataResolver.ctorParameters = [{type: directive_resolver_1.DirectiveResolver}, {type: pipe_resolver_1.PipeResolver}, {type: view_resolver_1.ViewResolver}, {
      type: undefined,
      decorators: [{type: core_1.Optional}, {
        type: core_1.Inject,
        args: [core_1.PLATFORM_DIRECTIVES]
      }]
    }, {
      type: undefined,
      decorators: [{type: core_1.Optional}, {
        type: core_1.Inject,
        args: [core_1.PLATFORM_PIPES]
      }]
    }, {type: core_private_1.ReflectorReader}];
    return CompileMetadataResolver;
  }());
  exports.CompileMetadataResolver = CompileMetadataResolver;
  function flattenDirectives(view, platformDirectives) {
    var directives = [];
    if (lang_1.isPresent(platformDirectives)) {
      flattenArray(platformDirectives, directives);
    }
    if (lang_1.isPresent(view.directives)) {
      flattenArray(view.directives, directives);
    }
    return directives;
  }
  function flattenPipes(view, platformPipes) {
    var pipes = [];
    if (lang_1.isPresent(platformPipes)) {
      flattenArray(platformPipes, pipes);
    }
    if (lang_1.isPresent(view.pipes)) {
      flattenArray(view.pipes, pipes);
    }
    return pipes;
  }
  function flattenArray(tree, out) {
    for (var i = 0; i < tree.length; i++) {
      var item = core_1.resolveForwardRef(tree[i]);
      if (lang_1.isArray(item)) {
        flattenArray(item, out);
      } else {
        out.push(item);
      }
    }
  }
  function isStaticType(value) {
    return lang_1.isStringMap(value) && lang_1.isPresent(value['name']) && lang_1.isPresent(value['filePath']);
  }
  function isValidType(value) {
    return isStaticType(value) || (value instanceof lang_1.Type);
  }
  function staticTypeModuleUrl(value) {
    return isStaticType(value) ? value['filePath'] : null;
  }
  function componentModuleUrl(reflector, type, cmpMetadata) {
    if (isStaticType(type)) {
      return staticTypeModuleUrl(type);
    }
    if (lang_1.isPresent(cmpMetadata.moduleId)) {
      var moduleId = cmpMetadata.moduleId;
      var scheme = url_resolver_1.getUrlScheme(moduleId);
      return lang_1.isPresent(scheme) && scheme.length > 0 ? moduleId : "package:" + moduleId + util_1.MODULE_SUFFIX;
    }
    return reflector.importUri(type);
  }
  function convertToCompileValue(value) {
    return util_1.visitValue(value, new _CompileValueConverter(), null);
  }
  var _CompileValueConverter = (function(_super) {
    __extends(_CompileValueConverter, _super);
    function _CompileValueConverter() {
      _super.apply(this, arguments);
    }
    _CompileValueConverter.prototype.visitOther = function(value, context) {
      if (isStaticType(value)) {
        return new cpl.CompileIdentifierMetadata({
          name: value['name'],
          moduleUrl: staticTypeModuleUrl(value)
        });
      } else {
        return new cpl.CompileIdentifierMetadata({runtime: value});
      }
    };
    return _CompileValueConverter;
  }(util_1.ValueTransformer));
  return module.exports;
});

System.registerDynamic("@angular/compiler/src/shadow_css.js", ["../src/facade/collection", "../src/facade/lang"], true, function($__require, exports, module) {
  "use strict";
  ;
  var define,
      global = this,
      GLOBAL = this;
  var collection_1 = $__require('../src/facade/collection');
  var lang_1 = $__require('../src/facade/lang');
  var ShadowCss = (function() {
    function ShadowCss() {
      this.strictStyling = true;
    }
    ShadowCss.prototype.shimCssText = function(cssText, selector, hostSelector) {
      if (hostSelector === void 0) {
        hostSelector = '';
      }
      cssText = stripComments(cssText);
      cssText = this._insertDirectives(cssText);
      return this._scopeCssText(cssText, selector, hostSelector);
    };
    ShadowCss.prototype._insertDirectives = function(cssText) {
      cssText = this._insertPolyfillDirectivesInCssText(cssText);
      return this._insertPolyfillRulesInCssText(cssText);
    };
    ShadowCss.prototype._insertPolyfillDirectivesInCssText = function(cssText) {
      return lang_1.StringWrapper.replaceAllMapped(cssText, _cssContentNextSelectorRe, function(m) {
        return m[1] + '{';
      });
    };
    ShadowCss.prototype._insertPolyfillRulesInCssText = function(cssText) {
      return lang_1.StringWrapper.replaceAllMapped(cssText, _cssContentRuleRe, function(m) {
        var rule = m[0];
        rule = lang_1.StringWrapper.replace(rule, m[1], '');
        rule = lang_1.StringWrapper.replace(rule, m[2], '');
        return m[3] + rule;
      });
    };
    ShadowCss.prototype._scopeCssText = function(cssText, scopeSelector, hostSelector) {
      var unscoped = this._extractUnscopedRulesFromCssText(cssText);
      cssText = this._insertPolyfillHostInCssText(cssText);
      cssText = this._convertColonHost(cssText);
      cssText = this._convertColonHostContext(cssText);
      cssText = this._convertShadowDOMSelectors(cssText);
      if (lang_1.isPresent(scopeSelector)) {
        cssText = this._scopeSelectors(cssText, scopeSelector, hostSelector);
      }
      cssText = cssText + '\n' + unscoped;
      return cssText.trim();
    };
    ShadowCss.prototype._extractUnscopedRulesFromCssText = function(cssText) {
      var r = '',
          m;
      var matcher = lang_1.RegExpWrapper.matcher(_cssContentUnscopedRuleRe, cssText);
      while (lang_1.isPresent(m = lang_1.RegExpMatcherWrapper.next(matcher))) {
        var rule = m[0];
        rule = lang_1.StringWrapper.replace(rule, m[2], '');
        rule = lang_1.StringWrapper.replace(rule, m[1], m[3]);
        r += rule + '\n\n';
      }
      return r;
    };
    ShadowCss.prototype._convertColonHost = function(cssText) {
      return this._convertColonRule(cssText, _cssColonHostRe, this._colonHostPartReplacer);
    };
    ShadowCss.prototype._convertColonHostContext = function(cssText) {
      return this._convertColonRule(cssText, _cssColonHostContextRe, this._colonHostContextPartReplacer);
    };
    ShadowCss.prototype._convertColonRule = function(cssText, regExp, partReplacer) {
      return lang_1.StringWrapper.replaceAllMapped(cssText, regExp, function(m) {
        if (lang_1.isPresent(m[2])) {
          var parts = m[2].split(','),
              r = [];
          for (var i = 0; i < parts.length; i++) {
            var p = parts[i];
            if (lang_1.isBlank(p))
              break;
            p = p.trim();
            r.push(partReplacer(_polyfillHostNoCombinator, p, m[3]));
          }
          return r.join(',');
        } else {
          return _polyfillHostNoCombinator + m[3];
        }
      });
    };
    ShadowCss.prototype._colonHostContextPartReplacer = function(host, part, suffix) {
      if (lang_1.StringWrapper.contains(part, _polyfillHost)) {
        return this._colonHostPartReplacer(host, part, suffix);
      } else {
        return host + part + suffix + ', ' + part + ' ' + host + suffix;
      }
    };
    ShadowCss.prototype._colonHostPartReplacer = function(host, part, suffix) {
      return host + lang_1.StringWrapper.replace(part, _polyfillHost, '') + suffix;
    };
    ShadowCss.prototype._convertShadowDOMSelectors = function(cssText) {
      for (var i = 0; i < _shadowDOMSelectorsRe.length; i++) {
        cssText = lang_1.StringWrapper.replaceAll(cssText, _shadowDOMSelectorsRe[i], ' ');
      }
      return cssText;
    };
    ShadowCss.prototype._scopeSelectors = function(cssText, scopeSelector, hostSelector) {
      var _this = this;
      return processRules(cssText, function(rule) {
        var selector = rule.selector;
        var content = rule.content;
        if (rule.selector[0] != '@' || rule.selector.startsWith('@page')) {
          selector = _this._scopeSelector(rule.selector, scopeSelector, hostSelector, _this.strictStyling);
        } else if (rule.selector.startsWith('@media')) {
          content = _this._scopeSelectors(rule.content, scopeSelector, hostSelector);
        }
        return new CssRule(selector, content);
      });
    };
    ShadowCss.prototype._scopeSelector = function(selector, scopeSelector, hostSelector, strict) {
      var r = [],
          parts = selector.split(',');
      for (var i = 0; i < parts.length; i++) {
        var p = parts[i].trim();
        var deepParts = lang_1.StringWrapper.split(p, _shadowDeepSelectors);
        var shallowPart = deepParts[0];
        if (this._selectorNeedsScoping(shallowPart, scopeSelector)) {
          deepParts[0] = strict && !lang_1.StringWrapper.contains(shallowPart, _polyfillHostNoCombinator) ? this._applyStrictSelectorScope(shallowPart, scopeSelector) : this._applySelectorScope(shallowPart, scopeSelector, hostSelector);
        }
        r.push(deepParts.join(' '));
      }
      return r.join(', ');
    };
    ShadowCss.prototype._selectorNeedsScoping = function(selector, scopeSelector) {
      var re = this._makeScopeMatcher(scopeSelector);
      return !lang_1.isPresent(lang_1.RegExpWrapper.firstMatch(re, selector));
    };
    ShadowCss.prototype._makeScopeMatcher = function(scopeSelector) {
      var lre = /\[/g;
      var rre = /\]/g;
      scopeSelector = lang_1.StringWrapper.replaceAll(scopeSelector, lre, '\\[');
      scopeSelector = lang_1.StringWrapper.replaceAll(scopeSelector, rre, '\\]');
      return lang_1.RegExpWrapper.create('^(' + scopeSelector + ')' + _selectorReSuffix, 'm');
    };
    ShadowCss.prototype._applySelectorScope = function(selector, scopeSelector, hostSelector) {
      return this._applySimpleSelectorScope(selector, scopeSelector, hostSelector);
    };
    ShadowCss.prototype._applySimpleSelectorScope = function(selector, scopeSelector, hostSelector) {
      if (lang_1.isPresent(lang_1.RegExpWrapper.firstMatch(_polyfillHostRe, selector))) {
        var replaceBy = this.strictStyling ? "[" + hostSelector + "]" : scopeSelector;
        selector = lang_1.StringWrapper.replace(selector, _polyfillHostNoCombinator, replaceBy);
        return lang_1.StringWrapper.replaceAll(selector, _polyfillHostRe, replaceBy + ' ');
      } else {
        return scopeSelector + ' ' + selector;
      }
    };
    ShadowCss.prototype._applyStrictSelectorScope = function(selector, scopeSelector) {
      var isRe = /\[is=([^\]]*)\]/g;
      scopeSelector = lang_1.StringWrapper.replaceAllMapped(scopeSelector, isRe, function(m) {
        return m[1];
      });
      var splits = [' ', '>', '+', '~'],
          scoped = selector,
          attrName = '[' + scopeSelector + ']';
      for (var i = 0; i < splits.length; i++) {
        var sep = splits[i];
        var parts = scoped.split(sep);
        scoped = parts.map(function(p) {
          var t = lang_1.StringWrapper.replaceAll(p.trim(), _polyfillHostRe, '');
          if (t.length > 0 && !collection_1.ListWrapper.contains(splits, t) && !lang_1.StringWrapper.contains(t, attrName)) {
            var re = /([^:]*)(:*)(.*)/g;
            var m = lang_1.RegExpWrapper.firstMatch(re, t);
            if (lang_1.isPresent(m)) {
              p = m[1] + attrName + m[2] + m[3];
            }
          }
          return p;
        }).join(sep);
      }
      return scoped;
    };
    ShadowCss.prototype._insertPolyfillHostInCssText = function(selector) {
      selector = lang_1.StringWrapper.replaceAll(selector, _colonHostContextRe, _polyfillHostContext);
      selector = lang_1.StringWrapper.replaceAll(selector, _colonHostRe, _polyfillHost);
      return selector;
    };
    return ShadowCss;
  }());
  exports.ShadowCss = ShadowCss;
  var _cssContentNextSelectorRe = /polyfill-next-selector[^}]*content:[\s]*?['"](.*?)['"][;\s]*}([^{]*?){/gim;
  var _cssContentRuleRe = /(polyfill-rule)[^}]*(content:[\s]*['"](.*?)['"])[;\s]*[^}]*}/gim;
  var _cssContentUnscopedRuleRe = /(polyfill-unscoped-rule)[^}]*(content:[\s]*['"](.*?)['"])[;\s]*[^}]*}/gim;
  var _polyfillHost = '-shadowcsshost';
  var _polyfillHostContext = '-shadowcsscontext';
  var _parenSuffix = ')(?:\\((' + '(?:\\([^)(]*\\)|[^)(]*)+?' + ')\\))?([^,{]*)';
  var _cssColonHostRe = lang_1.RegExpWrapper.create('(' + _polyfillHost + _parenSuffix, 'im');
  var _cssColonHostContextRe = lang_1.RegExpWrapper.create('(' + _polyfillHostContext + _parenSuffix, 'im');
  var _polyfillHostNoCombinator = _polyfillHost + '-no-combinator';
  var _shadowDOMSelectorsRe = [/::shadow/g, /::content/g, /\/shadow-deep\//g, /\/shadow\//g];
  var _shadowDeepSelectors = /(?:>>>)|(?:\/deep\/)/g;
  var _selectorReSuffix = '([>\\s~+\[.,{:][\\s\\S]*)?$';
  var _polyfillHostRe = lang_1.RegExpWrapper.create(_polyfillHost, 'im');
  var _colonHostRe = /:host/gim;
  var _colonHostContextRe = /:host-context/gim;
  var _commentRe = /\/\*[\s\S]*?\*\//g;
  function stripComments(input) {
    return lang_1.StringWrapper.replaceAllMapped(input, _commentRe, function(_) {
      return '';
    });
  }
  var _ruleRe = /(\s*)([^;\{\}]+?)(\s*)((?:{%BLOCK%}?\s*;?)|(?:\s*;))/g;
  var _curlyRe = /([{}])/g;
  var OPEN_CURLY = '{';
  var CLOSE_CURLY = '}';
  var BLOCK_PLACEHOLDER = '%BLOCK%';
  var CssRule = (function() {
    function CssRule(selector, content) {
      this.selector = selector;
      this.content = content;
    }
    return CssRule;
  }());
  exports.CssRule = CssRule;
  function processRules(input, ruleCallback) {
    var inputWithEscapedBlocks = escapeBlocks(input);
    var nextBlockIndex = 0;
    return lang_1.StringWrapper.replaceAllMapped(inputWithEscapedBlocks.escapedString, _ruleRe, function(m) {
      var selector = m[2];
      var content = '';
      var suffix = m[4];
      var contentPrefix = '';
      if (lang_1.isPresent(m[4]) && m[4].startsWith('{' + BLOCK_PLACEHOLDER)) {
        content = inputWithEscapedBlocks.blocks[nextBlockIndex++];
        suffix = m[4].substring(BLOCK_PLACEHOLDER.length + 1);
        contentPrefix = '{';
      }
      var rule = ruleCallback(new CssRule(selector, content));
      return "" + m[1] + rule.selector + m[3] + contentPrefix + rule.content + suffix;
    });
  }
  exports.processRules = processRules;
  var StringWithEscapedBlocks = (function() {
    function StringWithEscapedBlocks(escapedString, blocks) {
      this.escapedString = escapedString;
      this.blocks = blocks;
    }
    return StringWithEscapedBlocks;
  }());
  function escapeBlocks(input) {
    var inputParts = lang_1.StringWrapper.split(input, _curlyRe);
    var resultParts = [];
    var escapedBlocks = [];
    var bracketCount = 0;
    var currentBlockParts = [];
    for (var partIndex = 0; partIndex < inputParts.length; partIndex++) {
      var part = inputParts[partIndex];
      if (part == CLOSE_CURLY) {
        bracketCount--;
      }
      if (bracketCount > 0) {
        currentBlockParts.push(part);
      } else {
        if (currentBlockParts.length > 0) {
          escapedBlocks.push(currentBlockParts.join(''));
          resultParts.push(BLOCK_PLACEHOLDER);
          currentBlockParts = [];
        }
        resultParts.push(part);
      }
      if (part == OPEN_CURLY) {
        bracketCount++;
      }
    }
    if (currentBlockParts.length > 0) {
      escapedBlocks.push(currentBlockParts.join(''));
      resultParts.push(BLOCK_PLACEHOLDER);
    }
    return new StringWithEscapedBlocks(resultParts.join(''), escapedBlocks);
  }
  return module.exports;
});

System.registerDynamic("@angular/compiler/src/style_url_resolver.js", ["../src/facade/lang"], true, function($__require, exports, module) {
  "use strict";
  ;
  var define,
      global = this,
      GLOBAL = this;
  var lang_1 = $__require('../src/facade/lang');
  var StyleWithImports = (function() {
    function StyleWithImports(style, styleUrls) {
      this.style = style;
      this.styleUrls = styleUrls;
    }
    return StyleWithImports;
  }());
  exports.StyleWithImports = StyleWithImports;
  function isStyleUrlResolvable(url) {
    if (lang_1.isBlank(url) || url.length === 0 || url[0] == '/')
      return false;
    var schemeMatch = lang_1.RegExpWrapper.firstMatch(_urlWithSchemaRe, url);
    return lang_1.isBlank(schemeMatch) || schemeMatch[1] == 'package' || schemeMatch[1] == 'asset';
  }
  exports.isStyleUrlResolvable = isStyleUrlResolvable;
  function extractStyleUrls(resolver, baseUrl, cssText) {
    var foundUrls = [];
    var modifiedCssText = lang_1.StringWrapper.replaceAllMapped(cssText, _cssImportRe, function(m) {
      var url = lang_1.isPresent(m[1]) ? m[1] : m[2];
      if (!isStyleUrlResolvable(url)) {
        return m[0];
      }
      foundUrls.push(resolver.resolve(baseUrl, url));
      return '';
    });
    return new StyleWithImports(modifiedCssText, foundUrls);
  }
  exports.extractStyleUrls = extractStyleUrls;
  var _cssImportRe = /@import\s+(?:url\()?\s*(?:(?:['"]([^'"]*))|([^;\)\s]*))[^;]*;?/g;
  var _urlWithSchemaRe = /^([a-zA-Z\-\+\.]+):/g;
  return module.exports;
});

System.registerDynamic("@angular/compiler/src/style_compiler.js", ["@angular/core", "./compile_metadata", "./output/output_ast", "./shadow_css", "./url_resolver", "./style_url_resolver", "../src/facade/lang"], true, function($__require, exports, module) {
  "use strict";
  ;
  var define,
      global = this,
      GLOBAL = this;
  var core_1 = $__require('@angular/core');
  var compile_metadata_1 = $__require('./compile_metadata');
  var o = $__require('./output/output_ast');
  var shadow_css_1 = $__require('./shadow_css');
  var url_resolver_1 = $__require('./url_resolver');
  var style_url_resolver_1 = $__require('./style_url_resolver');
  var lang_1 = $__require('../src/facade/lang');
  var COMPONENT_VARIABLE = '%COMP%';
  var HOST_ATTR = "_nghost-" + COMPONENT_VARIABLE;
  var CONTENT_ATTR = "_ngcontent-" + COMPONENT_VARIABLE;
  var StylesCompileDependency = (function() {
    function StylesCompileDependency(moduleUrl, isShimmed, valuePlaceholder) {
      this.moduleUrl = moduleUrl;
      this.isShimmed = isShimmed;
      this.valuePlaceholder = valuePlaceholder;
    }
    return StylesCompileDependency;
  }());
  exports.StylesCompileDependency = StylesCompileDependency;
  var StylesCompileResult = (function() {
    function StylesCompileResult(statements, stylesVar, dependencies) {
      this.statements = statements;
      this.stylesVar = stylesVar;
      this.dependencies = dependencies;
    }
    return StylesCompileResult;
  }());
  exports.StylesCompileResult = StylesCompileResult;
  var StyleCompiler = (function() {
    function StyleCompiler(_urlResolver) {
      this._urlResolver = _urlResolver;
      this._shadowCss = new shadow_css_1.ShadowCss();
    }
    StyleCompiler.prototype.compileComponent = function(comp) {
      var shim = comp.template.encapsulation === core_1.ViewEncapsulation.Emulated;
      return this._compileStyles(getStylesVarName(comp), comp.template.styles, comp.template.styleUrls, shim);
    };
    StyleCompiler.prototype.compileStylesheet = function(stylesheetUrl, cssText, isShimmed) {
      var styleWithImports = style_url_resolver_1.extractStyleUrls(this._urlResolver, stylesheetUrl, cssText);
      return this._compileStyles(getStylesVarName(null), [styleWithImports.style], styleWithImports.styleUrls, isShimmed);
    };
    StyleCompiler.prototype._compileStyles = function(stylesVar, plainStyles, absUrls, shim) {
      var _this = this;
      var styleExpressions = plainStyles.map(function(plainStyle) {
        return o.literal(_this._shimIfNeeded(plainStyle, shim));
      });
      var dependencies = [];
      for (var i = 0; i < absUrls.length; i++) {
        var identifier = new compile_metadata_1.CompileIdentifierMetadata({name: getStylesVarName(null)});
        dependencies.push(new StylesCompileDependency(absUrls[i], shim, identifier));
        styleExpressions.push(new o.ExternalExpr(identifier));
      }
      var stmt = o.variable(stylesVar).set(o.literalArr(styleExpressions, new o.ArrayType(o.DYNAMIC_TYPE, [o.TypeModifier.Const]))).toDeclStmt(null, [o.StmtModifier.Final]);
      return new StylesCompileResult([stmt], stylesVar, dependencies);
    };
    StyleCompiler.prototype._shimIfNeeded = function(style, shim) {
      return shim ? this._shadowCss.shimCssText(style, CONTENT_ATTR, HOST_ATTR) : style;
    };
    StyleCompiler.decorators = [{type: core_1.Injectable}];
    StyleCompiler.ctorParameters = [{type: url_resolver_1.UrlResolver}];
    return StyleCompiler;
  }());
  exports.StyleCompiler = StyleCompiler;
  function getStylesVarName(component) {
    var result = "styles";
    if (lang_1.isPresent(component)) {
      result += "_" + component.type.name;
    }
    return result;
  }
  return module.exports;
});

System.registerDynamic("@angular/compiler/src/view_compiler/compile_pipe.js", ["../facade/lang", "../facade/exceptions", "../output/output_ast", "../identifiers", "./util"], true, function($__require, exports, module) {
  "use strict";
  ;
  var define,
      global = this,
      GLOBAL = this;
  var lang_1 = $__require('../facade/lang');
  var exceptions_1 = $__require('../facade/exceptions');
  var o = $__require('../output/output_ast');
  var identifiers_1 = $__require('../identifiers');
  var util_1 = $__require('./util');
  var _PurePipeProxy = (function() {
    function _PurePipeProxy(view, instance, argCount) {
      this.view = view;
      this.instance = instance;
      this.argCount = argCount;
    }
    return _PurePipeProxy;
  }());
  var CompilePipe = (function() {
    function CompilePipe(view, meta) {
      this.view = view;
      this.meta = meta;
      this._purePipeProxies = [];
      this.instance = o.THIS_EXPR.prop("_pipe_" + meta.name + "_" + view.pipeCount++);
    }
    CompilePipe.call = function(view, name, args) {
      var compView = view.componentView;
      var meta = _findPipeMeta(compView, name);
      var pipe;
      if (meta.pure) {
        pipe = compView.purePipes.get(name);
        if (lang_1.isBlank(pipe)) {
          pipe = new CompilePipe(compView, meta);
          compView.purePipes.set(name, pipe);
          compView.pipes.push(pipe);
        }
      } else {
        pipe = new CompilePipe(view, meta);
        view.pipes.push(pipe);
      }
      return pipe._call(view, args);
    };
    Object.defineProperty(CompilePipe.prototype, "pure", {
      get: function() {
        return this.meta.pure;
      },
      enumerable: true,
      configurable: true
    });
    CompilePipe.prototype.create = function() {
      var _this = this;
      var deps = this.meta.type.diDeps.map(function(diDep) {
        if (diDep.token.equalsTo(identifiers_1.identifierToken(identifiers_1.Identifiers.ChangeDetectorRef))) {
          return util_1.getPropertyInView(o.THIS_EXPR.prop('ref'), _this.view, _this.view.componentView);
        }
        return util_1.injectFromViewParentInjector(diDep.token, false);
      });
      this.view.fields.push(new o.ClassField(this.instance.name, o.importType(this.meta.type)));
      this.view.createMethod.resetDebugInfo(null, null);
      this.view.createMethod.addStmt(o.THIS_EXPR.prop(this.instance.name).set(o.importExpr(this.meta.type).instantiate(deps)).toStmt());
      this._purePipeProxies.forEach(function(purePipeProxy) {
        var pipeInstanceSeenFromPureProxy = util_1.getPropertyInView(_this.instance, purePipeProxy.view, _this.view);
        util_1.createPureProxy(pipeInstanceSeenFromPureProxy.prop('transform').callMethod(o.BuiltinMethod.bind, [pipeInstanceSeenFromPureProxy]), purePipeProxy.argCount, purePipeProxy.instance, purePipeProxy.view);
      });
    };
    CompilePipe.prototype._call = function(callingView, args) {
      if (this.meta.pure) {
        var purePipeProxy = new _PurePipeProxy(callingView, o.THIS_EXPR.prop(this.instance.name + "_" + this._purePipeProxies.length), args.length);
        this._purePipeProxies.push(purePipeProxy);
        return o.importExpr(identifiers_1.Identifiers.castByValue).callFn([purePipeProxy.instance, util_1.getPropertyInView(this.instance.prop('transform'), callingView, this.view)]).callFn(args);
      } else {
        return util_1.getPropertyInView(this.instance, callingView, this.view).callMethod('transform', args);
      }
    };
    return CompilePipe;
  }());
  exports.CompilePipe = CompilePipe;
  function _findPipeMeta(view, name) {
    var pipeMeta = null;
    for (var i = view.pipeMetas.length - 1; i >= 0; i--) {
      var localPipeMeta = view.pipeMetas[i];
      if (localPipeMeta.name == name) {
        pipeMeta = localPipeMeta;
        break;
      }
    }
    if (lang_1.isBlank(pipeMeta)) {
      throw new exceptions_1.BaseException("Illegal state: Could not find pipe " + name + " although the parser should have detected this error!");
    }
    return pipeMeta;
  }
  return module.exports;
});

System.registerDynamic("@angular/compiler/src/view_compiler/compile_view.js", ["../../core_private", "../../src/facade/lang", "../../src/facade/collection", "../output/output_ast", "./constants", "./compile_query", "./compile_method", "./compile_pipe", "../compile_metadata", "./util", "../identifiers"], true, function($__require, exports, module) {
  "use strict";
  ;
  var define,
      global = this,
      GLOBAL = this;
  var core_private_1 = $__require('../../core_private');
  var lang_1 = $__require('../../src/facade/lang');
  var collection_1 = $__require('../../src/facade/collection');
  var o = $__require('../output/output_ast');
  var constants_1 = $__require('./constants');
  var compile_query_1 = $__require('./compile_query');
  var compile_method_1 = $__require('./compile_method');
  var compile_pipe_1 = $__require('./compile_pipe');
  var compile_metadata_1 = $__require('../compile_metadata');
  var util_1 = $__require('./util');
  var identifiers_1 = $__require('../identifiers');
  var CompileView = (function() {
    function CompileView(component, genConfig, pipeMetas, styles, viewIndex, declarationElement, templateVariableBindings) {
      var _this = this;
      this.component = component;
      this.genConfig = genConfig;
      this.pipeMetas = pipeMetas;
      this.styles = styles;
      this.viewIndex = viewIndex;
      this.declarationElement = declarationElement;
      this.templateVariableBindings = templateVariableBindings;
      this.nodes = [];
      this.rootNodesOrAppElements = [];
      this.bindings = [];
      this.classStatements = [];
      this.eventHandlerMethods = [];
      this.fields = [];
      this.getters = [];
      this.disposables = [];
      this.subscriptions = [];
      this.purePipes = new Map();
      this.pipes = [];
      this.locals = new Map();
      this.literalArrayCount = 0;
      this.literalMapCount = 0;
      this.pipeCount = 0;
      this.createMethod = new compile_method_1.CompileMethod(this);
      this.injectorGetMethod = new compile_method_1.CompileMethod(this);
      this.updateContentQueriesMethod = new compile_method_1.CompileMethod(this);
      this.dirtyParentQueriesMethod = new compile_method_1.CompileMethod(this);
      this.updateViewQueriesMethod = new compile_method_1.CompileMethod(this);
      this.detectChangesInInputsMethod = new compile_method_1.CompileMethod(this);
      this.detectChangesRenderPropertiesMethod = new compile_method_1.CompileMethod(this);
      this.afterContentLifecycleCallbacksMethod = new compile_method_1.CompileMethod(this);
      this.afterViewLifecycleCallbacksMethod = new compile_method_1.CompileMethod(this);
      this.destroyMethod = new compile_method_1.CompileMethod(this);
      this.viewType = getViewType(component, viewIndex);
      this.className = "_View_" + component.type.name + viewIndex;
      this.classType = o.importType(new compile_metadata_1.CompileIdentifierMetadata({name: this.className}));
      this.viewFactory = o.variable(util_1.getViewFactoryName(component, viewIndex));
      if (this.viewType === core_private_1.ViewType.COMPONENT || this.viewType === core_private_1.ViewType.HOST) {
        this.componentView = this;
      } else {
        this.componentView = this.declarationElement.view.componentView;
      }
      this.componentContext = util_1.getPropertyInView(o.THIS_EXPR.prop('context'), this, this.componentView);
      var viewQueries = new compile_metadata_1.CompileTokenMap();
      if (this.viewType === core_private_1.ViewType.COMPONENT) {
        var directiveInstance = o.THIS_EXPR.prop('context');
        collection_1.ListWrapper.forEachWithIndex(this.component.viewQueries, function(queryMeta, queryIndex) {
          var propName = "_viewQuery_" + queryMeta.selectors[0].name + "_" + queryIndex;
          var queryList = compile_query_1.createQueryList(queryMeta, directiveInstance, propName, _this);
          var query = new compile_query_1.CompileQuery(queryMeta, queryList, directiveInstance, _this);
          compile_query_1.addQueryToTokenMap(viewQueries, query);
        });
        var constructorViewQueryCount = 0;
        this.component.type.diDeps.forEach(function(dep) {
          if (lang_1.isPresent(dep.viewQuery)) {
            var queryList = o.THIS_EXPR.prop('declarationAppElement').prop('componentConstructorViewQueries').key(o.literal(constructorViewQueryCount++));
            var query = new compile_query_1.CompileQuery(dep.viewQuery, queryList, null, _this);
            compile_query_1.addQueryToTokenMap(viewQueries, query);
          }
        });
      }
      this.viewQueries = viewQueries;
      templateVariableBindings.forEach(function(entry) {
        _this.locals.set(entry[1], o.THIS_EXPR.prop('context').prop(entry[0]));
      });
      if (!this.declarationElement.isNull()) {
        this.declarationElement.setEmbeddedView(this);
      }
    }
    CompileView.prototype.callPipe = function(name, input, args) {
      return compile_pipe_1.CompilePipe.call(this, name, [input].concat(args));
    };
    CompileView.prototype.getLocal = function(name) {
      if (name == constants_1.EventHandlerVars.event.name) {
        return constants_1.EventHandlerVars.event;
      }
      var currView = this;
      var result = currView.locals.get(name);
      while (lang_1.isBlank(result) && lang_1.isPresent(currView.declarationElement.view)) {
        currView = currView.declarationElement.view;
        result = currView.locals.get(name);
      }
      if (lang_1.isPresent(result)) {
        return util_1.getPropertyInView(result, this, currView);
      } else {
        return null;
      }
    };
    CompileView.prototype.createLiteralArray = function(values) {
      if (values.length === 0) {
        return o.importExpr(identifiers_1.Identifiers.EMPTY_ARRAY);
      }
      var proxyExpr = o.THIS_EXPR.prop("_arr_" + this.literalArrayCount++);
      var proxyParams = [];
      var proxyReturnEntries = [];
      for (var i = 0; i < values.length; i++) {
        var paramName = "p" + i;
        proxyParams.push(new o.FnParam(paramName));
        proxyReturnEntries.push(o.variable(paramName));
      }
      util_1.createPureProxy(o.fn(proxyParams, [new o.ReturnStatement(o.literalArr(proxyReturnEntries))]), values.length, proxyExpr, this);
      return proxyExpr.callFn(values);
    };
    CompileView.prototype.createLiteralMap = function(entries) {
      if (entries.length === 0) {
        return o.importExpr(identifiers_1.Identifiers.EMPTY_MAP);
      }
      var proxyExpr = o.THIS_EXPR.prop("_map_" + this.literalMapCount++);
      var proxyParams = [];
      var proxyReturnEntries = [];
      var values = [];
      for (var i = 0; i < entries.length; i++) {
        var paramName = "p" + i;
        proxyParams.push(new o.FnParam(paramName));
        proxyReturnEntries.push([entries[i][0], o.variable(paramName)]);
        values.push(entries[i][1]);
      }
      util_1.createPureProxy(o.fn(proxyParams, [new o.ReturnStatement(o.literalMap(proxyReturnEntries))]), entries.length, proxyExpr, this);
      return proxyExpr.callFn(values);
    };
    CompileView.prototype.afterNodes = function() {
      var _this = this;
      this.pipes.forEach(function(pipe) {
        return pipe.create();
      });
      this.viewQueries.values().forEach(function(queries) {
        return queries.forEach(function(query) {
          return query.afterChildren(_this.updateViewQueriesMethod);
        });
      });
    };
    return CompileView;
  }());
  exports.CompileView = CompileView;
  function getViewType(component, embeddedTemplateIndex) {
    if (embeddedTemplateIndex > 0) {
      return core_private_1.ViewType.EMBEDDED;
    } else if (component.type.isHost) {
      return core_private_1.ViewType.HOST;
    } else {
      return core_private_1.ViewType.COMPONENT;
    }
  }
  return module.exports;
});

System.registerDynamic("@angular/compiler/src/view_compiler/compile_query.js", ["../../src/facade/lang", "../../src/facade/collection", "../output/output_ast", "../identifiers", "./util"], true, function($__require, exports, module) {
  "use strict";
  ;
  var define,
      global = this,
      GLOBAL = this;
  var lang_1 = $__require('../../src/facade/lang');
  var collection_1 = $__require('../../src/facade/collection');
  var o = $__require('../output/output_ast');
  var identifiers_1 = $__require('../identifiers');
  var util_1 = $__require('./util');
  var ViewQueryValues = (function() {
    function ViewQueryValues(view, values) {
      this.view = view;
      this.values = values;
    }
    return ViewQueryValues;
  }());
  var CompileQuery = (function() {
    function CompileQuery(meta, queryList, ownerDirectiveExpression, view) {
      this.meta = meta;
      this.queryList = queryList;
      this.ownerDirectiveExpression = ownerDirectiveExpression;
      this.view = view;
      this._values = new ViewQueryValues(view, []);
    }
    CompileQuery.prototype.addValue = function(value, view) {
      var currentView = view;
      var elPath = [];
      while (lang_1.isPresent(currentView) && currentView !== this.view) {
        var parentEl = currentView.declarationElement;
        elPath.unshift(parentEl);
        currentView = parentEl.view;
      }
      var queryListForDirtyExpr = util_1.getPropertyInView(this.queryList, view, this.view);
      var viewValues = this._values;
      elPath.forEach(function(el) {
        var last = viewValues.values.length > 0 ? viewValues.values[viewValues.values.length - 1] : null;
        if (last instanceof ViewQueryValues && last.view === el.embeddedView) {
          viewValues = last;
        } else {
          var newViewValues = new ViewQueryValues(el.embeddedView, []);
          viewValues.values.push(newViewValues);
          viewValues = newViewValues;
        }
      });
      viewValues.values.push(value);
      if (elPath.length > 0) {
        view.dirtyParentQueriesMethod.addStmt(queryListForDirtyExpr.callMethod('setDirty', []).toStmt());
      }
    };
    CompileQuery.prototype.afterChildren = function(targetMethod) {
      var values = createQueryValues(this._values);
      var updateStmts = [this.queryList.callMethod('reset', [o.literalArr(values)]).toStmt()];
      if (lang_1.isPresent(this.ownerDirectiveExpression)) {
        var valueExpr = this.meta.first ? this.queryList.prop('first') : this.queryList;
        updateStmts.push(this.ownerDirectiveExpression.prop(this.meta.propertyName).set(valueExpr).toStmt());
      }
      if (!this.meta.first) {
        updateStmts.push(this.queryList.callMethod('notifyOnChanges', []).toStmt());
      }
      targetMethod.addStmt(new o.IfStmt(this.queryList.prop('dirty'), updateStmts));
    };
    return CompileQuery;
  }());
  exports.CompileQuery = CompileQuery;
  function createQueryValues(viewValues) {
    return collection_1.ListWrapper.flatten(viewValues.values.map(function(entry) {
      if (entry instanceof ViewQueryValues) {
        return mapNestedViews(entry.view.declarationElement.appElement, entry.view, createQueryValues(entry));
      } else {
        return entry;
      }
    }));
  }
  function mapNestedViews(declarationAppElement, view, expressions) {
    var adjustedExpressions = expressions.map(function(expr) {
      return o.replaceVarInExpression(o.THIS_EXPR.name, o.variable('nestedView'), expr);
    });
    return declarationAppElement.callMethod('mapNestedViews', [o.variable(view.className), o.fn([new o.FnParam('nestedView', view.classType)], [new o.ReturnStatement(o.literalArr(adjustedExpressions))])]);
  }
  function createQueryList(query, directiveInstance, propertyName, compileView) {
    compileView.fields.push(new o.ClassField(propertyName, o.importType(identifiers_1.Identifiers.QueryList)));
    var expr = o.THIS_EXPR.prop(propertyName);
    compileView.createMethod.addStmt(o.THIS_EXPR.prop(propertyName).set(o.importExpr(identifiers_1.Identifiers.QueryList).instantiate([])).toStmt());
    return expr;
  }
  exports.createQueryList = createQueryList;
  function addQueryToTokenMap(map, query) {
    query.meta.selectors.forEach(function(selector) {
      var entry = map.get(selector);
      if (lang_1.isBlank(entry)) {
        entry = [];
        map.add(selector, entry);
      }
      entry.push(query);
    });
  }
  exports.addQueryToTokenMap = addQueryToTokenMap;
  return module.exports;
});

System.registerDynamic("@angular/compiler/src/view_compiler/compile_element.js", ["@angular/core", "../../src/facade/lang", "../../src/facade/collection", "../output/output_ast", "../identifiers", "./constants", "../template_ast", "../compile_metadata", "./util", "./compile_query", "./compile_method", "../util"], true, function($__require, exports, module) {
  "use strict";
  ;
  var define,
      global = this,
      GLOBAL = this;
  var __extends = (this && this.__extends) || function(d, b) {
    for (var p in b)
      if (b.hasOwnProperty(p))
        d[p] = b[p];
    function __() {
      this.constructor = d;
    }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
  };
  var core_1 = $__require('@angular/core');
  var lang_1 = $__require('../../src/facade/lang');
  var collection_1 = $__require('../../src/facade/collection');
  var o = $__require('../output/output_ast');
  var identifiers_1 = $__require('../identifiers');
  var constants_1 = $__require('./constants');
  var template_ast_1 = $__require('../template_ast');
  var compile_metadata_1 = $__require('../compile_metadata');
  var util_1 = $__require('./util');
  var compile_query_1 = $__require('./compile_query');
  var compile_method_1 = $__require('./compile_method');
  var util_2 = $__require('../util');
  var CompileNode = (function() {
    function CompileNode(parent, view, nodeIndex, renderNode, sourceAst) {
      this.parent = parent;
      this.view = view;
      this.nodeIndex = nodeIndex;
      this.renderNode = renderNode;
      this.sourceAst = sourceAst;
    }
    CompileNode.prototype.isNull = function() {
      return lang_1.isBlank(this.renderNode);
    };
    CompileNode.prototype.isRootElement = function() {
      return this.view != this.parent.view;
    };
    return CompileNode;
  }());
  exports.CompileNode = CompileNode;
  var CompileElement = (function(_super) {
    __extends(CompileElement, _super);
    function CompileElement(parent, view, nodeIndex, renderNode, sourceAst, component, _directives, _resolvedProvidersArray, hasViewContainer, hasEmbeddedView, references) {
      var _this = this;
      _super.call(this, parent, view, nodeIndex, renderNode, sourceAst);
      this.component = component;
      this._directives = _directives;
      this._resolvedProvidersArray = _resolvedProvidersArray;
      this.hasViewContainer = hasViewContainer;
      this.hasEmbeddedView = hasEmbeddedView;
      this._compViewExpr = null;
      this._instances = new compile_metadata_1.CompileTokenMap();
      this._queryCount = 0;
      this._queries = new compile_metadata_1.CompileTokenMap();
      this._componentConstructorViewQueryLists = [];
      this.contentNodesByNgContentIndex = null;
      this.referenceTokens = {};
      references.forEach(function(ref) {
        return _this.referenceTokens[ref.name] = ref.value;
      });
      this.elementRef = o.importExpr(identifiers_1.Identifiers.ElementRef).instantiate([this.renderNode]);
      this._instances.add(identifiers_1.identifierToken(identifiers_1.Identifiers.ElementRef), this.elementRef);
      this.injector = o.THIS_EXPR.callMethod('injector', [o.literal(this.nodeIndex)]);
      this._instances.add(identifiers_1.identifierToken(identifiers_1.Identifiers.Injector), this.injector);
      this._instances.add(identifiers_1.identifierToken(identifiers_1.Identifiers.Renderer), o.THIS_EXPR.prop('renderer'));
      if (this.hasViewContainer || this.hasEmbeddedView || lang_1.isPresent(this.component)) {
        this._createAppElement();
      }
    }
    CompileElement.createNull = function() {
      return new CompileElement(null, null, null, null, null, null, [], [], false, false, []);
    };
    CompileElement.prototype._createAppElement = function() {
      var fieldName = "_appEl_" + this.nodeIndex;
      var parentNodeIndex = this.isRootElement() ? null : this.parent.nodeIndex;
      this.view.fields.push(new o.ClassField(fieldName, o.importType(identifiers_1.Identifiers.AppElement), [o.StmtModifier.Private]));
      var statement = o.THIS_EXPR.prop(fieldName).set(o.importExpr(identifiers_1.Identifiers.AppElement).instantiate([o.literal(this.nodeIndex), o.literal(parentNodeIndex), o.THIS_EXPR, this.renderNode])).toStmt();
      this.view.createMethod.addStmt(statement);
      this.appElement = o.THIS_EXPR.prop(fieldName);
      this._instances.add(identifiers_1.identifierToken(identifiers_1.Identifiers.AppElement), this.appElement);
    };
    CompileElement.prototype.setComponentView = function(compViewExpr) {
      this._compViewExpr = compViewExpr;
      this.contentNodesByNgContentIndex = collection_1.ListWrapper.createFixedSize(this.component.template.ngContentSelectors.length);
      for (var i = 0; i < this.contentNodesByNgContentIndex.length; i++) {
        this.contentNodesByNgContentIndex[i] = [];
      }
    };
    CompileElement.prototype.setEmbeddedView = function(embeddedView) {
      this.embeddedView = embeddedView;
      if (lang_1.isPresent(embeddedView)) {
        var createTemplateRefExpr = o.importExpr(identifiers_1.Identifiers.TemplateRef_).instantiate([this.appElement, this.embeddedView.viewFactory]);
        var provider = new compile_metadata_1.CompileProviderMetadata({
          token: identifiers_1.identifierToken(identifiers_1.Identifiers.TemplateRef),
          useValue: createTemplateRefExpr
        });
        this._resolvedProvidersArray.unshift(new template_ast_1.ProviderAst(provider.token, false, true, [provider], template_ast_1.ProviderAstType.Builtin, this.sourceAst.sourceSpan));
      }
    };
    CompileElement.prototype.beforeChildren = function() {
      var _this = this;
      if (this.hasViewContainer) {
        this._instances.add(identifiers_1.identifierToken(identifiers_1.Identifiers.ViewContainerRef), this.appElement.prop('vcRef'));
      }
      this._resolvedProviders = new compile_metadata_1.CompileTokenMap();
      this._resolvedProvidersArray.forEach(function(provider) {
        return _this._resolvedProviders.add(provider.token, provider);
      });
      this._resolvedProviders.values().forEach(function(resolvedProvider) {
        var providerValueExpressions = resolvedProvider.providers.map(function(provider) {
          if (lang_1.isPresent(provider.useExisting)) {
            return _this._getDependency(resolvedProvider.providerType, new compile_metadata_1.CompileDiDependencyMetadata({token: provider.useExisting}));
          } else if (lang_1.isPresent(provider.useFactory)) {
            var deps = lang_1.isPresent(provider.deps) ? provider.deps : provider.useFactory.diDeps;
            var depsExpr = deps.map(function(dep) {
              return _this._getDependency(resolvedProvider.providerType, dep);
            });
            return o.importExpr(provider.useFactory).callFn(depsExpr);
          } else if (lang_1.isPresent(provider.useClass)) {
            var deps = lang_1.isPresent(provider.deps) ? provider.deps : provider.useClass.diDeps;
            var depsExpr = deps.map(function(dep) {
              return _this._getDependency(resolvedProvider.providerType, dep);
            });
            return o.importExpr(provider.useClass).instantiate(depsExpr, o.importType(provider.useClass));
          } else {
            return _convertValueToOutputAst(provider.useValue);
          }
        });
        var propName = "_" + resolvedProvider.token.name + "_" + _this.nodeIndex + "_" + _this._instances.size;
        var instance = createProviderProperty(propName, resolvedProvider, providerValueExpressions, resolvedProvider.multiProvider, resolvedProvider.eager, _this);
        _this._instances.add(resolvedProvider.token, instance);
      });
      this.directiveInstances = this._directives.map(function(directive) {
        return _this._instances.get(identifiers_1.identifierToken(directive.type));
      });
      for (var i = 0; i < this.directiveInstances.length; i++) {
        var directiveInstance = this.directiveInstances[i];
        var directive = this._directives[i];
        directive.queries.forEach(function(queryMeta) {
          _this._addQuery(queryMeta, directiveInstance);
        });
      }
      var queriesWithReads = [];
      this._resolvedProviders.values().forEach(function(resolvedProvider) {
        var queriesForProvider = _this._getQueriesFor(resolvedProvider.token);
        collection_1.ListWrapper.addAll(queriesWithReads, queriesForProvider.map(function(query) {
          return new _QueryWithRead(query, resolvedProvider.token);
        }));
      });
      collection_1.StringMapWrapper.forEach(this.referenceTokens, function(_, varName) {
        var token = _this.referenceTokens[varName];
        var varValue;
        if (lang_1.isPresent(token)) {
          varValue = _this._instances.get(token);
        } else {
          varValue = _this.renderNode;
        }
        _this.view.locals.set(varName, varValue);
        var varToken = new compile_metadata_1.CompileTokenMetadata({value: varName});
        collection_1.ListWrapper.addAll(queriesWithReads, _this._getQueriesFor(varToken).map(function(query) {
          return new _QueryWithRead(query, varToken);
        }));
      });
      queriesWithReads.forEach(function(queryWithRead) {
        var value;
        if (lang_1.isPresent(queryWithRead.read.identifier)) {
          value = _this._instances.get(queryWithRead.read);
        } else {
          var token = _this.referenceTokens[queryWithRead.read.value];
          if (lang_1.isPresent(token)) {
            value = _this._instances.get(token);
          } else {
            value = _this.elementRef;
          }
        }
        if (lang_1.isPresent(value)) {
          queryWithRead.query.addValue(value, _this.view);
        }
      });
      if (lang_1.isPresent(this.component)) {
        var componentConstructorViewQueryList = lang_1.isPresent(this.component) ? o.literalArr(this._componentConstructorViewQueryLists) : o.NULL_EXPR;
        var compExpr = lang_1.isPresent(this.getComponent()) ? this.getComponent() : o.NULL_EXPR;
        this.view.createMethod.addStmt(this.appElement.callMethod('initComponent', [compExpr, componentConstructorViewQueryList, this._compViewExpr]).toStmt());
      }
    };
    CompileElement.prototype.afterChildren = function(childNodeCount) {
      var _this = this;
      this._resolvedProviders.values().forEach(function(resolvedProvider) {
        var providerExpr = _this._instances.get(resolvedProvider.token);
        var providerChildNodeCount = resolvedProvider.providerType === template_ast_1.ProviderAstType.PrivateService ? 0 : childNodeCount;
        _this.view.injectorGetMethod.addStmt(createInjectInternalCondition(_this.nodeIndex, providerChildNodeCount, resolvedProvider, providerExpr));
      });
      this._queries.values().forEach(function(queries) {
        return queries.forEach(function(query) {
          return query.afterChildren(_this.view.updateContentQueriesMethod);
        });
      });
    };
    CompileElement.prototype.addContentNode = function(ngContentIndex, nodeExpr) {
      this.contentNodesByNgContentIndex[ngContentIndex].push(nodeExpr);
    };
    CompileElement.prototype.getComponent = function() {
      return lang_1.isPresent(this.component) ? this._instances.get(identifiers_1.identifierToken(this.component.type)) : null;
    };
    CompileElement.prototype.getProviderTokens = function() {
      return this._resolvedProviders.values().map(function(resolvedProvider) {
        return util_1.createDiTokenExpression(resolvedProvider.token);
      });
    };
    CompileElement.prototype._getQueriesFor = function(token) {
      var result = [];
      var currentEl = this;
      var distance = 0;
      var queries;
      while (!currentEl.isNull()) {
        queries = currentEl._queries.get(token);
        if (lang_1.isPresent(queries)) {
          collection_1.ListWrapper.addAll(result, queries.filter(function(query) {
            return query.meta.descendants || distance <= 1;
          }));
        }
        if (currentEl._directives.length > 0) {
          distance++;
        }
        currentEl = currentEl.parent;
      }
      queries = this.view.componentView.viewQueries.get(token);
      if (lang_1.isPresent(queries)) {
        collection_1.ListWrapper.addAll(result, queries);
      }
      return result;
    };
    CompileElement.prototype._addQuery = function(queryMeta, directiveInstance) {
      var propName = "_query_" + queryMeta.selectors[0].name + "_" + this.nodeIndex + "_" + this._queryCount++;
      var queryList = compile_query_1.createQueryList(queryMeta, directiveInstance, propName, this.view);
      var query = new compile_query_1.CompileQuery(queryMeta, queryList, directiveInstance, this.view);
      compile_query_1.addQueryToTokenMap(this._queries, query);
      return query;
    };
    CompileElement.prototype._getLocalDependency = function(requestingProviderType, dep) {
      var result = null;
      if (lang_1.isBlank(result) && lang_1.isPresent(dep.query)) {
        result = this._addQuery(dep.query, null).queryList;
      }
      if (lang_1.isBlank(result) && lang_1.isPresent(dep.viewQuery)) {
        result = compile_query_1.createQueryList(dep.viewQuery, null, "_viewQuery_" + dep.viewQuery.selectors[0].name + "_" + this.nodeIndex + "_" + this._componentConstructorViewQueryLists.length, this.view);
        this._componentConstructorViewQueryLists.push(result);
      }
      if (lang_1.isPresent(dep.token)) {
        if (lang_1.isBlank(result)) {
          if (dep.token.equalsTo(identifiers_1.identifierToken(identifiers_1.Identifiers.ChangeDetectorRef))) {
            if (requestingProviderType === template_ast_1.ProviderAstType.Component) {
              return this._compViewExpr.prop('ref');
            } else {
              return util_1.getPropertyInView(o.THIS_EXPR.prop('ref'), this.view, this.view.componentView);
            }
          }
        }
        if (lang_1.isBlank(result)) {
          result = this._instances.get(dep.token);
        }
      }
      return result;
    };
    CompileElement.prototype._getDependency = function(requestingProviderType, dep) {
      var currElement = this;
      var result = null;
      if (dep.isValue) {
        result = o.literal(dep.value);
      }
      if (lang_1.isBlank(result) && !dep.isSkipSelf) {
        result = this._getLocalDependency(requestingProviderType, dep);
      }
      while (lang_1.isBlank(result) && !currElement.parent.isNull()) {
        currElement = currElement.parent;
        result = currElement._getLocalDependency(template_ast_1.ProviderAstType.PublicService, new compile_metadata_1.CompileDiDependencyMetadata({token: dep.token}));
      }
      if (lang_1.isBlank(result)) {
        result = util_1.injectFromViewParentInjector(dep.token, dep.isOptional);
      }
      if (lang_1.isBlank(result)) {
        result = o.NULL_EXPR;
      }
      return util_1.getPropertyInView(result, this.view, currElement.view);
    };
    return CompileElement;
  }(CompileNode));
  exports.CompileElement = CompileElement;
  function createInjectInternalCondition(nodeIndex, childNodeCount, provider, providerExpr) {
    var indexCondition;
    if (childNodeCount > 0) {
      indexCondition = o.literal(nodeIndex).lowerEquals(constants_1.InjectMethodVars.requestNodeIndex).and(constants_1.InjectMethodVars.requestNodeIndex.lowerEquals(o.literal(nodeIndex + childNodeCount)));
    } else {
      indexCondition = o.literal(nodeIndex).identical(constants_1.InjectMethodVars.requestNodeIndex);
    }
    return new o.IfStmt(constants_1.InjectMethodVars.token.identical(util_1.createDiTokenExpression(provider.token)).and(indexCondition), [new o.ReturnStatement(providerExpr)]);
  }
  function createProviderProperty(propName, provider, providerValueExpressions, isMulti, isEager, compileElement) {
    var view = compileElement.view;
    var resolvedProviderValueExpr;
    var type;
    if (isMulti) {
      resolvedProviderValueExpr = o.literalArr(providerValueExpressions);
      type = new o.ArrayType(o.DYNAMIC_TYPE);
    } else {
      resolvedProviderValueExpr = providerValueExpressions[0];
      type = providerValueExpressions[0].type;
    }
    if (lang_1.isBlank(type)) {
      type = o.DYNAMIC_TYPE;
    }
    if (isEager) {
      view.fields.push(new o.ClassField(propName, type));
      view.createMethod.addStmt(o.THIS_EXPR.prop(propName).set(resolvedProviderValueExpr).toStmt());
    } else {
      var internalField = "_" + propName;
      view.fields.push(new o.ClassField(internalField, type));
      var getter = new compile_method_1.CompileMethod(view);
      getter.resetDebugInfo(compileElement.nodeIndex, compileElement.sourceAst);
      getter.addStmt(new o.IfStmt(o.THIS_EXPR.prop(internalField).isBlank(), [o.THIS_EXPR.prop(internalField).set(resolvedProviderValueExpr).toStmt()]));
      getter.addStmt(new o.ReturnStatement(o.THIS_EXPR.prop(internalField)));
      view.getters.push(new o.ClassGetter(propName, getter.finish(), type));
    }
    return o.THIS_EXPR.prop(propName);
  }
  var _QueryWithRead = (function() {
    function _QueryWithRead(query, match) {
      this.query = query;
      this.read = lang_1.isPresent(query.meta.read) ? query.meta.read : match;
    }
    return _QueryWithRead;
  }());
  function _convertValueToOutputAst(value) {
    return util_2.visitValue(value, new _ValueOutputAstTransformer(), null);
  }
  var _ValueOutputAstTransformer = (function(_super) {
    __extends(_ValueOutputAstTransformer, _super);
    function _ValueOutputAstTransformer() {
      _super.apply(this, arguments);
    }
    _ValueOutputAstTransformer.prototype.visitArray = function(arr, context) {
      var _this = this;
      return o.literalArr(arr.map(function(value) {
        return util_2.visitValue(value, _this, context);
      }));
    };
    _ValueOutputAstTransformer.prototype.visitStringMap = function(map, context) {
      var _this = this;
      var entries = [];
      collection_1.StringMapWrapper.forEach(map, function(value, key) {
        entries.push([key, util_2.visitValue(value, _this, context)]);
      });
      return o.literalMap(entries);
    };
    _ValueOutputAstTransformer.prototype.visitPrimitive = function(value, context) {
      return o.literal(value);
    };
    _ValueOutputAstTransformer.prototype.visitOther = function(value, context) {
      if (value instanceof compile_metadata_1.CompileIdentifierMetadata) {
        return o.importExpr(value);
      } else if (value instanceof o.Expression) {
        return value;
      } else {
        throw new core_1.BaseException("Illegal state: Don't now how to compile value " + value);
      }
    };
    return _ValueOutputAstTransformer;
  }(util_2.ValueTransformer));
  return module.exports;
});

System.registerDynamic("@angular/compiler/src/view_compiler/util.js", ["../../src/facade/lang", "../../src/facade/exceptions", "../output/output_ast", "../identifiers"], true, function($__require, exports, module) {
  "use strict";
  ;
  var define,
      global = this,
      GLOBAL = this;
  var lang_1 = $__require('../../src/facade/lang');
  var exceptions_1 = $__require('../../src/facade/exceptions');
  var o = $__require('../output/output_ast');
  var identifiers_1 = $__require('../identifiers');
  function getPropertyInView(property, callingView, definedView) {
    if (callingView === definedView) {
      return property;
    } else {
      var viewProp = o.THIS_EXPR;
      var currView = callingView;
      while (currView !== definedView && lang_1.isPresent(currView.declarationElement.view)) {
        currView = currView.declarationElement.view;
        viewProp = viewProp.prop('parent');
      }
      if (currView !== definedView) {
        throw new exceptions_1.BaseException("Internal error: Could not calculate a property in a parent view: " + property);
      }
      if (property instanceof o.ReadPropExpr) {
        var readPropExpr_1 = property;
        if (definedView.fields.some(function(field) {
          return field.name == readPropExpr_1.name;
        }) || definedView.getters.some(function(field) {
          return field.name == readPropExpr_1.name;
        })) {
          viewProp = viewProp.cast(definedView.classType);
        }
      }
      return o.replaceVarInExpression(o.THIS_EXPR.name, viewProp, property);
    }
  }
  exports.getPropertyInView = getPropertyInView;
  function injectFromViewParentInjector(token, optional) {
    var args = [createDiTokenExpression(token)];
    if (optional) {
      args.push(o.NULL_EXPR);
    }
    return o.THIS_EXPR.prop('parentInjector').callMethod('get', args);
  }
  exports.injectFromViewParentInjector = injectFromViewParentInjector;
  function getViewFactoryName(component, embeddedTemplateIndex) {
    return "viewFactory_" + component.type.name + embeddedTemplateIndex;
  }
  exports.getViewFactoryName = getViewFactoryName;
  function createDiTokenExpression(token) {
    if (lang_1.isPresent(token.value)) {
      return o.literal(token.value);
    } else if (token.identifierIsInstance) {
      return o.importExpr(token.identifier).instantiate([], o.importType(token.identifier, [], [o.TypeModifier.Const]));
    } else {
      return o.importExpr(token.identifier);
    }
  }
  exports.createDiTokenExpression = createDiTokenExpression;
  function createFlatArray(expressions) {
    var lastNonArrayExpressions = [];
    var result = o.literalArr([]);
    for (var i = 0; i < expressions.length; i++) {
      var expr = expressions[i];
      if (expr.type instanceof o.ArrayType) {
        if (lastNonArrayExpressions.length > 0) {
          result = result.callMethod(o.BuiltinMethod.ConcatArray, [o.literalArr(lastNonArrayExpressions)]);
          lastNonArrayExpressions = [];
        }
        result = result.callMethod(o.BuiltinMethod.ConcatArray, [expr]);
      } else {
        lastNonArrayExpressions.push(expr);
      }
    }
    if (lastNonArrayExpressions.length > 0) {
      result = result.callMethod(o.BuiltinMethod.ConcatArray, [o.literalArr(lastNonArrayExpressions)]);
    }
    return result;
  }
  exports.createFlatArray = createFlatArray;
  function createPureProxy(fn, argCount, pureProxyProp, view) {
    view.fields.push(new o.ClassField(pureProxyProp.name, null));
    var pureProxyId = argCount < identifiers_1.Identifiers.pureProxies.length ? identifiers_1.Identifiers.pureProxies[argCount] : null;
    if (lang_1.isBlank(pureProxyId)) {
      throw new exceptions_1.BaseException("Unsupported number of argument for pure functions: " + argCount);
    }
    view.createMethod.addStmt(o.THIS_EXPR.prop(pureProxyProp.name).set(o.importExpr(pureProxyId).callFn([fn])).toStmt());
  }
  exports.createPureProxy = createPureProxy;
  return module.exports;
});

System.registerDynamic("@angular/compiler/src/view_compiler/view_builder.js", ["@angular/core", "../../core_private", "../../src/facade/lang", "../../src/facade/collection", "../output/output_ast", "../identifiers", "./constants", "./compile_view", "./compile_element", "../template_ast", "./util", "../compile_metadata"], true, function($__require, exports, module) {
  "use strict";
  ;
  var define,
      global = this,
      GLOBAL = this;
  var core_1 = $__require('@angular/core');
  var core_private_1 = $__require('../../core_private');
  var lang_1 = $__require('../../src/facade/lang');
  var collection_1 = $__require('../../src/facade/collection');
  var o = $__require('../output/output_ast');
  var identifiers_1 = $__require('../identifiers');
  var constants_1 = $__require('./constants');
  var compile_view_1 = $__require('./compile_view');
  var compile_element_1 = $__require('./compile_element');
  var template_ast_1 = $__require('../template_ast');
  var util_1 = $__require('./util');
  var compile_metadata_1 = $__require('../compile_metadata');
  var IMPLICIT_TEMPLATE_VAR = '\$implicit';
  var CLASS_ATTR = 'class';
  var STYLE_ATTR = 'style';
  var parentRenderNodeVar = o.variable('parentRenderNode');
  var rootSelectorVar = o.variable('rootSelector');
  var ViewCompileDependency = (function() {
    function ViewCompileDependency(comp, factoryPlaceholder) {
      this.comp = comp;
      this.factoryPlaceholder = factoryPlaceholder;
    }
    return ViewCompileDependency;
  }());
  exports.ViewCompileDependency = ViewCompileDependency;
  function buildView(view, template, targetDependencies) {
    var builderVisitor = new ViewBuilderVisitor(view, targetDependencies);
    template_ast_1.templateVisitAll(builderVisitor, template, view.declarationElement.isNull() ? view.declarationElement : view.declarationElement.parent);
    return builderVisitor.nestedViewCount;
  }
  exports.buildView = buildView;
  function finishView(view, targetStatements) {
    view.afterNodes();
    createViewTopLevelStmts(view, targetStatements);
    view.nodes.forEach(function(node) {
      if (node instanceof compile_element_1.CompileElement && node.hasEmbeddedView) {
        finishView(node.embeddedView, targetStatements);
      }
    });
  }
  exports.finishView = finishView;
  var ViewBuilderVisitor = (function() {
    function ViewBuilderVisitor(view, targetDependencies) {
      this.view = view;
      this.targetDependencies = targetDependencies;
      this.nestedViewCount = 0;
    }
    ViewBuilderVisitor.prototype._isRootNode = function(parent) {
      return parent.view !== this.view;
    };
    ViewBuilderVisitor.prototype._addRootNodeAndProject = function(node, ngContentIndex, parent) {
      var vcAppEl = (node instanceof compile_element_1.CompileElement && node.hasViewContainer) ? node.appElement : null;
      if (this._isRootNode(parent)) {
        if (this.view.viewType !== core_private_1.ViewType.COMPONENT) {
          this.view.rootNodesOrAppElements.push(lang_1.isPresent(vcAppEl) ? vcAppEl : node.renderNode);
        }
      } else if (lang_1.isPresent(parent.component) && lang_1.isPresent(ngContentIndex)) {
        parent.addContentNode(ngContentIndex, lang_1.isPresent(vcAppEl) ? vcAppEl : node.renderNode);
      }
    };
    ViewBuilderVisitor.prototype._getParentRenderNode = function(parent) {
      if (this._isRootNode(parent)) {
        if (this.view.viewType === core_private_1.ViewType.COMPONENT) {
          return parentRenderNodeVar;
        } else {
          return o.NULL_EXPR;
        }
      } else {
        return lang_1.isPresent(parent.component) && parent.component.template.encapsulation !== core_1.ViewEncapsulation.Native ? o.NULL_EXPR : parent.renderNode;
      }
    };
    ViewBuilderVisitor.prototype.visitBoundText = function(ast, parent) {
      return this._visitText(ast, '', ast.ngContentIndex, parent);
    };
    ViewBuilderVisitor.prototype.visitText = function(ast, parent) {
      return this._visitText(ast, ast.value, ast.ngContentIndex, parent);
    };
    ViewBuilderVisitor.prototype._visitText = function(ast, value, ngContentIndex, parent) {
      var fieldName = "_text_" + this.view.nodes.length;
      this.view.fields.push(new o.ClassField(fieldName, o.importType(this.view.genConfig.renderTypes.renderText)));
      var renderNode = o.THIS_EXPR.prop(fieldName);
      var compileNode = new compile_element_1.CompileNode(parent, this.view, this.view.nodes.length, renderNode, ast);
      var createRenderNode = o.THIS_EXPR.prop(fieldName).set(constants_1.ViewProperties.renderer.callMethod('createText', [this._getParentRenderNode(parent), o.literal(value), this.view.createMethod.resetDebugInfoExpr(this.view.nodes.length, ast)])).toStmt();
      this.view.nodes.push(compileNode);
      this.view.createMethod.addStmt(createRenderNode);
      this._addRootNodeAndProject(compileNode, ngContentIndex, parent);
      return renderNode;
    };
    ViewBuilderVisitor.prototype.visitNgContent = function(ast, parent) {
      this.view.createMethod.resetDebugInfo(null, ast);
      var parentRenderNode = this._getParentRenderNode(parent);
      var nodesExpression = constants_1.ViewProperties.projectableNodes.key(o.literal(ast.index), new o.ArrayType(o.importType(this.view.genConfig.renderTypes.renderNode)));
      if (parentRenderNode !== o.NULL_EXPR) {
        this.view.createMethod.addStmt(constants_1.ViewProperties.renderer.callMethod('projectNodes', [parentRenderNode, o.importExpr(identifiers_1.Identifiers.flattenNestedViewRenderNodes).callFn([nodesExpression])]).toStmt());
      } else if (this._isRootNode(parent)) {
        if (this.view.viewType !== core_private_1.ViewType.COMPONENT) {
          this.view.rootNodesOrAppElements.push(nodesExpression);
        }
      } else {
        if (lang_1.isPresent(parent.component) && lang_1.isPresent(ast.ngContentIndex)) {
          parent.addContentNode(ast.ngContentIndex, nodesExpression);
        }
      }
      return null;
    };
    ViewBuilderVisitor.prototype.visitElement = function(ast, parent) {
      var nodeIndex = this.view.nodes.length;
      var createRenderNodeExpr;
      var debugContextExpr = this.view.createMethod.resetDebugInfoExpr(nodeIndex, ast);
      if (nodeIndex === 0 && this.view.viewType === core_private_1.ViewType.HOST) {
        createRenderNodeExpr = o.THIS_EXPR.callMethod('selectOrCreateHostElement', [o.literal(ast.name), rootSelectorVar, debugContextExpr]);
      } else {
        createRenderNodeExpr = constants_1.ViewProperties.renderer.callMethod('createElement', [this._getParentRenderNode(parent), o.literal(ast.name), debugContextExpr]);
      }
      var fieldName = "_el_" + nodeIndex;
      this.view.fields.push(new o.ClassField(fieldName, o.importType(this.view.genConfig.renderTypes.renderElement)));
      this.view.createMethod.addStmt(o.THIS_EXPR.prop(fieldName).set(createRenderNodeExpr).toStmt());
      var renderNode = o.THIS_EXPR.prop(fieldName);
      var directives = ast.directives.map(function(directiveAst) {
        return directiveAst.directive;
      });
      var component = directives.find(function(directive) {
        return directive.isComponent;
      });
      var htmlAttrs = _readHtmlAttrs(ast.attrs);
      var attrNameAndValues = _mergeHtmlAndDirectiveAttrs(htmlAttrs, directives);
      for (var i = 0; i < attrNameAndValues.length; i++) {
        var attrName = attrNameAndValues[i][0];
        var attrValue = attrNameAndValues[i][1];
        this.view.createMethod.addStmt(constants_1.ViewProperties.renderer.callMethod('setElementAttribute', [renderNode, o.literal(attrName), o.literal(attrValue)]).toStmt());
      }
      var compileElement = new compile_element_1.CompileElement(parent, this.view, nodeIndex, renderNode, ast, component, directives, ast.providers, ast.hasViewContainer, false, ast.references);
      this.view.nodes.push(compileElement);
      var compViewExpr = null;
      if (lang_1.isPresent(component)) {
        var nestedComponentIdentifier = new compile_metadata_1.CompileIdentifierMetadata({name: util_1.getViewFactoryName(component, 0)});
        this.targetDependencies.push(new ViewCompileDependency(component, nestedComponentIdentifier));
        compViewExpr = o.variable("compView_" + nodeIndex);
        compileElement.setComponentView(compViewExpr);
        this.view.createMethod.addStmt(compViewExpr.set(o.importExpr(nestedComponentIdentifier).callFn([constants_1.ViewProperties.viewUtils, compileElement.injector, compileElement.appElement])).toDeclStmt());
      }
      compileElement.beforeChildren();
      this._addRootNodeAndProject(compileElement, ast.ngContentIndex, parent);
      template_ast_1.templateVisitAll(this, ast.children, compileElement);
      compileElement.afterChildren(this.view.nodes.length - nodeIndex - 1);
      if (lang_1.isPresent(compViewExpr)) {
        var codeGenContentNodes;
        if (this.view.component.type.isHost) {
          codeGenContentNodes = constants_1.ViewProperties.projectableNodes;
        } else {
          codeGenContentNodes = o.literalArr(compileElement.contentNodesByNgContentIndex.map(function(nodes) {
            return util_1.createFlatArray(nodes);
          }));
        }
        this.view.createMethod.addStmt(compViewExpr.callMethod('create', [compileElement.getComponent(), codeGenContentNodes, o.NULL_EXPR]).toStmt());
      }
      return null;
    };
    ViewBuilderVisitor.prototype.visitEmbeddedTemplate = function(ast, parent) {
      var nodeIndex = this.view.nodes.length;
      var fieldName = "_anchor_" + nodeIndex;
      this.view.fields.push(new o.ClassField(fieldName, o.importType(this.view.genConfig.renderTypes.renderComment)));
      this.view.createMethod.addStmt(o.THIS_EXPR.prop(fieldName).set(constants_1.ViewProperties.renderer.callMethod('createTemplateAnchor', [this._getParentRenderNode(parent), this.view.createMethod.resetDebugInfoExpr(nodeIndex, ast)])).toStmt());
      var renderNode = o.THIS_EXPR.prop(fieldName);
      var templateVariableBindings = ast.variables.map(function(varAst) {
        return [varAst.value.length > 0 ? varAst.value : IMPLICIT_TEMPLATE_VAR, varAst.name];
      });
      var directives = ast.directives.map(function(directiveAst) {
        return directiveAst.directive;
      });
      var compileElement = new compile_element_1.CompileElement(parent, this.view, nodeIndex, renderNode, ast, null, directives, ast.providers, ast.hasViewContainer, true, ast.references);
      this.view.nodes.push(compileElement);
      this.nestedViewCount++;
      var embeddedView = new compile_view_1.CompileView(this.view.component, this.view.genConfig, this.view.pipeMetas, o.NULL_EXPR, this.view.viewIndex + this.nestedViewCount, compileElement, templateVariableBindings);
      this.nestedViewCount += buildView(embeddedView, ast.children, this.targetDependencies);
      compileElement.beforeChildren();
      this._addRootNodeAndProject(compileElement, ast.ngContentIndex, parent);
      compileElement.afterChildren(0);
      return null;
    };
    ViewBuilderVisitor.prototype.visitAttr = function(ast, ctx) {
      return null;
    };
    ViewBuilderVisitor.prototype.visitDirective = function(ast, ctx) {
      return null;
    };
    ViewBuilderVisitor.prototype.visitEvent = function(ast, eventTargetAndNames) {
      return null;
    };
    ViewBuilderVisitor.prototype.visitReference = function(ast, ctx) {
      return null;
    };
    ViewBuilderVisitor.prototype.visitVariable = function(ast, ctx) {
      return null;
    };
    ViewBuilderVisitor.prototype.visitDirectiveProperty = function(ast, context) {
      return null;
    };
    ViewBuilderVisitor.prototype.visitElementProperty = function(ast, context) {
      return null;
    };
    return ViewBuilderVisitor;
  }());
  function _mergeHtmlAndDirectiveAttrs(declaredHtmlAttrs, directives) {
    var result = {};
    collection_1.StringMapWrapper.forEach(declaredHtmlAttrs, function(value, key) {
      result[key] = value;
    });
    directives.forEach(function(directiveMeta) {
      collection_1.StringMapWrapper.forEach(directiveMeta.hostAttributes, function(value, name) {
        var prevValue = result[name];
        result[name] = lang_1.isPresent(prevValue) ? mergeAttributeValue(name, prevValue, value) : value;
      });
    });
    return mapToKeyValueArray(result);
  }
  function _readHtmlAttrs(attrs) {
    var htmlAttrs = {};
    attrs.forEach(function(ast) {
      htmlAttrs[ast.name] = ast.value;
    });
    return htmlAttrs;
  }
  function mergeAttributeValue(attrName, attrValue1, attrValue2) {
    if (attrName == CLASS_ATTR || attrName == STYLE_ATTR) {
      return attrValue1 + " " + attrValue2;
    } else {
      return attrValue2;
    }
  }
  function mapToKeyValueArray(data) {
    var entryArray = [];
    collection_1.StringMapWrapper.forEach(data, function(value, name) {
      entryArray.push([name, value]);
    });
    collection_1.ListWrapper.sort(entryArray, function(entry1, entry2) {
      return lang_1.StringWrapper.compare(entry1[0], entry2[0]);
    });
    var keyValueArray = [];
    entryArray.forEach(function(entry) {
      keyValueArray.push([entry[0], entry[1]]);
    });
    return keyValueArray;
  }
  function createViewTopLevelStmts(view, targetStatements) {
    var nodeDebugInfosVar = o.NULL_EXPR;
    if (view.genConfig.genDebugInfo) {
      nodeDebugInfosVar = o.variable("nodeDebugInfos_" + view.component.type.name + view.viewIndex);
      targetStatements.push(nodeDebugInfosVar.set(o.literalArr(view.nodes.map(createStaticNodeDebugInfo), new o.ArrayType(new o.ExternalType(identifiers_1.Identifiers.StaticNodeDebugInfo), [o.TypeModifier.Const]))).toDeclStmt(null, [o.StmtModifier.Final]));
    }
    var renderCompTypeVar = o.variable("renderType_" + view.component.type.name);
    if (view.viewIndex === 0) {
      targetStatements.push(renderCompTypeVar.set(o.NULL_EXPR).toDeclStmt(o.importType(identifiers_1.Identifiers.RenderComponentType)));
    }
    var viewClass = createViewClass(view, renderCompTypeVar, nodeDebugInfosVar);
    targetStatements.push(viewClass);
    targetStatements.push(createViewFactory(view, viewClass, renderCompTypeVar));
  }
  function createStaticNodeDebugInfo(node) {
    var compileElement = node instanceof compile_element_1.CompileElement ? node : null;
    var providerTokens = [];
    var componentToken = o.NULL_EXPR;
    var varTokenEntries = [];
    if (lang_1.isPresent(compileElement)) {
      providerTokens = compileElement.getProviderTokens();
      if (lang_1.isPresent(compileElement.component)) {
        componentToken = util_1.createDiTokenExpression(identifiers_1.identifierToken(compileElement.component.type));
      }
      collection_1.StringMapWrapper.forEach(compileElement.referenceTokens, function(token, varName) {
        varTokenEntries.push([varName, lang_1.isPresent(token) ? util_1.createDiTokenExpression(token) : o.NULL_EXPR]);
      });
    }
    return o.importExpr(identifiers_1.Identifiers.StaticNodeDebugInfo).instantiate([o.literalArr(providerTokens, new o.ArrayType(o.DYNAMIC_TYPE, [o.TypeModifier.Const])), componentToken, o.literalMap(varTokenEntries, new o.MapType(o.DYNAMIC_TYPE, [o.TypeModifier.Const]))], o.importType(identifiers_1.Identifiers.StaticNodeDebugInfo, null, [o.TypeModifier.Const]));
  }
  function createViewClass(view, renderCompTypeVar, nodeDebugInfosVar) {
    var viewConstructorArgs = [new o.FnParam(constants_1.ViewConstructorVars.viewUtils.name, o.importType(identifiers_1.Identifiers.ViewUtils)), new o.FnParam(constants_1.ViewConstructorVars.parentInjector.name, o.importType(identifiers_1.Identifiers.Injector)), new o.FnParam(constants_1.ViewConstructorVars.declarationEl.name, o.importType(identifiers_1.Identifiers.AppElement))];
    var superConstructorArgs = [o.variable(view.className), renderCompTypeVar, constants_1.ViewTypeEnum.fromValue(view.viewType), constants_1.ViewConstructorVars.viewUtils, constants_1.ViewConstructorVars.parentInjector, constants_1.ViewConstructorVars.declarationEl, constants_1.ChangeDetectionStrategyEnum.fromValue(getChangeDetectionMode(view))];
    if (view.genConfig.genDebugInfo) {
      superConstructorArgs.push(nodeDebugInfosVar);
    }
    var viewConstructor = new o.ClassMethod(null, viewConstructorArgs, [o.SUPER_EXPR.callFn(superConstructorArgs).toStmt()]);
    var viewMethods = [new o.ClassMethod('createInternal', [new o.FnParam(rootSelectorVar.name, o.STRING_TYPE)], generateCreateMethod(view), o.importType(identifiers_1.Identifiers.AppElement)), new o.ClassMethod('injectorGetInternal', [new o.FnParam(constants_1.InjectMethodVars.token.name, o.DYNAMIC_TYPE), new o.FnParam(constants_1.InjectMethodVars.requestNodeIndex.name, o.NUMBER_TYPE), new o.FnParam(constants_1.InjectMethodVars.notFoundResult.name, o.DYNAMIC_TYPE)], addReturnValuefNotEmpty(view.injectorGetMethod.finish(), constants_1.InjectMethodVars.notFoundResult), o.DYNAMIC_TYPE), new o.ClassMethod('detectChangesInternal', [new o.FnParam(constants_1.DetectChangesVars.throwOnChange.name, o.BOOL_TYPE)], generateDetectChangesMethod(view)), new o.ClassMethod('dirtyParentQueriesInternal', [], view.dirtyParentQueriesMethod.finish()), new o.ClassMethod('destroyInternal', [], view.destroyMethod.finish())].concat(view.eventHandlerMethods);
    var superClass = view.genConfig.genDebugInfo ? identifiers_1.Identifiers.DebugAppView : identifiers_1.Identifiers.AppView;
    var viewClass = new o.ClassStmt(view.className, o.importExpr(superClass, [getContextType(view)]), view.fields, view.getters, viewConstructor, viewMethods.filter(function(method) {
      return method.body.length > 0;
    }));
    return viewClass;
  }
  function createViewFactory(view, viewClass, renderCompTypeVar) {
    var viewFactoryArgs = [new o.FnParam(constants_1.ViewConstructorVars.viewUtils.name, o.importType(identifiers_1.Identifiers.ViewUtils)), new o.FnParam(constants_1.ViewConstructorVars.parentInjector.name, o.importType(identifiers_1.Identifiers.Injector)), new o.FnParam(constants_1.ViewConstructorVars.declarationEl.name, o.importType(identifiers_1.Identifiers.AppElement))];
    var initRenderCompTypeStmts = [];
    var templateUrlInfo;
    if (view.component.template.templateUrl == view.component.type.moduleUrl) {
      templateUrlInfo = view.component.type.moduleUrl + " class " + view.component.type.name + " - inline template";
    } else {
      templateUrlInfo = view.component.template.templateUrl;
    }
    if (view.viewIndex === 0) {
      initRenderCompTypeStmts = [new o.IfStmt(renderCompTypeVar.identical(o.NULL_EXPR), [renderCompTypeVar.set(constants_1.ViewConstructorVars.viewUtils.callMethod('createRenderComponentType', [o.literal(templateUrlInfo), o.literal(view.component.template.ngContentSelectors.length), constants_1.ViewEncapsulationEnum.fromValue(view.component.template.encapsulation), view.styles])).toStmt()])];
    }
    return o.fn(viewFactoryArgs, initRenderCompTypeStmts.concat([new o.ReturnStatement(o.variable(viewClass.name).instantiate(viewClass.constructorMethod.params.map(function(param) {
      return o.variable(param.name);
    })))]), o.importType(identifiers_1.Identifiers.AppView, [getContextType(view)])).toDeclStmt(view.viewFactory.name, [o.StmtModifier.Final]);
  }
  function generateCreateMethod(view) {
    var parentRenderNodeExpr = o.NULL_EXPR;
    var parentRenderNodeStmts = [];
    if (view.viewType === core_private_1.ViewType.COMPONENT) {
      parentRenderNodeExpr = constants_1.ViewProperties.renderer.callMethod('createViewRoot', [o.THIS_EXPR.prop('declarationAppElement').prop('nativeElement')]);
      parentRenderNodeStmts = [parentRenderNodeVar.set(parentRenderNodeExpr).toDeclStmt(o.importType(view.genConfig.renderTypes.renderNode), [o.StmtModifier.Final])];
    }
    var resultExpr;
    if (view.viewType === core_private_1.ViewType.HOST) {
      resultExpr = view.nodes[0].appElement;
    } else {
      resultExpr = o.NULL_EXPR;
    }
    return parentRenderNodeStmts.concat(view.createMethod.finish()).concat([o.THIS_EXPR.callMethod('init', [util_1.createFlatArray(view.rootNodesOrAppElements), o.literalArr(view.nodes.map(function(node) {
      return node.renderNode;
    })), o.literalArr(view.disposables), o.literalArr(view.subscriptions)]).toStmt(), new o.ReturnStatement(resultExpr)]);
  }
  function generateDetectChangesMethod(view) {
    var stmts = [];
    if (view.detectChangesInInputsMethod.isEmpty() && view.updateContentQueriesMethod.isEmpty() && view.afterContentLifecycleCallbacksMethod.isEmpty() && view.detectChangesRenderPropertiesMethod.isEmpty() && view.updateViewQueriesMethod.isEmpty() && view.afterViewLifecycleCallbacksMethod.isEmpty()) {
      return stmts;
    }
    collection_1.ListWrapper.addAll(stmts, view.detectChangesInInputsMethod.finish());
    stmts.push(o.THIS_EXPR.callMethod('detectContentChildrenChanges', [constants_1.DetectChangesVars.throwOnChange]).toStmt());
    var afterContentStmts = view.updateContentQueriesMethod.finish().concat(view.afterContentLifecycleCallbacksMethod.finish());
    if (afterContentStmts.length > 0) {
      stmts.push(new o.IfStmt(o.not(constants_1.DetectChangesVars.throwOnChange), afterContentStmts));
    }
    collection_1.ListWrapper.addAll(stmts, view.detectChangesRenderPropertiesMethod.finish());
    stmts.push(o.THIS_EXPR.callMethod('detectViewChildrenChanges', [constants_1.DetectChangesVars.throwOnChange]).toStmt());
    var afterViewStmts = view.updateViewQueriesMethod.finish().concat(view.afterViewLifecycleCallbacksMethod.finish());
    if (afterViewStmts.length > 0) {
      stmts.push(new o.IfStmt(o.not(constants_1.DetectChangesVars.throwOnChange), afterViewStmts));
    }
    var varStmts = [];
    var readVars = o.findReadVarNames(stmts);
    if (collection_1.SetWrapper.has(readVars, constants_1.DetectChangesVars.changed.name)) {
      varStmts.push(constants_1.DetectChangesVars.changed.set(o.literal(true)).toDeclStmt(o.BOOL_TYPE));
    }
    if (collection_1.SetWrapper.has(readVars, constants_1.DetectChangesVars.changes.name)) {
      varStmts.push(constants_1.DetectChangesVars.changes.set(o.NULL_EXPR).toDeclStmt(new o.MapType(o.importType(identifiers_1.Identifiers.SimpleChange))));
    }
    if (collection_1.SetWrapper.has(readVars, constants_1.DetectChangesVars.valUnwrapper.name)) {
      varStmts.push(constants_1.DetectChangesVars.valUnwrapper.set(o.importExpr(identifiers_1.Identifiers.ValueUnwrapper).instantiate([])).toDeclStmt(null, [o.StmtModifier.Final]));
    }
    return varStmts.concat(stmts);
  }
  function addReturnValuefNotEmpty(statements, value) {
    if (statements.length > 0) {
      return statements.concat([new o.ReturnStatement(value)]);
    } else {
      return statements;
    }
  }
  function getContextType(view) {
    if (view.viewType === core_private_1.ViewType.COMPONENT) {
      return o.importType(view.component.type);
    }
    return o.DYNAMIC_TYPE;
  }
  function getChangeDetectionMode(view) {
    var mode;
    if (view.viewType === core_private_1.ViewType.COMPONENT) {
      mode = core_private_1.isDefaultChangeDetectionStrategy(view.component.changeDetection) ? core_1.ChangeDetectionStrategy.CheckAlways : core_1.ChangeDetectionStrategy.CheckOnce;
    } else {
      mode = core_1.ChangeDetectionStrategy.CheckAlways;
    }
    return mode;
  }
  return module.exports;
});

System.registerDynamic("@angular/compiler/src/view_compiler/property_binder.js", ["../../core_private", "../../src/facade/lang", "../output/output_ast", "../identifiers", "./constants", "../template_ast", "../util", "./expression_converter", "./compile_binding"], true, function($__require, exports, module) {
  "use strict";
  ;
  var define,
      global = this,
      GLOBAL = this;
  var core_private_1 = $__require('../../core_private');
  var core_private_2 = $__require('../../core_private');
  var lang_1 = $__require('../../src/facade/lang');
  var o = $__require('../output/output_ast');
  var identifiers_1 = $__require('../identifiers');
  var constants_1 = $__require('./constants');
  var template_ast_1 = $__require('../template_ast');
  var util_1 = $__require('../util');
  var expression_converter_1 = $__require('./expression_converter');
  var compile_binding_1 = $__require('./compile_binding');
  function createBindFieldExpr(exprIndex) {
    return o.THIS_EXPR.prop("_expr_" + exprIndex);
  }
  function createCurrValueExpr(exprIndex) {
    return o.variable("currVal_" + exprIndex);
  }
  function bind(view, currValExpr, fieldExpr, parsedExpression, context, actions, method) {
    var checkExpression = expression_converter_1.convertCdExpressionToIr(view, context, parsedExpression, constants_1.DetectChangesVars.valUnwrapper);
    if (lang_1.isBlank(checkExpression.expression)) {
      return;
    }
    view.fields.push(new o.ClassField(fieldExpr.name, null, [o.StmtModifier.Private]));
    view.createMethod.addStmt(o.THIS_EXPR.prop(fieldExpr.name).set(o.importExpr(identifiers_1.Identifiers.uninitialized)).toStmt());
    if (checkExpression.needsValueUnwrapper) {
      var initValueUnwrapperStmt = constants_1.DetectChangesVars.valUnwrapper.callMethod('reset', []).toStmt();
      method.addStmt(initValueUnwrapperStmt);
    }
    method.addStmt(currValExpr.set(checkExpression.expression).toDeclStmt(null, [o.StmtModifier.Final]));
    var condition = o.importExpr(identifiers_1.Identifiers.checkBinding).callFn([constants_1.DetectChangesVars.throwOnChange, fieldExpr, currValExpr]);
    if (checkExpression.needsValueUnwrapper) {
      condition = constants_1.DetectChangesVars.valUnwrapper.prop('hasWrappedValue').or(condition);
    }
    method.addStmt(new o.IfStmt(condition, actions.concat([o.THIS_EXPR.prop(fieldExpr.name).set(currValExpr).toStmt()])));
  }
  function bindRenderText(boundText, compileNode, view) {
    var bindingIndex = view.bindings.length;
    view.bindings.push(new compile_binding_1.CompileBinding(compileNode, boundText));
    var currValExpr = createCurrValueExpr(bindingIndex);
    var valueField = createBindFieldExpr(bindingIndex);
    view.detectChangesRenderPropertiesMethod.resetDebugInfo(compileNode.nodeIndex, boundText);
    bind(view, currValExpr, valueField, boundText.value, view.componentContext, [o.THIS_EXPR.prop('renderer').callMethod('setText', [compileNode.renderNode, currValExpr]).toStmt()], view.detectChangesRenderPropertiesMethod);
  }
  exports.bindRenderText = bindRenderText;
  function bindAndWriteToRenderer(boundProps, context, compileElement) {
    var view = compileElement.view;
    var renderNode = compileElement.renderNode;
    boundProps.forEach(function(boundProp) {
      var bindingIndex = view.bindings.length;
      view.bindings.push(new compile_binding_1.CompileBinding(compileElement, boundProp));
      view.detectChangesRenderPropertiesMethod.resetDebugInfo(compileElement.nodeIndex, boundProp);
      var fieldExpr = createBindFieldExpr(bindingIndex);
      var currValExpr = createCurrValueExpr(bindingIndex);
      var renderMethod;
      var renderValue = sanitizedValue(boundProp, currValExpr);
      var updateStmts = [];
      switch (boundProp.type) {
        case template_ast_1.PropertyBindingType.Property:
          renderMethod = 'setElementProperty';
          if (view.genConfig.logBindingUpdate) {
            updateStmts.push(logBindingUpdateStmt(renderNode, boundProp.name, currValExpr));
          }
          break;
        case template_ast_1.PropertyBindingType.Attribute:
          renderMethod = 'setElementAttribute';
          renderValue = renderValue.isBlank().conditional(o.NULL_EXPR, renderValue.callMethod('toString', []));
          break;
        case template_ast_1.PropertyBindingType.Class:
          renderMethod = 'setElementClass';
          break;
        case template_ast_1.PropertyBindingType.Style:
          renderMethod = 'setElementStyle';
          var strValue = renderValue.callMethod('toString', []);
          if (lang_1.isPresent(boundProp.unit)) {
            strValue = strValue.plus(o.literal(boundProp.unit));
          }
          renderValue = renderValue.isBlank().conditional(o.NULL_EXPR, strValue);
          break;
      }
      updateStmts.push(o.THIS_EXPR.prop('renderer').callMethod(renderMethod, [renderNode, o.literal(boundProp.name), renderValue]).toStmt());
      bind(view, currValExpr, fieldExpr, boundProp.value, context, updateStmts, view.detectChangesRenderPropertiesMethod);
    });
  }
  function sanitizedValue(boundProp, renderValue) {
    var enumValue;
    switch (boundProp.securityContext) {
      case core_private_1.SecurityContext.NONE:
        return renderValue;
      case core_private_1.SecurityContext.HTML:
        enumValue = 'HTML';
        break;
      case core_private_1.SecurityContext.STYLE:
        enumValue = 'STYLE';
        break;
      case core_private_1.SecurityContext.SCRIPT:
        enumValue = 'SCRIPT';
        break;
      case core_private_1.SecurityContext.URL:
        enumValue = 'URL';
        break;
      case core_private_1.SecurityContext.RESOURCE_URL:
        enumValue = 'RESOURCE_URL';
        break;
      default:
        throw new Error("internal error, unexpected SecurityContext " + boundProp.securityContext + ".");
    }
    var ctx = constants_1.ViewProperties.viewUtils.prop('sanitizer');
    var args = [o.importExpr(identifiers_1.Identifiers.SecurityContext).prop(enumValue), renderValue];
    return ctx.callMethod('sanitize', args);
  }
  function bindRenderInputs(boundProps, compileElement) {
    bindAndWriteToRenderer(boundProps, compileElement.view.componentContext, compileElement);
  }
  exports.bindRenderInputs = bindRenderInputs;
  function bindDirectiveHostProps(directiveAst, directiveInstance, compileElement) {
    bindAndWriteToRenderer(directiveAst.hostProperties, directiveInstance, compileElement);
  }
  exports.bindDirectiveHostProps = bindDirectiveHostProps;
  function bindDirectiveInputs(directiveAst, directiveInstance, compileElement) {
    if (directiveAst.inputs.length === 0) {
      return;
    }
    var view = compileElement.view;
    var detectChangesInInputsMethod = view.detectChangesInInputsMethod;
    detectChangesInInputsMethod.resetDebugInfo(compileElement.nodeIndex, compileElement.sourceAst);
    var lifecycleHooks = directiveAst.directive.lifecycleHooks;
    var calcChangesMap = lifecycleHooks.indexOf(core_private_2.LifecycleHooks.OnChanges) !== -1;
    var isOnPushComp = directiveAst.directive.isComponent && !core_private_2.isDefaultChangeDetectionStrategy(directiveAst.directive.changeDetection);
    if (calcChangesMap) {
      detectChangesInInputsMethod.addStmt(constants_1.DetectChangesVars.changes.set(o.NULL_EXPR).toStmt());
    }
    if (isOnPushComp) {
      detectChangesInInputsMethod.addStmt(constants_1.DetectChangesVars.changed.set(o.literal(false)).toStmt());
    }
    directiveAst.inputs.forEach(function(input) {
      var bindingIndex = view.bindings.length;
      view.bindings.push(new compile_binding_1.CompileBinding(compileElement, input));
      detectChangesInInputsMethod.resetDebugInfo(compileElement.nodeIndex, input);
      var fieldExpr = createBindFieldExpr(bindingIndex);
      var currValExpr = createCurrValueExpr(bindingIndex);
      var statements = [directiveInstance.prop(input.directiveName).set(currValExpr).toStmt()];
      if (calcChangesMap) {
        statements.push(new o.IfStmt(constants_1.DetectChangesVars.changes.identical(o.NULL_EXPR), [constants_1.DetectChangesVars.changes.set(o.literalMap([], new o.MapType(o.importType(identifiers_1.Identifiers.SimpleChange)))).toStmt()]));
        statements.push(constants_1.DetectChangesVars.changes.key(o.literal(input.directiveName)).set(o.importExpr(identifiers_1.Identifiers.SimpleChange).instantiate([fieldExpr, currValExpr])).toStmt());
      }
      if (isOnPushComp) {
        statements.push(constants_1.DetectChangesVars.changed.set(o.literal(true)).toStmt());
      }
      if (view.genConfig.logBindingUpdate) {
        statements.push(logBindingUpdateStmt(compileElement.renderNode, input.directiveName, currValExpr));
      }
      bind(view, currValExpr, fieldExpr, input.value, view.componentContext, statements, detectChangesInInputsMethod);
    });
    if (isOnPushComp) {
      detectChangesInInputsMethod.addStmt(new o.IfStmt(constants_1.DetectChangesVars.changed, [compileElement.appElement.prop('componentView').callMethod('markAsCheckOnce', []).toStmt()]));
    }
  }
  exports.bindDirectiveInputs = bindDirectiveInputs;
  function logBindingUpdateStmt(renderNode, propName, value) {
    return o.THIS_EXPR.prop('renderer').callMethod('setBindingDebugInfo', [renderNode, o.literal("ng-reflect-" + util_1.camelCaseToDashCase(propName)), value.isBlank().conditional(o.NULL_EXPR, value.callMethod('toString', []))]).toStmt();
  }
  return module.exports;
});

System.registerDynamic("@angular/compiler/src/view_compiler/compile_method.js", ["../../src/facade/lang", "../../src/facade/collection", "../output/output_ast"], true, function($__require, exports, module) {
  "use strict";
  ;
  var define,
      global = this,
      GLOBAL = this;
  var lang_1 = $__require('../../src/facade/lang');
  var collection_1 = $__require('../../src/facade/collection');
  var o = $__require('../output/output_ast');
  var _DebugState = (function() {
    function _DebugState(nodeIndex, sourceAst) {
      this.nodeIndex = nodeIndex;
      this.sourceAst = sourceAst;
    }
    return _DebugState;
  }());
  var NULL_DEBUG_STATE = new _DebugState(null, null);
  var CompileMethod = (function() {
    function CompileMethod(_view) {
      this._view = _view;
      this._newState = NULL_DEBUG_STATE;
      this._currState = NULL_DEBUG_STATE;
      this._bodyStatements = [];
      this._debugEnabled = this._view.genConfig.genDebugInfo;
    }
    CompileMethod.prototype._updateDebugContextIfNeeded = function() {
      if (this._newState.nodeIndex !== this._currState.nodeIndex || this._newState.sourceAst !== this._currState.sourceAst) {
        var expr = this._updateDebugContext(this._newState);
        if (lang_1.isPresent(expr)) {
          this._bodyStatements.push(expr.toStmt());
        }
      }
    };
    CompileMethod.prototype._updateDebugContext = function(newState) {
      this._currState = this._newState = newState;
      if (this._debugEnabled) {
        var sourceLocation = lang_1.isPresent(newState.sourceAst) ? newState.sourceAst.sourceSpan.start : null;
        return o.THIS_EXPR.callMethod('debug', [o.literal(newState.nodeIndex), lang_1.isPresent(sourceLocation) ? o.literal(sourceLocation.line) : o.NULL_EXPR, lang_1.isPresent(sourceLocation) ? o.literal(sourceLocation.col) : o.NULL_EXPR]);
      } else {
        return null;
      }
    };
    CompileMethod.prototype.resetDebugInfoExpr = function(nodeIndex, templateAst) {
      var res = this._updateDebugContext(new _DebugState(nodeIndex, templateAst));
      return lang_1.isPresent(res) ? res : o.NULL_EXPR;
    };
    CompileMethod.prototype.resetDebugInfo = function(nodeIndex, templateAst) {
      this._newState = new _DebugState(nodeIndex, templateAst);
    };
    CompileMethod.prototype.addStmt = function(stmt) {
      this._updateDebugContextIfNeeded();
      this._bodyStatements.push(stmt);
    };
    CompileMethod.prototype.addStmts = function(stmts) {
      this._updateDebugContextIfNeeded();
      collection_1.ListWrapper.addAll(this._bodyStatements, stmts);
    };
    CompileMethod.prototype.finish = function() {
      return this._bodyStatements;
    };
    CompileMethod.prototype.isEmpty = function() {
      return this._bodyStatements.length === 0;
    };
    return CompileMethod;
  }());
  exports.CompileMethod = CompileMethod;
  return module.exports;
});

System.registerDynamic("@angular/compiler/src/view_compiler/expression_converter.js", ["../../src/facade/exceptions", "../../src/facade/lang", "../output/output_ast", "../identifiers"], true, function($__require, exports, module) {
  "use strict";
  ;
  var define,
      global = this,
      GLOBAL = this;
  var exceptions_1 = $__require('../../src/facade/exceptions');
  var lang_1 = $__require('../../src/facade/lang');
  var o = $__require('../output/output_ast');
  var identifiers_1 = $__require('../identifiers');
  var IMPLICIT_RECEIVER = o.variable('#implicit');
  var ExpressionWithWrappedValueInfo = (function() {
    function ExpressionWithWrappedValueInfo(expression, needsValueUnwrapper) {
      this.expression = expression;
      this.needsValueUnwrapper = needsValueUnwrapper;
    }
    return ExpressionWithWrappedValueInfo;
  }());
  exports.ExpressionWithWrappedValueInfo = ExpressionWithWrappedValueInfo;
  function convertCdExpressionToIr(nameResolver, implicitReceiver, expression, valueUnwrapper) {
    var visitor = new _AstToIrVisitor(nameResolver, implicitReceiver, valueUnwrapper);
    var irAst = expression.visit(visitor, _Mode.Expression);
    return new ExpressionWithWrappedValueInfo(irAst, visitor.needsValueUnwrapper);
  }
  exports.convertCdExpressionToIr = convertCdExpressionToIr;
  function convertCdStatementToIr(nameResolver, implicitReceiver, stmt) {
    var visitor = new _AstToIrVisitor(nameResolver, implicitReceiver, null);
    var statements = [];
    flattenStatements(stmt.visit(visitor, _Mode.Statement), statements);
    return statements;
  }
  exports.convertCdStatementToIr = convertCdStatementToIr;
  var _Mode;
  (function(_Mode) {
    _Mode[_Mode["Statement"] = 0] = "Statement";
    _Mode[_Mode["Expression"] = 1] = "Expression";
  })(_Mode || (_Mode = {}));
  function ensureStatementMode(mode, ast) {
    if (mode !== _Mode.Statement) {
      throw new exceptions_1.BaseException("Expected a statement, but saw " + ast);
    }
  }
  function ensureExpressionMode(mode, ast) {
    if (mode !== _Mode.Expression) {
      throw new exceptions_1.BaseException("Expected an expression, but saw " + ast);
    }
  }
  function convertToStatementIfNeeded(mode, expr) {
    if (mode === _Mode.Statement) {
      return expr.toStmt();
    } else {
      return expr;
    }
  }
  var _AstToIrVisitor = (function() {
    function _AstToIrVisitor(_nameResolver, _implicitReceiver, _valueUnwrapper) {
      this._nameResolver = _nameResolver;
      this._implicitReceiver = _implicitReceiver;
      this._valueUnwrapper = _valueUnwrapper;
      this.needsValueUnwrapper = false;
    }
    _AstToIrVisitor.prototype.visitBinary = function(ast, mode) {
      var op;
      switch (ast.operation) {
        case '+':
          op = o.BinaryOperator.Plus;
          break;
        case '-':
          op = o.BinaryOperator.Minus;
          break;
        case '*':
          op = o.BinaryOperator.Multiply;
          break;
        case '/':
          op = o.BinaryOperator.Divide;
          break;
        case '%':
          op = o.BinaryOperator.Modulo;
          break;
        case '&&':
          op = o.BinaryOperator.And;
          break;
        case '||':
          op = o.BinaryOperator.Or;
          break;
        case '==':
          op = o.BinaryOperator.Equals;
          break;
        case '!=':
          op = o.BinaryOperator.NotEquals;
          break;
        case '===':
          op = o.BinaryOperator.Identical;
          break;
        case '!==':
          op = o.BinaryOperator.NotIdentical;
          break;
        case '<':
          op = o.BinaryOperator.Lower;
          break;
        case '>':
          op = o.BinaryOperator.Bigger;
          break;
        case '<=':
          op = o.BinaryOperator.LowerEquals;
          break;
        case '>=':
          op = o.BinaryOperator.BiggerEquals;
          break;
        default:
          throw new exceptions_1.BaseException("Unsupported operation " + ast.operation);
      }
      return convertToStatementIfNeeded(mode, new o.BinaryOperatorExpr(op, ast.left.visit(this, _Mode.Expression), ast.right.visit(this, _Mode.Expression)));
    };
    _AstToIrVisitor.prototype.visitChain = function(ast, mode) {
      ensureStatementMode(mode, ast);
      return this.visitAll(ast.expressions, mode);
    };
    _AstToIrVisitor.prototype.visitConditional = function(ast, mode) {
      var value = ast.condition.visit(this, _Mode.Expression);
      return convertToStatementIfNeeded(mode, value.conditional(ast.trueExp.visit(this, _Mode.Expression), ast.falseExp.visit(this, _Mode.Expression)));
    };
    _AstToIrVisitor.prototype.visitPipe = function(ast, mode) {
      var input = ast.exp.visit(this, _Mode.Expression);
      var args = this.visitAll(ast.args, _Mode.Expression);
      var value = this._nameResolver.callPipe(ast.name, input, args);
      this.needsValueUnwrapper = true;
      return convertToStatementIfNeeded(mode, this._valueUnwrapper.callMethod('unwrap', [value]));
    };
    _AstToIrVisitor.prototype.visitFunctionCall = function(ast, mode) {
      return convertToStatementIfNeeded(mode, ast.target.visit(this, _Mode.Expression).callFn(this.visitAll(ast.args, _Mode.Expression)));
    };
    _AstToIrVisitor.prototype.visitImplicitReceiver = function(ast, mode) {
      ensureExpressionMode(mode, ast);
      return IMPLICIT_RECEIVER;
    };
    _AstToIrVisitor.prototype.visitInterpolation = function(ast, mode) {
      ensureExpressionMode(mode, ast);
      var args = [o.literal(ast.expressions.length)];
      for (var i = 0; i < ast.strings.length - 1; i++) {
        args.push(o.literal(ast.strings[i]));
        args.push(ast.expressions[i].visit(this, _Mode.Expression));
      }
      args.push(o.literal(ast.strings[ast.strings.length - 1]));
      return o.importExpr(identifiers_1.Identifiers.interpolate).callFn(args);
    };
    _AstToIrVisitor.prototype.visitKeyedRead = function(ast, mode) {
      return convertToStatementIfNeeded(mode, ast.obj.visit(this, _Mode.Expression).key(ast.key.visit(this, _Mode.Expression)));
    };
    _AstToIrVisitor.prototype.visitKeyedWrite = function(ast, mode) {
      var obj = ast.obj.visit(this, _Mode.Expression);
      var key = ast.key.visit(this, _Mode.Expression);
      var value = ast.value.visit(this, _Mode.Expression);
      return convertToStatementIfNeeded(mode, obj.key(key).set(value));
    };
    _AstToIrVisitor.prototype.visitLiteralArray = function(ast, mode) {
      return convertToStatementIfNeeded(mode, this._nameResolver.createLiteralArray(this.visitAll(ast.expressions, mode)));
    };
    _AstToIrVisitor.prototype.visitLiteralMap = function(ast, mode) {
      var parts = [];
      for (var i = 0; i < ast.keys.length; i++) {
        parts.push([ast.keys[i], ast.values[i].visit(this, _Mode.Expression)]);
      }
      return convertToStatementIfNeeded(mode, this._nameResolver.createLiteralMap(parts));
    };
    _AstToIrVisitor.prototype.visitLiteralPrimitive = function(ast, mode) {
      return convertToStatementIfNeeded(mode, o.literal(ast.value));
    };
    _AstToIrVisitor.prototype.visitMethodCall = function(ast, mode) {
      var args = this.visitAll(ast.args, _Mode.Expression);
      var result = null;
      var receiver = ast.receiver.visit(this, _Mode.Expression);
      if (receiver === IMPLICIT_RECEIVER) {
        var varExpr = this._nameResolver.getLocal(ast.name);
        if (lang_1.isPresent(varExpr)) {
          result = varExpr.callFn(args);
        } else {
          receiver = this._implicitReceiver;
        }
      }
      if (lang_1.isBlank(result)) {
        result = receiver.callMethod(ast.name, args);
      }
      return convertToStatementIfNeeded(mode, result);
    };
    _AstToIrVisitor.prototype.visitPrefixNot = function(ast, mode) {
      return convertToStatementIfNeeded(mode, o.not(ast.expression.visit(this, _Mode.Expression)));
    };
    _AstToIrVisitor.prototype.visitPropertyRead = function(ast, mode) {
      var result = null;
      var receiver = ast.receiver.visit(this, _Mode.Expression);
      if (receiver === IMPLICIT_RECEIVER) {
        result = this._nameResolver.getLocal(ast.name);
        if (lang_1.isBlank(result)) {
          receiver = this._implicitReceiver;
        }
      }
      if (lang_1.isBlank(result)) {
        result = receiver.prop(ast.name);
      }
      return convertToStatementIfNeeded(mode, result);
    };
    _AstToIrVisitor.prototype.visitPropertyWrite = function(ast, mode) {
      var receiver = ast.receiver.visit(this, _Mode.Expression);
      if (receiver === IMPLICIT_RECEIVER) {
        var varExpr = this._nameResolver.getLocal(ast.name);
        if (lang_1.isPresent(varExpr)) {
          throw new exceptions_1.BaseException('Cannot assign to a reference or variable!');
        }
        receiver = this._implicitReceiver;
      }
      return convertToStatementIfNeeded(mode, receiver.prop(ast.name).set(ast.value.visit(this, _Mode.Expression)));
    };
    _AstToIrVisitor.prototype.visitSafePropertyRead = function(ast, mode) {
      var receiver = ast.receiver.visit(this, _Mode.Expression);
      return convertToStatementIfNeeded(mode, receiver.isBlank().conditional(o.NULL_EXPR, receiver.prop(ast.name)));
    };
    _AstToIrVisitor.prototype.visitSafeMethodCall = function(ast, mode) {
      var receiver = ast.receiver.visit(this, _Mode.Expression);
      var args = this.visitAll(ast.args, _Mode.Expression);
      return convertToStatementIfNeeded(mode, receiver.isBlank().conditional(o.NULL_EXPR, receiver.callMethod(ast.name, args)));
    };
    _AstToIrVisitor.prototype.visitAll = function(asts, mode) {
      var _this = this;
      return asts.map(function(ast) {
        return ast.visit(_this, mode);
      });
    };
    _AstToIrVisitor.prototype.visitQuote = function(ast, mode) {
      throw new exceptions_1.BaseException('Quotes are not supported for evaluation!');
    };
    return _AstToIrVisitor;
  }());
  function flattenStatements(arg, output) {
    if (lang_1.isArray(arg)) {
      arg.forEach(function(entry) {
        return flattenStatements(entry, output);
      });
    } else {
      output.push(arg);
    }
  }
  return module.exports;
});

System.registerDynamic("@angular/compiler/src/view_compiler/compile_binding.js", [], true, function($__require, exports, module) {
  "use strict";
  ;
  var define,
      global = this,
      GLOBAL = this;
  var CompileBinding = (function() {
    function CompileBinding(node, sourceAst) {
      this.node = node;
      this.sourceAst = sourceAst;
    }
    return CompileBinding;
  }());
  exports.CompileBinding = CompileBinding;
  return module.exports;
});

System.registerDynamic("@angular/compiler/src/view_compiler/event_binder.js", ["../../src/facade/lang", "../../src/facade/collection", "./constants", "../output/output_ast", "./compile_method", "./expression_converter", "./compile_binding"], true, function($__require, exports, module) {
  "use strict";
  ;
  var define,
      global = this,
      GLOBAL = this;
  var lang_1 = $__require('../../src/facade/lang');
  var collection_1 = $__require('../../src/facade/collection');
  var constants_1 = $__require('./constants');
  var o = $__require('../output/output_ast');
  var compile_method_1 = $__require('./compile_method');
  var expression_converter_1 = $__require('./expression_converter');
  var compile_binding_1 = $__require('./compile_binding');
  var CompileEventListener = (function() {
    function CompileEventListener(compileElement, eventTarget, eventName, listenerIndex) {
      this.compileElement = compileElement;
      this.eventTarget = eventTarget;
      this.eventName = eventName;
      this._hasComponentHostListener = false;
      this._actionResultExprs = [];
      this._method = new compile_method_1.CompileMethod(compileElement.view);
      this._methodName = "_handle_" + santitizeEventName(eventName) + "_" + compileElement.nodeIndex + "_" + listenerIndex;
      this._eventParam = new o.FnParam(constants_1.EventHandlerVars.event.name, o.importType(this.compileElement.view.genConfig.renderTypes.renderEvent));
    }
    CompileEventListener.getOrCreate = function(compileElement, eventTarget, eventName, targetEventListeners) {
      var listener = targetEventListeners.find(function(listener) {
        return listener.eventTarget == eventTarget && listener.eventName == eventName;
      });
      if (lang_1.isBlank(listener)) {
        listener = new CompileEventListener(compileElement, eventTarget, eventName, targetEventListeners.length);
        targetEventListeners.push(listener);
      }
      return listener;
    };
    CompileEventListener.prototype.addAction = function(hostEvent, directive, directiveInstance) {
      if (lang_1.isPresent(directive) && directive.isComponent) {
        this._hasComponentHostListener = true;
      }
      this._method.resetDebugInfo(this.compileElement.nodeIndex, hostEvent);
      var context = lang_1.isPresent(directiveInstance) ? directiveInstance : this.compileElement.view.componentContext;
      var actionStmts = expression_converter_1.convertCdStatementToIr(this.compileElement.view, context, hostEvent.handler);
      var lastIndex = actionStmts.length - 1;
      if (lastIndex >= 0) {
        var lastStatement = actionStmts[lastIndex];
        var returnExpr = convertStmtIntoExpression(lastStatement);
        var preventDefaultVar = o.variable("pd_" + this._actionResultExprs.length);
        this._actionResultExprs.push(preventDefaultVar);
        if (lang_1.isPresent(returnExpr)) {
          actionStmts[lastIndex] = preventDefaultVar.set(returnExpr.cast(o.DYNAMIC_TYPE).notIdentical(o.literal(false))).toDeclStmt(null, [o.StmtModifier.Final]);
        }
      }
      this._method.addStmts(actionStmts);
    };
    CompileEventListener.prototype.finishMethod = function() {
      var markPathToRootStart = this._hasComponentHostListener ? this.compileElement.appElement.prop('componentView') : o.THIS_EXPR;
      var resultExpr = o.literal(true);
      this._actionResultExprs.forEach(function(expr) {
        resultExpr = resultExpr.and(expr);
      });
      var stmts = [markPathToRootStart.callMethod('markPathToRootAsCheckOnce', []).toStmt()].concat(this._method.finish()).concat([new o.ReturnStatement(resultExpr)]);
      this.compileElement.view.eventHandlerMethods.push(new o.ClassMethod(this._methodName, [this._eventParam], stmts, o.BOOL_TYPE, [o.StmtModifier.Private]));
    };
    CompileEventListener.prototype.listenToRenderer = function() {
      var listenExpr;
      var eventListener = o.THIS_EXPR.callMethod('eventHandler', [o.THIS_EXPR.prop(this._methodName).callMethod(o.BuiltinMethod.bind, [o.THIS_EXPR])]);
      if (lang_1.isPresent(this.eventTarget)) {
        listenExpr = constants_1.ViewProperties.renderer.callMethod('listenGlobal', [o.literal(this.eventTarget), o.literal(this.eventName), eventListener]);
      } else {
        listenExpr = constants_1.ViewProperties.renderer.callMethod('listen', [this.compileElement.renderNode, o.literal(this.eventName), eventListener]);
      }
      var disposable = o.variable("disposable_" + this.compileElement.view.disposables.length);
      this.compileElement.view.disposables.push(disposable);
      this.compileElement.view.createMethod.addStmt(disposable.set(listenExpr).toDeclStmt(o.FUNCTION_TYPE, [o.StmtModifier.Private]));
    };
    CompileEventListener.prototype.listenToDirective = function(directiveInstance, observablePropName) {
      var subscription = o.variable("subscription_" + this.compileElement.view.subscriptions.length);
      this.compileElement.view.subscriptions.push(subscription);
      var eventListener = o.THIS_EXPR.callMethod('eventHandler', [o.THIS_EXPR.prop(this._methodName).callMethod(o.BuiltinMethod.bind, [o.THIS_EXPR])]);
      this.compileElement.view.createMethod.addStmt(subscription.set(directiveInstance.prop(observablePropName).callMethod(o.BuiltinMethod.SubscribeObservable, [eventListener])).toDeclStmt(null, [o.StmtModifier.Final]));
    };
    return CompileEventListener;
  }());
  exports.CompileEventListener = CompileEventListener;
  function collectEventListeners(hostEvents, dirs, compileElement) {
    var eventListeners = [];
    hostEvents.forEach(function(hostEvent) {
      compileElement.view.bindings.push(new compile_binding_1.CompileBinding(compileElement, hostEvent));
      var listener = CompileEventListener.getOrCreate(compileElement, hostEvent.target, hostEvent.name, eventListeners);
      listener.addAction(hostEvent, null, null);
    });
    collection_1.ListWrapper.forEachWithIndex(dirs, function(directiveAst, i) {
      var directiveInstance = compileElement.directiveInstances[i];
      directiveAst.hostEvents.forEach(function(hostEvent) {
        compileElement.view.bindings.push(new compile_binding_1.CompileBinding(compileElement, hostEvent));
        var listener = CompileEventListener.getOrCreate(compileElement, hostEvent.target, hostEvent.name, eventListeners);
        listener.addAction(hostEvent, directiveAst.directive, directiveInstance);
      });
    });
    eventListeners.forEach(function(listener) {
      return listener.finishMethod();
    });
    return eventListeners;
  }
  exports.collectEventListeners = collectEventListeners;
  function bindDirectiveOutputs(directiveAst, directiveInstance, eventListeners) {
    collection_1.StringMapWrapper.forEach(directiveAst.directive.outputs, function(eventName, observablePropName) {
      eventListeners.filter(function(listener) {
        return listener.eventName == eventName;
      }).forEach(function(listener) {
        listener.listenToDirective(directiveInstance, observablePropName);
      });
    });
  }
  exports.bindDirectiveOutputs = bindDirectiveOutputs;
  function bindRenderOutputs(eventListeners) {
    eventListeners.forEach(function(listener) {
      return listener.listenToRenderer();
    });
  }
  exports.bindRenderOutputs = bindRenderOutputs;
  function convertStmtIntoExpression(stmt) {
    if (stmt instanceof o.ExpressionStatement) {
      return stmt.expr;
    } else if (stmt instanceof o.ReturnStatement) {
      return stmt.value;
    }
    return null;
  }
  function santitizeEventName(name) {
    return lang_1.StringWrapper.replaceAll(name, /[^a-zA-Z_]/g, '_');
  }
  return module.exports;
});

System.registerDynamic("@angular/compiler/src/output/output_ast.js", ["../../src/facade/lang"], true, function($__require, exports, module) {
  "use strict";
  ;
  var define,
      global = this,
      GLOBAL = this;
  var __extends = (this && this.__extends) || function(d, b) {
    for (var p in b)
      if (b.hasOwnProperty(p))
        d[p] = b[p];
    function __() {
      this.constructor = d;
    }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
  };
  var lang_1 = $__require('../../src/facade/lang');
  (function(TypeModifier) {
    TypeModifier[TypeModifier["Const"] = 0] = "Const";
  })(exports.TypeModifier || (exports.TypeModifier = {}));
  var TypeModifier = exports.TypeModifier;
  var Type = (function() {
    function Type(modifiers) {
      if (modifiers === void 0) {
        modifiers = null;
      }
      this.modifiers = modifiers;
      if (lang_1.isBlank(modifiers)) {
        this.modifiers = [];
      }
    }
    Type.prototype.hasModifier = function(modifier) {
      return this.modifiers.indexOf(modifier) !== -1;
    };
    return Type;
  }());
  exports.Type = Type;
  (function(BuiltinTypeName) {
    BuiltinTypeName[BuiltinTypeName["Dynamic"] = 0] = "Dynamic";
    BuiltinTypeName[BuiltinTypeName["Bool"] = 1] = "Bool";
    BuiltinTypeName[BuiltinTypeName["String"] = 2] = "String";
    BuiltinTypeName[BuiltinTypeName["Int"] = 3] = "Int";
    BuiltinTypeName[BuiltinTypeName["Number"] = 4] = "Number";
    BuiltinTypeName[BuiltinTypeName["Function"] = 5] = "Function";
  })(exports.BuiltinTypeName || (exports.BuiltinTypeName = {}));
  var BuiltinTypeName = exports.BuiltinTypeName;
  var BuiltinType = (function(_super) {
    __extends(BuiltinType, _super);
    function BuiltinType(name, modifiers) {
      if (modifiers === void 0) {
        modifiers = null;
      }
      _super.call(this, modifiers);
      this.name = name;
    }
    BuiltinType.prototype.visitType = function(visitor, context) {
      return visitor.visitBuiltintType(this, context);
    };
    return BuiltinType;
  }(Type));
  exports.BuiltinType = BuiltinType;
  var ExternalType = (function(_super) {
    __extends(ExternalType, _super);
    function ExternalType(value, typeParams, modifiers) {
      if (typeParams === void 0) {
        typeParams = null;
      }
      if (modifiers === void 0) {
        modifiers = null;
      }
      _super.call(this, modifiers);
      this.value = value;
      this.typeParams = typeParams;
    }
    ExternalType.prototype.visitType = function(visitor, context) {
      return visitor.visitExternalType(this, context);
    };
    return ExternalType;
  }(Type));
  exports.ExternalType = ExternalType;
  var ArrayType = (function(_super) {
    __extends(ArrayType, _super);
    function ArrayType(of, modifiers) {
      if (modifiers === void 0) {
        modifiers = null;
      }
      _super.call(this, modifiers);
      this.of = of;
    }
    ArrayType.prototype.visitType = function(visitor, context) {
      return visitor.visitArrayType(this, context);
    };
    return ArrayType;
  }(Type));
  exports.ArrayType = ArrayType;
  var MapType = (function(_super) {
    __extends(MapType, _super);
    function MapType(valueType, modifiers) {
      if (modifiers === void 0) {
        modifiers = null;
      }
      _super.call(this, modifiers);
      this.valueType = valueType;
    }
    MapType.prototype.visitType = function(visitor, context) {
      return visitor.visitMapType(this, context);
    };
    return MapType;
  }(Type));
  exports.MapType = MapType;
  exports.DYNAMIC_TYPE = new BuiltinType(BuiltinTypeName.Dynamic);
  exports.BOOL_TYPE = new BuiltinType(BuiltinTypeName.Bool);
  exports.INT_TYPE = new BuiltinType(BuiltinTypeName.Int);
  exports.NUMBER_TYPE = new BuiltinType(BuiltinTypeName.Number);
  exports.STRING_TYPE = new BuiltinType(BuiltinTypeName.String);
  exports.FUNCTION_TYPE = new BuiltinType(BuiltinTypeName.Function);
  (function(BinaryOperator) {
    BinaryOperator[BinaryOperator["Equals"] = 0] = "Equals";
    BinaryOperator[BinaryOperator["NotEquals"] = 1] = "NotEquals";
    BinaryOperator[BinaryOperator["Identical"] = 2] = "Identical";
    BinaryOperator[BinaryOperator["NotIdentical"] = 3] = "NotIdentical";
    BinaryOperator[BinaryOperator["Minus"] = 4] = "Minus";
    BinaryOperator[BinaryOperator["Plus"] = 5] = "Plus";
    BinaryOperator[BinaryOperator["Divide"] = 6] = "Divide";
    BinaryOperator[BinaryOperator["Multiply"] = 7] = "Multiply";
    BinaryOperator[BinaryOperator["Modulo"] = 8] = "Modulo";
    BinaryOperator[BinaryOperator["And"] = 9] = "And";
    BinaryOperator[BinaryOperator["Or"] = 10] = "Or";
    BinaryOperator[BinaryOperator["Lower"] = 11] = "Lower";
    BinaryOperator[BinaryOperator["LowerEquals"] = 12] = "LowerEquals";
    BinaryOperator[BinaryOperator["Bigger"] = 13] = "Bigger";
    BinaryOperator[BinaryOperator["BiggerEquals"] = 14] = "BiggerEquals";
  })(exports.BinaryOperator || (exports.BinaryOperator = {}));
  var BinaryOperator = exports.BinaryOperator;
  var Expression = (function() {
    function Expression(type) {
      this.type = type;
    }
    Expression.prototype.prop = function(name) {
      return new ReadPropExpr(this, name);
    };
    Expression.prototype.key = function(index, type) {
      if (type === void 0) {
        type = null;
      }
      return new ReadKeyExpr(this, index, type);
    };
    Expression.prototype.callMethod = function(name, params) {
      return new InvokeMethodExpr(this, name, params);
    };
    Expression.prototype.callFn = function(params) {
      return new InvokeFunctionExpr(this, params);
    };
    Expression.prototype.instantiate = function(params, type) {
      if (type === void 0) {
        type = null;
      }
      return new InstantiateExpr(this, params, type);
    };
    Expression.prototype.conditional = function(trueCase, falseCase) {
      if (falseCase === void 0) {
        falseCase = null;
      }
      return new ConditionalExpr(this, trueCase, falseCase);
    };
    Expression.prototype.equals = function(rhs) {
      return new BinaryOperatorExpr(BinaryOperator.Equals, this, rhs);
    };
    Expression.prototype.notEquals = function(rhs) {
      return new BinaryOperatorExpr(BinaryOperator.NotEquals, this, rhs);
    };
    Expression.prototype.identical = function(rhs) {
      return new BinaryOperatorExpr(BinaryOperator.Identical, this, rhs);
    };
    Expression.prototype.notIdentical = function(rhs) {
      return new BinaryOperatorExpr(BinaryOperator.NotIdentical, this, rhs);
    };
    Expression.prototype.minus = function(rhs) {
      return new BinaryOperatorExpr(BinaryOperator.Minus, this, rhs);
    };
    Expression.prototype.plus = function(rhs) {
      return new BinaryOperatorExpr(BinaryOperator.Plus, this, rhs);
    };
    Expression.prototype.divide = function(rhs) {
      return new BinaryOperatorExpr(BinaryOperator.Divide, this, rhs);
    };
    Expression.prototype.multiply = function(rhs) {
      return new BinaryOperatorExpr(BinaryOperator.Multiply, this, rhs);
    };
    Expression.prototype.modulo = function(rhs) {
      return new BinaryOperatorExpr(BinaryOperator.Modulo, this, rhs);
    };
    Expression.prototype.and = function(rhs) {
      return new BinaryOperatorExpr(BinaryOperator.And, this, rhs);
    };
    Expression.prototype.or = function(rhs) {
      return new BinaryOperatorExpr(BinaryOperator.Or, this, rhs);
    };
    Expression.prototype.lower = function(rhs) {
      return new BinaryOperatorExpr(BinaryOperator.Lower, this, rhs);
    };
    Expression.prototype.lowerEquals = function(rhs) {
      return new BinaryOperatorExpr(BinaryOperator.LowerEquals, this, rhs);
    };
    Expression.prototype.bigger = function(rhs) {
      return new BinaryOperatorExpr(BinaryOperator.Bigger, this, rhs);
    };
    Expression.prototype.biggerEquals = function(rhs) {
      return new BinaryOperatorExpr(BinaryOperator.BiggerEquals, this, rhs);
    };
    Expression.prototype.isBlank = function() {
      return this.equals(exports.NULL_EXPR);
    };
    Expression.prototype.cast = function(type) {
      return new CastExpr(this, type);
    };
    Expression.prototype.toStmt = function() {
      return new ExpressionStatement(this);
    };
    return Expression;
  }());
  exports.Expression = Expression;
  (function(BuiltinVar) {
    BuiltinVar[BuiltinVar["This"] = 0] = "This";
    BuiltinVar[BuiltinVar["Super"] = 1] = "Super";
    BuiltinVar[BuiltinVar["CatchError"] = 2] = "CatchError";
    BuiltinVar[BuiltinVar["CatchStack"] = 3] = "CatchStack";
  })(exports.BuiltinVar || (exports.BuiltinVar = {}));
  var BuiltinVar = exports.BuiltinVar;
  var ReadVarExpr = (function(_super) {
    __extends(ReadVarExpr, _super);
    function ReadVarExpr(name, type) {
      if (type === void 0) {
        type = null;
      }
      _super.call(this, type);
      if (lang_1.isString(name)) {
        this.name = name;
        this.builtin = null;
      } else {
        this.name = null;
        this.builtin = name;
      }
    }
    ReadVarExpr.prototype.visitExpression = function(visitor, context) {
      return visitor.visitReadVarExpr(this, context);
    };
    ReadVarExpr.prototype.set = function(value) {
      return new WriteVarExpr(this.name, value);
    };
    return ReadVarExpr;
  }(Expression));
  exports.ReadVarExpr = ReadVarExpr;
  var WriteVarExpr = (function(_super) {
    __extends(WriteVarExpr, _super);
    function WriteVarExpr(name, value, type) {
      if (type === void 0) {
        type = null;
      }
      _super.call(this, lang_1.isPresent(type) ? type : value.type);
      this.name = name;
      this.value = value;
    }
    WriteVarExpr.prototype.visitExpression = function(visitor, context) {
      return visitor.visitWriteVarExpr(this, context);
    };
    WriteVarExpr.prototype.toDeclStmt = function(type, modifiers) {
      if (type === void 0) {
        type = null;
      }
      if (modifiers === void 0) {
        modifiers = null;
      }
      return new DeclareVarStmt(this.name, this.value, type, modifiers);
    };
    return WriteVarExpr;
  }(Expression));
  exports.WriteVarExpr = WriteVarExpr;
  var WriteKeyExpr = (function(_super) {
    __extends(WriteKeyExpr, _super);
    function WriteKeyExpr(receiver, index, value, type) {
      if (type === void 0) {
        type = null;
      }
      _super.call(this, lang_1.isPresent(type) ? type : value.type);
      this.receiver = receiver;
      this.index = index;
      this.value = value;
    }
    WriteKeyExpr.prototype.visitExpression = function(visitor, context) {
      return visitor.visitWriteKeyExpr(this, context);
    };
    return WriteKeyExpr;
  }(Expression));
  exports.WriteKeyExpr = WriteKeyExpr;
  var WritePropExpr = (function(_super) {
    __extends(WritePropExpr, _super);
    function WritePropExpr(receiver, name, value, type) {
      if (type === void 0) {
        type = null;
      }
      _super.call(this, lang_1.isPresent(type) ? type : value.type);
      this.receiver = receiver;
      this.name = name;
      this.value = value;
    }
    WritePropExpr.prototype.visitExpression = function(visitor, context) {
      return visitor.visitWritePropExpr(this, context);
    };
    return WritePropExpr;
  }(Expression));
  exports.WritePropExpr = WritePropExpr;
  (function(BuiltinMethod) {
    BuiltinMethod[BuiltinMethod["ConcatArray"] = 0] = "ConcatArray";
    BuiltinMethod[BuiltinMethod["SubscribeObservable"] = 1] = "SubscribeObservable";
    BuiltinMethod[BuiltinMethod["bind"] = 2] = "bind";
  })(exports.BuiltinMethod || (exports.BuiltinMethod = {}));
  var BuiltinMethod = exports.BuiltinMethod;
  var InvokeMethodExpr = (function(_super) {
    __extends(InvokeMethodExpr, _super);
    function InvokeMethodExpr(receiver, method, args, type) {
      if (type === void 0) {
        type = null;
      }
      _super.call(this, type);
      this.receiver = receiver;
      this.args = args;
      if (lang_1.isString(method)) {
        this.name = method;
        this.builtin = null;
      } else {
        this.name = null;
        this.builtin = method;
      }
    }
    InvokeMethodExpr.prototype.visitExpression = function(visitor, context) {
      return visitor.visitInvokeMethodExpr(this, context);
    };
    return InvokeMethodExpr;
  }(Expression));
  exports.InvokeMethodExpr = InvokeMethodExpr;
  var InvokeFunctionExpr = (function(_super) {
    __extends(InvokeFunctionExpr, _super);
    function InvokeFunctionExpr(fn, args, type) {
      if (type === void 0) {
        type = null;
      }
      _super.call(this, type);
      this.fn = fn;
      this.args = args;
    }
    InvokeFunctionExpr.prototype.visitExpression = function(visitor, context) {
      return visitor.visitInvokeFunctionExpr(this, context);
    };
    return InvokeFunctionExpr;
  }(Expression));
  exports.InvokeFunctionExpr = InvokeFunctionExpr;
  var InstantiateExpr = (function(_super) {
    __extends(InstantiateExpr, _super);
    function InstantiateExpr(classExpr, args, type) {
      _super.call(this, type);
      this.classExpr = classExpr;
      this.args = args;
    }
    InstantiateExpr.prototype.visitExpression = function(visitor, context) {
      return visitor.visitInstantiateExpr(this, context);
    };
    return InstantiateExpr;
  }(Expression));
  exports.InstantiateExpr = InstantiateExpr;
  var LiteralExpr = (function(_super) {
    __extends(LiteralExpr, _super);
    function LiteralExpr(value, type) {
      if (type === void 0) {
        type = null;
      }
      _super.call(this, type);
      this.value = value;
    }
    LiteralExpr.prototype.visitExpression = function(visitor, context) {
      return visitor.visitLiteralExpr(this, context);
    };
    return LiteralExpr;
  }(Expression));
  exports.LiteralExpr = LiteralExpr;
  var ExternalExpr = (function(_super) {
    __extends(ExternalExpr, _super);
    function ExternalExpr(value, type, typeParams) {
      if (type === void 0) {
        type = null;
      }
      if (typeParams === void 0) {
        typeParams = null;
      }
      _super.call(this, type);
      this.value = value;
      this.typeParams = typeParams;
    }
    ExternalExpr.prototype.visitExpression = function(visitor, context) {
      return visitor.visitExternalExpr(this, context);
    };
    return ExternalExpr;
  }(Expression));
  exports.ExternalExpr = ExternalExpr;
  var ConditionalExpr = (function(_super) {
    __extends(ConditionalExpr, _super);
    function ConditionalExpr(condition, trueCase, falseCase, type) {
      if (falseCase === void 0) {
        falseCase = null;
      }
      if (type === void 0) {
        type = null;
      }
      _super.call(this, lang_1.isPresent(type) ? type : trueCase.type);
      this.condition = condition;
      this.falseCase = falseCase;
      this.trueCase = trueCase;
    }
    ConditionalExpr.prototype.visitExpression = function(visitor, context) {
      return visitor.visitConditionalExpr(this, context);
    };
    return ConditionalExpr;
  }(Expression));
  exports.ConditionalExpr = ConditionalExpr;
  var NotExpr = (function(_super) {
    __extends(NotExpr, _super);
    function NotExpr(condition) {
      _super.call(this, exports.BOOL_TYPE);
      this.condition = condition;
    }
    NotExpr.prototype.visitExpression = function(visitor, context) {
      return visitor.visitNotExpr(this, context);
    };
    return NotExpr;
  }(Expression));
  exports.NotExpr = NotExpr;
  var CastExpr = (function(_super) {
    __extends(CastExpr, _super);
    function CastExpr(value, type) {
      _super.call(this, type);
      this.value = value;
    }
    CastExpr.prototype.visitExpression = function(visitor, context) {
      return visitor.visitCastExpr(this, context);
    };
    return CastExpr;
  }(Expression));
  exports.CastExpr = CastExpr;
  var FnParam = (function() {
    function FnParam(name, type) {
      if (type === void 0) {
        type = null;
      }
      this.name = name;
      this.type = type;
    }
    return FnParam;
  }());
  exports.FnParam = FnParam;
  var FunctionExpr = (function(_super) {
    __extends(FunctionExpr, _super);
    function FunctionExpr(params, statements, type) {
      if (type === void 0) {
        type = null;
      }
      _super.call(this, type);
      this.params = params;
      this.statements = statements;
    }
    FunctionExpr.prototype.visitExpression = function(visitor, context) {
      return visitor.visitFunctionExpr(this, context);
    };
    FunctionExpr.prototype.toDeclStmt = function(name, modifiers) {
      if (modifiers === void 0) {
        modifiers = null;
      }
      return new DeclareFunctionStmt(name, this.params, this.statements, this.type, modifiers);
    };
    return FunctionExpr;
  }(Expression));
  exports.FunctionExpr = FunctionExpr;
  var BinaryOperatorExpr = (function(_super) {
    __extends(BinaryOperatorExpr, _super);
    function BinaryOperatorExpr(operator, lhs, rhs, type) {
      if (type === void 0) {
        type = null;
      }
      _super.call(this, lang_1.isPresent(type) ? type : lhs.type);
      this.operator = operator;
      this.rhs = rhs;
      this.lhs = lhs;
    }
    BinaryOperatorExpr.prototype.visitExpression = function(visitor, context) {
      return visitor.visitBinaryOperatorExpr(this, context);
    };
    return BinaryOperatorExpr;
  }(Expression));
  exports.BinaryOperatorExpr = BinaryOperatorExpr;
  var ReadPropExpr = (function(_super) {
    __extends(ReadPropExpr, _super);
    function ReadPropExpr(receiver, name, type) {
      if (type === void 0) {
        type = null;
      }
      _super.call(this, type);
      this.receiver = receiver;
      this.name = name;
    }
    ReadPropExpr.prototype.visitExpression = function(visitor, context) {
      return visitor.visitReadPropExpr(this, context);
    };
    ReadPropExpr.prototype.set = function(value) {
      return new WritePropExpr(this.receiver, this.name, value);
    };
    return ReadPropExpr;
  }(Expression));
  exports.ReadPropExpr = ReadPropExpr;
  var ReadKeyExpr = (function(_super) {
    __extends(ReadKeyExpr, _super);
    function ReadKeyExpr(receiver, index, type) {
      if (type === void 0) {
        type = null;
      }
      _super.call(this, type);
      this.receiver = receiver;
      this.index = index;
    }
    ReadKeyExpr.prototype.visitExpression = function(visitor, context) {
      return visitor.visitReadKeyExpr(this, context);
    };
    ReadKeyExpr.prototype.set = function(value) {
      return new WriteKeyExpr(this.receiver, this.index, value);
    };
    return ReadKeyExpr;
  }(Expression));
  exports.ReadKeyExpr = ReadKeyExpr;
  var LiteralArrayExpr = (function(_super) {
    __extends(LiteralArrayExpr, _super);
    function LiteralArrayExpr(entries, type) {
      if (type === void 0) {
        type = null;
      }
      _super.call(this, type);
      this.entries = entries;
    }
    LiteralArrayExpr.prototype.visitExpression = function(visitor, context) {
      return visitor.visitLiteralArrayExpr(this, context);
    };
    return LiteralArrayExpr;
  }(Expression));
  exports.LiteralArrayExpr = LiteralArrayExpr;
  var LiteralMapExpr = (function(_super) {
    __extends(LiteralMapExpr, _super);
    function LiteralMapExpr(entries, type) {
      if (type === void 0) {
        type = null;
      }
      _super.call(this, type);
      this.entries = entries;
      this.valueType = null;
      if (lang_1.isPresent(type)) {
        this.valueType = type.valueType;
      }
    }
    LiteralMapExpr.prototype.visitExpression = function(visitor, context) {
      return visitor.visitLiteralMapExpr(this, context);
    };
    return LiteralMapExpr;
  }(Expression));
  exports.LiteralMapExpr = LiteralMapExpr;
  exports.THIS_EXPR = new ReadVarExpr(BuiltinVar.This);
  exports.SUPER_EXPR = new ReadVarExpr(BuiltinVar.Super);
  exports.CATCH_ERROR_VAR = new ReadVarExpr(BuiltinVar.CatchError);
  exports.CATCH_STACK_VAR = new ReadVarExpr(BuiltinVar.CatchStack);
  exports.NULL_EXPR = new LiteralExpr(null, null);
  (function(StmtModifier) {
    StmtModifier[StmtModifier["Final"] = 0] = "Final";
    StmtModifier[StmtModifier["Private"] = 1] = "Private";
  })(exports.StmtModifier || (exports.StmtModifier = {}));
  var StmtModifier = exports.StmtModifier;
  var Statement = (function() {
    function Statement(modifiers) {
      if (modifiers === void 0) {
        modifiers = null;
      }
      this.modifiers = modifiers;
      if (lang_1.isBlank(modifiers)) {
        this.modifiers = [];
      }
    }
    Statement.prototype.hasModifier = function(modifier) {
      return this.modifiers.indexOf(modifier) !== -1;
    };
    return Statement;
  }());
  exports.Statement = Statement;
  var DeclareVarStmt = (function(_super) {
    __extends(DeclareVarStmt, _super);
    function DeclareVarStmt(name, value, type, modifiers) {
      if (type === void 0) {
        type = null;
      }
      if (modifiers === void 0) {
        modifiers = null;
      }
      _super.call(this, modifiers);
      this.name = name;
      this.value = value;
      this.type = lang_1.isPresent(type) ? type : value.type;
    }
    DeclareVarStmt.prototype.visitStatement = function(visitor, context) {
      return visitor.visitDeclareVarStmt(this, context);
    };
    return DeclareVarStmt;
  }(Statement));
  exports.DeclareVarStmt = DeclareVarStmt;
  var DeclareFunctionStmt = (function(_super) {
    __extends(DeclareFunctionStmt, _super);
    function DeclareFunctionStmt(name, params, statements, type, modifiers) {
      if (type === void 0) {
        type = null;
      }
      if (modifiers === void 0) {
        modifiers = null;
      }
      _super.call(this, modifiers);
      this.name = name;
      this.params = params;
      this.statements = statements;
      this.type = type;
    }
    DeclareFunctionStmt.prototype.visitStatement = function(visitor, context) {
      return visitor.visitDeclareFunctionStmt(this, context);
    };
    return DeclareFunctionStmt;
  }(Statement));
  exports.DeclareFunctionStmt = DeclareFunctionStmt;
  var ExpressionStatement = (function(_super) {
    __extends(ExpressionStatement, _super);
    function ExpressionStatement(expr) {
      _super.call(this);
      this.expr = expr;
    }
    ExpressionStatement.prototype.visitStatement = function(visitor, context) {
      return visitor.visitExpressionStmt(this, context);
    };
    return ExpressionStatement;
  }(Statement));
  exports.ExpressionStatement = ExpressionStatement;
  var ReturnStatement = (function(_super) {
    __extends(ReturnStatement, _super);
    function ReturnStatement(value) {
      _super.call(this);
      this.value = value;
    }
    ReturnStatement.prototype.visitStatement = function(visitor, context) {
      return visitor.visitReturnStmt(this, context);
    };
    return ReturnStatement;
  }(Statement));
  exports.ReturnStatement = ReturnStatement;
  var AbstractClassPart = (function() {
    function AbstractClassPart(type, modifiers) {
      if (type === void 0) {
        type = null;
      }
      this.type = type;
      this.modifiers = modifiers;
      if (lang_1.isBlank(modifiers)) {
        this.modifiers = [];
      }
    }
    AbstractClassPart.prototype.hasModifier = function(modifier) {
      return this.modifiers.indexOf(modifier) !== -1;
    };
    return AbstractClassPart;
  }());
  exports.AbstractClassPart = AbstractClassPart;
  var ClassField = (function(_super) {
    __extends(ClassField, _super);
    function ClassField(name, type, modifiers) {
      if (type === void 0) {
        type = null;
      }
      if (modifiers === void 0) {
        modifiers = null;
      }
      _super.call(this, type, modifiers);
      this.name = name;
    }
    return ClassField;
  }(AbstractClassPart));
  exports.ClassField = ClassField;
  var ClassMethod = (function(_super) {
    __extends(ClassMethod, _super);
    function ClassMethod(name, params, body, type, modifiers) {
      if (type === void 0) {
        type = null;
      }
      if (modifiers === void 0) {
        modifiers = null;
      }
      _super.call(this, type, modifiers);
      this.name = name;
      this.params = params;
      this.body = body;
    }
    return ClassMethod;
  }(AbstractClassPart));
  exports.ClassMethod = ClassMethod;
  var ClassGetter = (function(_super) {
    __extends(ClassGetter, _super);
    function ClassGetter(name, body, type, modifiers) {
      if (type === void 0) {
        type = null;
      }
      if (modifiers === void 0) {
        modifiers = null;
      }
      _super.call(this, type, modifiers);
      this.name = name;
      this.body = body;
    }
    return ClassGetter;
  }(AbstractClassPart));
  exports.ClassGetter = ClassGetter;
  var ClassStmt = (function(_super) {
    __extends(ClassStmt, _super);
    function ClassStmt(name, parent, fields, getters, constructorMethod, methods, modifiers) {
      if (modifiers === void 0) {
        modifiers = null;
      }
      _super.call(this, modifiers);
      this.name = name;
      this.parent = parent;
      this.fields = fields;
      this.getters = getters;
      this.constructorMethod = constructorMethod;
      this.methods = methods;
    }
    ClassStmt.prototype.visitStatement = function(visitor, context) {
      return visitor.visitDeclareClassStmt(this, context);
    };
    return ClassStmt;
  }(Statement));
  exports.ClassStmt = ClassStmt;
  var IfStmt = (function(_super) {
    __extends(IfStmt, _super);
    function IfStmt(condition, trueCase, falseCase) {
      if (falseCase === void 0) {
        falseCase = [];
      }
      _super.call(this);
      this.condition = condition;
      this.trueCase = trueCase;
      this.falseCase = falseCase;
    }
    IfStmt.prototype.visitStatement = function(visitor, context) {
      return visitor.visitIfStmt(this, context);
    };
    return IfStmt;
  }(Statement));
  exports.IfStmt = IfStmt;
  var CommentStmt = (function(_super) {
    __extends(CommentStmt, _super);
    function CommentStmt(comment) {
      _super.call(this);
      this.comment = comment;
    }
    CommentStmt.prototype.visitStatement = function(visitor, context) {
      return visitor.visitCommentStmt(this, context);
    };
    return CommentStmt;
  }(Statement));
  exports.CommentStmt = CommentStmt;
  var TryCatchStmt = (function(_super) {
    __extends(TryCatchStmt, _super);
    function TryCatchStmt(bodyStmts, catchStmts) {
      _super.call(this);
      this.bodyStmts = bodyStmts;
      this.catchStmts = catchStmts;
    }
    TryCatchStmt.prototype.visitStatement = function(visitor, context) {
      return visitor.visitTryCatchStmt(this, context);
    };
    return TryCatchStmt;
  }(Statement));
  exports.TryCatchStmt = TryCatchStmt;
  var ThrowStmt = (function(_super) {
    __extends(ThrowStmt, _super);
    function ThrowStmt(error) {
      _super.call(this);
      this.error = error;
    }
    ThrowStmt.prototype.visitStatement = function(visitor, context) {
      return visitor.visitThrowStmt(this, context);
    };
    return ThrowStmt;
  }(Statement));
  exports.ThrowStmt = ThrowStmt;
  var ExpressionTransformer = (function() {
    function ExpressionTransformer() {}
    ExpressionTransformer.prototype.visitReadVarExpr = function(ast, context) {
      return ast;
    };
    ExpressionTransformer.prototype.visitWriteVarExpr = function(expr, context) {
      return new WriteVarExpr(expr.name, expr.value.visitExpression(this, context));
    };
    ExpressionTransformer.prototype.visitWriteKeyExpr = function(expr, context) {
      return new WriteKeyExpr(expr.receiver.visitExpression(this, context), expr.index.visitExpression(this, context), expr.value.visitExpression(this, context));
    };
    ExpressionTransformer.prototype.visitWritePropExpr = function(expr, context) {
      return new WritePropExpr(expr.receiver.visitExpression(this, context), expr.name, expr.value.visitExpression(this, context));
    };
    ExpressionTransformer.prototype.visitInvokeMethodExpr = function(ast, context) {
      var method = lang_1.isPresent(ast.builtin) ? ast.builtin : ast.name;
      return new InvokeMethodExpr(ast.receiver.visitExpression(this, context), method, this.visitAllExpressions(ast.args, context), ast.type);
    };
    ExpressionTransformer.prototype.visitInvokeFunctionExpr = function(ast, context) {
      return new InvokeFunctionExpr(ast.fn.visitExpression(this, context), this.visitAllExpressions(ast.args, context), ast.type);
    };
    ExpressionTransformer.prototype.visitInstantiateExpr = function(ast, context) {
      return new InstantiateExpr(ast.classExpr.visitExpression(this, context), this.visitAllExpressions(ast.args, context), ast.type);
    };
    ExpressionTransformer.prototype.visitLiteralExpr = function(ast, context) {
      return ast;
    };
    ExpressionTransformer.prototype.visitExternalExpr = function(ast, context) {
      return ast;
    };
    ExpressionTransformer.prototype.visitConditionalExpr = function(ast, context) {
      return new ConditionalExpr(ast.condition.visitExpression(this, context), ast.trueCase.visitExpression(this, context), ast.falseCase.visitExpression(this, context));
    };
    ExpressionTransformer.prototype.visitNotExpr = function(ast, context) {
      return new NotExpr(ast.condition.visitExpression(this, context));
    };
    ExpressionTransformer.prototype.visitCastExpr = function(ast, context) {
      return new CastExpr(ast.value.visitExpression(this, context), context);
    };
    ExpressionTransformer.prototype.visitFunctionExpr = function(ast, context) {
      return ast;
    };
    ExpressionTransformer.prototype.visitBinaryOperatorExpr = function(ast, context) {
      return new BinaryOperatorExpr(ast.operator, ast.lhs.visitExpression(this, context), ast.rhs.visitExpression(this, context), ast.type);
    };
    ExpressionTransformer.prototype.visitReadPropExpr = function(ast, context) {
      return new ReadPropExpr(ast.receiver.visitExpression(this, context), ast.name, ast.type);
    };
    ExpressionTransformer.prototype.visitReadKeyExpr = function(ast, context) {
      return new ReadKeyExpr(ast.receiver.visitExpression(this, context), ast.index.visitExpression(this, context), ast.type);
    };
    ExpressionTransformer.prototype.visitLiteralArrayExpr = function(ast, context) {
      return new LiteralArrayExpr(this.visitAllExpressions(ast.entries, context));
    };
    ExpressionTransformer.prototype.visitLiteralMapExpr = function(ast, context) {
      var _this = this;
      return new LiteralMapExpr(ast.entries.map(function(entry) {
        return [entry[0], entry[1].visitExpression(_this, context)];
      }));
    };
    ExpressionTransformer.prototype.visitAllExpressions = function(exprs, context) {
      var _this = this;
      return exprs.map(function(expr) {
        return expr.visitExpression(_this, context);
      });
    };
    ExpressionTransformer.prototype.visitDeclareVarStmt = function(stmt, context) {
      return new DeclareVarStmt(stmt.name, stmt.value.visitExpression(this, context), stmt.type, stmt.modifiers);
    };
    ExpressionTransformer.prototype.visitDeclareFunctionStmt = function(stmt, context) {
      return stmt;
    };
    ExpressionTransformer.prototype.visitExpressionStmt = function(stmt, context) {
      return new ExpressionStatement(stmt.expr.visitExpression(this, context));
    };
    ExpressionTransformer.prototype.visitReturnStmt = function(stmt, context) {
      return new ReturnStatement(stmt.value.visitExpression(this, context));
    };
    ExpressionTransformer.prototype.visitDeclareClassStmt = function(stmt, context) {
      return stmt;
    };
    ExpressionTransformer.prototype.visitIfStmt = function(stmt, context) {
      return new IfStmt(stmt.condition.visitExpression(this, context), this.visitAllStatements(stmt.trueCase, context), this.visitAllStatements(stmt.falseCase, context));
    };
    ExpressionTransformer.prototype.visitTryCatchStmt = function(stmt, context) {
      return new TryCatchStmt(this.visitAllStatements(stmt.bodyStmts, context), this.visitAllStatements(stmt.catchStmts, context));
    };
    ExpressionTransformer.prototype.visitThrowStmt = function(stmt, context) {
      return new ThrowStmt(stmt.error.visitExpression(this, context));
    };
    ExpressionTransformer.prototype.visitCommentStmt = function(stmt, context) {
      return stmt;
    };
    ExpressionTransformer.prototype.visitAllStatements = function(stmts, context) {
      var _this = this;
      return stmts.map(function(stmt) {
        return stmt.visitStatement(_this, context);
      });
    };
    return ExpressionTransformer;
  }());
  exports.ExpressionTransformer = ExpressionTransformer;
  var RecursiveExpressionVisitor = (function() {
    function RecursiveExpressionVisitor() {}
    RecursiveExpressionVisitor.prototype.visitReadVarExpr = function(ast, context) {
      return ast;
    };
    RecursiveExpressionVisitor.prototype.visitWriteVarExpr = function(expr, context) {
      expr.value.visitExpression(this, context);
      return expr;
    };
    RecursiveExpressionVisitor.prototype.visitWriteKeyExpr = function(expr, context) {
      expr.receiver.visitExpression(this, context);
      expr.index.visitExpression(this, context);
      expr.value.visitExpression(this, context);
      return expr;
    };
    RecursiveExpressionVisitor.prototype.visitWritePropExpr = function(expr, context) {
      expr.receiver.visitExpression(this, context);
      expr.value.visitExpression(this, context);
      return expr;
    };
    RecursiveExpressionVisitor.prototype.visitInvokeMethodExpr = function(ast, context) {
      ast.receiver.visitExpression(this, context);
      this.visitAllExpressions(ast.args, context);
      return ast;
    };
    RecursiveExpressionVisitor.prototype.visitInvokeFunctionExpr = function(ast, context) {
      ast.fn.visitExpression(this, context);
      this.visitAllExpressions(ast.args, context);
      return ast;
    };
    RecursiveExpressionVisitor.prototype.visitInstantiateExpr = function(ast, context) {
      ast.classExpr.visitExpression(this, context);
      this.visitAllExpressions(ast.args, context);
      return ast;
    };
    RecursiveExpressionVisitor.prototype.visitLiteralExpr = function(ast, context) {
      return ast;
    };
    RecursiveExpressionVisitor.prototype.visitExternalExpr = function(ast, context) {
      return ast;
    };
    RecursiveExpressionVisitor.prototype.visitConditionalExpr = function(ast, context) {
      ast.condition.visitExpression(this, context);
      ast.trueCase.visitExpression(this, context);
      ast.falseCase.visitExpression(this, context);
      return ast;
    };
    RecursiveExpressionVisitor.prototype.visitNotExpr = function(ast, context) {
      ast.condition.visitExpression(this, context);
      return ast;
    };
    RecursiveExpressionVisitor.prototype.visitCastExpr = function(ast, context) {
      ast.value.visitExpression(this, context);
      return ast;
    };
    RecursiveExpressionVisitor.prototype.visitFunctionExpr = function(ast, context) {
      return ast;
    };
    RecursiveExpressionVisitor.prototype.visitBinaryOperatorExpr = function(ast, context) {
      ast.lhs.visitExpression(this, context);
      ast.rhs.visitExpression(this, context);
      return ast;
    };
    RecursiveExpressionVisitor.prototype.visitReadPropExpr = function(ast, context) {
      ast.receiver.visitExpression(this, context);
      return ast;
    };
    RecursiveExpressionVisitor.prototype.visitReadKeyExpr = function(ast, context) {
      ast.receiver.visitExpression(this, context);
      ast.index.visitExpression(this, context);
      return ast;
    };
    RecursiveExpressionVisitor.prototype.visitLiteralArrayExpr = function(ast, context) {
      this.visitAllExpressions(ast.entries, context);
      return ast;
    };
    RecursiveExpressionVisitor.prototype.visitLiteralMapExpr = function(ast, context) {
      var _this = this;
      ast.entries.forEach(function(entry) {
        return entry[1].visitExpression(_this, context);
      });
      return ast;
    };
    RecursiveExpressionVisitor.prototype.visitAllExpressions = function(exprs, context) {
      var _this = this;
      exprs.forEach(function(expr) {
        return expr.visitExpression(_this, context);
      });
    };
    RecursiveExpressionVisitor.prototype.visitDeclareVarStmt = function(stmt, context) {
      stmt.value.visitExpression(this, context);
      return stmt;
    };
    RecursiveExpressionVisitor.prototype.visitDeclareFunctionStmt = function(stmt, context) {
      return stmt;
    };
    RecursiveExpressionVisitor.prototype.visitExpressionStmt = function(stmt, context) {
      stmt.expr.visitExpression(this, context);
      return stmt;
    };
    RecursiveExpressionVisitor.prototype.visitReturnStmt = function(stmt, context) {
      stmt.value.visitExpression(this, context);
      return stmt;
    };
    RecursiveExpressionVisitor.prototype.visitDeclareClassStmt = function(stmt, context) {
      return stmt;
    };
    RecursiveExpressionVisitor.prototype.visitIfStmt = function(stmt, context) {
      stmt.condition.visitExpression(this, context);
      this.visitAllStatements(stmt.trueCase, context);
      this.visitAllStatements(stmt.falseCase, context);
      return stmt;
    };
    RecursiveExpressionVisitor.prototype.visitTryCatchStmt = function(stmt, context) {
      this.visitAllStatements(stmt.bodyStmts, context);
      this.visitAllStatements(stmt.catchStmts, context);
      return stmt;
    };
    RecursiveExpressionVisitor.prototype.visitThrowStmt = function(stmt, context) {
      stmt.error.visitExpression(this, context);
      return stmt;
    };
    RecursiveExpressionVisitor.prototype.visitCommentStmt = function(stmt, context) {
      return stmt;
    };
    RecursiveExpressionVisitor.prototype.visitAllStatements = function(stmts, context) {
      var _this = this;
      stmts.forEach(function(stmt) {
        return stmt.visitStatement(_this, context);
      });
    };
    return RecursiveExpressionVisitor;
  }());
  exports.RecursiveExpressionVisitor = RecursiveExpressionVisitor;
  function replaceVarInExpression(varName, newValue, expression) {
    var transformer = new _ReplaceVariableTransformer(varName, newValue);
    return expression.visitExpression(transformer, null);
  }
  exports.replaceVarInExpression = replaceVarInExpression;
  var _ReplaceVariableTransformer = (function(_super) {
    __extends(_ReplaceVariableTransformer, _super);
    function _ReplaceVariableTransformer(_varName, _newValue) {
      _super.call(this);
      this._varName = _varName;
      this._newValue = _newValue;
    }
    _ReplaceVariableTransformer.prototype.visitReadVarExpr = function(ast, context) {
      return ast.name == this._varName ? this._newValue : ast;
    };
    return _ReplaceVariableTransformer;
  }(ExpressionTransformer));
  function findReadVarNames(stmts) {
    var finder = new _VariableFinder();
    finder.visitAllStatements(stmts, null);
    return finder.varNames;
  }
  exports.findReadVarNames = findReadVarNames;
  var _VariableFinder = (function(_super) {
    __extends(_VariableFinder, _super);
    function _VariableFinder() {
      _super.apply(this, arguments);
      this.varNames = new Set();
    }
    _VariableFinder.prototype.visitReadVarExpr = function(ast, context) {
      this.varNames.add(ast.name);
      return null;
    };
    return _VariableFinder;
  }(RecursiveExpressionVisitor));
  function variable(name, type) {
    if (type === void 0) {
      type = null;
    }
    return new ReadVarExpr(name, type);
  }
  exports.variable = variable;
  function importExpr(id, typeParams) {
    if (typeParams === void 0) {
      typeParams = null;
    }
    return new ExternalExpr(id, null, typeParams);
  }
  exports.importExpr = importExpr;
  function importType(id, typeParams, typeModifiers) {
    if (typeParams === void 0) {
      typeParams = null;
    }
    if (typeModifiers === void 0) {
      typeModifiers = null;
    }
    return lang_1.isPresent(id) ? new ExternalType(id, typeParams, typeModifiers) : null;
  }
  exports.importType = importType;
  function literal(value, type) {
    if (type === void 0) {
      type = null;
    }
    return new LiteralExpr(value, type);
  }
  exports.literal = literal;
  function literalArr(values, type) {
    if (type === void 0) {
      type = null;
    }
    return new LiteralArrayExpr(values, type);
  }
  exports.literalArr = literalArr;
  function literalMap(values, type) {
    if (type === void 0) {
      type = null;
    }
    return new LiteralMapExpr(values, type);
  }
  exports.literalMap = literalMap;
  function not(expr) {
    return new NotExpr(expr);
  }
  exports.not = not;
  function fn(params, body, type) {
    if (type === void 0) {
      type = null;
    }
    return new FunctionExpr(params, body, type);
  }
  exports.fn = fn;
  return module.exports;
});

System.registerDynamic("@angular/compiler/src/view_compiler/constants.js", ["@angular/core", "../../core_private", "../../src/facade/lang", "../compile_metadata", "../output/output_ast", "../identifiers"], true, function($__require, exports, module) {
  "use strict";
  ;
  var define,
      global = this,
      GLOBAL = this;
  var core_1 = $__require('@angular/core');
  var core_private_1 = $__require('../../core_private');
  var lang_1 = $__require('../../src/facade/lang');
  var compile_metadata_1 = $__require('../compile_metadata');
  var o = $__require('../output/output_ast');
  var identifiers_1 = $__require('../identifiers');
  function _enumExpression(classIdentifier, value) {
    if (lang_1.isBlank(value))
      return o.NULL_EXPR;
    var name = lang_1.resolveEnumToken(classIdentifier.runtime, value);
    return o.importExpr(new compile_metadata_1.CompileIdentifierMetadata({
      name: classIdentifier.name + "." + name,
      moduleUrl: classIdentifier.moduleUrl,
      runtime: value
    }));
  }
  var ViewTypeEnum = (function() {
    function ViewTypeEnum() {}
    ViewTypeEnum.fromValue = function(value) {
      return _enumExpression(identifiers_1.Identifiers.ViewType, value);
    };
    ViewTypeEnum.HOST = ViewTypeEnum.fromValue(core_private_1.ViewType.HOST);
    ViewTypeEnum.COMPONENT = ViewTypeEnum.fromValue(core_private_1.ViewType.COMPONENT);
    ViewTypeEnum.EMBEDDED = ViewTypeEnum.fromValue(core_private_1.ViewType.EMBEDDED);
    return ViewTypeEnum;
  }());
  exports.ViewTypeEnum = ViewTypeEnum;
  var ViewEncapsulationEnum = (function() {
    function ViewEncapsulationEnum() {}
    ViewEncapsulationEnum.fromValue = function(value) {
      return _enumExpression(identifiers_1.Identifiers.ViewEncapsulation, value);
    };
    ViewEncapsulationEnum.Emulated = ViewEncapsulationEnum.fromValue(core_1.ViewEncapsulation.Emulated);
    ViewEncapsulationEnum.Native = ViewEncapsulationEnum.fromValue(core_1.ViewEncapsulation.Native);
    ViewEncapsulationEnum.None = ViewEncapsulationEnum.fromValue(core_1.ViewEncapsulation.None);
    return ViewEncapsulationEnum;
  }());
  exports.ViewEncapsulationEnum = ViewEncapsulationEnum;
  var ChangeDetectorStateEnum = (function() {
    function ChangeDetectorStateEnum() {}
    ChangeDetectorStateEnum.fromValue = function(value) {
      return _enumExpression(identifiers_1.Identifiers.ChangeDetectorState, value);
    };
    ChangeDetectorStateEnum.NeverChecked = ChangeDetectorStateEnum.fromValue(core_private_1.ChangeDetectorState.NeverChecked);
    ChangeDetectorStateEnum.CheckedBefore = ChangeDetectorStateEnum.fromValue(core_private_1.ChangeDetectorState.CheckedBefore);
    ChangeDetectorStateEnum.Errored = ChangeDetectorStateEnum.fromValue(core_private_1.ChangeDetectorState.Errored);
    return ChangeDetectorStateEnum;
  }());
  exports.ChangeDetectorStateEnum = ChangeDetectorStateEnum;
  var ChangeDetectionStrategyEnum = (function() {
    function ChangeDetectionStrategyEnum() {}
    ChangeDetectionStrategyEnum.fromValue = function(value) {
      return _enumExpression(identifiers_1.Identifiers.ChangeDetectionStrategy, value);
    };
    ChangeDetectionStrategyEnum.CheckOnce = ChangeDetectionStrategyEnum.fromValue(core_1.ChangeDetectionStrategy.CheckOnce);
    ChangeDetectionStrategyEnum.Checked = ChangeDetectionStrategyEnum.fromValue(core_1.ChangeDetectionStrategy.Checked);
    ChangeDetectionStrategyEnum.CheckAlways = ChangeDetectionStrategyEnum.fromValue(core_1.ChangeDetectionStrategy.CheckAlways);
    ChangeDetectionStrategyEnum.Detached = ChangeDetectionStrategyEnum.fromValue(core_1.ChangeDetectionStrategy.Detached);
    ChangeDetectionStrategyEnum.OnPush = ChangeDetectionStrategyEnum.fromValue(core_1.ChangeDetectionStrategy.OnPush);
    ChangeDetectionStrategyEnum.Default = ChangeDetectionStrategyEnum.fromValue(core_1.ChangeDetectionStrategy.Default);
    return ChangeDetectionStrategyEnum;
  }());
  exports.ChangeDetectionStrategyEnum = ChangeDetectionStrategyEnum;
  var ViewConstructorVars = (function() {
    function ViewConstructorVars() {}
    ViewConstructorVars.viewUtils = o.variable('viewUtils');
    ViewConstructorVars.parentInjector = o.variable('parentInjector');
    ViewConstructorVars.declarationEl = o.variable('declarationEl');
    return ViewConstructorVars;
  }());
  exports.ViewConstructorVars = ViewConstructorVars;
  var ViewProperties = (function() {
    function ViewProperties() {}
    ViewProperties.renderer = o.THIS_EXPR.prop('renderer');
    ViewProperties.projectableNodes = o.THIS_EXPR.prop('projectableNodes');
    ViewProperties.viewUtils = o.THIS_EXPR.prop('viewUtils');
    return ViewProperties;
  }());
  exports.ViewProperties = ViewProperties;
  var EventHandlerVars = (function() {
    function EventHandlerVars() {}
    EventHandlerVars.event = o.variable('$event');
    return EventHandlerVars;
  }());
  exports.EventHandlerVars = EventHandlerVars;
  var InjectMethodVars = (function() {
    function InjectMethodVars() {}
    InjectMethodVars.token = o.variable('token');
    InjectMethodVars.requestNodeIndex = o.variable('requestNodeIndex');
    InjectMethodVars.notFoundResult = o.variable('notFoundResult');
    return InjectMethodVars;
  }());
  exports.InjectMethodVars = InjectMethodVars;
  var DetectChangesVars = (function() {
    function DetectChangesVars() {}
    DetectChangesVars.throwOnChange = o.variable("throwOnChange");
    DetectChangesVars.changes = o.variable("changes");
    DetectChangesVars.changed = o.variable("changed");
    DetectChangesVars.valUnwrapper = o.variable("valUnwrapper");
    return DetectChangesVars;
  }());
  exports.DetectChangesVars = DetectChangesVars;
  return module.exports;
});

System.registerDynamic("@angular/compiler/src/view_compiler/lifecycle_binder.js", ["../../core_private", "../output/output_ast", "./constants"], true, function($__require, exports, module) {
  "use strict";
  ;
  var define,
      global = this,
      GLOBAL = this;
  var core_private_1 = $__require('../../core_private');
  var o = $__require('../output/output_ast');
  var constants_1 = $__require('./constants');
  var STATE_IS_NEVER_CHECKED = o.THIS_EXPR.prop('cdState').identical(constants_1.ChangeDetectorStateEnum.NeverChecked);
  var NOT_THROW_ON_CHANGES = o.not(constants_1.DetectChangesVars.throwOnChange);
  function bindDirectiveDetectChangesLifecycleCallbacks(directiveAst, directiveInstance, compileElement) {
    var view = compileElement.view;
    var detectChangesInInputsMethod = view.detectChangesInInputsMethod;
    var lifecycleHooks = directiveAst.directive.lifecycleHooks;
    if (lifecycleHooks.indexOf(core_private_1.LifecycleHooks.OnChanges) !== -1 && directiveAst.inputs.length > 0) {
      detectChangesInInputsMethod.addStmt(new o.IfStmt(constants_1.DetectChangesVars.changes.notIdentical(o.NULL_EXPR), [directiveInstance.callMethod('ngOnChanges', [constants_1.DetectChangesVars.changes]).toStmt()]));
    }
    if (lifecycleHooks.indexOf(core_private_1.LifecycleHooks.OnInit) !== -1) {
      detectChangesInInputsMethod.addStmt(new o.IfStmt(STATE_IS_NEVER_CHECKED.and(NOT_THROW_ON_CHANGES), [directiveInstance.callMethod('ngOnInit', []).toStmt()]));
    }
    if (lifecycleHooks.indexOf(core_private_1.LifecycleHooks.DoCheck) !== -1) {
      detectChangesInInputsMethod.addStmt(new o.IfStmt(NOT_THROW_ON_CHANGES, [directiveInstance.callMethod('ngDoCheck', []).toStmt()]));
    }
  }
  exports.bindDirectiveDetectChangesLifecycleCallbacks = bindDirectiveDetectChangesLifecycleCallbacks;
  function bindDirectiveAfterContentLifecycleCallbacks(directiveMeta, directiveInstance, compileElement) {
    var view = compileElement.view;
    var lifecycleHooks = directiveMeta.lifecycleHooks;
    var afterContentLifecycleCallbacksMethod = view.afterContentLifecycleCallbacksMethod;
    afterContentLifecycleCallbacksMethod.resetDebugInfo(compileElement.nodeIndex, compileElement.sourceAst);
    if (lifecycleHooks.indexOf(core_private_1.LifecycleHooks.AfterContentInit) !== -1) {
      afterContentLifecycleCallbacksMethod.addStmt(new o.IfStmt(STATE_IS_NEVER_CHECKED, [directiveInstance.callMethod('ngAfterContentInit', []).toStmt()]));
    }
    if (lifecycleHooks.indexOf(core_private_1.LifecycleHooks.AfterContentChecked) !== -1) {
      afterContentLifecycleCallbacksMethod.addStmt(directiveInstance.callMethod('ngAfterContentChecked', []).toStmt());
    }
  }
  exports.bindDirectiveAfterContentLifecycleCallbacks = bindDirectiveAfterContentLifecycleCallbacks;
  function bindDirectiveAfterViewLifecycleCallbacks(directiveMeta, directiveInstance, compileElement) {
    var view = compileElement.view;
    var lifecycleHooks = directiveMeta.lifecycleHooks;
    var afterViewLifecycleCallbacksMethod = view.afterViewLifecycleCallbacksMethod;
    afterViewLifecycleCallbacksMethod.resetDebugInfo(compileElement.nodeIndex, compileElement.sourceAst);
    if (lifecycleHooks.indexOf(core_private_1.LifecycleHooks.AfterViewInit) !== -1) {
      afterViewLifecycleCallbacksMethod.addStmt(new o.IfStmt(STATE_IS_NEVER_CHECKED, [directiveInstance.callMethod('ngAfterViewInit', []).toStmt()]));
    }
    if (lifecycleHooks.indexOf(core_private_1.LifecycleHooks.AfterViewChecked) !== -1) {
      afterViewLifecycleCallbacksMethod.addStmt(directiveInstance.callMethod('ngAfterViewChecked', []).toStmt());
    }
  }
  exports.bindDirectiveAfterViewLifecycleCallbacks = bindDirectiveAfterViewLifecycleCallbacks;
  function bindDirectiveDestroyLifecycleCallbacks(directiveMeta, directiveInstance, compileElement) {
    var onDestroyMethod = compileElement.view.destroyMethod;
    onDestroyMethod.resetDebugInfo(compileElement.nodeIndex, compileElement.sourceAst);
    if (directiveMeta.lifecycleHooks.indexOf(core_private_1.LifecycleHooks.OnDestroy) !== -1) {
      onDestroyMethod.addStmt(directiveInstance.callMethod('ngOnDestroy', []).toStmt());
    }
  }
  exports.bindDirectiveDestroyLifecycleCallbacks = bindDirectiveDestroyLifecycleCallbacks;
  function bindPipeDestroyLifecycleCallbacks(pipeMeta, pipeInstance, view) {
    var onDestroyMethod = view.destroyMethod;
    if (pipeMeta.lifecycleHooks.indexOf(core_private_1.LifecycleHooks.OnDestroy) !== -1) {
      onDestroyMethod.addStmt(pipeInstance.callMethod('ngOnDestroy', []).toStmt());
    }
  }
  exports.bindPipeDestroyLifecycleCallbacks = bindPipeDestroyLifecycleCallbacks;
  return module.exports;
});

System.registerDynamic("@angular/compiler/src/view_compiler/view_binder.js", ["../../src/facade/collection", "../template_ast", "./property_binder", "./event_binder", "./lifecycle_binder"], true, function($__require, exports, module) {
  "use strict";
  ;
  var define,
      global = this,
      GLOBAL = this;
  var collection_1 = $__require('../../src/facade/collection');
  var template_ast_1 = $__require('../template_ast');
  var property_binder_1 = $__require('./property_binder');
  var event_binder_1 = $__require('./event_binder');
  var lifecycle_binder_1 = $__require('./lifecycle_binder');
  function bindView(view, parsedTemplate) {
    var visitor = new ViewBinderVisitor(view);
    template_ast_1.templateVisitAll(visitor, parsedTemplate);
    view.pipes.forEach(function(pipe) {
      lifecycle_binder_1.bindPipeDestroyLifecycleCallbacks(pipe.meta, pipe.instance, pipe.view);
    });
  }
  exports.bindView = bindView;
  var ViewBinderVisitor = (function() {
    function ViewBinderVisitor(view) {
      this.view = view;
      this._nodeIndex = 0;
    }
    ViewBinderVisitor.prototype.visitBoundText = function(ast, parent) {
      var node = this.view.nodes[this._nodeIndex++];
      property_binder_1.bindRenderText(ast, node, this.view);
      return null;
    };
    ViewBinderVisitor.prototype.visitText = function(ast, parent) {
      this._nodeIndex++;
      return null;
    };
    ViewBinderVisitor.prototype.visitNgContent = function(ast, parent) {
      return null;
    };
    ViewBinderVisitor.prototype.visitElement = function(ast, parent) {
      var compileElement = this.view.nodes[this._nodeIndex++];
      var eventListeners = event_binder_1.collectEventListeners(ast.outputs, ast.directives, compileElement);
      property_binder_1.bindRenderInputs(ast.inputs, compileElement);
      event_binder_1.bindRenderOutputs(eventListeners);
      collection_1.ListWrapper.forEachWithIndex(ast.directives, function(directiveAst, index) {
        var directiveInstance = compileElement.directiveInstances[index];
        property_binder_1.bindDirectiveInputs(directiveAst, directiveInstance, compileElement);
        lifecycle_binder_1.bindDirectiveDetectChangesLifecycleCallbacks(directiveAst, directiveInstance, compileElement);
        property_binder_1.bindDirectiveHostProps(directiveAst, directiveInstance, compileElement);
        event_binder_1.bindDirectiveOutputs(directiveAst, directiveInstance, eventListeners);
      });
      template_ast_1.templateVisitAll(this, ast.children, compileElement);
      collection_1.ListWrapper.forEachWithIndex(ast.directives, function(directiveAst, index) {
        var directiveInstance = compileElement.directiveInstances[index];
        lifecycle_binder_1.bindDirectiveAfterContentLifecycleCallbacks(directiveAst.directive, directiveInstance, compileElement);
        lifecycle_binder_1.bindDirectiveAfterViewLifecycleCallbacks(directiveAst.directive, directiveInstance, compileElement);
        lifecycle_binder_1.bindDirectiveDestroyLifecycleCallbacks(directiveAst.directive, directiveInstance, compileElement);
      });
      return null;
    };
    ViewBinderVisitor.prototype.visitEmbeddedTemplate = function(ast, parent) {
      var compileElement = this.view.nodes[this._nodeIndex++];
      var eventListeners = event_binder_1.collectEventListeners(ast.outputs, ast.directives, compileElement);
      collection_1.ListWrapper.forEachWithIndex(ast.directives, function(directiveAst, index) {
        var directiveInstance = compileElement.directiveInstances[index];
        property_binder_1.bindDirectiveInputs(directiveAst, directiveInstance, compileElement);
        lifecycle_binder_1.bindDirectiveDetectChangesLifecycleCallbacks(directiveAst, directiveInstance, compileElement);
        event_binder_1.bindDirectiveOutputs(directiveAst, directiveInstance, eventListeners);
        lifecycle_binder_1.bindDirectiveAfterContentLifecycleCallbacks(directiveAst.directive, directiveInstance, compileElement);
        lifecycle_binder_1.bindDirectiveAfterViewLifecycleCallbacks(directiveAst.directive, directiveInstance, compileElement);
        lifecycle_binder_1.bindDirectiveDestroyLifecycleCallbacks(directiveAst.directive, directiveInstance, compileElement);
      });
      bindView(compileElement.embeddedView, ast.children);
      return null;
    };
    ViewBinderVisitor.prototype.visitAttr = function(ast, ctx) {
      return null;
    };
    ViewBinderVisitor.prototype.visitDirective = function(ast, ctx) {
      return null;
    };
    ViewBinderVisitor.prototype.visitEvent = function(ast, eventTargetAndNames) {
      return null;
    };
    ViewBinderVisitor.prototype.visitReference = function(ast, ctx) {
      return null;
    };
    ViewBinderVisitor.prototype.visitVariable = function(ast, ctx) {
      return null;
    };
    ViewBinderVisitor.prototype.visitDirectiveProperty = function(ast, context) {
      return null;
    };
    ViewBinderVisitor.prototype.visitElementProperty = function(ast, context) {
      return null;
    };
    return ViewBinderVisitor;
  }());
  return module.exports;
});

System.registerDynamic("@angular/compiler/src/url_resolver.js", ["@angular/core", "../src/facade/lang"], true, function($__require, exports, module) {
  "use strict";
  ;
  var define,
      global = this,
      GLOBAL = this;
  var core_1 = $__require('@angular/core');
  var lang_1 = $__require('../src/facade/lang');
  var _ASSET_SCHEME = 'asset:';
  function createUrlResolverWithoutPackagePrefix() {
    return new UrlResolver();
  }
  exports.createUrlResolverWithoutPackagePrefix = createUrlResolverWithoutPackagePrefix;
  function createOfflineCompileUrlResolver() {
    return new UrlResolver(_ASSET_SCHEME);
  }
  exports.createOfflineCompileUrlResolver = createOfflineCompileUrlResolver;
  exports.DEFAULT_PACKAGE_URL_PROVIDER = {
    provide: core_1.PACKAGE_ROOT_URL,
    useValue: "/"
  };
  var UrlResolver = (function() {
    function UrlResolver(_packagePrefix) {
      if (_packagePrefix === void 0) {
        _packagePrefix = null;
      }
      this._packagePrefix = _packagePrefix;
    }
    UrlResolver.prototype.resolve = function(baseUrl, url) {
      var resolvedUrl = url;
      if (lang_1.isPresent(baseUrl) && baseUrl.length > 0) {
        resolvedUrl = _resolveUrl(baseUrl, resolvedUrl);
      }
      var resolvedParts = _split(resolvedUrl);
      var prefix = this._packagePrefix;
      if (lang_1.isPresent(prefix) && lang_1.isPresent(resolvedParts) && resolvedParts[_ComponentIndex.Scheme] == "package") {
        var path = resolvedParts[_ComponentIndex.Path];
        if (this._packagePrefix === _ASSET_SCHEME) {
          var pathSegements = path.split(/\//);
          resolvedUrl = "asset:" + pathSegements[0] + "/lib/" + pathSegements.slice(1).join('/');
        } else {
          prefix = lang_1.StringWrapper.stripRight(prefix, '/');
          path = lang_1.StringWrapper.stripLeft(path, '/');
          return prefix + "/" + path;
        }
      }
      return resolvedUrl;
    };
    UrlResolver.decorators = [{type: core_1.Injectable}];
    UrlResolver.ctorParameters = [{
      type: undefined,
      decorators: [{
        type: core_1.Inject,
        args: [core_1.PACKAGE_ROOT_URL]
      }]
    }];
    return UrlResolver;
  }());
  exports.UrlResolver = UrlResolver;
  function getUrlScheme(url) {
    var match = _split(url);
    return (match && match[_ComponentIndex.Scheme]) || "";
  }
  exports.getUrlScheme = getUrlScheme;
  function _buildFromEncodedParts(opt_scheme, opt_userInfo, opt_domain, opt_port, opt_path, opt_queryData, opt_fragment) {
    var out = [];
    if (lang_1.isPresent(opt_scheme)) {
      out.push(opt_scheme + ':');
    }
    if (lang_1.isPresent(opt_domain)) {
      out.push('//');
      if (lang_1.isPresent(opt_userInfo)) {
        out.push(opt_userInfo + '@');
      }
      out.push(opt_domain);
      if (lang_1.isPresent(opt_port)) {
        out.push(':' + opt_port);
      }
    }
    if (lang_1.isPresent(opt_path)) {
      out.push(opt_path);
    }
    if (lang_1.isPresent(opt_queryData)) {
      out.push('?' + opt_queryData);
    }
    if (lang_1.isPresent(opt_fragment)) {
      out.push('#' + opt_fragment);
    }
    return out.join('');
  }
  var _splitRe = lang_1.RegExpWrapper.create('^' + '(?:' + '([^:/?#.]+)' + ':)?' + '(?://' + '(?:([^/?#]*)@)?' + '([\\w\\d\\-\\u0100-\\uffff.%]*)' + '(?::([0-9]+))?' + ')?' + '([^?#]+)?' + '(?:\\?([^#]*))?' + '(?:#(.*))?' + '$');
  var _ComponentIndex;
  (function(_ComponentIndex) {
    _ComponentIndex[_ComponentIndex["Scheme"] = 1] = "Scheme";
    _ComponentIndex[_ComponentIndex["UserInfo"] = 2] = "UserInfo";
    _ComponentIndex[_ComponentIndex["Domain"] = 3] = "Domain";
    _ComponentIndex[_ComponentIndex["Port"] = 4] = "Port";
    _ComponentIndex[_ComponentIndex["Path"] = 5] = "Path";
    _ComponentIndex[_ComponentIndex["QueryData"] = 6] = "QueryData";
    _ComponentIndex[_ComponentIndex["Fragment"] = 7] = "Fragment";
  })(_ComponentIndex || (_ComponentIndex = {}));
  function _split(uri) {
    return lang_1.RegExpWrapper.firstMatch(_splitRe, uri);
  }
  function _removeDotSegments(path) {
    if (path == '/')
      return '/';
    var leadingSlash = path[0] == '/' ? '/' : '';
    var trailingSlash = path[path.length - 1] === '/' ? '/' : '';
    var segments = path.split('/');
    var out = [];
    var up = 0;
    for (var pos = 0; pos < segments.length; pos++) {
      var segment = segments[pos];
      switch (segment) {
        case '':
        case '.':
          break;
        case '..':
          if (out.length > 0) {
            out.pop();
          } else {
            up++;
          }
          break;
        default:
          out.push(segment);
      }
    }
    if (leadingSlash == '') {
      while (up-- > 0) {
        out.unshift('..');
      }
      if (out.length === 0)
        out.push('.');
    }
    return leadingSlash + out.join('/') + trailingSlash;
  }
  function _joinAndCanonicalizePath(parts) {
    var path = parts[_ComponentIndex.Path];
    path = lang_1.isBlank(path) ? '' : _removeDotSegments(path);
    parts[_ComponentIndex.Path] = path;
    return _buildFromEncodedParts(parts[_ComponentIndex.Scheme], parts[_ComponentIndex.UserInfo], parts[_ComponentIndex.Domain], parts[_ComponentIndex.Port], path, parts[_ComponentIndex.QueryData], parts[_ComponentIndex.Fragment]);
  }
  function _resolveUrl(base, url) {
    var parts = _split(encodeURI(url));
    var baseParts = _split(base);
    if (lang_1.isPresent(parts[_ComponentIndex.Scheme])) {
      return _joinAndCanonicalizePath(parts);
    } else {
      parts[_ComponentIndex.Scheme] = baseParts[_ComponentIndex.Scheme];
    }
    for (var i = _ComponentIndex.Scheme; i <= _ComponentIndex.Port; i++) {
      if (lang_1.isBlank(parts[i])) {
        parts[i] = baseParts[i];
      }
    }
    if (parts[_ComponentIndex.Path][0] == '/') {
      return _joinAndCanonicalizePath(parts);
    }
    var path = baseParts[_ComponentIndex.Path];
    if (lang_1.isBlank(path))
      path = '/';
    var index = path.lastIndexOf('/');
    path = path.substring(0, index + 1) + parts[_ComponentIndex.Path];
    parts[_ComponentIndex.Path] = path;
    return _joinAndCanonicalizePath(parts);
  }
  return module.exports;
});

System.registerDynamic("@angular/compiler/src/compile_metadata.js", ["@angular/core", "../core_private", "../src/facade/lang", "../src/facade/exceptions", "../src/facade/collection", "./selector", "./util", "./url_resolver"], true, function($__require, exports, module) {
  "use strict";
  ;
  var define,
      global = this,
      GLOBAL = this;
  var __extends = (this && this.__extends) || function(d, b) {
    for (var p in b)
      if (b.hasOwnProperty(p))
        d[p] = b[p];
    function __() {
      this.constructor = d;
    }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
  };
  var core_1 = $__require('@angular/core');
  var core_private_1 = $__require('../core_private');
  var lang_1 = $__require('../src/facade/lang');
  var exceptions_1 = $__require('../src/facade/exceptions');
  var collection_1 = $__require('../src/facade/collection');
  var selector_1 = $__require('./selector');
  var util_1 = $__require('./util');
  var url_resolver_1 = $__require('./url_resolver');
  var HOST_REG_EXP = /^(?:(?:\[([^\]]+)\])|(?:\(([^\)]+)\)))$/g;
  var CompileMetadataWithIdentifier = (function() {
    function CompileMetadataWithIdentifier() {}
    Object.defineProperty(CompileMetadataWithIdentifier.prototype, "identifier", {
      get: function() {
        return exceptions_1.unimplemented();
      },
      enumerable: true,
      configurable: true
    });
    return CompileMetadataWithIdentifier;
  }());
  exports.CompileMetadataWithIdentifier = CompileMetadataWithIdentifier;
  var CompileMetadataWithType = (function(_super) {
    __extends(CompileMetadataWithType, _super);
    function CompileMetadataWithType() {
      _super.apply(this, arguments);
    }
    Object.defineProperty(CompileMetadataWithType.prototype, "type", {
      get: function() {
        return exceptions_1.unimplemented();
      },
      enumerable: true,
      configurable: true
    });
    Object.defineProperty(CompileMetadataWithType.prototype, "identifier", {
      get: function() {
        return exceptions_1.unimplemented();
      },
      enumerable: true,
      configurable: true
    });
    return CompileMetadataWithType;
  }(CompileMetadataWithIdentifier));
  exports.CompileMetadataWithType = CompileMetadataWithType;
  function metadataFromJson(data) {
    return _COMPILE_METADATA_FROM_JSON[data['class']](data);
  }
  exports.metadataFromJson = metadataFromJson;
  var CompileIdentifierMetadata = (function() {
    function CompileIdentifierMetadata(_a) {
      var _b = _a === void 0 ? {} : _a,
          runtime = _b.runtime,
          name = _b.name,
          moduleUrl = _b.moduleUrl,
          prefix = _b.prefix,
          value = _b.value;
      this.runtime = runtime;
      this.name = name;
      this.prefix = prefix;
      this.moduleUrl = moduleUrl;
      this.value = value;
    }
    CompileIdentifierMetadata.fromJson = function(data) {
      var value = lang_1.isArray(data['value']) ? _arrayFromJson(data['value'], metadataFromJson) : _objFromJson(data['value'], metadataFromJson);
      return new CompileIdentifierMetadata({
        name: data['name'],
        prefix: data['prefix'],
        moduleUrl: data['moduleUrl'],
        value: value
      });
    };
    CompileIdentifierMetadata.prototype.toJson = function() {
      var value = lang_1.isArray(this.value) ? _arrayToJson(this.value) : _objToJson(this.value);
      return {
        'class': 'Identifier',
        'name': this.name,
        'moduleUrl': this.moduleUrl,
        'prefix': this.prefix,
        'value': value
      };
    };
    Object.defineProperty(CompileIdentifierMetadata.prototype, "identifier", {
      get: function() {
        return this;
      },
      enumerable: true,
      configurable: true
    });
    return CompileIdentifierMetadata;
  }());
  exports.CompileIdentifierMetadata = CompileIdentifierMetadata;
  var CompileDiDependencyMetadata = (function() {
    function CompileDiDependencyMetadata(_a) {
      var _b = _a === void 0 ? {} : _a,
          isAttribute = _b.isAttribute,
          isSelf = _b.isSelf,
          isHost = _b.isHost,
          isSkipSelf = _b.isSkipSelf,
          isOptional = _b.isOptional,
          isValue = _b.isValue,
          query = _b.query,
          viewQuery = _b.viewQuery,
          token = _b.token,
          value = _b.value;
      this.isAttribute = lang_1.normalizeBool(isAttribute);
      this.isSelf = lang_1.normalizeBool(isSelf);
      this.isHost = lang_1.normalizeBool(isHost);
      this.isSkipSelf = lang_1.normalizeBool(isSkipSelf);
      this.isOptional = lang_1.normalizeBool(isOptional);
      this.isValue = lang_1.normalizeBool(isValue);
      this.query = query;
      this.viewQuery = viewQuery;
      this.token = token;
      this.value = value;
    }
    CompileDiDependencyMetadata.fromJson = function(data) {
      return new CompileDiDependencyMetadata({
        token: _objFromJson(data['token'], CompileTokenMetadata.fromJson),
        query: _objFromJson(data['query'], CompileQueryMetadata.fromJson),
        viewQuery: _objFromJson(data['viewQuery'], CompileQueryMetadata.fromJson),
        value: data['value'],
        isAttribute: data['isAttribute'],
        isSelf: data['isSelf'],
        isHost: data['isHost'],
        isSkipSelf: data['isSkipSelf'],
        isOptional: data['isOptional'],
        isValue: data['isValue']
      });
    };
    CompileDiDependencyMetadata.prototype.toJson = function() {
      return {
        'token': _objToJson(this.token),
        'query': _objToJson(this.query),
        'viewQuery': _objToJson(this.viewQuery),
        'value': this.value,
        'isAttribute': this.isAttribute,
        'isSelf': this.isSelf,
        'isHost': this.isHost,
        'isSkipSelf': this.isSkipSelf,
        'isOptional': this.isOptional,
        'isValue': this.isValue
      };
    };
    return CompileDiDependencyMetadata;
  }());
  exports.CompileDiDependencyMetadata = CompileDiDependencyMetadata;
  var CompileProviderMetadata = (function() {
    function CompileProviderMetadata(_a) {
      var token = _a.token,
          useClass = _a.useClass,
          useValue = _a.useValue,
          useExisting = _a.useExisting,
          useFactory = _a.useFactory,
          deps = _a.deps,
          multi = _a.multi;
      this.token = token;
      this.useClass = useClass;
      this.useValue = useValue;
      this.useExisting = useExisting;
      this.useFactory = useFactory;
      this.deps = lang_1.normalizeBlank(deps);
      this.multi = lang_1.normalizeBool(multi);
    }
    CompileProviderMetadata.fromJson = function(data) {
      return new CompileProviderMetadata({
        token: _objFromJson(data['token'], CompileTokenMetadata.fromJson),
        useClass: _objFromJson(data['useClass'], CompileTypeMetadata.fromJson),
        useExisting: _objFromJson(data['useExisting'], CompileTokenMetadata.fromJson),
        useValue: _objFromJson(data['useValue'], CompileIdentifierMetadata.fromJson),
        useFactory: _objFromJson(data['useFactory'], CompileFactoryMetadata.fromJson),
        multi: data['multi'],
        deps: _arrayFromJson(data['deps'], CompileDiDependencyMetadata.fromJson)
      });
    };
    CompileProviderMetadata.prototype.toJson = function() {
      return {
        'class': 'Provider',
        'token': _objToJson(this.token),
        'useClass': _objToJson(this.useClass),
        'useExisting': _objToJson(this.useExisting),
        'useValue': _objToJson(this.useValue),
        'useFactory': _objToJson(this.useFactory),
        'multi': this.multi,
        'deps': _arrayToJson(this.deps)
      };
    };
    return CompileProviderMetadata;
  }());
  exports.CompileProviderMetadata = CompileProviderMetadata;
  var CompileFactoryMetadata = (function() {
    function CompileFactoryMetadata(_a) {
      var runtime = _a.runtime,
          name = _a.name,
          moduleUrl = _a.moduleUrl,
          prefix = _a.prefix,
          diDeps = _a.diDeps,
          value = _a.value;
      this.runtime = runtime;
      this.name = name;
      this.prefix = prefix;
      this.moduleUrl = moduleUrl;
      this.diDeps = _normalizeArray(diDeps);
      this.value = value;
    }
    Object.defineProperty(CompileFactoryMetadata.prototype, "identifier", {
      get: function() {
        return this;
      },
      enumerable: true,
      configurable: true
    });
    CompileFactoryMetadata.fromJson = function(data) {
      return new CompileFactoryMetadata({
        name: data['name'],
        prefix: data['prefix'],
        moduleUrl: data['moduleUrl'],
        value: data['value'],
        diDeps: _arrayFromJson(data['diDeps'], CompileDiDependencyMetadata.fromJson)
      });
    };
    CompileFactoryMetadata.prototype.toJson = function() {
      return {
        'class': 'Factory',
        'name': this.name,
        'prefix': this.prefix,
        'moduleUrl': this.moduleUrl,
        'value': this.value,
        'diDeps': _arrayToJson(this.diDeps)
      };
    };
    return CompileFactoryMetadata;
  }());
  exports.CompileFactoryMetadata = CompileFactoryMetadata;
  var CompileTokenMetadata = (function() {
    function CompileTokenMetadata(_a) {
      var value = _a.value,
          identifier = _a.identifier,
          identifierIsInstance = _a.identifierIsInstance;
      this.value = value;
      this.identifier = identifier;
      this.identifierIsInstance = lang_1.normalizeBool(identifierIsInstance);
    }
    CompileTokenMetadata.fromJson = function(data) {
      return new CompileTokenMetadata({
        value: data['value'],
        identifier: _objFromJson(data['identifier'], CompileIdentifierMetadata.fromJson),
        identifierIsInstance: data['identifierIsInstance']
      });
    };
    CompileTokenMetadata.prototype.toJson = function() {
      return {
        'value': this.value,
        'identifier': _objToJson(this.identifier),
        'identifierIsInstance': this.identifierIsInstance
      };
    };
    Object.defineProperty(CompileTokenMetadata.prototype, "runtimeCacheKey", {
      get: function() {
        if (lang_1.isPresent(this.identifier)) {
          return this.identifier.runtime;
        } else {
          return this.value;
        }
      },
      enumerable: true,
      configurable: true
    });
    Object.defineProperty(CompileTokenMetadata.prototype, "assetCacheKey", {
      get: function() {
        if (lang_1.isPresent(this.identifier)) {
          return lang_1.isPresent(this.identifier.moduleUrl) && lang_1.isPresent(url_resolver_1.getUrlScheme(this.identifier.moduleUrl)) ? this.identifier.name + "|" + this.identifier.moduleUrl + "|" + this.identifierIsInstance : null;
        } else {
          return this.value;
        }
      },
      enumerable: true,
      configurable: true
    });
    CompileTokenMetadata.prototype.equalsTo = function(token2) {
      var rk = this.runtimeCacheKey;
      var ak = this.assetCacheKey;
      return (lang_1.isPresent(rk) && rk == token2.runtimeCacheKey) || (lang_1.isPresent(ak) && ak == token2.assetCacheKey);
    };
    Object.defineProperty(CompileTokenMetadata.prototype, "name", {
      get: function() {
        return lang_1.isPresent(this.value) ? util_1.sanitizeIdentifier(this.value) : this.identifier.name;
      },
      enumerable: true,
      configurable: true
    });
    return CompileTokenMetadata;
  }());
  exports.CompileTokenMetadata = CompileTokenMetadata;
  var CompileTokenMap = (function() {
    function CompileTokenMap() {
      this._valueMap = new Map();
      this._values = [];
    }
    CompileTokenMap.prototype.add = function(token, value) {
      var existing = this.get(token);
      if (lang_1.isPresent(existing)) {
        throw new exceptions_1.BaseException("Can only add to a TokenMap! Token: " + token.name);
      }
      this._values.push(value);
      var rk = token.runtimeCacheKey;
      if (lang_1.isPresent(rk)) {
        this._valueMap.set(rk, value);
      }
      var ak = token.assetCacheKey;
      if (lang_1.isPresent(ak)) {
        this._valueMap.set(ak, value);
      }
    };
    CompileTokenMap.prototype.get = function(token) {
      var rk = token.runtimeCacheKey;
      var ak = token.assetCacheKey;
      var result;
      if (lang_1.isPresent(rk)) {
        result = this._valueMap.get(rk);
      }
      if (lang_1.isBlank(result) && lang_1.isPresent(ak)) {
        result = this._valueMap.get(ak);
      }
      return result;
    };
    CompileTokenMap.prototype.values = function() {
      return this._values;
    };
    Object.defineProperty(CompileTokenMap.prototype, "size", {
      get: function() {
        return this._values.length;
      },
      enumerable: true,
      configurable: true
    });
    return CompileTokenMap;
  }());
  exports.CompileTokenMap = CompileTokenMap;
  var CompileTypeMetadata = (function() {
    function CompileTypeMetadata(_a) {
      var _b = _a === void 0 ? {} : _a,
          runtime = _b.runtime,
          name = _b.name,
          moduleUrl = _b.moduleUrl,
          prefix = _b.prefix,
          isHost = _b.isHost,
          value = _b.value,
          diDeps = _b.diDeps;
      this.runtime = runtime;
      this.name = name;
      this.moduleUrl = moduleUrl;
      this.prefix = prefix;
      this.isHost = lang_1.normalizeBool(isHost);
      this.value = value;
      this.diDeps = _normalizeArray(diDeps);
    }
    CompileTypeMetadata.fromJson = function(data) {
      return new CompileTypeMetadata({
        name: data['name'],
        moduleUrl: data['moduleUrl'],
        prefix: data['prefix'],
        isHost: data['isHost'],
        value: data['value'],
        diDeps: _arrayFromJson(data['diDeps'], CompileDiDependencyMetadata.fromJson)
      });
    };
    Object.defineProperty(CompileTypeMetadata.prototype, "identifier", {
      get: function() {
        return this;
      },
      enumerable: true,
      configurable: true
    });
    Object.defineProperty(CompileTypeMetadata.prototype, "type", {
      get: function() {
        return this;
      },
      enumerable: true,
      configurable: true
    });
    CompileTypeMetadata.prototype.toJson = function() {
      return {
        'class': 'Type',
        'name': this.name,
        'moduleUrl': this.moduleUrl,
        'prefix': this.prefix,
        'isHost': this.isHost,
        'value': this.value,
        'diDeps': _arrayToJson(this.diDeps)
      };
    };
    return CompileTypeMetadata;
  }());
  exports.CompileTypeMetadata = CompileTypeMetadata;
  var CompileQueryMetadata = (function() {
    function CompileQueryMetadata(_a) {
      var _b = _a === void 0 ? {} : _a,
          selectors = _b.selectors,
          descendants = _b.descendants,
          first = _b.first,
          propertyName = _b.propertyName,
          read = _b.read;
      this.selectors = selectors;
      this.descendants = lang_1.normalizeBool(descendants);
      this.first = lang_1.normalizeBool(first);
      this.propertyName = propertyName;
      this.read = read;
    }
    CompileQueryMetadata.fromJson = function(data) {
      return new CompileQueryMetadata({
        selectors: _arrayFromJson(data['selectors'], CompileTokenMetadata.fromJson),
        descendants: data['descendants'],
        first: data['first'],
        propertyName: data['propertyName'],
        read: _objFromJson(data['read'], CompileTokenMetadata.fromJson)
      });
    };
    CompileQueryMetadata.prototype.toJson = function() {
      return {
        'selectors': _arrayToJson(this.selectors),
        'descendants': this.descendants,
        'first': this.first,
        'propertyName': this.propertyName,
        'read': _objToJson(this.read)
      };
    };
    return CompileQueryMetadata;
  }());
  exports.CompileQueryMetadata = CompileQueryMetadata;
  var CompileTemplateMetadata = (function() {
    function CompileTemplateMetadata(_a) {
      var _b = _a === void 0 ? {} : _a,
          encapsulation = _b.encapsulation,
          template = _b.template,
          templateUrl = _b.templateUrl,
          styles = _b.styles,
          styleUrls = _b.styleUrls,
          ngContentSelectors = _b.ngContentSelectors;
      this.encapsulation = lang_1.isPresent(encapsulation) ? encapsulation : core_1.ViewEncapsulation.Emulated;
      this.template = template;
      this.templateUrl = templateUrl;
      this.styles = lang_1.isPresent(styles) ? styles : [];
      this.styleUrls = lang_1.isPresent(styleUrls) ? styleUrls : [];
      this.ngContentSelectors = lang_1.isPresent(ngContentSelectors) ? ngContentSelectors : [];
    }
    CompileTemplateMetadata.fromJson = function(data) {
      return new CompileTemplateMetadata({
        encapsulation: lang_1.isPresent(data['encapsulation']) ? core_private_1.VIEW_ENCAPSULATION_VALUES[data['encapsulation']] : data['encapsulation'],
        template: data['template'],
        templateUrl: data['templateUrl'],
        styles: data['styles'],
        styleUrls: data['styleUrls'],
        ngContentSelectors: data['ngContentSelectors']
      });
    };
    CompileTemplateMetadata.prototype.toJson = function() {
      return {
        'encapsulation': lang_1.isPresent(this.encapsulation) ? lang_1.serializeEnum(this.encapsulation) : this.encapsulation,
        'template': this.template,
        'templateUrl': this.templateUrl,
        'styles': this.styles,
        'styleUrls': this.styleUrls,
        'ngContentSelectors': this.ngContentSelectors
      };
    };
    return CompileTemplateMetadata;
  }());
  exports.CompileTemplateMetadata = CompileTemplateMetadata;
  var CompileDirectiveMetadata = (function() {
    function CompileDirectiveMetadata(_a) {
      var _b = _a === void 0 ? {} : _a,
          type = _b.type,
          isComponent = _b.isComponent,
          selector = _b.selector,
          exportAs = _b.exportAs,
          changeDetection = _b.changeDetection,
          inputs = _b.inputs,
          outputs = _b.outputs,
          hostListeners = _b.hostListeners,
          hostProperties = _b.hostProperties,
          hostAttributes = _b.hostAttributes,
          lifecycleHooks = _b.lifecycleHooks,
          providers = _b.providers,
          viewProviders = _b.viewProviders,
          queries = _b.queries,
          viewQueries = _b.viewQueries,
          template = _b.template;
      this.type = type;
      this.isComponent = isComponent;
      this.selector = selector;
      this.exportAs = exportAs;
      this.changeDetection = changeDetection;
      this.inputs = inputs;
      this.outputs = outputs;
      this.hostListeners = hostListeners;
      this.hostProperties = hostProperties;
      this.hostAttributes = hostAttributes;
      this.lifecycleHooks = _normalizeArray(lifecycleHooks);
      this.providers = _normalizeArray(providers);
      this.viewProviders = _normalizeArray(viewProviders);
      this.queries = _normalizeArray(queries);
      this.viewQueries = _normalizeArray(viewQueries);
      this.template = template;
    }
    CompileDirectiveMetadata.create = function(_a) {
      var _b = _a === void 0 ? {} : _a,
          type = _b.type,
          isComponent = _b.isComponent,
          selector = _b.selector,
          exportAs = _b.exportAs,
          changeDetection = _b.changeDetection,
          inputs = _b.inputs,
          outputs = _b.outputs,
          host = _b.host,
          lifecycleHooks = _b.lifecycleHooks,
          providers = _b.providers,
          viewProviders = _b.viewProviders,
          queries = _b.queries,
          viewQueries = _b.viewQueries,
          template = _b.template;
      var hostListeners = {};
      var hostProperties = {};
      var hostAttributes = {};
      if (lang_1.isPresent(host)) {
        collection_1.StringMapWrapper.forEach(host, function(value, key) {
          var matches = lang_1.RegExpWrapper.firstMatch(HOST_REG_EXP, key);
          if (lang_1.isBlank(matches)) {
            hostAttributes[key] = value;
          } else if (lang_1.isPresent(matches[1])) {
            hostProperties[matches[1]] = value;
          } else if (lang_1.isPresent(matches[2])) {
            hostListeners[matches[2]] = value;
          }
        });
      }
      var inputsMap = {};
      if (lang_1.isPresent(inputs)) {
        inputs.forEach(function(bindConfig) {
          var parts = util_1.splitAtColon(bindConfig, [bindConfig, bindConfig]);
          inputsMap[parts[0]] = parts[1];
        });
      }
      var outputsMap = {};
      if (lang_1.isPresent(outputs)) {
        outputs.forEach(function(bindConfig) {
          var parts = util_1.splitAtColon(bindConfig, [bindConfig, bindConfig]);
          outputsMap[parts[0]] = parts[1];
        });
      }
      return new CompileDirectiveMetadata({
        type: type,
        isComponent: lang_1.normalizeBool(isComponent),
        selector: selector,
        exportAs: exportAs,
        changeDetection: changeDetection,
        inputs: inputsMap,
        outputs: outputsMap,
        hostListeners: hostListeners,
        hostProperties: hostProperties,
        hostAttributes: hostAttributes,
        lifecycleHooks: lang_1.isPresent(lifecycleHooks) ? lifecycleHooks : [],
        providers: providers,
        viewProviders: viewProviders,
        queries: queries,
        viewQueries: viewQueries,
        template: template
      });
    };
    Object.defineProperty(CompileDirectiveMetadata.prototype, "identifier", {
      get: function() {
        return this.type;
      },
      enumerable: true,
      configurable: true
    });
    CompileDirectiveMetadata.fromJson = function(data) {
      return new CompileDirectiveMetadata({
        isComponent: data['isComponent'],
        selector: data['selector'],
        exportAs: data['exportAs'],
        type: lang_1.isPresent(data['type']) ? CompileTypeMetadata.fromJson(data['type']) : data['type'],
        changeDetection: lang_1.isPresent(data['changeDetection']) ? core_private_1.CHANGE_DETECTION_STRATEGY_VALUES[data['changeDetection']] : data['changeDetection'],
        inputs: data['inputs'],
        outputs: data['outputs'],
        hostListeners: data['hostListeners'],
        hostProperties: data['hostProperties'],
        hostAttributes: data['hostAttributes'],
        lifecycleHooks: data['lifecycleHooks'].map(function(hookValue) {
          return core_private_1.LIFECYCLE_HOOKS_VALUES[hookValue];
        }),
        template: lang_1.isPresent(data['template']) ? CompileTemplateMetadata.fromJson(data['template']) : data['template'],
        providers: _arrayFromJson(data['providers'], metadataFromJson),
        viewProviders: _arrayFromJson(data['viewProviders'], metadataFromJson),
        queries: _arrayFromJson(data['queries'], CompileQueryMetadata.fromJson),
        viewQueries: _arrayFromJson(data['viewQueries'], CompileQueryMetadata.fromJson)
      });
    };
    CompileDirectiveMetadata.prototype.toJson = function() {
      return {
        'class': 'Directive',
        'isComponent': this.isComponent,
        'selector': this.selector,
        'exportAs': this.exportAs,
        'type': lang_1.isPresent(this.type) ? this.type.toJson() : this.type,
        'changeDetection': lang_1.isPresent(this.changeDetection) ? lang_1.serializeEnum(this.changeDetection) : this.changeDetection,
        'inputs': this.inputs,
        'outputs': this.outputs,
        'hostListeners': this.hostListeners,
        'hostProperties': this.hostProperties,
        'hostAttributes': this.hostAttributes,
        'lifecycleHooks': this.lifecycleHooks.map(function(hook) {
          return lang_1.serializeEnum(hook);
        }),
        'template': lang_1.isPresent(this.template) ? this.template.toJson() : this.template,
        'providers': _arrayToJson(this.providers),
        'viewProviders': _arrayToJson(this.viewProviders),
        'queries': _arrayToJson(this.queries),
        'viewQueries': _arrayToJson(this.viewQueries)
      };
    };
    return CompileDirectiveMetadata;
  }());
  exports.CompileDirectiveMetadata = CompileDirectiveMetadata;
  function createHostComponentMeta(componentType, componentSelector) {
    var template = selector_1.CssSelector.parse(componentSelector)[0].getMatchingElementTemplate();
    return CompileDirectiveMetadata.create({
      type: new CompileTypeMetadata({
        runtime: Object,
        name: componentType.name + "_Host",
        moduleUrl: componentType.moduleUrl,
        isHost: true
      }),
      template: new CompileTemplateMetadata({
        template: template,
        templateUrl: '',
        styles: [],
        styleUrls: [],
        ngContentSelectors: []
      }),
      changeDetection: core_1.ChangeDetectionStrategy.Default,
      inputs: [],
      outputs: [],
      host: {},
      lifecycleHooks: [],
      isComponent: true,
      selector: '*',
      providers: [],
      viewProviders: [],
      queries: [],
      viewQueries: []
    });
  }
  exports.createHostComponentMeta = createHostComponentMeta;
  var CompilePipeMetadata = (function() {
    function CompilePipeMetadata(_a) {
      var _b = _a === void 0 ? {} : _a,
          type = _b.type,
          name = _b.name,
          pure = _b.pure,
          lifecycleHooks = _b.lifecycleHooks;
      this.type = type;
      this.name = name;
      this.pure = lang_1.normalizeBool(pure);
      this.lifecycleHooks = _normalizeArray(lifecycleHooks);
    }
    Object.defineProperty(CompilePipeMetadata.prototype, "identifier", {
      get: function() {
        return this.type;
      },
      enumerable: true,
      configurable: true
    });
    CompilePipeMetadata.fromJson = function(data) {
      return new CompilePipeMetadata({
        type: lang_1.isPresent(data['type']) ? CompileTypeMetadata.fromJson(data['type']) : data['type'],
        name: data['name'],
        pure: data['pure']
      });
    };
    CompilePipeMetadata.prototype.toJson = function() {
      return {
        'class': 'Pipe',
        'type': lang_1.isPresent(this.type) ? this.type.toJson() : null,
        'name': this.name,
        'pure': this.pure
      };
    };
    return CompilePipeMetadata;
  }());
  exports.CompilePipeMetadata = CompilePipeMetadata;
  var _COMPILE_METADATA_FROM_JSON = {
    'Directive': CompileDirectiveMetadata.fromJson,
    'Pipe': CompilePipeMetadata.fromJson,
    'Type': CompileTypeMetadata.fromJson,
    'Provider': CompileProviderMetadata.fromJson,
    'Identifier': CompileIdentifierMetadata.fromJson,
    'Factory': CompileFactoryMetadata.fromJson
  };
  function _arrayFromJson(obj, fn) {
    return lang_1.isBlank(obj) ? null : obj.map(function(o) {
      return _objFromJson(o, fn);
    });
  }
  function _arrayToJson(obj) {
    return lang_1.isBlank(obj) ? null : obj.map(_objToJson);
  }
  function _objFromJson(obj, fn) {
    if (lang_1.isArray(obj))
      return _arrayFromJson(obj, fn);
    if (lang_1.isString(obj) || lang_1.isBlank(obj) || lang_1.isBoolean(obj) || lang_1.isNumber(obj))
      return obj;
    return fn(obj);
  }
  function _objToJson(obj) {
    if (lang_1.isArray(obj))
      return _arrayToJson(obj);
    if (lang_1.isString(obj) || lang_1.isBlank(obj) || lang_1.isBoolean(obj) || lang_1.isNumber(obj))
      return obj;
    return obj.toJson();
  }
  function _normalizeArray(obj) {
    return lang_1.isPresent(obj) ? obj : [];
  }
  return module.exports;
});

System.registerDynamic("@angular/compiler/src/util.js", ["./facade/lang", "./facade/collection"], true, function($__require, exports, module) {
  "use strict";
  ;
  var define,
      global = this,
      GLOBAL = this;
  var lang_1 = $__require('./facade/lang');
  var collection_1 = $__require('./facade/collection');
  exports.MODULE_SUFFIX = lang_1.IS_DART ? '.dart' : '';
  var CAMEL_CASE_REGEXP = /([A-Z])/g;
  var DASH_CASE_REGEXP = /-([a-z])/g;
  function camelCaseToDashCase(input) {
    return lang_1.StringWrapper.replaceAllMapped(input, CAMEL_CASE_REGEXP, function(m) {
      return '-' + m[1].toLowerCase();
    });
  }
  exports.camelCaseToDashCase = camelCaseToDashCase;
  function dashCaseToCamelCase(input) {
    return lang_1.StringWrapper.replaceAllMapped(input, DASH_CASE_REGEXP, function(m) {
      return m[1].toUpperCase();
    });
  }
  exports.dashCaseToCamelCase = dashCaseToCamelCase;
  function splitAtColon(input, defaultValues) {
    var parts = lang_1.StringWrapper.split(input.trim(), /\s*:\s*/g);
    if (parts.length > 1) {
      return parts;
    } else {
      return defaultValues;
    }
  }
  exports.splitAtColon = splitAtColon;
  function sanitizeIdentifier(name) {
    return lang_1.StringWrapper.replaceAll(name, /\W/g, '_');
  }
  exports.sanitizeIdentifier = sanitizeIdentifier;
  function visitValue(value, visitor, context) {
    if (lang_1.isArray(value)) {
      return visitor.visitArray(value, context);
    } else if (lang_1.isStrictStringMap(value)) {
      return visitor.visitStringMap(value, context);
    } else if (lang_1.isBlank(value) || lang_1.isPrimitive(value)) {
      return visitor.visitPrimitive(value, context);
    } else {
      return visitor.visitOther(value, context);
    }
  }
  exports.visitValue = visitValue;
  var ValueTransformer = (function() {
    function ValueTransformer() {}
    ValueTransformer.prototype.visitArray = function(arr, context) {
      var _this = this;
      return arr.map(function(value) {
        return visitValue(value, _this, context);
      });
    };
    ValueTransformer.prototype.visitStringMap = function(map, context) {
      var _this = this;
      var result = {};
      collection_1.StringMapWrapper.forEach(map, function(value, key) {
        result[key] = visitValue(value, _this, context);
      });
      return result;
    };
    ValueTransformer.prototype.visitPrimitive = function(value, context) {
      return value;
    };
    ValueTransformer.prototype.visitOther = function(value, context) {
      return value;
    };
    return ValueTransformer;
  }());
  exports.ValueTransformer = ValueTransformer;
  function assetUrl(pkg, path, type) {
    if (path === void 0) {
      path = null;
    }
    if (type === void 0) {
      type = 'src';
    }
    if (lang_1.IS_DART) {
      if (path == null) {
        return "asset:angular2/" + pkg + "/" + pkg + ".dart";
      } else {
        return "asset:angular2/lib/" + pkg + "/src/" + path + ".dart";
      }
    } else {
      if (path == null) {
        return "asset:@angular/lib/" + pkg + "/index";
      } else {
        return "asset:@angular/lib/" + pkg + "/src/" + path;
      }
    }
  }
  exports.assetUrl = assetUrl;
  return module.exports;
});

System.registerDynamic("@angular/compiler/src/identifiers.js", ["@angular/core", "../core_private", "./compile_metadata", "./util"], true, function($__require, exports, module) {
  "use strict";
  ;
  var define,
      global = this,
      GLOBAL = this;
  var core_1 = $__require('@angular/core');
  var core_private_1 = $__require('../core_private');
  var core_private_2 = $__require('../core_private');
  var compile_metadata_1 = $__require('./compile_metadata');
  var util_1 = $__require('./util');
  var APP_VIEW_MODULE_URL = util_1.assetUrl('core', 'linker/view');
  var VIEW_UTILS_MODULE_URL = util_1.assetUrl('core', 'linker/view_utils');
  var CD_MODULE_URL = util_1.assetUrl('core', 'change_detection/change_detection');
  var impViewUtils = core_private_2.ViewUtils;
  var impAppView = core_private_2.AppView;
  var impDebugAppView = core_private_2.DebugAppView;
  var impDebugContext = core_private_2.DebugContext;
  var impAppElement = core_private_2.AppElement;
  var impElementRef = core_1.ElementRef;
  var impViewContainerRef = core_1.ViewContainerRef;
  var impChangeDetectorRef = core_1.ChangeDetectorRef;
  var impRenderComponentType = core_1.RenderComponentType;
  var impQueryList = core_1.QueryList;
  var impTemplateRef = core_1.TemplateRef;
  var impTemplateRef_ = core_private_2.TemplateRef_;
  var impValueUnwrapper = core_private_2.ValueUnwrapper;
  var impInjector = core_1.Injector;
  var impViewEncapsulation = core_1.ViewEncapsulation;
  var impViewType = core_private_2.ViewType;
  var impChangeDetectionStrategy = core_1.ChangeDetectionStrategy;
  var impStaticNodeDebugInfo = core_private_2.StaticNodeDebugInfo;
  var impRenderer = core_1.Renderer;
  var impSimpleChange = core_1.SimpleChange;
  var impUninitialized = core_private_2.uninitialized;
  var impChangeDetectorState = core_private_2.ChangeDetectorState;
  var impFlattenNestedViewRenderNodes = core_private_2.flattenNestedViewRenderNodes;
  var impDevModeEqual = core_private_2.devModeEqual;
  var impInterpolate = core_private_2.interpolate;
  var impCheckBinding = core_private_2.checkBinding;
  var impCastByValue = core_private_2.castByValue;
  var impEMPTY_ARRAY = core_private_2.EMPTY_ARRAY;
  var impEMPTY_MAP = core_private_2.EMPTY_MAP;
  var Identifiers = (function() {
    function Identifiers() {}
    Identifiers.ViewUtils = new compile_metadata_1.CompileIdentifierMetadata({
      name: 'ViewUtils',
      moduleUrl: util_1.assetUrl('core', 'linker/view_utils'),
      runtime: impViewUtils
    });
    Identifiers.AppView = new compile_metadata_1.CompileIdentifierMetadata({
      name: 'AppView',
      moduleUrl: APP_VIEW_MODULE_URL,
      runtime: impAppView
    });
    Identifiers.DebugAppView = new compile_metadata_1.CompileIdentifierMetadata({
      name: 'DebugAppView',
      moduleUrl: APP_VIEW_MODULE_URL,
      runtime: impDebugAppView
    });
    Identifiers.AppElement = new compile_metadata_1.CompileIdentifierMetadata({
      name: 'AppElement',
      moduleUrl: util_1.assetUrl('core', 'linker/element'),
      runtime: impAppElement
    });
    Identifiers.ElementRef = new compile_metadata_1.CompileIdentifierMetadata({
      name: 'ElementRef',
      moduleUrl: util_1.assetUrl('core', 'linker/element_ref'),
      runtime: impElementRef
    });
    Identifiers.ViewContainerRef = new compile_metadata_1.CompileIdentifierMetadata({
      name: 'ViewContainerRef',
      moduleUrl: util_1.assetUrl('core', 'linker/view_container_ref'),
      runtime: impViewContainerRef
    });
    Identifiers.ChangeDetectorRef = new compile_metadata_1.CompileIdentifierMetadata({
      name: 'ChangeDetectorRef',
      moduleUrl: util_1.assetUrl('core', 'change_detection/change_detector_ref'),
      runtime: impChangeDetectorRef
    });
    Identifiers.RenderComponentType = new compile_metadata_1.CompileIdentifierMetadata({
      name: 'RenderComponentType',
      moduleUrl: util_1.assetUrl('core', 'render/api'),
      runtime: impRenderComponentType
    });
    Identifiers.QueryList = new compile_metadata_1.CompileIdentifierMetadata({
      name: 'QueryList',
      moduleUrl: util_1.assetUrl('core', 'linker/query_list'),
      runtime: impQueryList
    });
    Identifiers.TemplateRef = new compile_metadata_1.CompileIdentifierMetadata({
      name: 'TemplateRef',
      moduleUrl: util_1.assetUrl('core', 'linker/template_ref'),
      runtime: impTemplateRef
    });
    Identifiers.TemplateRef_ = new compile_metadata_1.CompileIdentifierMetadata({
      name: 'TemplateRef_',
      moduleUrl: util_1.assetUrl('core', 'linker/template_ref'),
      runtime: impTemplateRef_
    });
    Identifiers.ValueUnwrapper = new compile_metadata_1.CompileIdentifierMetadata({
      name: 'ValueUnwrapper',
      moduleUrl: CD_MODULE_URL,
      runtime: impValueUnwrapper
    });
    Identifiers.Injector = new compile_metadata_1.CompileIdentifierMetadata({
      name: 'Injector',
      moduleUrl: util_1.assetUrl('core', 'di/injector'),
      runtime: impInjector
    });
    Identifiers.ViewEncapsulation = new compile_metadata_1.CompileIdentifierMetadata({
      name: 'ViewEncapsulation',
      moduleUrl: util_1.assetUrl('core', 'metadata/view'),
      runtime: impViewEncapsulation
    });
    Identifiers.ViewType = new compile_metadata_1.CompileIdentifierMetadata({
      name: 'ViewType',
      moduleUrl: util_1.assetUrl('core', 'linker/view_type'),
      runtime: impViewType
    });
    Identifiers.ChangeDetectionStrategy = new compile_metadata_1.CompileIdentifierMetadata({
      name: 'ChangeDetectionStrategy',
      moduleUrl: CD_MODULE_URL,
      runtime: impChangeDetectionStrategy
    });
    Identifiers.StaticNodeDebugInfo = new compile_metadata_1.CompileIdentifierMetadata({
      name: 'StaticNodeDebugInfo',
      moduleUrl: util_1.assetUrl('core', 'linker/debug_context'),
      runtime: impStaticNodeDebugInfo
    });
    Identifiers.DebugContext = new compile_metadata_1.CompileIdentifierMetadata({
      name: 'DebugContext',
      moduleUrl: util_1.assetUrl('core', 'linker/debug_context'),
      runtime: impDebugContext
    });
    Identifiers.Renderer = new compile_metadata_1.CompileIdentifierMetadata({
      name: 'Renderer',
      moduleUrl: util_1.assetUrl('core', 'render/api'),
      runtime: impRenderer
    });
    Identifiers.SimpleChange = new compile_metadata_1.CompileIdentifierMetadata({
      name: 'SimpleChange',
      moduleUrl: CD_MODULE_URL,
      runtime: impSimpleChange
    });
    Identifiers.uninitialized = new compile_metadata_1.CompileIdentifierMetadata({
      name: 'uninitialized',
      moduleUrl: CD_MODULE_URL,
      runtime: impUninitialized
    });
    Identifiers.ChangeDetectorState = new compile_metadata_1.CompileIdentifierMetadata({
      name: 'ChangeDetectorState',
      moduleUrl: CD_MODULE_URL,
      runtime: impChangeDetectorState
    });
    Identifiers.checkBinding = new compile_metadata_1.CompileIdentifierMetadata({
      name: 'checkBinding',
      moduleUrl: VIEW_UTILS_MODULE_URL,
      runtime: impCheckBinding
    });
    Identifiers.flattenNestedViewRenderNodes = new compile_metadata_1.CompileIdentifierMetadata({
      name: 'flattenNestedViewRenderNodes',
      moduleUrl: VIEW_UTILS_MODULE_URL,
      runtime: impFlattenNestedViewRenderNodes
    });
    Identifiers.devModeEqual = new compile_metadata_1.CompileIdentifierMetadata({
      name: 'devModeEqual',
      moduleUrl: CD_MODULE_URL,
      runtime: impDevModeEqual
    });
    Identifiers.interpolate = new compile_metadata_1.CompileIdentifierMetadata({
      name: 'interpolate',
      moduleUrl: VIEW_UTILS_MODULE_URL,
      runtime: impInterpolate
    });
    Identifiers.castByValue = new compile_metadata_1.CompileIdentifierMetadata({
      name: 'castByValue',
      moduleUrl: VIEW_UTILS_MODULE_URL,
      runtime: impCastByValue
    });
    Identifiers.EMPTY_ARRAY = new compile_metadata_1.CompileIdentifierMetadata({
      name: 'EMPTY_ARRAY',
      moduleUrl: VIEW_UTILS_MODULE_URL,
      runtime: impEMPTY_ARRAY
    });
    Identifiers.EMPTY_MAP = new compile_metadata_1.CompileIdentifierMetadata({
      name: 'EMPTY_MAP',
      moduleUrl: VIEW_UTILS_MODULE_URL,
      runtime: impEMPTY_MAP
    });
    Identifiers.pureProxies = [null, new compile_metadata_1.CompileIdentifierMetadata({
      name: 'pureProxy1',
      moduleUrl: VIEW_UTILS_MODULE_URL,
      runtime: core_private_2.pureProxy1
    }), new compile_metadata_1.CompileIdentifierMetadata({
      name: 'pureProxy2',
      moduleUrl: VIEW_UTILS_MODULE_URL,
      runtime: core_private_2.pureProxy2
    }), new compile_metadata_1.CompileIdentifierMetadata({
      name: 'pureProxy3',
      moduleUrl: VIEW_UTILS_MODULE_URL,
      runtime: core_private_2.pureProxy3
    }), new compile_metadata_1.CompileIdentifierMetadata({
      name: 'pureProxy4',
      moduleUrl: VIEW_UTILS_MODULE_URL,
      runtime: core_private_2.pureProxy4
    }), new compile_metadata_1.CompileIdentifierMetadata({
      name: 'pureProxy5',
      moduleUrl: VIEW_UTILS_MODULE_URL,
      runtime: core_private_2.pureProxy5
    }), new compile_metadata_1.CompileIdentifierMetadata({
      name: 'pureProxy6',
      moduleUrl: VIEW_UTILS_MODULE_URL,
      runtime: core_private_2.pureProxy6
    }), new compile_metadata_1.CompileIdentifierMetadata({
      name: 'pureProxy7',
      moduleUrl: VIEW_UTILS_MODULE_URL,
      runtime: core_private_2.pureProxy7
    }), new compile_metadata_1.CompileIdentifierMetadata({
      name: 'pureProxy8',
      moduleUrl: VIEW_UTILS_MODULE_URL,
      runtime: core_private_2.pureProxy8
    }), new compile_metadata_1.CompileIdentifierMetadata({
      name: 'pureProxy9',
      moduleUrl: VIEW_UTILS_MODULE_URL,
      runtime: core_private_2.pureProxy9
    }), new compile_metadata_1.CompileIdentifierMetadata({
      name: 'pureProxy10',
      moduleUrl: VIEW_UTILS_MODULE_URL,
      runtime: core_private_2.pureProxy10
    })];
    Identifiers.SecurityContext = new compile_metadata_1.CompileIdentifierMetadata({
      name: 'SecurityContext',
      moduleUrl: util_1.assetUrl('core', 'security'),
      runtime: core_private_1.SecurityContext
    });
    return Identifiers;
  }());
  exports.Identifiers = Identifiers;
  function identifierToken(identifier) {
    return new compile_metadata_1.CompileTokenMetadata({identifier: identifier});
  }
  exports.identifierToken = identifierToken;
  return module.exports;
});

System.registerDynamic("@angular/compiler/src/config.js", ["../src/facade/lang", "../src/facade/exceptions", "./identifiers"], true, function($__require, exports, module) {
  "use strict";
  ;
  var define,
      global = this,
      GLOBAL = this;
  var lang_1 = $__require('../src/facade/lang');
  var exceptions_1 = $__require('../src/facade/exceptions');
  var identifiers_1 = $__require('./identifiers');
  var CompilerConfig = (function() {
    function CompilerConfig(genDebugInfo, logBindingUpdate, useJit, renderTypes) {
      if (renderTypes === void 0) {
        renderTypes = null;
      }
      this.genDebugInfo = genDebugInfo;
      this.logBindingUpdate = logBindingUpdate;
      this.useJit = useJit;
      if (lang_1.isBlank(renderTypes)) {
        renderTypes = new DefaultRenderTypes();
      }
      this.renderTypes = renderTypes;
    }
    return CompilerConfig;
  }());
  exports.CompilerConfig = CompilerConfig;
  var RenderTypes = (function() {
    function RenderTypes() {}
    Object.defineProperty(RenderTypes.prototype, "renderer", {
      get: function() {
        return exceptions_1.unimplemented();
      },
      enumerable: true,
      configurable: true
    });
    Object.defineProperty(RenderTypes.prototype, "renderText", {
      get: function() {
        return exceptions_1.unimplemented();
      },
      enumerable: true,
      configurable: true
    });
    Object.defineProperty(RenderTypes.prototype, "renderElement", {
      get: function() {
        return exceptions_1.unimplemented();
      },
      enumerable: true,
      configurable: true
    });
    Object.defineProperty(RenderTypes.prototype, "renderComment", {
      get: function() {
        return exceptions_1.unimplemented();
      },
      enumerable: true,
      configurable: true
    });
    Object.defineProperty(RenderTypes.prototype, "renderNode", {
      get: function() {
        return exceptions_1.unimplemented();
      },
      enumerable: true,
      configurable: true
    });
    Object.defineProperty(RenderTypes.prototype, "renderEvent", {
      get: function() {
        return exceptions_1.unimplemented();
      },
      enumerable: true,
      configurable: true
    });
    return RenderTypes;
  }());
  exports.RenderTypes = RenderTypes;
  var DefaultRenderTypes = (function() {
    function DefaultRenderTypes() {
      this.renderer = identifiers_1.Identifiers.Renderer;
      this.renderText = null;
      this.renderElement = null;
      this.renderComment = null;
      this.renderNode = null;
      this.renderEvent = null;
    }
    return DefaultRenderTypes;
  }());
  exports.DefaultRenderTypes = DefaultRenderTypes;
  return module.exports;
});

System.registerDynamic("@angular/compiler/src/view_compiler/view_compiler.js", ["@angular/core", "./compile_element", "./compile_view", "./view_builder", "./view_binder", "../config"], true, function($__require, exports, module) {
  "use strict";
  ;
  var define,
      global = this,
      GLOBAL = this;
  var core_1 = $__require('@angular/core');
  var compile_element_1 = $__require('./compile_element');
  var compile_view_1 = $__require('./compile_view');
  var view_builder_1 = $__require('./view_builder');
  var view_binder_1 = $__require('./view_binder');
  var config_1 = $__require('../config');
  var ViewCompileResult = (function() {
    function ViewCompileResult(statements, viewFactoryVar, dependencies) {
      this.statements = statements;
      this.viewFactoryVar = viewFactoryVar;
      this.dependencies = dependencies;
    }
    return ViewCompileResult;
  }());
  exports.ViewCompileResult = ViewCompileResult;
  var ViewCompiler = (function() {
    function ViewCompiler(_genConfig) {
      this._genConfig = _genConfig;
    }
    ViewCompiler.prototype.compileComponent = function(component, template, styles, pipes) {
      var statements = [];
      var dependencies = [];
      var view = new compile_view_1.CompileView(component, this._genConfig, pipes, styles, 0, compile_element_1.CompileElement.createNull(), []);
      view_builder_1.buildView(view, template, dependencies);
      view_binder_1.bindView(view, template);
      view_builder_1.finishView(view, statements);
      return new ViewCompileResult(statements, view.viewFactory.name, dependencies);
    };
    ViewCompiler.decorators = [{type: core_1.Injectable}];
    ViewCompiler.ctorParameters = [{type: config_1.CompilerConfig}];
    return ViewCompiler;
  }());
  exports.ViewCompiler = ViewCompiler;
  return module.exports;
});

System.registerDynamic("@angular/compiler/core_private.js", ["@angular/core"], true, function($__require, exports, module) {
  "use strict";
  ;
  var define,
      global = this,
      GLOBAL = this;
  var core_1 = $__require('@angular/core');
  exports.isDefaultChangeDetectionStrategy = core_1.__core_private__.isDefaultChangeDetectionStrategy;
  exports.ChangeDetectorState = core_1.__core_private__.ChangeDetectorState;
  exports.CHANGE_DETECTION_STRATEGY_VALUES = core_1.__core_private__.CHANGE_DETECTION_STRATEGY_VALUES;
  exports.constructDependencies = core_1.__core_private__.constructDependencies;
  exports.LifecycleHooks = core_1.__core_private__.LifecycleHooks;
  exports.LIFECYCLE_HOOKS_VALUES = core_1.__core_private__.LIFECYCLE_HOOKS_VALUES;
  exports.ReflectorReader = core_1.__core_private__.ReflectorReader;
  exports.ReflectorComponentResolver = core_1.__core_private__.ReflectorComponentResolver;
  exports.AppElement = core_1.__core_private__.AppElement;
  exports.AppView = core_1.__core_private__.AppView;
  exports.DebugAppView = core_1.__core_private__.DebugAppView;
  exports.ViewType = core_1.__core_private__.ViewType;
  exports.MAX_INTERPOLATION_VALUES = core_1.__core_private__.MAX_INTERPOLATION_VALUES;
  exports.checkBinding = core_1.__core_private__.checkBinding;
  exports.flattenNestedViewRenderNodes = core_1.__core_private__.flattenNestedViewRenderNodes;
  exports.interpolate = core_1.__core_private__.interpolate;
  exports.ViewUtils = core_1.__core_private__.ViewUtils;
  exports.VIEW_ENCAPSULATION_VALUES = core_1.__core_private__.VIEW_ENCAPSULATION_VALUES;
  exports.DebugContext = core_1.__core_private__.DebugContext;
  exports.StaticNodeDebugInfo = core_1.__core_private__.StaticNodeDebugInfo;
  exports.devModeEqual = core_1.__core_private__.devModeEqual;
  exports.uninitialized = core_1.__core_private__.uninitialized;
  exports.ValueUnwrapper = core_1.__core_private__.ValueUnwrapper;
  exports.TemplateRef_ = core_1.__core_private__.TemplateRef_;
  exports.RenderDebugInfo = core_1.__core_private__.RenderDebugInfo;
  exports.SecurityContext = core_1.__core_private__.SecurityContext;
  exports.SanitizationService = core_1.__core_private__.SanitizationService;
  exports.createProvider = core_1.__core_private__.createProvider;
  exports.isProviderLiteral = core_1.__core_private__.isProviderLiteral;
  exports.EMPTY_ARRAY = core_1.__core_private__.EMPTY_ARRAY;
  exports.EMPTY_MAP = core_1.__core_private__.EMPTY_MAP;
  exports.pureProxy1 = core_1.__core_private__.pureProxy1;
  exports.pureProxy2 = core_1.__core_private__.pureProxy2;
  exports.pureProxy3 = core_1.__core_private__.pureProxy3;
  exports.pureProxy4 = core_1.__core_private__.pureProxy4;
  exports.pureProxy5 = core_1.__core_private__.pureProxy5;
  exports.pureProxy6 = core_1.__core_private__.pureProxy6;
  exports.pureProxy7 = core_1.__core_private__.pureProxy7;
  exports.pureProxy8 = core_1.__core_private__.pureProxy8;
  exports.pureProxy9 = core_1.__core_private__.pureProxy9;
  exports.pureProxy10 = core_1.__core_private__.pureProxy10;
  exports.castByValue = core_1.__core_private__.castByValue;
  exports.Console = core_1.__core_private__.Console;
  return module.exports;
});

System.registerDynamic("@angular/compiler/src/schema/element_schema_registry.js", [], true, function($__require, exports, module) {
  "use strict";
  ;
  var define,
      global = this,
      GLOBAL = this;
  var ElementSchemaRegistry = (function() {
    function ElementSchemaRegistry() {}
    return ElementSchemaRegistry;
  }());
  exports.ElementSchemaRegistry = ElementSchemaRegistry;
  return module.exports;
});

System.registerDynamic("@angular/compiler/src/schema/dom_element_schema_registry.js", ["@angular/core", "../../core_private", "../facade/lang", "../facade/collection", "./element_schema_registry"], true, function($__require, exports, module) {
  "use strict";
  ;
  var define,
      global = this,
      GLOBAL = this;
  var __extends = (this && this.__extends) || function(d, b) {
    for (var p in b)
      if (b.hasOwnProperty(p))
        d[p] = b[p];
    function __() {
      this.constructor = d;
    }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
  };
  var core_1 = $__require('@angular/core');
  var core_private_1 = $__require('../../core_private');
  var lang_1 = $__require('../facade/lang');
  var collection_1 = $__require('../facade/collection');
  var element_schema_registry_1 = $__require('./element_schema_registry');
  var EVENT = 'event';
  var BOOLEAN = 'boolean';
  var NUMBER = 'number';
  var STRING = 'string';
  var OBJECT = 'object';
  var SCHEMA = (['*|%classList,className,id,innerHTML,*beforecopy,*beforecut,*beforepaste,*copy,*cut,*paste,*search,*selectstart,*webkitfullscreenchange,*webkitfullscreenerror,*wheel,outerHTML,#scrollLeft,#scrollTop', '^*|accessKey,contentEditable,dir,!draggable,!hidden,innerText,lang,*abort,*autocomplete,*autocompleteerror,*beforecopy,*beforecut,*beforepaste,*blur,*cancel,*canplay,*canplaythrough,*change,*click,*close,*contextmenu,*copy,*cuechange,*cut,*dblclick,*drag,*dragend,*dragenter,*dragleave,*dragover,*dragstart,*drop,*durationchange,*emptied,*ended,*error,*focus,*input,*invalid,*keydown,*keypress,*keyup,*load,*loadeddata,*loadedmetadata,*loadstart,*message,*mousedown,*mouseenter,*mouseleave,*mousemove,*mouseout,*mouseover,*mouseup,*mousewheel,*mozfullscreenchange,*mozfullscreenerror,*mozpointerlockchange,*mozpointerlockerror,*paste,*pause,*play,*playing,*progress,*ratechange,*reset,*resize,*scroll,*search,*seeked,*seeking,*select,*selectstart,*show,*stalled,*submit,*suspend,*timeupdate,*toggle,*volumechange,*waiting,*webglcontextcreationerror,*webglcontextlost,*webglcontextrestored,*webkitfullscreenchange,*webkitfullscreenerror,*wheel,outerText,!spellcheck,%style,#tabIndex,title,!translate', 'media|!autoplay,!controls,%crossOrigin,#currentTime,!defaultMuted,#defaultPlaybackRate,!disableRemotePlayback,!loop,!muted,*encrypted,#playbackRate,preload,src,#volume', '@svg:^*|*abort,*autocomplete,*autocompleteerror,*blur,*cancel,*canplay,*canplaythrough,*change,*click,*close,*contextmenu,*cuechange,*dblclick,*drag,*dragend,*dragenter,*dragleave,*dragover,*dragstart,*drop,*durationchange,*emptied,*ended,*error,*focus,*input,*invalid,*keydown,*keypress,*keyup,*load,*loadeddata,*loadedmetadata,*loadstart,*mousedown,*mouseenter,*mouseleave,*mousemove,*mouseout,*mouseover,*mouseup,*mousewheel,*pause,*play,*playing,*progress,*ratechange,*reset,*resize,*scroll,*seeked,*seeking,*select,*show,*stalled,*submit,*suspend,*timeupdate,*toggle,*volumechange,*waiting,%style,#tabIndex', '@svg:graphics^@svg:|', '@svg:animation^@svg:|*begin,*end,*repeat', '@svg:geometry^@svg:|', '@svg:componentTransferFunction^@svg:|', '@svg:gradient^@svg:|', '@svg:textContent^@svg:graphics|', '@svg:textPositioning^@svg:textContent|', 'a|charset,coords,download,hash,host,hostname,href,hreflang,name,password,pathname,ping,port,protocol,rel,rev,search,shape,target,text,type,username', 'area|alt,coords,hash,host,hostname,href,!noHref,password,pathname,ping,port,protocol,search,shape,target,username', 'audio^media|', 'br|clear', 'base|href,target', 'body|aLink,background,bgColor,link,*beforeunload,*blur,*error,*focus,*hashchange,*languagechange,*load,*message,*offline,*online,*pagehide,*pageshow,*popstate,*rejectionhandled,*resize,*scroll,*storage,*unhandledrejection,*unload,text,vLink', 'button|!autofocus,!disabled,formAction,formEnctype,formMethod,!formNoValidate,formTarget,name,type,value', 'canvas|#height,#width', 'content|select', 'dl|!compact', 'datalist|', 'details|!open', 'dialog|!open,returnValue', 'dir|!compact', 'div|align', 'embed|align,height,name,src,type,width', 'fieldset|!disabled,name', 'font|color,face,size', 'form|acceptCharset,action,autocomplete,encoding,enctype,method,name,!noValidate,target', 'frame|frameBorder,longDesc,marginHeight,marginWidth,name,!noResize,scrolling,src', 'frameset|cols,*beforeunload,*blur,*error,*focus,*hashchange,*languagechange,*load,*message,*offline,*online,*pagehide,*pageshow,*popstate,*rejectionhandled,*resize,*scroll,*storage,*unhandledrejection,*unload,rows', 'hr|align,color,!noShade,size,width', 'head|', 'h1,h2,h3,h4,h5,h6|align', 'html|version', 'iframe|align,!allowFullscreen,frameBorder,height,longDesc,marginHeight,marginWidth,name,%sandbox,scrolling,src,srcdoc,width', 'img|align,alt,border,%crossOrigin,#height,#hspace,!isMap,longDesc,lowsrc,name,sizes,src,srcset,useMap,#vspace,#width', 'input|accept,align,alt,autocapitalize,autocomplete,!autofocus,!checked,!defaultChecked,defaultValue,dirName,!disabled,%files,formAction,formEnctype,formMethod,!formNoValidate,formTarget,#height,!incremental,!indeterminate,max,#maxLength,min,#minLength,!multiple,name,pattern,placeholder,!readOnly,!required,selectionDirection,#selectionEnd,#selectionStart,#size,src,step,type,useMap,value,%valueAsDate,#valueAsNumber,#width', 'keygen|!autofocus,challenge,!disabled,keytype,name', 'li|type,#value', 'label|htmlFor', 'legend|align', 'link|as,charset,%crossOrigin,!disabled,href,hreflang,integrity,media,rel,%relList,rev,%sizes,target,type', 'map|name', 'marquee|behavior,bgColor,direction,height,#hspace,#loop,#scrollAmount,#scrollDelay,!trueSpeed,#vspace,width', 'menu|!compact', 'meta|content,httpEquiv,name,scheme', 'meter|#high,#low,#max,#min,#optimum,#value', 'ins,del|cite,dateTime', 'ol|!compact,!reversed,#start,type', 'object|align,archive,border,code,codeBase,codeType,data,!declare,height,#hspace,name,standby,type,useMap,#vspace,width', 'optgroup|!disabled,label', 'option|!defaultSelected,!disabled,label,!selected,text,value', 'output|defaultValue,%htmlFor,name,value', 'p|align', 'param|name,type,value,valueType', 'picture|', 'pre|#width', 'progress|#max,#value', 'q,blockquote,cite|', 'script|!async,charset,%crossOrigin,!defer,event,htmlFor,integrity,src,text,type', 'select|!autofocus,!disabled,#length,!multiple,name,!required,#selectedIndex,#size,value', 'shadow|', 'source|media,sizes,src,srcset,type', 'span|', 'style|!disabled,media,type', 'caption|align', 'th,td|abbr,align,axis,bgColor,ch,chOff,#colSpan,headers,height,!noWrap,#rowSpan,scope,vAlign,width', 'col,colgroup|align,ch,chOff,#span,vAlign,width', 'table|align,bgColor,border,%caption,cellPadding,cellSpacing,frame,rules,summary,%tFoot,%tHead,width', 'tr|align,bgColor,ch,chOff,vAlign', 'tfoot,thead,tbody|align,ch,chOff,vAlign', 'template|', 'textarea|autocapitalize,!autofocus,#cols,defaultValue,dirName,!disabled,#maxLength,#minLength,name,placeholder,!readOnly,!required,#rows,selectionDirection,#selectionEnd,#selectionStart,value,wrap', 'title|text', 'track|!default,kind,label,src,srclang', 'ul|!compact,type', 'unknown|', 'video^media|#height,poster,#width', '@svg:a^@svg:graphics|', '@svg:animate^@svg:animation|', '@svg:animateMotion^@svg:animation|', '@svg:animateTransform^@svg:animation|', '@svg:circle^@svg:geometry|', '@svg:clipPath^@svg:graphics|', '@svg:cursor^@svg:|', '@svg:defs^@svg:graphics|', '@svg:desc^@svg:|', '@svg:discard^@svg:|', '@svg:ellipse^@svg:geometry|', '@svg:feBlend^@svg:|', '@svg:feColorMatrix^@svg:|', '@svg:feComponentTransfer^@svg:|', '@svg:feComposite^@svg:|', '@svg:feConvolveMatrix^@svg:|', '@svg:feDiffuseLighting^@svg:|', '@svg:feDisplacementMap^@svg:|', '@svg:feDistantLight^@svg:|', '@svg:feDropShadow^@svg:|', '@svg:feFlood^@svg:|', '@svg:feFuncA^@svg:componentTransferFunction|', '@svg:feFuncB^@svg:componentTransferFunction|', '@svg:feFuncG^@svg:componentTransferFunction|', '@svg:feFuncR^@svg:componentTransferFunction|', '@svg:feGaussianBlur^@svg:|', '@svg:feImage^@svg:|', '@svg:feMerge^@svg:|', '@svg:feMergeNode^@svg:|', '@svg:feMorphology^@svg:|', '@svg:feOffset^@svg:|', '@svg:fePointLight^@svg:|', '@svg:feSpecularLighting^@svg:|', '@svg:feSpotLight^@svg:|', '@svg:feTile^@svg:|', '@svg:feTurbulence^@svg:|', '@svg:filter^@svg:|', '@svg:foreignObject^@svg:graphics|', '@svg:g^@svg:graphics|', '@svg:image^@svg:graphics|', '@svg:line^@svg:geometry|', '@svg:linearGradient^@svg:gradient|', '@svg:mpath^@svg:|', '@svg:marker^@svg:|', '@svg:mask^@svg:|', '@svg:metadata^@svg:|', '@svg:path^@svg:geometry|', '@svg:pattern^@svg:|', '@svg:polygon^@svg:geometry|', '@svg:polyline^@svg:geometry|', '@svg:radialGradient^@svg:gradient|', '@svg:rect^@svg:geometry|', '@svg:svg^@svg:graphics|#currentScale,#zoomAndPan', '@svg:script^@svg:|type', '@svg:set^@svg:animation|', '@svg:stop^@svg:|', '@svg:style^@svg:|!disabled,media,title,type', '@svg:switch^@svg:graphics|', '@svg:symbol^@svg:|', '@svg:tspan^@svg:textPositioning|', '@svg:text^@svg:textPositioning|', '@svg:textPath^@svg:textContent|', '@svg:title^@svg:|', '@svg:use^@svg:graphics|', '@svg:view^@svg:|#zoomAndPan']);
  var attrToPropMap = {
    'class': 'className',
    'innerHtml': 'innerHTML',
    'readonly': 'readOnly',
    'tabindex': 'tabIndex'
  };
  var DomElementSchemaRegistry = (function(_super) {
    __extends(DomElementSchemaRegistry, _super);
    function DomElementSchemaRegistry() {
      var _this = this;
      _super.call(this);
      this.schema = {};
      SCHEMA.forEach(function(encodedType) {
        var parts = encodedType.split('|');
        var properties = parts[1].split(',');
        var typeParts = (parts[0] + '^').split('^');
        var typeName = typeParts[0];
        var type = {};
        typeName.split(',').forEach(function(tag) {
          return _this.schema[tag] = type;
        });
        var superType = _this.schema[typeParts[1]];
        if (lang_1.isPresent(superType)) {
          collection_1.StringMapWrapper.forEach(superType, function(v, k) {
            return type[k] = v;
          });
        }
        properties.forEach(function(property) {
          if (property == '') {} else if (property.startsWith('*')) {} else if (property.startsWith('!')) {
            type[property.substring(1)] = BOOLEAN;
          } else if (property.startsWith('#')) {
            type[property.substring(1)] = NUMBER;
          } else if (property.startsWith('%')) {
            type[property.substring(1)] = OBJECT;
          } else {
            type[property] = STRING;
          }
        });
      });
    }
    DomElementSchemaRegistry.prototype.hasProperty = function(tagName, propName) {
      if (tagName.indexOf('-') !== -1) {
        return true;
      } else {
        var elementProperties = this.schema[tagName.toLowerCase()];
        if (!lang_1.isPresent(elementProperties)) {
          elementProperties = this.schema['unknown'];
        }
        return lang_1.isPresent(elementProperties[propName]);
      }
    };
    DomElementSchemaRegistry.prototype.securityContext = function(tagName, propName) {
      if (propName === 'style')
        return core_private_1.SecurityContext.STYLE;
      if (tagName === 'a' && propName === 'href')
        return core_private_1.SecurityContext.URL;
      if (propName === 'innerHTML')
        return core_private_1.SecurityContext.HTML;
      return core_private_1.SecurityContext.NONE;
    };
    DomElementSchemaRegistry.prototype.getMappedPropName = function(propName) {
      var mappedPropName = collection_1.StringMapWrapper.get(attrToPropMap, propName);
      return lang_1.isPresent(mappedPropName) ? mappedPropName : propName;
    };
    DomElementSchemaRegistry.decorators = [{type: core_1.Injectable}];
    DomElementSchemaRegistry.ctorParameters = [];
    return DomElementSchemaRegistry;
  }(element_schema_registry_1.ElementSchemaRegistry));
  exports.DomElementSchemaRegistry = DomElementSchemaRegistry;
  return module.exports;
});

System.registerDynamic("@angular/compiler/src/expression_parser/ast.js", ["../../src/facade/collection"], true, function($__require, exports, module) {
  "use strict";
  ;
  var define,
      global = this,
      GLOBAL = this;
  var __extends = (this && this.__extends) || function(d, b) {
    for (var p in b)
      if (b.hasOwnProperty(p))
        d[p] = b[p];
    function __() {
      this.constructor = d;
    }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
  };
  var collection_1 = $__require('../../src/facade/collection');
  var AST = (function() {
    function AST() {}
    AST.prototype.visit = function(visitor, context) {
      if (context === void 0) {
        context = null;
      }
      return null;
    };
    AST.prototype.toString = function() {
      return "AST";
    };
    return AST;
  }());
  exports.AST = AST;
  var Quote = (function(_super) {
    __extends(Quote, _super);
    function Quote(prefix, uninterpretedExpression, location) {
      _super.call(this);
      this.prefix = prefix;
      this.uninterpretedExpression = uninterpretedExpression;
      this.location = location;
    }
    Quote.prototype.visit = function(visitor, context) {
      if (context === void 0) {
        context = null;
      }
      return visitor.visitQuote(this, context);
    };
    Quote.prototype.toString = function() {
      return "Quote";
    };
    return Quote;
  }(AST));
  exports.Quote = Quote;
  var EmptyExpr = (function(_super) {
    __extends(EmptyExpr, _super);
    function EmptyExpr() {
      _super.apply(this, arguments);
    }
    EmptyExpr.prototype.visit = function(visitor, context) {
      if (context === void 0) {
        context = null;
      }
    };
    return EmptyExpr;
  }(AST));
  exports.EmptyExpr = EmptyExpr;
  var ImplicitReceiver = (function(_super) {
    __extends(ImplicitReceiver, _super);
    function ImplicitReceiver() {
      _super.apply(this, arguments);
    }
    ImplicitReceiver.prototype.visit = function(visitor, context) {
      if (context === void 0) {
        context = null;
      }
      return visitor.visitImplicitReceiver(this, context);
    };
    return ImplicitReceiver;
  }(AST));
  exports.ImplicitReceiver = ImplicitReceiver;
  var Chain = (function(_super) {
    __extends(Chain, _super);
    function Chain(expressions) {
      _super.call(this);
      this.expressions = expressions;
    }
    Chain.prototype.visit = function(visitor, context) {
      if (context === void 0) {
        context = null;
      }
      return visitor.visitChain(this, context);
    };
    return Chain;
  }(AST));
  exports.Chain = Chain;
  var Conditional = (function(_super) {
    __extends(Conditional, _super);
    function Conditional(condition, trueExp, falseExp) {
      _super.call(this);
      this.condition = condition;
      this.trueExp = trueExp;
      this.falseExp = falseExp;
    }
    Conditional.prototype.visit = function(visitor, context) {
      if (context === void 0) {
        context = null;
      }
      return visitor.visitConditional(this, context);
    };
    return Conditional;
  }(AST));
  exports.Conditional = Conditional;
  var PropertyRead = (function(_super) {
    __extends(PropertyRead, _super);
    function PropertyRead(receiver, name) {
      _super.call(this);
      this.receiver = receiver;
      this.name = name;
    }
    PropertyRead.prototype.visit = function(visitor, context) {
      if (context === void 0) {
        context = null;
      }
      return visitor.visitPropertyRead(this, context);
    };
    return PropertyRead;
  }(AST));
  exports.PropertyRead = PropertyRead;
  var PropertyWrite = (function(_super) {
    __extends(PropertyWrite, _super);
    function PropertyWrite(receiver, name, value) {
      _super.call(this);
      this.receiver = receiver;
      this.name = name;
      this.value = value;
    }
    PropertyWrite.prototype.visit = function(visitor, context) {
      if (context === void 0) {
        context = null;
      }
      return visitor.visitPropertyWrite(this, context);
    };
    return PropertyWrite;
  }(AST));
  exports.PropertyWrite = PropertyWrite;
  var SafePropertyRead = (function(_super) {
    __extends(SafePropertyRead, _super);
    function SafePropertyRead(receiver, name) {
      _super.call(this);
      this.receiver = receiver;
      this.name = name;
    }
    SafePropertyRead.prototype.visit = function(visitor, context) {
      if (context === void 0) {
        context = null;
      }
      return visitor.visitSafePropertyRead(this, context);
    };
    return SafePropertyRead;
  }(AST));
  exports.SafePropertyRead = SafePropertyRead;
  var KeyedRead = (function(_super) {
    __extends(KeyedRead, _super);
    function KeyedRead(obj, key) {
      _super.call(this);
      this.obj = obj;
      this.key = key;
    }
    KeyedRead.prototype.visit = function(visitor, context) {
      if (context === void 0) {
        context = null;
      }
      return visitor.visitKeyedRead(this, context);
    };
    return KeyedRead;
  }(AST));
  exports.KeyedRead = KeyedRead;
  var KeyedWrite = (function(_super) {
    __extends(KeyedWrite, _super);
    function KeyedWrite(obj, key, value) {
      _super.call(this);
      this.obj = obj;
      this.key = key;
      this.value = value;
    }
    KeyedWrite.prototype.visit = function(visitor, context) {
      if (context === void 0) {
        context = null;
      }
      return visitor.visitKeyedWrite(this, context);
    };
    return KeyedWrite;
  }(AST));
  exports.KeyedWrite = KeyedWrite;
  var BindingPipe = (function(_super) {
    __extends(BindingPipe, _super);
    function BindingPipe(exp, name, args) {
      _super.call(this);
      this.exp = exp;
      this.name = name;
      this.args = args;
    }
    BindingPipe.prototype.visit = function(visitor, context) {
      if (context === void 0) {
        context = null;
      }
      return visitor.visitPipe(this, context);
    };
    return BindingPipe;
  }(AST));
  exports.BindingPipe = BindingPipe;
  var LiteralPrimitive = (function(_super) {
    __extends(LiteralPrimitive, _super);
    function LiteralPrimitive(value) {
      _super.call(this);
      this.value = value;
    }
    LiteralPrimitive.prototype.visit = function(visitor, context) {
      if (context === void 0) {
        context = null;
      }
      return visitor.visitLiteralPrimitive(this, context);
    };
    return LiteralPrimitive;
  }(AST));
  exports.LiteralPrimitive = LiteralPrimitive;
  var LiteralArray = (function(_super) {
    __extends(LiteralArray, _super);
    function LiteralArray(expressions) {
      _super.call(this);
      this.expressions = expressions;
    }
    LiteralArray.prototype.visit = function(visitor, context) {
      if (context === void 0) {
        context = null;
      }
      return visitor.visitLiteralArray(this, context);
    };
    return LiteralArray;
  }(AST));
  exports.LiteralArray = LiteralArray;
  var LiteralMap = (function(_super) {
    __extends(LiteralMap, _super);
    function LiteralMap(keys, values) {
      _super.call(this);
      this.keys = keys;
      this.values = values;
    }
    LiteralMap.prototype.visit = function(visitor, context) {
      if (context === void 0) {
        context = null;
      }
      return visitor.visitLiteralMap(this, context);
    };
    return LiteralMap;
  }(AST));
  exports.LiteralMap = LiteralMap;
  var Interpolation = (function(_super) {
    __extends(Interpolation, _super);
    function Interpolation(strings, expressions) {
      _super.call(this);
      this.strings = strings;
      this.expressions = expressions;
    }
    Interpolation.prototype.visit = function(visitor, context) {
      if (context === void 0) {
        context = null;
      }
      return visitor.visitInterpolation(this, context);
    };
    return Interpolation;
  }(AST));
  exports.Interpolation = Interpolation;
  var Binary = (function(_super) {
    __extends(Binary, _super);
    function Binary(operation, left, right) {
      _super.call(this);
      this.operation = operation;
      this.left = left;
      this.right = right;
    }
    Binary.prototype.visit = function(visitor, context) {
      if (context === void 0) {
        context = null;
      }
      return visitor.visitBinary(this, context);
    };
    return Binary;
  }(AST));
  exports.Binary = Binary;
  var PrefixNot = (function(_super) {
    __extends(PrefixNot, _super);
    function PrefixNot(expression) {
      _super.call(this);
      this.expression = expression;
    }
    PrefixNot.prototype.visit = function(visitor, context) {
      if (context === void 0) {
        context = null;
      }
      return visitor.visitPrefixNot(this, context);
    };
    return PrefixNot;
  }(AST));
  exports.PrefixNot = PrefixNot;
  var MethodCall = (function(_super) {
    __extends(MethodCall, _super);
    function MethodCall(receiver, name, args) {
      _super.call(this);
      this.receiver = receiver;
      this.name = name;
      this.args = args;
    }
    MethodCall.prototype.visit = function(visitor, context) {
      if (context === void 0) {
        context = null;
      }
      return visitor.visitMethodCall(this, context);
    };
    return MethodCall;
  }(AST));
  exports.MethodCall = MethodCall;
  var SafeMethodCall = (function(_super) {
    __extends(SafeMethodCall, _super);
    function SafeMethodCall(receiver, name, args) {
      _super.call(this);
      this.receiver = receiver;
      this.name = name;
      this.args = args;
    }
    SafeMethodCall.prototype.visit = function(visitor, context) {
      if (context === void 0) {
        context = null;
      }
      return visitor.visitSafeMethodCall(this, context);
    };
    return SafeMethodCall;
  }(AST));
  exports.SafeMethodCall = SafeMethodCall;
  var FunctionCall = (function(_super) {
    __extends(FunctionCall, _super);
    function FunctionCall(target, args) {
      _super.call(this);
      this.target = target;
      this.args = args;
    }
    FunctionCall.prototype.visit = function(visitor, context) {
      if (context === void 0) {
        context = null;
      }
      return visitor.visitFunctionCall(this, context);
    };
    return FunctionCall;
  }(AST));
  exports.FunctionCall = FunctionCall;
  var ASTWithSource = (function(_super) {
    __extends(ASTWithSource, _super);
    function ASTWithSource(ast, source, location) {
      _super.call(this);
      this.ast = ast;
      this.source = source;
      this.location = location;
    }
    ASTWithSource.prototype.visit = function(visitor, context) {
      if (context === void 0) {
        context = null;
      }
      return this.ast.visit(visitor, context);
    };
    ASTWithSource.prototype.toString = function() {
      return this.source + " in " + this.location;
    };
    return ASTWithSource;
  }(AST));
  exports.ASTWithSource = ASTWithSource;
  var TemplateBinding = (function() {
    function TemplateBinding(key, keyIsVar, name, expression) {
      this.key = key;
      this.keyIsVar = keyIsVar;
      this.name = name;
      this.expression = expression;
    }
    return TemplateBinding;
  }());
  exports.TemplateBinding = TemplateBinding;
  var RecursiveAstVisitor = (function() {
    function RecursiveAstVisitor() {}
    RecursiveAstVisitor.prototype.visitBinary = function(ast, context) {
      ast.left.visit(this);
      ast.right.visit(this);
      return null;
    };
    RecursiveAstVisitor.prototype.visitChain = function(ast, context) {
      return this.visitAll(ast.expressions, context);
    };
    RecursiveAstVisitor.prototype.visitConditional = function(ast, context) {
      ast.condition.visit(this);
      ast.trueExp.visit(this);
      ast.falseExp.visit(this);
      return null;
    };
    RecursiveAstVisitor.prototype.visitPipe = function(ast, context) {
      ast.exp.visit(this);
      this.visitAll(ast.args, context);
      return null;
    };
    RecursiveAstVisitor.prototype.visitFunctionCall = function(ast, context) {
      ast.target.visit(this);
      this.visitAll(ast.args, context);
      return null;
    };
    RecursiveAstVisitor.prototype.visitImplicitReceiver = function(ast, context) {
      return null;
    };
    RecursiveAstVisitor.prototype.visitInterpolation = function(ast, context) {
      return this.visitAll(ast.expressions, context);
    };
    RecursiveAstVisitor.prototype.visitKeyedRead = function(ast, context) {
      ast.obj.visit(this);
      ast.key.visit(this);
      return null;
    };
    RecursiveAstVisitor.prototype.visitKeyedWrite = function(ast, context) {
      ast.obj.visit(this);
      ast.key.visit(this);
      ast.value.visit(this);
      return null;
    };
    RecursiveAstVisitor.prototype.visitLiteralArray = function(ast, context) {
      return this.visitAll(ast.expressions, context);
    };
    RecursiveAstVisitor.prototype.visitLiteralMap = function(ast, context) {
      return this.visitAll(ast.values, context);
    };
    RecursiveAstVisitor.prototype.visitLiteralPrimitive = function(ast, context) {
      return null;
    };
    RecursiveAstVisitor.prototype.visitMethodCall = function(ast, context) {
      ast.receiver.visit(this);
      return this.visitAll(ast.args, context);
    };
    RecursiveAstVisitor.prototype.visitPrefixNot = function(ast, context) {
      ast.expression.visit(this);
      return null;
    };
    RecursiveAstVisitor.prototype.visitPropertyRead = function(ast, context) {
      ast.receiver.visit(this);
      return null;
    };
    RecursiveAstVisitor.prototype.visitPropertyWrite = function(ast, context) {
      ast.receiver.visit(this);
      ast.value.visit(this);
      return null;
    };
    RecursiveAstVisitor.prototype.visitSafePropertyRead = function(ast, context) {
      ast.receiver.visit(this);
      return null;
    };
    RecursiveAstVisitor.prototype.visitSafeMethodCall = function(ast, context) {
      ast.receiver.visit(this);
      return this.visitAll(ast.args, context);
    };
    RecursiveAstVisitor.prototype.visitAll = function(asts, context) {
      var _this = this;
      asts.forEach(function(ast) {
        return ast.visit(_this, context);
      });
      return null;
    };
    RecursiveAstVisitor.prototype.visitQuote = function(ast, context) {
      return null;
    };
    return RecursiveAstVisitor;
  }());
  exports.RecursiveAstVisitor = RecursiveAstVisitor;
  var AstTransformer = (function() {
    function AstTransformer() {}
    AstTransformer.prototype.visitImplicitReceiver = function(ast, context) {
      return ast;
    };
    AstTransformer.prototype.visitInterpolation = function(ast, context) {
      return new Interpolation(ast.strings, this.visitAll(ast.expressions));
    };
    AstTransformer.prototype.visitLiteralPrimitive = function(ast, context) {
      return new LiteralPrimitive(ast.value);
    };
    AstTransformer.prototype.visitPropertyRead = function(ast, context) {
      return new PropertyRead(ast.receiver.visit(this), ast.name);
    };
    AstTransformer.prototype.visitPropertyWrite = function(ast, context) {
      return new PropertyWrite(ast.receiver.visit(this), ast.name, ast.value);
    };
    AstTransformer.prototype.visitSafePropertyRead = function(ast, context) {
      return new SafePropertyRead(ast.receiver.visit(this), ast.name);
    };
    AstTransformer.prototype.visitMethodCall = function(ast, context) {
      return new MethodCall(ast.receiver.visit(this), ast.name, this.visitAll(ast.args));
    };
    AstTransformer.prototype.visitSafeMethodCall = function(ast, context) {
      return new SafeMethodCall(ast.receiver.visit(this), ast.name, this.visitAll(ast.args));
    };
    AstTransformer.prototype.visitFunctionCall = function(ast, context) {
      return new FunctionCall(ast.target.visit(this), this.visitAll(ast.args));
    };
    AstTransformer.prototype.visitLiteralArray = function(ast, context) {
      return new LiteralArray(this.visitAll(ast.expressions));
    };
    AstTransformer.prototype.visitLiteralMap = function(ast, context) {
      return new LiteralMap(ast.keys, this.visitAll(ast.values));
    };
    AstTransformer.prototype.visitBinary = function(ast, context) {
      return new Binary(ast.operation, ast.left.visit(this), ast.right.visit(this));
    };
    AstTransformer.prototype.visitPrefixNot = function(ast, context) {
      return new PrefixNot(ast.expression.visit(this));
    };
    AstTransformer.prototype.visitConditional = function(ast, context) {
      return new Conditional(ast.condition.visit(this), ast.trueExp.visit(this), ast.falseExp.visit(this));
    };
    AstTransformer.prototype.visitPipe = function(ast, context) {
      return new BindingPipe(ast.exp.visit(this), ast.name, this.visitAll(ast.args));
    };
    AstTransformer.prototype.visitKeyedRead = function(ast, context) {
      return new KeyedRead(ast.obj.visit(this), ast.key.visit(this));
    };
    AstTransformer.prototype.visitKeyedWrite = function(ast, context) {
      return new KeyedWrite(ast.obj.visit(this), ast.key.visit(this), ast.value.visit(this));
    };
    AstTransformer.prototype.visitAll = function(asts) {
      var res = collection_1.ListWrapper.createFixedSize(asts.length);
      for (var i = 0; i < asts.length; ++i) {
        res[i] = asts[i].visit(this);
      }
      return res;
    };
    AstTransformer.prototype.visitChain = function(ast, context) {
      return new Chain(this.visitAll(ast.expressions));
    };
    AstTransformer.prototype.visitQuote = function(ast, context) {
      return new Quote(ast.prefix, ast.uninterpretedExpression, ast.location);
    };
    return AstTransformer;
  }());
  exports.AstTransformer = AstTransformer;
  return module.exports;
});

System.registerDynamic("@angular/compiler/src/expression_parser/parser.js", ["@angular/core", "../../src/facade/lang", "../../src/facade/exceptions", "../../src/facade/collection", "./lexer", "./ast"], true, function($__require, exports, module) {
  "use strict";
  ;
  var define,
      global = this,
      GLOBAL = this;
  var __extends = (this && this.__extends) || function(d, b) {
    for (var p in b)
      if (b.hasOwnProperty(p))
        d[p] = b[p];
    function __() {
      this.constructor = d;
    }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
  };
  var core_1 = $__require('@angular/core');
  var lang_1 = $__require('../../src/facade/lang');
  var exceptions_1 = $__require('../../src/facade/exceptions');
  var collection_1 = $__require('../../src/facade/collection');
  var lexer_1 = $__require('./lexer');
  var ast_1 = $__require('./ast');
  var _implicitReceiver = new ast_1.ImplicitReceiver();
  var INTERPOLATION_REGEXP = /\{\{([\s\S]*?)\}\}/g;
  var ParseException = (function(_super) {
    __extends(ParseException, _super);
    function ParseException(message, input, errLocation, ctxLocation) {
      _super.call(this, "Parser Error: " + message + " " + errLocation + " [" + input + "] in " + ctxLocation);
    }
    return ParseException;
  }(exceptions_1.BaseException));
  var SplitInterpolation = (function() {
    function SplitInterpolation(strings, expressions) {
      this.strings = strings;
      this.expressions = expressions;
    }
    return SplitInterpolation;
  }());
  exports.SplitInterpolation = SplitInterpolation;
  var TemplateBindingParseResult = (function() {
    function TemplateBindingParseResult(templateBindings, warnings) {
      this.templateBindings = templateBindings;
      this.warnings = warnings;
    }
    return TemplateBindingParseResult;
  }());
  exports.TemplateBindingParseResult = TemplateBindingParseResult;
  var Parser = (function() {
    function Parser(_lexer) {
      this._lexer = _lexer;
    }
    Parser.prototype.parseAction = function(input, location) {
      this._checkNoInterpolation(input, location);
      var tokens = this._lexer.tokenize(this._stripComments(input));
      var ast = new _ParseAST(input, location, tokens, true).parseChain();
      return new ast_1.ASTWithSource(ast, input, location);
    };
    Parser.prototype.parseBinding = function(input, location) {
      var ast = this._parseBindingAst(input, location);
      return new ast_1.ASTWithSource(ast, input, location);
    };
    Parser.prototype.parseSimpleBinding = function(input, location) {
      var ast = this._parseBindingAst(input, location);
      if (!SimpleExpressionChecker.check(ast)) {
        throw new ParseException('Host binding expression can only contain field access and constants', input, location);
      }
      return new ast_1.ASTWithSource(ast, input, location);
    };
    Parser.prototype._parseBindingAst = function(input, location) {
      var quote = this._parseQuote(input, location);
      if (lang_1.isPresent(quote)) {
        return quote;
      }
      this._checkNoInterpolation(input, location);
      var tokens = this._lexer.tokenize(this._stripComments(input));
      return new _ParseAST(input, location, tokens, false).parseChain();
    };
    Parser.prototype._parseQuote = function(input, location) {
      if (lang_1.isBlank(input))
        return null;
      var prefixSeparatorIndex = input.indexOf(':');
      if (prefixSeparatorIndex == -1)
        return null;
      var prefix = input.substring(0, prefixSeparatorIndex).trim();
      if (!lexer_1.isIdentifier(prefix))
        return null;
      var uninterpretedExpression = input.substring(prefixSeparatorIndex + 1);
      return new ast_1.Quote(prefix, uninterpretedExpression, location);
    };
    Parser.prototype.parseTemplateBindings = function(input, location) {
      var tokens = this._lexer.tokenize(input);
      return new _ParseAST(input, location, tokens, false).parseTemplateBindings();
    };
    Parser.prototype.parseInterpolation = function(input, location) {
      var split = this.splitInterpolation(input, location);
      if (split == null)
        return null;
      var expressions = [];
      for (var i = 0; i < split.expressions.length; ++i) {
        var tokens = this._lexer.tokenize(this._stripComments(split.expressions[i]));
        var ast = new _ParseAST(input, location, tokens, false).parseChain();
        expressions.push(ast);
      }
      return new ast_1.ASTWithSource(new ast_1.Interpolation(split.strings, expressions), input, location);
    };
    Parser.prototype.splitInterpolation = function(input, location) {
      var parts = lang_1.StringWrapper.split(input, INTERPOLATION_REGEXP);
      if (parts.length <= 1) {
        return null;
      }
      var strings = [];
      var expressions = [];
      for (var i = 0; i < parts.length; i++) {
        var part = parts[i];
        if (i % 2 === 0) {
          strings.push(part);
        } else if (part.trim().length > 0) {
          expressions.push(part);
        } else {
          throw new ParseException('Blank expressions are not allowed in interpolated strings', input, "at column " + this._findInterpolationErrorColumn(parts, i) + " in", location);
        }
      }
      return new SplitInterpolation(strings, expressions);
    };
    Parser.prototype.wrapLiteralPrimitive = function(input, location) {
      return new ast_1.ASTWithSource(new ast_1.LiteralPrimitive(input), input, location);
    };
    Parser.prototype._stripComments = function(input) {
      var i = this._commentStart(input);
      return lang_1.isPresent(i) ? input.substring(0, i).trim() : input;
    };
    Parser.prototype._commentStart = function(input) {
      var outerQuote = null;
      for (var i = 0; i < input.length - 1; i++) {
        var char = lang_1.StringWrapper.charCodeAt(input, i);
        var nextChar = lang_1.StringWrapper.charCodeAt(input, i + 1);
        if (char === lexer_1.$SLASH && nextChar == lexer_1.$SLASH && lang_1.isBlank(outerQuote))
          return i;
        if (outerQuote === char) {
          outerQuote = null;
        } else if (lang_1.isBlank(outerQuote) && lexer_1.isQuote(char)) {
          outerQuote = char;
        }
      }
      return null;
    };
    Parser.prototype._checkNoInterpolation = function(input, location) {
      var parts = lang_1.StringWrapper.split(input, INTERPOLATION_REGEXP);
      if (parts.length > 1) {
        throw new ParseException('Got interpolation ({{}}) where expression was expected', input, "at column " + this._findInterpolationErrorColumn(parts, 1) + " in", location);
      }
    };
    Parser.prototype._findInterpolationErrorColumn = function(parts, partInErrIdx) {
      var errLocation = '';
      for (var j = 0; j < partInErrIdx; j++) {
        errLocation += j % 2 === 0 ? parts[j] : "{{" + parts[j] + "}}";
      }
      return errLocation.length;
    };
    Parser.decorators = [{type: core_1.Injectable}];
    Parser.ctorParameters = [{type: lexer_1.Lexer}];
    return Parser;
  }());
  exports.Parser = Parser;
  var _ParseAST = (function() {
    function _ParseAST(input, location, tokens, parseAction) {
      this.input = input;
      this.location = location;
      this.tokens = tokens;
      this.parseAction = parseAction;
      this.index = 0;
    }
    _ParseAST.prototype.peek = function(offset) {
      var i = this.index + offset;
      return i < this.tokens.length ? this.tokens[i] : lexer_1.EOF;
    };
    Object.defineProperty(_ParseAST.prototype, "next", {
      get: function() {
        return this.peek(0);
      },
      enumerable: true,
      configurable: true
    });
    Object.defineProperty(_ParseAST.prototype, "inputIndex", {
      get: function() {
        return (this.index < this.tokens.length) ? this.next.index : this.input.length;
      },
      enumerable: true,
      configurable: true
    });
    _ParseAST.prototype.advance = function() {
      this.index++;
    };
    _ParseAST.prototype.optionalCharacter = function(code) {
      if (this.next.isCharacter(code)) {
        this.advance();
        return true;
      } else {
        return false;
      }
    };
    _ParseAST.prototype.peekKeywordLet = function() {
      return this.next.isKeywordLet();
    };
    _ParseAST.prototype.peekDeprecatedKeywordVar = function() {
      return this.next.isKeywordDeprecatedVar();
    };
    _ParseAST.prototype.peekDeprecatedOperatorHash = function() {
      return this.next.isOperator('#');
    };
    _ParseAST.prototype.expectCharacter = function(code) {
      if (this.optionalCharacter(code))
        return;
      this.error("Missing expected " + lang_1.StringWrapper.fromCharCode(code));
    };
    _ParseAST.prototype.optionalOperator = function(op) {
      if (this.next.isOperator(op)) {
        this.advance();
        return true;
      } else {
        return false;
      }
    };
    _ParseAST.prototype.expectOperator = function(operator) {
      if (this.optionalOperator(operator))
        return;
      this.error("Missing expected operator " + operator);
    };
    _ParseAST.prototype.expectIdentifierOrKeyword = function() {
      var n = this.next;
      if (!n.isIdentifier() && !n.isKeyword()) {
        this.error("Unexpected token " + n + ", expected identifier or keyword");
      }
      this.advance();
      return n.toString();
    };
    _ParseAST.prototype.expectIdentifierOrKeywordOrString = function() {
      var n = this.next;
      if (!n.isIdentifier() && !n.isKeyword() && !n.isString()) {
        this.error("Unexpected token " + n + ", expected identifier, keyword, or string");
      }
      this.advance();
      return n.toString();
    };
    _ParseAST.prototype.parseChain = function() {
      var exprs = [];
      while (this.index < this.tokens.length) {
        var expr = this.parsePipe();
        exprs.push(expr);
        if (this.optionalCharacter(lexer_1.$SEMICOLON)) {
          if (!this.parseAction) {
            this.error("Binding expression cannot contain chained expression");
          }
          while (this.optionalCharacter(lexer_1.$SEMICOLON)) {}
        } else if (this.index < this.tokens.length) {
          this.error("Unexpected token '" + this.next + "'");
        }
      }
      if (exprs.length == 0)
        return new ast_1.EmptyExpr();
      if (exprs.length == 1)
        return exprs[0];
      return new ast_1.Chain(exprs);
    };
    _ParseAST.prototype.parsePipe = function() {
      var result = this.parseExpression();
      if (this.optionalOperator("|")) {
        if (this.parseAction) {
          this.error("Cannot have a pipe in an action expression");
        }
        do {
          var name = this.expectIdentifierOrKeyword();
          var args = [];
          while (this.optionalCharacter(lexer_1.$COLON)) {
            args.push(this.parseExpression());
          }
          result = new ast_1.BindingPipe(result, name, args);
        } while (this.optionalOperator("|"));
      }
      return result;
    };
    _ParseAST.prototype.parseExpression = function() {
      return this.parseConditional();
    };
    _ParseAST.prototype.parseConditional = function() {
      var start = this.inputIndex;
      var result = this.parseLogicalOr();
      if (this.optionalOperator('?')) {
        var yes = this.parsePipe();
        if (!this.optionalCharacter(lexer_1.$COLON)) {
          var end = this.inputIndex;
          var expression = this.input.substring(start, end);
          this.error("Conditional expression " + expression + " requires all 3 expressions");
        }
        var no = this.parsePipe();
        return new ast_1.Conditional(result, yes, no);
      } else {
        return result;
      }
    };
    _ParseAST.prototype.parseLogicalOr = function() {
      var result = this.parseLogicalAnd();
      while (this.optionalOperator('||')) {
        result = new ast_1.Binary('||', result, this.parseLogicalAnd());
      }
      return result;
    };
    _ParseAST.prototype.parseLogicalAnd = function() {
      var result = this.parseEquality();
      while (this.optionalOperator('&&')) {
        result = new ast_1.Binary('&&', result, this.parseEquality());
      }
      return result;
    };
    _ParseAST.prototype.parseEquality = function() {
      var result = this.parseRelational();
      while (true) {
        if (this.optionalOperator('==')) {
          result = new ast_1.Binary('==', result, this.parseRelational());
        } else if (this.optionalOperator('===')) {
          result = new ast_1.Binary('===', result, this.parseRelational());
        } else if (this.optionalOperator('!=')) {
          result = new ast_1.Binary('!=', result, this.parseRelational());
        } else if (this.optionalOperator('!==')) {
          result = new ast_1.Binary('!==', result, this.parseRelational());
        } else {
          return result;
        }
      }
    };
    _ParseAST.prototype.parseRelational = function() {
      var result = this.parseAdditive();
      while (true) {
        if (this.optionalOperator('<')) {
          result = new ast_1.Binary('<', result, this.parseAdditive());
        } else if (this.optionalOperator('>')) {
          result = new ast_1.Binary('>', result, this.parseAdditive());
        } else if (this.optionalOperator('<=')) {
          result = new ast_1.Binary('<=', result, this.parseAdditive());
        } else if (this.optionalOperator('>=')) {
          result = new ast_1.Binary('>=', result, this.parseAdditive());
        } else {
          return result;
        }
      }
    };
    _ParseAST.prototype.parseAdditive = function() {
      var result = this.parseMultiplicative();
      while (true) {
        if (this.optionalOperator('+')) {
          result = new ast_1.Binary('+', result, this.parseMultiplicative());
        } else if (this.optionalOperator('-')) {
          result = new ast_1.Binary('-', result, this.parseMultiplicative());
        } else {
          return result;
        }
      }
    };
    _ParseAST.prototype.parseMultiplicative = function() {
      var result = this.parsePrefix();
      while (true) {
        if (this.optionalOperator('*')) {
          result = new ast_1.Binary('*', result, this.parsePrefix());
        } else if (this.optionalOperator('%')) {
          result = new ast_1.Binary('%', result, this.parsePrefix());
        } else if (this.optionalOperator('/')) {
          result = new ast_1.Binary('/', result, this.parsePrefix());
        } else {
          return result;
        }
      }
    };
    _ParseAST.prototype.parsePrefix = function() {
      if (this.optionalOperator('+')) {
        return this.parsePrefix();
      } else if (this.optionalOperator('-')) {
        return new ast_1.Binary('-', new ast_1.LiteralPrimitive(0), this.parsePrefix());
      } else if (this.optionalOperator('!')) {
        return new ast_1.PrefixNot(this.parsePrefix());
      } else {
        return this.parseCallChain();
      }
    };
    _ParseAST.prototype.parseCallChain = function() {
      var result = this.parsePrimary();
      while (true) {
        if (this.optionalCharacter(lexer_1.$PERIOD)) {
          result = this.parseAccessMemberOrMethodCall(result, false);
        } else if (this.optionalOperator('?.')) {
          result = this.parseAccessMemberOrMethodCall(result, true);
        } else if (this.optionalCharacter(lexer_1.$LBRACKET)) {
          var key = this.parsePipe();
          this.expectCharacter(lexer_1.$RBRACKET);
          if (this.optionalOperator("=")) {
            var value = this.parseConditional();
            result = new ast_1.KeyedWrite(result, key, value);
          } else {
            result = new ast_1.KeyedRead(result, key);
          }
        } else if (this.optionalCharacter(lexer_1.$LPAREN)) {
          var args = this.parseCallArguments();
          this.expectCharacter(lexer_1.$RPAREN);
          result = new ast_1.FunctionCall(result, args);
        } else {
          return result;
        }
      }
    };
    _ParseAST.prototype.parsePrimary = function() {
      if (this.optionalCharacter(lexer_1.$LPAREN)) {
        var result = this.parsePipe();
        this.expectCharacter(lexer_1.$RPAREN);
        return result;
      } else if (this.next.isKeywordNull() || this.next.isKeywordUndefined()) {
        this.advance();
        return new ast_1.LiteralPrimitive(null);
      } else if (this.next.isKeywordTrue()) {
        this.advance();
        return new ast_1.LiteralPrimitive(true);
      } else if (this.next.isKeywordFalse()) {
        this.advance();
        return new ast_1.LiteralPrimitive(false);
      } else if (this.optionalCharacter(lexer_1.$LBRACKET)) {
        var elements = this.parseExpressionList(lexer_1.$RBRACKET);
        this.expectCharacter(lexer_1.$RBRACKET);
        return new ast_1.LiteralArray(elements);
      } else if (this.next.isCharacter(lexer_1.$LBRACE)) {
        return this.parseLiteralMap();
      } else if (this.next.isIdentifier()) {
        return this.parseAccessMemberOrMethodCall(_implicitReceiver, false);
      } else if (this.next.isNumber()) {
        var value = this.next.toNumber();
        this.advance();
        return new ast_1.LiteralPrimitive(value);
      } else if (this.next.isString()) {
        var literalValue = this.next.toString();
        this.advance();
        return new ast_1.LiteralPrimitive(literalValue);
      } else if (this.index >= this.tokens.length) {
        this.error("Unexpected end of expression: " + this.input);
      } else {
        this.error("Unexpected token " + this.next);
      }
      throw new exceptions_1.BaseException("Fell through all cases in parsePrimary");
    };
    _ParseAST.prototype.parseExpressionList = function(terminator) {
      var result = [];
      if (!this.next.isCharacter(terminator)) {
        do {
          result.push(this.parsePipe());
        } while (this.optionalCharacter(lexer_1.$COMMA));
      }
      return result;
    };
    _ParseAST.prototype.parseLiteralMap = function() {
      var keys = [];
      var values = [];
      this.expectCharacter(lexer_1.$LBRACE);
      if (!this.optionalCharacter(lexer_1.$RBRACE)) {
        do {
          var key = this.expectIdentifierOrKeywordOrString();
          keys.push(key);
          this.expectCharacter(lexer_1.$COLON);
          values.push(this.parsePipe());
        } while (this.optionalCharacter(lexer_1.$COMMA));
        this.expectCharacter(lexer_1.$RBRACE);
      }
      return new ast_1.LiteralMap(keys, values);
    };
    _ParseAST.prototype.parseAccessMemberOrMethodCall = function(receiver, isSafe) {
      if (isSafe === void 0) {
        isSafe = false;
      }
      var id = this.expectIdentifierOrKeyword();
      if (this.optionalCharacter(lexer_1.$LPAREN)) {
        var args = this.parseCallArguments();
        this.expectCharacter(lexer_1.$RPAREN);
        return isSafe ? new ast_1.SafeMethodCall(receiver, id, args) : new ast_1.MethodCall(receiver, id, args);
      } else {
        if (isSafe) {
          if (this.optionalOperator("=")) {
            this.error("The '?.' operator cannot be used in the assignment");
          } else {
            return new ast_1.SafePropertyRead(receiver, id);
          }
        } else {
          if (this.optionalOperator("=")) {
            if (!this.parseAction) {
              this.error("Bindings cannot contain assignments");
            }
            var value = this.parseConditional();
            return new ast_1.PropertyWrite(receiver, id, value);
          } else {
            return new ast_1.PropertyRead(receiver, id);
          }
        }
      }
      return null;
    };
    _ParseAST.prototype.parseCallArguments = function() {
      if (this.next.isCharacter(lexer_1.$RPAREN))
        return [];
      var positionals = [];
      do {
        positionals.push(this.parsePipe());
      } while (this.optionalCharacter(lexer_1.$COMMA));
      return positionals;
    };
    _ParseAST.prototype.parseBlockContent = function() {
      if (!this.parseAction) {
        this.error("Binding expression cannot contain chained expression");
      }
      var exprs = [];
      while (this.index < this.tokens.length && !this.next.isCharacter(lexer_1.$RBRACE)) {
        var expr = this.parseExpression();
        exprs.push(expr);
        if (this.optionalCharacter(lexer_1.$SEMICOLON)) {
          while (this.optionalCharacter(lexer_1.$SEMICOLON)) {}
        }
      }
      if (exprs.length == 0)
        return new ast_1.EmptyExpr();
      if (exprs.length == 1)
        return exprs[0];
      return new ast_1.Chain(exprs);
    };
    _ParseAST.prototype.expectTemplateBindingKey = function() {
      var result = '';
      var operatorFound = false;
      do {
        result += this.expectIdentifierOrKeywordOrString();
        operatorFound = this.optionalOperator('-');
        if (operatorFound) {
          result += '-';
        }
      } while (operatorFound);
      return result.toString();
    };
    _ParseAST.prototype.parseTemplateBindings = function() {
      var bindings = [];
      var prefix = null;
      var warnings = [];
      while (this.index < this.tokens.length) {
        var keyIsVar = this.peekKeywordLet();
        if (!keyIsVar && this.peekDeprecatedKeywordVar()) {
          keyIsVar = true;
          warnings.push("\"var\" inside of expressions is deprecated. Use \"let\" instead!");
        }
        if (!keyIsVar && this.peekDeprecatedOperatorHash()) {
          keyIsVar = true;
          warnings.push("\"#\" inside of expressions is deprecated. Use \"let\" instead!");
        }
        if (keyIsVar) {
          this.advance();
        }
        var key = this.expectTemplateBindingKey();
        if (!keyIsVar) {
          if (prefix == null) {
            prefix = key;
          } else {
            key = prefix + key[0].toUpperCase() + key.substring(1);
          }
        }
        this.optionalCharacter(lexer_1.$COLON);
        var name = null;
        var expression = null;
        if (keyIsVar) {
          if (this.optionalOperator("=")) {
            name = this.expectTemplateBindingKey();
          } else {
            name = '\$implicit';
          }
        } else if (this.next !== lexer_1.EOF && !this.peekKeywordLet() && !this.peekDeprecatedKeywordVar() && !this.peekDeprecatedOperatorHash()) {
          var start = this.inputIndex;
          var ast = this.parsePipe();
          var source = this.input.substring(start, this.inputIndex);
          expression = new ast_1.ASTWithSource(ast, source, this.location);
        }
        bindings.push(new ast_1.TemplateBinding(key, keyIsVar, name, expression));
        if (!this.optionalCharacter(lexer_1.$SEMICOLON)) {
          this.optionalCharacter(lexer_1.$COMMA);
        }
      }
      return new TemplateBindingParseResult(bindings, warnings);
    };
    _ParseAST.prototype.error = function(message, index) {
      if (index === void 0) {
        index = null;
      }
      if (lang_1.isBlank(index))
        index = this.index;
      var location = (index < this.tokens.length) ? "at column " + (this.tokens[index].index + 1) + " in" : "at the end of the expression";
      throw new ParseException(message, this.input, location, this.location);
    };
    return _ParseAST;
  }());
  exports._ParseAST = _ParseAST;
  var SimpleExpressionChecker = (function() {
    function SimpleExpressionChecker() {
      this.simple = true;
    }
    SimpleExpressionChecker.check = function(ast) {
      var s = new SimpleExpressionChecker();
      ast.visit(s);
      return s.simple;
    };
    SimpleExpressionChecker.prototype.visitImplicitReceiver = function(ast, context) {};
    SimpleExpressionChecker.prototype.visitInterpolation = function(ast, context) {
      this.simple = false;
    };
    SimpleExpressionChecker.prototype.visitLiteralPrimitive = function(ast, context) {};
    SimpleExpressionChecker.prototype.visitPropertyRead = function(ast, context) {};
    SimpleExpressionChecker.prototype.visitPropertyWrite = function(ast, context) {
      this.simple = false;
    };
    SimpleExpressionChecker.prototype.visitSafePropertyRead = function(ast, context) {
      this.simple = false;
    };
    SimpleExpressionChecker.prototype.visitMethodCall = function(ast, context) {
      this.simple = false;
    };
    SimpleExpressionChecker.prototype.visitSafeMethodCall = function(ast, context) {
      this.simple = false;
    };
    SimpleExpressionChecker.prototype.visitFunctionCall = function(ast, context) {
      this.simple = false;
    };
    SimpleExpressionChecker.prototype.visitLiteralArray = function(ast, context) {
      this.visitAll(ast.expressions);
    };
    SimpleExpressionChecker.prototype.visitLiteralMap = function(ast, context) {
      this.visitAll(ast.values);
    };
    SimpleExpressionChecker.prototype.visitBinary = function(ast, context) {
      this.simple = false;
    };
    SimpleExpressionChecker.prototype.visitPrefixNot = function(ast, context) {
      this.simple = false;
    };
    SimpleExpressionChecker.prototype.visitConditional = function(ast, context) {
      this.simple = false;
    };
    SimpleExpressionChecker.prototype.visitPipe = function(ast, context) {
      this.simple = false;
    };
    SimpleExpressionChecker.prototype.visitKeyedRead = function(ast, context) {
      this.simple = false;
    };
    SimpleExpressionChecker.prototype.visitKeyedWrite = function(ast, context) {
      this.simple = false;
    };
    SimpleExpressionChecker.prototype.visitAll = function(asts) {
      var res = collection_1.ListWrapper.createFixedSize(asts.length);
      for (var i = 0; i < asts.length; ++i) {
        res[i] = asts[i].visit(this);
      }
      return res;
    };
    SimpleExpressionChecker.prototype.visitChain = function(ast, context) {
      this.simple = false;
    };
    SimpleExpressionChecker.prototype.visitQuote = function(ast, context) {
      this.simple = false;
    };
    return SimpleExpressionChecker;
  }());
  return module.exports;
});

System.registerDynamic("@angular/core/src/metadata/di.js", ["../../src/facade/lang", "../di/metadata", "../di/forward_ref"], true, function($__require, exports, module) {
  "use strict";
  ;
  var define,
      global = this,
      GLOBAL = this;
  var __extends = (this && this.__extends) || function(d, b) {
    for (var p in b)
      if (b.hasOwnProperty(p))
        d[p] = b[p];
    function __() {
      this.constructor = d;
    }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
  };
  var lang_1 = $__require('../../src/facade/lang');
  var metadata_1 = $__require('../di/metadata');
  var forward_ref_1 = $__require('../di/forward_ref');
  var AttributeMetadata = (function(_super) {
    __extends(AttributeMetadata, _super);
    function AttributeMetadata(attributeName) {
      _super.call(this);
      this.attributeName = attributeName;
    }
    Object.defineProperty(AttributeMetadata.prototype, "token", {
      get: function() {
        return this;
      },
      enumerable: true,
      configurable: true
    });
    AttributeMetadata.prototype.toString = function() {
      return "@Attribute(" + lang_1.stringify(this.attributeName) + ")";
    };
    return AttributeMetadata;
  }(metadata_1.DependencyMetadata));
  exports.AttributeMetadata = AttributeMetadata;
  var QueryMetadata = (function(_super) {
    __extends(QueryMetadata, _super);
    function QueryMetadata(_selector, _a) {
      var _b = _a === void 0 ? {} : _a,
          _c = _b.descendants,
          descendants = _c === void 0 ? false : _c,
          _d = _b.first,
          first = _d === void 0 ? false : _d,
          _e = _b.read,
          read = _e === void 0 ? null : _e;
      _super.call(this);
      this._selector = _selector;
      this.descendants = descendants;
      this.first = first;
      this.read = read;
    }
    Object.defineProperty(QueryMetadata.prototype, "isViewQuery", {
      get: function() {
        return false;
      },
      enumerable: true,
      configurable: true
    });
    Object.defineProperty(QueryMetadata.prototype, "selector", {
      get: function() {
        return forward_ref_1.resolveForwardRef(this._selector);
      },
      enumerable: true,
      configurable: true
    });
    Object.defineProperty(QueryMetadata.prototype, "isVarBindingQuery", {
      get: function() {
        return lang_1.isString(this.selector);
      },
      enumerable: true,
      configurable: true
    });
    Object.defineProperty(QueryMetadata.prototype, "varBindings", {
      get: function() {
        return this.selector.split(',');
      },
      enumerable: true,
      configurable: true
    });
    QueryMetadata.prototype.toString = function() {
      return "@Query(" + lang_1.stringify(this.selector) + ")";
    };
    return QueryMetadata;
  }(metadata_1.DependencyMetadata));
  exports.QueryMetadata = QueryMetadata;
  var ContentChildrenMetadata = (function(_super) {
    __extends(ContentChildrenMetadata, _super);
    function ContentChildrenMetadata(_selector, _a) {
      var _b = _a === void 0 ? {} : _a,
          _c = _b.descendants,
          descendants = _c === void 0 ? false : _c,
          _d = _b.read,
          read = _d === void 0 ? null : _d;
      _super.call(this, _selector, {
        descendants: descendants,
        read: read
      });
    }
    return ContentChildrenMetadata;
  }(QueryMetadata));
  exports.ContentChildrenMetadata = ContentChildrenMetadata;
  var ContentChildMetadata = (function(_super) {
    __extends(ContentChildMetadata, _super);
    function ContentChildMetadata(_selector, _a) {
      var _b = (_a === void 0 ? {} : _a).read,
          read = _b === void 0 ? null : _b;
      _super.call(this, _selector, {
        descendants: true,
        first: true,
        read: read
      });
    }
    return ContentChildMetadata;
  }(QueryMetadata));
  exports.ContentChildMetadata = ContentChildMetadata;
  var ViewQueryMetadata = (function(_super) {
    __extends(ViewQueryMetadata, _super);
    function ViewQueryMetadata(_selector, _a) {
      var _b = _a === void 0 ? {} : _a,
          _c = _b.descendants,
          descendants = _c === void 0 ? false : _c,
          _d = _b.first,
          first = _d === void 0 ? false : _d,
          _e = _b.read,
          read = _e === void 0 ? null : _e;
      _super.call(this, _selector, {
        descendants: descendants,
        first: first,
        read: read
      });
    }
    Object.defineProperty(ViewQueryMetadata.prototype, "isViewQuery", {
      get: function() {
        return true;
      },
      enumerable: true,
      configurable: true
    });
    ViewQueryMetadata.prototype.toString = function() {
      return "@ViewQuery(" + lang_1.stringify(this.selector) + ")";
    };
    return ViewQueryMetadata;
  }(QueryMetadata));
  exports.ViewQueryMetadata = ViewQueryMetadata;
  var ViewChildrenMetadata = (function(_super) {
    __extends(ViewChildrenMetadata, _super);
    function ViewChildrenMetadata(_selector, _a) {
      var _b = (_a === void 0 ? {} : _a).read,
          read = _b === void 0 ? null : _b;
      _super.call(this, _selector, {
        descendants: true,
        read: read
      });
    }
    return ViewChildrenMetadata;
  }(ViewQueryMetadata));
  exports.ViewChildrenMetadata = ViewChildrenMetadata;
  var ViewChildMetadata = (function(_super) {
    __extends(ViewChildMetadata, _super);
    function ViewChildMetadata(_selector, _a) {
      var _b = (_a === void 0 ? {} : _a).read,
          read = _b === void 0 ? null : _b;
      _super.call(this, _selector, {
        descendants: true,
        first: true,
        read: read
      });
    }
    return ViewChildMetadata;
  }(ViewQueryMetadata));
  exports.ViewChildMetadata = ViewChildMetadata;
  return module.exports;
});

System.registerDynamic("@angular/core/src/metadata/directives.js", ["../../src/facade/lang", "../di/metadata", "../change_detection/constants"], true, function($__require, exports, module) {
  "use strict";
  ;
  var define,
      global = this,
      GLOBAL = this;
  var __extends = (this && this.__extends) || function(d, b) {
    for (var p in b)
      if (b.hasOwnProperty(p))
        d[p] = b[p];
    function __() {
      this.constructor = d;
    }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
  };
  var lang_1 = $__require('../../src/facade/lang');
  var metadata_1 = $__require('../di/metadata');
  var constants_1 = $__require('../change_detection/constants');
  var DirectiveMetadata = (function(_super) {
    __extends(DirectiveMetadata, _super);
    function DirectiveMetadata(_a) {
      var _b = _a === void 0 ? {} : _a,
          selector = _b.selector,
          inputs = _b.inputs,
          outputs = _b.outputs,
          properties = _b.properties,
          events = _b.events,
          host = _b.host,
          bindings = _b.bindings,
          providers = _b.providers,
          exportAs = _b.exportAs,
          queries = _b.queries;
      _super.call(this);
      this.selector = selector;
      this._inputs = inputs;
      this._properties = properties;
      this._outputs = outputs;
      this._events = events;
      this.host = host;
      this.exportAs = exportAs;
      this.queries = queries;
      this._providers = providers;
      this._bindings = bindings;
    }
    Object.defineProperty(DirectiveMetadata.prototype, "inputs", {
      get: function() {
        return lang_1.isPresent(this._properties) && this._properties.length > 0 ? this._properties : this._inputs;
      },
      enumerable: true,
      configurable: true
    });
    Object.defineProperty(DirectiveMetadata.prototype, "properties", {
      get: function() {
        return this.inputs;
      },
      enumerable: true,
      configurable: true
    });
    Object.defineProperty(DirectiveMetadata.prototype, "outputs", {
      get: function() {
        return lang_1.isPresent(this._events) && this._events.length > 0 ? this._events : this._outputs;
      },
      enumerable: true,
      configurable: true
    });
    Object.defineProperty(DirectiveMetadata.prototype, "events", {
      get: function() {
        return this.outputs;
      },
      enumerable: true,
      configurable: true
    });
    Object.defineProperty(DirectiveMetadata.prototype, "providers", {
      get: function() {
        return lang_1.isPresent(this._bindings) && this._bindings.length > 0 ? this._bindings : this._providers;
      },
      enumerable: true,
      configurable: true
    });
    Object.defineProperty(DirectiveMetadata.prototype, "bindings", {
      get: function() {
        return this.providers;
      },
      enumerable: true,
      configurable: true
    });
    return DirectiveMetadata;
  }(metadata_1.InjectableMetadata));
  exports.DirectiveMetadata = DirectiveMetadata;
  var ComponentMetadata = (function(_super) {
    __extends(ComponentMetadata, _super);
    function ComponentMetadata(_a) {
      var _b = _a === void 0 ? {} : _a,
          selector = _b.selector,
          inputs = _b.inputs,
          outputs = _b.outputs,
          properties = _b.properties,
          events = _b.events,
          host = _b.host,
          exportAs = _b.exportAs,
          moduleId = _b.moduleId,
          bindings = _b.bindings,
          providers = _b.providers,
          viewBindings = _b.viewBindings,
          viewProviders = _b.viewProviders,
          _c = _b.changeDetection,
          changeDetection = _c === void 0 ? constants_1.ChangeDetectionStrategy.Default : _c,
          queries = _b.queries,
          templateUrl = _b.templateUrl,
          template = _b.template,
          styleUrls = _b.styleUrls,
          styles = _b.styles,
          directives = _b.directives,
          pipes = _b.pipes,
          encapsulation = _b.encapsulation;
      _super.call(this, {
        selector: selector,
        inputs: inputs,
        outputs: outputs,
        properties: properties,
        events: events,
        host: host,
        exportAs: exportAs,
        bindings: bindings,
        providers: providers,
        queries: queries
      });
      this.changeDetection = changeDetection;
      this._viewProviders = viewProviders;
      this._viewBindings = viewBindings;
      this.templateUrl = templateUrl;
      this.template = template;
      this.styleUrls = styleUrls;
      this.styles = styles;
      this.directives = directives;
      this.pipes = pipes;
      this.encapsulation = encapsulation;
      this.moduleId = moduleId;
    }
    Object.defineProperty(ComponentMetadata.prototype, "viewProviders", {
      get: function() {
        return lang_1.isPresent(this._viewBindings) && this._viewBindings.length > 0 ? this._viewBindings : this._viewProviders;
      },
      enumerable: true,
      configurable: true
    });
    Object.defineProperty(ComponentMetadata.prototype, "viewBindings", {
      get: function() {
        return this.viewProviders;
      },
      enumerable: true,
      configurable: true
    });
    return ComponentMetadata;
  }(DirectiveMetadata));
  exports.ComponentMetadata = ComponentMetadata;
  var PipeMetadata = (function(_super) {
    __extends(PipeMetadata, _super);
    function PipeMetadata(_a) {
      var name = _a.name,
          pure = _a.pure;
      _super.call(this);
      this.name = name;
      this._pure = pure;
    }
    Object.defineProperty(PipeMetadata.prototype, "pure", {
      get: function() {
        return lang_1.isPresent(this._pure) ? this._pure : true;
      },
      enumerable: true,
      configurable: true
    });
    return PipeMetadata;
  }(metadata_1.InjectableMetadata));
  exports.PipeMetadata = PipeMetadata;
  var InputMetadata = (function() {
    function InputMetadata(bindingPropertyName) {
      this.bindingPropertyName = bindingPropertyName;
    }
    return InputMetadata;
  }());
  exports.InputMetadata = InputMetadata;
  var OutputMetadata = (function() {
    function OutputMetadata(bindingPropertyName) {
      this.bindingPropertyName = bindingPropertyName;
    }
    return OutputMetadata;
  }());
  exports.OutputMetadata = OutputMetadata;
  var HostBindingMetadata = (function() {
    function HostBindingMetadata(hostPropertyName) {
      this.hostPropertyName = hostPropertyName;
    }
    return HostBindingMetadata;
  }());
  exports.HostBindingMetadata = HostBindingMetadata;
  var HostListenerMetadata = (function() {
    function HostListenerMetadata(eventName, args) {
      this.eventName = eventName;
      this.args = args;
    }
    return HostListenerMetadata;
  }());
  exports.HostListenerMetadata = HostListenerMetadata;
  return module.exports;
});

System.registerDynamic("@angular/core/src/metadata.js", ["./metadata/di", "./metadata/directives", "./metadata/view", "./util/decorators"], true, function($__require, exports, module) {
  "use strict";
  ;
  var define,
      global = this,
      GLOBAL = this;
  var di_1 = $__require('./metadata/di');
  exports.QueryMetadata = di_1.QueryMetadata;
  exports.ContentChildrenMetadata = di_1.ContentChildrenMetadata;
  exports.ContentChildMetadata = di_1.ContentChildMetadata;
  exports.ViewChildrenMetadata = di_1.ViewChildrenMetadata;
  exports.ViewQueryMetadata = di_1.ViewQueryMetadata;
  exports.ViewChildMetadata = di_1.ViewChildMetadata;
  exports.AttributeMetadata = di_1.AttributeMetadata;
  var directives_1 = $__require('./metadata/directives');
  exports.ComponentMetadata = directives_1.ComponentMetadata;
  exports.DirectiveMetadata = directives_1.DirectiveMetadata;
  exports.PipeMetadata = directives_1.PipeMetadata;
  exports.InputMetadata = directives_1.InputMetadata;
  exports.OutputMetadata = directives_1.OutputMetadata;
  exports.HostBindingMetadata = directives_1.HostBindingMetadata;
  exports.HostListenerMetadata = directives_1.HostListenerMetadata;
  var view_1 = $__require('./metadata/view');
  exports.ViewMetadata = view_1.ViewMetadata;
  exports.ViewEncapsulation = view_1.ViewEncapsulation;
  var di_2 = $__require('./metadata/di');
  var directives_2 = $__require('./metadata/directives');
  var view_2 = $__require('./metadata/view');
  var decorators_1 = $__require('./util/decorators');
  exports.Component = decorators_1.makeDecorator(directives_2.ComponentMetadata, function(fn) {
    return fn.View = View;
  });
  exports.Directive = decorators_1.makeDecorator(directives_2.DirectiveMetadata);
  var View = decorators_1.makeDecorator(view_2.ViewMetadata, function(fn) {
    return fn.View = View;
  });
  exports.Attribute = decorators_1.makeParamDecorator(di_2.AttributeMetadata);
  exports.Query = decorators_1.makeParamDecorator(di_2.QueryMetadata);
  exports.ContentChildren = decorators_1.makePropDecorator(di_2.ContentChildrenMetadata);
  exports.ContentChild = decorators_1.makePropDecorator(di_2.ContentChildMetadata);
  exports.ViewChildren = decorators_1.makePropDecorator(di_2.ViewChildrenMetadata);
  exports.ViewChild = decorators_1.makePropDecorator(di_2.ViewChildMetadata);
  exports.ViewQuery = decorators_1.makeParamDecorator(di_2.ViewQueryMetadata);
  exports.Pipe = decorators_1.makeDecorator(directives_2.PipeMetadata);
  exports.Input = decorators_1.makePropDecorator(directives_2.InputMetadata);
  exports.Output = decorators_1.makePropDecorator(directives_2.OutputMetadata);
  exports.HostBinding = decorators_1.makePropDecorator(directives_2.HostBindingMetadata);
  exports.HostListener = decorators_1.makePropDecorator(directives_2.HostListenerMetadata);
  return module.exports;
});

System.registerDynamic("@angular/core/src/util.js", ["./util/decorators"], true, function($__require, exports, module) {
  "use strict";
  ;
  var define,
      global = this,
      GLOBAL = this;
  var decorators_1 = $__require('./util/decorators');
  exports.Class = decorators_1.Class;
  return module.exports;
});

System.registerDynamic("@angular/core/src/zone.js", ["./zone/ng_zone"], true, function($__require, exports, module) {
  "use strict";
  ;
  var define,
      global = this,
      GLOBAL = this;
  var ng_zone_1 = $__require('./zone/ng_zone');
  exports.NgZone = ng_zone_1.NgZone;
  exports.NgZoneError = ng_zone_1.NgZoneError;
  return module.exports;
});

System.registerDynamic("@angular/core/src/render.js", ["./render/api"], true, function($__require, exports, module) {
  "use strict";
  ;
  var define,
      global = this,
      GLOBAL = this;
  var api_1 = $__require('./render/api');
  exports.RootRenderer = api_1.RootRenderer;
  exports.Renderer = api_1.Renderer;
  exports.RenderComponentType = api_1.RenderComponentType;
  return module.exports;
});

System.registerDynamic("@angular/core/src/linker/query_list.js", ["../../src/facade/collection", "../../src/facade/lang", "../../src/facade/async"], true, function($__require, exports, module) {
  "use strict";
  ;
  var define,
      global = this,
      GLOBAL = this;
  var collection_1 = $__require('../../src/facade/collection');
  var lang_1 = $__require('../../src/facade/lang');
  var async_1 = $__require('../../src/facade/async');
  var QueryList = (function() {
    function QueryList() {
      this._dirty = true;
      this._results = [];
      this._emitter = new async_1.EventEmitter();
    }
    Object.defineProperty(QueryList.prototype, "changes", {
      get: function() {
        return this._emitter;
      },
      enumerable: true,
      configurable: true
    });
    Object.defineProperty(QueryList.prototype, "length", {
      get: function() {
        return this._results.length;
      },
      enumerable: true,
      configurable: true
    });
    Object.defineProperty(QueryList.prototype, "first", {
      get: function() {
        return collection_1.ListWrapper.first(this._results);
      },
      enumerable: true,
      configurable: true
    });
    Object.defineProperty(QueryList.prototype, "last", {
      get: function() {
        return collection_1.ListWrapper.last(this._results);
      },
      enumerable: true,
      configurable: true
    });
    QueryList.prototype.map = function(fn) {
      return this._results.map(fn);
    };
    QueryList.prototype.filter = function(fn) {
      return this._results.filter(fn);
    };
    QueryList.prototype.reduce = function(fn, init) {
      return this._results.reduce(fn, init);
    };
    QueryList.prototype.forEach = function(fn) {
      this._results.forEach(fn);
    };
    QueryList.prototype.toArray = function() {
      return collection_1.ListWrapper.clone(this._results);
    };
    QueryList.prototype[lang_1.getSymbolIterator()] = function() {
      return this._results[lang_1.getSymbolIterator()]();
    };
    QueryList.prototype.toString = function() {
      return this._results.toString();
    };
    QueryList.prototype.reset = function(res) {
      this._results = collection_1.ListWrapper.flatten(res);
      this._dirty = false;
    };
    QueryList.prototype.notifyOnChanges = function() {
      this._emitter.emit(this);
    };
    QueryList.prototype.setDirty = function() {
      this._dirty = true;
    };
    Object.defineProperty(QueryList.prototype, "dirty", {
      get: function() {
        return this._dirty;
      },
      enumerable: true,
      configurable: true
    });
    return QueryList;
  }());
  exports.QueryList = QueryList;
  return module.exports;
});

System.registerDynamic("@angular/core/src/linker.js", ["./linker/component_resolver", "./linker/query_list", "./linker/dynamic_component_loader", "./linker/element_ref", "./linker/template_ref", "./linker/view_ref", "./linker/view_container_ref", "./linker/component_factory", "./linker/exceptions"], true, function($__require, exports, module) {
  "use strict";
  ;
  var define,
      global = this,
      GLOBAL = this;
  var component_resolver_1 = $__require('./linker/component_resolver');
  exports.ComponentResolver = component_resolver_1.ComponentResolver;
  var query_list_1 = $__require('./linker/query_list');
  exports.QueryList = query_list_1.QueryList;
  var dynamic_component_loader_1 = $__require('./linker/dynamic_component_loader');
  exports.DynamicComponentLoader = dynamic_component_loader_1.DynamicComponentLoader;
  var element_ref_1 = $__require('./linker/element_ref');
  exports.ElementRef = element_ref_1.ElementRef;
  var template_ref_1 = $__require('./linker/template_ref');
  exports.TemplateRef = template_ref_1.TemplateRef;
  var view_ref_1 = $__require('./linker/view_ref');
  exports.EmbeddedViewRef = view_ref_1.EmbeddedViewRef;
  exports.ViewRef = view_ref_1.ViewRef;
  var view_container_ref_1 = $__require('./linker/view_container_ref');
  exports.ViewContainerRef = view_container_ref_1.ViewContainerRef;
  var component_factory_1 = $__require('./linker/component_factory');
  exports.ComponentRef = component_factory_1.ComponentRef;
  exports.ComponentFactory = component_factory_1.ComponentFactory;
  var exceptions_1 = $__require('./linker/exceptions');
  exports.ExpressionChangedAfterItHasBeenCheckedException = exceptions_1.ExpressionChangedAfterItHasBeenCheckedException;
  return module.exports;
});

System.registerDynamic("@angular/core/src/change_detection.js", ["./change_detection/change_detection"], true, function($__require, exports, module) {
  "use strict";
  ;
  var define,
      global = this,
      GLOBAL = this;
  var change_detection_1 = $__require('./change_detection/change_detection');
  exports.ChangeDetectionStrategy = change_detection_1.ChangeDetectionStrategy;
  exports.ChangeDetectorRef = change_detection_1.ChangeDetectorRef;
  exports.WrappedValue = change_detection_1.WrappedValue;
  exports.SimpleChange = change_detection_1.SimpleChange;
  exports.DefaultIterableDiffer = change_detection_1.DefaultIterableDiffer;
  exports.IterableDiffers = change_detection_1.IterableDiffers;
  exports.KeyValueDiffers = change_detection_1.KeyValueDiffers;
  exports.CollectionChangeRecord = change_detection_1.CollectionChangeRecord;
  exports.KeyValueChangeRecord = change_detection_1.KeyValueChangeRecord;
  return module.exports;
});

System.registerDynamic("@angular/core/src/platform_directives_and_pipes.js", ["./di"], true, function($__require, exports, module) {
  "use strict";
  ;
  var define,
      global = this,
      GLOBAL = this;
  var di_1 = $__require('./di');
  exports.PLATFORM_DIRECTIVES = new di_1.OpaqueToken("Platform Directives");
  exports.PLATFORM_PIPES = new di_1.OpaqueToken("Platform Pipes");
  return module.exports;
});

System.registerDynamic("@angular/core/src/platform_common_providers.js", ["./console", "./reflection/reflection", "./reflection/reflector_reader", "./testability/testability", "./application_ref"], true, function($__require, exports, module) {
  "use strict";
  ;
  var define,
      global = this,
      GLOBAL = this;
  var console_1 = $__require('./console');
  var reflection_1 = $__require('./reflection/reflection');
  var reflector_reader_1 = $__require('./reflection/reflector_reader');
  var testability_1 = $__require('./testability/testability');
  var application_ref_1 = $__require('./application_ref');
  function _reflector() {
    return reflection_1.reflector;
  }
  var __unused;
  exports.PLATFORM_COMMON_PROVIDERS = [application_ref_1.PLATFORM_CORE_PROVIDERS, {
    provide: reflection_1.Reflector,
    useFactory: _reflector,
    deps: []
  }, {
    provide: reflector_reader_1.ReflectorReader,
    useExisting: reflection_1.Reflector
  }, testability_1.TestabilityRegistry, console_1.Console];
  return module.exports;
});

System.registerDynamic("@angular/core/src/zone/ng_zone_impl.js", [], true, function($__require, exports, module) {
  "use strict";
  ;
  var define,
      global = this,
      GLOBAL = this;
  var NgZoneError = (function() {
    function NgZoneError(error, stackTrace) {
      this.error = error;
      this.stackTrace = stackTrace;
    }
    return NgZoneError;
  }());
  exports.NgZoneError = NgZoneError;
  var NgZoneImpl = (function() {
    function NgZoneImpl(_a) {
      var _this = this;
      var trace = _a.trace,
          onEnter = _a.onEnter,
          onLeave = _a.onLeave,
          setMicrotask = _a.setMicrotask,
          setMacrotask = _a.setMacrotask,
          onError = _a.onError;
      this.onEnter = onEnter;
      this.onLeave = onLeave;
      this.setMicrotask = setMicrotask;
      this.setMacrotask = setMacrotask;
      this.onError = onError;
      if (Zone) {
        this.outer = this.inner = Zone.current;
        if (Zone['wtfZoneSpec']) {
          this.inner = this.inner.fork(Zone['wtfZoneSpec']);
        }
        if (trace && Zone['longStackTraceZoneSpec']) {
          this.inner = this.inner.fork(Zone['longStackTraceZoneSpec']);
        }
        this.inner = this.inner.fork({
          name: 'angular',
          properties: {'isAngularZone': true},
          onInvokeTask: function(delegate, current, target, task, applyThis, applyArgs) {
            try {
              _this.onEnter();
              return delegate.invokeTask(target, task, applyThis, applyArgs);
            } finally {
              _this.onLeave();
            }
          },
          onInvoke: function(delegate, current, target, callback, applyThis, applyArgs, source) {
            try {
              _this.onEnter();
              return delegate.invoke(target, callback, applyThis, applyArgs, source);
            } finally {
              _this.onLeave();
            }
          },
          onHasTask: function(delegate, current, target, hasTaskState) {
            delegate.hasTask(target, hasTaskState);
            if (current == target) {
              if (hasTaskState.change == 'microTask') {
                _this.setMicrotask(hasTaskState.microTask);
              } else if (hasTaskState.change == 'macroTask') {
                _this.setMacrotask(hasTaskState.macroTask);
              }
            }
          },
          onHandleError: function(delegate, current, target, error) {
            delegate.handleError(target, error);
            _this.onError(new NgZoneError(error, error.stack));
            return false;
          }
        });
      } else {
        throw new Error('Angular requires Zone.js polyfill.');
      }
    }
    NgZoneImpl.isInAngularZone = function() {
      return Zone.current.get('isAngularZone') === true;
    };
    NgZoneImpl.prototype.runInner = function(fn) {
      return this.inner.run(fn);
    };
    ;
    NgZoneImpl.prototype.runInnerGuarded = function(fn) {
      return this.inner.runGuarded(fn);
    };
    ;
    NgZoneImpl.prototype.runOuter = function(fn) {
      return this.outer.run(fn);
    };
    ;
    return NgZoneImpl;
  }());
  exports.NgZoneImpl = NgZoneImpl;
  return module.exports;
});

System.registerDynamic("@angular/core/src/zone/ng_zone.js", ["../../src/facade/async", "./ng_zone_impl", "../../src/facade/exceptions"], true, function($__require, exports, module) {
  "use strict";
  ;
  var define,
      global = this,
      GLOBAL = this;
  var async_1 = $__require('../../src/facade/async');
  var ng_zone_impl_1 = $__require('./ng_zone_impl');
  var exceptions_1 = $__require('../../src/facade/exceptions');
  var ng_zone_impl_2 = $__require('./ng_zone_impl');
  exports.NgZoneError = ng_zone_impl_2.NgZoneError;
  var NgZone = (function() {
    function NgZone(_a) {
      var _this = this;
      var _b = _a.enableLongStackTrace,
          enableLongStackTrace = _b === void 0 ? false : _b;
      this._hasPendingMicrotasks = false;
      this._hasPendingMacrotasks = false;
      this._isStable = true;
      this._nesting = 0;
      this._onUnstable = new async_1.EventEmitter(false);
      this._onMicrotaskEmpty = new async_1.EventEmitter(false);
      this._onStable = new async_1.EventEmitter(false);
      this._onErrorEvents = new async_1.EventEmitter(false);
      this._zoneImpl = new ng_zone_impl_1.NgZoneImpl({
        trace: enableLongStackTrace,
        onEnter: function() {
          _this._nesting++;
          if (_this._isStable) {
            _this._isStable = false;
            _this._onUnstable.emit(null);
          }
        },
        onLeave: function() {
          _this._nesting--;
          _this._checkStable();
        },
        setMicrotask: function(hasMicrotasks) {
          _this._hasPendingMicrotasks = hasMicrotasks;
          _this._checkStable();
        },
        setMacrotask: function(hasMacrotasks) {
          _this._hasPendingMacrotasks = hasMacrotasks;
        },
        onError: function(error) {
          return _this._onErrorEvents.emit(error);
        }
      });
    }
    NgZone.isInAngularZone = function() {
      return ng_zone_impl_1.NgZoneImpl.isInAngularZone();
    };
    NgZone.assertInAngularZone = function() {
      if (!ng_zone_impl_1.NgZoneImpl.isInAngularZone()) {
        throw new exceptions_1.BaseException('Expected to be in Angular Zone, but it is not!');
      }
    };
    NgZone.assertNotInAngularZone = function() {
      if (ng_zone_impl_1.NgZoneImpl.isInAngularZone()) {
        throw new exceptions_1.BaseException('Expected to not be in Angular Zone, but it is!');
      }
    };
    NgZone.prototype._checkStable = function() {
      var _this = this;
      if (this._nesting == 0) {
        if (!this._hasPendingMicrotasks && !this._isStable) {
          try {
            this._nesting++;
            this._onMicrotaskEmpty.emit(null);
          } finally {
            this._nesting--;
            if (!this._hasPendingMicrotasks) {
              try {
                this.runOutsideAngular(function() {
                  return _this._onStable.emit(null);
                });
              } finally {
                this._isStable = true;
              }
            }
          }
        }
      }
    };
    ;
    Object.defineProperty(NgZone.prototype, "onUnstable", {
      get: function() {
        return this._onUnstable;
      },
      enumerable: true,
      configurable: true
    });
    Object.defineProperty(NgZone.prototype, "onMicrotaskEmpty", {
      get: function() {
        return this._onMicrotaskEmpty;
      },
      enumerable: true,
      configurable: true
    });
    Object.defineProperty(NgZone.prototype, "onStable", {
      get: function() {
        return this._onStable;
      },
      enumerable: true,
      configurable: true
    });
    Object.defineProperty(NgZone.prototype, "onError", {
      get: function() {
        return this._onErrorEvents;
      },
      enumerable: true,
      configurable: true
    });
    Object.defineProperty(NgZone.prototype, "hasPendingMicrotasks", {
      get: function() {
        return this._hasPendingMicrotasks;
      },
      enumerable: true,
      configurable: true
    });
    Object.defineProperty(NgZone.prototype, "hasPendingMacrotasks", {
      get: function() {
        return this._hasPendingMacrotasks;
      },
      enumerable: true,
      configurable: true
    });
    NgZone.prototype.run = function(fn) {
      return this._zoneImpl.runInner(fn);
    };
    NgZone.prototype.runGuarded = function(fn) {
      return this._zoneImpl.runInnerGuarded(fn);
    };
    NgZone.prototype.runOutsideAngular = function(fn) {
      return this._zoneImpl.runOuter(fn);
    };
    return NgZone;
  }());
  exports.NgZone = NgZone;
  return module.exports;
});

System.registerDynamic("@angular/core/src/testability/testability.js", ["../../src/facade/collection", "../../src/facade/lang", "../../src/facade/exceptions", "../zone/ng_zone", "../../src/facade/async", "../di/decorators"], true, function($__require, exports, module) {
  "use strict";
  ;
  var define,
      global = this,
      GLOBAL = this;
  var collection_1 = $__require('../../src/facade/collection');
  var lang_1 = $__require('../../src/facade/lang');
  var exceptions_1 = $__require('../../src/facade/exceptions');
  var ng_zone_1 = $__require('../zone/ng_zone');
  var async_1 = $__require('../../src/facade/async');
  var decorators_1 = $__require('../di/decorators');
  var Testability = (function() {
    function Testability(_ngZone) {
      this._ngZone = _ngZone;
      this._pendingCount = 0;
      this._isZoneStable = true;
      this._didWork = false;
      this._callbacks = [];
      this._watchAngularEvents();
    }
    Testability.prototype._watchAngularEvents = function() {
      var _this = this;
      async_1.ObservableWrapper.subscribe(this._ngZone.onUnstable, function(_) {
        _this._didWork = true;
        _this._isZoneStable = false;
      });
      this._ngZone.runOutsideAngular(function() {
        async_1.ObservableWrapper.subscribe(_this._ngZone.onStable, function(_) {
          ng_zone_1.NgZone.assertNotInAngularZone();
          lang_1.scheduleMicroTask(function() {
            _this._isZoneStable = true;
            _this._runCallbacksIfReady();
          });
        });
      });
    };
    Testability.prototype.increasePendingRequestCount = function() {
      this._pendingCount += 1;
      this._didWork = true;
      return this._pendingCount;
    };
    Testability.prototype.decreasePendingRequestCount = function() {
      this._pendingCount -= 1;
      if (this._pendingCount < 0) {
        throw new exceptions_1.BaseException('pending async requests below zero');
      }
      this._runCallbacksIfReady();
      return this._pendingCount;
    };
    Testability.prototype.isStable = function() {
      return this._isZoneStable && this._pendingCount == 0 && !this._ngZone.hasPendingMacrotasks;
    };
    Testability.prototype._runCallbacksIfReady = function() {
      var _this = this;
      if (this.isStable()) {
        lang_1.scheduleMicroTask(function() {
          while (_this._callbacks.length !== 0) {
            (_this._callbacks.pop())(_this._didWork);
          }
          _this._didWork = false;
        });
      } else {
        this._didWork = true;
      }
    };
    Testability.prototype.whenStable = function(callback) {
      this._callbacks.push(callback);
      this._runCallbacksIfReady();
    };
    Testability.prototype.getPendingRequestCount = function() {
      return this._pendingCount;
    };
    Testability.prototype.findBindings = function(using, provider, exactMatch) {
      return [];
    };
    Testability.prototype.findProviders = function(using, provider, exactMatch) {
      return [];
    };
    Testability.decorators = [{type: decorators_1.Injectable}];
    Testability.ctorParameters = [{type: ng_zone_1.NgZone}];
    return Testability;
  }());
  exports.Testability = Testability;
  var TestabilityRegistry = (function() {
    function TestabilityRegistry() {
      this._applications = new collection_1.Map();
      _testabilityGetter.addToWindow(this);
    }
    TestabilityRegistry.prototype.registerApplication = function(token, testability) {
      this._applications.set(token, testability);
    };
    TestabilityRegistry.prototype.getTestability = function(elem) {
      return this._applications.get(elem);
    };
    TestabilityRegistry.prototype.getAllTestabilities = function() {
      return collection_1.MapWrapper.values(this._applications);
    };
    TestabilityRegistry.prototype.getAllRootElements = function() {
      return collection_1.MapWrapper.keys(this._applications);
    };
    TestabilityRegistry.prototype.findTestabilityInTree = function(elem, findInAncestors) {
      if (findInAncestors === void 0) {
        findInAncestors = true;
      }
      return _testabilityGetter.findTestabilityInTree(this, elem, findInAncestors);
    };
    TestabilityRegistry.decorators = [{type: decorators_1.Injectable}];
    TestabilityRegistry.ctorParameters = [];
    return TestabilityRegistry;
  }());
  exports.TestabilityRegistry = TestabilityRegistry;
  var _NoopGetTestability = (function() {
    function _NoopGetTestability() {}
    _NoopGetTestability.prototype.addToWindow = function(registry) {};
    _NoopGetTestability.prototype.findTestabilityInTree = function(registry, elem, findInAncestors) {
      return null;
    };
    return _NoopGetTestability;
  }());
  function setTestabilityGetter(getter) {
    _testabilityGetter = getter;
  }
  exports.setTestabilityGetter = setTestabilityGetter;
  var _testabilityGetter = new _NoopGetTestability();
  return module.exports;
});

System.registerDynamic("@angular/core/src/application_ref.js", ["./zone/ng_zone", "../src/facade/lang", "./di", "./application_tokens", "../src/facade/async", "../src/facade/collection", "./testability/testability", "./linker/component_resolver", "../src/facade/exceptions", "./console", "./profile/profile"], true, function($__require, exports, module) {
  "use strict";
  ;
  var define,
      global = this,
      GLOBAL = this;
  var __extends = (this && this.__extends) || function(d, b) {
    for (var p in b)
      if (b.hasOwnProperty(p))
        d[p] = b[p];
    function __() {
      this.constructor = d;
    }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
  };
  var ng_zone_1 = $__require('./zone/ng_zone');
  var lang_1 = $__require('../src/facade/lang');
  var di_1 = $__require('./di');
  var application_tokens_1 = $__require('./application_tokens');
  var async_1 = $__require('../src/facade/async');
  var collection_1 = $__require('../src/facade/collection');
  var testability_1 = $__require('./testability/testability');
  var component_resolver_1 = $__require('./linker/component_resolver');
  var exceptions_1 = $__require('../src/facade/exceptions');
  var console_1 = $__require('./console');
  var profile_1 = $__require('./profile/profile');
  function createNgZone() {
    return new ng_zone_1.NgZone({enableLongStackTrace: lang_1.assertionsEnabled()});
  }
  exports.createNgZone = createNgZone;
  var _platform;
  var _inPlatformCreate = false;
  function createPlatform(injector) {
    if (_inPlatformCreate) {
      throw new exceptions_1.BaseException('Already creating a platform...');
    }
    if (lang_1.isPresent(_platform) && !_platform.disposed) {
      throw new exceptions_1.BaseException("There can be only one platform. Destroy the previous one to create a new one.");
    }
    lang_1.lockMode();
    _inPlatformCreate = true;
    try {
      _platform = injector.get(PlatformRef);
    } finally {
      _inPlatformCreate = false;
    }
    return _platform;
  }
  exports.createPlatform = createPlatform;
  function assertPlatform(requiredToken) {
    var platform = getPlatform();
    if (lang_1.isBlank(platform)) {
      throw new exceptions_1.BaseException('Not platform exists!');
    }
    if (lang_1.isPresent(platform) && lang_1.isBlank(platform.injector.get(requiredToken, null))) {
      throw new exceptions_1.BaseException('A platform with a different configuration has been created. Please destroy it first.');
    }
    return platform;
  }
  exports.assertPlatform = assertPlatform;
  function disposePlatform() {
    if (lang_1.isPresent(_platform) && !_platform.disposed) {
      _platform.dispose();
    }
  }
  exports.disposePlatform = disposePlatform;
  function getPlatform() {
    return lang_1.isPresent(_platform) && !_platform.disposed ? _platform : null;
  }
  exports.getPlatform = getPlatform;
  function coreBootstrap(injector, componentFactory) {
    var appRef = injector.get(ApplicationRef);
    return appRef.bootstrap(componentFactory);
  }
  exports.coreBootstrap = coreBootstrap;
  function coreLoadAndBootstrap(injector, componentType) {
    var appRef = injector.get(ApplicationRef);
    return appRef.run(function() {
      var componentResolver = injector.get(component_resolver_1.ComponentResolver);
      return async_1.PromiseWrapper.all([componentResolver.resolveComponent(componentType), appRef.waitForAsyncInitializers()]).then(function(arr) {
        return appRef.bootstrap(arr[0]);
      });
    });
  }
  exports.coreLoadAndBootstrap = coreLoadAndBootstrap;
  var PlatformRef = (function() {
    function PlatformRef() {}
    Object.defineProperty(PlatformRef.prototype, "injector", {
      get: function() {
        throw exceptions_1.unimplemented();
      },
      enumerable: true,
      configurable: true
    });
    ;
    Object.defineProperty(PlatformRef.prototype, "disposed", {
      get: function() {
        throw exceptions_1.unimplemented();
      },
      enumerable: true,
      configurable: true
    });
    return PlatformRef;
  }());
  exports.PlatformRef = PlatformRef;
  var PlatformRef_ = (function(_super) {
    __extends(PlatformRef_, _super);
    function PlatformRef_(_injector) {
      _super.call(this);
      this._injector = _injector;
      this._applications = [];
      this._disposeListeners = [];
      this._disposed = false;
      if (!_inPlatformCreate) {
        throw new exceptions_1.BaseException('Platforms have to be created via `createPlatform`!');
      }
      var inits = _injector.get(application_tokens_1.PLATFORM_INITIALIZER, null);
      if (lang_1.isPresent(inits))
        inits.forEach(function(init) {
          return init();
        });
    }
    PlatformRef_.prototype.registerDisposeListener = function(dispose) {
      this._disposeListeners.push(dispose);
    };
    Object.defineProperty(PlatformRef_.prototype, "injector", {
      get: function() {
        return this._injector;
      },
      enumerable: true,
      configurable: true
    });
    Object.defineProperty(PlatformRef_.prototype, "disposed", {
      get: function() {
        return this._disposed;
      },
      enumerable: true,
      configurable: true
    });
    PlatformRef_.prototype.addApplication = function(appRef) {
      this._applications.push(appRef);
    };
    PlatformRef_.prototype.dispose = function() {
      collection_1.ListWrapper.clone(this._applications).forEach(function(app) {
        return app.dispose();
      });
      this._disposeListeners.forEach(function(dispose) {
        return dispose();
      });
      this._disposed = true;
    };
    PlatformRef_.prototype._applicationDisposed = function(app) {
      collection_1.ListWrapper.remove(this._applications, app);
    };
    PlatformRef_.decorators = [{type: di_1.Injectable}];
    PlatformRef_.ctorParameters = [{type: di_1.Injector}];
    return PlatformRef_;
  }(PlatformRef));
  exports.PlatformRef_ = PlatformRef_;
  var ApplicationRef = (function() {
    function ApplicationRef() {}
    Object.defineProperty(ApplicationRef.prototype, "injector", {
      get: function() {
        return exceptions_1.unimplemented();
      },
      enumerable: true,
      configurable: true
    });
    ;
    Object.defineProperty(ApplicationRef.prototype, "zone", {
      get: function() {
        return exceptions_1.unimplemented();
      },
      enumerable: true,
      configurable: true
    });
    ;
    Object.defineProperty(ApplicationRef.prototype, "componentTypes", {
      get: function() {
        return exceptions_1.unimplemented();
      },
      enumerable: true,
      configurable: true
    });
    ;
    return ApplicationRef;
  }());
  exports.ApplicationRef = ApplicationRef;
  var ApplicationRef_ = (function(_super) {
    __extends(ApplicationRef_, _super);
    function ApplicationRef_(_platform, _zone, _injector) {
      var _this = this;
      _super.call(this);
      this._platform = _platform;
      this._zone = _zone;
      this._injector = _injector;
      this._bootstrapListeners = [];
      this._disposeListeners = [];
      this._rootComponents = [];
      this._rootComponentTypes = [];
      this._changeDetectorRefs = [];
      this._runningTick = false;
      this._enforceNoNewChanges = false;
      var zone = _injector.get(ng_zone_1.NgZone);
      this._enforceNoNewChanges = lang_1.assertionsEnabled();
      zone.run(function() {
        _this._exceptionHandler = _injector.get(exceptions_1.ExceptionHandler);
      });
      this._asyncInitDonePromise = this.run(function() {
        var inits = _injector.get(application_tokens_1.APP_INITIALIZER, null);
        var asyncInitResults = [];
        var asyncInitDonePromise;
        if (lang_1.isPresent(inits)) {
          for (var i = 0; i < inits.length; i++) {
            var initResult = inits[i]();
            if (lang_1.isPromise(initResult)) {
              asyncInitResults.push(initResult);
            }
          }
        }
        if (asyncInitResults.length > 0) {
          asyncInitDonePromise = async_1.PromiseWrapper.all(asyncInitResults).then(function(_) {
            return _this._asyncInitDone = true;
          });
          _this._asyncInitDone = false;
        } else {
          _this._asyncInitDone = true;
          asyncInitDonePromise = async_1.PromiseWrapper.resolve(true);
        }
        return asyncInitDonePromise;
      });
      async_1.ObservableWrapper.subscribe(zone.onError, function(error) {
        _this._exceptionHandler.call(error.error, error.stackTrace);
      });
      async_1.ObservableWrapper.subscribe(this._zone.onMicrotaskEmpty, function(_) {
        _this._zone.run(function() {
          _this.tick();
        });
      });
    }
    ApplicationRef_.prototype.registerBootstrapListener = function(listener) {
      this._bootstrapListeners.push(listener);
    };
    ApplicationRef_.prototype.registerDisposeListener = function(dispose) {
      this._disposeListeners.push(dispose);
    };
    ApplicationRef_.prototype.registerChangeDetector = function(changeDetector) {
      this._changeDetectorRefs.push(changeDetector);
    };
    ApplicationRef_.prototype.unregisterChangeDetector = function(changeDetector) {
      collection_1.ListWrapper.remove(this._changeDetectorRefs, changeDetector);
    };
    ApplicationRef_.prototype.waitForAsyncInitializers = function() {
      return this._asyncInitDonePromise;
    };
    ApplicationRef_.prototype.run = function(callback) {
      var _this = this;
      var zone = this.injector.get(ng_zone_1.NgZone);
      var result;
      var completer = async_1.PromiseWrapper.completer();
      zone.run(function() {
        try {
          result = callback();
          if (lang_1.isPromise(result)) {
            async_1.PromiseWrapper.then(result, function(ref) {
              completer.resolve(ref);
            }, function(err, stackTrace) {
              completer.reject(err, stackTrace);
              _this._exceptionHandler.call(err, stackTrace);
            });
          }
        } catch (e) {
          _this._exceptionHandler.call(e, e.stack);
          throw e;
        }
      });
      return lang_1.isPromise(result) ? completer.promise : result;
    };
    ApplicationRef_.prototype.bootstrap = function(componentFactory) {
      var _this = this;
      if (!this._asyncInitDone) {
        throw new exceptions_1.BaseException('Cannot bootstrap as there are still asynchronous initializers running. Wait for them using waitForAsyncInitializers().');
      }
      return this.run(function() {
        _this._rootComponentTypes.push(componentFactory.componentType);
        var compRef = componentFactory.create(_this._injector, [], componentFactory.selector);
        compRef.onDestroy(function() {
          _this._unloadComponent(compRef);
        });
        var testability = compRef.injector.get(testability_1.Testability, null);
        if (lang_1.isPresent(testability)) {
          compRef.injector.get(testability_1.TestabilityRegistry).registerApplication(compRef.location.nativeElement, testability);
        }
        _this._loadComponent(compRef);
        var c = _this._injector.get(console_1.Console);
        if (lang_1.assertionsEnabled()) {
          c.log("Angular 2 is running in the development mode. Call enableProdMode() to enable the production mode.");
        }
        return compRef;
      });
    };
    ApplicationRef_.prototype._loadComponent = function(componentRef) {
      this._changeDetectorRefs.push(componentRef.changeDetectorRef);
      this.tick();
      this._rootComponents.push(componentRef);
      this._bootstrapListeners.forEach(function(listener) {
        return listener(componentRef);
      });
    };
    ApplicationRef_.prototype._unloadComponent = function(componentRef) {
      if (!collection_1.ListWrapper.contains(this._rootComponents, componentRef)) {
        return;
      }
      this.unregisterChangeDetector(componentRef.changeDetectorRef);
      collection_1.ListWrapper.remove(this._rootComponents, componentRef);
    };
    Object.defineProperty(ApplicationRef_.prototype, "injector", {
      get: function() {
        return this._injector;
      },
      enumerable: true,
      configurable: true
    });
    Object.defineProperty(ApplicationRef_.prototype, "zone", {
      get: function() {
        return this._zone;
      },
      enumerable: true,
      configurable: true
    });
    ApplicationRef_.prototype.tick = function() {
      if (this._runningTick) {
        throw new exceptions_1.BaseException("ApplicationRef.tick is called recursively");
      }
      var s = ApplicationRef_._tickScope();
      try {
        this._runningTick = true;
        this._changeDetectorRefs.forEach(function(detector) {
          return detector.detectChanges();
        });
        if (this._enforceNoNewChanges) {
          this._changeDetectorRefs.forEach(function(detector) {
            return detector.checkNoChanges();
          });
        }
      } finally {
        this._runningTick = false;
        profile_1.wtfLeave(s);
      }
    };
    ApplicationRef_.prototype.dispose = function() {
      collection_1.ListWrapper.clone(this._rootComponents).forEach(function(ref) {
        return ref.destroy();
      });
      this._disposeListeners.forEach(function(dispose) {
        return dispose();
      });
      this._platform._applicationDisposed(this);
    };
    Object.defineProperty(ApplicationRef_.prototype, "componentTypes", {
      get: function() {
        return this._rootComponentTypes;
      },
      enumerable: true,
      configurable: true
    });
    ApplicationRef_._tickScope = profile_1.wtfCreateScope('ApplicationRef#tick()');
    ApplicationRef_.decorators = [{type: di_1.Injectable}];
    ApplicationRef_.ctorParameters = [{type: PlatformRef_}, {type: ng_zone_1.NgZone}, {type: di_1.Injector}];
    return ApplicationRef_;
  }(ApplicationRef));
  exports.ApplicationRef_ = ApplicationRef_;
  exports.PLATFORM_CORE_PROVIDERS = [PlatformRef_, ({
    provide: PlatformRef,
    useExisting: PlatformRef_
  })];
  exports.APPLICATION_CORE_PROVIDERS = [{
    provide: ng_zone_1.NgZone,
    useFactory: createNgZone,
    deps: []
  }, ApplicationRef_, {
    provide: ApplicationRef,
    useExisting: ApplicationRef_
  }];
  return module.exports;
});

System.registerDynamic("@angular/core/src/linker/dynamic_component_loader.js", ["./component_resolver", "../../src/facade/lang", "../di/reflective_injector", "../di/decorators"], true, function($__require, exports, module) {
  "use strict";
  ;
  var define,
      global = this,
      GLOBAL = this;
  var __extends = (this && this.__extends) || function(d, b) {
    for (var p in b)
      if (b.hasOwnProperty(p))
        d[p] = b[p];
    function __() {
      this.constructor = d;
    }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
  };
  var component_resolver_1 = $__require('./component_resolver');
  var lang_1 = $__require('../../src/facade/lang');
  var reflective_injector_1 = $__require('../di/reflective_injector');
  var decorators_1 = $__require('../di/decorators');
  var DynamicComponentLoader = (function() {
    function DynamicComponentLoader() {}
    return DynamicComponentLoader;
  }());
  exports.DynamicComponentLoader = DynamicComponentLoader;
  var DynamicComponentLoader_ = (function(_super) {
    __extends(DynamicComponentLoader_, _super);
    function DynamicComponentLoader_(_compiler) {
      _super.call(this);
      this._compiler = _compiler;
    }
    DynamicComponentLoader_.prototype.loadAsRoot = function(type, overrideSelectorOrNode, injector, onDispose, projectableNodes) {
      return this._compiler.resolveComponent(type).then(function(componentFactory) {
        var componentRef = componentFactory.create(injector, projectableNodes, lang_1.isPresent(overrideSelectorOrNode) ? overrideSelectorOrNode : componentFactory.selector);
        if (lang_1.isPresent(onDispose)) {
          componentRef.onDestroy(onDispose);
        }
        return componentRef;
      });
    };
    DynamicComponentLoader_.prototype.loadNextToLocation = function(type, location, providers, projectableNodes) {
      if (providers === void 0) {
        providers = null;
      }
      if (projectableNodes === void 0) {
        projectableNodes = null;
      }
      return this._compiler.resolveComponent(type).then(function(componentFactory) {
        var contextInjector = location.parentInjector;
        var childInjector = lang_1.isPresent(providers) && providers.length > 0 ? reflective_injector_1.ReflectiveInjector.fromResolvedProviders(providers, contextInjector) : contextInjector;
        return location.createComponent(componentFactory, location.length, childInjector, projectableNodes);
      });
    };
    DynamicComponentLoader_.decorators = [{type: decorators_1.Injectable}];
    DynamicComponentLoader_.ctorParameters = [{type: component_resolver_1.ComponentResolver}];
    return DynamicComponentLoader_;
  }(DynamicComponentLoader));
  exports.DynamicComponentLoader_ = DynamicComponentLoader_;
  return module.exports;
});

System.registerDynamic("@angular/core/src/application_common_providers.js", ["./application_tokens", "./application_ref", "./change_detection/change_detection", "./linker/view_utils", "./linker/component_resolver", "./linker/dynamic_component_loader"], true, function($__require, exports, module) {
  "use strict";
  ;
  var define,
      global = this,
      GLOBAL = this;
  var application_tokens_1 = $__require('./application_tokens');
  var application_ref_1 = $__require('./application_ref');
  var change_detection_1 = $__require('./change_detection/change_detection');
  var view_utils_1 = $__require('./linker/view_utils');
  var component_resolver_1 = $__require('./linker/component_resolver');
  var dynamic_component_loader_1 = $__require('./linker/dynamic_component_loader');
  var __unused;
  exports.APPLICATION_COMMON_PROVIDERS = [application_ref_1.APPLICATION_CORE_PROVIDERS, {
    provide: component_resolver_1.ComponentResolver,
    useClass: component_resolver_1.ReflectorComponentResolver
  }, application_tokens_1.APP_ID_RANDOM_PROVIDER, view_utils_1.ViewUtils, {
    provide: change_detection_1.IterableDiffers,
    useValue: change_detection_1.defaultIterableDiffers
  }, {
    provide: change_detection_1.KeyValueDiffers,
    useValue: change_detection_1.defaultKeyValueDiffers
  }, {
    provide: dynamic_component_loader_1.DynamicComponentLoader,
    useClass: dynamic_component_loader_1.DynamicComponentLoader_
  }];
  return module.exports;
});

System.registerDynamic("@angular/core/src/metadata/lifecycle_hooks.js", [], true, function($__require, exports, module) {
  "use strict";
  ;
  var define,
      global = this,
      GLOBAL = this;
  (function(LifecycleHooks) {
    LifecycleHooks[LifecycleHooks["OnInit"] = 0] = "OnInit";
    LifecycleHooks[LifecycleHooks["OnDestroy"] = 1] = "OnDestroy";
    LifecycleHooks[LifecycleHooks["DoCheck"] = 2] = "DoCheck";
    LifecycleHooks[LifecycleHooks["OnChanges"] = 3] = "OnChanges";
    LifecycleHooks[LifecycleHooks["AfterContentInit"] = 4] = "AfterContentInit";
    LifecycleHooks[LifecycleHooks["AfterContentChecked"] = 5] = "AfterContentChecked";
    LifecycleHooks[LifecycleHooks["AfterViewInit"] = 6] = "AfterViewInit";
    LifecycleHooks[LifecycleHooks["AfterViewChecked"] = 7] = "AfterViewChecked";
  })(exports.LifecycleHooks || (exports.LifecycleHooks = {}));
  var LifecycleHooks = exports.LifecycleHooks;
  exports.LIFECYCLE_HOOKS_VALUES = [LifecycleHooks.OnInit, LifecycleHooks.OnDestroy, LifecycleHooks.DoCheck, LifecycleHooks.OnChanges, LifecycleHooks.AfterContentInit, LifecycleHooks.AfterContentChecked, LifecycleHooks.AfterViewInit, LifecycleHooks.AfterViewChecked];
  return module.exports;
});

System.registerDynamic("@angular/core/src/linker/component_factory.js", ["../../src/facade/lang", "../../src/facade/exceptions", "./view_utils"], true, function($__require, exports, module) {
  "use strict";
  ;
  var define,
      global = this,
      GLOBAL = this;
  var __extends = (this && this.__extends) || function(d, b) {
    for (var p in b)
      if (b.hasOwnProperty(p))
        d[p] = b[p];
    function __() {
      this.constructor = d;
    }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
  };
  var lang_1 = $__require('../../src/facade/lang');
  var exceptions_1 = $__require('../../src/facade/exceptions');
  var view_utils_1 = $__require('./view_utils');
  var ComponentRef = (function() {
    function ComponentRef() {}
    Object.defineProperty(ComponentRef.prototype, "location", {
      get: function() {
        return exceptions_1.unimplemented();
      },
      enumerable: true,
      configurable: true
    });
    Object.defineProperty(ComponentRef.prototype, "injector", {
      get: function() {
        return exceptions_1.unimplemented();
      },
      enumerable: true,
      configurable: true
    });
    Object.defineProperty(ComponentRef.prototype, "instance", {
      get: function() {
        return exceptions_1.unimplemented();
      },
      enumerable: true,
      configurable: true
    });
    ;
    Object.defineProperty(ComponentRef.prototype, "hostView", {
      get: function() {
        return exceptions_1.unimplemented();
      },
      enumerable: true,
      configurable: true
    });
    ;
    Object.defineProperty(ComponentRef.prototype, "changeDetectorRef", {
      get: function() {
        return exceptions_1.unimplemented();
      },
      enumerable: true,
      configurable: true
    });
    Object.defineProperty(ComponentRef.prototype, "componentType", {
      get: function() {
        return exceptions_1.unimplemented();
      },
      enumerable: true,
      configurable: true
    });
    return ComponentRef;
  }());
  exports.ComponentRef = ComponentRef;
  var ComponentRef_ = (function(_super) {
    __extends(ComponentRef_, _super);
    function ComponentRef_(_hostElement, _componentType) {
      _super.call(this);
      this._hostElement = _hostElement;
      this._componentType = _componentType;
    }
    Object.defineProperty(ComponentRef_.prototype, "location", {
      get: function() {
        return this._hostElement.elementRef;
      },
      enumerable: true,
      configurable: true
    });
    Object.defineProperty(ComponentRef_.prototype, "injector", {
      get: function() {
        return this._hostElement.injector;
      },
      enumerable: true,
      configurable: true
    });
    Object.defineProperty(ComponentRef_.prototype, "instance", {
      get: function() {
        return this._hostElement.component;
      },
      enumerable: true,
      configurable: true
    });
    ;
    Object.defineProperty(ComponentRef_.prototype, "hostView", {
      get: function() {
        return this._hostElement.parentView.ref;
      },
      enumerable: true,
      configurable: true
    });
    ;
    Object.defineProperty(ComponentRef_.prototype, "changeDetectorRef", {
      get: function() {
        return this._hostElement.parentView.ref;
      },
      enumerable: true,
      configurable: true
    });
    ;
    Object.defineProperty(ComponentRef_.prototype, "componentType", {
      get: function() {
        return this._componentType;
      },
      enumerable: true,
      configurable: true
    });
    ComponentRef_.prototype.destroy = function() {
      this._hostElement.parentView.destroy();
    };
    ComponentRef_.prototype.onDestroy = function(callback) {
      this.hostView.onDestroy(callback);
    };
    return ComponentRef_;
  }(ComponentRef));
  exports.ComponentRef_ = ComponentRef_;
  var EMPTY_CONTEXT = new Object();
  var ComponentFactory = (function() {
    function ComponentFactory(selector, _viewFactory, _componentType) {
      this.selector = selector;
      this._viewFactory = _viewFactory;
      this._componentType = _componentType;
    }
    Object.defineProperty(ComponentFactory.prototype, "componentType", {
      get: function() {
        return this._componentType;
      },
      enumerable: true,
      configurable: true
    });
    ComponentFactory.prototype.create = function(injector, projectableNodes, rootSelectorOrNode) {
      if (projectableNodes === void 0) {
        projectableNodes = null;
      }
      if (rootSelectorOrNode === void 0) {
        rootSelectorOrNode = null;
      }
      var vu = injector.get(view_utils_1.ViewUtils);
      if (lang_1.isBlank(projectableNodes)) {
        projectableNodes = [];
      }
      var hostView = this._viewFactory(vu, injector, null);
      var hostElement = hostView.create(EMPTY_CONTEXT, projectableNodes, rootSelectorOrNode);
      return new ComponentRef_(hostElement, this._componentType);
    };
    return ComponentFactory;
  }());
  exports.ComponentFactory = ComponentFactory;
  return module.exports;
});

System.registerDynamic("@angular/core/src/linker/component_resolver.js", ["../../src/facade/lang", "../../src/facade/exceptions", "../../src/facade/async", "../reflection/reflection", "./component_factory", "../di/decorators"], true, function($__require, exports, module) {
  "use strict";
  ;
  var define,
      global = this,
      GLOBAL = this;
  var __extends = (this && this.__extends) || function(d, b) {
    for (var p in b)
      if (b.hasOwnProperty(p))
        d[p] = b[p];
    function __() {
      this.constructor = d;
    }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
  };
  var lang_1 = $__require('../../src/facade/lang');
  var exceptions_1 = $__require('../../src/facade/exceptions');
  var async_1 = $__require('../../src/facade/async');
  var reflection_1 = $__require('../reflection/reflection');
  var component_factory_1 = $__require('./component_factory');
  var decorators_1 = $__require('../di/decorators');
  var ComponentResolver = (function() {
    function ComponentResolver() {}
    return ComponentResolver;
  }());
  exports.ComponentResolver = ComponentResolver;
  function _isComponentFactory(type) {
    return type instanceof component_factory_1.ComponentFactory;
  }
  var ReflectorComponentResolver = (function(_super) {
    __extends(ReflectorComponentResolver, _super);
    function ReflectorComponentResolver() {
      _super.apply(this, arguments);
    }
    ReflectorComponentResolver.prototype.resolveComponent = function(componentType) {
      var metadatas = reflection_1.reflector.annotations(componentType);
      var componentFactory = metadatas.find(_isComponentFactory);
      if (lang_1.isBlank(componentFactory)) {
        throw new exceptions_1.BaseException("No precompiled component " + lang_1.stringify(componentType) + " found");
      }
      return async_1.PromiseWrapper.resolve(componentFactory);
    };
    ReflectorComponentResolver.prototype.clearCache = function() {};
    ReflectorComponentResolver.decorators = [{type: decorators_1.Injectable}];
    return ReflectorComponentResolver;
  }(ComponentResolver));
  exports.ReflectorComponentResolver = ReflectorComponentResolver;
  return module.exports;
});

System.registerDynamic("@angular/core/src/facade/promise.js", [], true, function($__require, exports, module) {
  "use strict";
  ;
  var define,
      global = this,
      GLOBAL = this;
  var PromiseCompleter = (function() {
    function PromiseCompleter() {
      var _this = this;
      this.promise = new Promise(function(res, rej) {
        _this.resolve = res;
        _this.reject = rej;
      });
    }
    return PromiseCompleter;
  }());
  exports.PromiseCompleter = PromiseCompleter;
  var PromiseWrapper = (function() {
    function PromiseWrapper() {}
    PromiseWrapper.resolve = function(obj) {
      return Promise.resolve(obj);
    };
    PromiseWrapper.reject = function(obj, _) {
      return Promise.reject(obj);
    };
    PromiseWrapper.catchError = function(promise, onError) {
      return promise.catch(onError);
    };
    PromiseWrapper.all = function(promises) {
      if (promises.length == 0)
        return Promise.resolve([]);
      return Promise.all(promises);
    };
    PromiseWrapper.then = function(promise, success, rejection) {
      return promise.then(success, rejection);
    };
    PromiseWrapper.wrap = function(computation) {
      return new Promise(function(res, rej) {
        try {
          res(computation());
        } catch (e) {
          rej(e);
        }
      });
    };
    PromiseWrapper.scheduleMicrotask = function(computation) {
      PromiseWrapper.then(PromiseWrapper.resolve(null), computation, function(_) {});
    };
    PromiseWrapper.isPromise = function(obj) {
      return obj instanceof Promise;
    };
    PromiseWrapper.completer = function() {
      return new PromiseCompleter();
    };
    return PromiseWrapper;
  }());
  exports.PromiseWrapper = PromiseWrapper;
  return module.exports;
});

System.registerDynamic("rxjs/SubjectSubscription.js", ["./Subscription"], true, function($__require, exports, module) {
  "use strict";
  ;
  var define,
      global = this,
      GLOBAL = this;
  var __extends = (this && this.__extends) || function(d, b) {
    for (var p in b)
      if (b.hasOwnProperty(p))
        d[p] = b[p];
    function __() {
      this.constructor = d;
    }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
  };
  var Subscription_1 = $__require('./Subscription');
  var SubjectSubscription = (function(_super) {
    __extends(SubjectSubscription, _super);
    function SubjectSubscription(subject, observer) {
      _super.call(this);
      this.subject = subject;
      this.observer = observer;
      this.isUnsubscribed = false;
    }
    SubjectSubscription.prototype.unsubscribe = function() {
      if (this.isUnsubscribed) {
        return;
      }
      this.isUnsubscribed = true;
      var subject = this.subject;
      var observers = subject.observers;
      this.subject = null;
      if (!observers || observers.length === 0 || subject.isUnsubscribed) {
        return;
      }
      var subscriberIndex = observers.indexOf(this.observer);
      if (subscriberIndex !== -1) {
        observers.splice(subscriberIndex, 1);
      }
    };
    return SubjectSubscription;
  }(Subscription_1.Subscription));
  exports.SubjectSubscription = SubjectSubscription;
  return module.exports;
});

System.registerDynamic("rxjs/util/throwError.js", [], true, function($__require, exports, module) {
  "use strict";
  ;
  var define,
      global = this,
      GLOBAL = this;
  function throwError(e) {
    throw e;
  }
  exports.throwError = throwError;
  return module.exports;
});

System.registerDynamic("rxjs/util/ObjectUnsubscribedError.js", [], true, function($__require, exports, module) {
  "use strict";
  ;
  var define,
      global = this,
      GLOBAL = this;
  var __extends = (this && this.__extends) || function(d, b) {
    for (var p in b)
      if (b.hasOwnProperty(p))
        d[p] = b[p];
    function __() {
      this.constructor = d;
    }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
  };
  var ObjectUnsubscribedError = (function(_super) {
    __extends(ObjectUnsubscribedError, _super);
    function ObjectUnsubscribedError() {
      _super.call(this, 'object unsubscribed');
      this.name = 'ObjectUnsubscribedError';
    }
    return ObjectUnsubscribedError;
  }(Error));
  exports.ObjectUnsubscribedError = ObjectUnsubscribedError;
  return module.exports;
});

System.registerDynamic("rxjs/Subject.js", ["./Observable", "./Subscriber", "./Subscription", "./SubjectSubscription", "./symbol/rxSubscriber", "./util/throwError", "./util/ObjectUnsubscribedError"], true, function($__require, exports, module) {
  "use strict";
  ;
  var define,
      global = this,
      GLOBAL = this;
  var __extends = (this && this.__extends) || function(d, b) {
    for (var p in b)
      if (b.hasOwnProperty(p))
        d[p] = b[p];
    function __() {
      this.constructor = d;
    }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
  };
  var Observable_1 = $__require('./Observable');
  var Subscriber_1 = $__require('./Subscriber');
  var Subscription_1 = $__require('./Subscription');
  var SubjectSubscription_1 = $__require('./SubjectSubscription');
  var rxSubscriber_1 = $__require('./symbol/rxSubscriber');
  var throwError_1 = $__require('./util/throwError');
  var ObjectUnsubscribedError_1 = $__require('./util/ObjectUnsubscribedError');
  var Subject = (function(_super) {
    __extends(Subject, _super);
    function Subject(destination, source) {
      _super.call(this);
      this.destination = destination;
      this.source = source;
      this.observers = [];
      this.isUnsubscribed = false;
      this.isStopped = false;
      this.hasErrored = false;
      this.dispatching = false;
      this.hasCompleted = false;
      this.source = source;
    }
    Subject.prototype.lift = function(operator) {
      var subject = new Subject(this.destination || this, this);
      subject.operator = operator;
      return subject;
    };
    Subject.prototype.add = function(subscription) {
      return Subscription_1.Subscription.prototype.add.call(this, subscription);
    };
    Subject.prototype.remove = function(subscription) {
      Subscription_1.Subscription.prototype.remove.call(this, subscription);
    };
    Subject.prototype.unsubscribe = function() {
      Subscription_1.Subscription.prototype.unsubscribe.call(this);
    };
    Subject.prototype._subscribe = function(subscriber) {
      if (this.source) {
        return this.source.subscribe(subscriber);
      } else {
        if (subscriber.isUnsubscribed) {
          return;
        } else if (this.hasErrored) {
          return subscriber.error(this.errorValue);
        } else if (this.hasCompleted) {
          return subscriber.complete();
        }
        this.throwIfUnsubscribed();
        var subscription = new SubjectSubscription_1.SubjectSubscription(this, subscriber);
        this.observers.push(subscriber);
        return subscription;
      }
    };
    Subject.prototype._unsubscribe = function() {
      this.source = null;
      this.isStopped = true;
      this.observers = null;
      this.destination = null;
    };
    Subject.prototype.next = function(value) {
      this.throwIfUnsubscribed();
      if (this.isStopped) {
        return;
      }
      this.dispatching = true;
      this._next(value);
      this.dispatching = false;
      if (this.hasErrored) {
        this._error(this.errorValue);
      } else if (this.hasCompleted) {
        this._complete();
      }
    };
    Subject.prototype.error = function(err) {
      this.throwIfUnsubscribed();
      if (this.isStopped) {
        return;
      }
      this.isStopped = true;
      this.hasErrored = true;
      this.errorValue = err;
      if (this.dispatching) {
        return;
      }
      this._error(err);
    };
    Subject.prototype.complete = function() {
      this.throwIfUnsubscribed();
      if (this.isStopped) {
        return;
      }
      this.isStopped = true;
      this.hasCompleted = true;
      if (this.dispatching) {
        return;
      }
      this._complete();
    };
    Subject.prototype.asObservable = function() {
      var observable = new SubjectObservable(this);
      return observable;
    };
    Subject.prototype._next = function(value) {
      if (this.destination) {
        this.destination.next(value);
      } else {
        this._finalNext(value);
      }
    };
    Subject.prototype._finalNext = function(value) {
      var index = -1;
      var observers = this.observers.slice(0);
      var len = observers.length;
      while (++index < len) {
        observers[index].next(value);
      }
    };
    Subject.prototype._error = function(err) {
      if (this.destination) {
        this.destination.error(err);
      } else {
        this._finalError(err);
      }
    };
    Subject.prototype._finalError = function(err) {
      var index = -1;
      var observers = this.observers;
      this.observers = null;
      this.isUnsubscribed = true;
      if (observers) {
        var len = observers.length;
        while (++index < len) {
          observers[index].error(err);
        }
      }
      this.isUnsubscribed = false;
      this.unsubscribe();
    };
    Subject.prototype._complete = function() {
      if (this.destination) {
        this.destination.complete();
      } else {
        this._finalComplete();
      }
    };
    Subject.prototype._finalComplete = function() {
      var index = -1;
      var observers = this.observers;
      this.observers = null;
      this.isUnsubscribed = true;
      if (observers) {
        var len = observers.length;
        while (++index < len) {
          observers[index].complete();
        }
      }
      this.isUnsubscribed = false;
      this.unsubscribe();
    };
    Subject.prototype.throwIfUnsubscribed = function() {
      if (this.isUnsubscribed) {
        throwError_1.throwError(new ObjectUnsubscribedError_1.ObjectUnsubscribedError());
      }
    };
    Subject.prototype[rxSubscriber_1.$$rxSubscriber] = function() {
      return new Subscriber_1.Subscriber(this);
    };
    Subject.create = function(destination, source) {
      return new Subject(destination, source);
    };
    return Subject;
  }(Observable_1.Observable));
  exports.Subject = Subject;
  var SubjectObservable = (function(_super) {
    __extends(SubjectObservable, _super);
    function SubjectObservable(source) {
      _super.call(this);
      this.source = source;
    }
    return SubjectObservable;
  }(Observable_1.Observable));
  return module.exports;
});

System.registerDynamic("rxjs/observable/PromiseObservable.js", ["../util/root", "../Observable"], true, function($__require, exports, module) {
  "use strict";
  ;
  var define,
      global = this,
      GLOBAL = this;
  var __extends = (this && this.__extends) || function(d, b) {
    for (var p in b)
      if (b.hasOwnProperty(p))
        d[p] = b[p];
    function __() {
      this.constructor = d;
    }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
  };
  var root_1 = $__require('../util/root');
  var Observable_1 = $__require('../Observable');
  var PromiseObservable = (function(_super) {
    __extends(PromiseObservable, _super);
    function PromiseObservable(promise, scheduler) {
      if (scheduler === void 0) {
        scheduler = null;
      }
      _super.call(this);
      this.promise = promise;
      this.scheduler = scheduler;
    }
    PromiseObservable.create = function(promise, scheduler) {
      if (scheduler === void 0) {
        scheduler = null;
      }
      return new PromiseObservable(promise, scheduler);
    };
    PromiseObservable.prototype._subscribe = function(subscriber) {
      var _this = this;
      var promise = this.promise;
      var scheduler = this.scheduler;
      if (scheduler == null) {
        if (this._isScalar) {
          if (!subscriber.isUnsubscribed) {
            subscriber.next(this.value);
            subscriber.complete();
          }
        } else {
          promise.then(function(value) {
            _this.value = value;
            _this._isScalar = true;
            if (!subscriber.isUnsubscribed) {
              subscriber.next(value);
              subscriber.complete();
            }
          }, function(err) {
            if (!subscriber.isUnsubscribed) {
              subscriber.error(err);
            }
          }).then(null, function(err) {
            root_1.root.setTimeout(function() {
              throw err;
            });
          });
        }
      } else {
        if (this._isScalar) {
          if (!subscriber.isUnsubscribed) {
            return scheduler.schedule(dispatchNext, 0, {
              value: this.value,
              subscriber: subscriber
            });
          }
        } else {
          promise.then(function(value) {
            _this.value = value;
            _this._isScalar = true;
            if (!subscriber.isUnsubscribed) {
              subscriber.add(scheduler.schedule(dispatchNext, 0, {
                value: value,
                subscriber: subscriber
              }));
            }
          }, function(err) {
            if (!subscriber.isUnsubscribed) {
              subscriber.add(scheduler.schedule(dispatchError, 0, {
                err: err,
                subscriber: subscriber
              }));
            }
          }).then(null, function(err) {
            root_1.root.setTimeout(function() {
              throw err;
            });
          });
        }
      }
    };
    return PromiseObservable;
  }(Observable_1.Observable));
  exports.PromiseObservable = PromiseObservable;
  function dispatchNext(arg) {
    var value = arg.value,
        subscriber = arg.subscriber;
    if (!subscriber.isUnsubscribed) {
      subscriber.next(value);
      subscriber.complete();
    }
  }
  function dispatchError(arg) {
    var err = arg.err,
        subscriber = arg.subscriber;
    if (!subscriber.isUnsubscribed) {
      subscriber.error(err);
    }
  }
  return module.exports;
});

System.registerDynamic("rxjs/operator/toPromise.js", ["../util/root"], true, function($__require, exports, module) {
  "use strict";
  ;
  var define,
      global = this,
      GLOBAL = this;
  var root_1 = $__require('../util/root');
  function toPromise(PromiseCtor) {
    var _this = this;
    if (!PromiseCtor) {
      if (root_1.root.Rx && root_1.root.Rx.config && root_1.root.Rx.config.Promise) {
        PromiseCtor = root_1.root.Rx.config.Promise;
      } else if (root_1.root.Promise) {
        PromiseCtor = root_1.root.Promise;
      }
    }
    if (!PromiseCtor) {
      throw new Error('no Promise impl found');
    }
    return new PromiseCtor(function(resolve, reject) {
      var value;
      _this.subscribe(function(x) {
        return value = x;
      }, function(err) {
        return reject(err);
      }, function() {
        return resolve(value);
      });
    });
  }
  exports.toPromise = toPromise;
  return module.exports;
});

System.registerDynamic("rxjs/symbol/observable.js", ["../util/root"], true, function($__require, exports, module) {
  "use strict";
  ;
  var define,
      global = this,
      GLOBAL = this;
  var root_1 = $__require('../util/root');
  var Symbol = root_1.root.Symbol;
  if (typeof Symbol === 'function') {
    if (Symbol.observable) {
      exports.$$observable = Symbol.observable;
    } else {
      if (typeof Symbol.for === 'function') {
        exports.$$observable = Symbol.for('observable');
      } else {
        exports.$$observable = Symbol('observable');
      }
      Symbol.observable = exports.$$observable;
    }
  } else {
    exports.$$observable = '@@observable';
  }
  return module.exports;
});

System.registerDynamic("rxjs/util/isArray.js", [], true, function($__require, exports, module) {
  "use strict";
  ;
  var define,
      global = this,
      GLOBAL = this;
  exports.isArray = Array.isArray || (function(x) {
    return x && typeof x.length === 'number';
  });
  return module.exports;
});

System.registerDynamic("rxjs/util/isObject.js", [], true, function($__require, exports, module) {
  "use strict";
  ;
  var define,
      global = this,
      GLOBAL = this;
  function isObject(x) {
    return x != null && typeof x === 'object';
  }
  exports.isObject = isObject;
  return module.exports;
});

System.registerDynamic("rxjs/util/isFunction.js", [], true, function($__require, exports, module) {
  "use strict";
  ;
  var define,
      global = this,
      GLOBAL = this;
  function isFunction(x) {
    return typeof x === 'function';
  }
  exports.isFunction = isFunction;
  return module.exports;
});

System.registerDynamic("rxjs/util/tryCatch.js", ["./errorObject"], true, function($__require, exports, module) {
  "use strict";
  ;
  var define,
      global = this,
      GLOBAL = this;
  var errorObject_1 = $__require('./errorObject');
  var tryCatchTarget;
  function tryCatcher() {
    try {
      return tryCatchTarget.apply(this, arguments);
    } catch (e) {
      errorObject_1.errorObject.e = e;
      return errorObject_1.errorObject;
    }
  }
  function tryCatch(fn) {
    tryCatchTarget = fn;
    return tryCatcher;
  }
  exports.tryCatch = tryCatch;
  ;
  return module.exports;
});

System.registerDynamic("rxjs/util/errorObject.js", [], true, function($__require, exports, module) {
  "use strict";
  ;
  var define,
      global = this,
      GLOBAL = this;
  exports.errorObject = {e: {}};
  return module.exports;
});

System.registerDynamic("rxjs/util/UnsubscriptionError.js", [], true, function($__require, exports, module) {
  "use strict";
  ;
  var define,
      global = this,
      GLOBAL = this;
  var __extends = (this && this.__extends) || function(d, b) {
    for (var p in b)
      if (b.hasOwnProperty(p))
        d[p] = b[p];
    function __() {
      this.constructor = d;
    }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
  };
  var UnsubscriptionError = (function(_super) {
    __extends(UnsubscriptionError, _super);
    function UnsubscriptionError(errors) {
      _super.call(this);
      this.errors = errors;
      this.name = 'UnsubscriptionError';
      this.message = errors ? errors.length + " errors occurred during unsubscription:\n" + errors.map(function(err, i) {
        return ((i + 1) + ") " + err.toString());
      }).join('\n') : '';
    }
    return UnsubscriptionError;
  }(Error));
  exports.UnsubscriptionError = UnsubscriptionError;
  return module.exports;
});

System.registerDynamic("rxjs/Subscription.js", ["./util/isArray", "./util/isObject", "./util/isFunction", "./util/tryCatch", "./util/errorObject", "./util/UnsubscriptionError"], true, function($__require, exports, module) {
  "use strict";
  ;
  var define,
      global = this,
      GLOBAL = this;
  var isArray_1 = $__require('./util/isArray');
  var isObject_1 = $__require('./util/isObject');
  var isFunction_1 = $__require('./util/isFunction');
  var tryCatch_1 = $__require('./util/tryCatch');
  var errorObject_1 = $__require('./util/errorObject');
  var UnsubscriptionError_1 = $__require('./util/UnsubscriptionError');
  var Subscription = (function() {
    function Subscription(unsubscribe) {
      this.isUnsubscribed = false;
      if (unsubscribe) {
        this._unsubscribe = unsubscribe;
      }
    }
    Subscription.prototype.unsubscribe = function() {
      var hasErrors = false;
      var errors;
      if (this.isUnsubscribed) {
        return;
      }
      this.isUnsubscribed = true;
      var _a = this,
          _unsubscribe = _a._unsubscribe,
          _subscriptions = _a._subscriptions;
      this._subscriptions = null;
      if (isFunction_1.isFunction(_unsubscribe)) {
        var trial = tryCatch_1.tryCatch(_unsubscribe).call(this);
        if (trial === errorObject_1.errorObject) {
          hasErrors = true;
          (errors = errors || []).push(errorObject_1.errorObject.e);
        }
      }
      if (isArray_1.isArray(_subscriptions)) {
        var index = -1;
        var len = _subscriptions.length;
        while (++index < len) {
          var sub = _subscriptions[index];
          if (isObject_1.isObject(sub)) {
            var trial = tryCatch_1.tryCatch(sub.unsubscribe).call(sub);
            if (trial === errorObject_1.errorObject) {
              hasErrors = true;
              errors = errors || [];
              var err = errorObject_1.errorObject.e;
              if (err instanceof UnsubscriptionError_1.UnsubscriptionError) {
                errors = errors.concat(err.errors);
              } else {
                errors.push(err);
              }
            }
          }
        }
      }
      if (hasErrors) {
        throw new UnsubscriptionError_1.UnsubscriptionError(errors);
      }
    };
    Subscription.prototype.add = function(teardown) {
      if (!teardown || (teardown === this) || (teardown === Subscription.EMPTY)) {
        return;
      }
      var sub = teardown;
      switch (typeof teardown) {
        case 'function':
          sub = new Subscription(teardown);
        case 'object':
          if (sub.isUnsubscribed || typeof sub.unsubscribe !== 'function') {
            break;
          } else if (this.isUnsubscribed) {
            sub.unsubscribe();
          } else {
            (this._subscriptions || (this._subscriptions = [])).push(sub);
          }
          break;
        default:
          throw new Error('Unrecognized teardown ' + teardown + ' added to Subscription.');
      }
      return sub;
    };
    Subscription.prototype.remove = function(subscription) {
      if (subscription == null || (subscription === this) || (subscription === Subscription.EMPTY)) {
        return;
      }
      var subscriptions = this._subscriptions;
      if (subscriptions) {
        var subscriptionIndex = subscriptions.indexOf(subscription);
        if (subscriptionIndex !== -1) {
          subscriptions.splice(subscriptionIndex, 1);
        }
      }
    };
    Subscription.EMPTY = (function(empty) {
      empty.isUnsubscribed = true;
      return empty;
    }(new Subscription()));
    return Subscription;
  }());
  exports.Subscription = Subscription;
  return module.exports;
});

System.registerDynamic("rxjs/Observer.js", [], true, function($__require, exports, module) {
  "use strict";
  ;
  var define,
      global = this,
      GLOBAL = this;
  exports.empty = {
    isUnsubscribed: true,
    next: function(value) {},
    error: function(err) {
      throw err;
    },
    complete: function() {}
  };
  return module.exports;
});

System.registerDynamic("rxjs/Subscriber.js", ["./util/isFunction", "./Subscription", "./symbol/rxSubscriber", "./Observer"], true, function($__require, exports, module) {
  "use strict";
  ;
  var define,
      global = this,
      GLOBAL = this;
  var __extends = (this && this.__extends) || function(d, b) {
    for (var p in b)
      if (b.hasOwnProperty(p))
        d[p] = b[p];
    function __() {
      this.constructor = d;
    }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
  };
  var isFunction_1 = $__require('./util/isFunction');
  var Subscription_1 = $__require('./Subscription');
  var rxSubscriber_1 = $__require('./symbol/rxSubscriber');
  var Observer_1 = $__require('./Observer');
  var Subscriber = (function(_super) {
    __extends(Subscriber, _super);
    function Subscriber(destinationOrNext, error, complete) {
      _super.call(this);
      this.syncErrorValue = null;
      this.syncErrorThrown = false;
      this.syncErrorThrowable = false;
      this.isStopped = false;
      switch (arguments.length) {
        case 0:
          this.destination = Observer_1.empty;
          break;
        case 1:
          if (!destinationOrNext) {
            this.destination = Observer_1.empty;
            break;
          }
          if (typeof destinationOrNext === 'object') {
            if (destinationOrNext instanceof Subscriber) {
              this.destination = destinationOrNext;
              this.destination.add(this);
            } else {
              this.syncErrorThrowable = true;
              this.destination = new SafeSubscriber(this, destinationOrNext);
            }
            break;
          }
        default:
          this.syncErrorThrowable = true;
          this.destination = new SafeSubscriber(this, destinationOrNext, error, complete);
          break;
      }
    }
    Subscriber.create = function(next, error, complete) {
      var subscriber = new Subscriber(next, error, complete);
      subscriber.syncErrorThrowable = false;
      return subscriber;
    };
    Subscriber.prototype.next = function(value) {
      if (!this.isStopped) {
        this._next(value);
      }
    };
    Subscriber.prototype.error = function(err) {
      if (!this.isStopped) {
        this.isStopped = true;
        this._error(err);
      }
    };
    Subscriber.prototype.complete = function() {
      if (!this.isStopped) {
        this.isStopped = true;
        this._complete();
      }
    };
    Subscriber.prototype.unsubscribe = function() {
      if (this.isUnsubscribed) {
        return;
      }
      this.isStopped = true;
      _super.prototype.unsubscribe.call(this);
    };
    Subscriber.prototype._next = function(value) {
      this.destination.next(value);
    };
    Subscriber.prototype._error = function(err) {
      this.destination.error(err);
      this.unsubscribe();
    };
    Subscriber.prototype._complete = function() {
      this.destination.complete();
      this.unsubscribe();
    };
    Subscriber.prototype[rxSubscriber_1.$$rxSubscriber] = function() {
      return this;
    };
    return Subscriber;
  }(Subscription_1.Subscription));
  exports.Subscriber = Subscriber;
  var SafeSubscriber = (function(_super) {
    __extends(SafeSubscriber, _super);
    function SafeSubscriber(_parent, observerOrNext, error, complete) {
      _super.call(this);
      this._parent = _parent;
      var next;
      var context = this;
      if (isFunction_1.isFunction(observerOrNext)) {
        next = observerOrNext;
      } else if (observerOrNext) {
        context = observerOrNext;
        next = observerOrNext.next;
        error = observerOrNext.error;
        complete = observerOrNext.complete;
        if (isFunction_1.isFunction(context.unsubscribe)) {
          this.add(context.unsubscribe.bind(context));
        }
        context.unsubscribe = this.unsubscribe.bind(this);
      }
      this._context = context;
      this._next = next;
      this._error = error;
      this._complete = complete;
    }
    SafeSubscriber.prototype.next = function(value) {
      if (!this.isStopped && this._next) {
        var _parent = this._parent;
        if (!_parent.syncErrorThrowable) {
          this.__tryOrUnsub(this._next, value);
        } else if (this.__tryOrSetError(_parent, this._next, value)) {
          this.unsubscribe();
        }
      }
    };
    SafeSubscriber.prototype.error = function(err) {
      if (!this.isStopped) {
        var _parent = this._parent;
        if (this._error) {
          if (!_parent.syncErrorThrowable) {
            this.__tryOrUnsub(this._error, err);
            this.unsubscribe();
          } else {
            this.__tryOrSetError(_parent, this._error, err);
            this.unsubscribe();
          }
        } else if (!_parent.syncErrorThrowable) {
          this.unsubscribe();
          throw err;
        } else {
          _parent.syncErrorValue = err;
          _parent.syncErrorThrown = true;
          this.unsubscribe();
        }
      }
    };
    SafeSubscriber.prototype.complete = function() {
      if (!this.isStopped) {
        var _parent = this._parent;
        if (this._complete) {
          if (!_parent.syncErrorThrowable) {
            this.__tryOrUnsub(this._complete);
            this.unsubscribe();
          } else {
            this.__tryOrSetError(_parent, this._complete);
            this.unsubscribe();
          }
        } else {
          this.unsubscribe();
        }
      }
    };
    SafeSubscriber.prototype.__tryOrUnsub = function(fn, value) {
      try {
        fn.call(this._context, value);
      } catch (err) {
        this.unsubscribe();
        throw err;
      }
    };
    SafeSubscriber.prototype.__tryOrSetError = function(parent, fn, value) {
      try {
        fn.call(this._context, value);
      } catch (err) {
        parent.syncErrorValue = err;
        parent.syncErrorThrown = true;
        return true;
      }
      return false;
    };
    SafeSubscriber.prototype._unsubscribe = function() {
      var _parent = this._parent;
      this._context = null;
      this._parent = null;
      _parent.unsubscribe();
    };
    return SafeSubscriber;
  }(Subscriber));
  return module.exports;
});

System.registerDynamic("rxjs/util/root.js", [], true, function($__require, exports, module) {
  "use strict";
  ;
  var define,
      global = this,
      GLOBAL = this;
  var objectTypes = {
    'boolean': false,
    'function': true,
    'object': true,
    'number': false,
    'string': false,
    'undefined': false
  };
  exports.root = (objectTypes[typeof self] && self) || (objectTypes[typeof window] && window);
  var freeExports = objectTypes[typeof exports] && exports && !exports.nodeType && exports;
  var freeModule = objectTypes[typeof module] && module && !module.nodeType && module;
  var freeGlobal = objectTypes[typeof global] && global;
  if (freeGlobal && (freeGlobal.global === freeGlobal || freeGlobal.window === freeGlobal)) {
    exports.root = freeGlobal;
  }
  return module.exports;
});

System.registerDynamic("rxjs/symbol/rxSubscriber.js", ["../util/root"], true, function($__require, exports, module) {
  "use strict";
  ;
  var define,
      global = this,
      GLOBAL = this;
  var root_1 = $__require('../util/root');
  var Symbol = root_1.root.Symbol;
  exports.$$rxSubscriber = (typeof Symbol === 'function' && typeof Symbol.for === 'function') ? Symbol.for('rxSubscriber') : '@@rxSubscriber';
  return module.exports;
});

System.registerDynamic("rxjs/util/toSubscriber.js", ["../Subscriber", "../symbol/rxSubscriber"], true, function($__require, exports, module) {
  "use strict";
  ;
  var define,
      global = this,
      GLOBAL = this;
  var Subscriber_1 = $__require('../Subscriber');
  var rxSubscriber_1 = $__require('../symbol/rxSubscriber');
  function toSubscriber(nextOrObserver, error, complete) {
    if (nextOrObserver && typeof nextOrObserver === 'object') {
      if (nextOrObserver instanceof Subscriber_1.Subscriber) {
        return nextOrObserver;
      } else if (typeof nextOrObserver[rxSubscriber_1.$$rxSubscriber] === 'function') {
        return nextOrObserver[rxSubscriber_1.$$rxSubscriber]();
      }
    }
    return new Subscriber_1.Subscriber(nextOrObserver, error, complete);
  }
  exports.toSubscriber = toSubscriber;
  return module.exports;
});

System.registerDynamic("rxjs/Observable.js", ["./util/root", "./symbol/observable", "./util/toSubscriber"], true, function($__require, exports, module) {
  "use strict";
  ;
  var define,
      global = this,
      GLOBAL = this;
  var root_1 = $__require('./util/root');
  var observable_1 = $__require('./symbol/observable');
  var toSubscriber_1 = $__require('./util/toSubscriber');
  var Observable = (function() {
    function Observable(subscribe) {
      this._isScalar = false;
      if (subscribe) {
        this._subscribe = subscribe;
      }
    }
    Observable.prototype.lift = function(operator) {
      var observable = new Observable();
      observable.source = this;
      observable.operator = operator;
      return observable;
    };
    Observable.prototype.subscribe = function(observerOrNext, error, complete) {
      var operator = this.operator;
      var sink = toSubscriber_1.toSubscriber(observerOrNext, error, complete);
      sink.add(operator ? operator.call(sink, this) : this._subscribe(sink));
      if (sink.syncErrorThrowable) {
        sink.syncErrorThrowable = false;
        if (sink.syncErrorThrown) {
          throw sink.syncErrorValue;
        }
      }
      return sink;
    };
    Observable.prototype.forEach = function(next, PromiseCtor) {
      var _this = this;
      if (!PromiseCtor) {
        if (root_1.root.Rx && root_1.root.Rx.config && root_1.root.Rx.config.Promise) {
          PromiseCtor = root_1.root.Rx.config.Promise;
        } else if (root_1.root.Promise) {
          PromiseCtor = root_1.root.Promise;
        }
      }
      if (!PromiseCtor) {
        throw new Error('no Promise impl found');
      }
      return new PromiseCtor(function(resolve, reject) {
        var subscription = _this.subscribe(function(value) {
          if (subscription) {
            try {
              next(value);
            } catch (err) {
              reject(err);
              subscription.unsubscribe();
            }
          } else {
            next(value);
          }
        }, reject, resolve);
      });
    };
    Observable.prototype._subscribe = function(subscriber) {
      return this.source.subscribe(subscriber);
    };
    Observable.prototype[observable_1.$$observable] = function() {
      return this;
    };
    Observable.create = function(subscribe) {
      return new Observable(subscribe);
    };
    return Observable;
  }());
  exports.Observable = Observable;
  return module.exports;
});

System.registerDynamic("@angular/core/src/facade/async.js", ["./lang", "./promise", "rxjs/Subject", "rxjs/observable/PromiseObservable", "rxjs/operator/toPromise", "rxjs/Observable"], true, function($__require, exports, module) {
  "use strict";
  ;
  var define,
      global = this,
      GLOBAL = this;
  var __extends = (this && this.__extends) || function(d, b) {
    for (var p in b)
      if (b.hasOwnProperty(p))
        d[p] = b[p];
    function __() {
      this.constructor = d;
    }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
  };
  var lang_1 = $__require('./lang');
  var promise_1 = $__require('./promise');
  exports.PromiseWrapper = promise_1.PromiseWrapper;
  exports.PromiseCompleter = promise_1.PromiseCompleter;
  var Subject_1 = $__require('rxjs/Subject');
  var PromiseObservable_1 = $__require('rxjs/observable/PromiseObservable');
  var toPromise_1 = $__require('rxjs/operator/toPromise');
  var Observable_1 = $__require('rxjs/Observable');
  exports.Observable = Observable_1.Observable;
  var Subject_2 = $__require('rxjs/Subject');
  exports.Subject = Subject_2.Subject;
  var TimerWrapper = (function() {
    function TimerWrapper() {}
    TimerWrapper.setTimeout = function(fn, millis) {
      return lang_1.global.setTimeout(fn, millis);
    };
    TimerWrapper.clearTimeout = function(id) {
      lang_1.global.clearTimeout(id);
    };
    TimerWrapper.setInterval = function(fn, millis) {
      return lang_1.global.setInterval(fn, millis);
    };
    TimerWrapper.clearInterval = function(id) {
      lang_1.global.clearInterval(id);
    };
    return TimerWrapper;
  }());
  exports.TimerWrapper = TimerWrapper;
  var ObservableWrapper = (function() {
    function ObservableWrapper() {}
    ObservableWrapper.subscribe = function(emitter, onNext, onError, onComplete) {
      if (onComplete === void 0) {
        onComplete = function() {};
      }
      onError = (typeof onError === "function") && onError || lang_1.noop;
      onComplete = (typeof onComplete === "function") && onComplete || lang_1.noop;
      return emitter.subscribe({
        next: onNext,
        error: onError,
        complete: onComplete
      });
    };
    ObservableWrapper.isObservable = function(obs) {
      return !!obs.subscribe;
    };
    ObservableWrapper.hasSubscribers = function(obs) {
      return obs.observers.length > 0;
    };
    ObservableWrapper.dispose = function(subscription) {
      subscription.unsubscribe();
    };
    ObservableWrapper.callNext = function(emitter, value) {
      emitter.next(value);
    };
    ObservableWrapper.callEmit = function(emitter, value) {
      emitter.emit(value);
    };
    ObservableWrapper.callError = function(emitter, error) {
      emitter.error(error);
    };
    ObservableWrapper.callComplete = function(emitter) {
      emitter.complete();
    };
    ObservableWrapper.fromPromise = function(promise) {
      return PromiseObservable_1.PromiseObservable.create(promise);
    };
    ObservableWrapper.toPromise = function(obj) {
      return toPromise_1.toPromise.call(obj);
    };
    return ObservableWrapper;
  }());
  exports.ObservableWrapper = ObservableWrapper;
  var EventEmitter = (function(_super) {
    __extends(EventEmitter, _super);
    function EventEmitter(isAsync) {
      if (isAsync === void 0) {
        isAsync = true;
      }
      _super.call(this);
      this._isAsync = isAsync;
    }
    EventEmitter.prototype.emit = function(value) {
      _super.prototype.next.call(this, value);
    };
    EventEmitter.prototype.next = function(value) {
      _super.prototype.next.call(this, value);
    };
    EventEmitter.prototype.subscribe = function(generatorOrNext, error, complete) {
      var schedulerFn;
      var errorFn = function(err) {
        return null;
      };
      var completeFn = function() {
        return null;
      };
      if (generatorOrNext && typeof generatorOrNext === 'object') {
        schedulerFn = this._isAsync ? function(value) {
          setTimeout(function() {
            return generatorOrNext.next(value);
          });
        } : function(value) {
          generatorOrNext.next(value);
        };
        if (generatorOrNext.error) {
          errorFn = this._isAsync ? function(err) {
            setTimeout(function() {
              return generatorOrNext.error(err);
            });
          } : function(err) {
            generatorOrNext.error(err);
          };
        }
        if (generatorOrNext.complete) {
          completeFn = this._isAsync ? function() {
            setTimeout(function() {
              return generatorOrNext.complete();
            });
          } : function() {
            generatorOrNext.complete();
          };
        }
      } else {
        schedulerFn = this._isAsync ? function(value) {
          setTimeout(function() {
            return generatorOrNext(value);
          });
        } : function(value) {
          generatorOrNext(value);
        };
        if (error) {
          errorFn = this._isAsync ? function(err) {
            setTimeout(function() {
              return error(err);
            });
          } : function(err) {
            error(err);
          };
        }
        if (complete) {
          completeFn = this._isAsync ? function() {
            setTimeout(function() {
              return complete();
            });
          } : function() {
            complete();
          };
        }
      }
      return _super.prototype.subscribe.call(this, schedulerFn, errorFn, completeFn);
    };
    return EventEmitter;
  }(Subject_1.Subject));
  exports.EventEmitter = EventEmitter;
  return module.exports;
});

System.registerDynamic("@angular/core/src/linker/view_ref.js", ["../../src/facade/exceptions", "../change_detection/constants"], true, function($__require, exports, module) {
  "use strict";
  ;
  var define,
      global = this,
      GLOBAL = this;
  var __extends = (this && this.__extends) || function(d, b) {
    for (var p in b)
      if (b.hasOwnProperty(p))
        d[p] = b[p];
    function __() {
      this.constructor = d;
    }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
  };
  var exceptions_1 = $__require('../../src/facade/exceptions');
  var constants_1 = $__require('../change_detection/constants');
  var ViewRef = (function() {
    function ViewRef() {}
    Object.defineProperty(ViewRef.prototype, "destroyed", {
      get: function() {
        return exceptions_1.unimplemented();
      },
      enumerable: true,
      configurable: true
    });
    return ViewRef;
  }());
  exports.ViewRef = ViewRef;
  var EmbeddedViewRef = (function(_super) {
    __extends(EmbeddedViewRef, _super);
    function EmbeddedViewRef() {
      _super.apply(this, arguments);
    }
    Object.defineProperty(EmbeddedViewRef.prototype, "context", {
      get: function() {
        return exceptions_1.unimplemented();
      },
      enumerable: true,
      configurable: true
    });
    Object.defineProperty(EmbeddedViewRef.prototype, "rootNodes", {
      get: function() {
        return exceptions_1.unimplemented();
      },
      enumerable: true,
      configurable: true
    });
    ;
    return EmbeddedViewRef;
  }(ViewRef));
  exports.EmbeddedViewRef = EmbeddedViewRef;
  var ViewRef_ = (function() {
    function ViewRef_(_view) {
      this._view = _view;
      this._view = _view;
    }
    Object.defineProperty(ViewRef_.prototype, "internalView", {
      get: function() {
        return this._view;
      },
      enumerable: true,
      configurable: true
    });
    Object.defineProperty(ViewRef_.prototype, "rootNodes", {
      get: function() {
        return this._view.flatRootNodes;
      },
      enumerable: true,
      configurable: true
    });
    Object.defineProperty(ViewRef_.prototype, "context", {
      get: function() {
        return this._view.context;
      },
      enumerable: true,
      configurable: true
    });
    Object.defineProperty(ViewRef_.prototype, "destroyed", {
      get: function() {
        return this._view.destroyed;
      },
      enumerable: true,
      configurable: true
    });
    ViewRef_.prototype.markForCheck = function() {
      this._view.markPathToRootAsCheckOnce();
    };
    ViewRef_.prototype.detach = function() {
      this._view.cdMode = constants_1.ChangeDetectionStrategy.Detached;
    };
    ViewRef_.prototype.detectChanges = function() {
      this._view.detectChanges(false);
    };
    ViewRef_.prototype.checkNoChanges = function() {
      this._view.detectChanges(true);
    };
    ViewRef_.prototype.reattach = function() {
      this._view.cdMode = constants_1.ChangeDetectionStrategy.CheckAlways;
      this.markForCheck();
    };
    ViewRef_.prototype.onDestroy = function(callback) {
      this._view.disposables.push(callback);
    };
    ViewRef_.prototype.destroy = function() {
      this._view.destroy();
    };
    return ViewRef_;
  }());
  exports.ViewRef_ = ViewRef_;
  return module.exports;
});

System.registerDynamic("@angular/core/src/linker/element_injector.js", ["../di/injector"], true, function($__require, exports, module) {
  "use strict";
  ;
  var define,
      global = this,
      GLOBAL = this;
  var __extends = (this && this.__extends) || function(d, b) {
    for (var p in b)
      if (b.hasOwnProperty(p))
        d[p] = b[p];
    function __() {
      this.constructor = d;
    }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
  };
  var injector_1 = $__require('../di/injector');
  var _UNDEFINED = new Object();
  var ElementInjector = (function(_super) {
    __extends(ElementInjector, _super);
    function ElementInjector(_view, _nodeIndex) {
      _super.call(this);
      this._view = _view;
      this._nodeIndex = _nodeIndex;
    }
    ElementInjector.prototype.get = function(token, notFoundValue) {
      if (notFoundValue === void 0) {
        notFoundValue = injector_1.THROW_IF_NOT_FOUND;
      }
      var result = _UNDEFINED;
      if (result === _UNDEFINED) {
        result = this._view.injectorGet(token, this._nodeIndex, _UNDEFINED);
      }
      if (result === _UNDEFINED) {
        result = this._view.parentInjector.get(token, notFoundValue);
      }
      return result;
    };
    return ElementInjector;
  }(injector_1.Injector));
  exports.ElementInjector = ElementInjector;
  return module.exports;
});

System.registerDynamic("@angular/core/src/linker/view.js", ["../../src/facade/collection", "./element", "../../src/facade/lang", "../../src/facade/async", "./view_ref", "./view_type", "./view_utils", "../change_detection/change_detection", "../profile/profile", "./exceptions", "./debug_context", "./element_injector"], true, function($__require, exports, module) {
  "use strict";
  ;
  var define,
      global = this,
      GLOBAL = this;
  var __extends = (this && this.__extends) || function(d, b) {
    for (var p in b)
      if (b.hasOwnProperty(p))
        d[p] = b[p];
    function __() {
      this.constructor = d;
    }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
  };
  var collection_1 = $__require('../../src/facade/collection');
  var element_1 = $__require('./element');
  var lang_1 = $__require('../../src/facade/lang');
  var async_1 = $__require('../../src/facade/async');
  var view_ref_1 = $__require('./view_ref');
  var view_type_1 = $__require('./view_type');
  var view_utils_1 = $__require('./view_utils');
  var change_detection_1 = $__require('../change_detection/change_detection');
  var profile_1 = $__require('../profile/profile');
  var exceptions_1 = $__require('./exceptions');
  var debug_context_1 = $__require('./debug_context');
  var element_injector_1 = $__require('./element_injector');
  var _scope_check = profile_1.wtfCreateScope("AppView#check(ascii id)");
  var AppView = (function() {
    function AppView(clazz, componentType, type, viewUtils, parentInjector, declarationAppElement, cdMode) {
      this.clazz = clazz;
      this.componentType = componentType;
      this.type = type;
      this.viewUtils = viewUtils;
      this.parentInjector = parentInjector;
      this.declarationAppElement = declarationAppElement;
      this.cdMode = cdMode;
      this.contentChildren = [];
      this.viewChildren = [];
      this.viewContainerElement = null;
      this.cdState = change_detection_1.ChangeDetectorState.NeverChecked;
      this.destroyed = false;
      this.ref = new view_ref_1.ViewRef_(this);
      if (type === view_type_1.ViewType.COMPONENT || type === view_type_1.ViewType.HOST) {
        this.renderer = viewUtils.renderComponent(componentType);
      } else {
        this.renderer = declarationAppElement.parentView.renderer;
      }
    }
    AppView.prototype.create = function(context, givenProjectableNodes, rootSelectorOrNode) {
      this.context = context;
      var projectableNodes;
      switch (this.type) {
        case view_type_1.ViewType.COMPONENT:
          projectableNodes = view_utils_1.ensureSlotCount(givenProjectableNodes, this.componentType.slotCount);
          break;
        case view_type_1.ViewType.EMBEDDED:
          projectableNodes = this.declarationAppElement.parentView.projectableNodes;
          break;
        case view_type_1.ViewType.HOST:
          projectableNodes = givenProjectableNodes;
          break;
      }
      this._hasExternalHostElement = lang_1.isPresent(rootSelectorOrNode);
      this.projectableNodes = projectableNodes;
      return this.createInternal(rootSelectorOrNode);
    };
    AppView.prototype.createInternal = function(rootSelectorOrNode) {
      return null;
    };
    AppView.prototype.init = function(rootNodesOrAppElements, allNodes, disposables, subscriptions) {
      this.rootNodesOrAppElements = rootNodesOrAppElements;
      this.allNodes = allNodes;
      this.disposables = disposables;
      this.subscriptions = subscriptions;
      if (this.type === view_type_1.ViewType.COMPONENT) {
        this.declarationAppElement.parentView.viewChildren.push(this);
        this.dirtyParentQueriesInternal();
      }
    };
    AppView.prototype.selectOrCreateHostElement = function(elementName, rootSelectorOrNode, debugInfo) {
      var hostElement;
      if (lang_1.isPresent(rootSelectorOrNode)) {
        hostElement = this.renderer.selectRootElement(rootSelectorOrNode, debugInfo);
      } else {
        hostElement = this.renderer.createElement(null, elementName, debugInfo);
      }
      return hostElement;
    };
    AppView.prototype.injectorGet = function(token, nodeIndex, notFoundResult) {
      return this.injectorGetInternal(token, nodeIndex, notFoundResult);
    };
    AppView.prototype.injectorGetInternal = function(token, nodeIndex, notFoundResult) {
      return notFoundResult;
    };
    AppView.prototype.injector = function(nodeIndex) {
      if (lang_1.isPresent(nodeIndex)) {
        return new element_injector_1.ElementInjector(this, nodeIndex);
      } else {
        return this.parentInjector;
      }
    };
    AppView.prototype.destroy = function() {
      if (this._hasExternalHostElement) {
        this.renderer.detachView(this.flatRootNodes);
      } else if (lang_1.isPresent(this.viewContainerElement)) {
        this.viewContainerElement.detachView(this.viewContainerElement.nestedViews.indexOf(this));
      }
      this._destroyRecurse();
    };
    AppView.prototype._destroyRecurse = function() {
      if (this.destroyed) {
        return;
      }
      var children = this.contentChildren;
      for (var i = 0; i < children.length; i++) {
        children[i]._destroyRecurse();
      }
      children = this.viewChildren;
      for (var i = 0; i < children.length; i++) {
        children[i]._destroyRecurse();
      }
      this.destroyLocal();
      this.destroyed = true;
    };
    AppView.prototype.destroyLocal = function() {
      var hostElement = this.type === view_type_1.ViewType.COMPONENT ? this.declarationAppElement.nativeElement : null;
      for (var i = 0; i < this.disposables.length; i++) {
        this.disposables[i]();
      }
      for (var i = 0; i < this.subscriptions.length; i++) {
        async_1.ObservableWrapper.dispose(this.subscriptions[i]);
      }
      this.destroyInternal();
      if (this._hasExternalHostElement) {
        this.renderer.detachView(this.flatRootNodes);
      } else if (lang_1.isPresent(this.viewContainerElement)) {
        this.viewContainerElement.detachView(this.viewContainerElement.nestedViews.indexOf(this));
      } else {
        this.dirtyParentQueriesInternal();
      }
      this.renderer.destroyView(hostElement, this.allNodes);
    };
    AppView.prototype.destroyInternal = function() {};
    Object.defineProperty(AppView.prototype, "changeDetectorRef", {
      get: function() {
        return this.ref;
      },
      enumerable: true,
      configurable: true
    });
    Object.defineProperty(AppView.prototype, "parent", {
      get: function() {
        return lang_1.isPresent(this.declarationAppElement) ? this.declarationAppElement.parentView : null;
      },
      enumerable: true,
      configurable: true
    });
    Object.defineProperty(AppView.prototype, "flatRootNodes", {
      get: function() {
        return view_utils_1.flattenNestedViewRenderNodes(this.rootNodesOrAppElements);
      },
      enumerable: true,
      configurable: true
    });
    Object.defineProperty(AppView.prototype, "lastRootNode", {
      get: function() {
        var lastNode = this.rootNodesOrAppElements.length > 0 ? this.rootNodesOrAppElements[this.rootNodesOrAppElements.length - 1] : null;
        return _findLastRenderNode(lastNode);
      },
      enumerable: true,
      configurable: true
    });
    AppView.prototype.dirtyParentQueriesInternal = function() {};
    AppView.prototype.detectChanges = function(throwOnChange) {
      var s = _scope_check(this.clazz);
      if (this.cdMode === change_detection_1.ChangeDetectionStrategy.Detached || this.cdMode === change_detection_1.ChangeDetectionStrategy.Checked || this.cdState === change_detection_1.ChangeDetectorState.Errored)
        return;
      if (this.destroyed) {
        this.throwDestroyedError('detectChanges');
      }
      this.detectChangesInternal(throwOnChange);
      if (this.cdMode === change_detection_1.ChangeDetectionStrategy.CheckOnce)
        this.cdMode = change_detection_1.ChangeDetectionStrategy.Checked;
      this.cdState = change_detection_1.ChangeDetectorState.CheckedBefore;
      profile_1.wtfLeave(s);
    };
    AppView.prototype.detectChangesInternal = function(throwOnChange) {
      this.detectContentChildrenChanges(throwOnChange);
      this.detectViewChildrenChanges(throwOnChange);
    };
    AppView.prototype.detectContentChildrenChanges = function(throwOnChange) {
      for (var i = 0; i < this.contentChildren.length; ++i) {
        this.contentChildren[i].detectChanges(throwOnChange);
      }
    };
    AppView.prototype.detectViewChildrenChanges = function(throwOnChange) {
      for (var i = 0; i < this.viewChildren.length; ++i) {
        this.viewChildren[i].detectChanges(throwOnChange);
      }
    };
    AppView.prototype.addToContentChildren = function(renderAppElement) {
      renderAppElement.parentView.contentChildren.push(this);
      this.viewContainerElement = renderAppElement;
      this.dirtyParentQueriesInternal();
    };
    AppView.prototype.removeFromContentChildren = function(renderAppElement) {
      collection_1.ListWrapper.remove(renderAppElement.parentView.contentChildren, this);
      this.dirtyParentQueriesInternal();
      this.viewContainerElement = null;
    };
    AppView.prototype.markAsCheckOnce = function() {
      this.cdMode = change_detection_1.ChangeDetectionStrategy.CheckOnce;
    };
    AppView.prototype.markPathToRootAsCheckOnce = function() {
      var c = this;
      while (lang_1.isPresent(c) && c.cdMode !== change_detection_1.ChangeDetectionStrategy.Detached) {
        if (c.cdMode === change_detection_1.ChangeDetectionStrategy.Checked) {
          c.cdMode = change_detection_1.ChangeDetectionStrategy.CheckOnce;
        }
        var parentEl = c.type === view_type_1.ViewType.COMPONENT ? c.declarationAppElement : c.viewContainerElement;
        c = lang_1.isPresent(parentEl) ? parentEl.parentView : null;
      }
    };
    AppView.prototype.eventHandler = function(cb) {
      return cb;
    };
    AppView.prototype.throwDestroyedError = function(details) {
      throw new exceptions_1.ViewDestroyedException(details);
    };
    return AppView;
  }());
  exports.AppView = AppView;
  var DebugAppView = (function(_super) {
    __extends(DebugAppView, _super);
    function DebugAppView(clazz, componentType, type, viewUtils, parentInjector, declarationAppElement, cdMode, staticNodeDebugInfos) {
      _super.call(this, clazz, componentType, type, viewUtils, parentInjector, declarationAppElement, cdMode);
      this.staticNodeDebugInfos = staticNodeDebugInfos;
      this._currentDebugContext = null;
    }
    DebugAppView.prototype.create = function(context, givenProjectableNodes, rootSelectorOrNode) {
      this._resetDebug();
      try {
        return _super.prototype.create.call(this, context, givenProjectableNodes, rootSelectorOrNode);
      } catch (e) {
        this._rethrowWithContext(e, e.stack);
        throw e;
      }
    };
    DebugAppView.prototype.injectorGet = function(token, nodeIndex, notFoundResult) {
      this._resetDebug();
      try {
        return _super.prototype.injectorGet.call(this, token, nodeIndex, notFoundResult);
      } catch (e) {
        this._rethrowWithContext(e, e.stack);
        throw e;
      }
    };
    DebugAppView.prototype.destroyLocal = function() {
      this._resetDebug();
      try {
        _super.prototype.destroyLocal.call(this);
      } catch (e) {
        this._rethrowWithContext(e, e.stack);
        throw e;
      }
    };
    DebugAppView.prototype.detectChanges = function(throwOnChange) {
      this._resetDebug();
      try {
        _super.prototype.detectChanges.call(this, throwOnChange);
      } catch (e) {
        this._rethrowWithContext(e, e.stack);
        throw e;
      }
    };
    DebugAppView.prototype._resetDebug = function() {
      this._currentDebugContext = null;
    };
    DebugAppView.prototype.debug = function(nodeIndex, rowNum, colNum) {
      return this._currentDebugContext = new debug_context_1.DebugContext(this, nodeIndex, rowNum, colNum);
    };
    DebugAppView.prototype._rethrowWithContext = function(e, stack) {
      if (!(e instanceof exceptions_1.ViewWrappedException)) {
        if (!(e instanceof exceptions_1.ExpressionChangedAfterItHasBeenCheckedException)) {
          this.cdState = change_detection_1.ChangeDetectorState.Errored;
        }
        if (lang_1.isPresent(this._currentDebugContext)) {
          throw new exceptions_1.ViewWrappedException(e, stack, this._currentDebugContext);
        }
      }
    };
    DebugAppView.prototype.eventHandler = function(cb) {
      var _this = this;
      var superHandler = _super.prototype.eventHandler.call(this, cb);
      return function(event) {
        _this._resetDebug();
        try {
          return superHandler(event);
        } catch (e) {
          _this._rethrowWithContext(e, e.stack);
          throw e;
        }
      };
    };
    return DebugAppView;
  }(AppView));
  exports.DebugAppView = DebugAppView;
  function _findLastRenderNode(node) {
    var lastNode;
    if (node instanceof element_1.AppElement) {
      var appEl = node;
      lastNode = appEl.nativeElement;
      if (lang_1.isPresent(appEl.nestedViews)) {
        for (var i = appEl.nestedViews.length - 1; i >= 0; i--) {
          var nestedView = appEl.nestedViews[i];
          if (nestedView.rootNodesOrAppElements.length > 0) {
            lastNode = _findLastRenderNode(nestedView.rootNodesOrAppElements[nestedView.rootNodesOrAppElements.length - 1]);
          }
        }
      }
    } else {
      lastNode = node;
    }
    return lastNode;
  }
  return module.exports;
});

System.registerDynamic("@angular/core/src/security.js", [], true, function($__require, exports, module) {
  "use strict";
  ;
  var define,
      global = this,
      GLOBAL = this;
  (function(SecurityContext) {
    SecurityContext[SecurityContext["NONE"] = 0] = "NONE";
    SecurityContext[SecurityContext["HTML"] = 1] = "HTML";
    SecurityContext[SecurityContext["STYLE"] = 2] = "STYLE";
    SecurityContext[SecurityContext["SCRIPT"] = 3] = "SCRIPT";
    SecurityContext[SecurityContext["URL"] = 4] = "URL";
    SecurityContext[SecurityContext["RESOURCE_URL"] = 5] = "RESOURCE_URL";
  })(exports.SecurityContext || (exports.SecurityContext = {}));
  var SecurityContext = exports.SecurityContext;
  var SanitizationService = (function() {
    function SanitizationService() {}
    return SanitizationService;
  }());
  exports.SanitizationService = SanitizationService;
  return module.exports;
});

System.registerDynamic("@angular/core/src/linker/element_ref.js", [], true, function($__require, exports, module) {
  "use strict";
  ;
  var define,
      global = this,
      GLOBAL = this;
  var ElementRef = (function() {
    function ElementRef(nativeElement) {
      this.nativeElement = nativeElement;
    }
    return ElementRef;
  }());
  exports.ElementRef = ElementRef;
  return module.exports;
});

System.registerDynamic("@angular/core/src/profile/wtf_impl.js", ["../../src/facade/lang"], true, function($__require, exports, module) {
  "use strict";
  ;
  var define,
      global = this,
      GLOBAL = this;
  var lang_1 = $__require('../../src/facade/lang');
  var trace;
  var events;
  function detectWTF() {
    var wtf = lang_1.global['wtf'];
    if (wtf) {
      trace = wtf['trace'];
      if (trace) {
        events = trace['events'];
        return true;
      }
    }
    return false;
  }
  exports.detectWTF = detectWTF;
  function createScope(signature, flags) {
    if (flags === void 0) {
      flags = null;
    }
    return events.createScope(signature, flags);
  }
  exports.createScope = createScope;
  function leave(scope, returnValue) {
    trace.leaveScope(scope, returnValue);
    return returnValue;
  }
  exports.leave = leave;
  function startTimeRange(rangeType, action) {
    return trace.beginTimeRange(rangeType, action);
  }
  exports.startTimeRange = startTimeRange;
  function endTimeRange(range) {
    trace.endTimeRange(range);
  }
  exports.endTimeRange = endTimeRange;
  return module.exports;
});

System.registerDynamic("@angular/core/src/profile/profile.js", ["./wtf_impl"], true, function($__require, exports, module) {
  "use strict";
  ;
  var define,
      global = this,
      GLOBAL = this;
  var impl = $__require('./wtf_impl');
  exports.wtfEnabled = impl.detectWTF();
  function noopScope(arg0, arg1) {
    return null;
  }
  exports.wtfCreateScope = exports.wtfEnabled ? impl.createScope : function(signature, flags) {
    return noopScope;
  };
  exports.wtfLeave = exports.wtfEnabled ? impl.leave : function(s, r) {
    return r;
  };
  exports.wtfStartTimeRange = exports.wtfEnabled ? impl.startTimeRange : function(rangeType, action) {
    return null;
  };
  exports.wtfEndTimeRange = exports.wtfEnabled ? impl.endTimeRange : function(r) {
    return null;
  };
  return module.exports;
});

System.registerDynamic("@angular/core/src/linker/view_container_ref.js", ["../../src/facade/collection", "../../src/facade/exceptions", "../../src/facade/lang", "../profile/profile"], true, function($__require, exports, module) {
  "use strict";
  ;
  var define,
      global = this,
      GLOBAL = this;
  var collection_1 = $__require('../../src/facade/collection');
  var exceptions_1 = $__require('../../src/facade/exceptions');
  var lang_1 = $__require('../../src/facade/lang');
  var profile_1 = $__require('../profile/profile');
  var ViewContainerRef = (function() {
    function ViewContainerRef() {}
    Object.defineProperty(ViewContainerRef.prototype, "element", {
      get: function() {
        return exceptions_1.unimplemented();
      },
      enumerable: true,
      configurable: true
    });
    Object.defineProperty(ViewContainerRef.prototype, "injector", {
      get: function() {
        return exceptions_1.unimplemented();
      },
      enumerable: true,
      configurable: true
    });
    Object.defineProperty(ViewContainerRef.prototype, "parentInjector", {
      get: function() {
        return exceptions_1.unimplemented();
      },
      enumerable: true,
      configurable: true
    });
    Object.defineProperty(ViewContainerRef.prototype, "length", {
      get: function() {
        return exceptions_1.unimplemented();
      },
      enumerable: true,
      configurable: true
    });
    ;
    return ViewContainerRef;
  }());
  exports.ViewContainerRef = ViewContainerRef;
  var ViewContainerRef_ = (function() {
    function ViewContainerRef_(_element) {
      this._element = _element;
      this._createComponentInContainerScope = profile_1.wtfCreateScope('ViewContainerRef#createComponent()');
      this._insertScope = profile_1.wtfCreateScope('ViewContainerRef#insert()');
      this._removeScope = profile_1.wtfCreateScope('ViewContainerRef#remove()');
      this._detachScope = profile_1.wtfCreateScope('ViewContainerRef#detach()');
    }
    ViewContainerRef_.prototype.get = function(index) {
      return this._element.nestedViews[index].ref;
    };
    Object.defineProperty(ViewContainerRef_.prototype, "length", {
      get: function() {
        var views = this._element.nestedViews;
        return lang_1.isPresent(views) ? views.length : 0;
      },
      enumerable: true,
      configurable: true
    });
    Object.defineProperty(ViewContainerRef_.prototype, "element", {
      get: function() {
        return this._element.elementRef;
      },
      enumerable: true,
      configurable: true
    });
    Object.defineProperty(ViewContainerRef_.prototype, "injector", {
      get: function() {
        return this._element.injector;
      },
      enumerable: true,
      configurable: true
    });
    Object.defineProperty(ViewContainerRef_.prototype, "parentInjector", {
      get: function() {
        return this._element.parentInjector;
      },
      enumerable: true,
      configurable: true
    });
    ViewContainerRef_.prototype.createEmbeddedView = function(templateRef, context, index) {
      if (context === void 0) {
        context = null;
      }
      if (index === void 0) {
        index = -1;
      }
      var viewRef = templateRef.createEmbeddedView(context);
      this.insert(viewRef, index);
      return viewRef;
    };
    ViewContainerRef_.prototype.createComponent = function(componentFactory, index, injector, projectableNodes) {
      if (index === void 0) {
        index = -1;
      }
      if (injector === void 0) {
        injector = null;
      }
      if (projectableNodes === void 0) {
        projectableNodes = null;
      }
      var s = this._createComponentInContainerScope();
      var contextInjector = lang_1.isPresent(injector) ? injector : this._element.parentInjector;
      var componentRef = componentFactory.create(contextInjector, projectableNodes);
      this.insert(componentRef.hostView, index);
      return profile_1.wtfLeave(s, componentRef);
    };
    ViewContainerRef_.prototype.insert = function(viewRef, index) {
      if (index === void 0) {
        index = -1;
      }
      var s = this._insertScope();
      if (index == -1)
        index = this.length;
      var viewRef_ = viewRef;
      this._element.attachView(viewRef_.internalView, index);
      return profile_1.wtfLeave(s, viewRef_);
    };
    ViewContainerRef_.prototype.indexOf = function(viewRef) {
      return collection_1.ListWrapper.indexOf(this._element.nestedViews, viewRef.internalView);
    };
    ViewContainerRef_.prototype.remove = function(index) {
      if (index === void 0) {
        index = -1;
      }
      var s = this._removeScope();
      if (index == -1)
        index = this.length - 1;
      var view = this._element.detachView(index);
      view.destroy();
      profile_1.wtfLeave(s);
    };
    ViewContainerRef_.prototype.detach = function(index) {
      if (index === void 0) {
        index = -1;
      }
      var s = this._detachScope();
      if (index == -1)
        index = this.length - 1;
      var view = this._element.detachView(index);
      return profile_1.wtfLeave(s, view.ref);
    };
    ViewContainerRef_.prototype.clear = function() {
      for (var i = this.length - 1; i >= 0; i--) {
        this.remove(i);
      }
    };
    return ViewContainerRef_;
  }());
  exports.ViewContainerRef_ = ViewContainerRef_;
  return module.exports;
});

System.registerDynamic("@angular/core/src/linker/element.js", ["../../src/facade/lang", "../../src/facade/collection", "../../src/facade/exceptions", "./view_type", "./element_ref", "./view_container_ref"], true, function($__require, exports, module) {
  "use strict";
  ;
  var define,
      global = this,
      GLOBAL = this;
  var lang_1 = $__require('../../src/facade/lang');
  var collection_1 = $__require('../../src/facade/collection');
  var exceptions_1 = $__require('../../src/facade/exceptions');
  var view_type_1 = $__require('./view_type');
  var element_ref_1 = $__require('./element_ref');
  var view_container_ref_1 = $__require('./view_container_ref');
  var AppElement = (function() {
    function AppElement(index, parentIndex, parentView, nativeElement) {
      this.index = index;
      this.parentIndex = parentIndex;
      this.parentView = parentView;
      this.nativeElement = nativeElement;
      this.nestedViews = null;
      this.componentView = null;
    }
    Object.defineProperty(AppElement.prototype, "elementRef", {
      get: function() {
        return new element_ref_1.ElementRef(this.nativeElement);
      },
      enumerable: true,
      configurable: true
    });
    Object.defineProperty(AppElement.prototype, "vcRef", {
      get: function() {
        return new view_container_ref_1.ViewContainerRef_(this);
      },
      enumerable: true,
      configurable: true
    });
    AppElement.prototype.initComponent = function(component, componentConstructorViewQueries, view) {
      this.component = component;
      this.componentConstructorViewQueries = componentConstructorViewQueries;
      this.componentView = view;
    };
    Object.defineProperty(AppElement.prototype, "parentInjector", {
      get: function() {
        return this.parentView.injector(this.parentIndex);
      },
      enumerable: true,
      configurable: true
    });
    Object.defineProperty(AppElement.prototype, "injector", {
      get: function() {
        return this.parentView.injector(this.index);
      },
      enumerable: true,
      configurable: true
    });
    AppElement.prototype.mapNestedViews = function(nestedViewClass, callback) {
      var result = [];
      if (lang_1.isPresent(this.nestedViews)) {
        this.nestedViews.forEach(function(nestedView) {
          if (nestedView.clazz === nestedViewClass) {
            result.push(callback(nestedView));
          }
        });
      }
      return result;
    };
    AppElement.prototype.attachView = function(view, viewIndex) {
      if (view.type === view_type_1.ViewType.COMPONENT) {
        throw new exceptions_1.BaseException("Component views can't be moved!");
      }
      var nestedViews = this.nestedViews;
      if (nestedViews == null) {
        nestedViews = [];
        this.nestedViews = nestedViews;
      }
      collection_1.ListWrapper.insert(nestedViews, viewIndex, view);
      var refRenderNode;
      if (viewIndex > 0) {
        var prevView = nestedViews[viewIndex - 1];
        refRenderNode = prevView.lastRootNode;
      } else {
        refRenderNode = this.nativeElement;
      }
      if (lang_1.isPresent(refRenderNode)) {
        view.renderer.attachViewAfter(refRenderNode, view.flatRootNodes);
      }
      view.addToContentChildren(this);
    };
    AppElement.prototype.detachView = function(viewIndex) {
      var view = collection_1.ListWrapper.removeAt(this.nestedViews, viewIndex);
      if (view.type === view_type_1.ViewType.COMPONENT) {
        throw new exceptions_1.BaseException("Component views can't be moved!");
      }
      view.renderer.detachView(view.flatRootNodes);
      view.removeFromContentChildren(this);
      return view;
    };
    return AppElement;
  }());
  exports.AppElement = AppElement;
  return module.exports;
});

System.registerDynamic("@angular/core/src/linker/exceptions.js", ["../../src/facade/exceptions"], true, function($__require, exports, module) {
  "use strict";
  ;
  var define,
      global = this,
      GLOBAL = this;
  var __extends = (this && this.__extends) || function(d, b) {
    for (var p in b)
      if (b.hasOwnProperty(p))
        d[p] = b[p];
    function __() {
      this.constructor = d;
    }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
  };
  var exceptions_1 = $__require('../../src/facade/exceptions');
  var ExpressionChangedAfterItHasBeenCheckedException = (function(_super) {
    __extends(ExpressionChangedAfterItHasBeenCheckedException, _super);
    function ExpressionChangedAfterItHasBeenCheckedException(oldValue, currValue, context) {
      _super.call(this, "Expression has changed after it was checked. " + ("Previous value: '" + oldValue + "'. Current value: '" + currValue + "'"));
    }
    return ExpressionChangedAfterItHasBeenCheckedException;
  }(exceptions_1.BaseException));
  exports.ExpressionChangedAfterItHasBeenCheckedException = ExpressionChangedAfterItHasBeenCheckedException;
  var ViewWrappedException = (function(_super) {
    __extends(ViewWrappedException, _super);
    function ViewWrappedException(originalException, originalStack, context) {
      _super.call(this, "Error in " + context.source, originalException, originalStack, context);
    }
    return ViewWrappedException;
  }(exceptions_1.WrappedException));
  exports.ViewWrappedException = ViewWrappedException;
  var ViewDestroyedException = (function(_super) {
    __extends(ViewDestroyedException, _super);
    function ViewDestroyedException(details) {
      _super.call(this, "Attempt to use a destroyed view: " + details);
    }
    return ViewDestroyedException;
  }(exceptions_1.BaseException));
  exports.ViewDestroyedException = ViewDestroyedException;
  return module.exports;
});

System.registerDynamic("@angular/core/src/change_detection/differs/iterable_differs.js", ["../../../src/facade/lang", "../../../src/facade/exceptions", "../../../src/facade/collection", "../../di"], true, function($__require, exports, module) {
  "use strict";
  ;
  var define,
      global = this,
      GLOBAL = this;
  var lang_1 = $__require('../../../src/facade/lang');
  var exceptions_1 = $__require('../../../src/facade/exceptions');
  var collection_1 = $__require('../../../src/facade/collection');
  var di_1 = $__require('../../di');
  var IterableDiffers = (function() {
    function IterableDiffers(factories) {
      this.factories = factories;
    }
    IterableDiffers.create = function(factories, parent) {
      if (lang_1.isPresent(parent)) {
        var copied = collection_1.ListWrapper.clone(parent.factories);
        factories = factories.concat(copied);
        return new IterableDiffers(factories);
      } else {
        return new IterableDiffers(factories);
      }
    };
    IterableDiffers.extend = function(factories) {
      return new di_1.Provider(IterableDiffers, {
        useFactory: function(parent) {
          if (lang_1.isBlank(parent)) {
            throw new exceptions_1.BaseException('Cannot extend IterableDiffers without a parent injector');
          }
          return IterableDiffers.create(factories, parent);
        },
        deps: [[IterableDiffers, new di_1.SkipSelfMetadata(), new di_1.OptionalMetadata()]]
      });
    };
    IterableDiffers.prototype.find = function(iterable) {
      var factory = this.factories.find(function(f) {
        return f.supports(iterable);
      });
      if (lang_1.isPresent(factory)) {
        return factory;
      } else {
        throw new exceptions_1.BaseException("Cannot find a differ supporting object '" + iterable + "' of type '" + lang_1.getTypeNameForDebugging(iterable) + "'");
      }
    };
    return IterableDiffers;
  }());
  exports.IterableDiffers = IterableDiffers;
  return module.exports;
});

System.registerDynamic("@angular/core/src/change_detection/differs/default_iterable_differ.js", ["../../../src/facade/exceptions", "../../../src/facade/collection", "../../../src/facade/lang"], true, function($__require, exports, module) {
  "use strict";
  ;
  var define,
      global = this,
      GLOBAL = this;
  var exceptions_1 = $__require('../../../src/facade/exceptions');
  var collection_1 = $__require('../../../src/facade/collection');
  var lang_1 = $__require('../../../src/facade/lang');
  var DefaultIterableDifferFactory = (function() {
    function DefaultIterableDifferFactory() {}
    DefaultIterableDifferFactory.prototype.supports = function(obj) {
      return collection_1.isListLikeIterable(obj);
    };
    DefaultIterableDifferFactory.prototype.create = function(cdRef, trackByFn) {
      return new DefaultIterableDiffer(trackByFn);
    };
    return DefaultIterableDifferFactory;
  }());
  exports.DefaultIterableDifferFactory = DefaultIterableDifferFactory;
  var trackByIdentity = function(index, item) {
    return item;
  };
  var DefaultIterableDiffer = (function() {
    function DefaultIterableDiffer(_trackByFn) {
      this._trackByFn = _trackByFn;
      this._length = null;
      this._collection = null;
      this._linkedRecords = null;
      this._unlinkedRecords = null;
      this._previousItHead = null;
      this._itHead = null;
      this._itTail = null;
      this._additionsHead = null;
      this._additionsTail = null;
      this._movesHead = null;
      this._movesTail = null;
      this._removalsHead = null;
      this._removalsTail = null;
      this._identityChangesHead = null;
      this._identityChangesTail = null;
      this._trackByFn = lang_1.isPresent(this._trackByFn) ? this._trackByFn : trackByIdentity;
    }
    Object.defineProperty(DefaultIterableDiffer.prototype, "collection", {
      get: function() {
        return this._collection;
      },
      enumerable: true,
      configurable: true
    });
    Object.defineProperty(DefaultIterableDiffer.prototype, "length", {
      get: function() {
        return this._length;
      },
      enumerable: true,
      configurable: true
    });
    DefaultIterableDiffer.prototype.forEachItem = function(fn) {
      var record;
      for (record = this._itHead; record !== null; record = record._next) {
        fn(record);
      }
    };
    DefaultIterableDiffer.prototype.forEachPreviousItem = function(fn) {
      var record;
      for (record = this._previousItHead; record !== null; record = record._nextPrevious) {
        fn(record);
      }
    };
    DefaultIterableDiffer.prototype.forEachAddedItem = function(fn) {
      var record;
      for (record = this._additionsHead; record !== null; record = record._nextAdded) {
        fn(record);
      }
    };
    DefaultIterableDiffer.prototype.forEachMovedItem = function(fn) {
      var record;
      for (record = this._movesHead; record !== null; record = record._nextMoved) {
        fn(record);
      }
    };
    DefaultIterableDiffer.prototype.forEachRemovedItem = function(fn) {
      var record;
      for (record = this._removalsHead; record !== null; record = record._nextRemoved) {
        fn(record);
      }
    };
    DefaultIterableDiffer.prototype.forEachIdentityChange = function(fn) {
      var record;
      for (record = this._identityChangesHead; record !== null; record = record._nextIdentityChange) {
        fn(record);
      }
    };
    DefaultIterableDiffer.prototype.diff = function(collection) {
      if (lang_1.isBlank(collection))
        collection = [];
      if (!collection_1.isListLikeIterable(collection)) {
        throw new exceptions_1.BaseException("Error trying to diff '" + collection + "'");
      }
      if (this.check(collection)) {
        return this;
      } else {
        return null;
      }
    };
    DefaultIterableDiffer.prototype.onDestroy = function() {};
    DefaultIterableDiffer.prototype.check = function(collection) {
      var _this = this;
      this._reset();
      var record = this._itHead;
      var mayBeDirty = false;
      var index;
      var item;
      var itemTrackBy;
      if (lang_1.isArray(collection)) {
        var list = collection;
        this._length = collection.length;
        for (index = 0; index < this._length; index++) {
          item = list[index];
          itemTrackBy = this._trackByFn(index, item);
          if (record === null || !lang_1.looseIdentical(record.trackById, itemTrackBy)) {
            record = this._mismatch(record, item, itemTrackBy, index);
            mayBeDirty = true;
          } else {
            if (mayBeDirty) {
              record = this._verifyReinsertion(record, item, itemTrackBy, index);
            }
            if (!lang_1.looseIdentical(record.item, item))
              this._addIdentityChange(record, item);
          }
          record = record._next;
        }
      } else {
        index = 0;
        collection_1.iterateListLike(collection, function(item) {
          itemTrackBy = _this._trackByFn(index, item);
          if (record === null || !lang_1.looseIdentical(record.trackById, itemTrackBy)) {
            record = _this._mismatch(record, item, itemTrackBy, index);
            mayBeDirty = true;
          } else {
            if (mayBeDirty) {
              record = _this._verifyReinsertion(record, item, itemTrackBy, index);
            }
            if (!lang_1.looseIdentical(record.item, item))
              _this._addIdentityChange(record, item);
          }
          record = record._next;
          index++;
        });
        this._length = index;
      }
      this._truncate(record);
      this._collection = collection;
      return this.isDirty;
    };
    Object.defineProperty(DefaultIterableDiffer.prototype, "isDirty", {
      get: function() {
        return this._additionsHead !== null || this._movesHead !== null || this._removalsHead !== null || this._identityChangesHead !== null;
      },
      enumerable: true,
      configurable: true
    });
    DefaultIterableDiffer.prototype._reset = function() {
      if (this.isDirty) {
        var record;
        var nextRecord;
        for (record = this._previousItHead = this._itHead; record !== null; record = record._next) {
          record._nextPrevious = record._next;
        }
        for (record = this._additionsHead; record !== null; record = record._nextAdded) {
          record.previousIndex = record.currentIndex;
        }
        this._additionsHead = this._additionsTail = null;
        for (record = this._movesHead; record !== null; record = nextRecord) {
          record.previousIndex = record.currentIndex;
          nextRecord = record._nextMoved;
        }
        this._movesHead = this._movesTail = null;
        this._removalsHead = this._removalsTail = null;
        this._identityChangesHead = this._identityChangesTail = null;
      }
    };
    DefaultIterableDiffer.prototype._mismatch = function(record, item, itemTrackBy, index) {
      var previousRecord;
      if (record === null) {
        previousRecord = this._itTail;
      } else {
        previousRecord = record._prev;
        this._remove(record);
      }
      record = this._linkedRecords === null ? null : this._linkedRecords.get(itemTrackBy, index);
      if (record !== null) {
        if (!lang_1.looseIdentical(record.item, item))
          this._addIdentityChange(record, item);
        this._moveAfter(record, previousRecord, index);
      } else {
        record = this._unlinkedRecords === null ? null : this._unlinkedRecords.get(itemTrackBy);
        if (record !== null) {
          if (!lang_1.looseIdentical(record.item, item))
            this._addIdentityChange(record, item);
          this._reinsertAfter(record, previousRecord, index);
        } else {
          record = this._addAfter(new CollectionChangeRecord(item, itemTrackBy), previousRecord, index);
        }
      }
      return record;
    };
    DefaultIterableDiffer.prototype._verifyReinsertion = function(record, item, itemTrackBy, index) {
      var reinsertRecord = this._unlinkedRecords === null ? null : this._unlinkedRecords.get(itemTrackBy);
      if (reinsertRecord !== null) {
        record = this._reinsertAfter(reinsertRecord, record._prev, index);
      } else if (record.currentIndex != index) {
        record.currentIndex = index;
        this._addToMoves(record, index);
      }
      return record;
    };
    DefaultIterableDiffer.prototype._truncate = function(record) {
      while (record !== null) {
        var nextRecord = record._next;
        this._addToRemovals(this._unlink(record));
        record = nextRecord;
      }
      if (this._unlinkedRecords !== null) {
        this._unlinkedRecords.clear();
      }
      if (this._additionsTail !== null) {
        this._additionsTail._nextAdded = null;
      }
      if (this._movesTail !== null) {
        this._movesTail._nextMoved = null;
      }
      if (this._itTail !== null) {
        this._itTail._next = null;
      }
      if (this._removalsTail !== null) {
        this._removalsTail._nextRemoved = null;
      }
      if (this._identityChangesTail !== null) {
        this._identityChangesTail._nextIdentityChange = null;
      }
    };
    DefaultIterableDiffer.prototype._reinsertAfter = function(record, prevRecord, index) {
      if (this._unlinkedRecords !== null) {
        this._unlinkedRecords.remove(record);
      }
      var prev = record._prevRemoved;
      var next = record._nextRemoved;
      if (prev === null) {
        this._removalsHead = next;
      } else {
        prev._nextRemoved = next;
      }
      if (next === null) {
        this._removalsTail = prev;
      } else {
        next._prevRemoved = prev;
      }
      this._insertAfter(record, prevRecord, index);
      this._addToMoves(record, index);
      return record;
    };
    DefaultIterableDiffer.prototype._moveAfter = function(record, prevRecord, index) {
      this._unlink(record);
      this._insertAfter(record, prevRecord, index);
      this._addToMoves(record, index);
      return record;
    };
    DefaultIterableDiffer.prototype._addAfter = function(record, prevRecord, index) {
      this._insertAfter(record, prevRecord, index);
      if (this._additionsTail === null) {
        this._additionsTail = this._additionsHead = record;
      } else {
        this._additionsTail = this._additionsTail._nextAdded = record;
      }
      return record;
    };
    DefaultIterableDiffer.prototype._insertAfter = function(record, prevRecord, index) {
      var next = prevRecord === null ? this._itHead : prevRecord._next;
      record._next = next;
      record._prev = prevRecord;
      if (next === null) {
        this._itTail = record;
      } else {
        next._prev = record;
      }
      if (prevRecord === null) {
        this._itHead = record;
      } else {
        prevRecord._next = record;
      }
      if (this._linkedRecords === null) {
        this._linkedRecords = new _DuplicateMap();
      }
      this._linkedRecords.put(record);
      record.currentIndex = index;
      return record;
    };
    DefaultIterableDiffer.prototype._remove = function(record) {
      return this._addToRemovals(this._unlink(record));
    };
    DefaultIterableDiffer.prototype._unlink = function(record) {
      if (this._linkedRecords !== null) {
        this._linkedRecords.remove(record);
      }
      var prev = record._prev;
      var next = record._next;
      if (prev === null) {
        this._itHead = next;
      } else {
        prev._next = next;
      }
      if (next === null) {
        this._itTail = prev;
      } else {
        next._prev = prev;
      }
      return record;
    };
    DefaultIterableDiffer.prototype._addToMoves = function(record, toIndex) {
      if (record.previousIndex === toIndex) {
        return record;
      }
      if (this._movesTail === null) {
        this._movesTail = this._movesHead = record;
      } else {
        this._movesTail = this._movesTail._nextMoved = record;
      }
      return record;
    };
    DefaultIterableDiffer.prototype._addToRemovals = function(record) {
      if (this._unlinkedRecords === null) {
        this._unlinkedRecords = new _DuplicateMap();
      }
      this._unlinkedRecords.put(record);
      record.currentIndex = null;
      record._nextRemoved = null;
      if (this._removalsTail === null) {
        this._removalsTail = this._removalsHead = record;
        record._prevRemoved = null;
      } else {
        record._prevRemoved = this._removalsTail;
        this._removalsTail = this._removalsTail._nextRemoved = record;
      }
      return record;
    };
    DefaultIterableDiffer.prototype._addIdentityChange = function(record, item) {
      record.item = item;
      if (this._identityChangesTail === null) {
        this._identityChangesTail = this._identityChangesHead = record;
      } else {
        this._identityChangesTail = this._identityChangesTail._nextIdentityChange = record;
      }
      return record;
    };
    DefaultIterableDiffer.prototype.toString = function() {
      var list = [];
      this.forEachItem(function(record) {
        return list.push(record);
      });
      var previous = [];
      this.forEachPreviousItem(function(record) {
        return previous.push(record);
      });
      var additions = [];
      this.forEachAddedItem(function(record) {
        return additions.push(record);
      });
      var moves = [];
      this.forEachMovedItem(function(record) {
        return moves.push(record);
      });
      var removals = [];
      this.forEachRemovedItem(function(record) {
        return removals.push(record);
      });
      var identityChanges = [];
      this.forEachIdentityChange(function(record) {
        return identityChanges.push(record);
      });
      return "collection: " + list.join(', ') + "\n" + "previous: " + previous.join(', ') + "\n" + "additions: " + additions.join(', ') + "\n" + "moves: " + moves.join(', ') + "\n" + "removals: " + removals.join(', ') + "\n" + "identityChanges: " + identityChanges.join(', ') + "\n";
    };
    return DefaultIterableDiffer;
  }());
  exports.DefaultIterableDiffer = DefaultIterableDiffer;
  var CollectionChangeRecord = (function() {
    function CollectionChangeRecord(item, trackById) {
      this.item = item;
      this.trackById = trackById;
      this.currentIndex = null;
      this.previousIndex = null;
      this._nextPrevious = null;
      this._prev = null;
      this._next = null;
      this._prevDup = null;
      this._nextDup = null;
      this._prevRemoved = null;
      this._nextRemoved = null;
      this._nextAdded = null;
      this._nextMoved = null;
      this._nextIdentityChange = null;
    }
    CollectionChangeRecord.prototype.toString = function() {
      return this.previousIndex === this.currentIndex ? lang_1.stringify(this.item) : lang_1.stringify(this.item) + '[' + lang_1.stringify(this.previousIndex) + '->' + lang_1.stringify(this.currentIndex) + ']';
    };
    return CollectionChangeRecord;
  }());
  exports.CollectionChangeRecord = CollectionChangeRecord;
  var _DuplicateItemRecordList = (function() {
    function _DuplicateItemRecordList() {
      this._head = null;
      this._tail = null;
    }
    _DuplicateItemRecordList.prototype.add = function(record) {
      if (this._head === null) {
        this._head = this._tail = record;
        record._nextDup = null;
        record._prevDup = null;
      } else {
        this._tail._nextDup = record;
        record._prevDup = this._tail;
        record._nextDup = null;
        this._tail = record;
      }
    };
    _DuplicateItemRecordList.prototype.get = function(trackById, afterIndex) {
      var record;
      for (record = this._head; record !== null; record = record._nextDup) {
        if ((afterIndex === null || afterIndex < record.currentIndex) && lang_1.looseIdentical(record.trackById, trackById)) {
          return record;
        }
      }
      return null;
    };
    _DuplicateItemRecordList.prototype.remove = function(record) {
      var prev = record._prevDup;
      var next = record._nextDup;
      if (prev === null) {
        this._head = next;
      } else {
        prev._nextDup = next;
      }
      if (next === null) {
        this._tail = prev;
      } else {
        next._prevDup = prev;
      }
      return this._head === null;
    };
    return _DuplicateItemRecordList;
  }());
  var _DuplicateMap = (function() {
    function _DuplicateMap() {
      this.map = new Map();
    }
    _DuplicateMap.prototype.put = function(record) {
      var key = lang_1.getMapKey(record.trackById);
      var duplicates = this.map.get(key);
      if (!lang_1.isPresent(duplicates)) {
        duplicates = new _DuplicateItemRecordList();
        this.map.set(key, duplicates);
      }
      duplicates.add(record);
    };
    _DuplicateMap.prototype.get = function(trackById, afterIndex) {
      if (afterIndex === void 0) {
        afterIndex = null;
      }
      var key = lang_1.getMapKey(trackById);
      var recordList = this.map.get(key);
      return lang_1.isBlank(recordList) ? null : recordList.get(trackById, afterIndex);
    };
    _DuplicateMap.prototype.remove = function(record) {
      var key = lang_1.getMapKey(record.trackById);
      var recordList = this.map.get(key);
      if (recordList.remove(record)) {
        this.map.delete(key);
      }
      return record;
    };
    Object.defineProperty(_DuplicateMap.prototype, "isEmpty", {
      get: function() {
        return this.map.size === 0;
      },
      enumerable: true,
      configurable: true
    });
    _DuplicateMap.prototype.clear = function() {
      this.map.clear();
    };
    _DuplicateMap.prototype.toString = function() {
      return '_DuplicateMap(' + lang_1.stringify(this.map) + ')';
    };
    return _DuplicateMap;
  }());
  return module.exports;
});

System.registerDynamic("@angular/core/src/change_detection/differs/keyvalue_differs.js", ["../../../src/facade/lang", "../../../src/facade/exceptions", "../../../src/facade/collection", "../../di"], true, function($__require, exports, module) {
  "use strict";
  ;
  var define,
      global = this,
      GLOBAL = this;
  var lang_1 = $__require('../../../src/facade/lang');
  var exceptions_1 = $__require('../../../src/facade/exceptions');
  var collection_1 = $__require('../../../src/facade/collection');
  var di_1 = $__require('../../di');
  var KeyValueDiffers = (function() {
    function KeyValueDiffers(factories) {
      this.factories = factories;
    }
    KeyValueDiffers.create = function(factories, parent) {
      if (lang_1.isPresent(parent)) {
        var copied = collection_1.ListWrapper.clone(parent.factories);
        factories = factories.concat(copied);
        return new KeyValueDiffers(factories);
      } else {
        return new KeyValueDiffers(factories);
      }
    };
    KeyValueDiffers.extend = function(factories) {
      return new di_1.Provider(KeyValueDiffers, {
        useFactory: function(parent) {
          if (lang_1.isBlank(parent)) {
            throw new exceptions_1.BaseException('Cannot extend KeyValueDiffers without a parent injector');
          }
          return KeyValueDiffers.create(factories, parent);
        },
        deps: [[KeyValueDiffers, new di_1.SkipSelfMetadata(), new di_1.OptionalMetadata()]]
      });
    };
    KeyValueDiffers.prototype.find = function(kv) {
      var factory = this.factories.find(function(f) {
        return f.supports(kv);
      });
      if (lang_1.isPresent(factory)) {
        return factory;
      } else {
        throw new exceptions_1.BaseException("Cannot find a differ supporting object '" + kv + "'");
      }
    };
    return KeyValueDiffers;
  }());
  exports.KeyValueDiffers = KeyValueDiffers;
  return module.exports;
});

System.registerDynamic("@angular/core/src/change_detection/differs/default_keyvalue_differ.js", ["../../../src/facade/collection", "../../../src/facade/lang", "../../../src/facade/exceptions"], true, function($__require, exports, module) {
  "use strict";
  ;
  var define,
      global = this,
      GLOBAL = this;
  var collection_1 = $__require('../../../src/facade/collection');
  var lang_1 = $__require('../../../src/facade/lang');
  var exceptions_1 = $__require('../../../src/facade/exceptions');
  var DefaultKeyValueDifferFactory = (function() {
    function DefaultKeyValueDifferFactory() {}
    DefaultKeyValueDifferFactory.prototype.supports = function(obj) {
      return obj instanceof Map || lang_1.isJsObject(obj);
    };
    DefaultKeyValueDifferFactory.prototype.create = function(cdRef) {
      return new DefaultKeyValueDiffer();
    };
    return DefaultKeyValueDifferFactory;
  }());
  exports.DefaultKeyValueDifferFactory = DefaultKeyValueDifferFactory;
  var DefaultKeyValueDiffer = (function() {
    function DefaultKeyValueDiffer() {
      this._records = new Map();
      this._mapHead = null;
      this._previousMapHead = null;
      this._changesHead = null;
      this._changesTail = null;
      this._additionsHead = null;
      this._additionsTail = null;
      this._removalsHead = null;
      this._removalsTail = null;
    }
    Object.defineProperty(DefaultKeyValueDiffer.prototype, "isDirty", {
      get: function() {
        return this._additionsHead !== null || this._changesHead !== null || this._removalsHead !== null;
      },
      enumerable: true,
      configurable: true
    });
    DefaultKeyValueDiffer.prototype.forEachItem = function(fn) {
      var record;
      for (record = this._mapHead; record !== null; record = record._next) {
        fn(record);
      }
    };
    DefaultKeyValueDiffer.prototype.forEachPreviousItem = function(fn) {
      var record;
      for (record = this._previousMapHead; record !== null; record = record._nextPrevious) {
        fn(record);
      }
    };
    DefaultKeyValueDiffer.prototype.forEachChangedItem = function(fn) {
      var record;
      for (record = this._changesHead; record !== null; record = record._nextChanged) {
        fn(record);
      }
    };
    DefaultKeyValueDiffer.prototype.forEachAddedItem = function(fn) {
      var record;
      for (record = this._additionsHead; record !== null; record = record._nextAdded) {
        fn(record);
      }
    };
    DefaultKeyValueDiffer.prototype.forEachRemovedItem = function(fn) {
      var record;
      for (record = this._removalsHead; record !== null; record = record._nextRemoved) {
        fn(record);
      }
    };
    DefaultKeyValueDiffer.prototype.diff = function(map) {
      if (lang_1.isBlank(map))
        map = collection_1.MapWrapper.createFromPairs([]);
      if (!(map instanceof Map || lang_1.isJsObject(map))) {
        throw new exceptions_1.BaseException("Error trying to diff '" + map + "'");
      }
      if (this.check(map)) {
        return this;
      } else {
        return null;
      }
    };
    DefaultKeyValueDiffer.prototype.onDestroy = function() {};
    DefaultKeyValueDiffer.prototype.check = function(map) {
      var _this = this;
      this._reset();
      var records = this._records;
      var oldSeqRecord = this._mapHead;
      var lastOldSeqRecord = null;
      var lastNewSeqRecord = null;
      var seqChanged = false;
      this._forEach(map, function(value, key) {
        var newSeqRecord;
        if (oldSeqRecord !== null && key === oldSeqRecord.key) {
          newSeqRecord = oldSeqRecord;
          if (!lang_1.looseIdentical(value, oldSeqRecord.currentValue)) {
            oldSeqRecord.previousValue = oldSeqRecord.currentValue;
            oldSeqRecord.currentValue = value;
            _this._addToChanges(oldSeqRecord);
          }
        } else {
          seqChanged = true;
          if (oldSeqRecord !== null) {
            oldSeqRecord._next = null;
            _this._removeFromSeq(lastOldSeqRecord, oldSeqRecord);
            _this._addToRemovals(oldSeqRecord);
          }
          if (records.has(key)) {
            newSeqRecord = records.get(key);
          } else {
            newSeqRecord = new KeyValueChangeRecord(key);
            records.set(key, newSeqRecord);
            newSeqRecord.currentValue = value;
            _this._addToAdditions(newSeqRecord);
          }
        }
        if (seqChanged) {
          if (_this._isInRemovals(newSeqRecord)) {
            _this._removeFromRemovals(newSeqRecord);
          }
          if (lastNewSeqRecord == null) {
            _this._mapHead = newSeqRecord;
          } else {
            lastNewSeqRecord._next = newSeqRecord;
          }
        }
        lastOldSeqRecord = oldSeqRecord;
        lastNewSeqRecord = newSeqRecord;
        oldSeqRecord = oldSeqRecord === null ? null : oldSeqRecord._next;
      });
      this._truncate(lastOldSeqRecord, oldSeqRecord);
      return this.isDirty;
    };
    DefaultKeyValueDiffer.prototype._reset = function() {
      if (this.isDirty) {
        var record;
        for (record = this._previousMapHead = this._mapHead; record !== null; record = record._next) {
          record._nextPrevious = record._next;
        }
        for (record = this._changesHead; record !== null; record = record._nextChanged) {
          record.previousValue = record.currentValue;
        }
        for (record = this._additionsHead; record != null; record = record._nextAdded) {
          record.previousValue = record.currentValue;
        }
        this._changesHead = this._changesTail = null;
        this._additionsHead = this._additionsTail = null;
        this._removalsHead = this._removalsTail = null;
      }
    };
    DefaultKeyValueDiffer.prototype._truncate = function(lastRecord, record) {
      while (record !== null) {
        if (lastRecord === null) {
          this._mapHead = null;
        } else {
          lastRecord._next = null;
        }
        var nextRecord = record._next;
        this._addToRemovals(record);
        lastRecord = record;
        record = nextRecord;
      }
      for (var rec = this._removalsHead; rec !== null; rec = rec._nextRemoved) {
        rec.previousValue = rec.currentValue;
        rec.currentValue = null;
        this._records.delete(rec.key);
      }
    };
    DefaultKeyValueDiffer.prototype._isInRemovals = function(record) {
      return record === this._removalsHead || record._nextRemoved !== null || record._prevRemoved !== null;
    };
    DefaultKeyValueDiffer.prototype._addToRemovals = function(record) {
      if (this._removalsHead === null) {
        this._removalsHead = this._removalsTail = record;
      } else {
        this._removalsTail._nextRemoved = record;
        record._prevRemoved = this._removalsTail;
        this._removalsTail = record;
      }
    };
    DefaultKeyValueDiffer.prototype._removeFromSeq = function(prev, record) {
      var next = record._next;
      if (prev === null) {
        this._mapHead = next;
      } else {
        prev._next = next;
      }
    };
    DefaultKeyValueDiffer.prototype._removeFromRemovals = function(record) {
      var prev = record._prevRemoved;
      var next = record._nextRemoved;
      if (prev === null) {
        this._removalsHead = next;
      } else {
        prev._nextRemoved = next;
      }
      if (next === null) {
        this._removalsTail = prev;
      } else {
        next._prevRemoved = prev;
      }
      record._prevRemoved = record._nextRemoved = null;
    };
    DefaultKeyValueDiffer.prototype._addToAdditions = function(record) {
      if (this._additionsHead === null) {
        this._additionsHead = this._additionsTail = record;
      } else {
        this._additionsTail._nextAdded = record;
        this._additionsTail = record;
      }
    };
    DefaultKeyValueDiffer.prototype._addToChanges = function(record) {
      if (this._changesHead === null) {
        this._changesHead = this._changesTail = record;
      } else {
        this._changesTail._nextChanged = record;
        this._changesTail = record;
      }
    };
    DefaultKeyValueDiffer.prototype.toString = function() {
      var items = [];
      var previous = [];
      var changes = [];
      var additions = [];
      var removals = [];
      var record;
      for (record = this._mapHead; record !== null; record = record._next) {
        items.push(lang_1.stringify(record));
      }
      for (record = this._previousMapHead; record !== null; record = record._nextPrevious) {
        previous.push(lang_1.stringify(record));
      }
      for (record = this._changesHead; record !== null; record = record._nextChanged) {
        changes.push(lang_1.stringify(record));
      }
      for (record = this._additionsHead; record !== null; record = record._nextAdded) {
        additions.push(lang_1.stringify(record));
      }
      for (record = this._removalsHead; record !== null; record = record._nextRemoved) {
        removals.push(lang_1.stringify(record));
      }
      return "map: " + items.join(', ') + "\n" + "previous: " + previous.join(', ') + "\n" + "additions: " + additions.join(', ') + "\n" + "changes: " + changes.join(', ') + "\n" + "removals: " + removals.join(', ') + "\n";
    };
    DefaultKeyValueDiffer.prototype._forEach = function(obj, fn) {
      if (obj instanceof Map) {
        obj.forEach(fn);
      } else {
        collection_1.StringMapWrapper.forEach(obj, fn);
      }
    };
    return DefaultKeyValueDiffer;
  }());
  exports.DefaultKeyValueDiffer = DefaultKeyValueDiffer;
  var KeyValueChangeRecord = (function() {
    function KeyValueChangeRecord(key) {
      this.key = key;
      this.previousValue = null;
      this.currentValue = null;
      this._nextPrevious = null;
      this._next = null;
      this._nextAdded = null;
      this._nextRemoved = null;
      this._prevRemoved = null;
      this._nextChanged = null;
    }
    KeyValueChangeRecord.prototype.toString = function() {
      return lang_1.looseIdentical(this.previousValue, this.currentValue) ? lang_1.stringify(this.key) : (lang_1.stringify(this.key) + '[' + lang_1.stringify(this.previousValue) + '->' + lang_1.stringify(this.currentValue) + ']');
    };
    return KeyValueChangeRecord;
  }());
  exports.KeyValueChangeRecord = KeyValueChangeRecord;
  return module.exports;
});

System.registerDynamic("@angular/core/src/change_detection/constants.js", ["../../src/facade/lang"], true, function($__require, exports, module) {
  "use strict";
  ;
  var define,
      global = this,
      GLOBAL = this;
  var lang_1 = $__require('../../src/facade/lang');
  (function(ChangeDetectorState) {
    ChangeDetectorState[ChangeDetectorState["NeverChecked"] = 0] = "NeverChecked";
    ChangeDetectorState[ChangeDetectorState["CheckedBefore"] = 1] = "CheckedBefore";
    ChangeDetectorState[ChangeDetectorState["Errored"] = 2] = "Errored";
  })(exports.ChangeDetectorState || (exports.ChangeDetectorState = {}));
  var ChangeDetectorState = exports.ChangeDetectorState;
  (function(ChangeDetectionStrategy) {
    ChangeDetectionStrategy[ChangeDetectionStrategy["CheckOnce"] = 0] = "CheckOnce";
    ChangeDetectionStrategy[ChangeDetectionStrategy["Checked"] = 1] = "Checked";
    ChangeDetectionStrategy[ChangeDetectionStrategy["CheckAlways"] = 2] = "CheckAlways";
    ChangeDetectionStrategy[ChangeDetectionStrategy["Detached"] = 3] = "Detached";
    ChangeDetectionStrategy[ChangeDetectionStrategy["OnPush"] = 4] = "OnPush";
    ChangeDetectionStrategy[ChangeDetectionStrategy["Default"] = 5] = "Default";
  })(exports.ChangeDetectionStrategy || (exports.ChangeDetectionStrategy = {}));
  var ChangeDetectionStrategy = exports.ChangeDetectionStrategy;
  exports.CHANGE_DETECTION_STRATEGY_VALUES = [ChangeDetectionStrategy.CheckOnce, ChangeDetectionStrategy.Checked, ChangeDetectionStrategy.CheckAlways, ChangeDetectionStrategy.Detached, ChangeDetectionStrategy.OnPush, ChangeDetectionStrategy.Default];
  exports.CHANGE_DETECTOR_STATE_VALUES = [ChangeDetectorState.NeverChecked, ChangeDetectorState.CheckedBefore, ChangeDetectorState.Errored];
  function isDefaultChangeDetectionStrategy(changeDetectionStrategy) {
    return lang_1.isBlank(changeDetectionStrategy) || changeDetectionStrategy === ChangeDetectionStrategy.Default;
  }
  exports.isDefaultChangeDetectionStrategy = isDefaultChangeDetectionStrategy;
  return module.exports;
});

System.registerDynamic("@angular/core/src/change_detection/change_detector_ref.js", [], true, function($__require, exports, module) {
  "use strict";
  ;
  var define,
      global = this,
      GLOBAL = this;
  var ChangeDetectorRef = (function() {
    function ChangeDetectorRef() {}
    return ChangeDetectorRef;
  }());
  exports.ChangeDetectorRef = ChangeDetectorRef;
  return module.exports;
});

System.registerDynamic("@angular/core/src/change_detection/change_detection.js", ["./differs/iterable_differs", "./differs/default_iterable_differ", "./differs/keyvalue_differs", "./differs/default_keyvalue_differ", "./constants", "./change_detector_ref", "./change_detection_util"], true, function($__require, exports, module) {
  "use strict";
  ;
  var define,
      global = this,
      GLOBAL = this;
  var iterable_differs_1 = $__require('./differs/iterable_differs');
  var default_iterable_differ_1 = $__require('./differs/default_iterable_differ');
  var keyvalue_differs_1 = $__require('./differs/keyvalue_differs');
  var default_keyvalue_differ_1 = $__require('./differs/default_keyvalue_differ');
  var default_keyvalue_differ_2 = $__require('./differs/default_keyvalue_differ');
  exports.DefaultKeyValueDifferFactory = default_keyvalue_differ_2.DefaultKeyValueDifferFactory;
  exports.KeyValueChangeRecord = default_keyvalue_differ_2.KeyValueChangeRecord;
  var default_iterable_differ_2 = $__require('./differs/default_iterable_differ');
  exports.DefaultIterableDifferFactory = default_iterable_differ_2.DefaultIterableDifferFactory;
  exports.CollectionChangeRecord = default_iterable_differ_2.CollectionChangeRecord;
  var constants_1 = $__require('./constants');
  exports.ChangeDetectionStrategy = constants_1.ChangeDetectionStrategy;
  exports.CHANGE_DETECTION_STRATEGY_VALUES = constants_1.CHANGE_DETECTION_STRATEGY_VALUES;
  exports.ChangeDetectorState = constants_1.ChangeDetectorState;
  exports.CHANGE_DETECTOR_STATE_VALUES = constants_1.CHANGE_DETECTOR_STATE_VALUES;
  exports.isDefaultChangeDetectionStrategy = constants_1.isDefaultChangeDetectionStrategy;
  var change_detector_ref_1 = $__require('./change_detector_ref');
  exports.ChangeDetectorRef = change_detector_ref_1.ChangeDetectorRef;
  var iterable_differs_2 = $__require('./differs/iterable_differs');
  exports.IterableDiffers = iterable_differs_2.IterableDiffers;
  var keyvalue_differs_2 = $__require('./differs/keyvalue_differs');
  exports.KeyValueDiffers = keyvalue_differs_2.KeyValueDiffers;
  var default_iterable_differ_3 = $__require('./differs/default_iterable_differ');
  exports.DefaultIterableDiffer = default_iterable_differ_3.DefaultIterableDiffer;
  var change_detection_util_1 = $__require('./change_detection_util');
  exports.WrappedValue = change_detection_util_1.WrappedValue;
  exports.ValueUnwrapper = change_detection_util_1.ValueUnwrapper;
  exports.SimpleChange = change_detection_util_1.SimpleChange;
  exports.devModeEqual = change_detection_util_1.devModeEqual;
  exports.looseIdentical = change_detection_util_1.looseIdentical;
  exports.uninitialized = change_detection_util_1.uninitialized;
  exports.keyValDiff = [new default_keyvalue_differ_1.DefaultKeyValueDifferFactory()];
  exports.iterableDiff = [new default_iterable_differ_1.DefaultIterableDifferFactory()];
  exports.defaultIterableDiffers = new iterable_differs_1.IterableDiffers(exports.iterableDiff);
  exports.defaultKeyValueDiffers = new keyvalue_differs_1.KeyValueDiffers(exports.keyValDiff);
  return module.exports;
});

System.registerDynamic("@angular/core/src/di/injector.js", ["../../src/facade/exceptions"], true, function($__require, exports, module) {
  "use strict";
  ;
  var define,
      global = this,
      GLOBAL = this;
  var exceptions_1 = $__require('../../src/facade/exceptions');
  var _THROW_IF_NOT_FOUND = new Object();
  exports.THROW_IF_NOT_FOUND = _THROW_IF_NOT_FOUND;
  var Injector = (function() {
    function Injector() {}
    Injector.prototype.get = function(token, notFoundValue) {
      return exceptions_1.unimplemented();
    };
    Injector.THROW_IF_NOT_FOUND = _THROW_IF_NOT_FOUND;
    return Injector;
  }());
  exports.Injector = Injector;
  return module.exports;
});

System.registerDynamic("@angular/core/src/di/reflective_injector.js", ["../../src/facade/collection", "./reflective_provider", "./reflective_exceptions", "../../src/facade/exceptions", "./reflective_key", "./metadata", "./injector"], true, function($__require, exports, module) {
  "use strict";
  ;
  var define,
      global = this,
      GLOBAL = this;
  var collection_1 = $__require('../../src/facade/collection');
  var reflective_provider_1 = $__require('./reflective_provider');
  var reflective_exceptions_1 = $__require('./reflective_exceptions');
  var exceptions_1 = $__require('../../src/facade/exceptions');
  var reflective_key_1 = $__require('./reflective_key');
  var metadata_1 = $__require('./metadata');
  var injector_1 = $__require('./injector');
  var __unused;
  var _MAX_CONSTRUCTION_COUNTER = 10;
  var UNDEFINED = new Object();
  var ReflectiveProtoInjectorInlineStrategy = (function() {
    function ReflectiveProtoInjectorInlineStrategy(protoEI, providers) {
      this.provider0 = null;
      this.provider1 = null;
      this.provider2 = null;
      this.provider3 = null;
      this.provider4 = null;
      this.provider5 = null;
      this.provider6 = null;
      this.provider7 = null;
      this.provider8 = null;
      this.provider9 = null;
      this.keyId0 = null;
      this.keyId1 = null;
      this.keyId2 = null;
      this.keyId3 = null;
      this.keyId4 = null;
      this.keyId5 = null;
      this.keyId6 = null;
      this.keyId7 = null;
      this.keyId8 = null;
      this.keyId9 = null;
      var length = providers.length;
      if (length > 0) {
        this.provider0 = providers[0];
        this.keyId0 = providers[0].key.id;
      }
      if (length > 1) {
        this.provider1 = providers[1];
        this.keyId1 = providers[1].key.id;
      }
      if (length > 2) {
        this.provider2 = providers[2];
        this.keyId2 = providers[2].key.id;
      }
      if (length > 3) {
        this.provider3 = providers[3];
        this.keyId3 = providers[3].key.id;
      }
      if (length > 4) {
        this.provider4 = providers[4];
        this.keyId4 = providers[4].key.id;
      }
      if (length > 5) {
        this.provider5 = providers[5];
        this.keyId5 = providers[5].key.id;
      }
      if (length > 6) {
        this.provider6 = providers[6];
        this.keyId6 = providers[6].key.id;
      }
      if (length > 7) {
        this.provider7 = providers[7];
        this.keyId7 = providers[7].key.id;
      }
      if (length > 8) {
        this.provider8 = providers[8];
        this.keyId8 = providers[8].key.id;
      }
      if (length > 9) {
        this.provider9 = providers[9];
        this.keyId9 = providers[9].key.id;
      }
    }
    ReflectiveProtoInjectorInlineStrategy.prototype.getProviderAtIndex = function(index) {
      if (index == 0)
        return this.provider0;
      if (index == 1)
        return this.provider1;
      if (index == 2)
        return this.provider2;
      if (index == 3)
        return this.provider3;
      if (index == 4)
        return this.provider4;
      if (index == 5)
        return this.provider5;
      if (index == 6)
        return this.provider6;
      if (index == 7)
        return this.provider7;
      if (index == 8)
        return this.provider8;
      if (index == 9)
        return this.provider9;
      throw new reflective_exceptions_1.OutOfBoundsError(index);
    };
    ReflectiveProtoInjectorInlineStrategy.prototype.createInjectorStrategy = function(injector) {
      return new ReflectiveInjectorInlineStrategy(injector, this);
    };
    return ReflectiveProtoInjectorInlineStrategy;
  }());
  exports.ReflectiveProtoInjectorInlineStrategy = ReflectiveProtoInjectorInlineStrategy;
  var ReflectiveProtoInjectorDynamicStrategy = (function() {
    function ReflectiveProtoInjectorDynamicStrategy(protoInj, providers) {
      this.providers = providers;
      var len = providers.length;
      this.keyIds = collection_1.ListWrapper.createFixedSize(len);
      for (var i = 0; i < len; i++) {
        this.keyIds[i] = providers[i].key.id;
      }
    }
    ReflectiveProtoInjectorDynamicStrategy.prototype.getProviderAtIndex = function(index) {
      if (index < 0 || index >= this.providers.length) {
        throw new reflective_exceptions_1.OutOfBoundsError(index);
      }
      return this.providers[index];
    };
    ReflectiveProtoInjectorDynamicStrategy.prototype.createInjectorStrategy = function(ei) {
      return new ReflectiveInjectorDynamicStrategy(this, ei);
    };
    return ReflectiveProtoInjectorDynamicStrategy;
  }());
  exports.ReflectiveProtoInjectorDynamicStrategy = ReflectiveProtoInjectorDynamicStrategy;
  var ReflectiveProtoInjector = (function() {
    function ReflectiveProtoInjector(providers) {
      this.numberOfProviders = providers.length;
      this._strategy = providers.length > _MAX_CONSTRUCTION_COUNTER ? new ReflectiveProtoInjectorDynamicStrategy(this, providers) : new ReflectiveProtoInjectorInlineStrategy(this, providers);
    }
    ReflectiveProtoInjector.fromResolvedProviders = function(providers) {
      return new ReflectiveProtoInjector(providers);
    };
    ReflectiveProtoInjector.prototype.getProviderAtIndex = function(index) {
      return this._strategy.getProviderAtIndex(index);
    };
    return ReflectiveProtoInjector;
  }());
  exports.ReflectiveProtoInjector = ReflectiveProtoInjector;
  var ReflectiveInjectorInlineStrategy = (function() {
    function ReflectiveInjectorInlineStrategy(injector, protoStrategy) {
      this.injector = injector;
      this.protoStrategy = protoStrategy;
      this.obj0 = UNDEFINED;
      this.obj1 = UNDEFINED;
      this.obj2 = UNDEFINED;
      this.obj3 = UNDEFINED;
      this.obj4 = UNDEFINED;
      this.obj5 = UNDEFINED;
      this.obj6 = UNDEFINED;
      this.obj7 = UNDEFINED;
      this.obj8 = UNDEFINED;
      this.obj9 = UNDEFINED;
    }
    ReflectiveInjectorInlineStrategy.prototype.resetConstructionCounter = function() {
      this.injector._constructionCounter = 0;
    };
    ReflectiveInjectorInlineStrategy.prototype.instantiateProvider = function(provider) {
      return this.injector._new(provider);
    };
    ReflectiveInjectorInlineStrategy.prototype.getObjByKeyId = function(keyId) {
      var p = this.protoStrategy;
      var inj = this.injector;
      if (p.keyId0 === keyId) {
        if (this.obj0 === UNDEFINED) {
          this.obj0 = inj._new(p.provider0);
        }
        return this.obj0;
      }
      if (p.keyId1 === keyId) {
        if (this.obj1 === UNDEFINED) {
          this.obj1 = inj._new(p.provider1);
        }
        return this.obj1;
      }
      if (p.keyId2 === keyId) {
        if (this.obj2 === UNDEFINED) {
          this.obj2 = inj._new(p.provider2);
        }
        return this.obj2;
      }
      if (p.keyId3 === keyId) {
        if (this.obj3 === UNDEFINED) {
          this.obj3 = inj._new(p.provider3);
        }
        return this.obj3;
      }
      if (p.keyId4 === keyId) {
        if (this.obj4 === UNDEFINED) {
          this.obj4 = inj._new(p.provider4);
        }
        return this.obj4;
      }
      if (p.keyId5 === keyId) {
        if (this.obj5 === UNDEFINED) {
          this.obj5 = inj._new(p.provider5);
        }
        return this.obj5;
      }
      if (p.keyId6 === keyId) {
        if (this.obj6 === UNDEFINED) {
          this.obj6 = inj._new(p.provider6);
        }
        return this.obj6;
      }
      if (p.keyId7 === keyId) {
        if (this.obj7 === UNDEFINED) {
          this.obj7 = inj._new(p.provider7);
        }
        return this.obj7;
      }
      if (p.keyId8 === keyId) {
        if (this.obj8 === UNDEFINED) {
          this.obj8 = inj._new(p.provider8);
        }
        return this.obj8;
      }
      if (p.keyId9 === keyId) {
        if (this.obj9 === UNDEFINED) {
          this.obj9 = inj._new(p.provider9);
        }
        return this.obj9;
      }
      return UNDEFINED;
    };
    ReflectiveInjectorInlineStrategy.prototype.getObjAtIndex = function(index) {
      if (index == 0)
        return this.obj0;
      if (index == 1)
        return this.obj1;
      if (index == 2)
        return this.obj2;
      if (index == 3)
        return this.obj3;
      if (index == 4)
        return this.obj4;
      if (index == 5)
        return this.obj5;
      if (index == 6)
        return this.obj6;
      if (index == 7)
        return this.obj7;
      if (index == 8)
        return this.obj8;
      if (index == 9)
        return this.obj9;
      throw new reflective_exceptions_1.OutOfBoundsError(index);
    };
    ReflectiveInjectorInlineStrategy.prototype.getMaxNumberOfObjects = function() {
      return _MAX_CONSTRUCTION_COUNTER;
    };
    return ReflectiveInjectorInlineStrategy;
  }());
  exports.ReflectiveInjectorInlineStrategy = ReflectiveInjectorInlineStrategy;
  var ReflectiveInjectorDynamicStrategy = (function() {
    function ReflectiveInjectorDynamicStrategy(protoStrategy, injector) {
      this.protoStrategy = protoStrategy;
      this.injector = injector;
      this.objs = collection_1.ListWrapper.createFixedSize(protoStrategy.providers.length);
      collection_1.ListWrapper.fill(this.objs, UNDEFINED);
    }
    ReflectiveInjectorDynamicStrategy.prototype.resetConstructionCounter = function() {
      this.injector._constructionCounter = 0;
    };
    ReflectiveInjectorDynamicStrategy.prototype.instantiateProvider = function(provider) {
      return this.injector._new(provider);
    };
    ReflectiveInjectorDynamicStrategy.prototype.getObjByKeyId = function(keyId) {
      var p = this.protoStrategy;
      for (var i = 0; i < p.keyIds.length; i++) {
        if (p.keyIds[i] === keyId) {
          if (this.objs[i] === UNDEFINED) {
            this.objs[i] = this.injector._new(p.providers[i]);
          }
          return this.objs[i];
        }
      }
      return UNDEFINED;
    };
    ReflectiveInjectorDynamicStrategy.prototype.getObjAtIndex = function(index) {
      if (index < 0 || index >= this.objs.length) {
        throw new reflective_exceptions_1.OutOfBoundsError(index);
      }
      return this.objs[index];
    };
    ReflectiveInjectorDynamicStrategy.prototype.getMaxNumberOfObjects = function() {
      return this.objs.length;
    };
    return ReflectiveInjectorDynamicStrategy;
  }());
  exports.ReflectiveInjectorDynamicStrategy = ReflectiveInjectorDynamicStrategy;
  var ReflectiveInjector = (function() {
    function ReflectiveInjector() {}
    ReflectiveInjector.resolve = function(providers) {
      return reflective_provider_1.resolveReflectiveProviders(providers);
    };
    ReflectiveInjector.resolveAndCreate = function(providers, parent) {
      if (parent === void 0) {
        parent = null;
      }
      var ResolvedReflectiveProviders = ReflectiveInjector.resolve(providers);
      return ReflectiveInjector.fromResolvedProviders(ResolvedReflectiveProviders, parent);
    };
    ReflectiveInjector.fromResolvedProviders = function(providers, parent) {
      if (parent === void 0) {
        parent = null;
      }
      return new ReflectiveInjector_(ReflectiveProtoInjector.fromResolvedProviders(providers), parent);
    };
    ReflectiveInjector.fromResolvedBindings = function(providers) {
      return ReflectiveInjector.fromResolvedProviders(providers);
    };
    Object.defineProperty(ReflectiveInjector.prototype, "parent", {
      get: function() {
        return exceptions_1.unimplemented();
      },
      enumerable: true,
      configurable: true
    });
    ReflectiveInjector.prototype.debugContext = function() {
      return null;
    };
    ReflectiveInjector.prototype.resolveAndCreateChild = function(providers) {
      return exceptions_1.unimplemented();
    };
    ReflectiveInjector.prototype.createChildFromResolved = function(providers) {
      return exceptions_1.unimplemented();
    };
    ReflectiveInjector.prototype.resolveAndInstantiate = function(provider) {
      return exceptions_1.unimplemented();
    };
    ReflectiveInjector.prototype.instantiateResolved = function(provider) {
      return exceptions_1.unimplemented();
    };
    return ReflectiveInjector;
  }());
  exports.ReflectiveInjector = ReflectiveInjector;
  var ReflectiveInjector_ = (function() {
    function ReflectiveInjector_(_proto, _parent, _debugContext) {
      if (_parent === void 0) {
        _parent = null;
      }
      if (_debugContext === void 0) {
        _debugContext = null;
      }
      this._debugContext = _debugContext;
      this._constructionCounter = 0;
      this._proto = _proto;
      this._parent = _parent;
      this._strategy = _proto._strategy.createInjectorStrategy(this);
    }
    ReflectiveInjector_.prototype.debugContext = function() {
      return this._debugContext();
    };
    ReflectiveInjector_.prototype.get = function(token, notFoundValue) {
      if (notFoundValue === void 0) {
        notFoundValue = injector_1.THROW_IF_NOT_FOUND;
      }
      return this._getByKey(reflective_key_1.ReflectiveKey.get(token), null, null, notFoundValue);
    };
    ReflectiveInjector_.prototype.getAt = function(index) {
      return this._strategy.getObjAtIndex(index);
    };
    Object.defineProperty(ReflectiveInjector_.prototype, "parent", {
      get: function() {
        return this._parent;
      },
      enumerable: true,
      configurable: true
    });
    Object.defineProperty(ReflectiveInjector_.prototype, "internalStrategy", {
      get: function() {
        return this._strategy;
      },
      enumerable: true,
      configurable: true
    });
    ReflectiveInjector_.prototype.resolveAndCreateChild = function(providers) {
      var ResolvedReflectiveProviders = ReflectiveInjector.resolve(providers);
      return this.createChildFromResolved(ResolvedReflectiveProviders);
    };
    ReflectiveInjector_.prototype.createChildFromResolved = function(providers) {
      var proto = new ReflectiveProtoInjector(providers);
      var inj = new ReflectiveInjector_(proto);
      inj._parent = this;
      return inj;
    };
    ReflectiveInjector_.prototype.resolveAndInstantiate = function(provider) {
      return this.instantiateResolved(ReflectiveInjector.resolve([provider])[0]);
    };
    ReflectiveInjector_.prototype.instantiateResolved = function(provider) {
      return this._instantiateProvider(provider);
    };
    ReflectiveInjector_.prototype._new = function(provider) {
      if (this._constructionCounter++ > this._strategy.getMaxNumberOfObjects()) {
        throw new reflective_exceptions_1.CyclicDependencyError(this, provider.key);
      }
      return this._instantiateProvider(provider);
    };
    ReflectiveInjector_.prototype._instantiateProvider = function(provider) {
      if (provider.multiProvider) {
        var res = collection_1.ListWrapper.createFixedSize(provider.resolvedFactories.length);
        for (var i = 0; i < provider.resolvedFactories.length; ++i) {
          res[i] = this._instantiate(provider, provider.resolvedFactories[i]);
        }
        return res;
      } else {
        return this._instantiate(provider, provider.resolvedFactories[0]);
      }
    };
    ReflectiveInjector_.prototype._instantiate = function(provider, ResolvedReflectiveFactory) {
      var factory = ResolvedReflectiveFactory.factory;
      var deps = ResolvedReflectiveFactory.dependencies;
      var length = deps.length;
      var d0;
      var d1;
      var d2;
      var d3;
      var d4;
      var d5;
      var d6;
      var d7;
      var d8;
      var d9;
      var d10;
      var d11;
      var d12;
      var d13;
      var d14;
      var d15;
      var d16;
      var d17;
      var d18;
      var d19;
      try {
        d0 = length > 0 ? this._getByReflectiveDependency(provider, deps[0]) : null;
        d1 = length > 1 ? this._getByReflectiveDependency(provider, deps[1]) : null;
        d2 = length > 2 ? this._getByReflectiveDependency(provider, deps[2]) : null;
        d3 = length > 3 ? this._getByReflectiveDependency(provider, deps[3]) : null;
        d4 = length > 4 ? this._getByReflectiveDependency(provider, deps[4]) : null;
        d5 = length > 5 ? this._getByReflectiveDependency(provider, deps[5]) : null;
        d6 = length > 6 ? this._getByReflectiveDependency(provider, deps[6]) : null;
        d7 = length > 7 ? this._getByReflectiveDependency(provider, deps[7]) : null;
        d8 = length > 8 ? this._getByReflectiveDependency(provider, deps[8]) : null;
        d9 = length > 9 ? this._getByReflectiveDependency(provider, deps[9]) : null;
        d10 = length > 10 ? this._getByReflectiveDependency(provider, deps[10]) : null;
        d11 = length > 11 ? this._getByReflectiveDependency(provider, deps[11]) : null;
        d12 = length > 12 ? this._getByReflectiveDependency(provider, deps[12]) : null;
        d13 = length > 13 ? this._getByReflectiveDependency(provider, deps[13]) : null;
        d14 = length > 14 ? this._getByReflectiveDependency(provider, deps[14]) : null;
        d15 = length > 15 ? this._getByReflectiveDependency(provider, deps[15]) : null;
        d16 = length > 16 ? this._getByReflectiveDependency(provider, deps[16]) : null;
        d17 = length > 17 ? this._getByReflectiveDependency(provider, deps[17]) : null;
        d18 = length > 18 ? this._getByReflectiveDependency(provider, deps[18]) : null;
        d19 = length > 19 ? this._getByReflectiveDependency(provider, deps[19]) : null;
      } catch (e) {
        if (e instanceof reflective_exceptions_1.AbstractProviderError || e instanceof reflective_exceptions_1.InstantiationError) {
          e.addKey(this, provider.key);
        }
        throw e;
      }
      var obj;
      try {
        switch (length) {
          case 0:
            obj = factory();
            break;
          case 1:
            obj = factory(d0);
            break;
          case 2:
            obj = factory(d0, d1);
            break;
          case 3:
            obj = factory(d0, d1, d2);
            break;
          case 4:
            obj = factory(d0, d1, d2, d3);
            break;
          case 5:
            obj = factory(d0, d1, d2, d3, d4);
            break;
          case 6:
            obj = factory(d0, d1, d2, d3, d4, d5);
            break;
          case 7:
            obj = factory(d0, d1, d2, d3, d4, d5, d6);
            break;
          case 8:
            obj = factory(d0, d1, d2, d3, d4, d5, d6, d7);
            break;
          case 9:
            obj = factory(d0, d1, d2, d3, d4, d5, d6, d7, d8);
            break;
          case 10:
            obj = factory(d0, d1, d2, d3, d4, d5, d6, d7, d8, d9);
            break;
          case 11:
            obj = factory(d0, d1, d2, d3, d4, d5, d6, d7, d8, d9, d10);
            break;
          case 12:
            obj = factory(d0, d1, d2, d3, d4, d5, d6, d7, d8, d9, d10, d11);
            break;
          case 13:
            obj = factory(d0, d1, d2, d3, d4, d5, d6, d7, d8, d9, d10, d11, d12);
            break;
          case 14:
            obj = factory(d0, d1, d2, d3, d4, d5, d6, d7, d8, d9, d10, d11, d12, d13);
            break;
          case 15:
            obj = factory(d0, d1, d2, d3, d4, d5, d6, d7, d8, d9, d10, d11, d12, d13, d14);
            break;
          case 16:
            obj = factory(d0, d1, d2, d3, d4, d5, d6, d7, d8, d9, d10, d11, d12, d13, d14, d15);
            break;
          case 17:
            obj = factory(d0, d1, d2, d3, d4, d5, d6, d7, d8, d9, d10, d11, d12, d13, d14, d15, d16);
            break;
          case 18:
            obj = factory(d0, d1, d2, d3, d4, d5, d6, d7, d8, d9, d10, d11, d12, d13, d14, d15, d16, d17);
            break;
          case 19:
            obj = factory(d0, d1, d2, d3, d4, d5, d6, d7, d8, d9, d10, d11, d12, d13, d14, d15, d16, d17, d18);
            break;
          case 20:
            obj = factory(d0, d1, d2, d3, d4, d5, d6, d7, d8, d9, d10, d11, d12, d13, d14, d15, d16, d17, d18, d19);
            break;
          default:
            throw new exceptions_1.BaseException("Cannot instantiate '" + provider.key.displayName + "' because it has more than 20 dependencies");
        }
      } catch (e) {
        throw new reflective_exceptions_1.InstantiationError(this, e, e.stack, provider.key);
      }
      return obj;
    };
    ReflectiveInjector_.prototype._getByReflectiveDependency = function(provider, dep) {
      return this._getByKey(dep.key, dep.lowerBoundVisibility, dep.upperBoundVisibility, dep.optional ? null : injector_1.THROW_IF_NOT_FOUND);
    };
    ReflectiveInjector_.prototype._getByKey = function(key, lowerBoundVisibility, upperBoundVisibility, notFoundValue) {
      if (key === INJECTOR_KEY) {
        return this;
      }
      if (upperBoundVisibility instanceof metadata_1.SelfMetadata) {
        return this._getByKeySelf(key, notFoundValue);
      } else {
        return this._getByKeyDefault(key, notFoundValue, lowerBoundVisibility);
      }
    };
    ReflectiveInjector_.prototype._throwOrNull = function(key, notFoundValue) {
      if (notFoundValue !== injector_1.THROW_IF_NOT_FOUND) {
        return notFoundValue;
      } else {
        throw new reflective_exceptions_1.NoProviderError(this, key);
      }
    };
    ReflectiveInjector_.prototype._getByKeySelf = function(key, notFoundValue) {
      var obj = this._strategy.getObjByKeyId(key.id);
      return (obj !== UNDEFINED) ? obj : this._throwOrNull(key, notFoundValue);
    };
    ReflectiveInjector_.prototype._getByKeyDefault = function(key, notFoundValue, lowerBoundVisibility) {
      var inj;
      if (lowerBoundVisibility instanceof metadata_1.SkipSelfMetadata) {
        inj = this._parent;
      } else {
        inj = this;
      }
      while (inj instanceof ReflectiveInjector_) {
        var inj_ = inj;
        var obj = inj_._strategy.getObjByKeyId(key.id);
        if (obj !== UNDEFINED)
          return obj;
        inj = inj_._parent;
      }
      if (inj !== null) {
        return inj.get(key.token, notFoundValue);
      } else {
        return this._throwOrNull(key, notFoundValue);
      }
    };
    Object.defineProperty(ReflectiveInjector_.prototype, "displayName", {
      get: function() {
        return "ReflectiveInjector(providers: [" + _mapProviders(this, function(b) {
          return (" \"" + b.key.displayName + "\" ");
        }).join(", ") + "])";
      },
      enumerable: true,
      configurable: true
    });
    ReflectiveInjector_.prototype.toString = function() {
      return this.displayName;
    };
    return ReflectiveInjector_;
  }());
  exports.ReflectiveInjector_ = ReflectiveInjector_;
  var INJECTOR_KEY = reflective_key_1.ReflectiveKey.get(injector_1.Injector);
  function _mapProviders(injector, fn) {
    var res = [];
    for (var i = 0; i < injector._proto.numberOfProviders; ++i) {
      res.push(fn(injector._proto.getProviderAtIndex(i)));
    }
    return res;
  }
  return module.exports;
});

System.registerDynamic("@angular/core/src/reflection/reflector_reader.js", [], true, function($__require, exports, module) {
  "use strict";
  ;
  var define,
      global = this,
      GLOBAL = this;
  var ReflectorReader = (function() {
    function ReflectorReader() {}
    return ReflectorReader;
  }());
  exports.ReflectorReader = ReflectorReader;
  return module.exports;
});

System.registerDynamic("@angular/core/src/reflection/reflector.js", ["../../src/facade/lang", "../../src/facade/exceptions", "../../src/facade/collection", "./reflector_reader"], true, function($__require, exports, module) {
  "use strict";
  ;
  var define,
      global = this,
      GLOBAL = this;
  var __extends = (this && this.__extends) || function(d, b) {
    for (var p in b)
      if (b.hasOwnProperty(p))
        d[p] = b[p];
    function __() {
      this.constructor = d;
    }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
  };
  var lang_1 = $__require('../../src/facade/lang');
  var exceptions_1 = $__require('../../src/facade/exceptions');
  var collection_1 = $__require('../../src/facade/collection');
  var reflector_reader_1 = $__require('./reflector_reader');
  var ReflectionInfo = (function() {
    function ReflectionInfo(annotations, parameters, factory, interfaces, propMetadata) {
      this.annotations = annotations;
      this.parameters = parameters;
      this.factory = factory;
      this.interfaces = interfaces;
      this.propMetadata = propMetadata;
    }
    return ReflectionInfo;
  }());
  exports.ReflectionInfo = ReflectionInfo;
  var Reflector = (function(_super) {
    __extends(Reflector, _super);
    function Reflector(reflectionCapabilities) {
      _super.call(this);
      this._injectableInfo = new collection_1.Map();
      this._getters = new collection_1.Map();
      this._setters = new collection_1.Map();
      this._methods = new collection_1.Map();
      this._usedKeys = null;
      this.reflectionCapabilities = reflectionCapabilities;
    }
    Reflector.prototype.isReflectionEnabled = function() {
      return this.reflectionCapabilities.isReflectionEnabled();
    };
    Reflector.prototype.trackUsage = function() {
      this._usedKeys = new collection_1.Set();
    };
    Reflector.prototype.listUnusedKeys = function() {
      var _this = this;
      if (this._usedKeys == null) {
        throw new exceptions_1.BaseException('Usage tracking is disabled');
      }
      var allTypes = collection_1.MapWrapper.keys(this._injectableInfo);
      return allTypes.filter(function(key) {
        return !collection_1.SetWrapper.has(_this._usedKeys, key);
      });
    };
    Reflector.prototype.registerFunction = function(func, funcInfo) {
      this._injectableInfo.set(func, funcInfo);
    };
    Reflector.prototype.registerType = function(type, typeInfo) {
      this._injectableInfo.set(type, typeInfo);
    };
    Reflector.prototype.registerGetters = function(getters) {
      _mergeMaps(this._getters, getters);
    };
    Reflector.prototype.registerSetters = function(setters) {
      _mergeMaps(this._setters, setters);
    };
    Reflector.prototype.registerMethods = function(methods) {
      _mergeMaps(this._methods, methods);
    };
    Reflector.prototype.factory = function(type) {
      if (this._containsReflectionInfo(type)) {
        var res = this._getReflectionInfo(type).factory;
        return lang_1.isPresent(res) ? res : null;
      } else {
        return this.reflectionCapabilities.factory(type);
      }
    };
    Reflector.prototype.parameters = function(typeOrFunc) {
      if (this._injectableInfo.has(typeOrFunc)) {
        var res = this._getReflectionInfo(typeOrFunc).parameters;
        return lang_1.isPresent(res) ? res : [];
      } else {
        return this.reflectionCapabilities.parameters(typeOrFunc);
      }
    };
    Reflector.prototype.annotations = function(typeOrFunc) {
      if (this._injectableInfo.has(typeOrFunc)) {
        var res = this._getReflectionInfo(typeOrFunc).annotations;
        return lang_1.isPresent(res) ? res : [];
      } else {
        return this.reflectionCapabilities.annotations(typeOrFunc);
      }
    };
    Reflector.prototype.propMetadata = function(typeOrFunc) {
      if (this._injectableInfo.has(typeOrFunc)) {
        var res = this._getReflectionInfo(typeOrFunc).propMetadata;
        return lang_1.isPresent(res) ? res : {};
      } else {
        return this.reflectionCapabilities.propMetadata(typeOrFunc);
      }
    };
    Reflector.prototype.interfaces = function(type) {
      if (this._injectableInfo.has(type)) {
        var res = this._getReflectionInfo(type).interfaces;
        return lang_1.isPresent(res) ? res : [];
      } else {
        return this.reflectionCapabilities.interfaces(type);
      }
    };
    Reflector.prototype.getter = function(name) {
      if (this._getters.has(name)) {
        return this._getters.get(name);
      } else {
        return this.reflectionCapabilities.getter(name);
      }
    };
    Reflector.prototype.setter = function(name) {
      if (this._setters.has(name)) {
        return this._setters.get(name);
      } else {
        return this.reflectionCapabilities.setter(name);
      }
    };
    Reflector.prototype.method = function(name) {
      if (this._methods.has(name)) {
        return this._methods.get(name);
      } else {
        return this.reflectionCapabilities.method(name);
      }
    };
    Reflector.prototype._getReflectionInfo = function(typeOrFunc) {
      if (lang_1.isPresent(this._usedKeys)) {
        this._usedKeys.add(typeOrFunc);
      }
      return this._injectableInfo.get(typeOrFunc);
    };
    Reflector.prototype._containsReflectionInfo = function(typeOrFunc) {
      return this._injectableInfo.has(typeOrFunc);
    };
    Reflector.prototype.importUri = function(type) {
      return this.reflectionCapabilities.importUri(type);
    };
    return Reflector;
  }(reflector_reader_1.ReflectorReader));
  exports.Reflector = Reflector;
  function _mergeMaps(target, config) {
    collection_1.StringMapWrapper.forEach(config, function(v, k) {
      return target.set(k, v);
    });
  }
  return module.exports;
});

System.registerDynamic("@angular/core/src/reflection/reflection.js", ["./reflector", "./reflection_capabilities"], true, function($__require, exports, module) {
  "use strict";
  ;
  var define,
      global = this,
      GLOBAL = this;
  var reflector_1 = $__require('./reflector');
  var reflector_2 = $__require('./reflector');
  exports.Reflector = reflector_2.Reflector;
  exports.ReflectionInfo = reflector_2.ReflectionInfo;
  var reflection_capabilities_1 = $__require('./reflection_capabilities');
  exports.reflector = new reflector_1.Reflector(new reflection_capabilities_1.ReflectionCapabilities());
  return module.exports;
});

System.registerDynamic("@angular/core/src/di/reflective_provider.js", ["../../src/facade/lang", "../../src/facade/collection", "../reflection/reflection", "./reflective_key", "./metadata", "./reflective_exceptions", "./forward_ref", "./provider", "./provider_util"], true, function($__require, exports, module) {
  "use strict";
  ;
  var define,
      global = this,
      GLOBAL = this;
  var lang_1 = $__require('../../src/facade/lang');
  var collection_1 = $__require('../../src/facade/collection');
  var reflection_1 = $__require('../reflection/reflection');
  var reflective_key_1 = $__require('./reflective_key');
  var metadata_1 = $__require('./metadata');
  var reflective_exceptions_1 = $__require('./reflective_exceptions');
  var forward_ref_1 = $__require('./forward_ref');
  var provider_1 = $__require('./provider');
  var provider_util_1 = $__require('./provider_util');
  var ReflectiveDependency = (function() {
    function ReflectiveDependency(key, optional, lowerBoundVisibility, upperBoundVisibility, properties) {
      this.key = key;
      this.optional = optional;
      this.lowerBoundVisibility = lowerBoundVisibility;
      this.upperBoundVisibility = upperBoundVisibility;
      this.properties = properties;
    }
    ReflectiveDependency.fromKey = function(key) {
      return new ReflectiveDependency(key, false, null, null, []);
    };
    return ReflectiveDependency;
  }());
  exports.ReflectiveDependency = ReflectiveDependency;
  var _EMPTY_LIST = [];
  var ResolvedReflectiveProvider_ = (function() {
    function ResolvedReflectiveProvider_(key, resolvedFactories, multiProvider) {
      this.key = key;
      this.resolvedFactories = resolvedFactories;
      this.multiProvider = multiProvider;
    }
    Object.defineProperty(ResolvedReflectiveProvider_.prototype, "resolvedFactory", {
      get: function() {
        return this.resolvedFactories[0];
      },
      enumerable: true,
      configurable: true
    });
    return ResolvedReflectiveProvider_;
  }());
  exports.ResolvedReflectiveProvider_ = ResolvedReflectiveProvider_;
  var ResolvedReflectiveFactory = (function() {
    function ResolvedReflectiveFactory(factory, dependencies) {
      this.factory = factory;
      this.dependencies = dependencies;
    }
    return ResolvedReflectiveFactory;
  }());
  exports.ResolvedReflectiveFactory = ResolvedReflectiveFactory;
  function resolveReflectiveFactory(provider) {
    var factoryFn;
    var resolvedDeps;
    if (lang_1.isPresent(provider.useClass)) {
      var useClass = forward_ref_1.resolveForwardRef(provider.useClass);
      factoryFn = reflection_1.reflector.factory(useClass);
      resolvedDeps = _dependenciesFor(useClass);
    } else if (lang_1.isPresent(provider.useExisting)) {
      factoryFn = function(aliasInstance) {
        return aliasInstance;
      };
      resolvedDeps = [ReflectiveDependency.fromKey(reflective_key_1.ReflectiveKey.get(provider.useExisting))];
    } else if (lang_1.isPresent(provider.useFactory)) {
      factoryFn = provider.useFactory;
      resolvedDeps = constructDependencies(provider.useFactory, provider.dependencies);
    } else {
      factoryFn = function() {
        return provider.useValue;
      };
      resolvedDeps = _EMPTY_LIST;
    }
    return new ResolvedReflectiveFactory(factoryFn, resolvedDeps);
  }
  exports.resolveReflectiveFactory = resolveReflectiveFactory;
  function resolveReflectiveProvider(provider) {
    return new ResolvedReflectiveProvider_(reflective_key_1.ReflectiveKey.get(provider.token), [resolveReflectiveFactory(provider)], provider.multi);
  }
  exports.resolveReflectiveProvider = resolveReflectiveProvider;
  function resolveReflectiveProviders(providers) {
    var normalized = _normalizeProviders(providers, []);
    var resolved = normalized.map(resolveReflectiveProvider);
    return collection_1.MapWrapper.values(mergeResolvedReflectiveProviders(resolved, new Map()));
  }
  exports.resolveReflectiveProviders = resolveReflectiveProviders;
  function mergeResolvedReflectiveProviders(providers, normalizedProvidersMap) {
    for (var i = 0; i < providers.length; i++) {
      var provider = providers[i];
      var existing = normalizedProvidersMap.get(provider.key.id);
      if (lang_1.isPresent(existing)) {
        if (provider.multiProvider !== existing.multiProvider) {
          throw new reflective_exceptions_1.MixingMultiProvidersWithRegularProvidersError(existing, provider);
        }
        if (provider.multiProvider) {
          for (var j = 0; j < provider.resolvedFactories.length; j++) {
            existing.resolvedFactories.push(provider.resolvedFactories[j]);
          }
        } else {
          normalizedProvidersMap.set(provider.key.id, provider);
        }
      } else {
        var resolvedProvider;
        if (provider.multiProvider) {
          resolvedProvider = new ResolvedReflectiveProvider_(provider.key, collection_1.ListWrapper.clone(provider.resolvedFactories), provider.multiProvider);
        } else {
          resolvedProvider = provider;
        }
        normalizedProvidersMap.set(provider.key.id, resolvedProvider);
      }
    }
    return normalizedProvidersMap;
  }
  exports.mergeResolvedReflectiveProviders = mergeResolvedReflectiveProviders;
  function _normalizeProviders(providers, res) {
    providers.forEach(function(b) {
      if (b instanceof lang_1.Type) {
        res.push(provider_1.provide(b, {useClass: b}));
      } else if (b instanceof provider_1.Provider) {
        res.push(b);
      } else if (provider_util_1.isProviderLiteral(b)) {
        res.push(provider_util_1.createProvider(b));
      } else if (b instanceof Array) {
        _normalizeProviders(b, res);
      } else if (b instanceof provider_1.ProviderBuilder) {
        throw new reflective_exceptions_1.InvalidProviderError(b.token);
      } else {
        throw new reflective_exceptions_1.InvalidProviderError(b);
      }
    });
    return res;
  }
  function constructDependencies(typeOrFunc, dependencies) {
    if (lang_1.isBlank(dependencies)) {
      return _dependenciesFor(typeOrFunc);
    } else {
      var params = dependencies.map(function(t) {
        return [t];
      });
      return dependencies.map(function(t) {
        return _extractToken(typeOrFunc, t, params);
      });
    }
  }
  exports.constructDependencies = constructDependencies;
  function _dependenciesFor(typeOrFunc) {
    var params = reflection_1.reflector.parameters(typeOrFunc);
    if (lang_1.isBlank(params))
      return [];
    if (params.some(lang_1.isBlank)) {
      throw new reflective_exceptions_1.NoAnnotationError(typeOrFunc, params);
    }
    return params.map(function(p) {
      return _extractToken(typeOrFunc, p, params);
    });
  }
  function _extractToken(typeOrFunc, metadata, params) {
    var depProps = [];
    var token = null;
    var optional = false;
    if (!lang_1.isArray(metadata)) {
      if (metadata instanceof metadata_1.InjectMetadata) {
        return _createDependency(metadata.token, optional, null, null, depProps);
      } else {
        return _createDependency(metadata, optional, null, null, depProps);
      }
    }
    var lowerBoundVisibility = null;
    var upperBoundVisibility = null;
    for (var i = 0; i < metadata.length; ++i) {
      var paramMetadata = metadata[i];
      if (paramMetadata instanceof lang_1.Type) {
        token = paramMetadata;
      } else if (paramMetadata instanceof metadata_1.InjectMetadata) {
        token = paramMetadata.token;
      } else if (paramMetadata instanceof metadata_1.OptionalMetadata) {
        optional = true;
      } else if (paramMetadata instanceof metadata_1.SelfMetadata) {
        upperBoundVisibility = paramMetadata;
      } else if (paramMetadata instanceof metadata_1.HostMetadata) {
        upperBoundVisibility = paramMetadata;
      } else if (paramMetadata instanceof metadata_1.SkipSelfMetadata) {
        lowerBoundVisibility = paramMetadata;
      } else if (paramMetadata instanceof metadata_1.DependencyMetadata) {
        if (lang_1.isPresent(paramMetadata.token)) {
          token = paramMetadata.token;
        }
        depProps.push(paramMetadata);
      }
    }
    token = forward_ref_1.resolveForwardRef(token);
    if (lang_1.isPresent(token)) {
      return _createDependency(token, optional, lowerBoundVisibility, upperBoundVisibility, depProps);
    } else {
      throw new reflective_exceptions_1.NoAnnotationError(typeOrFunc, params);
    }
  }
  function _createDependency(token, optional, lowerBoundVisibility, upperBoundVisibility, depProps) {
    return new ReflectiveDependency(reflective_key_1.ReflectiveKey.get(token), optional, lowerBoundVisibility, upperBoundVisibility, depProps);
  }
  return module.exports;
});

System.registerDynamic("@angular/core/src/di/forward_ref.js", ["../../src/facade/lang"], true, function($__require, exports, module) {
  "use strict";
  ;
  var define,
      global = this,
      GLOBAL = this;
  var lang_1 = $__require('../../src/facade/lang');
  function forwardRef(forwardRefFn) {
    forwardRefFn.__forward_ref__ = forwardRef;
    forwardRefFn.toString = function() {
      return lang_1.stringify(this());
    };
    return forwardRefFn;
  }
  exports.forwardRef = forwardRef;
  function resolveForwardRef(type) {
    if (lang_1.isFunction(type) && type.hasOwnProperty('__forward_ref__') && type.__forward_ref__ === forwardRef) {
      return type();
    } else {
      return type;
    }
  }
  exports.resolveForwardRef = resolveForwardRef;
  return module.exports;
});

System.registerDynamic("@angular/core/src/di/reflective_key.js", ["../../src/facade/lang", "../../src/facade/exceptions", "./forward_ref"], true, function($__require, exports, module) {
  "use strict";
  ;
  var define,
      global = this,
      GLOBAL = this;
  var lang_1 = $__require('../../src/facade/lang');
  var exceptions_1 = $__require('../../src/facade/exceptions');
  var forward_ref_1 = $__require('./forward_ref');
  var ReflectiveKey = (function() {
    function ReflectiveKey(token, id) {
      this.token = token;
      this.id = id;
      if (lang_1.isBlank(token)) {
        throw new exceptions_1.BaseException('Token must be defined!');
      }
    }
    Object.defineProperty(ReflectiveKey.prototype, "displayName", {
      get: function() {
        return lang_1.stringify(this.token);
      },
      enumerable: true,
      configurable: true
    });
    ReflectiveKey.get = function(token) {
      return _globalKeyRegistry.get(forward_ref_1.resolveForwardRef(token));
    };
    Object.defineProperty(ReflectiveKey, "numberOfKeys", {
      get: function() {
        return _globalKeyRegistry.numberOfKeys;
      },
      enumerable: true,
      configurable: true
    });
    return ReflectiveKey;
  }());
  exports.ReflectiveKey = ReflectiveKey;
  var KeyRegistry = (function() {
    function KeyRegistry() {
      this._allKeys = new Map();
    }
    KeyRegistry.prototype.get = function(token) {
      if (token instanceof ReflectiveKey)
        return token;
      if (this._allKeys.has(token)) {
        return this._allKeys.get(token);
      }
      var newKey = new ReflectiveKey(token, ReflectiveKey.numberOfKeys);
      this._allKeys.set(token, newKey);
      return newKey;
    };
    Object.defineProperty(KeyRegistry.prototype, "numberOfKeys", {
      get: function() {
        return this._allKeys.size;
      },
      enumerable: true,
      configurable: true
    });
    return KeyRegistry;
  }());
  exports.KeyRegistry = KeyRegistry;
  var _globalKeyRegistry = new KeyRegistry();
  return module.exports;
});

System.registerDynamic("@angular/core/src/di/reflective_exceptions.js", ["../../src/facade/collection", "../../src/facade/lang", "../../src/facade/exceptions"], true, function($__require, exports, module) {
  "use strict";
  ;
  var define,
      global = this,
      GLOBAL = this;
  var __extends = (this && this.__extends) || function(d, b) {
    for (var p in b)
      if (b.hasOwnProperty(p))
        d[p] = b[p];
    function __() {
      this.constructor = d;
    }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
  };
  var collection_1 = $__require('../../src/facade/collection');
  var lang_1 = $__require('../../src/facade/lang');
  var exceptions_1 = $__require('../../src/facade/exceptions');
  function findFirstClosedCycle(keys) {
    var res = [];
    for (var i = 0; i < keys.length; ++i) {
      if (collection_1.ListWrapper.contains(res, keys[i])) {
        res.push(keys[i]);
        return res;
      } else {
        res.push(keys[i]);
      }
    }
    return res;
  }
  function constructResolvingPath(keys) {
    if (keys.length > 1) {
      var reversed = findFirstClosedCycle(collection_1.ListWrapper.reversed(keys));
      var tokenStrs = reversed.map(function(k) {
        return lang_1.stringify(k.token);
      });
      return " (" + tokenStrs.join(' -> ') + ")";
    } else {
      return "";
    }
  }
  var AbstractProviderError = (function(_super) {
    __extends(AbstractProviderError, _super);
    function AbstractProviderError(injector, key, constructResolvingMessage) {
      _super.call(this, "DI Exception");
      this.keys = [key];
      this.injectors = [injector];
      this.constructResolvingMessage = constructResolvingMessage;
      this.message = this.constructResolvingMessage(this.keys);
    }
    AbstractProviderError.prototype.addKey = function(injector, key) {
      this.injectors.push(injector);
      this.keys.push(key);
      this.message = this.constructResolvingMessage(this.keys);
    };
    Object.defineProperty(AbstractProviderError.prototype, "context", {
      get: function() {
        return this.injectors[this.injectors.length - 1].debugContext();
      },
      enumerable: true,
      configurable: true
    });
    return AbstractProviderError;
  }(exceptions_1.BaseException));
  exports.AbstractProviderError = AbstractProviderError;
  var NoProviderError = (function(_super) {
    __extends(NoProviderError, _super);
    function NoProviderError(injector, key) {
      _super.call(this, injector, key, function(keys) {
        var first = lang_1.stringify(collection_1.ListWrapper.first(keys).token);
        return "No provider for " + first + "!" + constructResolvingPath(keys);
      });
    }
    return NoProviderError;
  }(AbstractProviderError));
  exports.NoProviderError = NoProviderError;
  var CyclicDependencyError = (function(_super) {
    __extends(CyclicDependencyError, _super);
    function CyclicDependencyError(injector, key) {
      _super.call(this, injector, key, function(keys) {
        return "Cannot instantiate cyclic dependency!" + constructResolvingPath(keys);
      });
    }
    return CyclicDependencyError;
  }(AbstractProviderError));
  exports.CyclicDependencyError = CyclicDependencyError;
  var InstantiationError = (function(_super) {
    __extends(InstantiationError, _super);
    function InstantiationError(injector, originalException, originalStack, key) {
      _super.call(this, "DI Exception", originalException, originalStack, null);
      this.keys = [key];
      this.injectors = [injector];
    }
    InstantiationError.prototype.addKey = function(injector, key) {
      this.injectors.push(injector);
      this.keys.push(key);
    };
    Object.defineProperty(InstantiationError.prototype, "wrapperMessage", {
      get: function() {
        var first = lang_1.stringify(collection_1.ListWrapper.first(this.keys).token);
        return "Error during instantiation of " + first + "!" + constructResolvingPath(this.keys) + ".";
      },
      enumerable: true,
      configurable: true
    });
    Object.defineProperty(InstantiationError.prototype, "causeKey", {
      get: function() {
        return this.keys[0];
      },
      enumerable: true,
      configurable: true
    });
    Object.defineProperty(InstantiationError.prototype, "context", {
      get: function() {
        return this.injectors[this.injectors.length - 1].debugContext();
      },
      enumerable: true,
      configurable: true
    });
    return InstantiationError;
  }(exceptions_1.WrappedException));
  exports.InstantiationError = InstantiationError;
  var InvalidProviderError = (function(_super) {
    __extends(InvalidProviderError, _super);
    function InvalidProviderError(provider) {
      _super.call(this, "Invalid provider - only instances of Provider and Type are allowed, got: " + provider.toString());
    }
    return InvalidProviderError;
  }(exceptions_1.BaseException));
  exports.InvalidProviderError = InvalidProviderError;
  var NoAnnotationError = (function(_super) {
    __extends(NoAnnotationError, _super);
    function NoAnnotationError(typeOrFunc, params) {
      _super.call(this, NoAnnotationError._genMessage(typeOrFunc, params));
    }
    NoAnnotationError._genMessage = function(typeOrFunc, params) {
      var signature = [];
      for (var i = 0,
          ii = params.length; i < ii; i++) {
        var parameter = params[i];
        if (lang_1.isBlank(parameter) || parameter.length == 0) {
          signature.push('?');
        } else {
          signature.push(parameter.map(lang_1.stringify).join(' '));
        }
      }
      return "Cannot resolve all parameters for '" + lang_1.stringify(typeOrFunc) + "'(" + signature.join(', ') + "). " + "Make sure that all the parameters are decorated with Inject or have valid type annotations and that '" + lang_1.stringify(typeOrFunc) + "' is decorated with Injectable.";
    };
    return NoAnnotationError;
  }(exceptions_1.BaseException));
  exports.NoAnnotationError = NoAnnotationError;
  var OutOfBoundsError = (function(_super) {
    __extends(OutOfBoundsError, _super);
    function OutOfBoundsError(index) {
      _super.call(this, "Index " + index + " is out-of-bounds.");
    }
    return OutOfBoundsError;
  }(exceptions_1.BaseException));
  exports.OutOfBoundsError = OutOfBoundsError;
  var MixingMultiProvidersWithRegularProvidersError = (function(_super) {
    __extends(MixingMultiProvidersWithRegularProvidersError, _super);
    function MixingMultiProvidersWithRegularProvidersError(provider1, provider2) {
      _super.call(this, "Cannot mix multi providers and regular providers, got: " + provider1.toString() + " " + provider2.toString());
    }
    return MixingMultiProvidersWithRegularProvidersError;
  }(exceptions_1.BaseException));
  exports.MixingMultiProvidersWithRegularProvidersError = MixingMultiProvidersWithRegularProvidersError;
  return module.exports;
});

System.registerDynamic("@angular/core/src/di/opaque_token.js", [], true, function($__require, exports, module) {
  "use strict";
  ;
  var define,
      global = this,
      GLOBAL = this;
  var OpaqueToken = (function() {
    function OpaqueToken(_desc) {
      this._desc = _desc;
    }
    OpaqueToken.prototype.toString = function() {
      return "Token " + this._desc;
    };
    return OpaqueToken;
  }());
  exports.OpaqueToken = OpaqueToken;
  return module.exports;
});

System.registerDynamic("@angular/core/src/di.js", ["./di/metadata", "./di/decorators", "./di/forward_ref", "./di/injector", "./di/reflective_injector", "./di/provider", "./di/reflective_provider", "./di/reflective_key", "./di/reflective_exceptions", "./di/opaque_token"], true, function($__require, exports, module) {
  "use strict";
  ;
  var define,
      global = this,
      GLOBAL = this;
  function __export(m) {
    for (var p in m)
      if (!exports.hasOwnProperty(p))
        exports[p] = m[p];
  }
  var metadata_1 = $__require('./di/metadata');
  exports.InjectMetadata = metadata_1.InjectMetadata;
  exports.OptionalMetadata = metadata_1.OptionalMetadata;
  exports.InjectableMetadata = metadata_1.InjectableMetadata;
  exports.SelfMetadata = metadata_1.SelfMetadata;
  exports.HostMetadata = metadata_1.HostMetadata;
  exports.SkipSelfMetadata = metadata_1.SkipSelfMetadata;
  exports.DependencyMetadata = metadata_1.DependencyMetadata;
  __export($__require('./di/decorators'));
  var forward_ref_1 = $__require('./di/forward_ref');
  exports.forwardRef = forward_ref_1.forwardRef;
  exports.resolveForwardRef = forward_ref_1.resolveForwardRef;
  var injector_1 = $__require('./di/injector');
  exports.Injector = injector_1.Injector;
  var reflective_injector_1 = $__require('./di/reflective_injector');
  exports.ReflectiveInjector = reflective_injector_1.ReflectiveInjector;
  var provider_1 = $__require('./di/provider');
  exports.Binding = provider_1.Binding;
  exports.ProviderBuilder = provider_1.ProviderBuilder;
  exports.bind = provider_1.bind;
  exports.Provider = provider_1.Provider;
  exports.provide = provider_1.provide;
  var reflective_provider_1 = $__require('./di/reflective_provider');
  exports.ResolvedReflectiveFactory = reflective_provider_1.ResolvedReflectiveFactory;
  exports.ReflectiveDependency = reflective_provider_1.ReflectiveDependency;
  var reflective_key_1 = $__require('./di/reflective_key');
  exports.ReflectiveKey = reflective_key_1.ReflectiveKey;
  var reflective_exceptions_1 = $__require('./di/reflective_exceptions');
  exports.NoProviderError = reflective_exceptions_1.NoProviderError;
  exports.AbstractProviderError = reflective_exceptions_1.AbstractProviderError;
  exports.CyclicDependencyError = reflective_exceptions_1.CyclicDependencyError;
  exports.InstantiationError = reflective_exceptions_1.InstantiationError;
  exports.InvalidProviderError = reflective_exceptions_1.InvalidProviderError;
  exports.NoAnnotationError = reflective_exceptions_1.NoAnnotationError;
  exports.OutOfBoundsError = reflective_exceptions_1.OutOfBoundsError;
  var opaque_token_1 = $__require('./di/opaque_token');
  exports.OpaqueToken = opaque_token_1.OpaqueToken;
  return module.exports;
});

System.registerDynamic("@angular/core/src/application_tokens.js", ["./di", "../src/facade/lang"], true, function($__require, exports, module) {
  "use strict";
  ;
  var define,
      global = this,
      GLOBAL = this;
  var di_1 = $__require('./di');
  var lang_1 = $__require('../src/facade/lang');
  exports.APP_ID = new di_1.OpaqueToken('AppId');
  function _appIdRandomProviderFactory() {
    return "" + _randomChar() + _randomChar() + _randomChar();
  }
  exports.APP_ID_RANDOM_PROVIDER = {
    provide: exports.APP_ID,
    useFactory: _appIdRandomProviderFactory,
    deps: []
  };
  function _randomChar() {
    return lang_1.StringWrapper.fromCharCode(97 + lang_1.Math.floor(lang_1.Math.random() * 25));
  }
  exports.PLATFORM_INITIALIZER = new di_1.OpaqueToken("Platform Initializer");
  exports.APP_INITIALIZER = new di_1.OpaqueToken("Application Initializer");
  exports.PACKAGE_ROOT_URL = new di_1.OpaqueToken("Application Packages Root URL");
  return module.exports;
});

System.registerDynamic("@angular/core/src/linker/view_utils.js", ["../security", "../../src/facade/lang", "../../src/facade/collection", "../../src/facade/exceptions", "./element", "./exceptions", "../change_detection/change_detection", "../render/api", "../application_tokens", "../di/decorators", "../change_detection/change_detection_util"], true, function($__require, exports, module) {
  "use strict";
  ;
  var define,
      global = this,
      GLOBAL = this;
  var security_1 = $__require('../security');
  var lang_1 = $__require('../../src/facade/lang');
  var collection_1 = $__require('../../src/facade/collection');
  var exceptions_1 = $__require('../../src/facade/exceptions');
  var element_1 = $__require('./element');
  var exceptions_2 = $__require('./exceptions');
  var change_detection_1 = $__require('../change_detection/change_detection');
  var api_1 = $__require('../render/api');
  var application_tokens_1 = $__require('../application_tokens');
  var decorators_1 = $__require('../di/decorators');
  var change_detection_util_1 = $__require('../change_detection/change_detection_util');
  var ViewUtils = (function() {
    function ViewUtils(_renderer, _appId, sanitizer) {
      this._renderer = _renderer;
      this._appId = _appId;
      this._nextCompTypeId = 0;
      this.sanitizer = sanitizer;
    }
    ViewUtils.prototype.createRenderComponentType = function(templateUrl, slotCount, encapsulation, styles) {
      return new api_1.RenderComponentType(this._appId + "-" + this._nextCompTypeId++, templateUrl, slotCount, encapsulation, styles);
    };
    ViewUtils.prototype.renderComponent = function(renderComponentType) {
      return this._renderer.renderComponent(renderComponentType);
    };
    ViewUtils.decorators = [{type: decorators_1.Injectable}];
    ViewUtils.ctorParameters = [{type: api_1.RootRenderer}, {
      type: undefined,
      decorators: [{
        type: decorators_1.Inject,
        args: [application_tokens_1.APP_ID]
      }]
    }, {type: security_1.SanitizationService}];
    return ViewUtils;
  }());
  exports.ViewUtils = ViewUtils;
  function flattenNestedViewRenderNodes(nodes) {
    return _flattenNestedViewRenderNodes(nodes, []);
  }
  exports.flattenNestedViewRenderNodes = flattenNestedViewRenderNodes;
  function _flattenNestedViewRenderNodes(nodes, renderNodes) {
    for (var i = 0; i < nodes.length; i++) {
      var node = nodes[i];
      if (node instanceof element_1.AppElement) {
        var appEl = node;
        renderNodes.push(appEl.nativeElement);
        if (lang_1.isPresent(appEl.nestedViews)) {
          for (var k = 0; k < appEl.nestedViews.length; k++) {
            _flattenNestedViewRenderNodes(appEl.nestedViews[k].rootNodesOrAppElements, renderNodes);
          }
        }
      } else {
        renderNodes.push(node);
      }
    }
    return renderNodes;
  }
  var EMPTY_ARR = [];
  function ensureSlotCount(projectableNodes, expectedSlotCount) {
    var res;
    if (lang_1.isBlank(projectableNodes)) {
      res = EMPTY_ARR;
    } else if (projectableNodes.length < expectedSlotCount) {
      var givenSlotCount = projectableNodes.length;
      res = collection_1.ListWrapper.createFixedSize(expectedSlotCount);
      for (var i = 0; i < expectedSlotCount; i++) {
        res[i] = (i < givenSlotCount) ? projectableNodes[i] : EMPTY_ARR;
      }
    } else {
      res = projectableNodes;
    }
    return res;
  }
  exports.ensureSlotCount = ensureSlotCount;
  exports.MAX_INTERPOLATION_VALUES = 9;
  function interpolate(valueCount, c0, a1, c1, a2, c2, a3, c3, a4, c4, a5, c5, a6, c6, a7, c7, a8, c8, a9, c9) {
    switch (valueCount) {
      case 1:
        return c0 + _toStringWithNull(a1) + c1;
      case 2:
        return c0 + _toStringWithNull(a1) + c1 + _toStringWithNull(a2) + c2;
      case 3:
        return c0 + _toStringWithNull(a1) + c1 + _toStringWithNull(a2) + c2 + _toStringWithNull(a3) + c3;
      case 4:
        return c0 + _toStringWithNull(a1) + c1 + _toStringWithNull(a2) + c2 + _toStringWithNull(a3) + c3 + _toStringWithNull(a4) + c4;
      case 5:
        return c0 + _toStringWithNull(a1) + c1 + _toStringWithNull(a2) + c2 + _toStringWithNull(a3) + c3 + _toStringWithNull(a4) + c4 + _toStringWithNull(a5) + c5;
      case 6:
        return c0 + _toStringWithNull(a1) + c1 + _toStringWithNull(a2) + c2 + _toStringWithNull(a3) + c3 + _toStringWithNull(a4) + c4 + _toStringWithNull(a5) + c5 + _toStringWithNull(a6) + c6;
      case 7:
        return c0 + _toStringWithNull(a1) + c1 + _toStringWithNull(a2) + c2 + _toStringWithNull(a3) + c3 + _toStringWithNull(a4) + c4 + _toStringWithNull(a5) + c5 + _toStringWithNull(a6) + c6 + _toStringWithNull(a7) + c7;
      case 8:
        return c0 + _toStringWithNull(a1) + c1 + _toStringWithNull(a2) + c2 + _toStringWithNull(a3) + c3 + _toStringWithNull(a4) + c4 + _toStringWithNull(a5) + c5 + _toStringWithNull(a6) + c6 + _toStringWithNull(a7) + c7 + _toStringWithNull(a8) + c8;
      case 9:
        return c0 + _toStringWithNull(a1) + c1 + _toStringWithNull(a2) + c2 + _toStringWithNull(a3) + c3 + _toStringWithNull(a4) + c4 + _toStringWithNull(a5) + c5 + _toStringWithNull(a6) + c6 + _toStringWithNull(a7) + c7 + _toStringWithNull(a8) + c8 + _toStringWithNull(a9) + c9;
      default:
        throw new exceptions_1.BaseException("Does not support more than 9 expressions");
    }
  }
  exports.interpolate = interpolate;
  function _toStringWithNull(v) {
    return v != null ? v.toString() : '';
  }
  function checkBinding(throwOnChange, oldValue, newValue) {
    if (throwOnChange) {
      if (!change_detection_1.devModeEqual(oldValue, newValue)) {
        throw new exceptions_2.ExpressionChangedAfterItHasBeenCheckedException(oldValue, newValue, null);
      }
      return false;
    } else {
      return !lang_1.looseIdentical(oldValue, newValue);
    }
  }
  exports.checkBinding = checkBinding;
  function arrayLooseIdentical(a, b) {
    if (a.length != b.length)
      return false;
    for (var i = 0; i < a.length; ++i) {
      if (!lang_1.looseIdentical(a[i], b[i]))
        return false;
    }
    return true;
  }
  exports.arrayLooseIdentical = arrayLooseIdentical;
  function mapLooseIdentical(m1, m2) {
    var k1 = collection_1.StringMapWrapper.keys(m1);
    var k2 = collection_1.StringMapWrapper.keys(m2);
    if (k1.length != k2.length) {
      return false;
    }
    var key;
    for (var i = 0; i < k1.length; i++) {
      key = k1[i];
      if (!lang_1.looseIdentical(m1[key], m2[key])) {
        return false;
      }
    }
    return true;
  }
  exports.mapLooseIdentical = mapLooseIdentical;
  function castByValue(input, value) {
    return input;
  }
  exports.castByValue = castByValue;
  exports.EMPTY_ARRAY = [];
  exports.EMPTY_MAP = {};
  function pureProxy1(fn) {
    var result;
    var v0;
    v0 = change_detection_util_1.uninitialized;
    return function(p0) {
      if (!lang_1.looseIdentical(v0, p0)) {
        v0 = p0;
        result = fn(p0);
      }
      return result;
    };
  }
  exports.pureProxy1 = pureProxy1;
  function pureProxy2(fn) {
    var result;
    var v0,
        v1;
    v0 = v1 = change_detection_util_1.uninitialized;
    return function(p0, p1) {
      if (!lang_1.looseIdentical(v0, p0) || !lang_1.looseIdentical(v1, p1)) {
        v0 = p0;
        v1 = p1;
        result = fn(p0, p1);
      }
      return result;
    };
  }
  exports.pureProxy2 = pureProxy2;
  function pureProxy3(fn) {
    var result;
    var v0,
        v1,
        v2;
    v0 = v1 = v2 = change_detection_util_1.uninitialized;
    return function(p0, p1, p2) {
      if (!lang_1.looseIdentical(v0, p0) || !lang_1.looseIdentical(v1, p1) || !lang_1.looseIdentical(v2, p2)) {
        v0 = p0;
        v1 = p1;
        v2 = p2;
        result = fn(p0, p1, p2);
      }
      return result;
    };
  }
  exports.pureProxy3 = pureProxy3;
  function pureProxy4(fn) {
    var result;
    var v0,
        v1,
        v2,
        v3;
    v0 = v1 = v2 = v3 = change_detection_util_1.uninitialized;
    return function(p0, p1, p2, p3) {
      if (!lang_1.looseIdentical(v0, p0) || !lang_1.looseIdentical(v1, p1) || !lang_1.looseIdentical(v2, p2) || !lang_1.looseIdentical(v3, p3)) {
        v0 = p0;
        v1 = p1;
        v2 = p2;
        v3 = p3;
        result = fn(p0, p1, p2, p3);
      }
      return result;
    };
  }
  exports.pureProxy4 = pureProxy4;
  function pureProxy5(fn) {
    var result;
    var v0,
        v1,
        v2,
        v3,
        v4;
    v0 = v1 = v2 = v3 = v4 = change_detection_util_1.uninitialized;
    return function(p0, p1, p2, p3, p4) {
      if (!lang_1.looseIdentical(v0, p0) || !lang_1.looseIdentical(v1, p1) || !lang_1.looseIdentical(v2, p2) || !lang_1.looseIdentical(v3, p3) || !lang_1.looseIdentical(v4, p4)) {
        v0 = p0;
        v1 = p1;
        v2 = p2;
        v3 = p3;
        v4 = p4;
        result = fn(p0, p1, p2, p3, p4);
      }
      return result;
    };
  }
  exports.pureProxy5 = pureProxy5;
  function pureProxy6(fn) {
    var result;
    var v0,
        v1,
        v2,
        v3,
        v4,
        v5;
    v0 = v1 = v2 = v3 = v4 = v5 = change_detection_util_1.uninitialized;
    return function(p0, p1, p2, p3, p4, p5) {
      if (!lang_1.looseIdentical(v0, p0) || !lang_1.looseIdentical(v1, p1) || !lang_1.looseIdentical(v2, p2) || !lang_1.looseIdentical(v3, p3) || !lang_1.looseIdentical(v4, p4) || !lang_1.looseIdentical(v5, p5)) {
        v0 = p0;
        v1 = p1;
        v2 = p2;
        v3 = p3;
        v4 = p4;
        v5 = p5;
        result = fn(p0, p1, p2, p3, p4, p5);
      }
      return result;
    };
  }
  exports.pureProxy6 = pureProxy6;
  function pureProxy7(fn) {
    var result;
    var v0,
        v1,
        v2,
        v3,
        v4,
        v5,
        v6;
    v0 = v1 = v2 = v3 = v4 = v5 = v6 = change_detection_util_1.uninitialized;
    return function(p0, p1, p2, p3, p4, p5, p6) {
      if (!lang_1.looseIdentical(v0, p0) || !lang_1.looseIdentical(v1, p1) || !lang_1.looseIdentical(v2, p2) || !lang_1.looseIdentical(v3, p3) || !lang_1.looseIdentical(v4, p4) || !lang_1.looseIdentical(v5, p5) || !lang_1.looseIdentical(v6, p6)) {
        v0 = p0;
        v1 = p1;
        v2 = p2;
        v3 = p3;
        v4 = p4;
        v5 = p5;
        v6 = p6;
        result = fn(p0, p1, p2, p3, p4, p5, p6);
      }
      return result;
    };
  }
  exports.pureProxy7 = pureProxy7;
  function pureProxy8(fn) {
    var result;
    var v0,
        v1,
        v2,
        v3,
        v4,
        v5,
        v6,
        v7;
    v0 = v1 = v2 = v3 = v4 = v5 = v6 = v7 = change_detection_util_1.uninitialized;
    return function(p0, p1, p2, p3, p4, p5, p6, p7) {
      if (!lang_1.looseIdentical(v0, p0) || !lang_1.looseIdentical(v1, p1) || !lang_1.looseIdentical(v2, p2) || !lang_1.looseIdentical(v3, p3) || !lang_1.looseIdentical(v4, p4) || !lang_1.looseIdentical(v5, p5) || !lang_1.looseIdentical(v6, p6) || !lang_1.looseIdentical(v7, p7)) {
        v0 = p0;
        v1 = p1;
        v2 = p2;
        v3 = p3;
        v4 = p4;
        v5 = p5;
        v6 = p6;
        v7 = p7;
        result = fn(p0, p1, p2, p3, p4, p5, p6, p7);
      }
      return result;
    };
  }
  exports.pureProxy8 = pureProxy8;
  function pureProxy9(fn) {
    var result;
    var v0,
        v1,
        v2,
        v3,
        v4,
        v5,
        v6,
        v7,
        v8;
    v0 = v1 = v2 = v3 = v4 = v5 = v6 = v7 = v8 = change_detection_util_1.uninitialized;
    return function(p0, p1, p2, p3, p4, p5, p6, p7, p8) {
      if (!lang_1.looseIdentical(v0, p0) || !lang_1.looseIdentical(v1, p1) || !lang_1.looseIdentical(v2, p2) || !lang_1.looseIdentical(v3, p3) || !lang_1.looseIdentical(v4, p4) || !lang_1.looseIdentical(v5, p5) || !lang_1.looseIdentical(v6, p6) || !lang_1.looseIdentical(v7, p7) || !lang_1.looseIdentical(v8, p8)) {
        v0 = p0;
        v1 = p1;
        v2 = p2;
        v3 = p3;
        v4 = p4;
        v5 = p5;
        v6 = p6;
        v7 = p7;
        v8 = p8;
        result = fn(p0, p1, p2, p3, p4, p5, p6, p7, p8);
      }
      return result;
    };
  }
  exports.pureProxy9 = pureProxy9;
  function pureProxy10(fn) {
    var result;
    var v0,
        v1,
        v2,
        v3,
        v4,
        v5,
        v6,
        v7,
        v8,
        v9;
    v0 = v1 = v2 = v3 = v4 = v5 = v6 = v7 = v8 = v9 = change_detection_util_1.uninitialized;
    return function(p0, p1, p2, p3, p4, p5, p6, p7, p8, p9) {
      if (!lang_1.looseIdentical(v0, p0) || !lang_1.looseIdentical(v1, p1) || !lang_1.looseIdentical(v2, p2) || !lang_1.looseIdentical(v3, p3) || !lang_1.looseIdentical(v4, p4) || !lang_1.looseIdentical(v5, p5) || !lang_1.looseIdentical(v6, p6) || !lang_1.looseIdentical(v7, p7) || !lang_1.looseIdentical(v8, p8) || !lang_1.looseIdentical(v9, p9)) {
        v0 = p0;
        v1 = p1;
        v2 = p2;
        v3 = p3;
        v4 = p4;
        v5 = p5;
        v6 = p6;
        v7 = p7;
        v8 = p8;
        v9 = p9;
        result = fn(p0, p1, p2, p3, p4, p5, p6, p7, p8, p9);
      }
      return result;
    };
  }
  exports.pureProxy10 = pureProxy10;
  return module.exports;
});

System.registerDynamic("@angular/core/src/metadata/view.js", [], true, function($__require, exports, module) {
  "use strict";
  ;
  var define,
      global = this,
      GLOBAL = this;
  (function(ViewEncapsulation) {
    ViewEncapsulation[ViewEncapsulation["Emulated"] = 0] = "Emulated";
    ViewEncapsulation[ViewEncapsulation["Native"] = 1] = "Native";
    ViewEncapsulation[ViewEncapsulation["None"] = 2] = "None";
  })(exports.ViewEncapsulation || (exports.ViewEncapsulation = {}));
  var ViewEncapsulation = exports.ViewEncapsulation;
  exports.VIEW_ENCAPSULATION_VALUES = [ViewEncapsulation.Emulated, ViewEncapsulation.Native, ViewEncapsulation.None];
  var ViewMetadata = (function() {
    function ViewMetadata(_a) {
      var _b = _a === void 0 ? {} : _a,
          templateUrl = _b.templateUrl,
          template = _b.template,
          directives = _b.directives,
          pipes = _b.pipes,
          encapsulation = _b.encapsulation,
          styles = _b.styles,
          styleUrls = _b.styleUrls;
      this.templateUrl = templateUrl;
      this.template = template;
      this.styleUrls = styleUrls;
      this.styles = styles;
      this.directives = directives;
      this.pipes = pipes;
      this.encapsulation = encapsulation;
    }
    return ViewMetadata;
  }());
  exports.ViewMetadata = ViewMetadata;
  return module.exports;
});

System.registerDynamic("@angular/core/src/linker/view_type.js", [], true, function($__require, exports, module) {
  "use strict";
  ;
  var define,
      global = this,
      GLOBAL = this;
  (function(ViewType) {
    ViewType[ViewType["HOST"] = 0] = "HOST";
    ViewType[ViewType["COMPONENT"] = 1] = "COMPONENT";
    ViewType[ViewType["EMBEDDED"] = 2] = "EMBEDDED";
  })(exports.ViewType || (exports.ViewType = {}));
  var ViewType = exports.ViewType;
  return module.exports;
});

System.registerDynamic("@angular/core/src/linker/debug_context.js", ["../../src/facade/lang", "../../src/facade/collection", "./view_type"], true, function($__require, exports, module) {
  "use strict";
  ;
  var define,
      global = this,
      GLOBAL = this;
  var lang_1 = $__require('../../src/facade/lang');
  var collection_1 = $__require('../../src/facade/collection');
  var view_type_1 = $__require('./view_type');
  var StaticNodeDebugInfo = (function() {
    function StaticNodeDebugInfo(providerTokens, componentToken, refTokens) {
      this.providerTokens = providerTokens;
      this.componentToken = componentToken;
      this.refTokens = refTokens;
    }
    return StaticNodeDebugInfo;
  }());
  exports.StaticNodeDebugInfo = StaticNodeDebugInfo;
  var DebugContext = (function() {
    function DebugContext(_view, _nodeIndex, _tplRow, _tplCol) {
      this._view = _view;
      this._nodeIndex = _nodeIndex;
      this._tplRow = _tplRow;
      this._tplCol = _tplCol;
    }
    Object.defineProperty(DebugContext.prototype, "_staticNodeInfo", {
      get: function() {
        return lang_1.isPresent(this._nodeIndex) ? this._view.staticNodeDebugInfos[this._nodeIndex] : null;
      },
      enumerable: true,
      configurable: true
    });
    Object.defineProperty(DebugContext.prototype, "context", {
      get: function() {
        return this._view.context;
      },
      enumerable: true,
      configurable: true
    });
    Object.defineProperty(DebugContext.prototype, "component", {
      get: function() {
        var staticNodeInfo = this._staticNodeInfo;
        if (lang_1.isPresent(staticNodeInfo) && lang_1.isPresent(staticNodeInfo.componentToken)) {
          return this.injector.get(staticNodeInfo.componentToken);
        }
        return null;
      },
      enumerable: true,
      configurable: true
    });
    Object.defineProperty(DebugContext.prototype, "componentRenderElement", {
      get: function() {
        var componentView = this._view;
        while (lang_1.isPresent(componentView.declarationAppElement) && componentView.type !== view_type_1.ViewType.COMPONENT) {
          componentView = componentView.declarationAppElement.parentView;
        }
        return lang_1.isPresent(componentView.declarationAppElement) ? componentView.declarationAppElement.nativeElement : null;
      },
      enumerable: true,
      configurable: true
    });
    Object.defineProperty(DebugContext.prototype, "injector", {
      get: function() {
        return this._view.injector(this._nodeIndex);
      },
      enumerable: true,
      configurable: true
    });
    Object.defineProperty(DebugContext.prototype, "renderNode", {
      get: function() {
        if (lang_1.isPresent(this._nodeIndex) && lang_1.isPresent(this._view.allNodes)) {
          return this._view.allNodes[this._nodeIndex];
        } else {
          return null;
        }
      },
      enumerable: true,
      configurable: true
    });
    Object.defineProperty(DebugContext.prototype, "providerTokens", {
      get: function() {
        var staticNodeInfo = this._staticNodeInfo;
        return lang_1.isPresent(staticNodeInfo) ? staticNodeInfo.providerTokens : null;
      },
      enumerable: true,
      configurable: true
    });
    Object.defineProperty(DebugContext.prototype, "source", {
      get: function() {
        return this._view.componentType.templateUrl + ":" + this._tplRow + ":" + this._tplCol;
      },
      enumerable: true,
      configurable: true
    });
    Object.defineProperty(DebugContext.prototype, "references", {
      get: function() {
        var _this = this;
        var varValues = {};
        var staticNodeInfo = this._staticNodeInfo;
        if (lang_1.isPresent(staticNodeInfo)) {
          var refs = staticNodeInfo.refTokens;
          collection_1.StringMapWrapper.forEach(refs, function(refToken, refName) {
            var varValue;
            if (lang_1.isBlank(refToken)) {
              varValue = lang_1.isPresent(_this._view.allNodes) ? _this._view.allNodes[_this._nodeIndex] : null;
            } else {
              varValue = _this._view.injectorGet(refToken, _this._nodeIndex, null);
            }
            varValues[refName] = varValue;
          });
        }
        return varValues;
      },
      enumerable: true,
      configurable: true
    });
    return DebugContext;
  }());
  exports.DebugContext = DebugContext;
  return module.exports;
});

System.registerDynamic("@angular/core/src/change_detection/change_detection_util.js", ["../../src/facade/lang", "../../src/facade/collection"], true, function($__require, exports, module) {
  "use strict";
  ;
  var define,
      global = this,
      GLOBAL = this;
  var lang_1 = $__require('../../src/facade/lang');
  var collection_1 = $__require('../../src/facade/collection');
  var lang_2 = $__require('../../src/facade/lang');
  exports.looseIdentical = lang_2.looseIdentical;
  exports.uninitialized = new Object();
  function devModeEqual(a, b) {
    if (collection_1.isListLikeIterable(a) && collection_1.isListLikeIterable(b)) {
      return collection_1.areIterablesEqual(a, b, devModeEqual);
    } else if (!collection_1.isListLikeIterable(a) && !lang_1.isPrimitive(a) && !collection_1.isListLikeIterable(b) && !lang_1.isPrimitive(b)) {
      return true;
    } else {
      return lang_1.looseIdentical(a, b);
    }
  }
  exports.devModeEqual = devModeEqual;
  var WrappedValue = (function() {
    function WrappedValue(wrapped) {
      this.wrapped = wrapped;
    }
    WrappedValue.wrap = function(value) {
      return new WrappedValue(value);
    };
    return WrappedValue;
  }());
  exports.WrappedValue = WrappedValue;
  var ValueUnwrapper = (function() {
    function ValueUnwrapper() {
      this.hasWrappedValue = false;
    }
    ValueUnwrapper.prototype.unwrap = function(value) {
      if (value instanceof WrappedValue) {
        this.hasWrappedValue = true;
        return value.wrapped;
      }
      return value;
    };
    ValueUnwrapper.prototype.reset = function() {
      this.hasWrappedValue = false;
    };
    return ValueUnwrapper;
  }());
  exports.ValueUnwrapper = ValueUnwrapper;
  var SimpleChange = (function() {
    function SimpleChange(previousValue, currentValue) {
      this.previousValue = previousValue;
      this.currentValue = currentValue;
    }
    SimpleChange.prototype.isFirstChange = function() {
      return this.previousValue === exports.uninitialized;
    };
    return SimpleChange;
  }());
  exports.SimpleChange = SimpleChange;
  return module.exports;
});

System.registerDynamic("@angular/core/src/render/api.js", ["../../src/facade/exceptions"], true, function($__require, exports, module) {
  "use strict";
  ;
  var define,
      global = this,
      GLOBAL = this;
  var exceptions_1 = $__require('../../src/facade/exceptions');
  var RenderComponentType = (function() {
    function RenderComponentType(id, templateUrl, slotCount, encapsulation, styles) {
      this.id = id;
      this.templateUrl = templateUrl;
      this.slotCount = slotCount;
      this.encapsulation = encapsulation;
      this.styles = styles;
    }
    return RenderComponentType;
  }());
  exports.RenderComponentType = RenderComponentType;
  var RenderDebugInfo = (function() {
    function RenderDebugInfo() {}
    Object.defineProperty(RenderDebugInfo.prototype, "injector", {
      get: function() {
        return exceptions_1.unimplemented();
      },
      enumerable: true,
      configurable: true
    });
    Object.defineProperty(RenderDebugInfo.prototype, "component", {
      get: function() {
        return exceptions_1.unimplemented();
      },
      enumerable: true,
      configurable: true
    });
    Object.defineProperty(RenderDebugInfo.prototype, "providerTokens", {
      get: function() {
        return exceptions_1.unimplemented();
      },
      enumerable: true,
      configurable: true
    });
    Object.defineProperty(RenderDebugInfo.prototype, "references", {
      get: function() {
        return exceptions_1.unimplemented();
      },
      enumerable: true,
      configurable: true
    });
    Object.defineProperty(RenderDebugInfo.prototype, "context", {
      get: function() {
        return exceptions_1.unimplemented();
      },
      enumerable: true,
      configurable: true
    });
    Object.defineProperty(RenderDebugInfo.prototype, "source", {
      get: function() {
        return exceptions_1.unimplemented();
      },
      enumerable: true,
      configurable: true
    });
    return RenderDebugInfo;
  }());
  exports.RenderDebugInfo = RenderDebugInfo;
  var Renderer = (function() {
    function Renderer() {}
    return Renderer;
  }());
  exports.Renderer = Renderer;
  var RootRenderer = (function() {
    function RootRenderer() {}
    return RootRenderer;
  }());
  exports.RootRenderer = RootRenderer;
  return module.exports;
});

System.registerDynamic("@angular/core/src/linker/template_ref.js", ["../facade/lang"], true, function($__require, exports, module) {
  "use strict";
  ;
  var define,
      global = this,
      GLOBAL = this;
  var __extends = (this && this.__extends) || function(d, b) {
    for (var p in b)
      if (b.hasOwnProperty(p))
        d[p] = b[p];
    function __() {
      this.constructor = d;
    }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
  };
  var lang_1 = $__require('../facade/lang');
  var EMPTY_CONTEXT = new Object();
  var TemplateRef = (function() {
    function TemplateRef() {}
    Object.defineProperty(TemplateRef.prototype, "elementRef", {
      get: function() {
        return null;
      },
      enumerable: true,
      configurable: true
    });
    return TemplateRef;
  }());
  exports.TemplateRef = TemplateRef;
  var TemplateRef_ = (function(_super) {
    __extends(TemplateRef_, _super);
    function TemplateRef_(_appElement, _viewFactory) {
      _super.call(this);
      this._appElement = _appElement;
      this._viewFactory = _viewFactory;
    }
    TemplateRef_.prototype.createEmbeddedView = function(context) {
      var view = this._viewFactory(this._appElement.parentView.viewUtils, this._appElement.parentInjector, this._appElement);
      if (lang_1.isBlank(context)) {
        context = EMPTY_CONTEXT;
      }
      view.create(context, null, null);
      return view.ref;
    };
    Object.defineProperty(TemplateRef_.prototype, "elementRef", {
      get: function() {
        return this._appElement.elementRef;
      },
      enumerable: true,
      configurable: true
    });
    return TemplateRef_;
  }(TemplateRef));
  exports.TemplateRef_ = TemplateRef_;
  return module.exports;
});

System.registerDynamic("@angular/core/src/profile/wtf_init.js", [], true, function($__require, exports, module) {
  "use strict";
  ;
  var define,
      global = this,
      GLOBAL = this;
  function wtfInit() {}
  exports.wtfInit = wtfInit;
  return module.exports;
});

System.registerDynamic("@angular/core/src/reflection/reflection_capabilities.js", ["../../src/facade/lang", "../../src/facade/exceptions"], true, function($__require, exports, module) {
  "use strict";
  ;
  var define,
      global = this,
      GLOBAL = this;
  var lang_1 = $__require('../../src/facade/lang');
  var exceptions_1 = $__require('../../src/facade/exceptions');
  var ReflectionCapabilities = (function() {
    function ReflectionCapabilities(reflect) {
      this._reflect = lang_1.isPresent(reflect) ? reflect : lang_1.global.Reflect;
    }
    ReflectionCapabilities.prototype.isReflectionEnabled = function() {
      return true;
    };
    ReflectionCapabilities.prototype.factory = function(t) {
      switch (t.length) {
        case 0:
          return function() {
            return new t();
          };
        case 1:
          return function(a1) {
            return new t(a1);
          };
        case 2:
          return function(a1, a2) {
            return new t(a1, a2);
          };
        case 3:
          return function(a1, a2, a3) {
            return new t(a1, a2, a3);
          };
        case 4:
          return function(a1, a2, a3, a4) {
            return new t(a1, a2, a3, a4);
          };
        case 5:
          return function(a1, a2, a3, a4, a5) {
            return new t(a1, a2, a3, a4, a5);
          };
        case 6:
          return function(a1, a2, a3, a4, a5, a6) {
            return new t(a1, a2, a3, a4, a5, a6);
          };
        case 7:
          return function(a1, a2, a3, a4, a5, a6, a7) {
            return new t(a1, a2, a3, a4, a5, a6, a7);
          };
        case 8:
          return function(a1, a2, a3, a4, a5, a6, a7, a8) {
            return new t(a1, a2, a3, a4, a5, a6, a7, a8);
          };
        case 9:
          return function(a1, a2, a3, a4, a5, a6, a7, a8, a9) {
            return new t(a1, a2, a3, a4, a5, a6, a7, a8, a9);
          };
        case 10:
          return function(a1, a2, a3, a4, a5, a6, a7, a8, a9, a10) {
            return new t(a1, a2, a3, a4, a5, a6, a7, a8, a9, a10);
          };
        case 11:
          return function(a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11) {
            return new t(a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11);
          };
        case 12:
          return function(a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12) {
            return new t(a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12);
          };
        case 13:
          return function(a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12, a13) {
            return new t(a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12, a13);
          };
        case 14:
          return function(a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12, a13, a14) {
            return new t(a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12, a13, a14);
          };
        case 15:
          return function(a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12, a13, a14, a15) {
            return new t(a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12, a13, a14, a15);
          };
        case 16:
          return function(a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12, a13, a14, a15, a16) {
            return new t(a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12, a13, a14, a15, a16);
          };
        case 17:
          return function(a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12, a13, a14, a15, a16, a17) {
            return new t(a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12, a13, a14, a15, a16, a17);
          };
        case 18:
          return function(a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12, a13, a14, a15, a16, a17, a18) {
            return new t(a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12, a13, a14, a15, a16, a17, a18);
          };
        case 19:
          return function(a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12, a13, a14, a15, a16, a17, a18, a19) {
            return new t(a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12, a13, a14, a15, a16, a17, a18, a19);
          };
        case 20:
          return function(a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12, a13, a14, a15, a16, a17, a18, a19, a20) {
            return new t(a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12, a13, a14, a15, a16, a17, a18, a19, a20);
          };
      }
      ;
      throw new Error("Cannot create a factory for '" + lang_1.stringify(t) + "' because its constructor has more than 20 arguments");
    };
    ReflectionCapabilities.prototype._zipTypesAndAnnotations = function(paramTypes, paramAnnotations) {
      var result;
      if (typeof paramTypes === 'undefined') {
        result = new Array(paramAnnotations.length);
      } else {
        result = new Array(paramTypes.length);
      }
      for (var i = 0; i < result.length; i++) {
        if (typeof paramTypes === 'undefined') {
          result[i] = [];
        } else if (paramTypes[i] != Object) {
          result[i] = [paramTypes[i]];
        } else {
          result[i] = [];
        }
        if (lang_1.isPresent(paramAnnotations) && lang_1.isPresent(paramAnnotations[i])) {
          result[i] = result[i].concat(paramAnnotations[i]);
        }
      }
      return result;
    };
    ReflectionCapabilities.prototype.parameters = function(typeOrFunc) {
      if (lang_1.isPresent(typeOrFunc.parameters)) {
        return typeOrFunc.parameters;
      }
      if (lang_1.isPresent(typeOrFunc.ctorParameters)) {
        var ctorParameters = typeOrFunc.ctorParameters;
        var paramTypes_1 = ctorParameters.map(function(ctorParam) {
          return ctorParam && ctorParam.type;
        });
        var paramAnnotations_1 = ctorParameters.map(function(ctorParam) {
          return ctorParam && convertTsickleDecoratorIntoMetadata(ctorParam.decorators);
        });
        return this._zipTypesAndAnnotations(paramTypes_1, paramAnnotations_1);
      }
      if (lang_1.isPresent(this._reflect) && lang_1.isPresent(this._reflect.getMetadata)) {
        var paramAnnotations = this._reflect.getMetadata('parameters', typeOrFunc);
        var paramTypes = this._reflect.getMetadata('design:paramtypes', typeOrFunc);
        if (lang_1.isPresent(paramTypes) || lang_1.isPresent(paramAnnotations)) {
          return this._zipTypesAndAnnotations(paramTypes, paramAnnotations);
        }
      }
      var parameters = new Array(typeOrFunc.length);
      parameters.fill(undefined);
      return parameters;
    };
    ReflectionCapabilities.prototype.annotations = function(typeOrFunc) {
      if (lang_1.isPresent(typeOrFunc.annotations)) {
        var annotations = typeOrFunc.annotations;
        if (lang_1.isFunction(annotations) && annotations.annotations) {
          annotations = annotations.annotations;
        }
        return annotations;
      }
      if (lang_1.isPresent(typeOrFunc.decorators)) {
        return convertTsickleDecoratorIntoMetadata(typeOrFunc.decorators);
      }
      if (lang_1.isPresent(this._reflect) && lang_1.isPresent(this._reflect.getMetadata)) {
        var annotations = this._reflect.getMetadata('annotations', typeOrFunc);
        if (lang_1.isPresent(annotations))
          return annotations;
      }
      return [];
    };
    ReflectionCapabilities.prototype.propMetadata = function(typeOrFunc) {
      if (lang_1.isPresent(typeOrFunc.propMetadata)) {
        var propMetadata = typeOrFunc.propMetadata;
        if (lang_1.isFunction(propMetadata) && propMetadata.propMetadata) {
          propMetadata = propMetadata.propMetadata;
        }
        return propMetadata;
      }
      if (lang_1.isPresent(typeOrFunc.propDecorators)) {
        var propDecorators_1 = typeOrFunc.propDecorators;
        var propMetadata_1 = {};
        Object.keys(propDecorators_1).forEach(function(prop) {
          propMetadata_1[prop] = convertTsickleDecoratorIntoMetadata(propDecorators_1[prop]);
        });
        return propMetadata_1;
      }
      if (lang_1.isPresent(this._reflect) && lang_1.isPresent(this._reflect.getMetadata)) {
        var propMetadata = this._reflect.getMetadata('propMetadata', typeOrFunc);
        if (lang_1.isPresent(propMetadata))
          return propMetadata;
      }
      return {};
    };
    ReflectionCapabilities.prototype.interfaces = function(type) {
      throw new exceptions_1.BaseException("JavaScript does not support interfaces");
    };
    ReflectionCapabilities.prototype.getter = function(name) {
      return new Function('o', 'return o.' + name + ';');
    };
    ReflectionCapabilities.prototype.setter = function(name) {
      return new Function('o', 'v', 'return o.' + name + ' = v;');
    };
    ReflectionCapabilities.prototype.method = function(name) {
      var functionBody = "if (!o." + name + ") throw new Error('\"" + name + "\" is undefined');\n        return o." + name + ".apply(o, args);";
      return new Function('o', 'args', functionBody);
    };
    ReflectionCapabilities.prototype.importUri = function(type) {
      return "./" + lang_1.stringify(type);
    };
    return ReflectionCapabilities;
  }());
  exports.ReflectionCapabilities = ReflectionCapabilities;
  function convertTsickleDecoratorIntoMetadata(decoratorInvocations) {
    if (!decoratorInvocations) {
      return [];
    }
    return decoratorInvocations.map(function(decoratorInvocation) {
      var decoratorType = decoratorInvocation.type;
      var annotationCls = decoratorType.annotationCls;
      var annotationArgs = decoratorInvocation.args ? decoratorInvocation.args : [];
      var annotation = Object.create(annotationCls.prototype);
      annotationCls.apply(annotation, annotationArgs);
      return annotation;
    });
  }
  return module.exports;
});

System.registerDynamic("@angular/core/src/debug/debug_node.js", ["../../src/facade/lang", "../../src/facade/collection"], true, function($__require, exports, module) {
  "use strict";
  ;
  var define,
      global = this,
      GLOBAL = this;
  var __extends = (this && this.__extends) || function(d, b) {
    for (var p in b)
      if (b.hasOwnProperty(p))
        d[p] = b[p];
    function __() {
      this.constructor = d;
    }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
  };
  var lang_1 = $__require('../../src/facade/lang');
  var collection_1 = $__require('../../src/facade/collection');
  var EventListener = (function() {
    function EventListener(name, callback) {
      this.name = name;
      this.callback = callback;
    }
    ;
    return EventListener;
  }());
  exports.EventListener = EventListener;
  var DebugNode = (function() {
    function DebugNode(nativeNode, parent, _debugInfo) {
      this._debugInfo = _debugInfo;
      this.nativeNode = nativeNode;
      if (lang_1.isPresent(parent) && parent instanceof DebugElement) {
        parent.addChild(this);
      } else {
        this.parent = null;
      }
      this.listeners = [];
    }
    Object.defineProperty(DebugNode.prototype, "injector", {
      get: function() {
        return lang_1.isPresent(this._debugInfo) ? this._debugInfo.injector : null;
      },
      enumerable: true,
      configurable: true
    });
    Object.defineProperty(DebugNode.prototype, "componentInstance", {
      get: function() {
        return lang_1.isPresent(this._debugInfo) ? this._debugInfo.component : null;
      },
      enumerable: true,
      configurable: true
    });
    Object.defineProperty(DebugNode.prototype, "context", {
      get: function() {
        return lang_1.isPresent(this._debugInfo) ? this._debugInfo.context : null;
      },
      enumerable: true,
      configurable: true
    });
    Object.defineProperty(DebugNode.prototype, "references", {
      get: function() {
        return lang_1.isPresent(this._debugInfo) ? this._debugInfo.references : null;
      },
      enumerable: true,
      configurable: true
    });
    Object.defineProperty(DebugNode.prototype, "providerTokens", {
      get: function() {
        return lang_1.isPresent(this._debugInfo) ? this._debugInfo.providerTokens : null;
      },
      enumerable: true,
      configurable: true
    });
    Object.defineProperty(DebugNode.prototype, "source", {
      get: function() {
        return lang_1.isPresent(this._debugInfo) ? this._debugInfo.source : null;
      },
      enumerable: true,
      configurable: true
    });
    DebugNode.prototype.inject = function(token) {
      return this.injector.get(token);
    };
    return DebugNode;
  }());
  exports.DebugNode = DebugNode;
  var DebugElement = (function(_super) {
    __extends(DebugElement, _super);
    function DebugElement(nativeNode, parent, _debugInfo) {
      _super.call(this, nativeNode, parent, _debugInfo);
      this.properties = {};
      this.attributes = {};
      this.childNodes = [];
      this.nativeElement = nativeNode;
    }
    DebugElement.prototype.addChild = function(child) {
      if (lang_1.isPresent(child)) {
        this.childNodes.push(child);
        child.parent = this;
      }
    };
    DebugElement.prototype.removeChild = function(child) {
      var childIndex = this.childNodes.indexOf(child);
      if (childIndex !== -1) {
        child.parent = null;
        this.childNodes.splice(childIndex, 1);
      }
    };
    DebugElement.prototype.insertChildrenAfter = function(child, newChildren) {
      var siblingIndex = this.childNodes.indexOf(child);
      if (siblingIndex !== -1) {
        var previousChildren = this.childNodes.slice(0, siblingIndex + 1);
        var nextChildren = this.childNodes.slice(siblingIndex + 1);
        this.childNodes = collection_1.ListWrapper.concat(collection_1.ListWrapper.concat(previousChildren, newChildren), nextChildren);
        for (var i = 0; i < newChildren.length; ++i) {
          var newChild = newChildren[i];
          if (lang_1.isPresent(newChild.parent)) {
            newChild.parent.removeChild(newChild);
          }
          newChild.parent = this;
        }
      }
    };
    DebugElement.prototype.query = function(predicate) {
      var results = this.queryAll(predicate);
      return results.length > 0 ? results[0] : null;
    };
    DebugElement.prototype.queryAll = function(predicate) {
      var matches = [];
      _queryElementChildren(this, predicate, matches);
      return matches;
    };
    DebugElement.prototype.queryAllNodes = function(predicate) {
      var matches = [];
      _queryNodeChildren(this, predicate, matches);
      return matches;
    };
    Object.defineProperty(DebugElement.prototype, "children", {
      get: function() {
        var children = [];
        this.childNodes.forEach(function(node) {
          if (node instanceof DebugElement) {
            children.push(node);
          }
        });
        return children;
      },
      enumerable: true,
      configurable: true
    });
    DebugElement.prototype.triggerEventHandler = function(eventName, eventObj) {
      this.listeners.forEach(function(listener) {
        if (listener.name == eventName) {
          listener.callback(eventObj);
        }
      });
    };
    return DebugElement;
  }(DebugNode));
  exports.DebugElement = DebugElement;
  function asNativeElements(debugEls) {
    return debugEls.map(function(el) {
      return el.nativeElement;
    });
  }
  exports.asNativeElements = asNativeElements;
  function _queryElementChildren(element, predicate, matches) {
    element.childNodes.forEach(function(node) {
      if (node instanceof DebugElement) {
        if (predicate(node)) {
          matches.push(node);
        }
        _queryElementChildren(node, predicate, matches);
      }
    });
  }
  function _queryNodeChildren(parentNode, predicate, matches) {
    if (parentNode instanceof DebugElement) {
      parentNode.childNodes.forEach(function(node) {
        if (predicate(node)) {
          matches.push(node);
        }
        if (node instanceof DebugElement) {
          _queryNodeChildren(node, predicate, matches);
        }
      });
    }
  }
  var _nativeNodeToDebugNode = new Map();
  function getDebugNode(nativeNode) {
    return _nativeNodeToDebugNode.get(nativeNode);
  }
  exports.getDebugNode = getDebugNode;
  function getAllDebugNodes() {
    return collection_1.MapWrapper.values(_nativeNodeToDebugNode);
  }
  exports.getAllDebugNodes = getAllDebugNodes;
  function indexDebugNode(node) {
    _nativeNodeToDebugNode.set(node.nativeNode, node);
  }
  exports.indexDebugNode = indexDebugNode;
  function removeDebugNodeFromIndex(node) {
    _nativeNodeToDebugNode.delete(node.nativeNode);
  }
  exports.removeDebugNodeFromIndex = removeDebugNodeFromIndex;
  return module.exports;
});

System.registerDynamic("@angular/core/src/debug/debug_renderer.js", ["../../src/facade/lang", "./debug_node"], true, function($__require, exports, module) {
  "use strict";
  ;
  var define,
      global = this,
      GLOBAL = this;
  var lang_1 = $__require('../../src/facade/lang');
  var debug_node_1 = $__require('./debug_node');
  var DebugDomRootRenderer = (function() {
    function DebugDomRootRenderer(_delegate) {
      this._delegate = _delegate;
    }
    DebugDomRootRenderer.prototype.renderComponent = function(componentProto) {
      return new DebugDomRenderer(this._delegate.renderComponent(componentProto));
    };
    return DebugDomRootRenderer;
  }());
  exports.DebugDomRootRenderer = DebugDomRootRenderer;
  var DebugDomRenderer = (function() {
    function DebugDomRenderer(_delegate) {
      this._delegate = _delegate;
    }
    DebugDomRenderer.prototype.selectRootElement = function(selectorOrNode, debugInfo) {
      var nativeEl = this._delegate.selectRootElement(selectorOrNode, debugInfo);
      var debugEl = new debug_node_1.DebugElement(nativeEl, null, debugInfo);
      debug_node_1.indexDebugNode(debugEl);
      return nativeEl;
    };
    DebugDomRenderer.prototype.createElement = function(parentElement, name, debugInfo) {
      var nativeEl = this._delegate.createElement(parentElement, name, debugInfo);
      var debugEl = new debug_node_1.DebugElement(nativeEl, debug_node_1.getDebugNode(parentElement), debugInfo);
      debugEl.name = name;
      debug_node_1.indexDebugNode(debugEl);
      return nativeEl;
    };
    DebugDomRenderer.prototype.createViewRoot = function(hostElement) {
      return this._delegate.createViewRoot(hostElement);
    };
    DebugDomRenderer.prototype.createTemplateAnchor = function(parentElement, debugInfo) {
      var comment = this._delegate.createTemplateAnchor(parentElement, debugInfo);
      var debugEl = new debug_node_1.DebugNode(comment, debug_node_1.getDebugNode(parentElement), debugInfo);
      debug_node_1.indexDebugNode(debugEl);
      return comment;
    };
    DebugDomRenderer.prototype.createText = function(parentElement, value, debugInfo) {
      var text = this._delegate.createText(parentElement, value, debugInfo);
      var debugEl = new debug_node_1.DebugNode(text, debug_node_1.getDebugNode(parentElement), debugInfo);
      debug_node_1.indexDebugNode(debugEl);
      return text;
    };
    DebugDomRenderer.prototype.projectNodes = function(parentElement, nodes) {
      var debugParent = debug_node_1.getDebugNode(parentElement);
      if (lang_1.isPresent(debugParent) && debugParent instanceof debug_node_1.DebugElement) {
        var debugElement_1 = debugParent;
        nodes.forEach(function(node) {
          debugElement_1.addChild(debug_node_1.getDebugNode(node));
        });
      }
      this._delegate.projectNodes(parentElement, nodes);
    };
    DebugDomRenderer.prototype.attachViewAfter = function(node, viewRootNodes) {
      var debugNode = debug_node_1.getDebugNode(node);
      if (lang_1.isPresent(debugNode)) {
        var debugParent = debugNode.parent;
        if (viewRootNodes.length > 0 && lang_1.isPresent(debugParent)) {
          var debugViewRootNodes = [];
          viewRootNodes.forEach(function(rootNode) {
            return debugViewRootNodes.push(debug_node_1.getDebugNode(rootNode));
          });
          debugParent.insertChildrenAfter(debugNode, debugViewRootNodes);
        }
      }
      this._delegate.attachViewAfter(node, viewRootNodes);
    };
    DebugDomRenderer.prototype.detachView = function(viewRootNodes) {
      viewRootNodes.forEach(function(node) {
        var debugNode = debug_node_1.getDebugNode(node);
        if (lang_1.isPresent(debugNode) && lang_1.isPresent(debugNode.parent)) {
          debugNode.parent.removeChild(debugNode);
        }
      });
      this._delegate.detachView(viewRootNodes);
    };
    DebugDomRenderer.prototype.destroyView = function(hostElement, viewAllNodes) {
      viewAllNodes.forEach(function(node) {
        debug_node_1.removeDebugNodeFromIndex(debug_node_1.getDebugNode(node));
      });
      this._delegate.destroyView(hostElement, viewAllNodes);
    };
    DebugDomRenderer.prototype.listen = function(renderElement, name, callback) {
      var debugEl = debug_node_1.getDebugNode(renderElement);
      if (lang_1.isPresent(debugEl)) {
        debugEl.listeners.push(new debug_node_1.EventListener(name, callback));
      }
      return this._delegate.listen(renderElement, name, callback);
    };
    DebugDomRenderer.prototype.listenGlobal = function(target, name, callback) {
      return this._delegate.listenGlobal(target, name, callback);
    };
    DebugDomRenderer.prototype.setElementProperty = function(renderElement, propertyName, propertyValue) {
      var debugEl = debug_node_1.getDebugNode(renderElement);
      if (lang_1.isPresent(debugEl) && debugEl instanceof debug_node_1.DebugElement) {
        debugEl.properties[propertyName] = propertyValue;
      }
      this._delegate.setElementProperty(renderElement, propertyName, propertyValue);
    };
    DebugDomRenderer.prototype.setElementAttribute = function(renderElement, attributeName, attributeValue) {
      var debugEl = debug_node_1.getDebugNode(renderElement);
      if (lang_1.isPresent(debugEl) && debugEl instanceof debug_node_1.DebugElement) {
        debugEl.attributes[attributeName] = attributeValue;
      }
      this._delegate.setElementAttribute(renderElement, attributeName, attributeValue);
    };
    DebugDomRenderer.prototype.setBindingDebugInfo = function(renderElement, propertyName, propertyValue) {
      this._delegate.setBindingDebugInfo(renderElement, propertyName, propertyValue);
    };
    DebugDomRenderer.prototype.setElementClass = function(renderElement, className, isAdd) {
      this._delegate.setElementClass(renderElement, className, isAdd);
    };
    DebugDomRenderer.prototype.setElementStyle = function(renderElement, styleName, styleValue) {
      this._delegate.setElementStyle(renderElement, styleName, styleValue);
    };
    DebugDomRenderer.prototype.invokeElementMethod = function(renderElement, methodName, args) {
      this._delegate.invokeElementMethod(renderElement, methodName, args);
    };
    DebugDomRenderer.prototype.setText = function(renderNode, text) {
      this._delegate.setText(renderNode, text);
    };
    return DebugDomRenderer;
  }());
  exports.DebugDomRenderer = DebugDomRenderer;
  return module.exports;
});

System.registerDynamic("@angular/core/src/facade/base_wrapped_exception.js", [], true, function($__require, exports, module) {
  "use strict";
  ;
  var define,
      global = this,
      GLOBAL = this;
  var __extends = (this && this.__extends) || function(d, b) {
    for (var p in b)
      if (b.hasOwnProperty(p))
        d[p] = b[p];
    function __() {
      this.constructor = d;
    }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
  };
  var BaseWrappedException = (function(_super) {
    __extends(BaseWrappedException, _super);
    function BaseWrappedException(message) {
      _super.call(this, message);
    }
    Object.defineProperty(BaseWrappedException.prototype, "wrapperMessage", {
      get: function() {
        return '';
      },
      enumerable: true,
      configurable: true
    });
    Object.defineProperty(BaseWrappedException.prototype, "wrapperStack", {
      get: function() {
        return null;
      },
      enumerable: true,
      configurable: true
    });
    Object.defineProperty(BaseWrappedException.prototype, "originalException", {
      get: function() {
        return null;
      },
      enumerable: true,
      configurable: true
    });
    Object.defineProperty(BaseWrappedException.prototype, "originalStack", {
      get: function() {
        return null;
      },
      enumerable: true,
      configurable: true
    });
    Object.defineProperty(BaseWrappedException.prototype, "context", {
      get: function() {
        return null;
      },
      enumerable: true,
      configurable: true
    });
    Object.defineProperty(BaseWrappedException.prototype, "message", {
      get: function() {
        return '';
      },
      enumerable: true,
      configurable: true
    });
    return BaseWrappedException;
  }(Error));
  exports.BaseWrappedException = BaseWrappedException;
  return module.exports;
});

System.registerDynamic("@angular/core/src/facade/collection.js", ["./lang"], true, function($__require, exports, module) {
  "use strict";
  ;
  var define,
      global = this,
      GLOBAL = this;
  var lang_1 = $__require('./lang');
  exports.Map = lang_1.global.Map;
  exports.Set = lang_1.global.Set;
  var createMapFromPairs = (function() {
    try {
      if (new exports.Map([[1, 2]]).size === 1) {
        return function createMapFromPairs(pairs) {
          return new exports.Map(pairs);
        };
      }
    } catch (e) {}
    return function createMapAndPopulateFromPairs(pairs) {
      var map = new exports.Map();
      for (var i = 0; i < pairs.length; i++) {
        var pair = pairs[i];
        map.set(pair[0], pair[1]);
      }
      return map;
    };
  })();
  var createMapFromMap = (function() {
    try {
      if (new exports.Map(new exports.Map())) {
        return function createMapFromMap(m) {
          return new exports.Map(m);
        };
      }
    } catch (e) {}
    return function createMapAndPopulateFromMap(m) {
      var map = new exports.Map();
      m.forEach(function(v, k) {
        map.set(k, v);
      });
      return map;
    };
  })();
  var _clearValues = (function() {
    if ((new exports.Map()).keys().next) {
      return function _clearValues(m) {
        var keyIterator = m.keys();
        var k;
        while (!((k = keyIterator.next()).done)) {
          m.set(k.value, null);
        }
      };
    } else {
      return function _clearValuesWithForeEach(m) {
        m.forEach(function(v, k) {
          m.set(k, null);
        });
      };
    }
  })();
  var _arrayFromMap = (function() {
    try {
      if ((new exports.Map()).values().next) {
        return function createArrayFromMap(m, getValues) {
          return getValues ? Array.from(m.values()) : Array.from(m.keys());
        };
      }
    } catch (e) {}
    return function createArrayFromMapWithForeach(m, getValues) {
      var res = ListWrapper.createFixedSize(m.size),
          i = 0;
      m.forEach(function(v, k) {
        res[i] = getValues ? v : k;
        i++;
      });
      return res;
    };
  })();
  var MapWrapper = (function() {
    function MapWrapper() {}
    MapWrapper.clone = function(m) {
      return createMapFromMap(m);
    };
    MapWrapper.createFromStringMap = function(stringMap) {
      var result = new exports.Map();
      for (var prop in stringMap) {
        result.set(prop, stringMap[prop]);
      }
      return result;
    };
    MapWrapper.toStringMap = function(m) {
      var r = {};
      m.forEach(function(v, k) {
        return r[k] = v;
      });
      return r;
    };
    MapWrapper.createFromPairs = function(pairs) {
      return createMapFromPairs(pairs);
    };
    MapWrapper.clearValues = function(m) {
      _clearValues(m);
    };
    MapWrapper.iterable = function(m) {
      return m;
    };
    MapWrapper.keys = function(m) {
      return _arrayFromMap(m, false);
    };
    MapWrapper.values = function(m) {
      return _arrayFromMap(m, true);
    };
    return MapWrapper;
  }());
  exports.MapWrapper = MapWrapper;
  var StringMapWrapper = (function() {
    function StringMapWrapper() {}
    StringMapWrapper.create = function() {
      return {};
    };
    StringMapWrapper.contains = function(map, key) {
      return map.hasOwnProperty(key);
    };
    StringMapWrapper.get = function(map, key) {
      return map.hasOwnProperty(key) ? map[key] : undefined;
    };
    StringMapWrapper.set = function(map, key, value) {
      map[key] = value;
    };
    StringMapWrapper.keys = function(map) {
      return Object.keys(map);
    };
    StringMapWrapper.values = function(map) {
      return Object.keys(map).reduce(function(r, a) {
        r.push(map[a]);
        return r;
      }, []);
    };
    StringMapWrapper.isEmpty = function(map) {
      for (var prop in map) {
        return false;
      }
      return true;
    };
    StringMapWrapper.delete = function(map, key) {
      delete map[key];
    };
    StringMapWrapper.forEach = function(map, callback) {
      for (var prop in map) {
        if (map.hasOwnProperty(prop)) {
          callback(map[prop], prop);
        }
      }
    };
    StringMapWrapper.merge = function(m1, m2) {
      var m = {};
      for (var attr in m1) {
        if (m1.hasOwnProperty(attr)) {
          m[attr] = m1[attr];
        }
      }
      for (var attr in m2) {
        if (m2.hasOwnProperty(attr)) {
          m[attr] = m2[attr];
        }
      }
      return m;
    };
    StringMapWrapper.equals = function(m1, m2) {
      var k1 = Object.keys(m1);
      var k2 = Object.keys(m2);
      if (k1.length != k2.length) {
        return false;
      }
      var key;
      for (var i = 0; i < k1.length; i++) {
        key = k1[i];
        if (m1[key] !== m2[key]) {
          return false;
        }
      }
      return true;
    };
    return StringMapWrapper;
  }());
  exports.StringMapWrapper = StringMapWrapper;
  var ListWrapper = (function() {
    function ListWrapper() {}
    ListWrapper.createFixedSize = function(size) {
      return new Array(size);
    };
    ListWrapper.createGrowableSize = function(size) {
      return new Array(size);
    };
    ListWrapper.clone = function(array) {
      return array.slice(0);
    };
    ListWrapper.forEachWithIndex = function(array, fn) {
      for (var i = 0; i < array.length; i++) {
        fn(array[i], i);
      }
    };
    ListWrapper.first = function(array) {
      if (!array)
        return null;
      return array[0];
    };
    ListWrapper.last = function(array) {
      if (!array || array.length == 0)
        return null;
      return array[array.length - 1];
    };
    ListWrapper.indexOf = function(array, value, startIndex) {
      if (startIndex === void 0) {
        startIndex = 0;
      }
      return array.indexOf(value, startIndex);
    };
    ListWrapper.contains = function(list, el) {
      return list.indexOf(el) !== -1;
    };
    ListWrapper.reversed = function(array) {
      var a = ListWrapper.clone(array);
      return a.reverse();
    };
    ListWrapper.concat = function(a, b) {
      return a.concat(b);
    };
    ListWrapper.insert = function(list, index, value) {
      list.splice(index, 0, value);
    };
    ListWrapper.removeAt = function(list, index) {
      var res = list[index];
      list.splice(index, 1);
      return res;
    };
    ListWrapper.removeAll = function(list, items) {
      for (var i = 0; i < items.length; ++i) {
        var index = list.indexOf(items[i]);
        list.splice(index, 1);
      }
    };
    ListWrapper.remove = function(list, el) {
      var index = list.indexOf(el);
      if (index > -1) {
        list.splice(index, 1);
        return true;
      }
      return false;
    };
    ListWrapper.clear = function(list) {
      list.length = 0;
    };
    ListWrapper.isEmpty = function(list) {
      return list.length == 0;
    };
    ListWrapper.fill = function(list, value, start, end) {
      if (start === void 0) {
        start = 0;
      }
      if (end === void 0) {
        end = null;
      }
      list.fill(value, start, end === null ? list.length : end);
    };
    ListWrapper.equals = function(a, b) {
      if (a.length != b.length)
        return false;
      for (var i = 0; i < a.length; ++i) {
        if (a[i] !== b[i])
          return false;
      }
      return true;
    };
    ListWrapper.slice = function(l, from, to) {
      if (from === void 0) {
        from = 0;
      }
      if (to === void 0) {
        to = null;
      }
      return l.slice(from, to === null ? undefined : to);
    };
    ListWrapper.splice = function(l, from, length) {
      return l.splice(from, length);
    };
    ListWrapper.sort = function(l, compareFn) {
      if (lang_1.isPresent(compareFn)) {
        l.sort(compareFn);
      } else {
        l.sort();
      }
    };
    ListWrapper.toString = function(l) {
      return l.toString();
    };
    ListWrapper.toJSON = function(l) {
      return JSON.stringify(l);
    };
    ListWrapper.maximum = function(list, predicate) {
      if (list.length == 0) {
        return null;
      }
      var solution = null;
      var maxValue = -Infinity;
      for (var index = 0; index < list.length; index++) {
        var candidate = list[index];
        if (lang_1.isBlank(candidate)) {
          continue;
        }
        var candidateValue = predicate(candidate);
        if (candidateValue > maxValue) {
          solution = candidate;
          maxValue = candidateValue;
        }
      }
      return solution;
    };
    ListWrapper.flatten = function(list) {
      var target = [];
      _flattenArray(list, target);
      return target;
    };
    ListWrapper.addAll = function(list, source) {
      for (var i = 0; i < source.length; i++) {
        list.push(source[i]);
      }
    };
    return ListWrapper;
  }());
  exports.ListWrapper = ListWrapper;
  function _flattenArray(source, target) {
    if (lang_1.isPresent(source)) {
      for (var i = 0; i < source.length; i++) {
        var item = source[i];
        if (lang_1.isArray(item)) {
          _flattenArray(item, target);
        } else {
          target.push(item);
        }
      }
    }
    return target;
  }
  function isListLikeIterable(obj) {
    if (!lang_1.isJsObject(obj))
      return false;
    return lang_1.isArray(obj) || (!(obj instanceof exports.Map) && lang_1.getSymbolIterator() in obj);
  }
  exports.isListLikeIterable = isListLikeIterable;
  function areIterablesEqual(a, b, comparator) {
    var iterator1 = a[lang_1.getSymbolIterator()]();
    var iterator2 = b[lang_1.getSymbolIterator()]();
    while (true) {
      var item1 = iterator1.next();
      var item2 = iterator2.next();
      if (item1.done && item2.done)
        return true;
      if (item1.done || item2.done)
        return false;
      if (!comparator(item1.value, item2.value))
        return false;
    }
  }
  exports.areIterablesEqual = areIterablesEqual;
  function iterateListLike(obj, fn) {
    if (lang_1.isArray(obj)) {
      for (var i = 0; i < obj.length; i++) {
        fn(obj[i]);
      }
    } else {
      var iterator = obj[lang_1.getSymbolIterator()]();
      var item;
      while (!((item = iterator.next()).done)) {
        fn(item.value);
      }
    }
  }
  exports.iterateListLike = iterateListLike;
  var createSetFromList = (function() {
    var test = new exports.Set([1, 2, 3]);
    if (test.size === 3) {
      return function createSetFromList(lst) {
        return new exports.Set(lst);
      };
    } else {
      return function createSetAndPopulateFromList(lst) {
        var res = new exports.Set(lst);
        if (res.size !== lst.length) {
          for (var i = 0; i < lst.length; i++) {
            res.add(lst[i]);
          }
        }
        return res;
      };
    }
  })();
  var SetWrapper = (function() {
    function SetWrapper() {}
    SetWrapper.createFromList = function(lst) {
      return createSetFromList(lst);
    };
    SetWrapper.has = function(s, key) {
      return s.has(key);
    };
    SetWrapper.delete = function(m, k) {
      m.delete(k);
    };
    return SetWrapper;
  }());
  exports.SetWrapper = SetWrapper;
  return module.exports;
});

System.registerDynamic("@angular/core/src/facade/exception_handler.js", ["./lang", "./base_wrapped_exception", "./collection"], true, function($__require, exports, module) {
  "use strict";
  ;
  var define,
      global = this,
      GLOBAL = this;
  var lang_1 = $__require('./lang');
  var base_wrapped_exception_1 = $__require('./base_wrapped_exception');
  var collection_1 = $__require('./collection');
  var _ArrayLogger = (function() {
    function _ArrayLogger() {
      this.res = [];
    }
    _ArrayLogger.prototype.log = function(s) {
      this.res.push(s);
    };
    _ArrayLogger.prototype.logError = function(s) {
      this.res.push(s);
    };
    _ArrayLogger.prototype.logGroup = function(s) {
      this.res.push(s);
    };
    _ArrayLogger.prototype.logGroupEnd = function() {};
    ;
    return _ArrayLogger;
  }());
  var ExceptionHandler = (function() {
    function ExceptionHandler(_logger, _rethrowException) {
      if (_rethrowException === void 0) {
        _rethrowException = true;
      }
      this._logger = _logger;
      this._rethrowException = _rethrowException;
    }
    ExceptionHandler.exceptionToString = function(exception, stackTrace, reason) {
      if (stackTrace === void 0) {
        stackTrace = null;
      }
      if (reason === void 0) {
        reason = null;
      }
      var l = new _ArrayLogger();
      var e = new ExceptionHandler(l, false);
      e.call(exception, stackTrace, reason);
      return l.res.join("\n");
    };
    ExceptionHandler.prototype.call = function(exception, stackTrace, reason) {
      if (stackTrace === void 0) {
        stackTrace = null;
      }
      if (reason === void 0) {
        reason = null;
      }
      var originalException = this._findOriginalException(exception);
      var originalStack = this._findOriginalStack(exception);
      var context = this._findContext(exception);
      this._logger.logGroup("EXCEPTION: " + this._extractMessage(exception));
      if (lang_1.isPresent(stackTrace) && lang_1.isBlank(originalStack)) {
        this._logger.logError("STACKTRACE:");
        this._logger.logError(this._longStackTrace(stackTrace));
      }
      if (lang_1.isPresent(reason)) {
        this._logger.logError("REASON: " + reason);
      }
      if (lang_1.isPresent(originalException)) {
        this._logger.logError("ORIGINAL EXCEPTION: " + this._extractMessage(originalException));
      }
      if (lang_1.isPresent(originalStack)) {
        this._logger.logError("ORIGINAL STACKTRACE:");
        this._logger.logError(this._longStackTrace(originalStack));
      }
      if (lang_1.isPresent(context)) {
        this._logger.logError("ERROR CONTEXT:");
        this._logger.logError(context);
      }
      this._logger.logGroupEnd();
      if (this._rethrowException)
        throw exception;
    };
    ExceptionHandler.prototype._extractMessage = function(exception) {
      return exception instanceof base_wrapped_exception_1.BaseWrappedException ? exception.wrapperMessage : exception.toString();
    };
    ExceptionHandler.prototype._longStackTrace = function(stackTrace) {
      return collection_1.isListLikeIterable(stackTrace) ? stackTrace.join("\n\n-----async gap-----\n") : stackTrace.toString();
    };
    ExceptionHandler.prototype._findContext = function(exception) {
      try {
        if (!(exception instanceof base_wrapped_exception_1.BaseWrappedException))
          return null;
        return lang_1.isPresent(exception.context) ? exception.context : this._findContext(exception.originalException);
      } catch (e) {
        return null;
      }
    };
    ExceptionHandler.prototype._findOriginalException = function(exception) {
      if (!(exception instanceof base_wrapped_exception_1.BaseWrappedException))
        return null;
      var e = exception.originalException;
      while (e instanceof base_wrapped_exception_1.BaseWrappedException && lang_1.isPresent(e.originalException)) {
        e = e.originalException;
      }
      return e;
    };
    ExceptionHandler.prototype._findOriginalStack = function(exception) {
      if (!(exception instanceof base_wrapped_exception_1.BaseWrappedException))
        return null;
      var e = exception;
      var stack = exception.originalStack;
      while (e instanceof base_wrapped_exception_1.BaseWrappedException && lang_1.isPresent(e.originalException)) {
        e = e.originalException;
        if (e instanceof base_wrapped_exception_1.BaseWrappedException && lang_1.isPresent(e.originalException)) {
          stack = e.originalStack;
        }
      }
      return stack;
    };
    return ExceptionHandler;
  }());
  exports.ExceptionHandler = ExceptionHandler;
  return module.exports;
});

System.registerDynamic("@angular/core/src/facade/exceptions.js", ["./base_wrapped_exception", "./exception_handler"], true, function($__require, exports, module) {
  "use strict";
  ;
  var define,
      global = this,
      GLOBAL = this;
  var __extends = (this && this.__extends) || function(d, b) {
    for (var p in b)
      if (b.hasOwnProperty(p))
        d[p] = b[p];
    function __() {
      this.constructor = d;
    }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
  };
  var base_wrapped_exception_1 = $__require('./base_wrapped_exception');
  var exception_handler_1 = $__require('./exception_handler');
  var exception_handler_2 = $__require('./exception_handler');
  exports.ExceptionHandler = exception_handler_2.ExceptionHandler;
  var BaseException = (function(_super) {
    __extends(BaseException, _super);
    function BaseException(message) {
      if (message === void 0) {
        message = "--";
      }
      _super.call(this, message);
      this.message = message;
      this.stack = (new Error(message)).stack;
    }
    BaseException.prototype.toString = function() {
      return this.message;
    };
    return BaseException;
  }(Error));
  exports.BaseException = BaseException;
  var WrappedException = (function(_super) {
    __extends(WrappedException, _super);
    function WrappedException(_wrapperMessage, _originalException, _originalStack, _context) {
      _super.call(this, _wrapperMessage);
      this._wrapperMessage = _wrapperMessage;
      this._originalException = _originalException;
      this._originalStack = _originalStack;
      this._context = _context;
      this._wrapperStack = (new Error(_wrapperMessage)).stack;
    }
    Object.defineProperty(WrappedException.prototype, "wrapperMessage", {
      get: function() {
        return this._wrapperMessage;
      },
      enumerable: true,
      configurable: true
    });
    Object.defineProperty(WrappedException.prototype, "wrapperStack", {
      get: function() {
        return this._wrapperStack;
      },
      enumerable: true,
      configurable: true
    });
    Object.defineProperty(WrappedException.prototype, "originalException", {
      get: function() {
        return this._originalException;
      },
      enumerable: true,
      configurable: true
    });
    Object.defineProperty(WrappedException.prototype, "originalStack", {
      get: function() {
        return this._originalStack;
      },
      enumerable: true,
      configurable: true
    });
    Object.defineProperty(WrappedException.prototype, "context", {
      get: function() {
        return this._context;
      },
      enumerable: true,
      configurable: true
    });
    Object.defineProperty(WrappedException.prototype, "message", {
      get: function() {
        return exception_handler_1.ExceptionHandler.exceptionToString(this);
      },
      enumerable: true,
      configurable: true
    });
    WrappedException.prototype.toString = function() {
      return this.message;
    };
    return WrappedException;
  }(base_wrapped_exception_1.BaseWrappedException));
  exports.WrappedException = WrappedException;
  function makeTypeError(message) {
    return new TypeError(message);
  }
  exports.makeTypeError = makeTypeError;
  function unimplemented() {
    throw new BaseException('unimplemented');
  }
  exports.unimplemented = unimplemented;
  return module.exports;
});

System.registerDynamic("@angular/core/src/di/provider.js", ["../../src/facade/lang", "../../src/facade/exceptions"], true, function($__require, exports, module) {
  "use strict";
  ;
  var define,
      global = this,
      GLOBAL = this;
  var __extends = (this && this.__extends) || function(d, b) {
    for (var p in b)
      if (b.hasOwnProperty(p))
        d[p] = b[p];
    function __() {
      this.constructor = d;
    }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
  };
  var lang_1 = $__require('../../src/facade/lang');
  var exceptions_1 = $__require('../../src/facade/exceptions');
  var Provider = (function() {
    function Provider(token, _a) {
      var useClass = _a.useClass,
          useValue = _a.useValue,
          useExisting = _a.useExisting,
          useFactory = _a.useFactory,
          deps = _a.deps,
          multi = _a.multi;
      this.token = token;
      this.useClass = useClass;
      this.useValue = useValue;
      this.useExisting = useExisting;
      this.useFactory = useFactory;
      this.dependencies = deps;
      this._multi = multi;
    }
    Object.defineProperty(Provider.prototype, "multi", {
      get: function() {
        return lang_1.normalizeBool(this._multi);
      },
      enumerable: true,
      configurable: true
    });
    return Provider;
  }());
  exports.Provider = Provider;
  var Binding = (function(_super) {
    __extends(Binding, _super);
    function Binding(token, _a) {
      var toClass = _a.toClass,
          toValue = _a.toValue,
          toAlias = _a.toAlias,
          toFactory = _a.toFactory,
          deps = _a.deps,
          multi = _a.multi;
      _super.call(this, token, {
        useClass: toClass,
        useValue: toValue,
        useExisting: toAlias,
        useFactory: toFactory,
        deps: deps,
        multi: multi
      });
    }
    Object.defineProperty(Binding.prototype, "toClass", {
      get: function() {
        return this.useClass;
      },
      enumerable: true,
      configurable: true
    });
    Object.defineProperty(Binding.prototype, "toAlias", {
      get: function() {
        return this.useExisting;
      },
      enumerable: true,
      configurable: true
    });
    Object.defineProperty(Binding.prototype, "toFactory", {
      get: function() {
        return this.useFactory;
      },
      enumerable: true,
      configurable: true
    });
    Object.defineProperty(Binding.prototype, "toValue", {
      get: function() {
        return this.useValue;
      },
      enumerable: true,
      configurable: true
    });
    return Binding;
  }(Provider));
  exports.Binding = Binding;
  function bind(token) {
    return new ProviderBuilder(token);
  }
  exports.bind = bind;
  var ProviderBuilder = (function() {
    function ProviderBuilder(token) {
      this.token = token;
    }
    ProviderBuilder.prototype.toClass = function(type) {
      if (!lang_1.isType(type)) {
        throw new exceptions_1.BaseException("Trying to create a class provider but \"" + lang_1.stringify(type) + "\" is not a class!");
      }
      return new Provider(this.token, {useClass: type});
    };
    ProviderBuilder.prototype.toValue = function(value) {
      return new Provider(this.token, {useValue: value});
    };
    ProviderBuilder.prototype.toAlias = function(aliasToken) {
      if (lang_1.isBlank(aliasToken)) {
        throw new exceptions_1.BaseException("Can not alias " + lang_1.stringify(this.token) + " to a blank value!");
      }
      return new Provider(this.token, {useExisting: aliasToken});
    };
    ProviderBuilder.prototype.toFactory = function(factory, dependencies) {
      if (!lang_1.isFunction(factory)) {
        throw new exceptions_1.BaseException("Trying to create a factory provider but \"" + lang_1.stringify(factory) + "\" is not a function!");
      }
      return new Provider(this.token, {
        useFactory: factory,
        deps: dependencies
      });
    };
    return ProviderBuilder;
  }());
  exports.ProviderBuilder = ProviderBuilder;
  function provide(token, _a) {
    var useClass = _a.useClass,
        useValue = _a.useValue,
        useExisting = _a.useExisting,
        useFactory = _a.useFactory,
        deps = _a.deps,
        multi = _a.multi;
    return new Provider(token, {
      useClass: useClass,
      useValue: useValue,
      useExisting: useExisting,
      useFactory: useFactory,
      deps: deps,
      multi: multi
    });
  }
  exports.provide = provide;
  return module.exports;
});

System.registerDynamic("@angular/core/src/di/provider_util.js", ["./provider"], true, function($__require, exports, module) {
  "use strict";
  ;
  var define,
      global = this,
      GLOBAL = this;
  var provider_1 = $__require('./provider');
  function isProviderLiteral(obj) {
    return obj && typeof obj == 'object' && obj.provide;
  }
  exports.isProviderLiteral = isProviderLiteral;
  function createProvider(obj) {
    return new provider_1.Provider(obj.provide, obj);
  }
  exports.createProvider = createProvider;
  return module.exports;
});

System.registerDynamic("@angular/core/src/di/metadata.js", ["../../src/facade/lang"], true, function($__require, exports, module) {
  "use strict";
  ;
  var define,
      global = this,
      GLOBAL = this;
  var lang_1 = $__require('../../src/facade/lang');
  var InjectMetadata = (function() {
    function InjectMetadata(token) {
      this.token = token;
    }
    InjectMetadata.prototype.toString = function() {
      return "@Inject(" + lang_1.stringify(this.token) + ")";
    };
    return InjectMetadata;
  }());
  exports.InjectMetadata = InjectMetadata;
  var OptionalMetadata = (function() {
    function OptionalMetadata() {}
    OptionalMetadata.prototype.toString = function() {
      return "@Optional()";
    };
    return OptionalMetadata;
  }());
  exports.OptionalMetadata = OptionalMetadata;
  var DependencyMetadata = (function() {
    function DependencyMetadata() {}
    Object.defineProperty(DependencyMetadata.prototype, "token", {
      get: function() {
        return null;
      },
      enumerable: true,
      configurable: true
    });
    return DependencyMetadata;
  }());
  exports.DependencyMetadata = DependencyMetadata;
  var InjectableMetadata = (function() {
    function InjectableMetadata() {}
    return InjectableMetadata;
  }());
  exports.InjectableMetadata = InjectableMetadata;
  var SelfMetadata = (function() {
    function SelfMetadata() {}
    SelfMetadata.prototype.toString = function() {
      return "@Self()";
    };
    return SelfMetadata;
  }());
  exports.SelfMetadata = SelfMetadata;
  var SkipSelfMetadata = (function() {
    function SkipSelfMetadata() {}
    SkipSelfMetadata.prototype.toString = function() {
      return "@SkipSelf()";
    };
    return SkipSelfMetadata;
  }());
  exports.SkipSelfMetadata = SkipSelfMetadata;
  var HostMetadata = (function() {
    function HostMetadata() {}
    HostMetadata.prototype.toString = function() {
      return "@Host()";
    };
    return HostMetadata;
  }());
  exports.HostMetadata = HostMetadata;
  return module.exports;
});

System.registerDynamic("@angular/core/src/facade/lang.js", [], true, function($__require, exports, module) {
  "use strict";
  ;
  var define,
      global = this,
      GLOBAL = this;
  var __extends = (this && this.__extends) || function(d, b) {
    for (var p in b)
      if (b.hasOwnProperty(p))
        d[p] = b[p];
    function __() {
      this.constructor = d;
    }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
  };
  var globalScope;
  if (typeof window === 'undefined') {
    if (typeof WorkerGlobalScope !== 'undefined' && self instanceof WorkerGlobalScope) {
      globalScope = self;
    } else {
      globalScope = global;
    }
  } else {
    globalScope = window;
  }
  function scheduleMicroTask(fn) {
    Zone.current.scheduleMicroTask('scheduleMicrotask', fn);
  }
  exports.scheduleMicroTask = scheduleMicroTask;
  exports.IS_DART = false;
  var _global = globalScope;
  exports.global = _global;
  exports.Type = Function;
  function getTypeNameForDebugging(type) {
    if (type['name']) {
      return type['name'];
    }
    return typeof type;
  }
  exports.getTypeNameForDebugging = getTypeNameForDebugging;
  exports.Math = _global.Math;
  exports.Date = _global.Date;
  var _devMode = true;
  var _modeLocked = false;
  function lockMode() {
    _modeLocked = true;
  }
  exports.lockMode = lockMode;
  function enableProdMode() {
    if (_modeLocked) {
      throw 'Cannot enable prod mode after platform setup.';
    }
    _devMode = false;
  }
  exports.enableProdMode = enableProdMode;
  function assertionsEnabled() {
    return _devMode;
  }
  exports.assertionsEnabled = assertionsEnabled;
  _global.assert = function assert(condition) {};
  function isPresent(obj) {
    return obj !== undefined && obj !== null;
  }
  exports.isPresent = isPresent;
  function isBlank(obj) {
    return obj === undefined || obj === null;
  }
  exports.isBlank = isBlank;
  function isBoolean(obj) {
    return typeof obj === "boolean";
  }
  exports.isBoolean = isBoolean;
  function isNumber(obj) {
    return typeof obj === "number";
  }
  exports.isNumber = isNumber;
  function isString(obj) {
    return typeof obj === "string";
  }
  exports.isString = isString;
  function isFunction(obj) {
    return typeof obj === "function";
  }
  exports.isFunction = isFunction;
  function isType(obj) {
    return isFunction(obj);
  }
  exports.isType = isType;
  function isStringMap(obj) {
    return typeof obj === 'object' && obj !== null;
  }
  exports.isStringMap = isStringMap;
  var STRING_MAP_PROTO = Object.getPrototypeOf({});
  function isStrictStringMap(obj) {
    return isStringMap(obj) && Object.getPrototypeOf(obj) === STRING_MAP_PROTO;
  }
  exports.isStrictStringMap = isStrictStringMap;
  function isPromise(obj) {
    return obj instanceof _global.Promise;
  }
  exports.isPromise = isPromise;
  function isArray(obj) {
    return Array.isArray(obj);
  }
  exports.isArray = isArray;
  function isDate(obj) {
    return obj instanceof exports.Date && !isNaN(obj.valueOf());
  }
  exports.isDate = isDate;
  function noop() {}
  exports.noop = noop;
  function stringify(token) {
    if (typeof token === 'string') {
      return token;
    }
    if (token === undefined || token === null) {
      return '' + token;
    }
    if (token.name) {
      return token.name;
    }
    if (token.overriddenName) {
      return token.overriddenName;
    }
    var res = token.toString();
    var newLineIndex = res.indexOf("\n");
    return (newLineIndex === -1) ? res : res.substring(0, newLineIndex);
  }
  exports.stringify = stringify;
  function serializeEnum(val) {
    return val;
  }
  exports.serializeEnum = serializeEnum;
  function deserializeEnum(val, values) {
    return val;
  }
  exports.deserializeEnum = deserializeEnum;
  function resolveEnumToken(enumValue, val) {
    return enumValue[val];
  }
  exports.resolveEnumToken = resolveEnumToken;
  var StringWrapper = (function() {
    function StringWrapper() {}
    StringWrapper.fromCharCode = function(code) {
      return String.fromCharCode(code);
    };
    StringWrapper.charCodeAt = function(s, index) {
      return s.charCodeAt(index);
    };
    StringWrapper.split = function(s, regExp) {
      return s.split(regExp);
    };
    StringWrapper.equals = function(s, s2) {
      return s === s2;
    };
    StringWrapper.stripLeft = function(s, charVal) {
      if (s && s.length) {
        var pos = 0;
        for (var i = 0; i < s.length; i++) {
          if (s[i] != charVal)
            break;
          pos++;
        }
        s = s.substring(pos);
      }
      return s;
    };
    StringWrapper.stripRight = function(s, charVal) {
      if (s && s.length) {
        var pos = s.length;
        for (var i = s.length - 1; i >= 0; i--) {
          if (s[i] != charVal)
            break;
          pos--;
        }
        s = s.substring(0, pos);
      }
      return s;
    };
    StringWrapper.replace = function(s, from, replace) {
      return s.replace(from, replace);
    };
    StringWrapper.replaceAll = function(s, from, replace) {
      return s.replace(from, replace);
    };
    StringWrapper.slice = function(s, from, to) {
      if (from === void 0) {
        from = 0;
      }
      if (to === void 0) {
        to = null;
      }
      return s.slice(from, to === null ? undefined : to);
    };
    StringWrapper.replaceAllMapped = function(s, from, cb) {
      return s.replace(from, function() {
        var matches = [];
        for (var _i = 0; _i < arguments.length; _i++) {
          matches[_i - 0] = arguments[_i];
        }
        matches.splice(-2, 2);
        return cb(matches);
      });
    };
    StringWrapper.contains = function(s, substr) {
      return s.indexOf(substr) != -1;
    };
    StringWrapper.compare = function(a, b) {
      if (a < b) {
        return -1;
      } else if (a > b) {
        return 1;
      } else {
        return 0;
      }
    };
    return StringWrapper;
  }());
  exports.StringWrapper = StringWrapper;
  var StringJoiner = (function() {
    function StringJoiner(parts) {
      if (parts === void 0) {
        parts = [];
      }
      this.parts = parts;
    }
    StringJoiner.prototype.add = function(part) {
      this.parts.push(part);
    };
    StringJoiner.prototype.toString = function() {
      return this.parts.join("");
    };
    return StringJoiner;
  }());
  exports.StringJoiner = StringJoiner;
  var NumberParseError = (function(_super) {
    __extends(NumberParseError, _super);
    function NumberParseError(message) {
      _super.call(this);
      this.message = message;
    }
    NumberParseError.prototype.toString = function() {
      return this.message;
    };
    return NumberParseError;
  }(Error));
  exports.NumberParseError = NumberParseError;
  var NumberWrapper = (function() {
    function NumberWrapper() {}
    NumberWrapper.toFixed = function(n, fractionDigits) {
      return n.toFixed(fractionDigits);
    };
    NumberWrapper.equal = function(a, b) {
      return a === b;
    };
    NumberWrapper.parseIntAutoRadix = function(text) {
      var result = parseInt(text);
      if (isNaN(result)) {
        throw new NumberParseError("Invalid integer literal when parsing " + text);
      }
      return result;
    };
    NumberWrapper.parseInt = function(text, radix) {
      if (radix == 10) {
        if (/^(\-|\+)?[0-9]+$/.test(text)) {
          return parseInt(text, radix);
        }
      } else if (radix == 16) {
        if (/^(\-|\+)?[0-9ABCDEFabcdef]+$/.test(text)) {
          return parseInt(text, radix);
        }
      } else {
        var result = parseInt(text, radix);
        if (!isNaN(result)) {
          return result;
        }
      }
      throw new NumberParseError("Invalid integer literal when parsing " + text + " in base " + radix);
    };
    NumberWrapper.parseFloat = function(text) {
      return parseFloat(text);
    };
    Object.defineProperty(NumberWrapper, "NaN", {
      get: function() {
        return NaN;
      },
      enumerable: true,
      configurable: true
    });
    NumberWrapper.isNaN = function(value) {
      return isNaN(value);
    };
    NumberWrapper.isInteger = function(value) {
      return Number.isInteger(value);
    };
    return NumberWrapper;
  }());
  exports.NumberWrapper = NumberWrapper;
  exports.RegExp = _global.RegExp;
  var RegExpWrapper = (function() {
    function RegExpWrapper() {}
    RegExpWrapper.create = function(regExpStr, flags) {
      if (flags === void 0) {
        flags = '';
      }
      flags = flags.replace(/g/g, '');
      return new _global.RegExp(regExpStr, flags + 'g');
    };
    RegExpWrapper.firstMatch = function(regExp, input) {
      regExp.lastIndex = 0;
      return regExp.exec(input);
    };
    RegExpWrapper.test = function(regExp, input) {
      regExp.lastIndex = 0;
      return regExp.test(input);
    };
    RegExpWrapper.matcher = function(regExp, input) {
      regExp.lastIndex = 0;
      return {
        re: regExp,
        input: input
      };
    };
    RegExpWrapper.replaceAll = function(regExp, input, replace) {
      var c = regExp.exec(input);
      var res = '';
      regExp.lastIndex = 0;
      var prev = 0;
      while (c) {
        res += input.substring(prev, c.index);
        res += replace(c);
        prev = c.index + c[0].length;
        regExp.lastIndex = prev;
        c = regExp.exec(input);
      }
      res += input.substring(prev);
      return res;
    };
    return RegExpWrapper;
  }());
  exports.RegExpWrapper = RegExpWrapper;
  var RegExpMatcherWrapper = (function() {
    function RegExpMatcherWrapper() {}
    RegExpMatcherWrapper.next = function(matcher) {
      return matcher.re.exec(matcher.input);
    };
    return RegExpMatcherWrapper;
  }());
  exports.RegExpMatcherWrapper = RegExpMatcherWrapper;
  var FunctionWrapper = (function() {
    function FunctionWrapper() {}
    FunctionWrapper.apply = function(fn, posArgs) {
      return fn.apply(null, posArgs);
    };
    return FunctionWrapper;
  }());
  exports.FunctionWrapper = FunctionWrapper;
  function looseIdentical(a, b) {
    return a === b || typeof a === "number" && typeof b === "number" && isNaN(a) && isNaN(b);
  }
  exports.looseIdentical = looseIdentical;
  function getMapKey(value) {
    return value;
  }
  exports.getMapKey = getMapKey;
  function normalizeBlank(obj) {
    return isBlank(obj) ? null : obj;
  }
  exports.normalizeBlank = normalizeBlank;
  function normalizeBool(obj) {
    return isBlank(obj) ? false : obj;
  }
  exports.normalizeBool = normalizeBool;
  function isJsObject(o) {
    return o !== null && (typeof o === "function" || typeof o === "object");
  }
  exports.isJsObject = isJsObject;
  function print(obj) {
    console.log(obj);
  }
  exports.print = print;
  function warn(obj) {
    console.warn(obj);
  }
  exports.warn = warn;
  var Json = (function() {
    function Json() {}
    Json.parse = function(s) {
      return _global.JSON.parse(s);
    };
    Json.stringify = function(data) {
      return _global.JSON.stringify(data, null, 2);
    };
    return Json;
  }());
  exports.Json = Json;
  var DateWrapper = (function() {
    function DateWrapper() {}
    DateWrapper.create = function(year, month, day, hour, minutes, seconds, milliseconds) {
      if (month === void 0) {
        month = 1;
      }
      if (day === void 0) {
        day = 1;
      }
      if (hour === void 0) {
        hour = 0;
      }
      if (minutes === void 0) {
        minutes = 0;
      }
      if (seconds === void 0) {
        seconds = 0;
      }
      if (milliseconds === void 0) {
        milliseconds = 0;
      }
      return new exports.Date(year, month - 1, day, hour, minutes, seconds, milliseconds);
    };
    DateWrapper.fromISOString = function(str) {
      return new exports.Date(str);
    };
    DateWrapper.fromMillis = function(ms) {
      return new exports.Date(ms);
    };
    DateWrapper.toMillis = function(date) {
      return date.getTime();
    };
    DateWrapper.now = function() {
      return new exports.Date();
    };
    DateWrapper.toJson = function(date) {
      return date.toJSON();
    };
    return DateWrapper;
  }());
  exports.DateWrapper = DateWrapper;
  function setValueOnPath(global, path, value) {
    var parts = path.split('.');
    var obj = global;
    while (parts.length > 1) {
      var name = parts.shift();
      if (obj.hasOwnProperty(name) && isPresent(obj[name])) {
        obj = obj[name];
      } else {
        obj = obj[name] = {};
      }
    }
    if (obj === undefined || obj === null) {
      obj = {};
    }
    obj[parts.shift()] = value;
  }
  exports.setValueOnPath = setValueOnPath;
  var _symbolIterator = null;
  function getSymbolIterator() {
    if (isBlank(_symbolIterator)) {
      if (isPresent(globalScope.Symbol) && isPresent(Symbol.iterator)) {
        _symbolIterator = Symbol.iterator;
      } else {
        var keys = Object.getOwnPropertyNames(Map.prototype);
        for (var i = 0; i < keys.length; ++i) {
          var key = keys[i];
          if (key !== 'entries' && key !== 'size' && Map.prototype[key] === Map.prototype['entries']) {
            _symbolIterator = key;
          }
        }
      }
    }
    return _symbolIterator;
  }
  exports.getSymbolIterator = getSymbolIterator;
  function evalExpression(sourceUrl, expr, declarations, vars) {
    var fnBody = declarations + "\nreturn " + expr + "\n//# sourceURL=" + sourceUrl;
    var fnArgNames = [];
    var fnArgValues = [];
    for (var argName in vars) {
      fnArgNames.push(argName);
      fnArgValues.push(vars[argName]);
    }
    return new (Function.bind.apply(Function, [void 0].concat(fnArgNames.concat(fnBody))))().apply(void 0, fnArgValues);
  }
  exports.evalExpression = evalExpression;
  function isPrimitive(obj) {
    return !isJsObject(obj);
  }
  exports.isPrimitive = isPrimitive;
  function hasConstructor(value, type) {
    return value.constructor === type;
  }
  exports.hasConstructor = hasConstructor;
  function bitWiseOr(values) {
    return values.reduce(function(a, b) {
      return a | b;
    });
  }
  exports.bitWiseOr = bitWiseOr;
  function bitWiseAnd(values) {
    return values.reduce(function(a, b) {
      return a & b;
    });
  }
  exports.bitWiseAnd = bitWiseAnd;
  function escape(s) {
    return _global.encodeURI(s);
  }
  exports.escape = escape;
  return module.exports;
});

System.registerDynamic("@angular/core/src/util/decorators.js", ["../../src/facade/lang"], true, function($__require, exports, module) {
  "use strict";
  ;
  var define,
      global = this,
      GLOBAL = this;
  var lang_1 = $__require('../../src/facade/lang');
  var _nextClassId = 0;
  function extractAnnotation(annotation) {
    if (lang_1.isFunction(annotation) && annotation.hasOwnProperty('annotation')) {
      annotation = annotation.annotation;
    }
    return annotation;
  }
  function applyParams(fnOrArray, key) {
    if (fnOrArray === Object || fnOrArray === String || fnOrArray === Function || fnOrArray === Number || fnOrArray === Array) {
      throw new Error("Can not use native " + lang_1.stringify(fnOrArray) + " as constructor");
    }
    if (lang_1.isFunction(fnOrArray)) {
      return fnOrArray;
    } else if (fnOrArray instanceof Array) {
      var annotations = fnOrArray;
      var fn = fnOrArray[fnOrArray.length - 1];
      if (!lang_1.isFunction(fn)) {
        throw new Error("Last position of Class method array must be Function in key " + key + " was '" + lang_1.stringify(fn) + "'");
      }
      var annoLength = annotations.length - 1;
      if (annoLength != fn.length) {
        throw new Error("Number of annotations (" + annoLength + ") does not match number of arguments (" + fn.length + ") in the function: " + lang_1.stringify(fn));
      }
      var paramsAnnotations = [];
      for (var i = 0,
          ii = annotations.length - 1; i < ii; i++) {
        var paramAnnotations = [];
        paramsAnnotations.push(paramAnnotations);
        var annotation = annotations[i];
        if (annotation instanceof Array) {
          for (var j = 0; j < annotation.length; j++) {
            paramAnnotations.push(extractAnnotation(annotation[j]));
          }
        } else if (lang_1.isFunction(annotation)) {
          paramAnnotations.push(extractAnnotation(annotation));
        } else {
          paramAnnotations.push(annotation);
        }
      }
      Reflect.defineMetadata('parameters', paramsAnnotations, fn);
      return fn;
    } else {
      throw new Error("Only Function or Array is supported in Class definition for key '" + key + "' is '" + lang_1.stringify(fnOrArray) + "'");
    }
  }
  function Class(clsDef) {
    var constructor = applyParams(clsDef.hasOwnProperty('constructor') ? clsDef.constructor : undefined, 'constructor');
    var proto = constructor.prototype;
    if (clsDef.hasOwnProperty('extends')) {
      if (lang_1.isFunction(clsDef.extends)) {
        constructor.prototype = proto = Object.create(clsDef.extends.prototype);
      } else {
        throw new Error("Class definition 'extends' property must be a constructor function was: " + lang_1.stringify(clsDef.extends));
      }
    }
    for (var key in clsDef) {
      if (key != 'extends' && key != 'prototype' && clsDef.hasOwnProperty(key)) {
        proto[key] = applyParams(clsDef[key], key);
      }
    }
    if (this && this.annotations instanceof Array) {
      Reflect.defineMetadata('annotations', this.annotations, constructor);
    }
    if (!constructor['name']) {
      constructor['overriddenName'] = "class" + _nextClassId++;
    }
    return constructor;
  }
  exports.Class = Class;
  var Reflect = lang_1.global.Reflect;
  (function checkReflect() {
    if (!(Reflect && Reflect.getMetadata)) {
      throw 'reflect-metadata shim is required when using class decorators';
    }
  })();
  function makeDecorator(annotationCls, chainFn) {
    if (chainFn === void 0) {
      chainFn = null;
    }
    function DecoratorFactory(objOrType) {
      var annotationInstance = new annotationCls(objOrType);
      if (this instanceof annotationCls) {
        return annotationInstance;
      } else {
        var chainAnnotation = lang_1.isFunction(this) && this.annotations instanceof Array ? this.annotations : [];
        chainAnnotation.push(annotationInstance);
        var TypeDecorator = function TypeDecorator(cls) {
          var annotations = Reflect.getOwnMetadata('annotations', cls);
          annotations = annotations || [];
          annotations.push(annotationInstance);
          Reflect.defineMetadata('annotations', annotations, cls);
          return cls;
        };
        TypeDecorator.annotations = chainAnnotation;
        TypeDecorator.Class = Class;
        if (chainFn)
          chainFn(TypeDecorator);
        return TypeDecorator;
      }
    }
    DecoratorFactory.prototype = Object.create(annotationCls.prototype);
    DecoratorFactory.annotationCls = annotationCls;
    return DecoratorFactory;
  }
  exports.makeDecorator = makeDecorator;
  function makeParamDecorator(annotationCls) {
    function ParamDecoratorFactory() {
      var args = [];
      for (var _i = 0; _i < arguments.length; _i++) {
        args[_i - 0] = arguments[_i];
      }
      var annotationInstance = Object.create(annotationCls.prototype);
      annotationCls.apply(annotationInstance, args);
      if (this instanceof annotationCls) {
        return annotationInstance;
      } else {
        ParamDecorator.annotation = annotationInstance;
        return ParamDecorator;
      }
      function ParamDecorator(cls, unusedKey, index) {
        var parameters = Reflect.getMetadata('parameters', cls);
        parameters = parameters || [];
        while (parameters.length <= index) {
          parameters.push(null);
        }
        parameters[index] = parameters[index] || [];
        var annotationsForParam = parameters[index];
        annotationsForParam.push(annotationInstance);
        Reflect.defineMetadata('parameters', parameters, cls);
        return cls;
      }
    }
    ParamDecoratorFactory.prototype = Object.create(annotationCls.prototype);
    ParamDecoratorFactory.annotationCls = annotationCls;
    return ParamDecoratorFactory;
  }
  exports.makeParamDecorator = makeParamDecorator;
  function makePropDecorator(annotationCls) {
    function PropDecoratorFactory() {
      var args = [];
      for (var _i = 0; _i < arguments.length; _i++) {
        args[_i - 0] = arguments[_i];
      }
      var decoratorInstance = Object.create(annotationCls.prototype);
      annotationCls.apply(decoratorInstance, args);
      if (this instanceof annotationCls) {
        return decoratorInstance;
      } else {
        return function PropDecorator(target, name) {
          var meta = Reflect.getOwnMetadata('propMetadata', target.constructor);
          meta = meta || {};
          meta[name] = meta[name] || [];
          meta[name].unshift(decoratorInstance);
          Reflect.defineMetadata('propMetadata', meta, target.constructor);
        };
      }
    }
    PropDecoratorFactory.prototype = Object.create(annotationCls.prototype);
    PropDecoratorFactory.annotationCls = annotationCls;
    return PropDecoratorFactory;
  }
  exports.makePropDecorator = makePropDecorator;
  return module.exports;
});

System.registerDynamic("@angular/core/src/di/decorators.js", ["./metadata", "../util/decorators"], true, function($__require, exports, module) {
  "use strict";
  ;
  var define,
      global = this,
      GLOBAL = this;
  var metadata_1 = $__require('./metadata');
  var decorators_1 = $__require('../util/decorators');
  exports.Inject = decorators_1.makeParamDecorator(metadata_1.InjectMetadata);
  exports.Optional = decorators_1.makeParamDecorator(metadata_1.OptionalMetadata);
  exports.Injectable = decorators_1.makeDecorator(metadata_1.InjectableMetadata);
  exports.Self = decorators_1.makeParamDecorator(metadata_1.SelfMetadata);
  exports.Host = decorators_1.makeParamDecorator(metadata_1.HostMetadata);
  exports.SkipSelf = decorators_1.makeParamDecorator(metadata_1.SkipSelfMetadata);
  return module.exports;
});

System.registerDynamic("@angular/core/src/console.js", ["./facade/lang", "./di/decorators"], true, function($__require, exports, module) {
  "use strict";
  ;
  var define,
      global = this,
      GLOBAL = this;
  var lang_1 = $__require('./facade/lang');
  var decorators_1 = $__require('./di/decorators');
  var _warnImpl = lang_1.warn;
  var Console = (function() {
    function Console() {}
    Console.prototype.log = function(message) {
      lang_1.print(message);
    };
    Console.prototype.warn = function(message) {
      _warnImpl(message);
    };
    Console.decorators = [{type: decorators_1.Injectable}];
    return Console;
  }());
  exports.Console = Console;
  return module.exports;
});

System.registerDynamic("@angular/core/private_export.js", ["./src/change_detection/constants", "./src/security", "./src/di/reflective_provider", "./src/metadata/lifecycle_hooks", "./src/reflection/reflector_reader", "./src/linker/component_resolver", "./src/linker/element", "./src/linker/view", "./src/linker/view_type", "./src/linker/view_utils", "./src/metadata/view", "./src/linker/debug_context", "./src/change_detection/change_detection_util", "./src/render/api", "./src/linker/template_ref", "./src/profile/wtf_init", "./src/reflection/reflection_capabilities", "./src/util/decorators", "./src/debug/debug_renderer", "./src/di/provider_util", "./src/console"], true, function($__require, exports, module) {
  "use strict";
  ;
  var define,
      global = this,
      GLOBAL = this;
  var constants = $__require('./src/change_detection/constants');
  var security = $__require('./src/security');
  var reflective_provider = $__require('./src/di/reflective_provider');
  var lifecycle_hooks = $__require('./src/metadata/lifecycle_hooks');
  var reflector_reader = $__require('./src/reflection/reflector_reader');
  var component_resolver = $__require('./src/linker/component_resolver');
  var element = $__require('./src/linker/element');
  var view = $__require('./src/linker/view');
  var view_type = $__require('./src/linker/view_type');
  var view_utils = $__require('./src/linker/view_utils');
  var metadata_view = $__require('./src/metadata/view');
  var debug_context = $__require('./src/linker/debug_context');
  var change_detection_util = $__require('./src/change_detection/change_detection_util');
  var api = $__require('./src/render/api');
  var template_ref = $__require('./src/linker/template_ref');
  var wtf_init = $__require('./src/profile/wtf_init');
  var reflection_capabilities = $__require('./src/reflection/reflection_capabilities');
  var decorators = $__require('./src/util/decorators');
  var debug = $__require('./src/debug/debug_renderer');
  var provider_util = $__require('./src/di/provider_util');
  var console = $__require('./src/console');
  exports.__core_private__ = {
    isDefaultChangeDetectionStrategy: constants.isDefaultChangeDetectionStrategy,
    ChangeDetectorState: constants.ChangeDetectorState,
    CHANGE_DETECTION_STRATEGY_VALUES: constants.CHANGE_DETECTION_STRATEGY_VALUES,
    constructDependencies: reflective_provider.constructDependencies,
    LifecycleHooks: lifecycle_hooks.LifecycleHooks,
    LIFECYCLE_HOOKS_VALUES: lifecycle_hooks.LIFECYCLE_HOOKS_VALUES,
    ReflectorReader: reflector_reader.ReflectorReader,
    ReflectorComponentResolver: component_resolver.ReflectorComponentResolver,
    AppElement: element.AppElement,
    AppView: view.AppView,
    DebugAppView: view.DebugAppView,
    ViewType: view_type.ViewType,
    MAX_INTERPOLATION_VALUES: view_utils.MAX_INTERPOLATION_VALUES,
    checkBinding: view_utils.checkBinding,
    flattenNestedViewRenderNodes: view_utils.flattenNestedViewRenderNodes,
    interpolate: view_utils.interpolate,
    ViewUtils: view_utils.ViewUtils,
    VIEW_ENCAPSULATION_VALUES: metadata_view.VIEW_ENCAPSULATION_VALUES,
    DebugContext: debug_context.DebugContext,
    StaticNodeDebugInfo: debug_context.StaticNodeDebugInfo,
    devModeEqual: change_detection_util.devModeEqual,
    uninitialized: change_detection_util.uninitialized,
    ValueUnwrapper: change_detection_util.ValueUnwrapper,
    RenderDebugInfo: api.RenderDebugInfo,
    SecurityContext: security.SecurityContext,
    SanitizationService: security.SanitizationService,
    TemplateRef_: template_ref.TemplateRef_,
    wtfInit: wtf_init.wtfInit,
    ReflectionCapabilities: reflection_capabilities.ReflectionCapabilities,
    makeDecorator: decorators.makeDecorator,
    DebugDomRootRenderer: debug.DebugDomRootRenderer,
    createProvider: provider_util.createProvider,
    isProviderLiteral: provider_util.isProviderLiteral,
    EMPTY_ARRAY: view_utils.EMPTY_ARRAY,
    EMPTY_MAP: view_utils.EMPTY_MAP,
    pureProxy1: view_utils.pureProxy1,
    pureProxy2: view_utils.pureProxy2,
    pureProxy3: view_utils.pureProxy3,
    pureProxy4: view_utils.pureProxy4,
    pureProxy5: view_utils.pureProxy5,
    pureProxy6: view_utils.pureProxy6,
    pureProxy7: view_utils.pureProxy7,
    pureProxy8: view_utils.pureProxy8,
    pureProxy9: view_utils.pureProxy9,
    pureProxy10: view_utils.pureProxy10,
    castByValue: view_utils.castByValue,
    Console: console.Console
  };
  return module.exports;
});

System.registerDynamic("@angular/core/index.js", ["./src/metadata", "./src/util", "./src/di", "./src/application_ref", "./src/application_tokens", "./src/zone", "./src/render", "./src/linker", "./src/debug/debug_node", "./src/testability/testability", "./src/change_detection", "./src/platform_directives_and_pipes", "./src/platform_common_providers", "./src/application_common_providers", "./src/reflection/reflection", "./src/profile/profile", "./src/facade/lang", "./src/facade/async", "./src/facade/exceptions", "./private_export"], true, function($__require, exports, module) {
  "use strict";
  ;
  var define,
      global = this,
      GLOBAL = this;
  function __export(m) {
    for (var p in m)
      if (!exports.hasOwnProperty(p))
        exports[p] = m[p];
  }
  __export($__require('./src/metadata'));
  __export($__require('./src/util'));
  __export($__require('./src/di'));
  var application_ref_1 = $__require('./src/application_ref');
  exports.createPlatform = application_ref_1.createPlatform;
  exports.assertPlatform = application_ref_1.assertPlatform;
  exports.disposePlatform = application_ref_1.disposePlatform;
  exports.getPlatform = application_ref_1.getPlatform;
  exports.coreBootstrap = application_ref_1.coreBootstrap;
  exports.coreLoadAndBootstrap = application_ref_1.coreLoadAndBootstrap;
  exports.createNgZone = application_ref_1.createNgZone;
  exports.PlatformRef = application_ref_1.PlatformRef;
  exports.ApplicationRef = application_ref_1.ApplicationRef;
  var application_tokens_1 = $__require('./src/application_tokens');
  exports.APP_ID = application_tokens_1.APP_ID;
  exports.APP_INITIALIZER = application_tokens_1.APP_INITIALIZER;
  exports.PACKAGE_ROOT_URL = application_tokens_1.PACKAGE_ROOT_URL;
  exports.PLATFORM_INITIALIZER = application_tokens_1.PLATFORM_INITIALIZER;
  __export($__require('./src/zone'));
  __export($__require('./src/render'));
  __export($__require('./src/linker'));
  var debug_node_1 = $__require('./src/debug/debug_node');
  exports.DebugElement = debug_node_1.DebugElement;
  exports.DebugNode = debug_node_1.DebugNode;
  exports.asNativeElements = debug_node_1.asNativeElements;
  exports.getDebugNode = debug_node_1.getDebugNode;
  __export($__require('./src/testability/testability'));
  __export($__require('./src/change_detection'));
  __export($__require('./src/platform_directives_and_pipes'));
  __export($__require('./src/platform_common_providers'));
  __export($__require('./src/application_common_providers'));
  __export($__require('./src/reflection/reflection'));
  var profile_1 = $__require('./src/profile/profile');
  exports.wtfCreateScope = profile_1.wtfCreateScope;
  exports.wtfLeave = profile_1.wtfLeave;
  exports.wtfStartTimeRange = profile_1.wtfStartTimeRange;
  exports.wtfEndTimeRange = profile_1.wtfEndTimeRange;
  var lang_1 = $__require('./src/facade/lang');
  exports.Type = lang_1.Type;
  exports.enableProdMode = lang_1.enableProdMode;
  var async_1 = $__require('./src/facade/async');
  exports.EventEmitter = async_1.EventEmitter;
  var exceptions_1 = $__require('./src/facade/exceptions');
  exports.ExceptionHandler = exceptions_1.ExceptionHandler;
  exports.WrappedException = exceptions_1.WrappedException;
  exports.BaseException = exceptions_1.BaseException;
  __export($__require('./private_export'));
  return module.exports;
});

System.registerDynamic("@angular/compiler/src/expression_parser/lexer.js", ["@angular/core", "../../src/facade/collection", "../../src/facade/lang", "../../src/facade/exceptions"], true, function($__require, exports, module) {
  "use strict";
  ;
  var define,
      global = this,
      GLOBAL = this;
  var __extends = (this && this.__extends) || function(d, b) {
    for (var p in b)
      if (b.hasOwnProperty(p))
        d[p] = b[p];
    function __() {
      this.constructor = d;
    }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
  };
  var core_1 = $__require('@angular/core');
  var collection_1 = $__require('../../src/facade/collection');
  var lang_1 = $__require('../../src/facade/lang');
  var exceptions_1 = $__require('../../src/facade/exceptions');
  (function(TokenType) {
    TokenType[TokenType["Character"] = 0] = "Character";
    TokenType[TokenType["Identifier"] = 1] = "Identifier";
    TokenType[TokenType["Keyword"] = 2] = "Keyword";
    TokenType[TokenType["String"] = 3] = "String";
    TokenType[TokenType["Operator"] = 4] = "Operator";
    TokenType[TokenType["Number"] = 5] = "Number";
  })(exports.TokenType || (exports.TokenType = {}));
  var TokenType = exports.TokenType;
  var Lexer = (function() {
    function Lexer() {}
    Lexer.prototype.tokenize = function(text) {
      var scanner = new _Scanner(text);
      var tokens = [];
      var token = scanner.scanToken();
      while (token != null) {
        tokens.push(token);
        token = scanner.scanToken();
      }
      return tokens;
    };
    Lexer.decorators = [{type: core_1.Injectable}];
    return Lexer;
  }());
  exports.Lexer = Lexer;
  var Token = (function() {
    function Token(index, type, numValue, strValue) {
      this.index = index;
      this.type = type;
      this.numValue = numValue;
      this.strValue = strValue;
    }
    Token.prototype.isCharacter = function(code) {
      return (this.type == TokenType.Character && this.numValue == code);
    };
    Token.prototype.isNumber = function() {
      return (this.type == TokenType.Number);
    };
    Token.prototype.isString = function() {
      return (this.type == TokenType.String);
    };
    Token.prototype.isOperator = function(operater) {
      return (this.type == TokenType.Operator && this.strValue == operater);
    };
    Token.prototype.isIdentifier = function() {
      return (this.type == TokenType.Identifier);
    };
    Token.prototype.isKeyword = function() {
      return (this.type == TokenType.Keyword);
    };
    Token.prototype.isKeywordDeprecatedVar = function() {
      return (this.type == TokenType.Keyword && this.strValue == "var");
    };
    Token.prototype.isKeywordLet = function() {
      return (this.type == TokenType.Keyword && this.strValue == "let");
    };
    Token.prototype.isKeywordNull = function() {
      return (this.type == TokenType.Keyword && this.strValue == "null");
    };
    Token.prototype.isKeywordUndefined = function() {
      return (this.type == TokenType.Keyword && this.strValue == "undefined");
    };
    Token.prototype.isKeywordTrue = function() {
      return (this.type == TokenType.Keyword && this.strValue == "true");
    };
    Token.prototype.isKeywordFalse = function() {
      return (this.type == TokenType.Keyword && this.strValue == "false");
    };
    Token.prototype.toNumber = function() {
      return (this.type == TokenType.Number) ? this.numValue : -1;
    };
    Token.prototype.toString = function() {
      switch (this.type) {
        case TokenType.Character:
        case TokenType.Identifier:
        case TokenType.Keyword:
        case TokenType.Operator:
        case TokenType.String:
          return this.strValue;
        case TokenType.Number:
          return this.numValue.toString();
        default:
          return null;
      }
    };
    return Token;
  }());
  exports.Token = Token;
  function newCharacterToken(index, code) {
    return new Token(index, TokenType.Character, code, lang_1.StringWrapper.fromCharCode(code));
  }
  function newIdentifierToken(index, text) {
    return new Token(index, TokenType.Identifier, 0, text);
  }
  function newKeywordToken(index, text) {
    return new Token(index, TokenType.Keyword, 0, text);
  }
  function newOperatorToken(index, text) {
    return new Token(index, TokenType.Operator, 0, text);
  }
  function newStringToken(index, text) {
    return new Token(index, TokenType.String, 0, text);
  }
  function newNumberToken(index, n) {
    return new Token(index, TokenType.Number, n, "");
  }
  exports.EOF = new Token(-1, TokenType.Character, 0, "");
  exports.$EOF = 0;
  exports.$TAB = 9;
  exports.$LF = 10;
  exports.$VTAB = 11;
  exports.$FF = 12;
  exports.$CR = 13;
  exports.$SPACE = 32;
  exports.$BANG = 33;
  exports.$DQ = 34;
  exports.$HASH = 35;
  exports.$$ = 36;
  exports.$PERCENT = 37;
  exports.$AMPERSAND = 38;
  exports.$SQ = 39;
  exports.$LPAREN = 40;
  exports.$RPAREN = 41;
  exports.$STAR = 42;
  exports.$PLUS = 43;
  exports.$COMMA = 44;
  exports.$MINUS = 45;
  exports.$PERIOD = 46;
  exports.$SLASH = 47;
  exports.$COLON = 58;
  exports.$SEMICOLON = 59;
  exports.$LT = 60;
  exports.$EQ = 61;
  exports.$GT = 62;
  exports.$QUESTION = 63;
  var $0 = 48;
  var $9 = 57;
  var $A = 65,
      $E = 69,
      $Z = 90;
  exports.$LBRACKET = 91;
  exports.$BACKSLASH = 92;
  exports.$RBRACKET = 93;
  var $CARET = 94;
  var $_ = 95;
  exports.$BT = 96;
  var $a = 97,
      $e = 101,
      $f = 102;
  var $n = 110,
      $r = 114,
      $t = 116,
      $u = 117,
      $v = 118,
      $z = 122;
  exports.$LBRACE = 123;
  exports.$BAR = 124;
  exports.$RBRACE = 125;
  var $NBSP = 160;
  var ScannerError = (function(_super) {
    __extends(ScannerError, _super);
    function ScannerError(message) {
      _super.call(this);
      this.message = message;
    }
    ScannerError.prototype.toString = function() {
      return this.message;
    };
    return ScannerError;
  }(exceptions_1.BaseException));
  exports.ScannerError = ScannerError;
  var _Scanner = (function() {
    function _Scanner(input) {
      this.input = input;
      this.peek = 0;
      this.index = -1;
      this.length = input.length;
      this.advance();
    }
    _Scanner.prototype.advance = function() {
      this.peek = ++this.index >= this.length ? exports.$EOF : lang_1.StringWrapper.charCodeAt(this.input, this.index);
    };
    _Scanner.prototype.scanToken = function() {
      var input = this.input,
          length = this.length,
          peek = this.peek,
          index = this.index;
      while (peek <= exports.$SPACE) {
        if (++index >= length) {
          peek = exports.$EOF;
          break;
        } else {
          peek = lang_1.StringWrapper.charCodeAt(input, index);
        }
      }
      this.peek = peek;
      this.index = index;
      if (index >= length) {
        return null;
      }
      if (isIdentifierStart(peek))
        return this.scanIdentifier();
      if (isDigit(peek))
        return this.scanNumber(index);
      var start = index;
      switch (peek) {
        case exports.$PERIOD:
          this.advance();
          return isDigit(this.peek) ? this.scanNumber(start) : newCharacterToken(start, exports.$PERIOD);
        case exports.$LPAREN:
        case exports.$RPAREN:
        case exports.$LBRACE:
        case exports.$RBRACE:
        case exports.$LBRACKET:
        case exports.$RBRACKET:
        case exports.$COMMA:
        case exports.$COLON:
        case exports.$SEMICOLON:
          return this.scanCharacter(start, peek);
        case exports.$SQ:
        case exports.$DQ:
          return this.scanString();
        case exports.$HASH:
        case exports.$PLUS:
        case exports.$MINUS:
        case exports.$STAR:
        case exports.$SLASH:
        case exports.$PERCENT:
        case $CARET:
          return this.scanOperator(start, lang_1.StringWrapper.fromCharCode(peek));
        case exports.$QUESTION:
          return this.scanComplexOperator(start, '?', exports.$PERIOD, '.');
        case exports.$LT:
        case exports.$GT:
          return this.scanComplexOperator(start, lang_1.StringWrapper.fromCharCode(peek), exports.$EQ, '=');
        case exports.$BANG:
        case exports.$EQ:
          return this.scanComplexOperator(start, lang_1.StringWrapper.fromCharCode(peek), exports.$EQ, '=', exports.$EQ, '=');
        case exports.$AMPERSAND:
          return this.scanComplexOperator(start, '&', exports.$AMPERSAND, '&');
        case exports.$BAR:
          return this.scanComplexOperator(start, '|', exports.$BAR, '|');
        case $NBSP:
          while (isWhitespace(this.peek))
            this.advance();
          return this.scanToken();
      }
      this.error("Unexpected character [" + lang_1.StringWrapper.fromCharCode(peek) + "]", 0);
      return null;
    };
    _Scanner.prototype.scanCharacter = function(start, code) {
      this.advance();
      return newCharacterToken(start, code);
    };
    _Scanner.prototype.scanOperator = function(start, str) {
      this.advance();
      return newOperatorToken(start, str);
    };
    _Scanner.prototype.scanComplexOperator = function(start, one, twoCode, two, threeCode, three) {
      this.advance();
      var str = one;
      if (this.peek == twoCode) {
        this.advance();
        str += two;
      }
      if (lang_1.isPresent(threeCode) && this.peek == threeCode) {
        this.advance();
        str += three;
      }
      return newOperatorToken(start, str);
    };
    _Scanner.prototype.scanIdentifier = function() {
      var start = this.index;
      this.advance();
      while (isIdentifierPart(this.peek))
        this.advance();
      var str = this.input.substring(start, this.index);
      if (collection_1.SetWrapper.has(KEYWORDS, str)) {
        return newKeywordToken(start, str);
      } else {
        return newIdentifierToken(start, str);
      }
    };
    _Scanner.prototype.scanNumber = function(start) {
      var simple = (this.index === start);
      this.advance();
      while (true) {
        if (isDigit(this.peek)) {} else if (this.peek == exports.$PERIOD) {
          simple = false;
        } else if (isExponentStart(this.peek)) {
          this.advance();
          if (isExponentSign(this.peek))
            this.advance();
          if (!isDigit(this.peek))
            this.error('Invalid exponent', -1);
          simple = false;
        } else {
          break;
        }
        this.advance();
      }
      var str = this.input.substring(start, this.index);
      var value = simple ? lang_1.NumberWrapper.parseIntAutoRadix(str) : lang_1.NumberWrapper.parseFloat(str);
      return newNumberToken(start, value);
    };
    _Scanner.prototype.scanString = function() {
      var start = this.index;
      var quote = this.peek;
      this.advance();
      var buffer;
      var marker = this.index;
      var input = this.input;
      while (this.peek != quote) {
        if (this.peek == exports.$BACKSLASH) {
          if (buffer == null)
            buffer = new lang_1.StringJoiner();
          buffer.add(input.substring(marker, this.index));
          this.advance();
          var unescapedCode;
          if (this.peek == $u) {
            var hex = input.substring(this.index + 1, this.index + 5);
            try {
              unescapedCode = lang_1.NumberWrapper.parseInt(hex, 16);
            } catch (e) {
              this.error("Invalid unicode escape [\\u" + hex + "]", 0);
            }
            for (var i = 0; i < 5; i++) {
              this.advance();
            }
          } else {
            unescapedCode = unescape(this.peek);
            this.advance();
          }
          buffer.add(lang_1.StringWrapper.fromCharCode(unescapedCode));
          marker = this.index;
        } else if (this.peek == exports.$EOF) {
          this.error('Unterminated quote', 0);
        } else {
          this.advance();
        }
      }
      var last = input.substring(marker, this.index);
      this.advance();
      var unescaped = last;
      if (buffer != null) {
        buffer.add(last);
        unescaped = buffer.toString();
      }
      return newStringToken(start, unescaped);
    };
    _Scanner.prototype.error = function(message, offset) {
      var position = this.index + offset;
      throw new ScannerError("Lexer Error: " + message + " at column " + position + " in expression [" + this.input + "]");
    };
    return _Scanner;
  }());
  function isWhitespace(code) {
    return (code >= exports.$TAB && code <= exports.$SPACE) || (code == $NBSP);
  }
  function isIdentifierStart(code) {
    return ($a <= code && code <= $z) || ($A <= code && code <= $Z) || (code == $_) || (code == exports.$$);
  }
  function isIdentifier(input) {
    if (input.length == 0)
      return false;
    var scanner = new _Scanner(input);
    if (!isIdentifierStart(scanner.peek))
      return false;
    scanner.advance();
    while (scanner.peek !== exports.$EOF) {
      if (!isIdentifierPart(scanner.peek))
        return false;
      scanner.advance();
    }
    return true;
  }
  exports.isIdentifier = isIdentifier;
  function isIdentifierPart(code) {
    return ($a <= code && code <= $z) || ($A <= code && code <= $Z) || ($0 <= code && code <= $9) || (code == $_) || (code == exports.$$);
  }
  function isDigit(code) {
    return $0 <= code && code <= $9;
  }
  function isExponentStart(code) {
    return code == $e || code == $E;
  }
  function isExponentSign(code) {
    return code == exports.$MINUS || code == exports.$PLUS;
  }
  function isQuote(code) {
    return code === exports.$SQ || code === exports.$DQ || code === exports.$BT;
  }
  exports.isQuote = isQuote;
  function unescape(code) {
    switch (code) {
      case $n:
        return exports.$LF;
      case $f:
        return exports.$FF;
      case $r:
        return exports.$CR;
      case $t:
        return exports.$TAB;
      case $v:
        return exports.$VTAB;
      default:
        return code;
    }
  }
  var OPERATORS = collection_1.SetWrapper.createFromList(['+', '-', '*', '/', '%', '^', '=', '==', '!=', '===', '!==', '<', '>', '<=', '>=', '&&', '||', '&', '|', '!', '?', '#', '?.']);
  var KEYWORDS = collection_1.SetWrapper.createFromList(['var', 'let', 'null', 'undefined', 'true', 'false', 'if', 'else']);
  return module.exports;
});

System.registerDynamic("@angular/compiler/src/compiler.js", ["@angular/core", "../src/facade/lang", "./template_ast", "./template_parser", "./config", "./compile_metadata", "./offline_compiler", "./runtime_compiler", "./url_resolver", "./xhr", "./view_resolver", "./directive_resolver", "./pipe_resolver", "./html_parser", "./directive_normalizer", "./metadata_resolver", "./style_compiler", "./view_compiler/view_compiler", "./schema/element_schema_registry", "./schema/dom_element_schema_registry", "./expression_parser/parser", "./expression_parser/lexer"], true, function($__require, exports, module) {
  "use strict";
  ;
  var define,
      global = this,
      GLOBAL = this;
  function __export(m) {
    for (var p in m)
      if (!exports.hasOwnProperty(p))
        exports[p] = m[p];
  }
  var core_1 = $__require('@angular/core');
  var lang_1 = $__require('../src/facade/lang');
  __export($__require('./template_ast'));
  var template_parser_1 = $__require('./template_parser');
  exports.TEMPLATE_TRANSFORMS = template_parser_1.TEMPLATE_TRANSFORMS;
  var config_1 = $__require('./config');
  exports.CompilerConfig = config_1.CompilerConfig;
  exports.RenderTypes = config_1.RenderTypes;
  __export($__require('./compile_metadata'));
  __export($__require('./offline_compiler'));
  var runtime_compiler_1 = $__require('./runtime_compiler');
  exports.RuntimeCompiler = runtime_compiler_1.RuntimeCompiler;
  __export($__require('./url_resolver'));
  __export($__require('./xhr'));
  var view_resolver_1 = $__require('./view_resolver');
  exports.ViewResolver = view_resolver_1.ViewResolver;
  var directive_resolver_1 = $__require('./directive_resolver');
  exports.DirectiveResolver = directive_resolver_1.DirectiveResolver;
  var pipe_resolver_1 = $__require('./pipe_resolver');
  exports.PipeResolver = pipe_resolver_1.PipeResolver;
  var template_parser_2 = $__require('./template_parser');
  var html_parser_1 = $__require('./html_parser');
  var directive_normalizer_1 = $__require('./directive_normalizer');
  var metadata_resolver_1 = $__require('./metadata_resolver');
  var style_compiler_1 = $__require('./style_compiler');
  var view_compiler_1 = $__require('./view_compiler/view_compiler');
  var config_2 = $__require('./config');
  var runtime_compiler_2 = $__require('./runtime_compiler');
  var element_schema_registry_1 = $__require('./schema/element_schema_registry');
  var dom_element_schema_registry_1 = $__require('./schema/dom_element_schema_registry');
  var url_resolver_2 = $__require('./url_resolver');
  var parser_1 = $__require('./expression_parser/parser');
  var lexer_1 = $__require('./expression_parser/lexer');
  var view_resolver_2 = $__require('./view_resolver');
  var directive_resolver_2 = $__require('./directive_resolver');
  var pipe_resolver_2 = $__require('./pipe_resolver');
  function _createCompilerConfig() {
    return new config_2.CompilerConfig(lang_1.assertionsEnabled(), false, true);
  }
  exports.COMPILER_PROVIDERS = [lexer_1.Lexer, parser_1.Parser, html_parser_1.HtmlParser, template_parser_2.TemplateParser, directive_normalizer_1.DirectiveNormalizer, metadata_resolver_1.CompileMetadataResolver, url_resolver_2.DEFAULT_PACKAGE_URL_PROVIDER, style_compiler_1.StyleCompiler, view_compiler_1.ViewCompiler, {
    provide: config_2.CompilerConfig,
    useFactory: _createCompilerConfig,
    deps: []
  }, runtime_compiler_2.RuntimeCompiler, {
    provide: core_1.ComponentResolver,
    useExisting: runtime_compiler_2.RuntimeCompiler
  }, dom_element_schema_registry_1.DomElementSchemaRegistry, {
    provide: element_schema_registry_1.ElementSchemaRegistry,
    useExisting: dom_element_schema_registry_1.DomElementSchemaRegistry
  }, url_resolver_2.UrlResolver, view_resolver_2.ViewResolver, directive_resolver_2.DirectiveResolver, pipe_resolver_2.PipeResolver];
  return module.exports;
});

System.registerDynamic("@angular/compiler/src/template_ast.js", ["../src/facade/lang"], true, function($__require, exports, module) {
  "use strict";
  ;
  var define,
      global = this,
      GLOBAL = this;
  var lang_1 = $__require('../src/facade/lang');
  var TextAst = (function() {
    function TextAst(value, ngContentIndex, sourceSpan) {
      this.value = value;
      this.ngContentIndex = ngContentIndex;
      this.sourceSpan = sourceSpan;
    }
    TextAst.prototype.visit = function(visitor, context) {
      return visitor.visitText(this, context);
    };
    return TextAst;
  }());
  exports.TextAst = TextAst;
  var BoundTextAst = (function() {
    function BoundTextAst(value, ngContentIndex, sourceSpan) {
      this.value = value;
      this.ngContentIndex = ngContentIndex;
      this.sourceSpan = sourceSpan;
    }
    BoundTextAst.prototype.visit = function(visitor, context) {
      return visitor.visitBoundText(this, context);
    };
    return BoundTextAst;
  }());
  exports.BoundTextAst = BoundTextAst;
  var AttrAst = (function() {
    function AttrAst(name, value, sourceSpan) {
      this.name = name;
      this.value = value;
      this.sourceSpan = sourceSpan;
    }
    AttrAst.prototype.visit = function(visitor, context) {
      return visitor.visitAttr(this, context);
    };
    return AttrAst;
  }());
  exports.AttrAst = AttrAst;
  var BoundElementPropertyAst = (function() {
    function BoundElementPropertyAst(name, type, securityContext, value, unit, sourceSpan) {
      this.name = name;
      this.type = type;
      this.securityContext = securityContext;
      this.value = value;
      this.unit = unit;
      this.sourceSpan = sourceSpan;
    }
    BoundElementPropertyAst.prototype.visit = function(visitor, context) {
      return visitor.visitElementProperty(this, context);
    };
    return BoundElementPropertyAst;
  }());
  exports.BoundElementPropertyAst = BoundElementPropertyAst;
  var BoundEventAst = (function() {
    function BoundEventAst(name, target, handler, sourceSpan) {
      this.name = name;
      this.target = target;
      this.handler = handler;
      this.sourceSpan = sourceSpan;
    }
    BoundEventAst.prototype.visit = function(visitor, context) {
      return visitor.visitEvent(this, context);
    };
    Object.defineProperty(BoundEventAst.prototype, "fullName", {
      get: function() {
        if (lang_1.isPresent(this.target)) {
          return this.target + ":" + this.name;
        } else {
          return this.name;
        }
      },
      enumerable: true,
      configurable: true
    });
    return BoundEventAst;
  }());
  exports.BoundEventAst = BoundEventAst;
  var ReferenceAst = (function() {
    function ReferenceAst(name, value, sourceSpan) {
      this.name = name;
      this.value = value;
      this.sourceSpan = sourceSpan;
    }
    ReferenceAst.prototype.visit = function(visitor, context) {
      return visitor.visitReference(this, context);
    };
    return ReferenceAst;
  }());
  exports.ReferenceAst = ReferenceAst;
  var VariableAst = (function() {
    function VariableAst(name, value, sourceSpan) {
      this.name = name;
      this.value = value;
      this.sourceSpan = sourceSpan;
    }
    VariableAst.prototype.visit = function(visitor, context) {
      return visitor.visitVariable(this, context);
    };
    return VariableAst;
  }());
  exports.VariableAst = VariableAst;
  var ElementAst = (function() {
    function ElementAst(name, attrs, inputs, outputs, references, directives, providers, hasViewContainer, children, ngContentIndex, sourceSpan) {
      this.name = name;
      this.attrs = attrs;
      this.inputs = inputs;
      this.outputs = outputs;
      this.references = references;
      this.directives = directives;
      this.providers = providers;
      this.hasViewContainer = hasViewContainer;
      this.children = children;
      this.ngContentIndex = ngContentIndex;
      this.sourceSpan = sourceSpan;
    }
    ElementAst.prototype.visit = function(visitor, context) {
      return visitor.visitElement(this, context);
    };
    return ElementAst;
  }());
  exports.ElementAst = ElementAst;
  var EmbeddedTemplateAst = (function() {
    function EmbeddedTemplateAst(attrs, outputs, references, variables, directives, providers, hasViewContainer, children, ngContentIndex, sourceSpan) {
      this.attrs = attrs;
      this.outputs = outputs;
      this.references = references;
      this.variables = variables;
      this.directives = directives;
      this.providers = providers;
      this.hasViewContainer = hasViewContainer;
      this.children = children;
      this.ngContentIndex = ngContentIndex;
      this.sourceSpan = sourceSpan;
    }
    EmbeddedTemplateAst.prototype.visit = function(visitor, context) {
      return visitor.visitEmbeddedTemplate(this, context);
    };
    return EmbeddedTemplateAst;
  }());
  exports.EmbeddedTemplateAst = EmbeddedTemplateAst;
  var BoundDirectivePropertyAst = (function() {
    function BoundDirectivePropertyAst(directiveName, templateName, value, sourceSpan) {
      this.directiveName = directiveName;
      this.templateName = templateName;
      this.value = value;
      this.sourceSpan = sourceSpan;
    }
    BoundDirectivePropertyAst.prototype.visit = function(visitor, context) {
      return visitor.visitDirectiveProperty(this, context);
    };
    return BoundDirectivePropertyAst;
  }());
  exports.BoundDirectivePropertyAst = BoundDirectivePropertyAst;
  var DirectiveAst = (function() {
    function DirectiveAst(directive, inputs, hostProperties, hostEvents, sourceSpan) {
      this.directive = directive;
      this.inputs = inputs;
      this.hostProperties = hostProperties;
      this.hostEvents = hostEvents;
      this.sourceSpan = sourceSpan;
    }
    DirectiveAst.prototype.visit = function(visitor, context) {
      return visitor.visitDirective(this, context);
    };
    return DirectiveAst;
  }());
  exports.DirectiveAst = DirectiveAst;
  var ProviderAst = (function() {
    function ProviderAst(token, multiProvider, eager, providers, providerType, sourceSpan) {
      this.token = token;
      this.multiProvider = multiProvider;
      this.eager = eager;
      this.providers = providers;
      this.providerType = providerType;
      this.sourceSpan = sourceSpan;
    }
    ProviderAst.prototype.visit = function(visitor, context) {
      return null;
    };
    return ProviderAst;
  }());
  exports.ProviderAst = ProviderAst;
  (function(ProviderAstType) {
    ProviderAstType[ProviderAstType["PublicService"] = 0] = "PublicService";
    ProviderAstType[ProviderAstType["PrivateService"] = 1] = "PrivateService";
    ProviderAstType[ProviderAstType["Component"] = 2] = "Component";
    ProviderAstType[ProviderAstType["Directive"] = 3] = "Directive";
    ProviderAstType[ProviderAstType["Builtin"] = 4] = "Builtin";
  })(exports.ProviderAstType || (exports.ProviderAstType = {}));
  var ProviderAstType = exports.ProviderAstType;
  var NgContentAst = (function() {
    function NgContentAst(index, ngContentIndex, sourceSpan) {
      this.index = index;
      this.ngContentIndex = ngContentIndex;
      this.sourceSpan = sourceSpan;
    }
    NgContentAst.prototype.visit = function(visitor, context) {
      return visitor.visitNgContent(this, context);
    };
    return NgContentAst;
  }());
  exports.NgContentAst = NgContentAst;
  (function(PropertyBindingType) {
    PropertyBindingType[PropertyBindingType["Property"] = 0] = "Property";
    PropertyBindingType[PropertyBindingType["Attribute"] = 1] = "Attribute";
    PropertyBindingType[PropertyBindingType["Class"] = 2] = "Class";
    PropertyBindingType[PropertyBindingType["Style"] = 3] = "Style";
  })(exports.PropertyBindingType || (exports.PropertyBindingType = {}));
  var PropertyBindingType = exports.PropertyBindingType;
  function templateVisitAll(visitor, asts, context) {
    if (context === void 0) {
      context = null;
    }
    var result = [];
    asts.forEach(function(ast) {
      var astResult = ast.visit(visitor, context);
      if (lang_1.isPresent(astResult)) {
        result.push(astResult);
      }
    });
    return result;
  }
  exports.templateVisitAll = templateVisitAll;
  return module.exports;
});

System.registerDynamic("@angular/compiler/src/selector.js", ["../src/facade/collection", "../src/facade/lang", "../src/facade/exceptions"], true, function($__require, exports, module) {
  "use strict";
  ;
  var define,
      global = this,
      GLOBAL = this;
  var collection_1 = $__require('../src/facade/collection');
  var lang_1 = $__require('../src/facade/lang');
  var exceptions_1 = $__require('../src/facade/exceptions');
  var _EMPTY_ATTR_VALUE = '';
  var _SELECTOR_REGEXP = lang_1.RegExpWrapper.create('(\\:not\\()|' + '([-\\w]+)|' + '(?:\\.([-\\w]+))|' + '(?:\\[([-\\w*]+)(?:=([^\\]]*))?\\])|' + '(\\))|' + '(\\s*,\\s*)');
  var CssSelector = (function() {
    function CssSelector() {
      this.element = null;
      this.classNames = [];
      this.attrs = [];
      this.notSelectors = [];
    }
    CssSelector.parse = function(selector) {
      var results = [];
      var _addResult = function(res, cssSel) {
        if (cssSel.notSelectors.length > 0 && lang_1.isBlank(cssSel.element) && collection_1.ListWrapper.isEmpty(cssSel.classNames) && collection_1.ListWrapper.isEmpty(cssSel.attrs)) {
          cssSel.element = "*";
        }
        res.push(cssSel);
      };
      var cssSelector = new CssSelector();
      var matcher = lang_1.RegExpWrapper.matcher(_SELECTOR_REGEXP, selector);
      var match;
      var current = cssSelector;
      var inNot = false;
      while (lang_1.isPresent(match = lang_1.RegExpMatcherWrapper.next(matcher))) {
        if (lang_1.isPresent(match[1])) {
          if (inNot) {
            throw new exceptions_1.BaseException('Nesting :not is not allowed in a selector');
          }
          inNot = true;
          current = new CssSelector();
          cssSelector.notSelectors.push(current);
        }
        if (lang_1.isPresent(match[2])) {
          current.setElement(match[2]);
        }
        if (lang_1.isPresent(match[3])) {
          current.addClassName(match[3]);
        }
        if (lang_1.isPresent(match[4])) {
          current.addAttribute(match[4], match[5]);
        }
        if (lang_1.isPresent(match[6])) {
          inNot = false;
          current = cssSelector;
        }
        if (lang_1.isPresent(match[7])) {
          if (inNot) {
            throw new exceptions_1.BaseException('Multiple selectors in :not are not supported');
          }
          _addResult(results, cssSelector);
          cssSelector = current = new CssSelector();
        }
      }
      _addResult(results, cssSelector);
      return results;
    };
    CssSelector.prototype.isElementSelector = function() {
      return lang_1.isPresent(this.element) && collection_1.ListWrapper.isEmpty(this.classNames) && collection_1.ListWrapper.isEmpty(this.attrs) && this.notSelectors.length === 0;
    };
    CssSelector.prototype.setElement = function(element) {
      if (element === void 0) {
        element = null;
      }
      this.element = element;
    };
    CssSelector.prototype.getMatchingElementTemplate = function() {
      var tagName = lang_1.isPresent(this.element) ? this.element : 'div';
      var classAttr = this.classNames.length > 0 ? " class=\"" + this.classNames.join(' ') + "\"" : '';
      var attrs = '';
      for (var i = 0; i < this.attrs.length; i += 2) {
        var attrName = this.attrs[i];
        var attrValue = this.attrs[i + 1] !== '' ? "=\"" + this.attrs[i + 1] + "\"" : '';
        attrs += " " + attrName + attrValue;
      }
      return "<" + tagName + classAttr + attrs + "></" + tagName + ">";
    };
    CssSelector.prototype.addAttribute = function(name, value) {
      if (value === void 0) {
        value = _EMPTY_ATTR_VALUE;
      }
      this.attrs.push(name);
      if (lang_1.isPresent(value)) {
        value = value.toLowerCase();
      } else {
        value = _EMPTY_ATTR_VALUE;
      }
      this.attrs.push(value);
    };
    CssSelector.prototype.addClassName = function(name) {
      this.classNames.push(name.toLowerCase());
    };
    CssSelector.prototype.toString = function() {
      var res = '';
      if (lang_1.isPresent(this.element)) {
        res += this.element;
      }
      if (lang_1.isPresent(this.classNames)) {
        for (var i = 0; i < this.classNames.length; i++) {
          res += '.' + this.classNames[i];
        }
      }
      if (lang_1.isPresent(this.attrs)) {
        for (var i = 0; i < this.attrs.length; ) {
          var attrName = this.attrs[i++];
          var attrValue = this.attrs[i++];
          res += '[' + attrName;
          if (attrValue.length > 0) {
            res += '=' + attrValue;
          }
          res += ']';
        }
      }
      this.notSelectors.forEach(function(notSelector) {
        return res += ":not(" + notSelector + ")";
      });
      return res;
    };
    return CssSelector;
  }());
  exports.CssSelector = CssSelector;
  var SelectorMatcher = (function() {
    function SelectorMatcher() {
      this._elementMap = new collection_1.Map();
      this._elementPartialMap = new collection_1.Map();
      this._classMap = new collection_1.Map();
      this._classPartialMap = new collection_1.Map();
      this._attrValueMap = new collection_1.Map();
      this._attrValuePartialMap = new collection_1.Map();
      this._listContexts = [];
    }
    SelectorMatcher.createNotMatcher = function(notSelectors) {
      var notMatcher = new SelectorMatcher();
      notMatcher.addSelectables(notSelectors, null);
      return notMatcher;
    };
    SelectorMatcher.prototype.addSelectables = function(cssSelectors, callbackCtxt) {
      var listContext = null;
      if (cssSelectors.length > 1) {
        listContext = new SelectorListContext(cssSelectors);
        this._listContexts.push(listContext);
      }
      for (var i = 0; i < cssSelectors.length; i++) {
        this._addSelectable(cssSelectors[i], callbackCtxt, listContext);
      }
    };
    SelectorMatcher.prototype._addSelectable = function(cssSelector, callbackCtxt, listContext) {
      var matcher = this;
      var element = cssSelector.element;
      var classNames = cssSelector.classNames;
      var attrs = cssSelector.attrs;
      var selectable = new SelectorContext(cssSelector, callbackCtxt, listContext);
      if (lang_1.isPresent(element)) {
        var isTerminal = attrs.length === 0 && classNames.length === 0;
        if (isTerminal) {
          this._addTerminal(matcher._elementMap, element, selectable);
        } else {
          matcher = this._addPartial(matcher._elementPartialMap, element);
        }
      }
      if (lang_1.isPresent(classNames)) {
        for (var index = 0; index < classNames.length; index++) {
          var isTerminal = attrs.length === 0 && index === classNames.length - 1;
          var className = classNames[index];
          if (isTerminal) {
            this._addTerminal(matcher._classMap, className, selectable);
          } else {
            matcher = this._addPartial(matcher._classPartialMap, className);
          }
        }
      }
      if (lang_1.isPresent(attrs)) {
        for (var index = 0; index < attrs.length; ) {
          var isTerminal = index === attrs.length - 2;
          var attrName = attrs[index++];
          var attrValue = attrs[index++];
          if (isTerminal) {
            var terminalMap = matcher._attrValueMap;
            var terminalValuesMap = terminalMap.get(attrName);
            if (lang_1.isBlank(terminalValuesMap)) {
              terminalValuesMap = new collection_1.Map();
              terminalMap.set(attrName, terminalValuesMap);
            }
            this._addTerminal(terminalValuesMap, attrValue, selectable);
          } else {
            var parttialMap = matcher._attrValuePartialMap;
            var partialValuesMap = parttialMap.get(attrName);
            if (lang_1.isBlank(partialValuesMap)) {
              partialValuesMap = new collection_1.Map();
              parttialMap.set(attrName, partialValuesMap);
            }
            matcher = this._addPartial(partialValuesMap, attrValue);
          }
        }
      }
    };
    SelectorMatcher.prototype._addTerminal = function(map, name, selectable) {
      var terminalList = map.get(name);
      if (lang_1.isBlank(terminalList)) {
        terminalList = [];
        map.set(name, terminalList);
      }
      terminalList.push(selectable);
    };
    SelectorMatcher.prototype._addPartial = function(map, name) {
      var matcher = map.get(name);
      if (lang_1.isBlank(matcher)) {
        matcher = new SelectorMatcher();
        map.set(name, matcher);
      }
      return matcher;
    };
    SelectorMatcher.prototype.match = function(cssSelector, matchedCallback) {
      var result = false;
      var element = cssSelector.element;
      var classNames = cssSelector.classNames;
      var attrs = cssSelector.attrs;
      for (var i = 0; i < this._listContexts.length; i++) {
        this._listContexts[i].alreadyMatched = false;
      }
      result = this._matchTerminal(this._elementMap, element, cssSelector, matchedCallback) || result;
      result = this._matchPartial(this._elementPartialMap, element, cssSelector, matchedCallback) || result;
      if (lang_1.isPresent(classNames)) {
        for (var index = 0; index < classNames.length; index++) {
          var className = classNames[index];
          result = this._matchTerminal(this._classMap, className, cssSelector, matchedCallback) || result;
          result = this._matchPartial(this._classPartialMap, className, cssSelector, matchedCallback) || result;
        }
      }
      if (lang_1.isPresent(attrs)) {
        for (var index = 0; index < attrs.length; ) {
          var attrName = attrs[index++];
          var attrValue = attrs[index++];
          var terminalValuesMap = this._attrValueMap.get(attrName);
          if (!lang_1.StringWrapper.equals(attrValue, _EMPTY_ATTR_VALUE)) {
            result = this._matchTerminal(terminalValuesMap, _EMPTY_ATTR_VALUE, cssSelector, matchedCallback) || result;
          }
          result = this._matchTerminal(terminalValuesMap, attrValue, cssSelector, matchedCallback) || result;
          var partialValuesMap = this._attrValuePartialMap.get(attrName);
          if (!lang_1.StringWrapper.equals(attrValue, _EMPTY_ATTR_VALUE)) {
            result = this._matchPartial(partialValuesMap, _EMPTY_ATTR_VALUE, cssSelector, matchedCallback) || result;
          }
          result = this._matchPartial(partialValuesMap, attrValue, cssSelector, matchedCallback) || result;
        }
      }
      return result;
    };
    SelectorMatcher.prototype._matchTerminal = function(map, name, cssSelector, matchedCallback) {
      if (lang_1.isBlank(map) || lang_1.isBlank(name)) {
        return false;
      }
      var selectables = map.get(name);
      var starSelectables = map.get("*");
      if (lang_1.isPresent(starSelectables)) {
        selectables = selectables.concat(starSelectables);
      }
      if (lang_1.isBlank(selectables)) {
        return false;
      }
      var selectable;
      var result = false;
      for (var index = 0; index < selectables.length; index++) {
        selectable = selectables[index];
        result = selectable.finalize(cssSelector, matchedCallback) || result;
      }
      return result;
    };
    SelectorMatcher.prototype._matchPartial = function(map, name, cssSelector, matchedCallback) {
      if (lang_1.isBlank(map) || lang_1.isBlank(name)) {
        return false;
      }
      var nestedSelector = map.get(name);
      if (lang_1.isBlank(nestedSelector)) {
        return false;
      }
      return nestedSelector.match(cssSelector, matchedCallback);
    };
    return SelectorMatcher;
  }());
  exports.SelectorMatcher = SelectorMatcher;
  var SelectorListContext = (function() {
    function SelectorListContext(selectors) {
      this.selectors = selectors;
      this.alreadyMatched = false;
    }
    return SelectorListContext;
  }());
  exports.SelectorListContext = SelectorListContext;
  var SelectorContext = (function() {
    function SelectorContext(selector, cbContext, listContext) {
      this.selector = selector;
      this.cbContext = cbContext;
      this.listContext = listContext;
      this.notSelectors = selector.notSelectors;
    }
    SelectorContext.prototype.finalize = function(cssSelector, callback) {
      var result = true;
      if (this.notSelectors.length > 0 && (lang_1.isBlank(this.listContext) || !this.listContext.alreadyMatched)) {
        var notMatcher = SelectorMatcher.createNotMatcher(this.notSelectors);
        result = !notMatcher.match(cssSelector, null);
      }
      if (result && lang_1.isPresent(callback) && (lang_1.isBlank(this.listContext) || !this.listContext.alreadyMatched)) {
        if (lang_1.isPresent(this.listContext)) {
          this.listContext.alreadyMatched = true;
        }
        callback(this.selector, this.cbContext);
      }
      return result;
    };
    return SelectorContext;
  }());
  exports.SelectorContext = SelectorContext;
  return module.exports;
});

System.registerDynamic("@angular/compiler/src/facade/base_wrapped_exception.js", [], true, function($__require, exports, module) {
  "use strict";
  ;
  var define,
      global = this,
      GLOBAL = this;
  var __extends = (this && this.__extends) || function(d, b) {
    for (var p in b)
      if (b.hasOwnProperty(p))
        d[p] = b[p];
    function __() {
      this.constructor = d;
    }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
  };
  var BaseWrappedException = (function(_super) {
    __extends(BaseWrappedException, _super);
    function BaseWrappedException(message) {
      _super.call(this, message);
    }
    Object.defineProperty(BaseWrappedException.prototype, "wrapperMessage", {
      get: function() {
        return '';
      },
      enumerable: true,
      configurable: true
    });
    Object.defineProperty(BaseWrappedException.prototype, "wrapperStack", {
      get: function() {
        return null;
      },
      enumerable: true,
      configurable: true
    });
    Object.defineProperty(BaseWrappedException.prototype, "originalException", {
      get: function() {
        return null;
      },
      enumerable: true,
      configurable: true
    });
    Object.defineProperty(BaseWrappedException.prototype, "originalStack", {
      get: function() {
        return null;
      },
      enumerable: true,
      configurable: true
    });
    Object.defineProperty(BaseWrappedException.prototype, "context", {
      get: function() {
        return null;
      },
      enumerable: true,
      configurable: true
    });
    Object.defineProperty(BaseWrappedException.prototype, "message", {
      get: function() {
        return '';
      },
      enumerable: true,
      configurable: true
    });
    return BaseWrappedException;
  }(Error));
  exports.BaseWrappedException = BaseWrappedException;
  return module.exports;
});

System.registerDynamic("@angular/compiler/src/facade/collection.js", ["./lang"], true, function($__require, exports, module) {
  "use strict";
  ;
  var define,
      global = this,
      GLOBAL = this;
  var lang_1 = $__require('./lang');
  exports.Map = lang_1.global.Map;
  exports.Set = lang_1.global.Set;
  var createMapFromPairs = (function() {
    try {
      if (new exports.Map([[1, 2]]).size === 1) {
        return function createMapFromPairs(pairs) {
          return new exports.Map(pairs);
        };
      }
    } catch (e) {}
    return function createMapAndPopulateFromPairs(pairs) {
      var map = new exports.Map();
      for (var i = 0; i < pairs.length; i++) {
        var pair = pairs[i];
        map.set(pair[0], pair[1]);
      }
      return map;
    };
  })();
  var createMapFromMap = (function() {
    try {
      if (new exports.Map(new exports.Map())) {
        return function createMapFromMap(m) {
          return new exports.Map(m);
        };
      }
    } catch (e) {}
    return function createMapAndPopulateFromMap(m) {
      var map = new exports.Map();
      m.forEach(function(v, k) {
        map.set(k, v);
      });
      return map;
    };
  })();
  var _clearValues = (function() {
    if ((new exports.Map()).keys().next) {
      return function _clearValues(m) {
        var keyIterator = m.keys();
        var k;
        while (!((k = keyIterator.next()).done)) {
          m.set(k.value, null);
        }
      };
    } else {
      return function _clearValuesWithForeEach(m) {
        m.forEach(function(v, k) {
          m.set(k, null);
        });
      };
    }
  })();
  var _arrayFromMap = (function() {
    try {
      if ((new exports.Map()).values().next) {
        return function createArrayFromMap(m, getValues) {
          return getValues ? Array.from(m.values()) : Array.from(m.keys());
        };
      }
    } catch (e) {}
    return function createArrayFromMapWithForeach(m, getValues) {
      var res = ListWrapper.createFixedSize(m.size),
          i = 0;
      m.forEach(function(v, k) {
        res[i] = getValues ? v : k;
        i++;
      });
      return res;
    };
  })();
  var MapWrapper = (function() {
    function MapWrapper() {}
    MapWrapper.clone = function(m) {
      return createMapFromMap(m);
    };
    MapWrapper.createFromStringMap = function(stringMap) {
      var result = new exports.Map();
      for (var prop in stringMap) {
        result.set(prop, stringMap[prop]);
      }
      return result;
    };
    MapWrapper.toStringMap = function(m) {
      var r = {};
      m.forEach(function(v, k) {
        return r[k] = v;
      });
      return r;
    };
    MapWrapper.createFromPairs = function(pairs) {
      return createMapFromPairs(pairs);
    };
    MapWrapper.clearValues = function(m) {
      _clearValues(m);
    };
    MapWrapper.iterable = function(m) {
      return m;
    };
    MapWrapper.keys = function(m) {
      return _arrayFromMap(m, false);
    };
    MapWrapper.values = function(m) {
      return _arrayFromMap(m, true);
    };
    return MapWrapper;
  }());
  exports.MapWrapper = MapWrapper;
  var StringMapWrapper = (function() {
    function StringMapWrapper() {}
    StringMapWrapper.create = function() {
      return {};
    };
    StringMapWrapper.contains = function(map, key) {
      return map.hasOwnProperty(key);
    };
    StringMapWrapper.get = function(map, key) {
      return map.hasOwnProperty(key) ? map[key] : undefined;
    };
    StringMapWrapper.set = function(map, key, value) {
      map[key] = value;
    };
    StringMapWrapper.keys = function(map) {
      return Object.keys(map);
    };
    StringMapWrapper.values = function(map) {
      return Object.keys(map).reduce(function(r, a) {
        r.push(map[a]);
        return r;
      }, []);
    };
    StringMapWrapper.isEmpty = function(map) {
      for (var prop in map) {
        return false;
      }
      return true;
    };
    StringMapWrapper.delete = function(map, key) {
      delete map[key];
    };
    StringMapWrapper.forEach = function(map, callback) {
      for (var prop in map) {
        if (map.hasOwnProperty(prop)) {
          callback(map[prop], prop);
        }
      }
    };
    StringMapWrapper.merge = function(m1, m2) {
      var m = {};
      for (var attr in m1) {
        if (m1.hasOwnProperty(attr)) {
          m[attr] = m1[attr];
        }
      }
      for (var attr in m2) {
        if (m2.hasOwnProperty(attr)) {
          m[attr] = m2[attr];
        }
      }
      return m;
    };
    StringMapWrapper.equals = function(m1, m2) {
      var k1 = Object.keys(m1);
      var k2 = Object.keys(m2);
      if (k1.length != k2.length) {
        return false;
      }
      var key;
      for (var i = 0; i < k1.length; i++) {
        key = k1[i];
        if (m1[key] !== m2[key]) {
          return false;
        }
      }
      return true;
    };
    return StringMapWrapper;
  }());
  exports.StringMapWrapper = StringMapWrapper;
  var ListWrapper = (function() {
    function ListWrapper() {}
    ListWrapper.createFixedSize = function(size) {
      return new Array(size);
    };
    ListWrapper.createGrowableSize = function(size) {
      return new Array(size);
    };
    ListWrapper.clone = function(array) {
      return array.slice(0);
    };
    ListWrapper.forEachWithIndex = function(array, fn) {
      for (var i = 0; i < array.length; i++) {
        fn(array[i], i);
      }
    };
    ListWrapper.first = function(array) {
      if (!array)
        return null;
      return array[0];
    };
    ListWrapper.last = function(array) {
      if (!array || array.length == 0)
        return null;
      return array[array.length - 1];
    };
    ListWrapper.indexOf = function(array, value, startIndex) {
      if (startIndex === void 0) {
        startIndex = 0;
      }
      return array.indexOf(value, startIndex);
    };
    ListWrapper.contains = function(list, el) {
      return list.indexOf(el) !== -1;
    };
    ListWrapper.reversed = function(array) {
      var a = ListWrapper.clone(array);
      return a.reverse();
    };
    ListWrapper.concat = function(a, b) {
      return a.concat(b);
    };
    ListWrapper.insert = function(list, index, value) {
      list.splice(index, 0, value);
    };
    ListWrapper.removeAt = function(list, index) {
      var res = list[index];
      list.splice(index, 1);
      return res;
    };
    ListWrapper.removeAll = function(list, items) {
      for (var i = 0; i < items.length; ++i) {
        var index = list.indexOf(items[i]);
        list.splice(index, 1);
      }
    };
    ListWrapper.remove = function(list, el) {
      var index = list.indexOf(el);
      if (index > -1) {
        list.splice(index, 1);
        return true;
      }
      return false;
    };
    ListWrapper.clear = function(list) {
      list.length = 0;
    };
    ListWrapper.isEmpty = function(list) {
      return list.length == 0;
    };
    ListWrapper.fill = function(list, value, start, end) {
      if (start === void 0) {
        start = 0;
      }
      if (end === void 0) {
        end = null;
      }
      list.fill(value, start, end === null ? list.length : end);
    };
    ListWrapper.equals = function(a, b) {
      if (a.length != b.length)
        return false;
      for (var i = 0; i < a.length; ++i) {
        if (a[i] !== b[i])
          return false;
      }
      return true;
    };
    ListWrapper.slice = function(l, from, to) {
      if (from === void 0) {
        from = 0;
      }
      if (to === void 0) {
        to = null;
      }
      return l.slice(from, to === null ? undefined : to);
    };
    ListWrapper.splice = function(l, from, length) {
      return l.splice(from, length);
    };
    ListWrapper.sort = function(l, compareFn) {
      if (lang_1.isPresent(compareFn)) {
        l.sort(compareFn);
      } else {
        l.sort();
      }
    };
    ListWrapper.toString = function(l) {
      return l.toString();
    };
    ListWrapper.toJSON = function(l) {
      return JSON.stringify(l);
    };
    ListWrapper.maximum = function(list, predicate) {
      if (list.length == 0) {
        return null;
      }
      var solution = null;
      var maxValue = -Infinity;
      for (var index = 0; index < list.length; index++) {
        var candidate = list[index];
        if (lang_1.isBlank(candidate)) {
          continue;
        }
        var candidateValue = predicate(candidate);
        if (candidateValue > maxValue) {
          solution = candidate;
          maxValue = candidateValue;
        }
      }
      return solution;
    };
    ListWrapper.flatten = function(list) {
      var target = [];
      _flattenArray(list, target);
      return target;
    };
    ListWrapper.addAll = function(list, source) {
      for (var i = 0; i < source.length; i++) {
        list.push(source[i]);
      }
    };
    return ListWrapper;
  }());
  exports.ListWrapper = ListWrapper;
  function _flattenArray(source, target) {
    if (lang_1.isPresent(source)) {
      for (var i = 0; i < source.length; i++) {
        var item = source[i];
        if (lang_1.isArray(item)) {
          _flattenArray(item, target);
        } else {
          target.push(item);
        }
      }
    }
    return target;
  }
  function isListLikeIterable(obj) {
    if (!lang_1.isJsObject(obj))
      return false;
    return lang_1.isArray(obj) || (!(obj instanceof exports.Map) && lang_1.getSymbolIterator() in obj);
  }
  exports.isListLikeIterable = isListLikeIterable;
  function areIterablesEqual(a, b, comparator) {
    var iterator1 = a[lang_1.getSymbolIterator()]();
    var iterator2 = b[lang_1.getSymbolIterator()]();
    while (true) {
      var item1 = iterator1.next();
      var item2 = iterator2.next();
      if (item1.done && item2.done)
        return true;
      if (item1.done || item2.done)
        return false;
      if (!comparator(item1.value, item2.value))
        return false;
    }
  }
  exports.areIterablesEqual = areIterablesEqual;
  function iterateListLike(obj, fn) {
    if (lang_1.isArray(obj)) {
      for (var i = 0; i < obj.length; i++) {
        fn(obj[i]);
      }
    } else {
      var iterator = obj[lang_1.getSymbolIterator()]();
      var item;
      while (!((item = iterator.next()).done)) {
        fn(item.value);
      }
    }
  }
  exports.iterateListLike = iterateListLike;
  var createSetFromList = (function() {
    var test = new exports.Set([1, 2, 3]);
    if (test.size === 3) {
      return function createSetFromList(lst) {
        return new exports.Set(lst);
      };
    } else {
      return function createSetAndPopulateFromList(lst) {
        var res = new exports.Set(lst);
        if (res.size !== lst.length) {
          for (var i = 0; i < lst.length; i++) {
            res.add(lst[i]);
          }
        }
        return res;
      };
    }
  })();
  var SetWrapper = (function() {
    function SetWrapper() {}
    SetWrapper.createFromList = function(lst) {
      return createSetFromList(lst);
    };
    SetWrapper.has = function(s, key) {
      return s.has(key);
    };
    SetWrapper.delete = function(m, k) {
      m.delete(k);
    };
    return SetWrapper;
  }());
  exports.SetWrapper = SetWrapper;
  return module.exports;
});

System.registerDynamic("@angular/compiler/src/facade/exception_handler.js", ["./lang", "./base_wrapped_exception", "./collection"], true, function($__require, exports, module) {
  "use strict";
  ;
  var define,
      global = this,
      GLOBAL = this;
  var lang_1 = $__require('./lang');
  var base_wrapped_exception_1 = $__require('./base_wrapped_exception');
  var collection_1 = $__require('./collection');
  var _ArrayLogger = (function() {
    function _ArrayLogger() {
      this.res = [];
    }
    _ArrayLogger.prototype.log = function(s) {
      this.res.push(s);
    };
    _ArrayLogger.prototype.logError = function(s) {
      this.res.push(s);
    };
    _ArrayLogger.prototype.logGroup = function(s) {
      this.res.push(s);
    };
    _ArrayLogger.prototype.logGroupEnd = function() {};
    ;
    return _ArrayLogger;
  }());
  var ExceptionHandler = (function() {
    function ExceptionHandler(_logger, _rethrowException) {
      if (_rethrowException === void 0) {
        _rethrowException = true;
      }
      this._logger = _logger;
      this._rethrowException = _rethrowException;
    }
    ExceptionHandler.exceptionToString = function(exception, stackTrace, reason) {
      if (stackTrace === void 0) {
        stackTrace = null;
      }
      if (reason === void 0) {
        reason = null;
      }
      var l = new _ArrayLogger();
      var e = new ExceptionHandler(l, false);
      e.call(exception, stackTrace, reason);
      return l.res.join("\n");
    };
    ExceptionHandler.prototype.call = function(exception, stackTrace, reason) {
      if (stackTrace === void 0) {
        stackTrace = null;
      }
      if (reason === void 0) {
        reason = null;
      }
      var originalException = this._findOriginalException(exception);
      var originalStack = this._findOriginalStack(exception);
      var context = this._findContext(exception);
      this._logger.logGroup("EXCEPTION: " + this._extractMessage(exception));
      if (lang_1.isPresent(stackTrace) && lang_1.isBlank(originalStack)) {
        this._logger.logError("STACKTRACE:");
        this._logger.logError(this._longStackTrace(stackTrace));
      }
      if (lang_1.isPresent(reason)) {
        this._logger.logError("REASON: " + reason);
      }
      if (lang_1.isPresent(originalException)) {
        this._logger.logError("ORIGINAL EXCEPTION: " + this._extractMessage(originalException));
      }
      if (lang_1.isPresent(originalStack)) {
        this._logger.logError("ORIGINAL STACKTRACE:");
        this._logger.logError(this._longStackTrace(originalStack));
      }
      if (lang_1.isPresent(context)) {
        this._logger.logError("ERROR CONTEXT:");
        this._logger.logError(context);
      }
      this._logger.logGroupEnd();
      if (this._rethrowException)
        throw exception;
    };
    ExceptionHandler.prototype._extractMessage = function(exception) {
      return exception instanceof base_wrapped_exception_1.BaseWrappedException ? exception.wrapperMessage : exception.toString();
    };
    ExceptionHandler.prototype._longStackTrace = function(stackTrace) {
      return collection_1.isListLikeIterable(stackTrace) ? stackTrace.join("\n\n-----async gap-----\n") : stackTrace.toString();
    };
    ExceptionHandler.prototype._findContext = function(exception) {
      try {
        if (!(exception instanceof base_wrapped_exception_1.BaseWrappedException))
          return null;
        return lang_1.isPresent(exception.context) ? exception.context : this._findContext(exception.originalException);
      } catch (e) {
        return null;
      }
    };
    ExceptionHandler.prototype._findOriginalException = function(exception) {
      if (!(exception instanceof base_wrapped_exception_1.BaseWrappedException))
        return null;
      var e = exception.originalException;
      while (e instanceof base_wrapped_exception_1.BaseWrappedException && lang_1.isPresent(e.originalException)) {
        e = e.originalException;
      }
      return e;
    };
    ExceptionHandler.prototype._findOriginalStack = function(exception) {
      if (!(exception instanceof base_wrapped_exception_1.BaseWrappedException))
        return null;
      var e = exception;
      var stack = exception.originalStack;
      while (e instanceof base_wrapped_exception_1.BaseWrappedException && lang_1.isPresent(e.originalException)) {
        e = e.originalException;
        if (e instanceof base_wrapped_exception_1.BaseWrappedException && lang_1.isPresent(e.originalException)) {
          stack = e.originalStack;
        }
      }
      return stack;
    };
    return ExceptionHandler;
  }());
  exports.ExceptionHandler = ExceptionHandler;
  return module.exports;
});

System.registerDynamic("@angular/compiler/src/facade/exceptions.js", ["./base_wrapped_exception", "./exception_handler"], true, function($__require, exports, module) {
  "use strict";
  ;
  var define,
      global = this,
      GLOBAL = this;
  var __extends = (this && this.__extends) || function(d, b) {
    for (var p in b)
      if (b.hasOwnProperty(p))
        d[p] = b[p];
    function __() {
      this.constructor = d;
    }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
  };
  var base_wrapped_exception_1 = $__require('./base_wrapped_exception');
  var exception_handler_1 = $__require('./exception_handler');
  var exception_handler_2 = $__require('./exception_handler');
  exports.ExceptionHandler = exception_handler_2.ExceptionHandler;
  var BaseException = (function(_super) {
    __extends(BaseException, _super);
    function BaseException(message) {
      if (message === void 0) {
        message = "--";
      }
      _super.call(this, message);
      this.message = message;
      this.stack = (new Error(message)).stack;
    }
    BaseException.prototype.toString = function() {
      return this.message;
    };
    return BaseException;
  }(Error));
  exports.BaseException = BaseException;
  var WrappedException = (function(_super) {
    __extends(WrappedException, _super);
    function WrappedException(_wrapperMessage, _originalException, _originalStack, _context) {
      _super.call(this, _wrapperMessage);
      this._wrapperMessage = _wrapperMessage;
      this._originalException = _originalException;
      this._originalStack = _originalStack;
      this._context = _context;
      this._wrapperStack = (new Error(_wrapperMessage)).stack;
    }
    Object.defineProperty(WrappedException.prototype, "wrapperMessage", {
      get: function() {
        return this._wrapperMessage;
      },
      enumerable: true,
      configurable: true
    });
    Object.defineProperty(WrappedException.prototype, "wrapperStack", {
      get: function() {
        return this._wrapperStack;
      },
      enumerable: true,
      configurable: true
    });
    Object.defineProperty(WrappedException.prototype, "originalException", {
      get: function() {
        return this._originalException;
      },
      enumerable: true,
      configurable: true
    });
    Object.defineProperty(WrappedException.prototype, "originalStack", {
      get: function() {
        return this._originalStack;
      },
      enumerable: true,
      configurable: true
    });
    Object.defineProperty(WrappedException.prototype, "context", {
      get: function() {
        return this._context;
      },
      enumerable: true,
      configurable: true
    });
    Object.defineProperty(WrappedException.prototype, "message", {
      get: function() {
        return exception_handler_1.ExceptionHandler.exceptionToString(this);
      },
      enumerable: true,
      configurable: true
    });
    WrappedException.prototype.toString = function() {
      return this.message;
    };
    return WrappedException;
  }(base_wrapped_exception_1.BaseWrappedException));
  exports.WrappedException = WrappedException;
  function makeTypeError(message) {
    return new TypeError(message);
  }
  exports.makeTypeError = makeTypeError;
  function unimplemented() {
    throw new BaseException('unimplemented');
  }
  exports.unimplemented = unimplemented;
  return module.exports;
});

System.registerDynamic("@angular/compiler/src/facade/lang.js", [], true, function($__require, exports, module) {
  "use strict";
  ;
  var define,
      global = this,
      GLOBAL = this;
  var __extends = (this && this.__extends) || function(d, b) {
    for (var p in b)
      if (b.hasOwnProperty(p))
        d[p] = b[p];
    function __() {
      this.constructor = d;
    }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
  };
  var globalScope;
  if (typeof window === 'undefined') {
    if (typeof WorkerGlobalScope !== 'undefined' && self instanceof WorkerGlobalScope) {
      globalScope = self;
    } else {
      globalScope = global;
    }
  } else {
    globalScope = window;
  }
  function scheduleMicroTask(fn) {
    Zone.current.scheduleMicroTask('scheduleMicrotask', fn);
  }
  exports.scheduleMicroTask = scheduleMicroTask;
  exports.IS_DART = false;
  var _global = globalScope;
  exports.global = _global;
  exports.Type = Function;
  function getTypeNameForDebugging(type) {
    if (type['name']) {
      return type['name'];
    }
    return typeof type;
  }
  exports.getTypeNameForDebugging = getTypeNameForDebugging;
  exports.Math = _global.Math;
  exports.Date = _global.Date;
  var _devMode = true;
  var _modeLocked = false;
  function lockMode() {
    _modeLocked = true;
  }
  exports.lockMode = lockMode;
  function enableProdMode() {
    if (_modeLocked) {
      throw 'Cannot enable prod mode after platform setup.';
    }
    _devMode = false;
  }
  exports.enableProdMode = enableProdMode;
  function assertionsEnabled() {
    return _devMode;
  }
  exports.assertionsEnabled = assertionsEnabled;
  _global.assert = function assert(condition) {};
  function isPresent(obj) {
    return obj !== undefined && obj !== null;
  }
  exports.isPresent = isPresent;
  function isBlank(obj) {
    return obj === undefined || obj === null;
  }
  exports.isBlank = isBlank;
  function isBoolean(obj) {
    return typeof obj === "boolean";
  }
  exports.isBoolean = isBoolean;
  function isNumber(obj) {
    return typeof obj === "number";
  }
  exports.isNumber = isNumber;
  function isString(obj) {
    return typeof obj === "string";
  }
  exports.isString = isString;
  function isFunction(obj) {
    return typeof obj === "function";
  }
  exports.isFunction = isFunction;
  function isType(obj) {
    return isFunction(obj);
  }
  exports.isType = isType;
  function isStringMap(obj) {
    return typeof obj === 'object' && obj !== null;
  }
  exports.isStringMap = isStringMap;
  var STRING_MAP_PROTO = Object.getPrototypeOf({});
  function isStrictStringMap(obj) {
    return isStringMap(obj) && Object.getPrototypeOf(obj) === STRING_MAP_PROTO;
  }
  exports.isStrictStringMap = isStrictStringMap;
  function isPromise(obj) {
    return obj instanceof _global.Promise;
  }
  exports.isPromise = isPromise;
  function isArray(obj) {
    return Array.isArray(obj);
  }
  exports.isArray = isArray;
  function isDate(obj) {
    return obj instanceof exports.Date && !isNaN(obj.valueOf());
  }
  exports.isDate = isDate;
  function noop() {}
  exports.noop = noop;
  function stringify(token) {
    if (typeof token === 'string') {
      return token;
    }
    if (token === undefined || token === null) {
      return '' + token;
    }
    if (token.name) {
      return token.name;
    }
    if (token.overriddenName) {
      return token.overriddenName;
    }
    var res = token.toString();
    var newLineIndex = res.indexOf("\n");
    return (newLineIndex === -1) ? res : res.substring(0, newLineIndex);
  }
  exports.stringify = stringify;
  function serializeEnum(val) {
    return val;
  }
  exports.serializeEnum = serializeEnum;
  function deserializeEnum(val, values) {
    return val;
  }
  exports.deserializeEnum = deserializeEnum;
  function resolveEnumToken(enumValue, val) {
    return enumValue[val];
  }
  exports.resolveEnumToken = resolveEnumToken;
  var StringWrapper = (function() {
    function StringWrapper() {}
    StringWrapper.fromCharCode = function(code) {
      return String.fromCharCode(code);
    };
    StringWrapper.charCodeAt = function(s, index) {
      return s.charCodeAt(index);
    };
    StringWrapper.split = function(s, regExp) {
      return s.split(regExp);
    };
    StringWrapper.equals = function(s, s2) {
      return s === s2;
    };
    StringWrapper.stripLeft = function(s, charVal) {
      if (s && s.length) {
        var pos = 0;
        for (var i = 0; i < s.length; i++) {
          if (s[i] != charVal)
            break;
          pos++;
        }
        s = s.substring(pos);
      }
      return s;
    };
    StringWrapper.stripRight = function(s, charVal) {
      if (s && s.length) {
        var pos = s.length;
        for (var i = s.length - 1; i >= 0; i--) {
          if (s[i] != charVal)
            break;
          pos--;
        }
        s = s.substring(0, pos);
      }
      return s;
    };
    StringWrapper.replace = function(s, from, replace) {
      return s.replace(from, replace);
    };
    StringWrapper.replaceAll = function(s, from, replace) {
      return s.replace(from, replace);
    };
    StringWrapper.slice = function(s, from, to) {
      if (from === void 0) {
        from = 0;
      }
      if (to === void 0) {
        to = null;
      }
      return s.slice(from, to === null ? undefined : to);
    };
    StringWrapper.replaceAllMapped = function(s, from, cb) {
      return s.replace(from, function() {
        var matches = [];
        for (var _i = 0; _i < arguments.length; _i++) {
          matches[_i - 0] = arguments[_i];
        }
        matches.splice(-2, 2);
        return cb(matches);
      });
    };
    StringWrapper.contains = function(s, substr) {
      return s.indexOf(substr) != -1;
    };
    StringWrapper.compare = function(a, b) {
      if (a < b) {
        return -1;
      } else if (a > b) {
        return 1;
      } else {
        return 0;
      }
    };
    return StringWrapper;
  }());
  exports.StringWrapper = StringWrapper;
  var StringJoiner = (function() {
    function StringJoiner(parts) {
      if (parts === void 0) {
        parts = [];
      }
      this.parts = parts;
    }
    StringJoiner.prototype.add = function(part) {
      this.parts.push(part);
    };
    StringJoiner.prototype.toString = function() {
      return this.parts.join("");
    };
    return StringJoiner;
  }());
  exports.StringJoiner = StringJoiner;
  var NumberParseError = (function(_super) {
    __extends(NumberParseError, _super);
    function NumberParseError(message) {
      _super.call(this);
      this.message = message;
    }
    NumberParseError.prototype.toString = function() {
      return this.message;
    };
    return NumberParseError;
  }(Error));
  exports.NumberParseError = NumberParseError;
  var NumberWrapper = (function() {
    function NumberWrapper() {}
    NumberWrapper.toFixed = function(n, fractionDigits) {
      return n.toFixed(fractionDigits);
    };
    NumberWrapper.equal = function(a, b) {
      return a === b;
    };
    NumberWrapper.parseIntAutoRadix = function(text) {
      var result = parseInt(text);
      if (isNaN(result)) {
        throw new NumberParseError("Invalid integer literal when parsing " + text);
      }
      return result;
    };
    NumberWrapper.parseInt = function(text, radix) {
      if (radix == 10) {
        if (/^(\-|\+)?[0-9]+$/.test(text)) {
          return parseInt(text, radix);
        }
      } else if (radix == 16) {
        if (/^(\-|\+)?[0-9ABCDEFabcdef]+$/.test(text)) {
          return parseInt(text, radix);
        }
      } else {
        var result = parseInt(text, radix);
        if (!isNaN(result)) {
          return result;
        }
      }
      throw new NumberParseError("Invalid integer literal when parsing " + text + " in base " + radix);
    };
    NumberWrapper.parseFloat = function(text) {
      return parseFloat(text);
    };
    Object.defineProperty(NumberWrapper, "NaN", {
      get: function() {
        return NaN;
      },
      enumerable: true,
      configurable: true
    });
    NumberWrapper.isNaN = function(value) {
      return isNaN(value);
    };
    NumberWrapper.isInteger = function(value) {
      return Number.isInteger(value);
    };
    return NumberWrapper;
  }());
  exports.NumberWrapper = NumberWrapper;
  exports.RegExp = _global.RegExp;
  var RegExpWrapper = (function() {
    function RegExpWrapper() {}
    RegExpWrapper.create = function(regExpStr, flags) {
      if (flags === void 0) {
        flags = '';
      }
      flags = flags.replace(/g/g, '');
      return new _global.RegExp(regExpStr, flags + 'g');
    };
    RegExpWrapper.firstMatch = function(regExp, input) {
      regExp.lastIndex = 0;
      return regExp.exec(input);
    };
    RegExpWrapper.test = function(regExp, input) {
      regExp.lastIndex = 0;
      return regExp.test(input);
    };
    RegExpWrapper.matcher = function(regExp, input) {
      regExp.lastIndex = 0;
      return {
        re: regExp,
        input: input
      };
    };
    RegExpWrapper.replaceAll = function(regExp, input, replace) {
      var c = regExp.exec(input);
      var res = '';
      regExp.lastIndex = 0;
      var prev = 0;
      while (c) {
        res += input.substring(prev, c.index);
        res += replace(c);
        prev = c.index + c[0].length;
        regExp.lastIndex = prev;
        c = regExp.exec(input);
      }
      res += input.substring(prev);
      return res;
    };
    return RegExpWrapper;
  }());
  exports.RegExpWrapper = RegExpWrapper;
  var RegExpMatcherWrapper = (function() {
    function RegExpMatcherWrapper() {}
    RegExpMatcherWrapper.next = function(matcher) {
      return matcher.re.exec(matcher.input);
    };
    return RegExpMatcherWrapper;
  }());
  exports.RegExpMatcherWrapper = RegExpMatcherWrapper;
  var FunctionWrapper = (function() {
    function FunctionWrapper() {}
    FunctionWrapper.apply = function(fn, posArgs) {
      return fn.apply(null, posArgs);
    };
    return FunctionWrapper;
  }());
  exports.FunctionWrapper = FunctionWrapper;
  function looseIdentical(a, b) {
    return a === b || typeof a === "number" && typeof b === "number" && isNaN(a) && isNaN(b);
  }
  exports.looseIdentical = looseIdentical;
  function getMapKey(value) {
    return value;
  }
  exports.getMapKey = getMapKey;
  function normalizeBlank(obj) {
    return isBlank(obj) ? null : obj;
  }
  exports.normalizeBlank = normalizeBlank;
  function normalizeBool(obj) {
    return isBlank(obj) ? false : obj;
  }
  exports.normalizeBool = normalizeBool;
  function isJsObject(o) {
    return o !== null && (typeof o === "function" || typeof o === "object");
  }
  exports.isJsObject = isJsObject;
  function print(obj) {
    console.log(obj);
  }
  exports.print = print;
  function warn(obj) {
    console.warn(obj);
  }
  exports.warn = warn;
  var Json = (function() {
    function Json() {}
    Json.parse = function(s) {
      return _global.JSON.parse(s);
    };
    Json.stringify = function(data) {
      return _global.JSON.stringify(data, null, 2);
    };
    return Json;
  }());
  exports.Json = Json;
  var DateWrapper = (function() {
    function DateWrapper() {}
    DateWrapper.create = function(year, month, day, hour, minutes, seconds, milliseconds) {
      if (month === void 0) {
        month = 1;
      }
      if (day === void 0) {
        day = 1;
      }
      if (hour === void 0) {
        hour = 0;
      }
      if (minutes === void 0) {
        minutes = 0;
      }
      if (seconds === void 0) {
        seconds = 0;
      }
      if (milliseconds === void 0) {
        milliseconds = 0;
      }
      return new exports.Date(year, month - 1, day, hour, minutes, seconds, milliseconds);
    };
    DateWrapper.fromISOString = function(str) {
      return new exports.Date(str);
    };
    DateWrapper.fromMillis = function(ms) {
      return new exports.Date(ms);
    };
    DateWrapper.toMillis = function(date) {
      return date.getTime();
    };
    DateWrapper.now = function() {
      return new exports.Date();
    };
    DateWrapper.toJson = function(date) {
      return date.toJSON();
    };
    return DateWrapper;
  }());
  exports.DateWrapper = DateWrapper;
  function setValueOnPath(global, path, value) {
    var parts = path.split('.');
    var obj = global;
    while (parts.length > 1) {
      var name = parts.shift();
      if (obj.hasOwnProperty(name) && isPresent(obj[name])) {
        obj = obj[name];
      } else {
        obj = obj[name] = {};
      }
    }
    if (obj === undefined || obj === null) {
      obj = {};
    }
    obj[parts.shift()] = value;
  }
  exports.setValueOnPath = setValueOnPath;
  var _symbolIterator = null;
  function getSymbolIterator() {
    if (isBlank(_symbolIterator)) {
      if (isPresent(globalScope.Symbol) && isPresent(Symbol.iterator)) {
        _symbolIterator = Symbol.iterator;
      } else {
        var keys = Object.getOwnPropertyNames(Map.prototype);
        for (var i = 0; i < keys.length; ++i) {
          var key = keys[i];
          if (key !== 'entries' && key !== 'size' && Map.prototype[key] === Map.prototype['entries']) {
            _symbolIterator = key;
          }
        }
      }
    }
    return _symbolIterator;
  }
  exports.getSymbolIterator = getSymbolIterator;
  function evalExpression(sourceUrl, expr, declarations, vars) {
    var fnBody = declarations + "\nreturn " + expr + "\n//# sourceURL=" + sourceUrl;
    var fnArgNames = [];
    var fnArgValues = [];
    for (var argName in vars) {
      fnArgNames.push(argName);
      fnArgValues.push(vars[argName]);
    }
    return new (Function.bind.apply(Function, [void 0].concat(fnArgNames.concat(fnBody))))().apply(void 0, fnArgValues);
  }
  exports.evalExpression = evalExpression;
  function isPrimitive(obj) {
    return !isJsObject(obj);
  }
  exports.isPrimitive = isPrimitive;
  function hasConstructor(value, type) {
    return value.constructor === type;
  }
  exports.hasConstructor = hasConstructor;
  function bitWiseOr(values) {
    return values.reduce(function(a, b) {
      return a | b;
    });
  }
  exports.bitWiseOr = bitWiseOr;
  function bitWiseAnd(values) {
    return values.reduce(function(a, b) {
      return a & b;
    });
  }
  exports.bitWiseAnd = bitWiseAnd;
  function escape(s) {
    return _global.encodeURI(s);
  }
  exports.escape = escape;
  return module.exports;
});

System.registerDynamic("@angular/compiler/src/output/path_util.js", ["../../src/facade/exceptions", "../../src/facade/lang"], true, function($__require, exports, module) {
  "use strict";
  ;
  var define,
      global = this,
      GLOBAL = this;
  var exceptions_1 = $__require('../../src/facade/exceptions');
  var lang_1 = $__require('../../src/facade/lang');
  var _ASSET_URL_RE = /asset:([^\/]+)\/([^\/]+)\/(.+)/g;
  var ImportGenerator = (function() {
    function ImportGenerator() {}
    ImportGenerator.parseAssetUrl = function(url) {
      return AssetUrl.parse(url);
    };
    return ImportGenerator;
  }());
  exports.ImportGenerator = ImportGenerator;
  var AssetUrl = (function() {
    function AssetUrl(packageName, firstLevelDir, modulePath) {
      this.packageName = packageName;
      this.firstLevelDir = firstLevelDir;
      this.modulePath = modulePath;
    }
    AssetUrl.parse = function(url, allowNonMatching) {
      if (allowNonMatching === void 0) {
        allowNonMatching = true;
      }
      var match = lang_1.RegExpWrapper.firstMatch(_ASSET_URL_RE, url);
      if (lang_1.isPresent(match)) {
        return new AssetUrl(match[1], match[2], match[3]);
      }
      if (allowNonMatching) {
        return null;
      }
      throw new exceptions_1.BaseException("Url " + url + " is not a valid asset: url");
    };
    return AssetUrl;
  }());
  exports.AssetUrl = AssetUrl;
  return module.exports;
});

System.registerDynamic("@angular/compiler/private_export.js", ["./src/selector", "./src/output/path_util"], true, function($__require, exports, module) {
  "use strict";
  ;
  var define,
      global = this,
      GLOBAL = this;
  var selector = $__require('./src/selector');
  var pathUtil = $__require('./src/output/path_util');
  var __compiler_private__;
  (function(__compiler_private__) {
    __compiler_private__.SelectorMatcher = selector.SelectorMatcher;
    __compiler_private__.CssSelector = selector.CssSelector;
    __compiler_private__.AssetUrl = pathUtil.AssetUrl;
    __compiler_private__.ImportGenerator = pathUtil.ImportGenerator;
  })(__compiler_private__ = exports.__compiler_private__ || (exports.__compiler_private__ = {}));
  return module.exports;
});

System.registerDynamic("@angular/compiler/compiler.js", ["./src/schema/element_schema_registry", "./src/compiler", "./src/template_ast", "./private_export"], true, function($__require, exports, module) {
  "use strict";
  ;
  var define,
      global = this,
      GLOBAL = this;
  function __export(m) {
    for (var p in m)
      if (!exports.hasOwnProperty(p))
        exports[p] = m[p];
  }
  var element_schema_registry_1 = $__require('./src/schema/element_schema_registry');
  exports.ElementSchemaRegistry = element_schema_registry_1.ElementSchemaRegistry;
  var compiler_1 = $__require('./src/compiler');
  exports.COMPILER_PROVIDERS = compiler_1.COMPILER_PROVIDERS;
  exports.TEMPLATE_TRANSFORMS = compiler_1.TEMPLATE_TRANSFORMS;
  exports.CompilerConfig = compiler_1.CompilerConfig;
  exports.RenderTypes = compiler_1.RenderTypes;
  exports.UrlResolver = compiler_1.UrlResolver;
  exports.DEFAULT_PACKAGE_URL_PROVIDER = compiler_1.DEFAULT_PACKAGE_URL_PROVIDER;
  exports.createOfflineCompileUrlResolver = compiler_1.createOfflineCompileUrlResolver;
  exports.XHR = compiler_1.XHR;
  exports.ViewResolver = compiler_1.ViewResolver;
  exports.DirectiveResolver = compiler_1.DirectiveResolver;
  exports.PipeResolver = compiler_1.PipeResolver;
  exports.SourceModule = compiler_1.SourceModule;
  exports.NormalizedComponentWithViewDirectives = compiler_1.NormalizedComponentWithViewDirectives;
  exports.OfflineCompiler = compiler_1.OfflineCompiler;
  exports.CompileMetadataWithIdentifier = compiler_1.CompileMetadataWithIdentifier;
  exports.CompileMetadataWithType = compiler_1.CompileMetadataWithType;
  exports.CompileIdentifierMetadata = compiler_1.CompileIdentifierMetadata;
  exports.CompileDiDependencyMetadata = compiler_1.CompileDiDependencyMetadata;
  exports.CompileProviderMetadata = compiler_1.CompileProviderMetadata;
  exports.CompileFactoryMetadata = compiler_1.CompileFactoryMetadata;
  exports.CompileTokenMetadata = compiler_1.CompileTokenMetadata;
  exports.CompileTypeMetadata = compiler_1.CompileTypeMetadata;
  exports.CompileQueryMetadata = compiler_1.CompileQueryMetadata;
  exports.CompileTemplateMetadata = compiler_1.CompileTemplateMetadata;
  exports.CompileDirectiveMetadata = compiler_1.CompileDirectiveMetadata;
  exports.CompilePipeMetadata = compiler_1.CompilePipeMetadata;
  __export($__require('./src/template_ast'));
  __export($__require('./private_export'));
  return module.exports;
});

System.registerDynamic("@angular/compiler/index.js", ["./compiler"], true, function($__require, exports, module) {
  "use strict";
  ;
  var define,
      global = this,
      GLOBAL = this;
  function __export(m) {
    for (var p in m)
      if (!exports.hasOwnProperty(p))
        exports[p] = m[p];
  }
  __export($__require('./compiler'));
  return module.exports;
});
