import { shell } from 'electron';
import JSON5 from 'json5';
import fs from 'fs-extra';
import * as path from 'node:path';
import * as url from 'url';
const __dirname = url.fileURLToPath(new URL('.', import.meta.url));
import { CronJob } from 'cron';
import moment from 'moment';

class CronManager {
  constructor() {
    // Map pour stocker les jobs par calendarNode.id
    this.jobs = new Map();
  }

  /**
   * Ajoute et démarre un CronJob.
   * @param {string} id - L'identifiant (calendarNode.id) du job.
   * @param {string} cronValue - L'expression cron.
   * @param {string} scenarioKey - La clé du scénario.
   * @param {Array} flow - Le flow associé au scénario.
   * @returns {Object} Un objet décrivant le job ajouté.
   */
  addJob(id, cronValue, scenarioKey, flow) {
    if (this.jobs.has(id)) {
      throw new Error(L.get(["scenario.jobAlreadyExist", id]));
    }

    // Objet stocké avec les infos nécessaires
    const jobDetails = {
      id,
      cronValue,
      scenarioKey,
      flow,
      job: null, // instance du CronJob
      lastDate: null
    };

    // Création du CronJob sans démarrage immédiat
    const job = new CronJob(
      cronValue,
      () => {
        // Mise à jour de la date de dernière exécution
        //jobDetails.lastDate = new Date();
        jobDetails.lastDate = moment(new Date()).format('ddd DD MMM YYYY - HH:mm:ss');

        info(L.get(["scenario.exec", scenarioKey]));
        processFlow(flow)
          .then(() => info(L.get(["scenario.done", scenarioKey])))
          .catch(err => error(L.get(["scenario.execError", scenarioKey]), err));
      },
      null, // fonction à exécuter lors de l'arrêt (optionnelle)
      false // démarrage manuel pour contrôler l'état
    );

    jobDetails.job = job;
    this.jobs.set(id, jobDetails);

    return jobDetails;
  }

  /**
   * Retrouve un job à partir de son identifiant.
   * @param {string} id - L'identifiant du job.
   * @returns {Object|null} Les détails du job ou null s'il n'existe pas.
   */
  getJob(id) {
    return this.jobs.get(id) || null;
  }

  /**
   * Retourne, dans une seule fonction, l'ensemble des informations concernant un job :
   * - existence (true/false)
   * - statut ("actif" si le job est en cours, "stoppé" sinon, "inexistant" si absent)
   * - lastDate : date de la dernière exécution (null si jamais exécuté)
   * - nextDate : prochaine date d'exécution (null en cas d'erreur)
   *
   * @param {string} id - L'identifiant du job.
   * @returns {Object} Un objet contenant { exists, status, lastDate, nextDate }.
   */
  getJobInfo(id) {
    const jobDetails = this.getJob(id);
    if (!jobDetails) {
      return { exists: false, status: "nonexistent", lastDate: null, nextDate: null };
    }
    const status = jobDetails.job.isActive ? "active" : "stopped";
    const lastDate = jobDetails.lastDate;
    let nextDate = null;
    try {
      const next = jobDetails.job.nextDates(1);
      nextDate = Array.isArray(next)
      ? moment(next[0].toJSDate()).format('ddd DD MMM YYYY - HH:mm:ss')
      : moment(next.toJSDate()).format('ddd DD MMM YYYY - HH:mm:ss');
    } catch (err) {
      nextDate = null;
    }
    return { exists: true, status, lastDate, nextDate };
  }

  /**
   * Arrête un job en fonction de son identifiant.
   * @param {string} id - L'identifiant du job.
   */
  stopJob(id) {
    const jobDetails = this.getJob(id);
    if (!jobDetails) {
      throw new Error(L.get(["scenario.jobNotExist", id]));
    }
    if (jobDetails.job.isActive) {
      jobDetails.job.stop();
      info(L.get(["scenario.jobStopped", jobDetails.scenarioKey, id]));
      return true;
    } else {
      info(L.get(["scenario.jobAlreadyStopped", jobDetails.scenarioKey, id]));
      return false;
    }
  }

  /**
   * Relance (démarre) un job arrêté.
   * @param {string} id - L'identifiant du job.
   */
  startJob(id) {
    const jobDetails = this.getJob(id);
    if (!jobDetails) {
      throw new Error(L.get(["scenario.jobNotExist", id]));
    }
    if (!jobDetails.job.isActive) {
      jobDetails.job.start();
      info(L.get(["scenario.jobStarted", jobDetails.scenarioKey, jobDetails.id, jobDetails.cronValue]));
      return true;
    } else {
      info(L.get(["scenario.jobAlreadyStarted", jobDetails.scenarioKey, jobDetails.id]));
      return false;
    }
  }

  /**
   * Supprime un job (en arrêtant d'abord s'il est actif).
   * @param {string} id - L'identifiant du job.
   */
  removeJob(id) {
    const jobDetails = this.getJob(id);
    if (jobDetails) {
      if (jobDetails.job.isActive) {
        jobDetails.job.stop();
      }
      this.jobs.delete(id);
      info(L.get(["scenario.jobRemoved", id]));
    }
  }

