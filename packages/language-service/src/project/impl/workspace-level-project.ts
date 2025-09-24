import type { WorkspaceOpenHarmonyProject } from '../project'
import { ModuleOpenHarmonyProject } from '../project'
import { OpenHarmonyProjectImpl } from './openharmony-project'

export class WorkspaceOpenHarmonyProjectImpl extends OpenHarmonyProjectImpl implements WorkspaceOpenHarmonyProject {
  projectType = 'workspace' as const

  async getChildrenProjects(): Promise<ModuleOpenHarmonyProject[]> {
    const projects = await this.getProjectDetector().findProjects()
    const moduleProjects = projects.filter(project => ModuleOpenHarmonyProject.is(project))

    const childrenProjects: ModuleOpenHarmonyProject[] = []

    for (const moduleProject of moduleProjects) {
      if (!await moduleProject.is())
        continue
      if (!moduleProject.getProjectRoot().fsPath.startsWith(this.getProjectRoot().fsPath))
        continue
      childrenProjects.push(moduleProject)
    }

    return childrenProjects
  }
}
