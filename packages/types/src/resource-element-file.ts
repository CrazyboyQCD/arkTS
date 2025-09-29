/**
 * Main interface for resource element files
 * Can only contain one of the following properties
 */
export interface ResourceElementFile {
  /** Color resource array */
  color?: ResourceElementFile.ColorItem[]
  /** String resource array */
  string?: ResourceElementFile.StringItem[]
  /** Integer resource array */
  integer?: ResourceElementFile.IntegerItem[]
  /** Float resource array */
  float?: ResourceElementFile.FloatItem[]
  /** Integer array resource array */
  intarray?: ResourceElementFile.IntArrayItem[]
  /** Boolean resource array */
  boolean?: ResourceElementFile.BooleanItem[]
  /** Plural resource array */
  plural?: ResourceElementFile.PluralItem[]
  /** Pattern resource array */
  pattern?: ResourceElementFile.PatternItem[]
  /** String array resource array */
  strarray?: ResourceElementFile.StrArrayItem[]
  /** Theme resource array */
  theme?: ResourceElementFile.ThemeItem[]
}

export namespace ResourceElementFile {
  /**
   * Color resource item
   */
  export interface ColorItem {
  /** Color name, can only contain numbers, letters and underscores, max length 79 */
    name: string
    /** Color value, supports hexadecimal color codes or variable references */
    value: string
    /** Comment description */
    comment?: string
  }

  /**
   * String resource item value type
   */
  export type StringValue = string | StringValueItem[]

  /**
   * String resource item value object
   */
  export interface StringValueItem {
  /** Value ID, can only contain numbers, letters and underscores, max length 78 */
    id: string
    /** Value content */
    value: string
    /** Example description */
    example?: string
  }

  /**
   * String resource item
   */
  export interface StringItem {
  /** String name, can only contain numbers, letters and underscores, max length 78 */
    name: string
    /** String value, can be a string or array of string value objects */
    value: StringValue
    /** Comment description */
    comment?: string
  }

  /**
   * Float resource item
   */
  export interface FloatItem {
  /** Float name, can only contain numbers, letters and underscores, max length 79 */
    name: string
    /** Float value, supports values with units or variable references */
    value: string
    /** Comment description */
    comment?: string
  }

  /**
   * Integer array resource item
   */
  export interface IntArrayItem {
  /** Array name, can only contain numbers, letters and underscores, max length 76 */
    name: string
    /** Integer value array, can be integers or variable references */
    value: (number | string)[]
    /** Comment description, max length 255 */
    comment?: string
  }

  /**
   * Integer resource item
   */
  export interface IntegerItem {
  /** Integer name, can only contain numbers, letters and underscores, max length 77 */
    name: string
    /** Integer value, can be an integer or variable reference */
    value: number | string
    /** Comment description */
    comment?: string
  }

  /**
   * Pattern resource item value object
   */
  export interface PatternValueItem {
  /** Pattern name, max length 77 */
    name: string
    /** Pattern value */
    value: string
    /** Comment description */
    comment?: string
  }

  /**
   * Pattern resource item
   */
  export interface PatternItem {
  /** Pattern name, can only contain numbers, letters and underscores, max length 77 */
    name: string
    /** Pattern value array */
    value: PatternValueItem[]
    /** Parent pattern */
    parent?: string
    /** Comment description */
    comment?: string
  }

  /**
   * Plural resource item value object
   */
  export interface PluralValueItem {
  /** Quantity type */
    quantity: string
    /** Value content, can be a string or array of string value objects */
    value: StringValue
    /** Comment description */
    comment?: string
  }

  /**
   * Plural resource item
   */
  export interface PluralItem {
  /** Plural name, can only contain numbers, letters and underscores, max length 78 */
    name: string
    /** Plural value array */
    value: PluralValueItem[]
    /** Comment description */
    comment?: string
  }

  /**
   * String array resource item value object
   */
  export interface StrArrayValueItem {
  /** Value content, can be a string or array of string value objects */
    value: StringValue
  }

  /**
   * String array resource item
   */
  export interface StrArrayItem {
  /** Array name, can only contain numbers, letters and underscores, max length 76 */
    name: string
    /** String value array */
    value: StrArrayValueItem[]
    /** Comment description */
    comment?: string
  }

  /**
   * Boolean resource item
   */
  export interface BooleanItem {
  /** Boolean name, can only contain numbers, letters and underscores, max length 77 */
    name: string
    /** Boolean value, can be a boolean or variable reference */
    value: boolean | string
    /** Comment description */
    comment?: string
  }

  /**
   * Theme resource item value object
   */
  export interface ThemeValueItem {
  /** Theme name, max length 79 */
    name: string
    /** Theme value */
    value: string
    /** Comment description */
    comment?: string
  }

  /**
   * Theme resource item
   */
  export interface ThemeItem {
  /** Theme name, can only contain numbers, letters and underscores, max length 79 */
    name: string
    /** Theme value array */
    value: ThemeValueItem[]
    /** Whether it's a remote theme */
    remote?: 'true' | 'false'
    /** Parent theme */
    parent?: string
    /** Comment description */
    comment?: string
  }
}
