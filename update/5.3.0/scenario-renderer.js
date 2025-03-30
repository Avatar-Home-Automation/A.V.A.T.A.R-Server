const selectedNodes = [];
let dayOfWeek = [];
let months = [];
let selectedNode;
let selectedEdge;
let cyScenario;
let cyCronInfos;
let cyCommands;
let codeMirror;
let scenarioInfos;
let cyFlow;
let nodeModified;
let jsonEditorRules;
let restartApp = false;
let isClient;

window.onbeforeunload = async (e) => {
  e.returnValue = false;
  window.electronAPI.quitScenario(restartApp);
}


const position = { 
  node: {
    x: 100,
    y: 50
  },
  start : {
    x: 100,
    y: (window.innerHeight) / 2 - 20
  }
};

class CytoscapeElement {

  // Tableau statique pour stocker toutes les instances créées de CytoscapeElement
  static instances = [];

  /**
   * @param {Object} cy - L'instance Cytoscape
   * @param {Object} options - Les options pour définir l'élément (ex: id, data, position, etc.)
   */
  constructor(options) {
    this.options = options; // options de configuration de l'élément
    this.element = null; // référence à l'élément une fois créé
    this.hidden = options.hidden || false; // Initialisation de l'état caché, par défaut à false

    // Enregistrer l'instance dans le tableau statique
    CytoscapeElement.instances.push(this);
  }

  /**
   * Crée l'élément dans Cytoscape et le retourne.
   * @returns {Object} L'élément Cytoscape créé
   */
  create(ele) {
    if (!this.element) {
      this.element = cyScenario.add(this.options);
    }
    return this.element;
  }

  /**
   * Masque l'élément (node ou edge) et met à jour l'état interne.
   */
  hide() {
    if (this.element) {
      this.element.hide();
      this.hidden = true;
    }

    // Si cet élément est un node, on supprime tous les edges qui le concernent.
    if (this.options.group === 'nodes') {
      const nodeId = this.options.data.id;
      // Parcourir toutes les instances pour trouver les edges liées à ce node
      CytoscapeElement.instances.forEach(instance => {
        if (instance.options.group === 'edges') {
          const { source, target } = instance.options.data;
          if (source === nodeId || target === nodeId) {
            // On supprime l'edge si elle existe
            instance.remove();
          }
        }
      });
    }
  }

  /**
   * Vérifie si l'élément est sélectionné.
   * @returns {boolean} true si l'élément est sélectionné, false sinon.
   */
  isSelected() {
    return this.element ? this.element.selected() : false;
  }

  /**
   * Retourne true si l'élément est actuellement caché, false sinon.
   * @returns {boolean}
   */
  isHidden() {
    return this.hidden;
  }


  /**
   * Retourne l'instance de l'élément sélectionné correspondant au type passé en paramètre.
   * Si aucun élément du type spécifié n'est sélectionné, retourne undefined.
   *
   * @param {string} type - Le type de l'élément recherché (ex: 'calendar').
   * @returns {CytoscapeElement | undefined} L'instance sélectionnée ou undefined si aucun n'est sélectionné.
   */
  static getSelectedElementByType(type) {
    return CytoscapeElement.instances.find(instance => 
      instance.options.data.type === type && instance.element && instance.element.selected()
    );
  }

  /**
   * Checks if an element with a given type already exists in Cytoscape.
   * Assumes that the element's type is stored in its data (e.g., data: { type: 'start' }).
   * @param {string} typeValue - The type value to search for.
   * @returns {boolean} true if at least one element with the specified type exists, otherwise false.
   */
  static existsWithType(typeValue) {
    // The selector assumes the type is stored in data as 'type'
    const elements = cyScenario.$(`node[type="${typeValue}"]`);
    return elements.length > 0;
  }

  /**
   * Checks if an element (node or edge) with the given id exists in Cytoscape.
   * L'id est récupéré depuis l'instance de CytoscapeElement (this.options.data.id).
   * @param {Object} cy - The Cytoscape instance.
   * @param {CytoscapeElement|string} elementOrId - A CytoscapeElement instance or an id string.
   * @returns {boolean} True if an element with the specified id exists, otherwise false.
   */
  static elementExists(elementOrId) {
    // Si un objet de type CytoscapeElement est passé, on récupère l'id dans options.data.id
    const id = typeof elementOrId === 'string' ? elementOrId : elementOrId.id();
    
    // Vérifier si un node ou un edge visible avec cet id existe
    const nodeExists = cyScenario.$(`node[id="${id}"]`).filter(ele => ele.visible()).length > 0;
    const edgeExists = cyScenario.$(`edge[id="${id}"]`).filter(ele => ele.visible()).length > 0;
    
    return nodeExists || edgeExists;
  }

  /**
   * Récupère une instance de CytoscapeElement dans le tableau des instances à partir d'un id donné.
   * @param {string} id - L'identifiant de l'élément recherché (présumé stocké dans options.data.id)
   * @returns {CytoscapeElement | undefined} L'instance correspondante ou undefined si non trouvée.
   */
  static getElementById(id) {
    return CytoscapeElement.instances.find(instance => instance.options.data.id === id);
  }

  static getElementBytype(type) {
    return CytoscapeElement.instances.find(instance => instance.options.data.type === type);
  }

  /**
   * Retrieves all instances of CytoscapeElement with a given type.
   * @param {string} type - The type to search for (assumed stored in options.data.type).
   * @returns {CytoscapeElement[]} An array of matching instances.
   */
  static getElementsByType(type) {
    return CytoscapeElement.instances.filter(
      instance => instance.options.data.type === type && !instance.isHidden()
    );
  }

  static getVisibleNodes() {
    return CytoscapeElement.instances.filter(instance => {
      // On suppose que l'élément est un node si options.group === 'nodes'
      return instance.options.group === 'nodes' && !instance.isHidden();
    });
  }

  static getVisibleEdges() {
    return CytoscapeElement.instances.filter(
      instance => instance.options.group === 'edges' && !instance.isHidden()
    );
  }


  /**
   * Récupère toutes les instances dont le groupe correspond au type passé en paramètre.
   * Par exemple, pour 'nodes' ou 'edges'.
   *
   * @param {string} groupType - Le type à rechercher ('nodes' ou 'edges').
   * @returns {CytoscapeElement[]} Tableau des instances dont options.group correspond au type passé.
   */
  static getElementsByGroup(groupType) {
    return CytoscapeElement.instances.filter(instance => instance.options.group === groupType);
  }

  static removeAll() {
    // On clone le tableau pour éviter les problèmes lors de la modification pendant l'itération.
    CytoscapeElement.instances.slice().forEach(instance => instance.remove());
  }

  /**
   * Supprime l'élément de Cytoscape.
   */
  remove() {
    if (this.element) {
      cyScenario.remove(this.element);
      this.element = null;
    }

    // Retirer l'instance du tableau
    const index = CytoscapeElement.instances.indexOf(this);
    if (index !== -1) {
      CytoscapeElement.instances.splice(index, 1);
    }
  }
}



function resizeCyScenarioBasedOnNodes() {
  const bb = cyScenario.nodes().boundingBox();
  const margin = 20; // marge supplémentaire éventuelle

  // Calcul de la largeur : la distance entre le nœud le plus à droite et celui le plus à gauche, plus une marge.
  // Ici, nous utilisons bb.x2 - bb.x1 pour obtenir la largeur utile du graphe.
  const newWidth = bb.x2 + margin;

  // Pareil pour la hauteur
  const newHeight = bb.y2 + margin;

  const container = document.getElementById("cy-scenario");
  container.style.width = newWidth + "px";
  container.style.height = newHeight + "px";

  // Redimensionner Cytoscape pour qu'il prenne en compte les nouvelles dimensions
  cyScenario.resize();
}


function showTab(settingType) {
  document.getElementById("rule-tab").style.display = "none";
  document.getElementById("schedule-tab").style.display = "none";
  document.getElementById("execution-tab").style.display = "none";
  
  window.requestAnimationFrame(() => {
    document.getElementById(settingType).style.display = "block";
  })
}

document.getElementById("rule").addEventListener("click", (event) => {
  showTab("rule-tab");
})

document.getElementById("schedule").addEventListener("click", (event) => {
  showTab("schedule-tab");
})

document.getElementById("execution").addEventListener("click", (event) => {
  showTab("execution-tab");
})


/**
 * Initializes and returns a Cytoscape instance with the specified options.
 *
 * @param {HTMLElement} cyElem - The container element for the Cytoscape instance.
 * @param {Object} options - Configuration options for the Cytoscape instance.
 * @param {number} options.height - The height of the nodes.
 * @param {number} options.width - The width of the nodes.
 * @returns {Promise<Object>} A promise that resolves to the initialized Cytoscape instance.
 */
async function setCY (cyElem, options) {

  const cyFlow = cytoscape({
    container:  cyElem,
    boxSelectionEnabled: false,
    autounselectify: false,
    zoomingEnabled: false,
    autoungrabify : false,
    selectionType: 'single',
    userZoomingEnabled: false,
    userPanningEnabled: false,
    panningEnabled: false,
    zoom: 1,
    pan: { x: 0, y: 0 },
    pixelRatio: 'auto',
    style: cytoscape.stylesheet()
        .selector('node')
        .css({
          'height': options.height,
          'width': options.width,
          'background-fit': 'cover',
          'border-color': "rgba(226, 45, 17, 1)",
          'border-width': 2,
          'border-opacity': 0,
          'font-size': 12,  
          "color" : "black",
          "text-wrap": "wrap",
          "text-max-width": 75,
          "text-valign": "bottom",
          "text-margin-y": 5,
          "text-halign": "center",
          'text-outline-width': 0,
          'text-outline-color': "rgba(86, 87, 85, 1)"
        })
        .selector('edge')
        .css({
          'curve-style': 'straight',
          'width': 2,
          'line-color': "rgba(209, 89, 151, 1)",
          'target-arrow-color': "rgba(209, 89, 151, 1)",
          'target-arrow-shape': 'triangle-cross',
        })
  });

  cyFlow.on('mouseover', 'node', () => {
    cyFlow.container().style.cursor = 'pointer';
  });
  
  cyFlow.on('mouseout', 'node', () => {
    cyFlow.container().style.cursor = 'default';
  });

  return cyFlow;

}


function updateCalendarIds(data) {
  // Mapping des anciens id vers les nouveaux id
  const idMapping = {};

  // Première passe : modifier les id des objets "calendar"
  data.forEach(item => {
    if (item.Type === "calendar") {
      const oldId = item.id;
      const newId = getRandomId();
      idMapping[oldId] = newId;
      item.id = newId;
    }
  });

  // Deuxième passe : mettre à jour idParent pour les objets dont le parent était un calendrier
  data.forEach(item => {
    if (item.idParent && idMapping[item.idParent]) {
      item.idParent = idMapping[item.idParent];
    }
  });

  return data;
}



async function copyScenario() {

  const newScenario = document.getElementById("new-name-copy").value;
  if (newScenario === "") {
    notification(await Lget("scenario.newName"), true);
    return;
  }

  var element = cyFlow.elements().filter((ele) => {
    return ele.data('label') === newScenario;
  });

  if (element.length > 0) {
    notification(await Lget("scenario.newNameAlreadyExist"), true);
    return;
  }

  const flattenedStructure = await validateScenario();
  if (!flattenedStructure) return;

  var newflattenedStructure = structuredClone(flattenedStructure);

  newflattenedStructure.forEach(async item => {
    if (item.Type === "start") {

      // Ancien nom
      const oldScenario = item.infos.scenario;
      const oldScenarioId = item.id;

      // Nouveau nom
      item.infos.scenario = newScenario;
      item.id = getRandomId();

      newflattenedStructure.forEach(obj => {
        if (obj.idParent === oldScenarioId) {
          obj.idParent = item.id;
        }
        if (obj.idRoot === oldScenarioId) {
          obj.idRoot = item.id;
        }
      });

      newflattenedStructure = updateCalendarIds(newflattenedStructure);
      
      scenarioInfos.scenarios[item.infos.scenario] = newflattenedStructure;
      const scenariosDiv = document.getElementById('cy-scenarios');
      let height = parseInt(scenariosDiv.style.height.replace('px', ''), 10);
      let pos = height + 15;
      await addNode(cyFlow, `${item.infos.scenario}`, pos, 'y', "scene", "url('../images/icons/scenario.png')");
      pos += 70;
      height += 70;
      scenariosDiv.style.height = `${height}px`;
      try {
        const result = await window.electronAPI.createScenario(newflattenedStructure);
        if (result) {
          // Reset value
          nodeModified = false;
          unblinkSave();

          // Displays a notification
          notification (await Lget("scenario.copied", oldScenario, item.infos.scenario));
        }
      } catch (err) {
        notification (err, true);
      }
    }
  })
  
}


async function validateScenario() {

  const visibleNodes = CytoscapeElement.getVisibleNodes();
  const visibleEdges = CytoscapeElement.getVisibleEdges();
  const nodesClassification = classifyNodesByEdges(visibleNodes, visibleEdges);

  // Checks if the scenario is created
  if (Object.keys(nodesClassification).length === 0) {
    notification(await Lget("scenario.notExistToSave"), true);
    return;
  }

  // Checks if a start element exists
  const scenarioToSave = CytoscapeElement.getElementBytype('start');
  if (!scenarioToSave) {
    notification(await Lget("scenario.notStartToSave"), true);
    return;
  } 
  
  // Returns isolated nodes
  if (hasIsolatedNodes(nodesClassification)) {
    notification(await Lget("scenario.isolated"), true);
    return;
  }

  // Retourne les nodes qui ont au moins une edge source et dont le type n'est pas "start".
  if (getNodesWithNoSourceAndNotStart(nodesClassification).length > 0) {
    notification(await Lget("scenario.noParent"), true);
    return;
  }

  // Vérifie que tous les nodes sans targetEdges sont de type 'end'.
  if (!checkNodesWithoutTargetEnd(nodesClassification)) {
    notification(await Lget("scenario.noEnd"), true);
    return;
  }

  // Vérifie si un node a plusieurs cibles de type 'end'.
  if (existsNodeWithMultipleEndTargets(nodesClassification)) {
    notification(await Lget("scenario.multipleEnd"), true);
    return;
  }

  // Construit récursivement la hiérarchie du scénario et test si toutes les informations sont définies .
  const hierarchy = getHierarchy(nodesClassification);
  if (hasEmptyInfos(hierarchy)) {
    notification(await Lget("scenario.notDefined"), true);
    return;
  }

  // on construit la structure: id, Type, infos, id parent
 return getFlattenedStructure(nodesClassification);

}


