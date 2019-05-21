let RenderElement = {};
RenderElement.Module = angular.module("diepRenderElement", []);


// Constants
RenderElement.CONST = {};
RenderElement.CONST.RE_ATT         = "render-element";
RenderElement.CONST.RE_ATT_MODEL   = "renderElement";
RenderElement.CONST.DATA_ATT       = "model";
RenderElement.CONST.IMPL_CLASS_ATT = "subclass";


// Helper functions
RenderElement.util = {};
RenderElement.util.dataModelValidator = function (model, expectedTypes) {
  for (let key in expectedTypes) {
    let expectedType = expectedTypes[key];
    if (expectedType === "*") {
      if (!(Array.isArray(model[key]))) {
        return false;
      }
    }
    else {
      if (!(typeof model[key] === expectedType)) {
        return false;
      }
    }
  }
  return true;
};


// renderElement directive
RenderElement.Module.directive("renderElement", function ($compile) {
  const RE_ATT         = RenderElement.CONST.RE_ATT;
  const RE_ATT_MODEL   = RenderElement.CONST.RE_ATT_MODEL;
  const DATA_ATT       = RenderElement.CONST.DATA_ATT;
  const IMPL_CLASS_ATT = RenderElement.CONST.IMPL_CLASS_ATT;
  let dirScope = {};
  dirScope[DATA_ATT] = ("=" + DATA_ATT);
  return {
    transclude: true,
    restrict: 'A',
    scope: dirScope,
    template: "",
    link: function ($scope, $elem, $attrs, $outercontrol) {
      let templateStr = "";
      let reClass = $attrs[RE_ATT_MODEL];
      let reModel = $scope[DATA_ATT];
      // This re is a Sprite
      // Expanding template to correspondence component basing on spriteClass:
      //   . component model is the isolated scope of renderElement directive
      if (reClass === 'S') {
        let spriteClass = $attrs[IMPL_CLASS_ATT];
        if (typeof spriteClass === "string") {
          templateStr = [
            "<", spriteClass, " ", DATA_ATT, "=\"", DATA_ATT, ".instance\">",
            "</", spriteClass, ">"
          ].join("");
        }
      }
      // This re is a Sprite Group
      // Expanding template by traveling group elements. This results
      //   . Expanded template is a collection of renderElement directives
      //   . element's renderElement directive isolcated scope is the 
      //     array element of isolated scope of this directive
      //        this directive's isolated scope: model
      //        array element of the scope: model[i]
      else if (reClass === 'G') {
        let group = reModel;
        if (Array.isArray(group)) {
          let templateStrBuffer = [];
          let reCount = group.length;
          // Travel each element in the Sprite Group
          for (let i = 0; i < reCount; i++) {
            let re = group[i];
            if (typeof re === "object") {
              templateStrBuffer.push(
                "<div ", RE_ATT, "='?' ",
                  DATA_ATT, "=\"", DATA_ATT, "[", i, "]", "\"",
                ">",
                "</div>"
              );
            }
          }
          templateStr =  templateStrBuffer.join("");
        }
      }
      // This re is Sprite Container
      else if (reClass === 'C') {
        let container = reModel;
        let templateStrBuffer = [];
        if (Array.isArray(container)) {
          let elemCount = container.length;
          if (elemCount > 0) {
            let outter = container[0];
            if (typeof outter === "object") {
              let spriteClass = outter["class"];
              if (typeof spriteClass === "string") {
                let modelType = typeof outter.instance;
                let dataAttributeSetting = "";
                if (modelType === "object" || modelType === "string") {
                  dataAttributeSetting = [
                    DATA_ATT, "=\"", DATA_ATT, "[0].instance", "\""
                  ].join("");
                }
                let nestedDirective = "";
                if (elemCount > 1) {
                  let inner = container[1];
                  if (typeof inner === "object") {
                    nestedDirective = [
                      "<div ", RE_ATT, "='?' ",
                        DATA_ATT, "=\"", DATA_ATT, "[1]\">",
                      "</div>"
                    ].join("");
                  }
                }
                templateStrBuffer.push(
                  "<", spriteClass, " ",
                    dataAttributeSetting,
                  ">",
                    nestedDirective,
                  "</", spriteClass, ">"
                );
              }
            }
          }
        }
        templateStr = templateStrBuffer.join("");
      }
      else if (reClass === '?') {
        let spriteClass = reModel["class"];
        let templateStrBuffer = [];
        // This re is a Sprite
        if (typeof spriteClass === "string") {
          templateStrBuffer.push(
            "<div ", RE_ATT, "='S' ",
              IMPL_CLASS_ATT, "='", spriteClass, "'",
                DATA_ATT, "=\"", DATA_ATT, "\"",
            ">",
            "</div>"
          );
        }
        // This re is a Sprite Group
        else if (Array.isArray(reModel.group)) {
          templateStrBuffer.push(
            "<div ", RE_ATT, "='G' ",
                DATA_ATT, "=\"", DATA_ATT, ".group\"",
            ">",
            "</div>"
          );
        }
        // This re is a Sprite Container
        else if (Array.isArray(reModel.container)) {
          templateStrBuffer.push(
            "<div ", RE_ATT, "='C' ",
                DATA_ATT, "=\"", DATA_ATT, ".container\"",
            ">",
            "</div>"
          );
        }
        templateStr = templateStrBuffer.join("");
      }
      if (templateStr.length > 0) {
        $elem.append($compile(templateStr)($scope));
      }
    }
  }
});


