import type { OpenHarmonyProjectDetector } from '../src/index'
import type { ElementJsonFile, ResourceFolder } from '../src/project/project'
import path from 'node:path'
import { typeAssert } from '@arkts/shared'
import * as ets from 'ohos-typescript'
import { describe, expect } from 'vitest'
import { URI, Utils } from 'vscode-uri'
import { createOpenHarmonyProjectDetector, ModuleOpenHarmonyProject, WorkspaceOpenHarmonyProject } from '../src/index'

describe('project-detector', (it) => {
  let openHarmonyProjectDetector: OpenHarmonyProjectDetector
  const workspaceFolder = URI.file(path.resolve(__dirname, 'mock', 'workspace'))
  const workspaceFolderProject1 = Utils.joinPath(workspaceFolder, 'harmony-project-1')
  const testingRawfile = 'nest-folder/foo.txt'

  it.sequential('should create', () => {
    openHarmonyProjectDetector = createOpenHarmonyProjectDetector(workspaceFolder)
    expect(openHarmonyProjectDetector).toBeDefined()
  })

  it.sequential('should find projects & resources completely', async () => {
    const projects = await openHarmonyProjectDetector.findProjects()
    const workspaceProjectCount = projects.filter(project => WorkspaceOpenHarmonyProject.is(project)).length
    const moduleProjectCount = projects.filter(project => ModuleOpenHarmonyProject.is(project)).length
    expect(workspaceProjectCount).toBe(2)
    expect(moduleProjectCount).toBe(2)
    expect(projects.length).toBe(workspaceProjectCount + moduleProjectCount)

    // check workspace project
    const workspaceProject1 = projects.find(project => WorkspaceOpenHarmonyProject.is(project) && project.getProjectRoot().fsPath === workspaceFolderProject1.fsPath) as WorkspaceOpenHarmonyProject | undefined
    expect(workspaceProject1).toBeDefined()
    expect(workspaceProject1?.projectType).toBe('workspace')

    // check module project
    // check children projects
    const childrenProjects = await workspaceProject1?.getChildrenProjects()
    expect(childrenProjects).toHaveLength(1)

    // check resource folder exists
    expect(childrenProjects?.[0]?.projectType).toBe('module')

    // check resource child folder exists
    const resourceChildFolder = await childrenProjects?.[0].readResourceFolder()
    expect(resourceChildFolder).not.toBe(false)
    typeAssert<ResourceFolder[]>(resourceChildFolder)
    expect(resourceChildFolder.length).toBeGreaterThanOrEqual(1)

    // find base folder and check it
    const baseFolder = resourceChildFolder.find(folder => path.basename(folder.getUri().fsPath) === 'base')
    expect(baseFolder).toBeDefined()
    expect(await baseFolder?.isExist()).toBe(true)

    // check base/element folder exists
    const elementFolder = await baseFolder?.readElementFolder()
    expect(elementFolder).not.toBe(false)
    typeAssert<ElementJsonFile[]>(elementFolder)
    expect(elementFolder.length).toBeGreaterThanOrEqual(1)

    // pick the first element folder and check it
    const firstElementFolder = elementFolder[0]
    expect(firstElementFolder).toBeDefined()
    const jsonText = await firstElementFolder.readJsonText()
    expect(jsonText).toBeDefined()
    const jsonSourceFile = await firstElementFolder.readJsonSourceFile(ets)
    expect(jsonSourceFile).toBeDefined()
    expect(jsonSourceFile.getText()).toEqual(jsonText)
    const nameRanges = await firstElementFolder.getNameRange(ets)
    expect(nameRanges.length).toBeGreaterThanOrEqual(1)

    // check rawfile folder exists
    const rawfileFolder = resourceChildFolder.find(folder => path.basename(folder.getUri().fsPath) === 'rawfile')
    expect(rawfileFolder).toBeDefined()
    expect(await rawfileFolder?.isExist()).toBe(true)
    const rawFiles = await rawfileFolder?.readRawFile()
    expect(rawFiles?.length).toBeGreaterThanOrEqual(1)
    const fooTxt = rawFiles?.find(file => path.basename(file.getUri().fsPath) === 'foo.txt')
    expect(fooTxt).toBeDefined()
    expect(await fooTxt?.isExist()).toBe(true)
    expect(fooTxt?.getRelativePath()).toBe(testingRawfile)

    // completion text test
    // empty input, will return the first path segment
    expect(fooTxt?.getCompletionText('')).toMatchInlineSnapshot(`"nest-folder"`)
    // no complete, will return the completion text
    expect(fooTxt?.getCompletionText('nest-fo')).toMatchInlineSnapshot(`"lder"`)
    // complete, will return the current input
    expect(fooTxt?.getCompletionText('nest-folder')).toMatchInlineSnapshot(`"nest-folder"`)
    // when with trailing slash will return the completion text
    expect(fooTxt?.getCompletionText('nest-folder/')).toMatchInlineSnapshot(`"foo.txt"`)
    // no complete, will return the completion text
    expect(fooTxt?.getCompletionText('nest-folder/foo.t')).toMatchInlineSnapshot(`"xt"`)
    // complete, will return the current input
    expect(fooTxt?.getCompletionText('nest-folder/foo.txt')).toMatchInlineSnapshot(`"nest-folder/foo.txt"`)

    // check element name range reference
    const elementNameRangeReference = await baseFolder?.getElementNameRangeReference(ets)
    expect(elementNameRangeReference).toBeDefined()
    expect(elementNameRangeReference?.length).toBeGreaterThanOrEqual(1)
    const primaryColor = elementNameRangeReference?.find(reference => reference.name === 'primary_color')
    expect(primaryColor).toBeDefined()
    expect(primaryColor?.references?.length).toBeGreaterThanOrEqual(1)
  })
})
