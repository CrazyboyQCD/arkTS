@Entry
@Component
export struct Index {
  @State message: string = 'Hello World'

  build() {
    RelativeContainer() {
      Text($r('app.string.app_name'))
        .id('HelloWorld')
        .fontSize(50)
        .fontWeight(FontWeight.Bold)
        .alignRules({
          center: { anchor: '__container__', align: VerticalAlign.Center },
          middle: { anchor: '__container__', align: HorizontalAlign.Center }
        })
        .fontColor($r('app.color.primary_color'))
        
      Text($r('app.string.welcome_message'))
        .fontSize(20)
        .fontColor($r('app.color.secondary_color'))
        .margin({ top: 20 })
        
      Button($r('app.string.button_text'))
        .onClick(() => {
          this.message = 'Button clicked!'
        })
        .backgroundColor($r('app.color.start_window_background'))
        .fontColor($r('app.color.primary_color'))
        
      Image($r('app.media.icon'))
        .width(100)
        .height(100)
        
      Text().backgroundColor($r('app.color.start_window_background'))
        .width('100%')
        .height(50)
        .margin({ top: 10 })
        .backgroundColor($r('app.color.start_window_background'))
    }
    .height('100%')
    .width('100%')
  }
}