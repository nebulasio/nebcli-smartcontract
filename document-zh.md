# 使用流程

此工具与 vscode 配合使用较好，所以开发环境以 vscode 为例。
(vscode 的 js 语法检查插件建议用 eslint 不要用 jslint, 另外TabNine插件不错，可以尝试安装)

## 1. 创建并初始化工程，并添加一个名为 MyContract 的合约。

```
mkdir DemoProject

cd DemoProject

nebdev init MyContract

code .
```

初始化时可以创建多个合约，合约名用空格隔开即可

如还需要添加合约执行如下命令（例 添加 Contract1 和 Contract2）

```
nebdev add Contract1 Contract2
```


## 2. 编写合约代码

src/MyContract/main.js 为MyContract合约代码

前8行为本地模拟环境代码，方便代码编写时智能提示及调试，生成发布合约时会自动去除。

``` javascript
/** Local simulation environment code; Do not modify */
const neblocal = require('../../lib/neblocal')
const crypto = require('../../lib/crypto')
const BigNumber = require('bignumber.js')
const Blockchain = neblocal.Blockchain
const LocalContractStorage = neblocal.LocalContractStorage
const Event = neblocal.Event
/** Local simulation environment code; End. */


class MyContract {
    constructor() {
        // You need to ensure that each contract has a different __contractName
        this.__contractName = "MyContract"
    }

    init () {
    }

    accept() {
        Event.Trigger('transfer', {
            from: Blockchain.transaction.from,
            to: Blockchain.transaction.to,
            value: Blockchain.transaction.value,
        })
    }
}

module.exports = MyContract
```

添加简单的存取数据的方法：
``` javascript
/** Local simulation environment code; Do not modify */
const neblocal = require('../../lib/neblocal')
const crypto = require('../../lib/crypto')
const BigNumber = require('bignumber.js')
const Blockchain = neblocal.Blockchain
const LocalContractStorage = neblocal.LocalContractStorage
const Event = neblocal.Event
/** Local simulation environment code; End. */


class MyContract {
    constructor() {
        // You need to ensure that each contract has a different __contractName
        this.__contractName = "MyContract"

        // 定义一个存储
        LocalContractStorage.defineProperty(this, 'data', null)
    }

    init () {
    }

    accept() {
        Event.Trigger('transfer', {
            from: Blockchain.transaction.from,
            to: Blockchain.transaction.to,
            value: Blockchain.transaction.value,
        })
    },

    // 保存数据
    setData: function (data) {
        this.data = data
    },

    // 获取数据
    getData: function () {
        return this.data
    }
}

module.exports = MyContract
```


## 3. 生成辅助代码

```
nebdev generate
```

执行此命令后会生成一些文件
- config 包含自动化测试相关配置 (后续详解)
- test/data 包含本地模拟环境数据 及 用于测试的一些账号列表(keys.json)
- test/contracts/MyContract/local.js 用于本地模拟环境测试的合约封装类 (此类自动生成，不要修改)
- test/contracts/MyContract/online.js 用于线上环境（testnet|mainnet）测试的合约封装类 (此类自动生成，不要修改)
- test/local_main.js 本地模拟环境测试主文件
- test/online_main.js 线上环境测试主文件

如果使用VSCode, 可以安装插件, 保存合约代码时会自动调用 nebdev generate;  
VSCode 插件名为 'nebulas'

## 4. 本地模拟环境测试及调试

- 本地模拟环境，模拟了链上合约中各api，并用本地文件系统模拟链上存储。
- 合约代码断点调试功能只能在本地模拟环境中使用，可以修改代码后即时查看运行效果，不用发布合约到链上。
- 本地模拟环境中，可调试解决大部语法及业务逻辑问题，最终还需在链上环境测试。

经过步骤3 本地模拟环境合约封装类已经自动导入到 local_main.js 中 如下：
``` javascript
/** Automatically generated code, please do not modify. */
const MyContract = require('./contracts/MyContract/local.js')
/** Automatically generated code; End. */
```

在 local_main.js 中添加如下测试代码:

``` javascript
function test() {
    // 发布合约
    MyContract._deploy()

    // 调用合约方法 setData
    MyContract.setData('hello world!')

    // 调用合约方法 getData 获取结果 并打印
    let result = MyContract.getData()
    console.log(result)
}

test()
```

还可在调用合约的同时设置合约调用者，及调用时的转账金额：

``` javascript
MyContract
    ._setAccount(TestKeys.caller)           // 设置调用者 （不设置时，默认值即为TestKeys.caller）
    ._setValue(new BigNumber(10).pow(18))   // 转账 1 NAS
    .setData('hello world!')                // 调用合约的 setData 方法
```