async function saveScenario() {

  const flattenedStructure = await validateScenario();
  if (!flattenedStructure) return;

  try {
    const result = await window.electronAPI.createScenario(flattenedStructure);
    if (result) {
      flattenedStructure.forEach(async item => {
        if (item.Type === "start" && item.infos && item.infos.scenario) {
          let found;
          // updates existing scenario
          for (let i in scenarioInfos.scenarios) {
            const scenario = scenarioInfos.scenarios[i].find(item => item.infos.scenario !== undefined);
            if (scenario.id === item.id) {
              
              if (scenario.infos.scenario !== item.infos.scenario) {
                const element = cyFlow.$(`[label="${scenario.infos.scenario}"]`);
                await addNode(cyFlow, `${item.infos.scenario}`, element.position().y, 'y', "scene", "url('../images/icons/scenario.png')");
                cyFlow.remove(element);

                scenarioInfos.scenarios[item.infos.scenario] = flattenedStructure;
                delete scenarioInfos.scenarios[scenario.infos.scenario];
              } else {
                scenarioInfos.scenarios[scenario.infos.scenario] = flattenedStructure;
              }

              // Displays a notification
              notification (await Lget("scenario.saved", item.infos.scenario));
              
              found = true;
              break;
            }
          }
          // new scenario - add it in the list
          if (!found) {
            scenarioInfos.scenarios[item.infos.scenario] = flattenedStructure;
            const scenariosDiv = document.getElementById('cy-scenarios');
            let height = parseInt(scenariosDiv.style.height.replace('px', ''), 10);
            let pos = height + 15;
            await addNode(cyFlow, `${item.infos.scenario}`, pos, 'y', "scene", "url('../images/icons/scenario.png')");
            pos += 70;
            height += 70;
            scenariosDiv.style.height = `${height}px`;

            // Displays a notification
            notification (await Lget("scenario.createdSaved", item.infos.scenario));
            selectScenario(cyFlow.$(`[label="${item.infos.scenario}"]`));
          }
        }
      });

      // Reset values
      nodeModified = false;
      unblinkSave();
    } else {
      notification (await Lget("scenario.saveError"), true);
    }
  } catch (err) {
    notification (await Lget("scenario.saveError") + ": " + err, true);
  }

}


function getFlattenedStructure(nodesClassification) {

  const idRoot = CytoscapeElement.getElementBytype('start')?.element?.id();
  if (!idRoot) return [];
  const hierarchy = buildHierarchy(nodesClassification, idRoot);

  // Aplatir la hiérarchie pour obtenir l'objet final
  const flattened = flattenHierarchy(hierarchy, nodesClassification, null, idRoot);
  return flattened;

}


/**
 * Parcourt récursivement la hiérarchie pour en extraire un tableau d'objets.
 * Chaque objet contient : id, Type, infos, et idParent.
 *
 * @param {Object} hierarchy - La hiérarchie construite avec buildHierarchy.
 * @param {Object} classification - La structure d'origine pour retrouver le type de chaque node.
 * @param {string|null} parentId - L'id du node parent (null pour la racine).
 * @returns {Array} Tableau d'objets plats représentant chaque node.
 */
function flattenHierarchy(hierarchy, classification, parentId = null, idRoot) {
  if (!hierarchy) return [];

  
  // Récupérer le type depuis la classification d'origine
  const type = classification[hierarchy.id].node.options.data.type;
  const nodeObj = {
    id: hierarchy.id,
    Type: type,
    infos: hierarchy.infos,
    idParent: parentId,
    idRoot: idRoot,
    node: {
      x: parseFloat(classification[hierarchy.id].node.element.position('x').toFixed(2)) || 25,
      y: parseFloat(classification[hierarchy.id].node.element.position('y').toFixed(2)) || 25
    }
  };

  let nodesArray = [nodeObj];

  if (hierarchy.children && hierarchy.children.length > 0) {
    hierarchy.children.forEach(child => {
      nodesArray = nodesArray.concat(flattenHierarchy(child, classification, hierarchy.id, idRoot));
    });
  }

  return nodesArray;
}


function hasEmptyInfos(hierarchy) {
  if (!hierarchy) return false;

  // Vérifier si le node courant a un objet infos vide.
  if (
    hierarchy.infos &&
    typeof hierarchy.infos === 'object' &&
    Object.keys(hierarchy.infos).length === 0
  ) {
    return true;
  }

  // Parcourir récursivement les enfants
  if (hierarchy.children && hierarchy.children.length > 0) {
    return hierarchy.children.some(child => hasEmptyInfos(child));
  }

  return false;
}


/**
 * Construit récursivement la hiérarchie à partir d'un node donné.
 * @param {Object} classification - La structure générée par classifyNodesByEdges.
 * @param {string} currentNodeId - L'id du node courant.
 * @returns {Object} Un objet représentant le node courant et ses enfants.
 */
function buildHierarchy(classification, currentNodeId) {
  const currentNodeClass = classification[currentNodeId];
  if (!currentNodeClass || currentNodeClass.node.isHidden()) {
    return null;
  }

  const children = currentNodeClass.targetEdges
    .map(edge => {
      const childId = edge.options.data.target;
      return buildHierarchy(classification, childId);
    })
    .filter(child => child !== null);

  return {
    id: currentNodeId,
    infos: currentNodeClass.node.options.data.infos,
    children
  };
}

/**
 * Recherche les nodes de type "start" et construit la hiérarchie à partir d'eux.
 * Si plusieurs nodes "start" existent, renvoie un tableau de hiérarchies.
 *
 * @param {Object} classification - La structure générée par classifyNodesByEdges.
 * @returns {Array|Object} La hiérarchie (ou un tableau de hiérarchies) des nodes.
 */
function getHierarchy(classification) {
  // Recherche des nodes visibles de type "start"
  const startNodes = Object.values(classification).filter(nodeClass =>
    !nodeClass.node.isHidden() && nodeClass.node.options.data.type === 'start'
  );

  // Si plusieurs "start", retourner un tableau de hiérarchies, sinon une seule hiérarchie.
  const hierarchies = startNodes.map(nodeClass =>
    buildHierarchy(classification, nodeClass.node.options.data.id)
  );

  return hierarchies.length === 1 ? hierarchies[0] : hierarchies;
}

/**
 * Vérifie si au moins un node visible a plusieurs cibles de type 'end'.
 * @param {Object} classification - La structure générée par classifyNodesByEdges.
 * @returns {boolean} True si un node a plusieurs 'end', false sinon.
 */
function existsNodeWithMultipleEndTargets(classification) {
  return Object.values(classification).some(nodeClass =>
    !nodeClass.node.isHidden() && hasMultipleEndTargetsForNode(nodeClass, classification)
  );
}

/**
 * Vérifie si le node donné (via son objet de classification) possède plusieurs targets de type 'end'.
 * @param {Object} nodeClass - L'objet de classification d'un node (contenant node, sourceEdges, targetEdges).
 * @param {Object} classification - La structure complète de classification permettant de retrouver les nodes par leur id.
 * @returns {boolean} True si le node possède plus d'une target visible de type 'end', sinon false.
 */
function hasMultipleEndTargetsForNode(nodeClass, classification) {
  // On compte le nombre de targets de type 'end'
  let endCount = 0;
  nodeClass.targetEdges.forEach(edge => {
    // Dans notre classification inversée, la target du node est stockée dans edge.options.data.source.
    const targetNodeId = edge.options.data.target;
    // On vérifie que le node cible existe dans la classification et qu'il est visible.
    if (
      classification[targetNodeId] &&
      !classification[targetNodeId].node.isHidden() &&
      classification[targetNodeId].node.options.data.type === 'end'
    ) {
      endCount++;
    }
  });
  return endCount > 1;
}

/**
 * Vérifie que tous les nodes sans targetEdges sont de type 'end'.
 * @param {Object} classification - La structure générée par classifyNodesByEdges.
 * @returns {boolean} True si tous les nodes sans targetEdges sont de type 'end', sinon false.
 */
function checkNodesWithoutTargetEnd(classification) {
  return Object.values(classification).every(nodeClass => {
    // Si le node est caché, on l'ignore en retournant true.
    if (nodeClass.node.isHidden()) {
      return true;
    }
    // Pour les nodes visibles, s'il n'y a aucune targetEdge,
    // vérifier que son type est 'end'.
    if (nodeClass.targetEdges.length === 0) {
      return nodeClass.node.options.data.type === 'end';
    }
    return true;
  });
}



/**
 * Retourne les nodes qui ne satisfont pas le critère "aucune edge en source" (donc qui ont au moins une edge source)
 * ET dont le type n'est pas "start".
 *
 * @param {Object} classification - La structure générée par classifyNodesByEdges.
 * @returns {Array} Tableau des objets de classification correspondant aux nodes filtrés.
 */
function getNodesWithNoSourceAndNotStart(classification) {
  return Object.values(classification).filter(nodeClass =>
    !nodeClass.node.isHidden() && nodeClass.sourceEdges.length === 0 && nodeClass.node.options.data.type !== 'start'
  );
}


/**
 * Retourne tous les nodes isolés (sans sourceEdges ni targetEdges) à partir d'une classification.
 * @param {Object} classification - La structure générée par classifyNodesByEdges.
 * @returns {Array} Tableau des objets de classification correspondant aux nodes isolés.
 */
function hasIsolatedNodes(classification) {
  return Object.values(classification).some(nodeClass =>
    !nodeClass.node.isHidden() &&
    nodeClass.sourceEdges.length === 0 &&
    nodeClass.targetEdges.length === 0
  );
}


/**
 * Construit une structure associant à chaque node visible ses edges en fonction de leur rôle.
 * Chaque node a :
 *  - sourceEdges : les edges dont le node est la source,
 *  - targetEdges : les edges dont le node est la cible.
 *
 * @param {CytoscapeElement[]} visibleNodes - Tableau des nodes visibles.
 * @param {CytoscapeElement[]} visibleEdges - Tableau des edges visibles.
 * @returns {Object} Un objet dont chaque clé est l'id d'un node et la valeur est un objet contenant
 *                   le node ainsi que ses edges source et target.
 */
function classifyNodesByEdges(visibleNodes, visibleEdges) {
  // Initialisation de la structure pour chaque node visible
  const classification = {};
  visibleNodes.forEach(node => {
    const nodeId = node.options.data.id;
    classification[nodeId] = {
      node,
      sourceEdges: [], // edges dont ce node est la source
      targetEdges: []  // edges dont ce node est la cible
    };
  });

  // Parcourir les edges pour les associer aux nodes sources et targets
  visibleEdges.forEach(edge => {
    const sourceId = edge.options.data.target;
    const targetId = edge.options.data.source;
    if (classification[sourceId]) {
      classification[sourceId].sourceEdges.push(edge);
    }
    if (classification[targetId]) {
      classification[targetId].targetEdges.push(edge);
    }
  });

  return classification;
}


/**
 * Generates a random ID.
 *
 * This function generates a random number between 10000000 and 99999999 (inclusive)
 * and returns it as a string.
 *
 * @returns {string} A random ID as a string.
 */
function getRandomId() {
  // Génère un nombre entre 10000000 et 99999999 (inclus)
  return Math.floor(Math.random() * 90000000 + 10000000).toString();
}


/**
 * Supprime l'élément dans le tableau selectedNodes qui a le même id.
 * @param {string} id - L'identifiant de l'élément à supprimer.
 */
function removeSelectedNodeById(id) {
  const index = selectedNodes.findIndex(node => node.id() === id);
  if (index !== -1) {
    selectedNodes.splice(index, 1);
  }
}


/**
 * Deselects the currently selected nodes and resets their styles.
 * 
 * This function clears the selection of up to two nodes by calling their
 * `unselect` method and resetting their border opacity to 0. It then clears
 * the `selectedNodes` array and invokes the `addCronStatusInfos` function
 * to update the status information.
 * 
 * @function
 */
function unselectNodes() {
  if (selectedNodes.length > 0) {
    selectedNodes[0].unselect();
    selectedNodes[0].style ({
      'border-opacity': 0
    });   

    if (selectedNodes.length > 1) {
      selectedNodes[1].unselect();
      selectedNodes[1].style ({
        'border-opacity': 0
      });
    }
    selectedNodes.length = 0;
    addCronStatusInfos();
  }
}


function selectScenario(element) {

  unselectScenario();

  element.select();
  element.style ({
    'border-opacity': 1
  });

}


function unselectScenario() {
  cyFlow.elements().unselect();
  cyFlow.elements().css({ 'border-opacity': 0 });
}


function unblinkSave() {

  let ele = cyCommands.$(`node[id="save"]`);

  var blinkInterval = ele.scratch('blinkInterval');
  if (blinkInterval) {
    clearInterval(blinkInterval);
    ele.scratch('blinkInterval', null);
    // Réinitialise l'opacité à 1
    ele.style('border-opacity', 0);
    ele.scratch('blinkState', 0);
  }

}


function blinkSave() {

  let ele = cyCommands.$(`node[id="save"]`);

  // Si le blink n'est pas déjà lancé pour ce nœud
  if (!ele.scratch('blinkInterval')) {
    // Initialise l'état (1 signifie opaque)
    ele.scratch('blinkState', 0);
    var blinkInterval = setInterval(function() {
      // Récupère l'état courant
      var currentOpacity = ele.scratch('blinkState');
      // Alterne entre 1 (opaque) et 0 (transparent)
      var newOpacity = currentOpacity === 1 ? 0 : 1;
      ele.style('border-opacity', newOpacity);
      ele.scratch('blinkState', newOpacity);
    }, 500); // Toutes les 500ms
    ele.scratch('blinkInterval', blinkInterval);
  }

}