  /**
   * Liste tous les jobs enregistrés.
   * @returns {Array<Object>} Tableau contenant les informations (id, cronValue, et état) de chaque job.
   */
  listJobs() {
    return Array.from(this.jobs.values()).map(jobDetails => ({
      id: jobDetails.id,
      cronValue: jobDetails.cronValue,
      active: jobDetails.job.isActive,
      scenarioKey: jobDetails.scenarioKey,
    }));
  }

  /**
   * Démarre tous les jobs qui sont enregistrés et non démarrés.
   */
  startAllJobs() {
    this.jobs.forEach((jobDetails, id) => {
      if (!jobDetails.job.isActive) {
        jobDetails.job.start();
        info(L.get(["scenario.startAllJobs", jobDetails.scenarioKey, id, jobDetails.cronValue]));
      }
    });
  }
}


// Création d'une instance de CronManager
const cronManager = new CronManager();


/**
 * Builds an options object by parsing a given parameters string.
 *
 * The input string is expected to be a JavaScript object literal assigned to a variable
 * (e.g., `const parameters = {...};`). The function removes the assignment prefix and
 * parses the object using JSON5 to allow for more flexible JSON syntax.
 *
 * @param {string} parametersStr - A string containing a JavaScript object literal 
 *                                 assigned to a variable (e.g., `const parameters = {...};`).
 * @returns {Object} An options object with the following structure:
 *                   - `action` {Object}: Contains all properties from the input object
 *                     except `language`, `client`, and `toClient`.
 *                   - `language` {string}: The `language` property from the input object.
 *                   - `client` {string}: The `client` property from the input object.
 *                   - `toClient` {string}: The `toClient` property from the input object.
 *
 * @throws {SyntaxError} If the input string cannot be parsed as a valid JSON5 object.
 */
function buildOptions(parametersStr) {
  // Retirer le préfixe "const parameters =" et le point-virgule final pour obtenir une chaîne compatible JSON5
  
  const objectLiteralStr = parametersStr
    .replace(/^const\s+parameters\s*=\s*/, '')
    .replace(/;$/, '');
  
  // Parse l'objet en utilisant JSON5
  const params = JSON5.parse(objectLiteralStr);
  
  // Extraire les propriétés qui doivent être au niveau racine
  const { language, client, toClient, ...actionProps } = params;
  
  // Construire l'objet options
  const options = {
    action: actionProps,
    language,
    client,
    toClient
  };

  return options;
}


/**
 * Executes a node based on its type and performs the corresponding action.
 *
 * @param {Object} node - The node object containing the type and additional information.
 * @param {string} node.Type - The type of the node (e.g., 'action', 'speak', 'timer', 'javascript', 'payload', 'module').
 * @param {Object} node.infos - Additional information specific to the node type.
 * @param {Object} [payload] - The current payload to be passed to the node's action.
 * @returns {Promise<*>} A promise that resolves with the result of the node's execution or `null` in case of an error.
 *
 * @throws {Error} If an error occurs during the execution of a 'javascript' or 'module' node.
 *
 * Node Types:
 * - `action`: Calls a plugin with options and optionally waits for a callback.
 * - `speak`: Uses `Avatar.speak` to perform text-to-speech and optionally waits for completion.
 * - `timer`: Waits for a specified delay in seconds before resolving.
 * - `javascript`: Executes custom JavaScript code provided in the node and resolves with the result.
 * - `payload`: Simply resolves with the current payload.
 * - `module`: Dynamically imports a JavaScript module and calls its exported `action` function with the payload.
 */
