#!/usr/bin/python
import sys
import json
import pprint


# Test if this script is launched from modelio IDE
if not('Modelio' in globals()):
  print "Please run this macro in modelio instead of commandline:"
  print "  1. Open your uml project with modelio" 
  print "  2. Select a sequence diagram" 
  print "  3. Select Script tab" 
  print "  4. Click 'Load and run a Jython script button'" 
  print "  5. Select this script" 
  sys.exit()


# Helper functions
def getElementType(node):
    return node.getElement().getMClass().getName()


################################################################################
# Group of functions do export Lifelline and its child elements                #
################################################################################
def exportInstance(model, node):
  representedNode = node.getElement().represented
  hasBase = True
  if (representedNode == None):
    hasBase = False
    representedNode = node
  bounds = node.getBounds()
  model["instance"] = {
    "name":   representedNode.getName(),
    "type":   representedNode.getBase().getName() if hasBase else "",
    "left":   bounds.x(),
    "top" :   bounds.y(),
    "width":  bounds.width(),
    "height": bounds.height()
  }

def exportLifelineActivationBoxes(model, node):
  activationBoxes = []
  activations = []
  msgs = []
  activationBox = None
  childNodes = node.getNodes()
  childNodesCount = len(childNodes)
  curActivationBox = None
  for i in range(0, childNodesCount):
    childNode = childNodes[i]
    elemType = getElementType(childNode)
    if "ExecutionSpecification" == elemType:
      activationBox = {
        "start":    childNode.getElement().getStart().getUuid(),
        "end":      childNode.getElement().getFinish().getUuid(),
        "messages": []
      }
      activationBoxes += [activationBox]
    if "ExecutionOccurenceSpecification" == elemType:
      childNodeUuid = childNode.getElement().getUuid()
      msg = {
        "here": childNodeUuid,
        "line": childNode.getElement().getLineNumber()
      }
      fromLinks = childNode.getFromLinks()
      toLinks = childNode.getToLinks()
      if len(fromLinks) > len(toLinks):
        fromLink = fromLinks[0]
        msg["type"] = fromLink.getElement().getSortOfMessage()
        msg["name"] = fromLink.getName()
        msg["from"] = childNodeUuid
        msg["to"] = fromLink.getTo().getElement().getUuid()
      if len(fromLinks) < len(toLinks):
        toLink = toLinks[0]
        msg["type"] = toLink.getElement().getSortOfMessage()
        msg["name"] = toLink.getName()
        msg["to"] = childNodeUuid
        msg["from"] = toLink.getFrom().getElement().getUuid()
      if curActivationBox == None:
        for activationBox in activationBoxes:
          if "start" in activationBox and msg["here"] == activationBox["start"]:
            curActivationBox = activationBox
            break
      if curActivationBox == None:
        activations += [{
          "messages": [msg]
        }]
      else:
        curActivationBox["messages"] += [msg]
        for activationBox in activationBoxes:
          if "end" in activationBox and msg["here"] == activationBox["end"]:
            curActivationBox = None
      #msgs += [msg]         # for Debug
  #model["messages"] = msgs  # for Debug
  model["activationBoxes"] = activations + activationBoxes

def exportLifeline(model, node):
  lifelineModel = {}
  exportInstance(lifelineModel, node)
  exportLifelineActivationBoxes(lifelineModel, node)
  model += [lifelineModel]


################################################################################
# Group of function(s) do export Note                                          #
################################################################################
def exportNote(model, node):
  # @TODO: implement me
  model += [str(node)]


################################################################################
# Function dictionary for supported export element types                       #
################################################################################
functionList = {
  "Lifeline": exportLifeline,
  "Note":     exportNote
}


################################################################################
# Entry point export function of Sequence Diagram                              #
################################################################################
def exportSequenceDiagram(diagram):
  global functionList
  lifeLines = []
  others = []
  dh = Modelio.getInstance().getDiagramService().getDiagramHandle(diagram)
  root = dh.getDiagramNode()
  minorNodes = []
  for topLvNode in root.getNodes():
    elemType = getElementType(topLvNode)
    if elemType == "Lifeline":
      functionList[elemType](lifeLines, topLvNode)
    else:
      minorNodes += [topLvNode]
  for minorNode in minorNodes:
    elemType = getElementType(minorNode)
    if (functionList[elemType] != None):
      functionList[elemType](others, minorNode)
  model = {
    "lifeLines": lifeLines,
    "others": others
  }
  dh.close()
  print json.dumps(model)
  #pprint.pprint(model)      # for Debug


# Test if target selected element is a sequence diagram
if len(selectedElements) > 0:
  selectedDiagram = selectedElements.get(0)
  if isinstance(selectedDiagram, SequenceDiagram):
    exportSequenceDiagram(selectedDiagram)
  else:
    print "Please select a sequence diagram before running this script."