/**
 * Processes a node by selecting or unselecting it, and potentially adding an edge between two selected nodes.
 * 
 * @param {Object} node - The node to be processed.
 * @param {Function} node.id - Function that returns the ID of the node.
 * @param {Function} node.select - Function to select the node.
 * @param {Function} node.unselect - Function to unselect the node.
 * @param {Function} node.style - Function to apply styles to the node.
 * 
 * @returns {Promise<void>} - A promise that resolves when the node processing is complete.
 */
async function processNode(node) {

  const foundNode = selectedNodes.find(n => n.id() === node.id());
  if (!foundNode ) {
    // Ajouter le noeud si moins de 2 sont sélectionnés
    if (selectedNodes.length < 2) {
      selectedNodes.push(node);
      node.select();
      node.style ({
        'border-opacity': 1
      });
    }
  } else {
    foundNode.unselect();
    foundNode.style ({
      'border-opacity': 0
    });  
    removeSelectedNodeById(foundNode.id()); 
    addCronStatusInfos();
  }

  // Si on a 2 noeuds, on appelle addEdge
  if (selectedNodes.length === 2) {

    const [firstNode, secondNode] = selectedNodes;
    const firstId = firstNode.id();
    const secondId = secondNode.id();

    const isReversed = isEdgeReversing(firstId, secondId);
    const isCalendar = isTargetCalendarAndSourceNotStart(firstId, secondId);
    const isInvalidDueToStart = isTargetStartAndSourceNotStart(firstId, secondId);
    const edgeExists = CytoscapeElement.elementExists(`${firstId}-${secondId}`) ||
                      CytoscapeElement.elementExists(`${secondId}-${firstId}`);

    if (!isReversed && !isCalendar && !edgeExists && !isInvalidDueToStart) {
      addEdge(firstId, secondId);
    }
    unselectNodes();
  }

}



/**
 * Vérifie si le node target est de type 'start' alors que le node source n'est pas de type 'start'.
 * Cela signifie qu'une edge allant de source vers target "remonte" l'arbre vers le début.
 *
 * @param {string} sourceId - L'identifiant du node source.
 * @param {string} targetId - L'identifiant du node target.
 * @returns {boolean} true si le target est 'start' et le source n'est pas 'start', sinon false.
 */
function isTargetStartAndSourceNotStart(sourceId, targetId) {
  const source = CytoscapeElement.getElementById(sourceId);
  const target = CytoscapeElement.getElementById(targetId);
  if (!source || !target) return false;
  return target.options.data.type === 'start' && source.options.data.type !== 'start';
}


/**
 * Vérifie si le node target est de type 'calendar' et que le node source n'est pas de type 'start'.
 *
 * @param {string} sourceId - L'identifiant du node source.
 * @param {string} targetId - L'identifiant du node target.
 * @returns {boolean} true si le target est de type 'calendar' ET le source n'est PAS de type 'start', sinon false.
 */
function isTargetCalendarAndSourceNotStart(sourceId, targetId) {
  const source = CytoscapeElement.getElementById(sourceId);
  const target = CytoscapeElement.getElementById(targetId);
  
  if (!target || !source) return false;
  
  return target.options.data.type === 'calendar' && source.options.data.type !== 'start';
}


/**
 * Vérifie si un node est déjà présent dans l'arbre en regardant s'il apparaît dans une arête existante.
 * L'arbre est constitué des edges enregistrées dans CytoscapeElement (groupe 'edges').
 *
 * @param {string} nodeId - L'identifiant du node à tester.
 * @returns {boolean} true si le node apparaît dans au moins une edge, sinon false.
 */
function isNodeInTree(nodeId) {
  const edges = CytoscapeElement.getElementsByGroup('edges');
  return edges.some(edge => 
    edge.options.data.source === nodeId || edge.options.data.target === nodeId
  );
}


/**
 * Vérifie si la création d'une edge avec le node cliqué en premier (source) et
 * le node cliqué en deuxième (target) revient "en arrière" dans l'arbre.
 *
 * Dans notre scénario, le premier node cliqué est toujours la source et le deuxième est la target.
 * Si le node source est nouveau (n'apparaît dans aucune edge) et que le node target existe déjà dans l'arbre,
 * cela signifie que l'edge créée irait de nouveau (nouveau → existant), ce qui inverse la progression de l'arbre.
 *
 * @param {string} sourceId - L'identifiant du node cliqué en premier (source).
 * @param {string} targetId - L'identifiant du node cliqué en deuxième (target).
 * @returns {boolean} true si l'edge reviendrait vers le début de l'arbre (invalide), sinon false.
 */
function isEdgeReversing(sourceId, targetId) {
  const sourceInTree = isNodeInTree(sourceId);
  const targetInTree = isNodeInTree(targetId);
  
  // Cas invalide : le node source est nouveau (pas encore dans l'arbre) 
  // et le node target existe déjà dans l'arbre.
  return (!sourceInTree && targetInTree);
}


/**
 * Vérifie si la target passée en paramètre est déjà utilisée comme target dans un edge existant.
 * @param {string} target - L'identifiant de la target à tester.
 * @returns {boolean} true si un edge avec cette target comme target existe, sinon false.
 */
function isTargetAlreadyEdgeTarget(target) {
  const edges = CytoscapeElement.getElementsByGroup('edges');
  return edges.some(edge => edge.options.data.target === target);
}


/**
 * Adds an edge between two nodes in a Cytoscape graph.
 *
 * @param {string} source - The ID of the source node.
 * @param {string} target - The ID of the target node.
 */
async function addEdge(source, target) {

  try {

    $('#body').find("div[id*='qtip-cy-qtip-target']").css("display", "none");

    const options = {
      group: "edges",
      data: {
        id: source+"-"+target,
        source: source,
        target: target
      }
    }
    
    const elem = new CytoscapeElement(options);
    const s = elem.create();

    s.qtip({
      overwrite: true, 
      content: {
        text: $('#edge-infos')
      },
      position: {
        target: function(api) {
          const sourcePos = this.source().renderedPosition();
          const targetPos = this.target().renderedPosition();
          return {
            x: (sourcePos.x + targetPos.x) / 2,
            y: (sourcePos.y + targetPos.y) / 2
          };
        },
        my: 'top center',
        at: 'bottom center'
      },
      show: {
        event: 'click'
      },
      hide: {
        event: 'unfocus mouseout',
        fixed: true,
        delay: 300
      },
      events: {
        show: (event, api) => {
          selectedEdge = elem;
        },
        visible: function(event, api) {
          api.reposition();
        }
      },
      style: {
        classes: 'qtip-dark qtip-rounded'
      }
    });

  } catch (err) {
    notification (await Lget("scenario.createEdgeError") + " " + err, true);
  }

}


/**
 * Displays a notification message on the screen.
 *
 * @param {string} msg - The message to be displayed in the notification.
 * @param {boolean} err - A flag indicating if the message is an error. If true, the notification text will be red; otherwise, it will be white.
 */
function notification (msg, err) {
  const notif = $('#notification');
  notif.css("color", ((err) ? 'red' : 'rgba(255, 255, 255, 0.9)'));
  if (notif.attr('opened') === true) {
    notif.html(notif.innerHTML+"<br>"+msg);
  } else {
    notif.html(msg);
    notif.attr('opened', true);
  }
}


/**
 * Adds a flow node to the scenario renderer.
 *
 * This function creates a new flow node of the specified type, sets its position,
 * and applies styles and event listeners to it.
 *
 * @param {string} type - The type of the flow node to add. This determines the node's
 *                        position and background image.
 */
async function addFlowNode (type) {

  if (type === 'start' && CytoscapeElement.existsWithType('start')) {
    const s = CytoscapeElement.getElementBytype('start').element;
    await processNode(s);
    await addFlowNode('calendar');
    return; 
  }

  let xPos, yPos;
  if (type === 'start') {
    xPos = position.start.x;
    yPos = position.start.y;
  } else {
    xPos = position.node.x;
    yPos = position.node.y;
    position.node.x += 20;
  }

  const offsets = {
    start: -50
  };
  const x = xPos + (offsets[type] || 0);

  const infos = type === 'end' ? {end: true} : {};
  const options = {
    group: 'nodes',    
    data: { 
      id: getRandomId(),
      type: type,
      infos: infos
    },
    position: { 
      x: x, 
      y: yPos
    }
  };

  const elem = new CytoscapeElement(options);
  const s = elem.create();
  const style = {
    'background-image': `url('../images/icons/${type}.png')`
  }
  s.style (style)
  .on('tap', async evt => {
    await processNode(evt.target);
    if (type === 'calendar') {
      addCronStatusInfos(evt.target.id());
    }
  })
  .on('dbltap', evt => {
      defineAction(evt.target);
      selectedNode = evt.target.id();
  });

  if (type === 'start' || type === 'calendar') {
    await processNode(s);

    if (type === 'start') {
      await addFlowNode('calendar');
    }
    
    s.style('label', `?`);

  } else if (type !== 'end') {
    s.style('label', `?`);
  }
}


function removeCodeMirror() {
  if (codeMirror) {
    var wrapper = codeMirror.getWrapperElement();
    if (wrapper && wrapper.parentNode) {
      wrapper.parentNode.removeChild(wrapper);
    }
  }
}


function updateEditorContent(newContent, elem, lineNumbers, lint) {

  removeCodeMirror();

  codeMirror = CodeMirror(elem, {
    value: newContent,
    mode: "javascript",
    lineNumbers: lineNumbers,
    gutters: ["CodeMirror-lint-markers"],
    lint: {
      esversion: 8
    },  
    tabSize: 2,
    indentUnit: 2,
    autoCloseBrackets: true,
    matchBrackets: true
  });

}


async function resetCalendarForm (infos) {

  showTab("execution-tab");
  document.getElementById('execution').toggled = true;
  document.getElementById("execution-cron").toggled = false;
  document.getElementById("enable-execution-cron").toggled = false;
  document.getElementById("execution-rule").toggled = false;
  document.getElementById("enable-execution-rule").toggled = false;

  if (isClient) {
    document.getElementById('execution-rule').disabled = true;
    document.getElementById("enable-execution-rule").disabled = true;
  }

  document.getElementById('schedule').disabled = true;
  document.getElementById('rule').disabled = true;
  document.getElementById('schedule').toggled = false;
  document.getElementById('rule').toggled = false;

  if (infos?.cron?.value) {
    document.getElementById('schedule').disabled = !infos?.cron.active;
    document.getElementById("execution-cron").toggled = true;
    document.getElementById("enable-execution-cron").toggled = infos?.cron.enabled;
    
    const cron = infos.cron.value.split(' ');
    document.getElementById("inputsecondes").value = cron[0];
    document.getElementById("inputminutes").value = cron[1];
    document.getElementById("inputhours").value = cron[2];
    document.getElementById("inputmonthdays").value = cron[3];
    document.getElementById("inputmonths").value = cron[4];
    document.getElementById("inputweekdays").value = cron[5];
    txt = generateCronDescription();
  } else {
    document.getElementById('schedule').disabled = !document.getElementById("execution-cron").toggled;
    
    document.getElementById("inputsecondes").value
    = document.getElementById("inputminutes").value
    = document.getElementById("inputhours").value
    = document.getElementById("inputmonthdays").value
    = document.getElementById("inputmonths").value
    = document.getElementById("inputweekdays").value
    = "";
    txt = await Lget("scenario.modifyTimer");
  
  }

  document.getElementById("txtCron").innerHTML = txt;
  document.getElementById("txtCron").style.color = "";

  if (infos?.rule?.value) {
    document.getElementById('rule').disabled = !infos.rule.active;
    document.getElementById("execution-rule").toggled = true;
    document.getElementById("enable-execution-rule").toggled = infos.rule.enabled;

    setJsonEditorRules(infos.rule.value);
    
  } else {
    document.getElementById('rule').disabled = !document.getElementById("execution-rule").toggled;

    setJsonEditorRules([]);
  }

} 


function setJsonEditorRules (value) {

  if (jsonEditorRules) {
    jsonEditorRules.destroy();
    jsonEditorRules = null;
  }
  const container = document.getElementById("jsoneditor");
  jsonEditorRules = new JSONEditor(container);
  jsonEditorRules.set(value);
  jsonEditorRules.expandAll();

}