function executeNode(node, payload, state) {
  return new Promise(async (resolve) => {
    switch (node.Type) {
      case 'action': {
        const options = buildOptions(node.infos.parameters);

        // Vérification et remplacement pour options.client
        if (options.client === "Define by the rule") {
          options.client = state && state?.client ? state?.client : Config.default.client;
        }
        
        // Vérification et remplacement pour options.toClient
        if (!options?.toClient || options.toClient === "Define by the rule") {
          options.toClient = state && state?.toClient ? state.toClient : Config.default.client;
        }

        if (node.infos?.wait) {
          Avatar.call(node.infos.pluginId, options, () => resolve({ payload: null, state }));
        } else {
          Avatar.call(node.infos.pluginId, options);
          resolve({ payload: null, state });
        }
        break;
      }
      case 'speak': {
        let speakClient;
        if (node.infos.client === "Define by the rule") {
           speakClient = state && state.client != null ? state.client : Config.default.client;
        } else {
          speakClient = node.infos.client;
        }

        if (node.infos?.wait) {
          Avatar.speak(node.infos.tts, speakClient, JSON.parse(node.infos.end), () => resolve({ payload: null, state }));
        } else {
          Avatar.speak(node.infos.tts, speakClient, JSON.parse(node.infos.end));
          resolve({ payload: null, state });
        }
        break;
      }
      case 'timer': {
        setTimeout(() => resolve({ payload: null, state }), (node.infos.timer * 1000));
        break;
      }
      case 'javascript': {
        try {
          let func;
          let formatCode = node.infos.code;
          const code = formatCode.replace(/[\s\S]*?(function)/, '$1');
  
          if (code.trim().startsWith("function")) {
            func = eval('(' + code + ')');
          } else {
            // On crée la fonction en passant payload et state comme arguments
            func = new Function('payload', 'state', code);
          }
          // Si state est null on ajoute les propriétés client et toClient par défaut
          if (!state) {
            state = {
              client: Config.default.client,
              toClient: Config.default.client
            };
          }
          const result = await func(payload, state);
          // Si le résultat est déjà un objet structuré, on le renvoie, sinon on l'encapsule
          if (result !== null && typeof result === 'object' && result.hasOwnProperty('payload')) {
            resolve(result);
          } else {
            resolve({ payload: result, state });
          }
        } catch (err) {
          error(L.get("scenario.javascriptError"), err);
          resolve({ payload: null, state });
        }
        break;
      }
      case 'payload': {
        // On transmet le payload et les paramètres
        resolve({ payload, state });
        break;
      }
      case 'module': {
        (async () => {
          try {
            const code = node.infos.code;
            const base64Code = Buffer.from(code).toString('base64');
            const url = `data:text/javascript;base64,${base64Code}`;
            const mod = await import(url);
            if (typeof mod.action === 'function') {
              // Si state est null on ajoute les propriétés client et toClient par défaut
              if (!state) {
                state = {
                  client: Config.default.client,
                  toClient: Config.default.client
                };
              }
              const result = await mod.action(payload, state);
              URL.revokeObjectURL(url);
              if (result !== null && typeof result === 'object' && result.hasOwnProperty('payload')) {
                resolve(result);
              } else {
                resolve({ payload: result, state });
              }
            } else {
              error(L.get("scenario.noActionError"));
              URL.revokeObjectURL(url);
              resolve({ payload: null, state });
            }
          } catch (err) {
            error(L.get("scenario.moduleError"), err);
            resolve({ payload: null, state });
          }
        })();
        break;
      }
      default:
        resolve({ payload: null, state });
    }
  });
}


/**
 * Recursively marks all descendant nodes of a given node in a flow.
 *
 * @param {string} nodeId - The ID of the node whose descendants are to be marked.
 * @param {Array<Object>} flow - The array of nodes representing the flow. Each node should have `id` and `idParent` properties.
 * @param {Set<string>} skipIds - A set to store the IDs of the descendant nodes to be marked.
 */
function markDescendants(nodeId, flow, skipIds) {
  for (const node of flow) {
    if (node.idParent === nodeId) {
      skipIds.add(node.id);
      markDescendants(node.id, flow, skipIds);
    }
  }
}


/**
 * Processes a flow of nodes, executing each node in sequence and managing payloads and branching logic.
 *
 * @async
 * @function
 * @param {Array<Object>} flow - The array of nodes representing the flow to process. Each node should have properties like `id`, `idParent`, `Type`, and `infos`.
 * @param {Object} state - The state object used during node execution.
 * @returns {Promise<void>} Resolves when the entire flow has been processed.
 *
 * @description
 * The function iterates through the flow starting from the second node (index 1). It executes each node, passing the current payload and state objects.
 * 
 * - Nodes of type "javascript" or "module" modify the current payload.
 * - Nodes of type "payload" compare the payload against a criterion and determine whether to continue processing or skip branches.
 * - Other node types reset the payload.
 * 
 * If a node belongs to a branch marked for skipping, it is ignored. Branches are marked for skipping based on payload mismatches in "payload" nodes.
 *
 * @example
 * const flow = [
 *   { id: 1, idParent: null, Type: 'calendar', infos: {} },
 *   { id: 2, idParent: 1, Type: 'javascript', infos: {} },
 *   { id: 3, idParent: 1, Type: 'payload', infos: { payload: 'expectedValue' } },
 * ];
 * await processFlow(flow, state);
 */
