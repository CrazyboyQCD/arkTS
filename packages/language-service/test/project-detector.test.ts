import type { RawFile } from '../src/project/interfaces/directory/rawfile'
import type { ResFile } from '../src/project/interfaces/directory/resfile'
import type { ResourceGroup } from '../src/project/interfaces/directory/resource-group'
import type { Module } from '../src/project/interfaces/module'
import type { Product } from '../src/project/interfaces/product'
import type { ProjectDetector } from '../src/project/interfaces/project-detector'
import type { ElementJsonNameReference } from '../src/project/interfaces/reference/element-json-name'
import type { Resource } from '../src/project/interfaces/resource'
import type { Workspace } from '../src/project/interfaces/workspace'
import path from 'node:path'
import MagicString from 'magic-string'
import * as ets from 'ohos-typescript'
import { describe, expect } from 'vitest'
import { createProjectDetector } from '../src'
import { ResourceDirectory } from '../src/project/interfaces/directory/resource-directory'

describe.sequential('project detector', (it) => {
  let projectDetector: ProjectDetector
  const workspaceFolder = path.resolve(__dirname, 'mock')

  it.sequential('should create project detector', () => {
    projectDetector = createProjectDetector(workspaceFolder)
    expect(projectDetector).toBeDefined()
    expect(projectDetector.getWorkspaceFolder().fsPath).toBe(workspaceFolder)
  })

  let workspace: Workspace

  it.sequential('should get workspace, parse build profile json5 & module.json5', async () => {
    const workspaces = await projectDetector.findWorkspaces()
    expect(workspaces.length).toBeGreaterThanOrEqual(2)
    workspace = workspaces[0]
    const buildProfile = await workspace.getWorkspaceBuildProfile()
    const modulePaths = await buildProfile.getSourceFile(ets)
    expect(modulePaths).toBeDefined()
    expect(modulePaths.getText()).toBe(await buildProfile.readToString())

    const ohPackage = await workspace.getWorkspaceOhPackage()
    const ohPackageSourceFile = await ohPackage.getSourceFile(ets)
    expect(ohPackageSourceFile).toBeDefined()
    expect(ohPackageSourceFile.getText()).toBe(await ohPackage.readToString())
  })

  let ohosModule: Module

  it.sequential('should get modules and resource directories', async () => {
    const modules = await workspace.findModules()
    expect(modules.length).toBeGreaterThanOrEqual(1)
    ohosModule = modules[0]
    const projectBuildProfile = await ohosModule.getProjectBuildProfile()
    const resourceDirectories = await projectBuildProfile.getResourceDirectoriesByTargetName('default')
    expect(resourceDirectories).toBeDefined()
    expect(resourceDirectories?.length).toBeGreaterThanOrEqual(1)
  })

  let product: Product

  it.sequential('should get products and parse module.json5', async () => {
    const products = await ohosModule.findProducts()
    expect(products.length).toBeGreaterThanOrEqual(2)
    product = products[0]
    const moduleConfig = await product.getModuleJson()
    const sourceFile = await moduleConfig.getSourceFile(ets)
    expect(sourceFile).toBeDefined()
    expect(sourceFile.getText()).toBe(await moduleConfig.readToString())
  })

  let resource: Resource
  let rawFile: RawFile
  let resourceGroup: ResourceGroup
  let resFile: ResFile

  it.sequential('should get product resources', async () => {
    const resources = await product.getResources()
    expect(resources.length).toBeGreaterThanOrEqual(1)
    resource = resources[0]
    const resourceDirectories = await resource.getResourceDirectories()

    for (const resourceDirectory of resourceDirectories) {
      switch (resourceDirectory.resourceDirectoryKind) {
        case ResourceDirectory.Kind.RawFile:
          rawFile = resourceDirectory
          break
        case ResourceDirectory.Kind.ResourceGroup:
          resourceGroup = resourceDirectory
          break
        case ResourceDirectory.Kind.ResFile:
          resFile = resourceDirectory
          break
        default:
          throw new Error(`Unknown resource directory kind: ${resourceDirectory}`)
      }
    }

    expect(rawFile).toBeDefined()
    expect(resourceGroup).toBeDefined()
    expect(resFile).toBe(undefined)
  })

  let elementJsonNameReference: ElementJsonNameReference

  it.sequential('should get element json files', async () => {
    const elementDirectory = await resourceGroup.getElement()
    const elementJsonFiles = await elementDirectory.getElementJsonFiles()
    expect(elementJsonFiles).toBeDefined()
    expect(elementJsonFiles.length).toBeGreaterThanOrEqual(1)
    for (const elementJsonFile of elementJsonFiles) {
      const sourceFile = await elementJsonFile.getSourceFile(ets)
      expect(sourceFile).toBeDefined()
      expect(sourceFile.getText()).toBe(await elementJsonFile.readToString())
      const references = await elementJsonFile.getNameReferences(ets)
      elementJsonNameReference = references[0]
    }
  })

  it.sequential('should get element json name reference', async () => {
    expect(elementJsonNameReference).toBeDefined()
    expect(elementJsonNameReference.getKind()).toBeTypeOf('string')
    const fullRange = elementJsonNameReference.getFullRange()
    const textDocument = elementJsonNameReference.getTextDocument()
    const ms = new MagicString(await elementJsonNameReference.getFile().readToString())
    const slicedText = ms.slice(textDocument.offsetAt(fullRange.start), textDocument.offsetAt(fullRange.end))
    expect(slicedText).toBe(elementJsonNameReference.getFullText())
  })
})