async function resetForm (ele, form) {
  let content;
  let infos = ele.data('infos');
  switch (form) {
    case 'start': {
      document.getElementById("scenario").value = infos?.scenario ? infos.scenario : "";
      break;
    }
    case 'timer': {
      document.getElementById("timer").value = infos?.timer ? infos.timer: "0";
      break;
    }
    case 'speak':
      await createSpeakClientMenu(infos, 'choose-client', scenarioInfos.clients || []);
      if (infos?.tts) {
        document.getElementById("speak").value = infos.tts;
        document.getElementById("end-speak").toggled = infos.end;
        document.getElementById("wait-speak").toggled = infos.wait;
      } else {
        document.getElementById("speak").value = "";
        document.getElementById("end-speak").toggled = true;
        document.getElementById("wait-speak").toggled = false;
      }
      break;
    case 'action':
      await createActionMenuLists(infos);
      if (infos?.name) {
        document.getElementById("action").value = infos.name;
        document.getElementById("wait-action").toggled = infos.wait;
        content = infos.parameters;
      } else {
        document.getElementById("action").value = "";
        document.getElementById("wait-action").toggled = false;
        content = 'const parameters = {\n  command: "<action to call>",\n  language: "<language used (e.g. en)>"\n};';
      }
      updateEditorContent(content, document.getElementById('parameters'), true, true);
      break;
    case 'calendar':
      resetCalendarForm(infos);
      break;
    case 'javascript':
      if (infos?.code) {
        content = infos.code;
      } else {
        content = "/**\n * Async function called by the scenario.\n *\n * @param {string} payload - Payload sent by a payload node.\n * @param {object} state\n *  - By rule: The state object containing the parameters\n *    defined by the rule.\n *  - By program: client and toClient only.\n * @returns {Promise<object>} or @returns {Promise<string>}\n *  A promise that resolves the function\n *  Examples:\n *  return { payload: payload, state };\n *  return { payload: payload, state, value1, value2 };\n *  return payload; (state is automatically retrieved)\n */\nasync function my_function(payload, state){\n\n  // Do stuff\n\n  // Return a payload 'Yes'\n  return { payload: 'Yes', state };\n}";
      }
      updateEditorContent(content, document.getElementById('javascript'), true, true);
      break;
    case 'payload':
      document.getElementById("payload").value = infos?.payload ? infos.payload : "";
      break;
    case 'module':
      if (infos?.code) {
        content = infos.code;
      } else {
        content = "//Import section\n//import * as path from 'node:path';\n\n/**\n * Main async function of the module called by the scenario.\n * DON'T REMOVE IT OR DON'T CHANGE THE NAME OF THE FUNCTION!\n *\n * @param {string} payload - Payload sent by a payload node.\n * @param {object} state\n *  - By rule: The state object containing the parameters\n *    defined by the rule.\n *  - By program: client and toClient only.\n * @returns {Promise<object>} or @returns {Promise<string>}\n *  A promise that resolves the function\n *  Examples:\n *  return { payload: payload, state };\n *  return { payload: payload, state, value1, value2 };\n *  return payload; (state is automatically retrieved)\n */\nexport async function action(payload, state){\n\n  // Call the doIt example function (you can remove it)\n  const result = doIt();\n\n  // Return a payload 'Yes'\n  return { payload: result, state };\n}\n\n\n// Just an example (you can remove it)\nfunction doIt(){\n  // Do stuff\n  return 'Yes';\n}";
      }

      document.getElementById("module-name").value = infos?.name ? infos.name : "";

      updateEditorContent(content, document.getElementById('module'), true, true);
      break;
    case 'copy': 
      document.getElementById("new-name-copy").value = "";
      break;
  }
}


/**
 * Defines an action for the given element by attaching a qTip tooltip.
 *
 * @param {Object} ele - The element to which the action is defined.
 * @param {Function} ele.qtip - Method to initialize qTip tooltip on the element.
 * @param {Function} ele.id - Method to get the ID of the element.
 * @param {Function} ele.emit - Method to emit an event on the element.
 */
function defineAction (ele) {

  const handler = (e) => {
    window.removeEventListener('showTooltip'+ele.id(), handler, false);
  }
  window.addEventListener('showTooltip'+ele.id(), handler, false);

  $('#body').find("div[id*='qtip-cy-qtip-target']").css("display", "none");

  let xml, closeQtip;
  switch (ele.data('type')) {
    case 'start':
      resetForm (ele, 'start');
      xml = $('#start-infos');
      closeQtip = $('#close-scenario');
      break;
    case 'action': 
      resetForm (ele, 'action');
      xml = $('#action-infos');
      closeQtip = $('#close-task, #remove-task');
      break;
    case 'timer':
      resetForm (ele, 'timer');
      xml = $('#timer-infos');
      closeQtip = $('#close-timer, #remove-timer');
      break;
    case 'speak':
      resetForm (ele, 'speak');
      xml = $('#speak-infos');
      closeQtip = $('#close-speak, #remove-speak');
      break;
    case 'calendar':
      resetForm (ele, 'calendar');
      xml = $('#calendar-infos');
      closeQtip = $('#close-calendar, #remove-calendar');
      break;
    case 'javascript':
      resetForm (ele, 'javascript');
      xml = $('#javascript-infos');
      closeQtip = $('#close-javascript, #remove-javascript');
      break;
    case 'payload':
      resetForm (ele, 'payload');
      xml = $('#payload-infos');
      closeQtip = $('#close-payload, #remove-payload');
      break;
    case 'module':
      resetForm (ele, 'module');
      xml = $('#module-infos');
      closeQtip = $('#close-module, #remove-module');
      break;
    case 'end':
      xml = $('#end-infos');
      closeQtip = $('#close-end, #remove-end');
      break;
  }
 
  ele.qtip({
    overwrite: true, 
    content: {
      text: xml
    },
    position: {
      my: 'center left',
      at:  'center right'
    },
    show: {
      event: 'showTooltip'+ele.id()
    },
    hide: {
      event: 'click',
      target: closeQtip 
    },
    events: {
      visible: (event, api) => {
        if (codeMirror) {
          codeMirror.refresh();
        }
      },
      hide: () => {
        removeCodeMirror();
      }
    },
    style: {
      classes: 'qtip-dark qtip-rounded'
    }
  });

  ele.emit('showTooltip'+ele.id());

}


/**
 * Adds a new action node to the Cytoscape instance.
 *
 * @param {Object} cy - The Cytoscape instance to which the node will be added.
 * @param {string} label - The label and ID of the node to be added.
 * @param {number} y - The y-coordinate position where the node will be placed.
 * @returns {Promise<void>} A promise that resolves when the node has been added and styled.
 */
async function addNode(cy, label, value, pos, type, image) {

  const position = {};
  if (pos === 'x') {
    position.x = value,
    position.y = 25
  } else {
    position.x = 40,
    position.y = value
  }

  const s = cy.add({
    group: 'nodes',    
    data: { id: label, label: label },
    position: position
  });
  const style = {
    'background-image': image,
    'label': label !== 'status-cron' ? s.data('label') : 'not exist',
    'border-width': label !== 'save' ? 2 : 4,
  }
  s.style (style)
  .lock()
  .on('tap', async evt => {
    if (type === 'action') {
      await addFlowNode(evt.target.data('id'));
    } else if (type === 'cmd') {
      if (label === 'copy') {
        copyForm(evt.target);
      } else {
        cmdNode(evt.target.data('id'));
      }
    } else if (type === 'scene') {
      const result = await confirmRefresh(true);
      if (result) {
        selectScenario(evt.target);
        addExistingFlowScenario(evt.target.data('id'));
        addCronStatusInfos();
        unselectNodes();
        unblinkSave();
      }
    } else if (type === 'cronInfos') {
      manageCron();
    }
  });

}


async function copyForm (s) {

    const visibleNodes = CytoscapeElement.getVisibleNodes();
    const visibleEdges = CytoscapeElement.getVisibleEdges();
    const nodesClassification = classifyNodesByEdges(visibleNodes, visibleEdges);

    const scenarioToCopy = CytoscapeElement.getElementBytype('start');

    if (Object.keys(nodesClassification).length === 0 
    || !scenarioToCopy 
    || !scenarioToCopy.options.data.infos?.scenario ) 
    {
      notification(await Lget("scenario.editExisting"), true);
      return;
    } else {
      element = cyFlow.elements().filter((ele) => {
        return ele.data('label') === scenarioToCopy.options.data.infos.scenario;
      });

      if (element.length === 0) {
        notification(await Lget("scenario.editMustExisting"), true);
        return;
      }
    }

    if (nodeModified) {
      notification(await Lget("scenario.editMustSaved"), true);
      return;
    }

    const handler = (e) => {
      window.removeEventListener('showTooltip'+s.id(), handler, false);
    }
    window.addEventListener('showTooltip'+s.id(), handler, false);

    $('#body').find("div[id*='qtip-cy-qtip-target']").css("display", "none");

    resetForm (s, 'copy');

    s.qtip({
      overwrite: true, 
      content: {
        text: $('#copy-infos')
      },
      position: {
        my: 'center left',
        at:  'center right'
      },
      show: {
        event: 'showTooltip'+s.id()
      },
      hide: {
        event: 'click',
        target: $('#close-copy') 
      },
      style: {
        classes: 'qtip-dark qtip-rounded'
      }
    });
  
    s.emit('showTooltip'+s.id());

}


async function getExistingScenario (name) {
  for (const key of Object.keys(scenarioInfos.scenarios)) {
    if (key === name) {
      return scenarioInfos.scenarios[key];
    }
  }
  return [];
}


async function addExistingFlowScenario (eleId) {

  CytoscapeElement.removeAll();

  const scenario = await getExistingScenario(eleId);

  for (let i in scenario) {
    if (!CytoscapeElement.getElementById(scenario[i].id)) {
      await addExistingFlowNode(scenario[i]);
    }
    if (scenario[i].idParent) {
      addEdge(scenario[i].idParent, scenario[i].id);
    }
  }

}


async function restartCronJob() {

  const calendar = CytoscapeElement.getSelectedElementByType('calendar');
  if (!calendar) {
    notification(await Lget("scenario.restartNoCalendar"), true);
    return;
  }

  const scenario = cyFlow.$(':selected').first().style('label');
  try {
    const result = await window.electronAPI.restartCronJob(calendar.options.data.id);
    if (result) {
      notification (await Lget("scenario.restartJob", scenario, calendar.options.data.id));
    } else {
      notification (await Lget("scenario.alreadyStartedJob", scenario, calendar.options.data.id), true);
    }
    addCronStatusInfos(calendar.options.data.id);
  } catch (err) {
    notification (await Lget("scenario.restartJobError", scenario, calendar.options.data.id) + " " + err, true);
  }

}


async function stopCronJob() {

  const calendar = CytoscapeElement.getSelectedElementByType('calendar');
  if (!calendar) {
    notification(await Lget("scenario.noCalendarJobError", scenario, calendar.options.data.id), true);
    return;
  }

  const scenario = cyFlow.$(':selected').first().style('label');
  try {
    const result = await window.electronAPI.stopCronJob(calendar.options.data.id);
    if (result) {
      notification (await Lget("scenario.stopJob", scenario, calendar.options.data.id));
    } else {
      notification (await Lget("scenario.jobAlreadyStopped", scenario, calendar.options.data.id), true);
    }
    addCronStatusInfos(calendar.options.data.id);
  } catch (err) {
    notification (await Lget("scenario.stopJobError", scenario, calendar.options.data.id) + " " + err, true);
  }

}


async function startCronJob() {

  const calendar = CytoscapeElement.getSelectedElementByType('calendar');
  if (!calendar) {
    notification(await Lget("scenario.startNoCalendar"), true);
    return;
  }

  const scenario = cyFlow.$(':selected').first().style('label');
  if (!scenario) {
    notification(await Lget("scenario.noSelectedScenario"), true);
    return;
  } 

  try {
    const result = await window.electronAPI.startCronJob({scenario: scenario, calendarId: calendar.options.data.id});
    if (result) {
      notification (await Lget("scenario.jobStartedDone", scenario, calendar.options.data.id));
      addCronStatusInfos(calendar.options.data.id);
    }
  } catch (err) {
    notification (await Lget("scenario.startingJobError") + " " + err, true);
  }

}


async function manageCron() {

  if (nodeModified) {
    notification(await Lget("scenario.statusError"), true);
    return;
  }

  let status = getCronStatusInfos();
  switch (status) {
    case 'not exist':
      const calendars = CytoscapeElement.getElementsByType("calendar");
      if (calendars.length === 0) {
        notification(await Lget("scenario.statusNoJobError"), true);
        return;
      }
      
      let found = false;
      let emptyInfos = false;
      let onlyRule = false;

      calendars.forEach(ele => {
        if (ele.element.selected()) {
          if (Object.keys(ele.element.data('infos')).length === 0) {
            emptyInfos = true;
          } else if (!ele.element.data('infos')?.cron?.active){
            onlyRule = true;
          }
          found = true;
        }
      });

      if (onlyRule) {
        notification(await Lget("scenario.statusCalendarError"), true);
        return;
      }

      const selected = cyFlow.$(':selected').first().style('label');

      if (!found && !emptyInfos && selected) {
        notification(await Lget("scenario.statusSelectCalendarError"), true);
      } else if ((!found && !emptyInfos && !selected)
      || (found && emptyInfos && !selected)) {
        notification(await Lget("scenario.statusCreateError"), true);
      } else {
        startCronJob();
      }
      break;
    case 'not started':
      startCronJob();
      break;
    case 'started':
      stopCronJob();
      break;
    case 'stopped':
      restartCronJob();
      break;
  } 
}


function getCronStatusInfos() {
  const ele = cyCronInfos.$(`[label="status-cron"]`);
  return ele.style('label');
}



async function addCronStatusInfos(scenarioId) {

  const ele = cyCronInfos.$(`[label="status-cron"]`);
  let style = {
    'background-image': `url('../images/icons/white.png')`,
    'label': 'not exist'
  }

  let lastDate = "Last: N/A";
  let nextDate = "Next: N/A";

  if (scenarioId) {
    const calendar = CytoscapeElement.getElementById(scenarioId);

    if (calendar) {
      var foundNode = selectedNodes.find(n => n.id() === calendar.element.id());
    }  

    if (calendar && foundNode && calendar.options.data.infos?.cron?.active) {
      const result = await window.electronAPI.getJobInfo(scenarioId);

      if (result.exists) {

        lastDate = "Last: " + (result.lastDate ? result.lastDate : "N/A");
        nextDate = "Next: " + (result.nextDate ? result.nextDate : "N/A");

        switch (result.status) {
          case 'active':
            style = {
              'background-image': `url('../images/icons/green.png')`,
              'label': 'started'
            }
            break;
          case 'stopped':
              style = {
                'background-image': `url('../images/icons/oranges.png')`,
                'label': 'stopped'
              }
              nextDate = "Next: N/A";
              break;  
        }
      } else {
        style = {
          'background-image': `url('../images/icons/red.png')`,
          'label': 'not started'
        }
      }
    } 
  } 

  ele.style (style);
  document.getElementById('last-date').innerHTML = lastDate;  
  document.getElementById('next-date').innerHTML = nextDate;
  
}