async function processFlow(flow, state) {
  // On démarre sans payload et sans branche à ignorer.
  let currentPayload = null;
  let skipIds = new Set();

  // On commence à partir du deuxième node (le premier est le "calendar")
  for (let i = 1; i < flow.length; i++) {
    const node = flow[i];

    // Si le node appartient à une branche marquée pour être ignorée, on le saute.
    if (skipIds.has(node.idParent)) {
      continue;
    }

    // Exécuter le node en passant le payload actuel ainsi que state
    const result = await executeNode(node, currentPayload, state);
    
    // Extraction de la propriété payload si le résultat est un objet structuré
    let newPayload;
    if (result !== null && typeof result === 'object' && result.hasOwnProperty('payload')) {
      newPayload = result.payload;
    } else {
      newPayload = result;
    }

    if (node.Type === 'javascript' || node.Type === 'module') {
      // Le node "javascript" modifie le payload
      currentPayload = newPayload;
    } else if (node.Type === 'payload') {
      // Comparaison pour déterminer si le payload correspond au critère de branchement
      if (
        typeof newPayload === 'string' &&
        typeof node.infos.payload === 'string' &&
        newPayload.toLowerCase() === node.infos.payload.toLowerCase()
      ) {
        // Si le payload correspond, on consomme le payload et on le réinitialise pour cette branche.
        currentPayload = null;
      } else {
        // Sinon, on marque ce node et tous ses descendants pour être ignorés.
        skipIds.add(node.id);
        markDescendants(node.id, flow, skipIds);
        // On ne réinitialise PAS currentPayload ici pour que les autres payload siblings puissent l'utiliser.
      }
    } else {
      // Pour tout autre type de node, on réinitialise le payload.
      currentPayload = null;
    }
  }
}


/**
 * Determines whether a given node is a descendant of a specified ancestor node.
 *
 * @param {Array<Object>} nodes - The list of all nodes, where each node is an object with at least `id` and `idParent` properties.
 * @param {Object} node - The node to check for descendant status.
 * @param {string|number} ancestorId - The ID of the potential ancestor node.
 * @returns {boolean} - Returns `true` if the node is a descendant of the ancestor, otherwise `false`.
 */
function isDescendant(nodes, node, ancestorId) {
  let current = node;
  while (current && current.idParent) {
    if (current.idParent === ancestorId) return true;
    current = nodes.find(n => n.id === current.idParent);
  }
  return false;
}


/**
 * Merges a flow of nodes by including a specified calendar node and its descendants,
 * while ensuring proper ordering, removing duplicates, and handling "end" nodes.
 *
 * @param {Array<Object>} nodes - The array of nodes to process.
 * @param {Object} calendarNode - The calendar node to merge with its descendants.
 * @returns {Array<Object>} - The merged flow of nodes in the correct order.
 *
 * @throws {Error} If `nodes` or `calendarNode` is not provided or invalid.
 *
 * @example
 * const nodes = [
 *   { id: 1, Type: 'start' },
 *   { id: 2, Type: 'process' },
 *   { id: 3, Type: 'end' },
 *   { id: 4, Type: 'process' }
 * ];
 * const calendarNode = { id: 2, Type: 'process' };
 * const result = mergeFlow(nodes, calendarNode);
 * console.log(result);
 * // Output: Merged and ordered array of nodes
 */
function mergeFlow(nodes, calendarNode) {
  // On parcourt les nodes avec leur indice d'origine
  const indexedNodes = nodes.map((node, index) => ({ node, index }));
  
  // On récupère le node calendar lui-même et tous ses descendants
  let merged = indexedNodes.filter(item => {
    return item.node === calendarNode ||
           isDescendant(nodes, item.node, calendarNode.id);
  });
  
  // On trie selon l'ordre d'apparition dans l'array d'origine
  merged.sort((a, b) => a.index - b.index);
  
  // On retire les doublons en se basant sur l'id (en gardant la première occurrence sauf pour les nodes "end")
  const seen = new Set();
  const result = [];
  for (const item of merged) {
    // Pour les nodes de type "end", on permettra une réévaluation ultérieure
    if (item.node.Type === 'end') {
      result.push(item);
    } else if (!seen.has(item.node.id)) {
      seen.add(item.node.id);
      result.push(item);
    }
  }
  
  // Si plusieurs nodes "end" sont présents, on conserve uniquement le dernier et on le place à la fin.
  const ends = result.filter(item => item.node.Type === 'end');
  if (ends.length > 1) {
    // Retirer toutes les occurrences de nodes "end"
    const withoutEnds = result.filter(item => item.node.Type !== 'end');
    // Choisir le node "end" avec l'indice le plus élevé (le dernier dans l'ordre original)
    const lastEnd = ends.reduce((prev, curr) => (prev.index > curr.index ? prev : curr));
    result.length = 0;
    result.push(...withoutEnds, lastEnd);
  }
  
  // On retourne le flow fusionné (la liste des nodes dans l'ordre)
  return result.map(item => item.node);
}


/**
 * Retrieves and processes scenarios based on the specified type and optional calendar ID.
 *
 * @async
 * @function
 * @param {string} type - The type of information to filter scenarios by (e.g., "cron").
 * @param {string} [id] - Optional calendar ID to filter scenarios by a specific calendar node.
 * @returns {Promise<Object>} A promise that resolves to an object containing flows for each scenario.
 * Each flow is an array of merged flows where the last node is of type "end".
 *
 * @throws {Error} If there is an issue retrieving or processing the scenarios.
 *
 * @example
 * const flows = await getScenariosByType('cron', 'calendar123');
 * console.log(flows);
 */
