let RenderElement = {};
RenderElement.Module = angular.module("diepRenderElement", []);
RenderElement.CONST = {};
RenderElement.CONST.RE_ATT         = "render-element";
RenderElement.CONST.RE_ATT_MODEL   = "renderElement";
RenderElement.CONST.DATA_ATT       = "model";
RenderElement.CONST.IMPL_CLASS_ATT = "subclass";


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


// home controller
RenderElement.Module.component('home', {
  transclude: true,
  bindings: {
    model: '='
  },
  template: '<h1>Home</h1><p>Hello, {{ $ctrl.model }} ! <div ng-transclude> </div> </p>',
  controller: function () {
  }
});