async function addExistingFlowNode (info) {

  const options = {
    group: 'nodes',    
    data: { 
      id: info.id,
      type: info.Type,
      infos: info.infos
    },
    position: info.node
  };

  let label;
  switch (info.Type) {
    case 'start': 
      label = info.infos.scenario;
      break;
    case 'calendar':
      if (info.infos?.cron?.active && info.infos?.rule?.active) {
        label = await Lget("scenario.programAndRule");
      } else if (info.infos?.rule?.active) {
        label = await Lget("scenario.ruleOnly");
      } else if (info.infos?.cron?.active) {
        label = await Lget("scenario.programOnly");
      }
      break;
    case 'action': 
      label = info.infos.name;
      break;
    case 'timer': 
      label = info.infos.timer;
      break;
    case 'speak': 
      label = info.infos.tts;
      break;
    case 'payload': 
      label = info.infos.payload;
      break;
    case 'javascript': 
      label = info.infos.code.includes("function") ? info.infos.code.match(/function\s+([^(]+\([^)]*\))/)[1] : "No function";
      break;
    case 'module':
      label = info.infos.name;
      break;
  } 

  const elem = new CytoscapeElement(options);
  const s = elem.create();
  const style = {
    'background-image': `url('../images/icons/${info.Type}.png')`,
    'label': label
  }
  s.style (style)
  .on('tap', async evt => {
    await processNode(evt.target);
    if (info.Type === 'calendar') {
      addCronStatusInfos(evt.target.id());
    }
  })
  .on('dbltap', evt => {
      defineAction(evt.target);
      selectedNode = evt.target.id();
  });
  
}


async function cmdNode(eleId) {

  switch (eleId) {
    case 'save': 
      saveScenario();
      break;
    case 'new': {
      const result = await confirmRefresh(true);
      if (result) {
        unselectScenario();
        CytoscapeElement.removeAll();
        addCronStatusInfos();
        unblinkSave();
      }
      break;
    }
    case 'delete': {
      deleteScenario();
      unblinkSave();
      break;
    }
  }

}


function getNodesClassification() {
  const visibleNodes = CytoscapeElement.getVisibleNodes();
  const visibleEdges = CytoscapeElement.getVisibleEdges();
  const nodesClassification = classifyNodesByEdges(visibleNodes, visibleEdges);

  if (Object.keys(nodesClassification).length === 0) {
    return;
  }

  return getFlattenedStructure(nodesClassification);
}


async function confirmRefresh(flag) {
 
  const flattenedStructure = getNodesClassification();
  if (!flattenedStructure) return flag;

  for (const item of flattenedStructure) {
    if (Object.keys(item.infos).length === 0) {
      return await window.electronAPI.confirmRefresh();
    }
  }

  if (!nodeModified) {
    return flag || true;
  } else {
    const result = await window.electronAPI.confirmRefresh();
    if (result) {
      nodeModified = false;
    } 
    return result;
  }

}



function deleteScenario() {

  const flattenedStructure = getNodesClassification();
  if (!flattenedStructure) return;

  flattenedStructure.forEach(async item => {
    if (item.Type === "start" && item.infos && item.infos?.scenario) {
      let found;
      for (const key of Object.keys(scenarioInfos.scenarios)) {
        if (key === item.infos.scenario) {
          try {
            const result = await window.electronAPI.removeScenario({name: item.infos.scenario, id: item.id});
            if (result) {
              // Suppression du workflow
              CytoscapeElement.removeAll();

              // Suppression du scénario dans la liste des scénarios existants
              cyFlow.remove('node');
              delete scenarioInfos.scenarios[item.infos.scenario];   
              // Rafraichissement de la liste 
              addExistingScenarios(scenarioInfos.scenarios);

              // Remise à zéro des infos cron
              addCronStatusInfos();

              notification(await Lget("scenario.trash", item.infos.scenario));
            }
          } catch (err) {
            notification(await Lget("scenario.trashError", item.infos.scenario) + " " + err, true);
          }
          found = true;
          break;
        }
      }
      if (!found) {
        notification(await Lget("scenario.refreshIdEditor", item.infos.scenario));
      }
    } else if (item.Type === "start") {
      notification(await Lget("scenario.refreshEditor"));
    }
  })

}


/**
 * This function initializes a cytoscape flow with specified dimensions and 
 * adds nodes representing different actions at specified positions.
 * 
 * @async
 * @function addAction
 * @returns {Promise<void>} A promise that resolves when all action nodes have been added.
 */
async function addActions() {
  const cyFlow = await setCY ($('#cy-actions-flow'), {height: 30, width: 30});
  await addNode(cyFlow, 'start', 25, 'x', 'action', "url('../images/icons/start.png')");
  await addNode(cyFlow, 'action', 80, 'x', 'action', "url('../images/icons/action.png')");
  await addNode(cyFlow, 'javascript', 135, 'x', 'action', "url('../images/icons/javascript.png')");
  await addNode(cyFlow, 'payload', 190, 'x', 'action', "url('../images/icons/payload.png')");
  await addNode(cyFlow, 'module', 245, 'x', 'action', "url('../images/icons/module.png')");
  await addNode(cyFlow, 'speak', 300, 'x', 'action', "url('../images/icons/speak.png')");
  await addNode(cyFlow, 'timer', 355, 'x', 'action', "url('../images/icons/timer.png')");
  await addNode(cyFlow, 'end', 410, 'x', 'action', "url('../images/icons/end.png')");
}

async function addCommands() {
  cyCommands = await setCY ($('#cy-commands'), {height: 30, width: 30});
  await addNode(cyCommands, 'new', 25, 'x', 'cmd', "url('../images/icons/new.png')");
  await addNode(cyCommands, 'save', 70, 'x', 'cmd', "url('../images/icons/saveScenario.png')");
  await addNode(cyCommands, 'copy', 115, 'x', 'cmd', "url('../images/icons/copy.png')");
  await addNode(cyCommands, 'delete', 160, 'x', 'cmd', "url('../images/icons/delete.png')");
}

async function addCronInfos() {

  cyCronInfos = await setCY ($('#cy-cron-infos'), {height: 30, width: 30});
  await addNode(cyCronInfos, 'status-cron', 35, 'x', 'cronInfos', "url('../images/icons/white.png')");

  document.getElementById('last-date').innerHTML = "Last: N/A";  
  document.getElementById('next-date').innerHTML = "Next: N/A";

}


async function addExistingScenarios(scenarios) {

  cyFlow = await setCY ($('#cy-scenarios'), {height: 40, width: 40});
  const scenariosDiv = document.getElementById('cy-scenarios');
  let height = 0;
  let pos = 35;

  for (const key of Object.keys(scenarios)) {
    scenariosDiv.style.height = `${height}px`;
    await addNode(cyFlow, `${key}`, pos, 'y', "scene", "url('../images/icons/scenario.png')");
    pos += 80;
    height += 80;
  };

  height += 20;
  scenariosDiv.style.height = `${height}px`;
}


document.getElementById("new-name-copy").addEventListener("beforevalidate", async (event) => {
  event.preventDefault();

  if (document.getElementById("new-name-copy").empty === true) {
    document.getElementById("new-name-copy").setCustomValidity(await Lget("scenario.newScenarioNoName"));
  } else {
    document.getElementById("new-name-copy").setCustomValidity("");
  }
});



document.getElementById("inputsecondes").addEventListener("beforevalidate", async (event) => {
  event.preventDefault();

  if (document.getElementById("inputsecondes").empty === true) {
    document.getElementById("inputsecondes").setCustomValidity(await Lget("scenario.newScenarioNoseconds"));
  } else {
    const result = await validateCron();
    if (!result) {
      document.getElementById("txtCron").innerHTML = await Lget("scenario.noValid");
      document.getElementById("txtCron").style.color = "red";
    } else {
      const txt = generateCronDescription();
      if (txt) {
        document.getElementById("txtCron").innerHTML = txt;
        document.getElementById("txtCron").style.color = "";
      }
    }
    document.getElementById("inputsecondes").setCustomValidity("");
  }
});


document.getElementById("inputminutes").addEventListener("beforevalidate", async (event) => {
  event.preventDefault();

  if (document.getElementById("inputminutes").empty === true) {
    document.getElementById("inputminutes").setCustomValidity(await Lget("scenario.newScenarioNominutes"));
  } else {
    const result = await validateCron();
    if (!result) {
      document.getElementById("txtCron").innerHTML = await Lget("scenario.noValid");
      document.getElementById("txtCron").style.color = "red";
    } else {
      const txt = generateCronDescription();
      if (txt) {
        document.getElementById("txtCron").innerHTML = txt;
        document.getElementById("txtCron").style.color = "";
      }
    }
    document.getElementById("inputminutes").setCustomValidity("");
  }
});


document.getElementById("inputhours").addEventListener("beforevalidate", async (event) => {
  event.preventDefault();

  if (document.getElementById("inputhours").empty === true) {
    document.getElementById("inputhours").setCustomValidity(await Lget("scenario.newScenarioNoHours"));
  } else {
    const result = await validateCron();
    if (!result) {
      document.getElementById("txtCron").innerHTML = await Lget("scenario.noValid");
      document.getElementById("txtCron").style.color = "red";
    } else {
      const txt = generateCronDescription();
      if (txt) {
        document.getElementById("txtCron").innerHTML = txt;
        document.getElementById("txtCron").style.color = "";
      }
    }
    document.getElementById("inputhours").setCustomValidity("");
  }
});


document.getElementById("inputmonthdays").addEventListener("beforevalidate", async (event) => {
  event.preventDefault();

  if (document.getElementById("inputmonthdays").empty === true) {
    document.getElementById("inputmonthdays").setCustomValidity(await Lget("scenario.newScenarioNoDayMonth"));
  } else {
    const result = await validateCron();
    if (!result) {
      document.getElementById("txtCron").innerHTML = await Lget("scenario.noValid");
      document.getElementById("txtCron").style.color = "red";
    } else {
      const txt = generateCronDescription();
      if (txt) {
        document.getElementById("txtCron").innerHTML = txt;
        document.getElementById("txtCron").style.color = "";
      }
    }
    document.getElementById("inputmonthdays").setCustomValidity("");
  }
});


document.getElementById("inputmonths").addEventListener("beforevalidate", async (event) => {
  event.preventDefault();

  if (document.getElementById("inputmonths").empty === true) {
    document.getElementById("inputmonths").setCustomValidity(await Lget("scenario.newScenarioNoMonth"));
  } else {
    const result = await validateCron();
    if (!result) {
      document.getElementById("txtCron").innerHTML = await Lget("scenario.noValid");
      document.getElementById("txtCron").style.color = "red";
    } else {
      const txt = generateCronDescription();
      if (txt) {
        document.getElementById("txtCron").innerHTML = txt;
        document.getElementById("txtCron").style.color = "";
      }
    }
    document.getElementById("inputmonths").setCustomValidity("");
  }
});


document.getElementById("inputweekdays").addEventListener("beforevalidate", async (event) => {
  event.preventDefault();

  if (document.getElementById("inputweekdays").empty === true) {
    document.getElementById("inputweekdays").setCustomValidity(await Lget("scenario.newScenarioNoDayWeek"));
  } else {
    const result = await validateCron();
    if (!result) {
      document.getElementById("txtCron").innerHTML = await Lget("scenario.noValid");
      document.getElementById("txtCron").style.color = "red";
    } else {
      const txt = generateCronDescription();
      if (txt) {
        document.getElementById("txtCron").innerHTML = txt;
        document.getElementById("txtCron").style.color = "";
      }
    }
    document.getElementById("inputweekdays").setCustomValidity("");
  }
});


document.getElementById("translate").addEventListener("click", async (event) => {
  await window.electronAPI.translate();
})


document.getElementById('translate').addEventListener('mouseover', async (event) => {

  $('#translate').qtip({
    overwrite: false, 
    content: {text: await Lget("pluginStudioMenu.translate")},
    position: {
      my: 'center left',
      at:  'center right',
    },
    show: {
        event: event.type, 
        ready: true 
    },
    style: {
      classes: "qtip-red qtip-rounded",
      tip: {
        width: 8,
        height: 8
      }
    }
  }, event);
})



document.getElementById("remove-edge").addEventListener("click", async (event) => {
  if ( selectedEdge ) {
    selectedEdge.remove();
    selectedEdge = null;
  }
})

document.getElementById("execution-cron").addEventListener("click", async (event) => {

  document.getElementById('schedule').disabled = document.getElementById("execution-cron").toggled;

})


document.getElementById("execution-rule").addEventListener("click", async (event) => {

  document.getElementById('rule').disabled = document.getElementById("execution-rule").toggled;
})



document.getElementById("apply-scenario").addEventListener("click", async (event) => {
  
  const name = document.getElementById("scenario").value;
  
  if (!name) {
    notification (await Lget("scenario.noName"), true);
    return;
  }

  for (const key of Object.keys(scenarioInfos.scenarios)) {
    if (key === name) {
        notification (await Lget("scenario.nameAlreadyExist"), true);
        return;
    }
  }

  const ele = CytoscapeElement.getElementById(selectedNode).element;
  ele.data('infos', {
    scenario: name
  })
  ele.style('label', name);

  // set nodeModified to verify if the scenario is saved
  nodeModified = true;
  blinkSave();

  notification(await Lget("scenario.nameSaved"));

});


document.getElementById("apply-timer").addEventListener("click", async (event) => {

  const ele = CytoscapeElement.getElementById(selectedNode).element;
  const timer = document.getElementById("timer").value;

  let infos = ele.data('infos');
  infos = {
    timer: timer
  };
  ele.data('infos', infos);
  ele.style('label', `${timer} sec`);

  // set nodeModified to verify if the scenario is saved
  nodeModified = true;
  blinkSave();

  notification(await Lget("scenario.timerSaved"));

})