async function getScenariosByType(type, id) {
  // Récupère les scénarios (cette fonction doit retourner un objet, par exemple via une API)
  const scenarios = await getScenarios();

  // Filtrage : on ne conserve que les scénarios contenant au moins un node "calendar" avec infos.cron.active === true
  const filteredScenarios = {};
  Object.keys(scenarios).forEach(key => {
    if (id && scenarios[key].some(n => n.Type === 'calendar' && id === n.id && n.infos[type]?.active === true)) {
        filteredScenarios[key] = scenarios[key];
    } else if (scenarios[key].some(n => n.Type === 'calendar' && n.infos[type]?.active === true && n.infos[type]?.enabled === true)) {
      filteredScenarios[key] = scenarios[key];
    }
  });

  // Fusion des flows pour chacun des nodes "calendar" actifs
  const flows = {};
  Object.keys(filteredScenarios).forEach(scenarioKey => {
    const nodes = filteredScenarios[scenarioKey];
    let calendarNodes;
    if (id) {
      // Récupérer seulement les nodes du calendar passé en paramètre id
       calendarNodes = nodes.filter(n => n.Type === 'calendar' && id === n.id && n.infos[type]?.active === true);
    } else {
      // Récupérer tous les nodes calendar actifs
       calendarNodes = nodes.filter(n => n.Type === 'calendar' && n.infos[type]?.active === true && n.infos[type]?.enabled === true);
    }  
    flows[scenarioKey] = [];
    
    // Pour chaque node calendar actif, on fusionne le flow descendant
    calendarNodes.forEach(calendarNode => {
      const mergedFlow = mergeFlow(nodes, calendarNode);
      // On ne garde que le flow si le dernier node est de type "end"
      if (mergedFlow.length && mergedFlow[mergedFlow.length - 1].Type === 'end') {
        flows[scenarioKey].push(mergedFlow);
      }
    });
  });

  // Retourne l'objet flows
  return flows;
}


/**
 * Retrieves a sub-array from a nested structure of arrays based on a specified key and ID.
 *
 * @param {Object} flows - An object containing arrays of sub-arrays, keyed by strings.
 * @param {string} key - The key to look up in the `flows` object.
 * @param {string|number} id - The ID to search for within the sub-arrays.
 * @returns {Array|null} - The sub-array containing an element with the specified ID, or `null` if not found.
 */
function getFlowArrayByKeyAndId(flows, key, id) {
  // Vérifier si flows possède la clé donnée
  if (!flows.hasOwnProperty(key)) {
    return null;
  }
  
  // Récupérer le tableau de sous-tableaux associé à la clé
  const flowArrays = flows[key];
  
  // Parcourir chaque sous-array
  for (const subArray of flowArrays) {
    if (Array.isArray(subArray)) {
      // Si un des éléments de subArray possède l'id recherché
      if (subArray.some(item => item.id === id)) {
        return subArray;
      }
    }
  }
  
  // Si aucun sous-array ne contient l'élément avec l'id passé en paramètre
  return null;
}


/**
 * Executes a scenario based on a rule by its name and ID, processes the flow, and optionally invokes a callback.
 *
 * @async
 * @function scenarionByRule
 * @param {string} name - The name of the scenario to execute.
 * @param {string|number} id - The unique identifier of the scenario.
 * @param {Object} state - The state object initiating the scenario.
 * @param {Function} [callback] - An optional callback function to execute when the flow is completed.
 *                                The callback receives an object containing the payload and state.
 * @throws {Error} Throws an error if the scenario is not found or if an execution error occurs.
 * @returns {Promise<void>} A promise that resolves when the scenario execution is complete.
 */
export async function scenarionByRule(name, id, state, callback) {

  try {
    const flows = await getScenariosByType('rule');
    const flow = getFlowArrayByKeyAndId(flows, name, id);

    if (flow) {
      const finalPayload = await processFlow(flow, state);
      if (callback && typeof callback === 'function') {
        // Exécution du callback lorsque le flow est terminé (node "end" atteint)
        callback({ payload: finalPayload, state });
      }
    } else {
      throw new Error (L.get("scenario.notFoundError"));
    }

  } catch (err) {
    error(L.get(["scenario.execRuleError", rule]), err.message || err.stack || 'unknow');
  }

}


/**
 * Retrieves scenarios filtered by rules.
 *
 * This asynchronous function fetches scenarios of type 'rule' and processes them
 * to extract nodes of type "calendar" where the rule is enabled and has a value.
 * The resulting scenarios are grouped by their keys and returned as an object.
 *
 * @async
 * @function
 * @returns {Promise<Object>} An object where each key corresponds to a group of scenarios,
 *                            and the value is an array of calendars with their IDs and rules.
 * @throws Will log an error message if an exception occurs during the process.
 */