RenderElement.Module.component('diagram', {
  transclude: false,
  bindings: {
    model: '='
  },
  template: "",
  controller: function ($scope, $element, $compile) {
    let renderBackground = function (ctx, model) {
      // Helper constants
      const PROTO = CanvasRenderingContext2D.prototype;
      const COORDINATE_CONVERT_NEED_FUNCS = [
        "fillRect"
      ];
      // Helper converter function
      let convertToGlobalCoordinate = function (
        spriteLeft, spriteTop, operation, params
      ) {
        let funcList = COORDINATE_CONVERT_NEED_FUNCS;
        if (funcList.includes(operation)) {
          params[0] += spriteLeft;
          params[1] += spriteTop;
        }
      }
      // Helper data model traveling function
      let dataModelTravel = function (node, callBackFunc) {
        // Sprite data model is detected
        if (typeof node["class"] === "string") {
          if (typeof node.instance === "object"
            && Array.isArray(node.instance.renderCmds)
          ) {
            callBackFunc(node.instance);
          }
        }
        // Sprite Group data model is detected
        else if (Array.isArray(node.group)) {
          let reCount = node.group.length;
          for (let i = 0; i < reCount; i++) {
            dataModelTravel(node.group[i], callBackFunc);
          }
        }
        // Sprite Container data model is detected
        else if (Array.isArray(node.container)) {
          let reCount = node.container.length;
          for (let i = 0; i < reCount; i++) {
            dataModelTravel(node.container[i], callBackFunc);
          }
        }
      }
      // Helper data model traveling function
      let elementBackgroundRenderCallBackFunc = function (instance) {
        let renderRequests = instance.renderCmds
        let nRenderRequest = renderRequests.length;
        for (let i = 1; i < nRenderRequest; i++) {
          let renderRequest = renderRequests[i];
          let op = renderRequest[0];
          let params = renderRequest[1];
          if (Array.isArray(params)) {
            convertToGlobalCoordinate(instance.left, instance.top, op, params);
            PROTO[op].apply(ctx, params);
          }
          else {
            ctx[op] = params;
          }
        }
      };
      dataModelTravel(model, elementBackgroundRenderCallBackFunc);
      // Do rendering
      // ctx.fillStyle = "#eeeeee";
      // ctx.fillRect(0, 0, 120, 120);
    };
    let verifyDatasourceModel = function (model) {
      if (typeof model === "undefined") {
        return false;
      }
      const validTypes = {
        "width":     "number",
        "height":    "number"
      };
      const reSubClassTypes = {
        "group":     "*",
        "container": "*",
        "class":     "string"
      };
      for (let key in validTypes) {
        if (!(typeof model[key] === validTypes[key])) {
          return false;
        }
      }
      let isImplemented = false;
      for (let key in reSubClassTypes) {
        let implType = reSubClassTypes[key];
        if (implType === "*") {
          if (Array.isArray(model[key])) {
            isImplemented = true;
            break;
          }
        }
        else {
          if (typeof model[key] === implType) {
            isImplemented = true;
            break;
          }
        }
      }
      return isImplemented;
    };
    this.$onChanges = function (changesObj) {
      if (!verifyDatasourceModel(this.model)) {
        throw "Diagram data model format is invalid.";
      }
      const RE_ATT         = RenderElement.CONST.RE_ATT;
      const DATA_ATT       = RenderElement.CONST.DATA_ATT;
      let templateStr = [
        "<div ng-style='{{$ctrl.wrapDivCss}}'>",
            "<div ng-style='{{$ctrl.bgDivCss}}'>",
                "<canvas></canvas>",
            "</div>",
            "<div ", RE_ATT, "='?' ng-style='{{$ctrl.fgDivCss}}' ",
                DATA_ATT, "=\"$ctrl.", DATA_ATT, "\"",
            ">",
            "</div>",
        "</div>"
      ].join("");

      // CSS
      // wrap div: position: relative
      this.wrapDivCss = {
        "position": "relative",
        "width":    this.model.width + "px",
        "height":    this.model.height + "px"
      };
      // background div: position: absolute
      this.bgDivCss = {
        "position": "absolute",
        "z-index": "-1"
      };

      this.fgDivCss = {
        "position": "absolute"
      };


      // DOM
      let $templateRootElem = $compile(templateStr)($scope);
      $element.append($templateRootElem);
      let templateRootElem = angular.element($templateRootElem)[0];

      // Retrieve canvas 2d context
      let ctx = null;
      let backgroundDivElem = templateRootElem.firstElementChild;
      if (typeof backgroundDivElem === "object") {
        let backgroundCanvasElem = backgroundDivElem.firstElementChild;
        if (typeof backgroundCanvasElem === "object") {
          backgroundCanvasElem.width = this.model.width;
          backgroundCanvasElem.height = this.model.height;
          ctx = backgroundCanvasElem.getContext("2d");
          if (typeof ctx === "object"
            && ctx.constructor.name === "CanvasRenderingContext2D"
          ) {
            renderBackground(ctx, this.model);
          }
        }
        //let foregroundCanvasElem = templateRootElem.lastElementChild;
      }
    }
  }
});


