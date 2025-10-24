import { MyCustomComponent } from 'sample-library'

class MyLazyDataSource implements IDataSource {
  getData(index: number): number {
    return index + 1;
  }

  totalCount(): number {
    return 100;
  }

  registerDataChangeListener(listener: DataChangeListener): void {
    // Implement data change listener registration if needed
  }

  unregisterDataChangeListener(listener: DataChangeListener): void {
    // Implement data change listener unregistration if needed
  }
}


@Entry
@Component
struct Index {
  @State
  message: ESObject = 'Hello World';

  build() {
    Row() {
      Column() {
        Text($r('app.string.welcome_message'))
          .fontSize(50)
          .fontWeight(FontWeight.Bold)
          .textAlign(TextAlign.Center)
          .fontColor($r('app.string.EntryAbility_desc'))

        Text($r('app.string.app_name'))
          .fontSize(20)
          .fontColor($r('app.color.primary_color'))
          .margin({ top: 10 })

        Text(this.message)
          .fontSize(30)
          .fontWeight(FontWeight.Bold)
          .textAlign(TextAlign.Center)
          .margin({ top: 20 })

        MyCustomComponent()
      }.width('100%')
        .height(200)
        .accessibilityDescription('Test')
        .align(Alignment.Center)

      ForEach([1, 2, 3, 4], (item: string) => {
        Column() {
          Row() {
            Text(item.toString())
              .fontColor($r('sys.symbol.fund'))
          }.margin(10)
          .height(20)
        }
      })

      LazyForEach(new MyLazyDataSource(), (item) => {
        Column() {
          Row() {
            Text(item.toString())
            Text().backgroundColor($r('app.color.start_window_background'))
          }
        }
      })
    }.height('100%')
      .backgroundColor($r('app.color.start_window_background'))
  }
}