async function getScenariosByRules() {
  const result = {};

  try {
    const flows = await getScenariosByType('rule');

    const scenarios = {};

    for (const key in flows) {
      const subArrays = flows[key];
      const calendars = [];

      if (Array.isArray(subArrays)) {
        subArrays.forEach(subArray => {
          if (Array.isArray(subArray)) {
            subArray.forEach(item => {
              // On ne prend que les nœuds de type "calendar" avec infos.rule.enabled === true
              if (
                item.Type === "calendar" &&
                item.infos &&
                item.infos.rule &&
                item.infos.rule.enabled === true &&
                item.infos.rule.value
              ) {
                calendars.push({
                  id: item.id,
                  rules: item.infos.rule.value
                });
              }
            });
          }
        });
      }
      scenarios[key] = calendars;
    }

    return scenarios;

  } catch (err) {
    error(L.get("scenario.getByRulesError"), err);
    return result;
  }
}


/**
 * Asynchronously schedules and executes scenarios based on their cron expressions.
 *
 * This function retrieves scenarios of type 'cron', iterates through them, and schedules
 * their execution using the `CronJob` class. Each scenario is associated with a flow,
 * and the first node of the flow contains the cron expression used for scheduling.
 *
 * @async
 * @function cronJob
 * @throws {Error} If there is an issue retrieving or processing the scenarios.
 *
 * @description
 * - Retrieves scenarios of type 'cron' using `getScenariosByType`.
 * - For each scenario and its associated flows:
 *   - Extracts the cron expression from the first node of the flow.
 *   - Creates and starts a `CronJob` to execute the flow at the specified schedule.
 *   - Logs the execution and completion of each scenario.
 * - Logs any errors encountered during the process.
 */
async function cronJobs() {

  try {
    // Cheche les scénarios à exécution programmée
    const flows = await getScenariosByType('cron');

    // Pour chaque scénario et chaque flow associé, on planifie l'exécution selon l'expression cron définie
    Object.keys(flows).forEach(scenarioKey => {
      flows[scenarioKey].forEach(flow => {
        // Le premier node est le "calendar" qui contient l'expression cron
        const calendarNode = flow[0];
        const cronValue = calendarNode.infos.cron.value;
        const calendarId = calendarNode.id;

        cronManager.addJob(calendarId, cronValue, scenarioKey, flow);
      });
    });

  } catch (err) {
    error(L.get("scenario.getByProgramsError"), err)
  }

}


/**
 * Restarts a cron job for the specified calendar ID.
 *
 * @async
 * @function
 * @param {string} calendarId - The unique identifier of the calendar whose cron job needs to be restarted.
 * @returns {Promise<any>} A promise that resolves when the cron job is successfully restarted.
 */
async function restartCronJob(calendarId) {
  return cronManager.startJob(calendarId);
}


/**
 * Stops a cron job associated with the specified calendar ID.
 *
 * @async
 * @function
 * @param {string} calendarId - The unique identifier of the calendar whose cron job needs to be stopped.
 * @returns {Promise<boolean>} - A promise that resolves to a boolean indicating whether the cron job was successfully stopped.
 */
async function stopCronJob(calendarId) {
  return cronManager.stopJob(calendarId);
}


/**
 * Starts a cron job for a given scenario and calendar ID.
 *
 * @async
 * @function startCronJob
 * @param {Object} params - The parameters for starting the cron job.
 * @param {string} params.scenario - The name or identifier of the scenario.
 * @param {string} params.calendarId - The ID of the calendar associated with the scenario.
 * @returns {Promise<void>} Resolves when the cron job is successfully started.
 * @throws {Error} Throws an error if the specified scenario or calendar ID is not found.
 */
async function startCronJob({scenario, calendarId}) {

  const flows = await getScenariosByType('cron', calendarId);
  const flow = getFlowArrayByKeyAndId(flows, scenario, calendarId);

  if (flow) {
    const calendarNode = flow[0];
    const cronValue = calendarNode.infos.cron.value;

    cronManager.addJob(calendarId, cronValue, scenario, flow);
    return cronManager.startJob(calendarId);
  } else {
    throw new Error (L.get(["scenario.getCalendarError", calendarId, scenario]));
  }

}


/**
 * Starts all cron jobs managed by the cronManager.
 * This function triggers the execution of all scheduled jobs.
 * 
 * @async
 * @function
 * @returns {Promise<void>} Resolves when all cron jobs have been started.
 */
async function startAllCronJobs() {
  cronManager.startAllJobs();
}


/**
 * Retrieves information about a specific job by its ID.
 *
 * @param {string} id - The unique identifier of the job.
 * @returns {Promise<Object>} A promise that resolves to an object containing job information.
 */
async function getJobInfo(id) {
  return cronManager.getJobInfo(id);
}


/**
 * Asynchronously retrieves and parses scenario JSON files from the 'lib/scenarios' directory.
 * Ensures the directory exists before attempting to read files.
 * Filters for JSON files, reads their content, and extracts scenarios with a defined `infos.scenario` property.
 * Populates a global object with scenario data, keyed by the `infos.scenario` value.
 * Logs errors encountered during file reading or parsing.
 *
 * @async
 * @function getScenarios
 * @returns {Promise<Object>} A promise that resolves to an object containing scenario data,
 *                            where keys are scenario identifiers and values are the parsed JSON data.
 */
