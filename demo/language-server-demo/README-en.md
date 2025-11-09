# ArkTS Language Server Demo

This is a demonstration program for testing the ArkTS Language Server. It can perform project initialization and real communication to observe whether its behavior is correct.

## Features

- 📦 Automatic demo project initialization
- 🔌 Establish real connections with the language server
- 💬 Execute basic LSP communication tests
- 📝 Log all communication processes
- ✅ Verify language server responses

## Prerequisites

Before running this demo, make sure:

1. The language server has been built:
   ```bash
   cd /path/to/arkTS
   pnpm install
   pnpm -F "@arkts/language-server" build
   ```

2. OpenHarmony SDK path is configured (optional, for full functionality testing)

## Installation

```bash
cd demo/language-server-demo
npm install
```

## Running the Demo

```bash
npm start
```

Or run directly:

```bash
node client.js
```

## Demo Content

This demo will perform the following operations:

1. **Project Initialization**
   - Create sample ArkTS project structure
   - Generate necessary configuration files
   - Create sample `.ets` files

2. **Language Server Startup**
   - Start ArkTS Language Server process
   - Establish JSON-RPC communication channel

3. **Initialize Request**
   - Send `initialize` request
   - Send `ets/waitForEtsConfigurationChangedRequested` configuration
   - Send `initialized` notification

4. **Feature Testing**
   - Document open test
   - Code completion test
   - Hover information test
   - Diagnostic information test

5. **Close Connection**
   - Send `shutdown` request
   - Send `exit` notification

## Configuration

You can modify the following configuration in `client.js`:

```javascript
const config = {
  sdkPath: '/path/to/openharmony/sdk',  // OpenHarmony SDK path
  tsdk: '/path/to/typescript/lib',       // TypeScript SDK path
};
```

## Output Logs

The demo program outputs detailed log information, including:

- 🚀 Startup information
- 📤 Sent requests
- 📥 Received responses
- ❌ Error messages
- ✅ Success messages

## Troubleshooting

### Language Server Not Starting

Make sure the language server has been built:
```bash
cd /path/to/arkTS
pnpm -F "@arkts/language-server" build
```

### SDK Path Error

If the SDK path is not configured, some features may not work properly. Please refer to the main project documentation to configure the OpenHarmony SDK.

### Port Occupied

If you encounter a port occupation problem, you can modify the port configuration in `client.js`.

## Development and Debugging

To enable debug mode, add debug parameters when starting:

```bash
node --inspect client.js
```

Then use Chrome DevTools or VS Code for debugging.

## Related Documentation

- [Language Server Protocol Specification](https://microsoft.github.io/language-server-protocol/)
- [ArkTS Official Documentation](https://developer.huawei.com/consumer/cn/arkts)
- [Volar Framework Documentation](https://volarjs.dev/)

## License

MIT