document.getElementById("test-speak").addEventListener("click", async (event) => {

  let client;
  const tts = document.getElementById("speak").value;
  if (tts === "") {
    notification(await Lget("scenario.ttsError"), true);
    return;
  }

  const elemClient = document.getElementById('menu-clientToSpeak');
  for (let i in elemClient.childNodes) {
    if (elemClient.childNodes[i].toggled === true) {
      if (elemClient.childNodes[i].value === 'choose-client') {
        notification(await Lget("scenario.ttsNoClientError"), true);
        return;
      }
      client = elemClient.childNodes[i].value;
      break;
    } 
  }

  const infos = {
    tts: tts,
    client: client
  }

  try {
    await window.electronAPI.testSpeak(infos);
    notification (await Lget("scenario.testDone"));
  } catch (err) {
    notification (err, true);
  }

})


document.getElementById("apply-speak").addEventListener("click", async (event) => {

  let client;
  const ele = CytoscapeElement.getElementById(selectedNode).element;

  const tts = document.getElementById("speak").value;
  if (tts === "") {
    notification(await Lget("scenario.ttsError"), true);
    return;
  }

  const elemClient = document.getElementById('menu-clientToSpeak');
  for (let i in elemClient.childNodes) {
    if (elemClient.childNodes[i].toggled === true) {
      if (elemClient.childNodes[i].value === 'choose-client') {
        notification(await Lget("scenario.ttsNoClientError"), true);
        return;
      }
      client = elemClient.childNodes[i].value;
      break;
    } 
  }

  const end = document.getElementById("end-speak").toggled;
  const wait = document.getElementById("wait-speak").toggled;
  
  let infos = ele.data('infos');
  infos = {
    tts: tts,
    client: client, 
    end: end,
    wait: wait
  };
  ele.data('infos', infos);
  ele.style('label', `${tts}`);

  // set nodeModified to verify if the scenario is saved
  nodeModified = true;
  blinkSave();
  
  notification(await Lget("scenario.ttsSaved"));

})

document.getElementById("remove-module").addEventListener("click", async (event) => {
  const elem = CytoscapeElement.getElementById(selectedNode);
  elem.hide();
  blinkSave();
})

document.getElementById("remove-javascript").addEventListener("click", async (event) => {
  const elem = CytoscapeElement.getElementById(selectedNode);
  elem.hide();
  blinkSave();
})

document.getElementById("remove-task").addEventListener("click", async (event) => {
  const elem = CytoscapeElement.getElementById(selectedNode);
  elem.hide();
  blinkSave();
})

document.getElementById("remove-timer").addEventListener("click", async (event) => {
  const elem = CytoscapeElement.getElementById(selectedNode);
  elem.hide();
  blinkSave();
})

document.getElementById("remove-payload").addEventListener("click", async (event) => {
  const elem = CytoscapeElement.getElementById(selectedNode);
  elem.hide();
  blinkSave();
})

document.getElementById("remove-speak").addEventListener("click", async (event) => {
  const elem = CytoscapeElement.getElementById(selectedNode);
  elem.hide();
  blinkSave();
})

document.getElementById("remove-calendar").addEventListener("click", async (event) => {
  const elem = CytoscapeElement.getElementById(selectedNode);
  elem.hide();
  blinkSave();
})

document.getElementById("remove-end").addEventListener("click", async (event) => {
  const elem = CytoscapeElement.getElementById(selectedNode);
  elem.hide();
  blinkSave();
})

document.getElementById("test-task").addEventListener("click", async (event) => {

  var plugin, parameters, toClient, clientFrom;

  let clientFromSel = document.getElementById('clientFrom');
  for (let i in clientFromSel.childNodes) {
    if (clientFromSel.childNodes[i].toggled === true) {
      if (clientFromSel.childNodes[i].value === 'choose-client') {
        notification(await Lget("scenario.testActionError"), true);
        return;
      }
      clientFrom = clientFromSel.childNodes[i].value;
      break;
    } 
  }

  clientFromSel = document.getElementById('clientTo');
  for (let i in clientFromSel.childNodes) {
    if (clientFromSel.childNodes[i].toggled === true) {
      if (clientFromSel.childNodes[i].value !== 'choose-client') {
        toClient = clientFromSel.childNodes[i].value;
        break;
      }
    } 
  }

  clientFromSel = document.getElementById('plugin');
  for (let i in clientFromSel.childNodes) {
    if (clientFromSel.childNodes[i].toggled === true) {
      if (clientFromSel.childNodes[i].value === 'choose-plugin') {
        notification(await Lget("scenario.testActionNoPluginError"), true);
        return;
      }
      plugin = clientFromSel.childNodes[i].id;
      break;
    }
  }

  if (codeMirror) {
    parameters = codeMirror.getValue();
    if (parameters.includes("<action to call>")) {
      notification(await Lget("scenario.testActionNoCommandError"), true);
      return;
    }
    if (parameters.includes("<language used (e.g. en)>")) {
      notification(await Lget("scenario.testActionNoLanguageError"), true);
      return;
    }
    if (!parameters.includes("language")) {
      notification(await Lget("scenario.testLanguageEmptyError"), true);
      return;
    }
  } else {
    notification(await Lget("scenario.testTaskEmptyError"), true);
    return;
  }

  const infos = {
    plugin: plugin,
    parameters: parameters,
    toClient: toClient || clientFrom,
  }

  try {
    await window.electronAPI.testTask(infos);
    notification (await Lget("scenario.resultTestTask"));
  } catch (err) {
    notification (err, true);
  }
})


document.getElementById("apply-payload").addEventListener("click", async (event) => {

  const payload = document.getElementById("payload").value;
  if (payload === "") {
    notification(await Lget("scenario.payloadError"), true);
    return;
  }

  const ele = CytoscapeElement.getElementById(selectedNode).element;

  let infos = ele.data('infos');
  infos = {
    payload: payload
  };

  ele.data('infos', infos);
  ele.style('label', `${payload}`);
  
  // set nodeModified to verify if the scenario is saved
  nodeModified = true;
  blinkSave();

  notification(await Lget("scenario.payloadSaved"));


})


document.getElementById("apply-module").addEventListener("click", async (event) => {

  let code;

  const name = document.getElementById("module-name").value;
  if (name === "") {
    notification(await Lget("scenario.moduleNameError"), true);
    return;
  }

  if (codeMirror) {
    code = codeMirror.getValue();
    if (!code.includes("export async function action(payload, state)")) {
      notification(await Lget("scenario.moduleActionError"), true);
      return;
    }
  } else {
    notification(await Lget("scenario.moduleNoParametersError"), true);
    return;
  }

  const ele = CytoscapeElement.getElementById(selectedNode).element;
  let infos = ele.data('infos');
  infos = {
    name: name,
    code: code
  };

  ele.data('infos', infos);
  ele.style('label', `${name}`);
  
  // set nodeModified to verify if the scenario is saved
  nodeModified = true;
  blinkSave();

  notification(await Lget("scenario.moduleSaved"));
})


document.getElementById("apply-javascript").addEventListener("click", async (event) => {

  let code, label;

  if (codeMirror) {
    code = codeMirror.getValue();
    if (!code.includes("function")) {
      notification(await Lget("scenario.jsError"), true);
      return;
    }

    if (code.includes("my_function")) {
      notification(await Lget("scenario.jsNameError"), true);
      return;
    }

    const doc = codeMirror.getDoc();
    const lineCount = doc.lineCount();

    for (let i = lineCount - 1; i >= 0; i--) {
      const lineContent = doc.getLine(i);
      if (lineContent.includes("function")) {
        label = lineContent.match(/function\s+([^(]+\([^)]*\))/)[1];
        break;
      }
    }
  } else {
    notification(await Lget("scenario.testTaskEmptyError"), true);
    return;
  }

  const ele = CytoscapeElement.getElementById(selectedNode).element;
  let infos = ele.data('infos');
  infos = {
    code: code
  };

  ele.data('infos', infos);
  ele.style('label', `${label}`);
  
  // set nodeModified to verify if the scenario is saved
  nodeModified = true;
  blinkSave();

  notification(await Lget("scenario.jsSaved"));
})


document.getElementById("apply-copy").addEventListener("click", async (event) => {
  copyScenario();
})


document.getElementById("apply-task").addEventListener("click", async (event) => {
  
  let clientFrom, clientTo = "", pluginName, pluginId, parameters;

  const ele = CytoscapeElement.getElementById(selectedNode).element;
  const eleId = ele.id();

  const taskName = document.getElementById("action").value;
  if (taskName === "") {
    notification(await Lget("scenario.taskNameError"), true);
    return;
  }

  const elems = CytoscapeElement.getElementsByType('action');
  let found = false;
  elems.forEach(ele => {
    const eleInfos = ele.element.data('infos');
    if (eleInfos?.name === taskName && eleId !== ele.element.id()) found = true;
  })

  if (found) {
    notification(await Lget("scenario.taskNameExistError", taskName), true);
    return;
  }

  let items = document.getElementsByClassName("clientFrom");
  for (let i = 0; i < items.length; i++) {
      if (items[i].toggled) {
        clientFrom = items[i].value;
        break;
      }
  }
  if (clientFrom === 'choose-client') {
    notification(await Lget("scenario.taskNoClientError"), true);
    return;
  }

  items = document.getElementsByClassName("clientTo");
  for (let i = 0; i < items.length; i++) {
      if (items[i].toggled && items[i].value !== 'choose-client') {
        clientTo = items[i].value;
        break;
      }
  }

  items = document.getElementsByClassName("plugin");
  for (let i = 0; i < items.length; i++) {
      if (items[i].toggled) {
        pluginName = items[i].value;
        pluginId = items[i].id;
        break;
      }
  }
  if (pluginName === 'choose-plugin') {
    notification(await Lget("scenario.taskSelectPluginError"), true);
    return;
  }

  if (codeMirror) {
    parameters = codeMirror.getValue();
    if (parameters.includes("<action to call>")) {
      notification(await Lget("scenario.testActionNoCommandError"), true);
      return;
    }
    if (parameters.includes("<language used (e.g. en)>")) {
      notification(await Lget("scenario.testActionNoLanguageError"), true);
      return;
    }
    if (!parameters.includes("language")) {
      notification(await Lget("scenario.testLanguageEmptyError"), true);
      return;
    }
  } else {
    notification(await Lget("scenario.testTaskEmptyError"), true);
    return;
  }

  const wait = document.getElementById("wait-action").toggled;

  let infos = ele.data('infos');
  infos = {
    name: taskName,
    clientFrom: clientFrom, 
    clientTo: clientTo, 
    pluginName: pluginName, 
    pluginId: pluginId,
    wait: wait,
    parameters: parameters
  };
  ele.data('infos', infos);
  ele.style('label', `${taskName}`);

  // set nodeModified to verify if the scenario is saved
  nodeModified = true;
  blinkSave();
  
  notification(await Lget("scenario.taskSaved", taskName));

})

document.getElementById("enable-execution-cron").addEventListener("click", async (event) => {
  restartApp = true;
})


document.getElementById("enable-execution-rule").addEventListener("click", async (event) => {
  restartApp = true;
})


document.getElementById("apply-calendar").addEventListener("click", async (event) => {

  let cron = "", rule;
  const byCron = document.getElementById("execution-cron").toggled; 
  const byRule = document.getElementById("execution-rule").toggled; 
  const cronEnabled = document.getElementById("enable-execution-cron").toggled;
  const ruleEnabled = document.getElementById("enable-execution-rule").toggled;

  if (!document.getElementById("execution-cron").toggled && !document.getElementById("execution-rule").toggled) {
    notification (await Lget("scenario.selectCalendarExec"), true);
    return;
  }

  if (byCron) {
    const result = await validateCron();
    if (!result) {
      notification (await Lget("scenario.ExecTimerError"), true);
      return;
    }

    const sec = document.getElementById("inputsecondes").value;
    const min = document.getElementById("inputminutes").value;
    const hr = document.getElementById("inputhours").value;
    const daymonth = document.getElementById("inputmonthdays").value;
    const month = document.getElementById("inputmonths").value;
    const dayweek = document.getElementById("inputweekdays").value;

    cron = sec + " " + min + " " + hr + " " + daymonth + " " + month + " " + dayweek;
  }

  if (byRule) {
    if (jsonEditorRules) {
      rule = jsonEditorRules.get();
    }

    if (rule.length === 0) {
      notification (await Lget("scenario.noRuleError"), true);
      return;
    }
  }

  const ele = CytoscapeElement.getElementById(selectedNode).element;
  let infos = ele.data('infos');
  infos = { 
    cron: {
      active: byCron,
      enabled: cronEnabled,
      value: cron
    },
    rule: {
      active: byRule,
      enabled: ruleEnabled,
      value: rule
    }
  };
  ele.data('infos', infos);

  let label;
  if (byCron && byRule) {
    label = await Lget("scenario.programAndRule");
  } else if (byRule) {
    label = await Lget("scenario.ruleOnly");
  } else if (byCron) {
    label = await Lget("scenario.programOnly");
  } else {
    label = `?`;
  }
  ele.style('label', `${label}`);

  // set nodeModified to verify if the scenario is saved
  nodeModified = true;
  blinkSave();

  notification(await Lget("scenario.programSaved"));
})