async function getScenarios() {

  const directoryPath = path.resolve(__dirname, 'lib', 'scenarios'); 
  fs.ensureDirSync(path.resolve(__dirname, 'lib', 'scenarios'));
  const globalObject = {};

  try {
    const files = fs.readdirSync(directoryPath);
    const jsonFiles = files.filter(file => path.extname(file) === '.json');
  
    jsonFiles.forEach(file => {
      const filePath = path.join(directoryPath, file);
      try {
        const data = fs.readFileSync(filePath, 'utf8');
        const parsedData = JSON.parse(data);
        const scenario = parsedData.find(item => item.infos.scenario !== undefined);
        if (scenario?.id) {
          globalObject[scenario.infos.scenario] = parsedData;
        }
      } catch (err) {
        error(L.get(["scenario.parsingFileError", file]), err);
      }
    });
    
    return globalObject;
  } catch (err) {
    error(L.get("scenario.folderError"), err);
    return globalObject;
  }

}


/**
 * Asynchronously creates a scenario file based on the provided information.
 *
 * @param {Array<Object>} infos - An array of objects containing scenario information.
 * @returns {Promise<boolean>} A promise that resolves to `true` if a scenario file is created,
 *                             `false` if no scenario is found, or rejects with an error.
 *
 * @throws {Error} If an error occurs during the file creation process.
 */
async function create(infos) {
  // Création du fichier scénario
  const result = await new Promise((resolve, reject) => {
    try {
      const scenario = infos.find(item => item.infos.scenario !== undefined);
      if (scenario) {
        fs.ensureDirSync(path.resolve(__dirname, 'lib', 'scenarios'));
        fs.writeJsonSync(
          path.resolve(__dirname, 'lib', 'scenarios', `${scenario.id}.json`),
          infos,
          { spaces: 2 }
        );
        resolve(true);
      } else {
        resolve(false);
      }
    } catch (err) {
      reject(new Error(err));
    }
  });

  if (result) {
    // Récupérer la clé du scénario créé
    const scenario = infos.find(item => item.infos.scenario !== undefined);
    const scenarioKey = scenario.infos.scenario;

    // Récupérer les jobs existants liés à ce scénario et sauvegarder leur état et flow
    const existingJobs = cronManager.listJobs().filter(job => job.scenarioKey === scenarioKey);
    const jobStates = {};  // Mapping : calendarId -> état (true pour actif, false pour stoppé)
    const oldFlows = {};   // Mapping : calendarId -> ancien flow
    existingJobs.forEach(job => {
      const fullJob = cronManager.getJob(job.id);
      jobStates[job.id] = fullJob.job.isActive; // On récupère l'état réel du job
      oldFlows[job.id] = fullJob.flow;           // Le flow associé au job
      cronManager.removeJob(job.id);
    });

    // Récupérer le scénario complet depuis le fichier (sans filtrer sur enabled)
    const allScenarios = await getScenarios();
    const scenarioNodes = allScenarios[scenarioKey] || [];

    // Pour chaque node de type "calendar", reconstruire le flow via mergeFlow
    const newFlows = [];
    scenarioNodes.forEach(node => {
      if (
        node.Type === "calendar" &&
        node.infos.cron &&
        node.infos.cron.active === true &&
        node.infos.cron.enabled === true
      ) {
        const mergedFlow = mergeFlow(scenarioNodes, node);
        // On garde le flow uniquement s'il se termine par un node "end"
        if (mergedFlow.length && mergedFlow[mergedFlow.length - 1].Type === 'end') {
          newFlows.push(mergedFlow);
        }
      }
    });
    // Créer un mapping de calendarId vers le nouveau flow
    const newFlowMap = {};
    newFlows.forEach(flow => {
      const calendarNode = flow[0];
      newFlowMap[calendarNode.id] = flow;
    });

    // Union des calendarIds provenant des anciens jobs et des nouveaux flows
    const calendarIds = new Set([...Object.keys(oldFlows), ...Object.keys(newFlowMap)]);
    calendarIds.forEach(calendarId => {
      // Utiliser le nouveau flow s'il existe, sinon l'ancien flow
      const flowToUse = newFlowMap[calendarId] || oldFlows[calendarId];
      if (flowToUse) {
        const cronValue = flowToUse[0].infos.cron.value;
        cronManager.addJob(calendarId, cronValue, scenarioKey, flowToUse);
        // Restaurer l'état du job s'il était actif
        if (jobStates.hasOwnProperty(calendarId) && jobStates[calendarId] === true) {
          cronManager.startJob(calendarId);
        }
      }
    });
  }

  // Mise à jour des règles
  Config.scenariosByRules = await getScenariosByRules();

  return result;
}


/**
 * Removes a scenario file by moving it to the trash.
 *
 * @async
 * @function
 * @param {string} scenario - The name of the scenario to remove.
 * @returns {Promise<boolean>} Resolves to `true` if the scenario file was successfully moved to the trash.
 * @throws {Error} Throws an error if the scenario file does not exist or if an unexpected error occurs.
 */
