import ActionInterface from '../ActionInterface'
import {getInput} from '@actions/core'
import {existsSync, mkdirSync} from 'fs'
import {execCommand} from '../helpers'
import GitInfo from '../GitInfo'
import GeneratorInterface from '../GeneratorInterface'
import {basename, dirname} from 'path'

export default class CloneWikiAction implements ActionInterface {
  /**
   * @inheritDoc
   */
  getDescription(): string {
    return 'Cloning old wiki...'
  }

  /**
   * @inheritDoc
   */
  shouldRun(): boolean {
    return true
  }

  /**
   * @inheritDoc
   */
  exec(generator: GeneratorInterface, gitInfo: GitInfo): void {
    const oldDocsDir = this.getOldDocsPath()
    if (existsSync(oldDocsDir)) {
      throw new Error(oldDocsDir.concat(" already exists but shouldn't"))
    }
    mkdirSync(oldDocsDir)
    execCommand(
      'git',
      [
        'clone',
        `https://${this.getUpdateUser()}:${this.getUpdateToken()}@github.com/${gitInfo.getCurrentRepositoryName()}.wiki.git`,
        basename(oldDocsDir)
      ],
      dirname(oldDocsDir)
    )
    execCommand('git', ['config', '--local', 'gc.auto', '0'], oldDocsDir)
    execCommand('git', ['branch', '-r'], oldDocsDir)
    if (this.branchExist(gitInfo.branchOrTagName, oldDocsDir)) {
      execCommand('git', ['checkout', gitInfo.branchOrTagName], oldDocsDir)
      execCommand('git', ['pull'], oldDocsDir)
    } else {
      execCommand(
        'git',
        ['checkout', '-b', gitInfo.branchOrTagName],
        oldDocsDir
      )
    }
  }

  /**
   * Checks if branch exist
   *
   * @param string branch Branch to check
   * @param string oldDocsDir Where to check
   *
   * @return boolean
   */
  private branchExist(branch: string, oldDocsDir: string): boolean {
    try {
      execCommand('git', ['show-branch', 'origin/'.concat(branch)], oldDocsDir)
      return true
    } catch (e) {
      return false
    }
  }

  /**
   * Gets GitHub token that will be used for update action
   */
  protected getUpdateToken(): string {
    return getInput('wiki_github_update_token')
  }

  /**
   * Get GitHub user for witch token belongs
   */
  protected getUpdateUser(): string {
    return getInput('wiki_github_update_user')
  }

  /**
   * Get old docs path
   */
  protected getOldDocsPath(): string {
    return getInput('temp_docs_folder').concat('.old')
  }
}