// home controller
RenderElement.Module.component('captionImage', {
  transclude: false,
  bindings: {
    model: '='
  },
  template: "",
  controller: function ($scope, $element, $compile) {
    let verifyDatasourceModel = function (model) {
      if (typeof model === "undefined") {
        return false;
      }
      const validTypes = {
        "left":       "number",
        "top":        "number",
        "width":      "number",
        "height":     "number",
        "renderCmds": "*",
      };
      if (RenderElement.util.dataModelValidator(model, validTypes)) {
        if (model.renderCmds.length > 0) {
          let htmlTransformation = model.renderCmds[0];
          let paramsCount = htmlTransformation.length;
          if (paramsCount == 5) {
            if (typeof htmlTransformation[0] === "string") {
              for(let i = 1; i < paramsCount; i++) {
                if (!(typeof htmlTransformation[i] === "number")) {
                  return false;
                }
              }
              return true;
            }
          }
        }
      }
      return false
    };
    this.$onChanges = function (changesObj) {
      if (!(verifyDatasourceModel(this.model))) {
        throw "CaptionImage data model format is invalid.";
      }
      let htmlRenderCmd = this.model.renderCmds[0];
      let templateStr = htmlRenderCmd[0];
      let $templateRootElem = $compile(templateStr)($scope);
      $element.append($templateRootElem);
      let templateRootElem = angular.element($templateRootElem)[0];
      templateRootElem.style.position = "absolute";
      templateRootElem.style.left     =
        this.model.left + htmlRenderCmd[1] + "px";
      templateRootElem.style.top      =
        this.model.top + htmlRenderCmd[2] + "px";

      // width height should be adjust with borderWidth
      templateRootElem.style.width    = htmlRenderCmd[3]  + "px";
      templateRootElem.style.height   = htmlRenderCmd[4] + "px";
      templateRootElem.style.borderWidth = "0px";
      templateRootElem.style.borderStyle = "none";
      templateRootElem.style.margin = "0px 0px 0px 0px";

    }
  }
});