async function remove(scenario) {
  return new Promise(async (resolve, reject) => {
    try {

      const scenarioFile = path.resolve(__dirname, 'lib', 'scenarios', scenario+'.json');
      if (fs.existsSync(scenarioFile)) {
        const data = fs.readJsonSync(scenarioFile, { throws: true });
        const calendarIds = data
        .filter(item => item.Type === "calendar")
        .map(item => item.id);

        calendarIds.forEach(id => cronManager.removeJob(id));

        await shell.trashItem(scenarioFile);
      } else {
        reject(new Error(L.get("scenario.trashError")));
      }
      resolve(true);
    } catch (err) {
      reject(new Error(err));
    }
  })
}


/**
 * Validates a given cron expression.
 *
 * @param {string} expression - The cron expression to validate.
 * @returns {Promise<boolean>} A promise that resolves to `true` if the expression is valid, otherwise `false`.
 */
async function validateCronExpression(expression) {
  return Avatar.Cron.validate(expression);
}


/**
 * Asynchronously tests a task by parsing parameters and invoking a plugin call.
 *
 * @async
 * @function testTask
 * @param {Object} infos - Information object containing task details.
 * @param {string} infos.parameters - A string containing the task parameters to be parsed.
 * @param {string} infos.plugin - The plugin to be called.
 * @param {string} [infos.toClient] - Optional client information to be used if not provided in parameters.
 * @returns {Promise<boolean>} Resolves to `true` if the task is successfully tested, otherwise rejects with an error.
 * @throws {Error} Throws an error if parsing or execution fails.
 */
async function testTask (infos) {
  return new Promise((resolve, reject) => {
    try {
      let objectCode = infos.parameters.replace(/^[^=]*=\s*/, "").trim();  
      objectCode = objectCode.replace(/;$/, "").trim();

      let parameters;
      try {
        parameters = JSON5.parse(objectCode);
      } catch (err) {
        error(L.get("scenario.parsingTaskError"), err);
        return reject(new Error(L.get("scenario.parsingTaskError")));
      }

      const { language, client, toClient, ...action } = parameters;
      parameters = { language, client, toClient, action };

      if (parameters.client === "Define by the rule") {
        parameters.client = Config.default.client;
      }

      if (!parameters.toClient || parameters.toClient === "Define by the rule") {
        parameters.toClient = parameters.client;
      }
      
      Avatar.call(infos.plugin, parameters);
      resolve(true);
    } catch (err) {
      reject(new Error(err));
    }
  });
}


/**
 * Asynchronously invokes the Avatar's speak method with the provided information.
 *
 * @param {Object} infos - The information required for the speak operation.
 * @param {string} infos.tts - The text-to-speech content to be spoken.
 * @param {string} infos.client - The client identifier for the speech operation.
 * @returns {Promise<boolean>} A promise that resolves to `true` if the operation is successful, 
 *                             or rejects with an error if it fails.
 */
async function testSpeak (infos) {
  return new Promise((resolve, reject) => {
    try {
      if (infos.client === "Define by the rule") {
        infos.client = Config.default.client;
      } 
      Avatar.speak(infos.tts, infos.client);
      resolve(true);
    } catch (err) {
      reject(new Error(err));
    }
  })
}


/**
 * Initializes and returns an object containing various scenario library functions.
 *
 * @async
 * @function init
 * @returns {Promise<Object>} A promise that resolves to an object with the following properties:
 * @property {Function} testSpeak - Function to test speech functionality.
 * @property {Function} testTask - Function to test task functionality.
 * @property {Function} validateCronExpression - Function to validate a cron expression.
 * @property {Function} create - Function to create a new scenario.
 * @property {Function} getScenarios - Function to retrieve all scenarios.
 * @property {Function} remove - Function to remove a scenario.
 * @property {Function} getScenariosByRules - Function to retrieve scenarios based on specific rules.
 * @property {Function} cronJobs - Function to manage cron jobs.
 * @property {Function} startAllCronJobs - Function to start all cron jobs.
 * @property {Function} getJobInfo - Function to retrieve information about a specific cron job.
 * @property {Function} startCronJob - Function to start a specific cron job.
 * @property {Function} stopCronJob - Function to stop a specific cron job.
 * @property {Function} restartCronJob - Function to restart a specific cron job.
 */
async function init() {
    return {
        'testSpeak': testSpeak,
        'testTask': testTask,
        'validateCronExpression': validateCronExpression,
        'create': create,
        'getScenarios': getScenarios,
        'remove': remove,
        'getScenariosByRules': getScenariosByRules,
        'cronJobs': cronJobs,
        'startAllCronJobs': startAllCronJobs,
        'getJobInfo': getJobInfo,
        'startCronJob': startCronJob,
        'stopCronJob': stopCronJob,
        'restartCronJob': restartCronJob
    }
}
  

/**
 * Initializes the scenario library.
 */
export { init };