TestKeys 为自动生成的测试账号的封装类有如下成员, 对应 test/data/keys.json 中各账号
``` javascript
TestKeys.deployer   // 默认合约发布者
TestKeys.caller     // 默认合约调用者
TestKeys.otherKeys  // 其他10个测试账号
```

点击 vscode 左侧的调试按钮 (默认布局在左侧的小虫子图标), 然后选择 LocalMain, 点击运行图标即可启动调试。

输出结果 
```
hello world!
```


## 5. 线上环境（测试网|主网）测试

线上环境测试账号需要有NAS，才可正常测试，可以用有NAS的私钥替换 test/data/keys.json 中对应的值

下面命令可打印指定keystore的nas地址及私钥明文
```shell
nebdev key <keystore_file_path> 
```

经过步骤3 线上环境的合约封装类已经自动导入到 online_main.js 中 如下：

``` javascript
/** Automatically generated code, please do not modify. */
const MyContract = require('./contracts/MyContract/online.js').testnet
const MyContractMainnet = require('./contracts/MyContract/online.js').mainnet
/** Automatically generated code; End. */
```
MyContract 为 测试网环境封装类

MyContractMainnet 为 主网环境封装类

在 online_main.js 中添加如下测试代码:

``` javascript
async function test() {

    console.log('deploy begin...')
    // 在测试网发布合约
    await MyContract._deploy()

    console.log('setData begin...')
    // 调用合约方法 setData
    await MyContract.setData('hello world!')

    console.log('getData begin...')
    /** 
    * 调用合约方法 getData 并打印结果 
    *
    * 需要注意的是：
    * 如果方法只是单纯的获取数据, 不需要修改或者添加数据到链上；
    * 或者只是测试一下方法调用结果，不需要发送交易时，需要在方法后加Test
    * 比如 getData 要调用 getDataTest
    */
    let r = await MyContract.getDataTest()
    console.log(r)
}

test()
```

还可在调用合约的同时设置合约调用者，及调用时的转账金额：

``` javascript
await MyContract
    ._setAccount(TestKeys.caller)           // 设置调用者 （不设置时，默认值即为TestKeys.caller）
    ._setValue(new BigNumber(10).pow(18))   // 转账 1 NAS
    .setData('hello world!')                // 调用合约的 setData 方法
```

点击 vscode 左侧的调试按钮 (默认布局在左侧的小虫子图标), 然后选择 OnlineMain, 点击运行图标即可启动运行。

因为是线上环境，当有数据上链时会有上链确认过程，需要等待大概十几秒

如果执行成功，结果大概如下：
```
deploy bging...
[Online] D: check status 71db54541ca4176b8f3e2809161d72492d3229b1409960f92109870fc9a76b9d ...
[Online] D: MyContract.deploy execute success contract address: n1uMAWEvLW3bhCJpmwEJz6AFWkyiWk9wWL4 result: ""
setData bging...
[Online] D: check status 67a998417015bb9b2b15c6fd166d99586b0e6ba078c862158f9f4a4ca20133d8 ...
[Online] D: MyContract.setData execute success result: ""
getData bging...
Object {result: ""hello world!"", execute_err: "", estimate_gas: "20131"}
```


## 6. 自动化测试

### 配置

配置框架是在执行 nebdev generate 命令时自动生成的，重新生成时能记住配置项的值，不会覆盖。

本地模拟环境和测试网环境共用一个配置， 在 config/debug 目录下

主网环境配置在 config/release 目录下

先做如下配置：

