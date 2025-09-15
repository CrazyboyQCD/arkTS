import { describe, expect, it } from 'vitest'
import { findResourceCallAtPosition } from '../src/services/resource-definition.service'

describe('$r() 资源调用检测', () => {
  const testLines = [
    'Text($r("app.string.app_name"))',
    '.fontColor($r(\'app.color.primary_color\'))',
    '.backgroundColor($r(`app.color.start_window_background`))',
    'Image($r("app.media.icon"))',
    'normal text without resource call',
  ]

  it('能在点击区域内检测到 $r() 调用并提取资源引用', () => {
    testLines.forEach((line) => {
      const dollarRIndex = line.indexOf('$r(')
      if (dollarRIndex !== -1) {
        const clickPosition = dollarRIndex + 10
        const result = findResourceCallAtPosition(line, clickPosition)
        expect(result, line).not.toBeNull()
        expect(result!.resourceRef.length).toBeGreaterThan(0)
      }
    })
  })

  it('无 $r() 的行返回 null', () => {
    const line = testLines[testLines.length - 1]
    const result = findResourceCallAtPosition(line, 0)
    expect(result).toBeNull()
  })
})
