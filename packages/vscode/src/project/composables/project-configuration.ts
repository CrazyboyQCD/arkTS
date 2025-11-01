import type { FormRules } from 'naive-ui'
import type { Ref } from 'vue'
import path from 'node:path'
import { ref, watch } from 'vue'

export interface Input {
  label: string
  labelIcon?: string
}

export interface TextInput extends Input {
  type: 'text'
  value?: string
  placeholder?: string
  required?: boolean
}

export interface SelectInput<T extends string | number = string | number> extends Input {
  type: 'select'
  options: { value: T, label: string }[]
  value?: T
  placeholder?: string
  required?: boolean
}

export interface CheckboxInput extends Input {
  type: 'checkbox'
  options: { value: string, label: string }[]
  value?: string[]
  placeholder?: string
  required?: boolean
}

export type ProjectInput = TextInput | SelectInput | CheckboxInput

export interface ProjectConfiguration {
  title: string
  description: string
  icon?: string
  id: string
  input: {
    [key: string]: ProjectInput
  }
  rules?: FormRules
  onChange?(input: ProjectConfiguration): void
}

export interface ProjectConfigurationContext {
  projectConfigurations: Ref<ProjectConfiguration[]>
  currentProjectId: Ref<string>
  currentProject: Ref<ProjectConfiguration>
}

export async function useProjectConfiguration(): Promise<ProjectConfigurationContext> {
  const { t } = useI18n()

  const projectConfigurations = ref<ProjectConfiguration[]>([
    {
      title: 'Empty Ability',
      description: '此模板实现基础的Hello World功能。',
      icon: 'i-ph-cube-duotone',
      id: 'empty-ability',
      rules: {
        savePath: {
          async asyncValidator(_rule, value: TextInput, callback) {
            if (!value.value) return callback('请输入保存路径')
            callback(await window.connection.checkPathExists(value.value) ? undefined : '保存路径不存在')
          },
        },
      },
      input: {
        projectName: {
          type: 'text',
          value: 'MyApplication',
          placeholder: '请输入项目名称',
          label: t('project.createProject.projectName'),
          labelIcon: 'i-ph-pen-duotone',
          required: true,
        },
        bundleName: {
          type: 'text',
          value: 'com.example.myapplication',
          placeholder: '请输入包名',
          label: t('project.createProject.bundleName'),
          labelIcon: 'i-ph-package-duotone',
          required: true,
        },
        savePath: {
          type: 'text',
          value: path.join(await window.connection.getHomeDirectory(), 'DevEcoStudioProjects', 'MyApplication'),
          placeholder: '请输入保存路径',
          label: t('project.createProject.savePath'),
          labelIcon: 'i-ph-folder-duotone',
          required: true,
        },
        compatibleSdkVersion: {
          type: 'select',
          options: [
            { value: 20, label: 'API20' },
            { value: 18, label: 'API18' },
            { value: 15, label: 'API15' },
            { value: 14, label: 'API14' },
            { value: 13, label: 'API13' },
            { value: 12, label: 'API12' },
            { value: 11, label: 'API11' },
            { value: 10, label: 'API10' },
          ],
          label: t('project.createProject.compatibleSdkVersion'),
          value: 20,
          labelIcon: 'i-ph-cpu-duotone',
          required: true,
        },
        moduleName: {
          type: 'text',
          value: 'entry',
          placeholder: '请输入模块名称',
          label: t('project.createProject.moduleName'),
          labelIcon: 'i-ph-bandaids-duotone',
          required: true,
        },
        deviceType: {
          type: 'checkbox',
          label: t('project.createProject.deviceType'),
          labelIcon: 'i-ph-device-mobile-camera-duotone',
          options: [
            { value: 'phone', label: 'Phone' },
            { value: 'tablet', label: 'Tablet' },
            { value: '2in1', label: '2in1' },
          ],
          value: ['phone', 'tablet'],
        },
      },
      onChange(input) {
        console.warn(input)
      },
    },
  ])
  const currentProjectId = ref<string>(projectConfigurations.value[0].id)
  const currentProject = ref<ProjectConfiguration>(projectConfigurations.value.find(item => item.id === currentProjectId.value)!)

  watch(currentProject, newVal => newVal.onChange?.(newVal), { deep: true })

  return {
    projectConfigurations,
    currentProjectId,
    currentProject,
  }
}