MyContract 的发布参数配置在 配置目录/MyContract/deploy.json
```javascript
{
  "args": {}
}
```
MyContract 的方法配置在 配置目录/MyContract/methods.json
```javascript
{
  // 该合约支持的所有方法列表
  "allMethods": [   
    "setData",
    "getData"
  ],
  // 配置需要测试的方法列表
  "testMethods": [  
    /** 
     * 方法前如果配置 '@' 符号 表示该方法有上传或者修改链上数据的行为，需要发送交易。
     * 关于 '@' 的描述只针对线上调用时
     */
    "@setData",     
    /** 
     * 方法前没有 '@' 符号 表示只用call的方式获取数据 或 只是测试方法运行结果，不需要发送交易。
     * 关于 '@' 的描述只针对线上调用时
     */
    "getData"       
  ],
  "params": {
    "setData": {
      /**
       * 该方法调用账号 支持以下三种内置变量：
       * {caller} 表示 test/keys.json 中的 caller
       * {deployer} 表示 test/keys.json 中的 deployer
       * {keys.0} 表示 test/keys.json 中的 otherKeys 中的第1个账号，{keys.1}则表示第二个，以此类推
       * 
       * 还支持以下两种
       * keystore 文件路径 (在运行过程中需要手动输入keystore密码)
       * 私钥16进制字符串
       */ 
      "caller": "{caller}", 
      // 调用方法时的转账金额 单位 wei
      "value": "0",
      "args": {
        /**
         * deploy 和 methods 配置里所有 args 中字段可配置值都支持以下四种内置变量：
         * {caller} 表示 test/keys.json 中的 caller 对应的地址
         * {deployer} 表示 test/keys.json 中的 deployer 对应的地址
         * {keys.0} 表示 test/keys.json 中的 otherKeys 中的第1个账号 对应的地址，{keys.1}则表示第二个，以此类推
         * {合约名字} 表示 合约名字对应的合约地址
         */ 
        "data": "1234"
      }
    },
    "getData": {
      "caller": "{caller}",
      "value": "0",
      "args": {}
    }
  }
}
```

### 本地模拟环境

在 test/local_main.js 中添加如下代码
``` javascript
async function autoTest() {
    let runner = new ConfigRunner(MyContract, true)
    await runner.deploy()
    await runner.runMethods()
}

autoTest()
```

点击 vscode 左侧的调试按钮 (默认布局在左侧的小虫子图标), 然后选择 LocalMain, 点击运行图标即可启动调试。
输出如下:
```
[ConfigRunner] D: -------------------------------------------------------
[ConfigRunner] D: MyContract deploy begin.
[ConfigRunner] D: MyContract deploy result: undefined
[ConfigRunner] D: -------------------------------------------------------
[ConfigRunner] D: MyContract.setData begin.
[ConfigRunner] D: MyContract setData result: undefined
[ConfigRunner] D: -------------------------------------------------------
[ConfigRunner] D: MyContract.getData begin.
[ConfigRunner] D: MyContract getData result: "1234"
```

### 线上环境测试（以测试网为例）

在 test/online_main.js 中添加如下代码

``` javascript
async function autoTest() {
    let runner = new ConfigRunner(MyContract, false)
    await runner.deploy()
    await runner.runMethods()
}

autoTest()
```

点击 vscode 左侧的调试按钮 (默认布局在左侧的小虫子图标), 然后选择 LocalMain, 点击运行图标即可启动运行。
输出如下:

```
[ConfigRunner] D: -------------------------------------------------------
[ConfigRunner] D: MyContract deploy begin...
[Online] D: check status be427d8602ebf58e1f5d3be487482eba14b6e34259aa4e71e0a78ea4c499afe3 ...
[Online] D: MyContract.deploy execute success contract address: n1eYhqskYxenKv68kw4m4KNGUNDie7KsSZJ result: ""
[ConfigRunner] D: -------------------------------------------------------
[ConfigRunner] D: MyContract.@setData begin...
[Online] D: check status 8e4ffbb0d359f4809e34ecbfefa33dbd79cfe326f7090812cfcb1c28773ff17b ...
[Online] D: MyContract.setData execute success result: ""
[ConfigRunner] D: -------------------------------------------------------
[ConfigRunner] D: MyContract.getData begin...
[ConfigRunner] D: MyContract.getData execute result: "1234"
```

## 7. 自动化发布合约

测试网配置文件在 config/debug/deploy.json

主网配置文件在 config/release/deploy.json

配置文件内容:
``` javascript
{
  /**
   * 合约发布者账号 支持以下三种内置变量：
   * {caller} 表示 test/keys.json 中的 caller
   * {deployer} 表示 test/keys.json 中的 deployer
   * {keys.0} 表示 test/keys.json 中的 otherKeys 中的第1个账号，{keys.1}则表示第二个，以此类推
   * 
   * 还支持以下两种   
   * keystore 文件路径 (在运行过程中需要手动输入keystore密码)
   * 私钥16进制字符串
   */ 
  "deployer": "{deployer}",
  // 需要发布的合约列表，如果合约间有依赖要排好顺序
  "contracts": ["MyContract"]
}
```

配置完成后调用如下命令即可

```
nebdev deploy testnet

或者

nebdev deploy mainnet
```

** 合约发布时各合约的初始化参数在各合约内部配置的 deploy.json 文件中配置 **


## 8. 其他

关于本地环境中如何给地址增发NAS, 地址间转账，查询余额，设置区块等，参考工程根目录下的LocalContext.md文件
