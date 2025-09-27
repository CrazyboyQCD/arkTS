import type { OpenHarmonyProjectDetector } from '../src/index'
import type { ElementJsonFile, ResourceFolder, ResourceMediaFile } from '../src/project/project'
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
    const openharmonyModules = await childrenProjects?.[0].readOpenHarmonyModules()
    expect(openharmonyModules?.length).toBeGreaterThanOrEqual(1)
    const openharmonyModule = openharmonyModules?.[0]
    expect(openharmonyModule).toBeDefined()
    const moduleJson5Text = await openharmonyModule?.readModuleJson5Text()
    const moduleJson5SourceFile = await openharmonyModule?.readModuleJson5SourceFile(ets)
    expect(moduleJson5Text).toEqual(moduleJson5SourceFile?.getText())

    // check resource child folder exists
    const resourceChildFolders = await openharmonyModule?.readResourceFolder()
    expect(resourceChildFolders).not.toBe(false)
    typeAssert<ResourceFolder[]>(resourceChildFolders)
    expect(resourceChildFolders.length).toBeGreaterThanOrEqual(1)

    // find base folder and check it
    const baseFolder = resourceChildFolders.find(folder => path.basename(folder.getUri().fsPath) === 'base')
    expect(baseFolder).toBeDefined()
    expect(await baseFolder?.isExist()).toBe(true)
    expect(baseFolder?.isBase()).toBe(true)
    expect(baseFolder?.isDark()).toBe(false)
    expect(baseFolder?.isResfile()).toBe(false)
    expect(baseFolder?.isRawfile()).toBe(false)

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

    // check media folder
    const mediaFolder = await resourceChildFolders?.[0].readMediaFolder()
    expect(mediaFolder).not.toBe(false)
    typeAssert<ResourceMediaFile[]>(mediaFolder)
    expect(mediaFolder.length).toBeGreaterThanOrEqual(1)
    const barTxt = mediaFolder.find(file => path.basename(file.getUri().fsPath) === 'bar.txt')
    expect(barTxt).toBeDefined()
    expect(await barTxt?.isExist()).toBe(true)

    // check rawfile folder exists
    const rawfileFolder = resourceChildFolders.find(folder => path.basename(folder.getUri().fsPath) === 'rawfile')
    expect(rawfileFolder).toBeDefined()
    expect(rawfileFolder?.isRawfile()).toBe(true)
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
    const primaryColor = elementNameRangeReference?.find(reference => reference.getName() === 'primary_color')
    expect(primaryColor).toBeDefined()
    expect(primaryColor?.references?.length).toBeGreaterThanOrEqual(1)
  })
})
