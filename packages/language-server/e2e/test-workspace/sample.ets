@Entry
@Component
struct Index {
  @State message: string = 'Hello ArkTS';

  build() {
    Column() {
      Text(this.message)
        .fontSize(50)
        .fontWeight(FontWeight.Bold)
    }
    .width('100%')
    .height('100%')
  }
}

export default Index