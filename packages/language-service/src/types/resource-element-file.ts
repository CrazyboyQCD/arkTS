/**
 * 资源元素文件的TypeScript接口定义
 * 基于str.schema.json的JSON Schema转换而来
 */

/**
 * 颜色资源项
 */
export interface ColorItem {
  /** 颜色名称，只能包含数字、字母和下划线，最大长度79 */
  name: string
  /** 颜色值，支持十六进制颜色代码或引用变量 */
  value: string
  /** 注释说明 */
  comment?: string
}

/**
 * 字符串资源项的值类型
 */
export type StringValue = string | StringValueItem[]

/**
 * 字符串资源项的值对象
 */
export interface StringValueItem {
  /** 值ID，只能包含数字、字母和下划线，最大长度78 */
  id: string
  /** 值内容 */
  value: string
  /** 示例说明 */
  example?: string
}

/**
 * 字符串资源项
 */
export interface StringItem {
  /** 字符串名称，只能包含数字、字母和下划线，最大长度78 */
  name: string
  /** 字符串值，可以是字符串或字符串值对象数组 */
  value: StringValue
  /** 注释说明 */
  comment?: string
}

/**
 * 浮点数资源项
 */
export interface FloatItem {
  /** 浮点数名称，只能包含数字、字母和下划线，最大长度79 */
  name: string
  /** 浮点数值，支持带单位的数值或引用变量 */
  value: string
  /** 注释说明 */
  comment?: string
}

/**
 * 整数数组资源项
 */
export interface IntArrayItem {
  /** 数组名称，只能包含数字、字母和下划线，最大长度76 */
  name: string
  /** 整数值数组，可以是整数或引用变量 */
  value: (number | string)[]
  /** 注释说明，最大长度255 */
  comment?: string
}

/**
 * 整数资源项
 */
export interface IntegerItem {
  /** 整数名称，只能包含数字、字母和下划线，最大长度77 */
  name: string
  /** 整数值，可以是整数或引用变量 */
  value: number | string
  /** 注释说明 */
  comment?: string
}

/**
 * 模式资源项的值对象
 */
export interface PatternValueItem {
  /** 模式名称，最大长度77 */
  name: string
  /** 模式值 */
  value: string
  /** 注释说明 */
  comment?: string
}

/**
 * 模式资源项
 */
export interface PatternItem {
  /** 模式名称，只能包含数字、字母和下划线，最大长度77 */
  name: string
  /** 模式值数组 */
  value: PatternValueItem[]
  /** 父级模式 */
  parent?: string
  /** 注释说明 */
  comment?: string
}

/**
 * 复数资源项的值对象
 */
export interface PluralValueItem {
  /** 数量类型 */
  quantity: string
  /** 值内容，可以是字符串或字符串值对象数组 */
  value: StringValue
  /** 注释说明 */
  comment?: string
}

/**
 * 复数资源项
 */
export interface PluralItem {
  /** 复数名称，只能包含数字、字母和下划线，最大长度78 */
  name: string
  /** 复数值数组 */
  value: PluralValueItem[]
  /** 注释说明 */
  comment?: string
}

/**
 * 字符串数组资源项的值对象
 */
export interface StrArrayValueItem {
  /** 值内容，可以是字符串或字符串值对象数组 */
  value: StringValue
}

/**
 * 字符串数组资源项
 */
export interface StrArrayItem {
  /** 数组名称，只能包含数字、字母和下划线，最大长度76 */
  name: string
  /** 字符串值数组 */
  value: StrArrayValueItem[]
  /** 注释说明 */
  comment?: string
}

/**
 * 布尔值资源项
 */
export interface BooleanItem {
  /** 布尔值名称，只能包含数字、字母和下划线，最大长度77 */
  name: string
  /** 布尔值，可以是布尔值或引用变量 */
  value: boolean | string
  /** 注释说明 */
  comment?: string
}

/**
 * 主题资源项的值对象
 */
export interface ThemeValueItem {
  /** 主题名称，最大长度79 */
  name: string
  /** 主题值 */
  value: string
  /** 注释说明 */
  comment?: string
}

/**
 * 主题资源项
 */
export interface ThemeItem {
  /** 主题名称，只能包含数字、字母和下划线，最大长度79 */
  name: string
  /** 主题值数组 */
  value: ThemeValueItem[]
  /** 是否为远程主题 */
  remote?: 'true' | 'false'
  /** 父级主题 */
  parent?: string
  /** 注释说明 */
  comment?: string
}

/**
 * 资源元素文件的主接口
 * 只能包含以下属性中的一个
 */
export interface ResourceElementFile {
  /** 颜色资源数组 */
  color?: ColorItem[]
  /** 字符串资源数组 */
  string?: StringItem[]
  /** 整数资源数组 */
  integer?: IntegerItem[]
  /** 浮点数资源数组 */
  float?: FloatItem[]
  /** 整数数组资源数组 */
  intarray?: IntArrayItem[]
  /** 布尔值资源数组 */
  boolean?: BooleanItem[]
  /** 复数资源数组 */
  plural?: PluralItem[]
  /** 模式资源数组 */
  pattern?: PatternItem[]
  /** 字符串数组资源数组 */
  strarray?: StrArrayItem[]
  /** 主题资源数组 */
  theme?: ThemeItem[]
}
