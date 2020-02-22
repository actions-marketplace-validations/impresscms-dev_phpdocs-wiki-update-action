import {debug, getInput, info} from '@actions/core'
import {spawnSync} from 'child_process'
import GeneratorInterface from './GeneratorInterface'
import ActionInterface from './ActionInterface'
import path from 'path'
import {readFileSync} from 'fs'
import GitInfo from './GitInfo'

/**
 * Validates generator data
 *
 * @param object generator Generator to validate
 */
export function validateGenerator(generator: GeneratorInterface): void {
  if (!generator.checkIfAllInputOptionsDefined()) {
    throw new TypeError(
      'Not all required arguments defined for selected engine'
    )
  }
}

/**
 * Executes command and prints to debug results
 *
 * @param string cmd  Command to be executed
 * @param Array<string> args Command arguments
 * @param string cwd Where to execute
 */
export function execCommand(cmd: string, args: string[], cwd: string): void {
  debug(
    spawnSync(cmd, args, {
      cwd
    }).output.toString()
  )
}

/**
 * Makes generator instance
 */
export async function makeGeneratorInstance(
  engineName: string
): Promise<GeneratorInterface> {
  const signature = (await import(`./generators/${engineName}`)).default
  return new signature()
}

/**
 * Gets engine name
 */
export function getSelectedEngineName(): string {
  //return 'phpdoc-md'
  return getInput('engine')
}

/**
 * Loads action
 *
 * @param string action Action name
 */
export async function loadAction(action: string): Promise<ActionInterface> {
  const signature = (await import(`./actions/${action}`)).default
  return new signature()
}

/**
 * JSON content cache
 */
let jsonContent: any = null

/**
 * Reads package JSON file
 */
export function readPackageJSON(): { actions: string[] } {
  if (jsonContent === null) {
    const filename = path.resolve(__dirname, '..', 'package.json')
    const contentText = readFileSync(filename).toString()
    jsonContent = JSON.parse(contentText)
  }
  return jsonContent
}

/**
 * Gets actions names defined in package.json
 */
export function getActionsNames(): string[] {
  return readPackageJSON().actions
}

/**
 * Get all actions instances
 */
export async function getAllActionsInstances(): Promise<ActionInterface[]> {
  const actions = []
  for (const name of getActionsNames()) {
    actions.push(await loadAction(name))
  }
  return actions
}

/**
 * Executes generator
 *
 * @param string generatorName Generator name
 */
export async function execGenerator(generatorName: string): Promise<void> {
  const generator = await makeGeneratorInstance(generatorName)
  validateGenerator(generator)
  const gitInfo = GitInfo.createInstance()
  const actions = await getAllActionsInstances()
  for (const action of actions) {
    if (!action.shouldRun(generator, gitInfo)) {
      continue
    }
    const desc = action.getDescription()
    if (desc !== null) {
      info(desc)
    }
    action.exec(generator, gitInfo)
  }
}