function generateCronDescription(seconde, minute, hour, mtdays, mt, daywk) {

  const sec = seconde || document.getElementById("inputsecondes").value;
  const min = minute || document.getElementById("inputminutes").value;
  const hr = hour || document.getElementById("inputhours").value;
  const daymonth = mtdays || document.getElementById("inputmonthdays").value;
  const month = mt || document.getElementById("inputmonths").value;
  const dayweek = daywk || document.getElementById("inputweekdays").value;

  // Détection de l'heure fixe (toutes valeurs numériques)
  const isFixedTime = /^\d+$/.test(sec) && /^\d+$/.test(min) && /^\d+$/.test(hr);
  let timeDesc;
  if (isFixedTime) {
    // Format hh:mm:ss avec padding à 2 chiffres
    const s = sec.padStart(2, "0");
    const m = min.padStart(2, "0");
    const h = hr.padStart(2, "0");
    timeDesc = `At ${h}:${m}:${s}`;
  } else {
    // Description détaillée pour chaque champ de temps
    const secDesc = describeField(sec, "second");
    const minDesc = describeField(min, "minute");
    const hrDesc  = describeField(hr, "hour");
    timeDesc = `At ${secDesc} ${minDesc}`;
    if (hr !== "*") {
      timeDesc += ` past ${hrDesc}`;
    }
  }

  // Construction de la partie date
  let description = timeDesc;
  let dayMonthDesc = describeDateField(daymonth, "day-of-month", null);
  const monthDesc    = describeDateField(month, "month", months);
  let dayWeekDesc  = describeDateField(dayweek, "day-of-week", dayOfWeek);

  if (dayMonthDesc) {
    dayMonthDesc = `day-of-month ${dayMonthDesc}`;
    description += ` on ${dayMonthDesc}`;
  }
  if (monthDesc) {
    description += ` in ${monthDesc}`;
  }
  if (dayWeekDesc) {
    // Pour day-of-week, si ce n'est pas une valeur fixe ou déjà préfixée par "every", on ajoute le préfixe.
    if (dayweek !== "*" && !/^every/i.test(dayWeekDesc)) {
      dayWeekDesc = `every day-of-week ${dayWeekDesc}`;
    }
    // Si day-of-month a déjà été affiché, on utilise "and on"
    if (dayMonthDesc || monthDesc) {
      description += ` and on ${dayWeekDesc}`;
    } else {
      description += ` on ${dayWeekDesc}`;
    }
  }

  return description + ".";
}

function describeField(value, unit) {
  // Valeur fixe (entier)
  if (/^\d+$/.test(value)) {
    return `${unit} ${value}`;
  }
  // Format step "*/interval"
  const stepMatch = value.match(/^\*\/(\d+)$/);
  if (stepMatch) {
    const n = stepMatch[1];
    return `every ${ordinal(n)} ${unit}`;
  }
  // Joker "*"
  if (value === "*") {
    return `every ${unit}`;
  }
  // Autres formats (liste, range) affichés tels quels
  return `${unit} ${value}`;
}

function describeDateField(value, unit, mapping) {
  if (value === "*") return null;

  // Valeur fixe
  if (/^\d+$/.test(value)) {
    if (mapping) {
      let num = parseInt(value, 10);
      return mapping[num - 1];
    }
    return value;
  }
  // Format step "*/interval"
  const stepMatch = value.match(/^\*\/(\d+)$/);
  if (stepMatch) {
    const n = stepMatch[1];
    return `every ${ordinal(n)} ${unit}`;
  }
  // Format range "a-b"
  const rangeMatch = value.match(/^(\d+)-(\d+)$/);
  if (rangeMatch) {
    let start = rangeMatch[1];
    let end = rangeMatch[2];
    if (mapping) {
      start = mapping[parseInt(start, 10) - 1];
      end = mapping[parseInt(end, 10) - 1];
      return `from ${start} through ${end}`;
    }
    return `from ${rangeMatch[1]} through ${rangeMatch[2]}`;
  }
  // Liste séparée par des virgules
  if (value.includes(",")) {
    let parts = value.split(",").map(x => x.trim());
    if (mapping) {
      parts = parts.map(x => mapping[parseInt(x, 10) - 1]);
    }
    return parts.join(", ");
  }
  return value;
}

function ordinal(n) {
  let num = parseInt(n, 10);
  if (num % 100 >= 11 && num % 100 <= 13) {
    return num + "th";
  }
  switch (num % 10) {
    case 1: return num + "st";
    case 2: return num + "nd";
    case 3: return num + "rd";
    default: return num + "th";
  }
}


async function validateCron () {
  const secondes = document.getElementById("inputsecondes").value;
  const minutes = document.getElementById("inputminutes").value;
  const hours = document.getElementById("inputhours").value;
  const mtdays = document.getElementById("inputmonthdays").value;
  const mt = document.getElementById("inputmonths").value;
  const weekdays = document.getElementById("inputweekdays").value;
 
  if (minutes && hours && mtdays && mt && weekdays) {
    if (!validateSecondes(secondes)) {
      return false;
    }
    const cron = minutes + " " + hours + " " + mtdays + " " + mt + " " + weekdays;
    const result = await window.electronAPI.validateCron(cron);
    return result;
  } else {
    return false;
  }
}


function validateSecondes(value) {
  const trimmedValue = value.trim();

  // 1. Vérifier si c'est une liste de valeurs séparées par une virgule
  if (trimmedValue.includes(',')) {
    const parts = trimmedValue.split(',');
    if (parts.length === 0) {
      return false;
    }
    for (let part of parts) {
      part = part.trim();
      // Chaque valeur doit être un entier exact entre 0 et 59
      const number = parseInt(part, 10);
      if (isNaN(number) || number < 0 || number > 59 || number.toString() !== part) {
        return false;
      }
    }
    return true;
  }

  // 2. Vérifier si c'est à chaque seconde
  if (trimmedValue === '*') {
    return true;
  }
  
  // 3. Tester si la valeur peut être convertie en entier et se trouve entre 0 et 59
  const number = parseInt(trimmedValue, 10);
  if (!isNaN(number) && number.toString() === trimmedValue) {
    if (number >= 0 && number <= 59) {
      return true;
    }
  }

  // 4. Vérifier le format "*/interval"
  const stepMatch = trimmedValue.match(/^\*\/(\d+)$/);
  if (stepMatch) {
    const interval = parseInt(stepMatch[1], 10);
    if (interval > 0) {
      return true;
    }
  }

  // 5. Vérifier le format "a-b"
  const rangeMatch = trimmedValue.match(/^(\d+)-(\d+)$/);
  if (rangeMatch) {
    const a = parseInt(rangeMatch[1], 10);
    const b = parseInt(rangeMatch[2], 10);
    if (a >= 0 && a <= 59 && b >= 0 && b <= 59 && a < b) {
      return true;
    }
  }

  // Sinon, la valeur n'est pas valide
  return false;
}


document.getElementById("payload").addEventListener("beforevalidate", async (event) => {
  event.preventDefault();

  if (document.getElementById("payload").empty === true) {
      document.getElementById("payload").setCustomValidity(await Lget("scenario.payloadError"));
  } else {
      document.getElementById("payload").setCustomValidity("");
  }
});


document.getElementById("action").addEventListener("beforevalidate", async (event) => {
  event.preventDefault();

  if (document.getElementById("action").empty === true) {
      document.getElementById("action").setCustomValidity(await Lget("scenario.taskNameError"));
  } else {
      document.getElementById("action").setCustomValidity("");
  }
});


document.getElementById("scenario").addEventListener("beforevalidate", async (event) => {
  event.preventDefault();

  if (document.getElementById("scenario").empty === true) {
      document.getElementById("scenario").setCustomValidity(await Lget("scenario.noName"));
  } else {
      document.getElementById("scenario").setCustomValidity("");
  }
});


document.getElementById("speak").addEventListener("beforevalidate", async (event) => {
  event.preventDefault();

  if (document.getElementById("speak").empty === true) {
      document.getElementById("speak").setCustomValidity(await Lget("scenario.noSpeak"));
  } else {
      document.getElementById("speak").setCustomValidity("");
  }
});


function triggerActionMenu(type, tag, defaultValue) {
  setTimeout(async () => {
    let client;
    let items = document.getElementsByClassName(`${type}`);
    for (let i = 0; i < items.length; i++) {
      if (items[i].toggled) {
        client = items[i].value;
        break;
      }
    }

    if (codeMirror) {
      const doc = codeMirror.getDoc();
      const totalLines = doc.lineCount();

      if (client !== defaultValue) {
        const penultimateLineIndex = totalLines - 2;
        const lastLineIndex = totalLines - 1;

        // Vérifier que la ligne juste avant la dernière se termine par une virgule.
        let penultimateLineContent = doc.getLine(penultimateLineIndex);
        if (!penultimateLineContent.trim().endsWith(",")) {
          doc.replaceRange(
            ",",
            { line: penultimateLineIndex, ch: penultimateLineContent.length },
            { line: penultimateLineIndex, ch: penultimateLineContent.length }
          );
        }

        // Recherche de la ligne contenant le tag.
        let tagLineIndex = -1;
        for (let i = 0; i < totalLines; i++) {
          const lineContent = doc.getLine(i);
          if (lineContent.includes(tag)) {
            tagLineIndex = i;
            break;
          }
        }

        if (tagLineIndex !== -1) {
          // La ligne existe déjà. On récupère son contenu pour savoir si elle se terminait par une virgule.
          let oldLine = doc.getLine(tagLineIndex);
          let hadComma = oldLine.trim().endsWith(",");
          // On reconstruit la ligne en conservant la virgule si elle était présente.
          const newLineText = `  ${tag} "${client}"` + (hadComma ? "," : "");
          doc.replaceRange(
            newLineText,
            { line: tagLineIndex, ch: 0 },
            { line: tagLineIndex, ch: oldLine.length }
          );
        } else {
          // La ligne n'existe pas, on l'insère juste avant la dernière ligne.
          const newLineText = `  ${tag} "${client}"`;
          doc.replaceRange(newLineText + "\n", { line: lastLineIndex, ch: 0 });
        }
      } else {
        // Si la valeur client correspond à defaultValue, on supprime la ligne correspondante.
        const lineCount = doc.lineCount();
        for (let i = lineCount - 1; i >= 0; i--) {
          const lineContent = doc.getLine(i);
          if (lineContent.includes(`${tag}`)) {
            doc.replaceRange("", { line: i, ch: 0 }, { line: i + 1, ch: 0 });
          }
        }
      }

      // Étape finale : vérifier si le dernier paramètre se termine par une virgule et la supprimer.
      const finalLineCount = doc.lineCount();
      if (finalLineCount > 1) {
        const lastParamLineIndex = finalLineCount - 2;
        let lastParamLine = doc.getLine(lastParamLineIndex);
        if (lastParamLine.trim().endsWith(",")) {
          const cleanedLastParamLine = lastParamLine.replace(/,+\s*$/, "");
          doc.replaceRange(
            cleanedLastParamLine,
            { line: lastParamLineIndex, ch: 0 },
            { line: lastParamLineIndex, ch: lastParamLine.length }
          );
        }
      }
      codeMirror.refresh();
    } else {
      notification(await Lget("scenario.testTaskEmptyError"), true);
    }
  }, 500);
}


async function createSpeakClientMenu(infos, defaultValue, listClients) {

  const removeSelect = document.getElementById("select-clientToSpeak");
  if (removeSelect) {
    removeSelect.remove();
  }

  let selected = 'choose-client';
  if (infos?.client && infos?.client !== "") {
    selected = infos.client === 'Define by the rule' ? 'Define by the rule' : infos.client;
  }

  const xSelect = document.createElement('x-select');
  xSelect.id = "select-clientToSpeak";
  xSelect.setAttribute('style', 'margin-left:5px; max-width: 180px; width: 150px;');
  xSelect.setAttribute('size', 'small');

  const xMenu = document.createElement('x-menu');
  xMenu.id = "menu-clientToSpeak";

  var xMenuItem = document.createElement('x-menuitem');
  xMenuItem.id = "menuitem-clientToSpeak";
  xMenuItem.setAttribute('value', defaultValue);
  xMenuItem.classList.add("clientToSpeak");
  const xLabel = document.createElement('x-label');
  xLabel.id = "select-clientToSpeak-label";
  xLabel.textContent = await Lget("scenario.select");
  xMenuItem.appendChild(xLabel);

  if (selected === defaultValue) {
    xMenuItem.setAttribute('toggled', 'true');
  } 

  var hrElement = document.createElement('hr');
  xMenu.appendChild(xMenuItem);
  xMenu.appendChild(hrElement);

  xMenuItem = document.createElement('x-menuitem');
  const xDefaultLabel = document.createElement('x-label');
  xDefaultLabel.id = "select-speak-default-label";
  xMenuItem.setAttribute('value', 'Define by the rule');
  xMenuItem.classList.add('clientToSpeak');
  // Le label peut être changé mais pas l'attribut value au dessus
  xDefaultLabel.textContent = await Lget("scenario.defineByRule");
  xMenuItem.appendChild(xDefaultLabel);
  hrElement = document.createElement('hr');
  xMenu.appendChild(xMenuItem);
  xMenu.appendChild(hrElement);

  if (selected === 'Define by the rule') {
    xMenuItem.setAttribute('toggled', 'true');
  }

  for (let i in listClients) {
    const itemOn = document.createElement("x-menuitem");
    itemOn.setAttribute("class", "clientToSpeak");
    itemOn.setAttribute("id", listClients[i]);
    itemOn.value = listClients[i];
    const labelOn = document.createElement("x-label");
    labelOn.innerHTML = listClients[i];
    itemOn.appendChild(labelOn);
    if (selected === listClients[i]) {
      itemOn.setAttribute('toggled', 'true');
    }
    xMenu.appendChild(itemOn);
  }

  xSelect.appendChild(xMenu);
  const clientFromLabel = document.getElementById("clientToSpeak-label");
  clientFromLabel.insertAdjacentElement("afterend", xSelect);

}


