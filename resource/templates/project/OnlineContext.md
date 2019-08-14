# 线上环境一些基础数据获取

- 相关对象

```javascript
const ConfigManager = require('../lib/config_manager.js')
const NebUtil = require('../lib/neb_util.js')
```

- 获取某合约地址的发布地址
```javascript
let address = ConfigManager.getOnlineContractAddress(MyContract)
```

- 获取某地址的账户信息
```javascript
let accountInfo = await NebUtil.testnet.getAccountInfo(address)
```
