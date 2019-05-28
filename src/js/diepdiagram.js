////////////////////////////////////////////////////////////////////////////////
//                                                                            //
//                  GNU GENERAL PUBLIC LICENSE                                //
//                     Version 3, 29 June 2007                                //
//                                                                            //
// Detail license file is hosted at link:                                     //
//   https://github.com/phamsodiep/html_based_uml_diagram/raw/master/LICENSE  //
//                                                                            //
// © phamsodiep - https://github.com/phamsodiep                               //
//              - https://phamsodiep.blogspot.com                             //
////////////////////////////////////////////////////////////////////////////////





////////////////////////////////////////////////////////////////////////////////
// LIBRARY NAMESPACE PACKAGES CREATION                                        //
////////////////////////////////////////////////////////////////////////////////
let RenderElement = {};

// Constants
RenderElement.CONST = {};
RenderElement.CONST.RE_ATT         = "render-element";
RenderElement.CONST.DATA_ATT       = "model";
RenderElement.CONST.MODULENAME     = "diepRenderElement";

// Angular module
RenderElement.Module = angular.module(RenderElement.CONST.MODULENAME, []);

// Helper utility unit and its sub-units
RenderElement.util    = {};
RenderElement.util.re = {};





////////////////////////////////////////////////////////////////////////////////
// UNIT FUNCTIONS IMPLEMENTATION                                              //
////////////////////////////////////////////////////////////////////////////////


////////////////////////////////////////////////////////////////////////////////
// Helper utility unit's functions implementation                             //
////////////////////////////////////////////////////////////////////////////////

// Generic helper functions
////////////////////////////////////////////////////////////////////////////////
// Function name: dataModelValidator                                          //
//                                                                            //
// Param 'model':                                                             //
// Param 'expectedTypes':                                                     //
//                                                                            //
// Return:                                                                    //
//   true if model is valid                                                   //
//   false if model is invalid                                                //
////////////////////////////////////////////////////////////////////////////////
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

////////////////////////////////////////////////////////////////////////////////
// Function name: tagNameToModelName                                          //
//                                                                            //
// Param 'tagName':                                                           //
//                                                                            //
// Return:                                                                    //
////////////////////////////////////////////////////////////////////////////////
RenderElement.util.tagNameToModelName = function (tagName) {
  let tagNameChars = tagName.split("");
  let tagNameCharsCount = tagNameChars.length;
  let modelNameChars = [];
  let capRequested = false;
  for(let i = 0; i < tagNameCharsCount; i++) {
    let tagNameChar = tagNameChars[i];
    if (tagNameChar === '-') {
      capRequested = true;
    }
    else {
      if (capRequested) {
        capRequested = false;
        modelNameChars.push(tagNameChar.toUpperCase());
      }
      else {
        modelNameChars.push(tagNameChar);
      }
    }
  }
  return modelNameChars.join("");
};


// RenderElement unit's helper functions
////////////////////////////////////////////////////////////////////////////////
// Function name: createSpriteTag                                             //
//                                                                            //
// Param 'spriteClass':                                                       //
// Param 'modelAtt':                                                          //
// Param 'exAtt':                                                             //
//                                                                            //
// Return:                                                                    //
////////////////////////////////////////////////////////////////////////////////
RenderElement.util.re.createSpriteTag = function (
  spriteClass, modelAtt, exAtt = ""
) {
  const DATA_ATT = RenderElement.CONST.DATA_ATT;

  if (exAtt === null) {
    return ["</", spriteClass, ">"].join("");
  }
  return [
    "<", spriteClass, " ", DATA_ATT, "=\"", modelAtt, "\"",
      exAtt,
    ">",
  ].join("");  
}


////////////////////////////////////////////////////////////////////////////////
// Function name: createRETag                                                 //
//                                                                            //
// Param 'reClass':                                                           //
// Param 'modelAtt':                                                          //
// Param 'exAtt':                                                             //
//                                                                            //
// Return:                                                                    //
////////////////////////////////////////////////////////////////////////////////
RenderElement.util.re.createRETag = function (
    reClass, modelAtt, exAtt = ""
) {
  const DATA_ATT = RenderElement.CONST.DATA_ATT;
  const RE_ATT   = RenderElement.CONST.RE_ATT;

  if (exAtt === null) {
    return "</div>";
  }
  return [
    "<div ", RE_ATT, "=", reClass, " ",
      DATA_ATT, "=\"", modelAtt, "\" ",
      exAtt,
    ">"
  ].join("");
}







////////////////////////////////////////////////////////////////////////////////
// ANGULAR MODULE CONSTRUCTOR FUNCTIONS                                       //
////////////////////////////////////////////////////////////////////////////////

// Directive constructor functions
////////////////////////////////////////////////////////////////////////////////
// DIRECTIVE: 'renderElement'                                                 //
////////////////////////////////////////////////////////////////////////////////
RenderElement.Module.directive("renderElement", function ($compile) {
  const RE_ATT         = RenderElement.CONST.RE_ATT;
  const RE_ATT_MODEL   = RenderElement.util.tagNameToModelName(RE_ATT);
  const DATA_ATT       = RenderElement.CONST.DATA_ATT;
  const REUNIT         = RenderElement.util.re;
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
        let spriteClass = reModel["class"];
        if (typeof spriteClass === "string") {
          let modelAtt = DATA_ATT + ".instance";
          templateStr = [
            REUNIT.createSpriteTag(spriteClass, modelAtt),
            REUNIT.createSpriteTag(spriteClass, null, null),
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
              let modelAtt = [
                DATA_ATT, "[", i, "]"
              ].join("");
              templateStrBuffer.push(
                REUNIT.createRETag('?', modelAtt),
                REUNIT.createRETag('?', null, null),
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
                let spriteModelAtt = "";
                if (modelType === "object" || modelType === "string") {
                  dataAttributeSetting = [
                    DATA_ATT, "=\"", DATA_ATT, "[0].instance", "\""
                  ].join("");

                  spriteModelAtt = [DATA_ATT, "[0].instance"].join("");
                }
                let nestedDirective = "";
                if (elemCount > 1) {
                  let inner = container[1];
                  if (typeof inner === "object") {
                    let modelAtt = [DATA_ATT, "[1]"].join("");
                    nestedDirective = [
                      REUNIT.createRETag('?', modelAtt),
                      REUNIT.createRETag('?', null, null),
                    ].join("");
                  }
                }
                templateStrBuffer.push(
                  REUNIT.createSpriteTag(spriteClass, spriteModelAtt),
                    nestedDirective,
                  REUNIT.createSpriteTag(spriteClass, null, null)
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
            REUNIT.createRETag('S', DATA_ATT),
            REUNIT.createRETag('S', null, null),
          );
        }
        // This re is a Sprite Group
        else if (Array.isArray(reModel.group)) {
          templateStrBuffer.push(
            REUNIT.createRETag('G', DATA_ATT + ".group"),
            REUNIT.createRETag('G', null, null),
          );
        }
        // This re is a Sprite Container
        else if (Array.isArray(reModel.container)) {
          templateStrBuffer.push(
            REUNIT.createRETag('C', DATA_ATT + ".container"),
            REUNIT.createRETag('C', null, null),
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

// Component constructor functions
////////////////////////////////////////////////////////////////////////////////
// COMPONENT: 'diagram'                                                       //
////////////////////////////////////////////////////////////////////////////////
RenderElement.Module.component("diagram", {
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

////////////////////////////////////////////////////////////////////////////////
// COMPONENT: 'captionImage'                                                  //
////////////////////////////////////////////////////////////////////////////////
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


