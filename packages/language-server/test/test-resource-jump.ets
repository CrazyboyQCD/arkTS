// 测试资源定义跳转功能
// 请将光标放在 $r() 调用上，然后按 Ctrl+鼠标左键

@Entry
@Component
struct TestPage {
  build() {
    Column() {
      Text('Hello World')
        .fontSize(16)
        .fontColor($r('app.color.bg_color'))  // 这里应该能跳转到 color.json 中的 bg_color 字段
        .backgroundColor($r('app.color.text_color'))  // 这里应该能跳转到 color.json 中的 text_color 字段
      
      Image($r('app.media.icon'))  // 这里应该能跳转到对应的图片文件
        .width(100)
        .height(100)
      
      Text($r('app.string.hello_world'))  // 这里应该能跳转到 string.json 中的 hello_world 字段
        .margin($r('app.float.margin_large'))  // 这里应该能跳转到 float.json 中的 margin_large 字段
      
      // 测试诊断功能：下面的资源引用不存在，应该显示错误/警告
      Text($r('app.string.nonexistent_string'))  // 不存在的资源
        .fontColor($r('app.color.nonexistent_color'))  // 不存在的颜色
      
      // 测试无效格式
      Text($r('invalid.format'))  // 无效的资源引用格式
    }
    .width('100%')
    .height('100%')
  }
}