async function createActionMenuList(type, infos, defaultValue, listClients) {

  const removeSelect = document.getElementById("select-"+type);
  if (removeSelect) {
    removeSelect.remove();
  }

  let selected = defaultValue;
  if (type === 'clientFrom' &&  infos?.clientFrom && infos?.clientFrom !== "") {
    selected = infos.clientFrom === 'Define by the rule' ? 'Define by the rule' : infos.clientFrom;
  } else if (type === 'clientTo' && infos?.clientTo && infos?.clientTo !== "") {
    selected = infos.clientTo === 'Define by the rule' ? 'Define by the rule' : infos.clientTo;
  } else if (type === 'plugin' && infos?.pluginName && infos?.pluginName !== "") {
    selected = infos.pluginName;
  }

  const xSelect = document.createElement('x-select');
  xSelect.id = "select-"+type;
  xSelect.setAttribute('style', 'margin-left:5px; max-width: 180px; width: 150px;');
  xSelect.setAttribute('size', 'small');
  const xMenu = document.createElement('x-menu');
  xMenu.id = type;

  var xMenuItem = document.createElement('x-menuitem');
  xMenuItem.id = "menuitem-"+type;
  xMenuItem.setAttribute('value', defaultValue);
  xMenuItem.classList.add(type);
  xMenuItem.onclick = () => {
    if (type === 'plugin') {
      document.getElementById("test-task").disabled =
      listClients[i].name.includes('(Inactif)') ? true : false;
    }

    if (type === 'clientFrom' || type === 'clientTo') {
      triggerActionMenu(type, (type === 'clientFrom' ? 'client:' : 'toClient:'), defaultValue);
    }
  }


  const xLabel = document.createElement('x-label');
  xLabel.id = "select-"+type+"-label";
  xLabel.textContent = await Lget("scenario.select");
  xMenuItem.appendChild(xLabel);

  if (selected === defaultValue) {
    xMenuItem.setAttribute('toggled', 'true');
  } 

  var hrElement = document.createElement('hr');
  xMenu.appendChild(xMenuItem);
  xMenu.appendChild(hrElement);

  if (type === 'clientFrom' || type === 'clientTo') {
    xMenuItem = document.createElement('x-menuitem');
    const xDefaultLabel = document.createElement('x-label');
    xDefaultLabel.id = "select-"+type+"-default-label";
    xMenuItem.setAttribute('value', 'Define by the rule');
    xMenuItem.classList.add(type);
    xMenuItem.onclick = () => {
        triggerActionMenu(type, (type === 'clientFrom' ? 'client:' : 'toClient:'), defaultValue);
    }
    // Le label peut être changé mais pas l'attribut value au dessus
    xDefaultLabel.textContent = await Lget("scenario.defineByRule");
    xMenuItem.appendChild(xDefaultLabel);
    hrElement = document.createElement('hr');
    xMenu.appendChild(xMenuItem);
    xMenu.appendChild(hrElement);

    if (selected === 'Define by the rule') {
      xMenuItem.setAttribute('toggled', 'true');
    }
  }

  for (let i in listClients) {
    const itemOn = document.createElement("x-menuitem");
    itemOn.setAttribute("class", type);
    itemOn.setAttribute("id", listClients[i].id || listClients[i]);
    itemOn.value = listClients[i].name || listClients[i];
    const labelOn = document.createElement("x-label");
    labelOn.innerHTML = listClients[i].name || listClients[i];
    itemOn.appendChild(labelOn);
    itemOn.onclick = () => {
      if (type === 'plugin') {
        document.getElementById("test-task").disabled =
        listClients[i].name.includes('(Inactif)') ? true : false;
      }

      if (type === 'clientFrom' || type === 'clientTo') {
        triggerActionMenu(type, (type === 'clientFrom' ? 'client:' : 'toClient:'), defaultValue);
      }
    }
    if (selected === listClients[i] || selected === listClients[i].name) {
      itemOn.setAttribute('toggled', 'true');
    }
    xMenu.appendChild(itemOn);
  }

  xSelect.appendChild(xMenu);
  const clientFromLabel = document.getElementById(type+"Label");
  clientFromLabel.insertAdjacentElement("afterend", xSelect);
}


const createActionMenuLists = async (infos) => {
  await createActionMenuList("clientFrom", infos, 'choose-client', scenarioInfos.clients || []);
  await createActionMenuList("clientTo", infos, 'choose-client', scenarioInfos.allClients || []);
  await createActionMenuList("plugin", infos, 'choose-plugin', scenarioInfos.plugins);
}


async function setTargets() {
  
  dayOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
  months = ["January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"];

  document.getElementById("exec-tab-label").innerHTML =  await Lget("scenario.execLabel");   
  document.getElementById("rule-tab-label").innerHTML =  await Lget("scenario.ruleLabel");   
  document.getElementById("schedule-tab-label").innerHTML =  await Lget("scenario.scheduleLabel");   
  document.getElementById("execution-type-title").innerHTML =  await Lget("scenario.execTypeTitle");   
  document.getElementById("execution-type-label").innerHTML =  await Lget("scenario.execTypeLabel");   
  document.getElementById("execution-cron-label").innerHTML =  await Lget("scenario.execCronLabel"); 
  document.getElementById("execution-enable-cron-label").innerHTML =  await Lget("scenario.execEnableCronLabel"); 
  document.getElementById("execution-rule-label").innerHTML =  await Lget("scenario.execRuleLabel"); 
  document.getElementById("execution-enable-rule-label").innerHTML =  await Lget("scenario.execEnableRuleLabel"); 
  document.getElementById("execution-rule-tab-label").innerHTML =  await Lget("scenario.execRuleTabLabel");   
  document.getElementById("secondes-label").innerHTML =  await Lget("scenario.secondesLabel");   
  document.getElementById("minutes-label").innerHTML =  await Lget("scenario.minutesLabel");    
  document.getElementById("hours-label").innerHTML =  await Lget("scenario.hoursLabel");   
  document.getElementById("day-month-label").innerHTML =  await Lget("scenario.dayMonthLabel");    
  document.getElementById("month-label").innerHTML =  await Lget("scenario.monthLabel");   
  document.getElementById("day-week-label").innerHTML =  await Lget("scenario.dayWeekLabel");   
  document.getElementById("fixed-second-number-label").innerHTML =  await Lget("scenario.fixedSecNumLabel");   
  document.getElementById("fixed-second-txt-label").innerHTML =  await Lget("scenario.fixedSecTxtLabel");   
  document.getElementById("fixed-hour-number-label").innerHTML =  await Lget("scenario.fixedHrNumLabel");   
  document.getElementById("fixed-hour-txt-label").innerHTML =  await Lget("scenario.fixedHrTxtLabel");   
  document.getElementById("fixed-month-day-number-label").innerHTML =  await Lget("scenario.fixedMonthDayNumLabel");   
  document.getElementById("fixed-month-day-txt-label").innerHTML =  await Lget("scenario.fixedMonthDayTxtLabel");   
  document.getElementById("fixed-month-number-label").innerHTML =  await Lget("scenario.fixedMonthNumLabel");   
  document.getElementById("fixed-month-txt-label").innerHTML =  await Lget("scenario.fixedMonthTxtLabel");   
  document.getElementById("fixed-day-week-number-label").innerHTML =  await Lget("scenario.fixedDayWeekNumLabel");   
  document.getElementById("fixed-day-week-txt-label").innerHTML =  await Lget("scenario.fixedDayWeekTxtLabel");   
  document.getElementById("any-value-txt-label").innerHTML =  await Lget("scenario.anyValueTxtLabel");   
  document.getElementById("list-value-txt-label").innerHTML =  await Lget("scenario.listValueTxtLabel");   
  document.getElementById("range-value-txt-label").innerHTML =  await Lget("scenario.rangeValueTxtLabel");   
  document.getElementById("step-value-txt-label").innerHTML =  await Lget("scenario.stepValueTxtLabel");   
  document.getElementById("apply-calendar-label").innerHTML =  await Lget("scenario.applyLabel");   
  document.getElementById("close-calendar-label").innerHTML =  await Lget("scenario.closeLabel");   
  document.getElementById("remove-calendar-label").innerHTML =  await Lget("scenario.removeLabel");   
  document.getElementById("speak-label").innerHTML =  await Lget("scenario.speakLabel");   
  document.getElementById("xcard-speak-label").innerHTML =  await Lget("scenario.xcardSpeakLabel");   
  document.getElementById("titleSpeakLabel").innerHTML =  await Lget("scenario.titleSpeakLabel");   
  document.getElementById("clientToSpeak-label").innerHTML =  await Lget("scenario.clientToSpeakLabel");   
  document.getElementById("end-speak-label").innerHTML =  await Lget("scenario.endSpeakLabel");   
  document.getElementById("wait-speak-label").innerHTML =  await Lget("scenario.waitSpeakLabel");   
  document.getElementById("noteTestSpeakLabel").innerHTML =  await Lget("scenario.noteTestSpeakLabel");  
  document.getElementById("label-test-speak").innerHTML =  await Lget("scenario.testSpeakLabel"); 
  document.getElementById("apply-speak-label").innerHTML =  await Lget("scenario.applyLabel"); 
  document.getElementById("close-speak-label").innerHTML =  await Lget("scenario.closeLabel"); 
  document.getElementById("remove-speak-label").innerHTML =  await Lget("scenario.removeLabel"); 
  document.getElementById("module-name-label").innerHTML =  await Lget("scenario.moduleNameLabel");
  document.getElementById("module-label").innerHTML =  await Lget("scenario.moduleLabel"); 
  document.getElementById("apply-module-label").innerHTML =  await Lget("scenario.applyLabel"); 
  document.getElementById("close-module-label").innerHTML =  await Lget("scenario.closeLabel"); 
  document.getElementById("remove-module-label").innerHTML =  await Lget("scenario.removeLabel"); 
  document.getElementById("javascript-label").innerHTML =  await Lget("scenario.javascriptLabel"); 
  document.getElementById("apply-javascript-label").innerHTML =  await Lget("scenario.applyLabel"); 
  document.getElementById("close-javascript-label").innerHTML =  await Lget("scenario.closeLabel"); 
  document.getElementById("remove-javascript-label").innerHTML =  await Lget("scenario.removeLabel"); 
  document.getElementById("timer-label").innerHTML =  await Lget("scenario.timerLabel"); 
  document.getElementById("apply-timer-label").innerHTML =  await Lget("scenario.applyLabel"); 
  document.getElementById("close-timer-label").innerHTML =  await Lget("scenario.closeLabel"); 
  document.getElementById("remove-timer-label").innerHTML =  await Lget("scenario.removeLabel");
  document.getElementById("payload-label").innerHTML =  await Lget("scenario.payloadLabel"); 
  document.getElementById("apply-payload-label").innerHTML =  await Lget("scenario.applyLabel"); 
  document.getElementById("close-payload-label").innerHTML =  await Lget("scenario.closeLabel"); 
  document.getElementById("remove-payload-label").innerHTML =  await Lget("scenario.removeLabel");
  document.getElementById("start-label").innerHTML =  await Lget("scenario.startLabel"); 
  document.getElementById("apply-scenario-label").innerHTML =  await Lget("scenario.applyLabel"); 
  document.getElementById("close-scenario-label").innerHTML =  await Lget("scenario.closeLabel"); 
  document.getElementById("action-label").innerHTML =  await Lget("scenario.actionLabel"); 
  document.getElementById("xcard-task-label").innerHTML =  await Lget("scenario.xcardTaskLabel"); 
  document.getElementById("titleClientLabel").innerHTML =  await Lget("scenario.titleSpeakLabel"); 
  document.getElementById("clientFromLabel").innerHTML =  await Lget("scenario.clientFromLabel"); 
  document.getElementById("clientToLabel").innerHTML =  await Lget("scenario.clientToLabel"); 
  document.getElementById("noteLabel").innerHTML =  await Lget("scenario.noteLabel"); 
  document.getElementById("xcard-execution-label").innerHTML =  await Lget("scenario.xcardExecutionLabel"); 
  document.getElementById("titlePluginLabel").innerHTML =  await Lget("scenario.titlePluginLabel"); 
  document.getElementById("pluginLabel").innerHTML =  await Lget("scenario.pluginLabel"); 
  document.getElementById("parameters-label").innerHTML =  await Lget("scenario.parametersLabel"); 
  document.getElementById("wait-action-label").innerHTML =  await Lget("scenario.waitActionLabel"); 
  document.getElementById("noteActionTestLabel").innerHTML =  await Lget("scenario.noteTestSpeakLabel");   
  document.getElementById("label-test-task").innerHTML =  await Lget("scenario.testSpeakLabel"); 
  document.getElementById("apply-task-label").innerHTML =  await Lget("scenario.applyLabel"); 
  document.getElementById("close-task-label").innerHTML =  await Lget("scenario.closeLabel"); 
  document.getElementById("remove-task-label").innerHTML =  await Lget("scenario.removeLabel"); 
  document.getElementById("close-end-label").innerHTML =  await Lget("scenario.closeLabel"); 
  document.getElementById("remove-end-label").innerHTML =  await Lget("scenario.removeLabel"); 
  document.getElementById("remove-edge-label").innerHTML =  await Lget("scenario.removeLabel"); 
  document.getElementById("copy-infos-title").innerHTML =  await Lget("scenario.copyInfosTitle"); 
  document.getElementById("copy-infos-label").innerHTML =  await Lget("scenario.copyInfosLabel"); 
  document.getElementById("copy-label").innerHTML =  await Lget("scenario.copyLabel"); 
  document.getElementById("close-copy-label").innerHTML =  await Lget("scenario.closeLabel");

}



const Lget = async (target, ...args) => {

  if (args) {
      target = [target];
      args.forEach(arg => {
          target.push(arg);
      })
  } 
  return await window.electronAPI.getMsg(target);
}


async function setSettingsXel(interface) {
  if (interface && interface.screen?.xeltheme) {
    document
    .querySelector('meta[name="xel-theme"]')
    .setAttribute('content', '../../node_modules/xel/themes/' + interface.screen.xeltheme + '.css');
    
    document.querySelector('meta[name="xel-accent-color"]').setAttribute('content', interface.screen.xelcolor);
    
    document
    .querySelector('meta[name="xel-icons"]')
    .setAttribute('content', '../../node_modules/xel/icons/' + interface.screen.xelicons + '.svg');
  }
}


window.electronAPI.onInitScenario(async (infos, interface, isClient) => {
  await setSettingsXel(interface);
  await setTargets();
  scenarioInfos = infos;
  isClient = isClient;
  await addActions();
  await addCommands();
  await addCronInfos();
  await addExistingScenarios(infos.scenarios);
  cyScenario = await setCY ($('#cy-scenario'), {height: 40, width: 40});

  cyScenario.on('position', 'node', function(event) {
    resizeCyScenarioBasedOnNodes();
  });

  cyScenario.on('tap', function(event) {
    if (event.target === cyScenario && selectedNodes.length > 0) {   
        unselectNodes();
    }
  })

  window.JSHINT = JSHINT;
})


