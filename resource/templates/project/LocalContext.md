***LocalContext 用于本地模拟环境测试 的一些使用场景***

1. 向 address1 发放 1 个 NAS

``` javascript
LocalContext.transfer(null, address1, new BigNumber(10).pow(18))
```

2. address1 向 address2 发放 1 个 NAS

``` javascript
LocalContext.transfer(address1, address2, new BigNumber(10).pow(18))
```

3. 获取某地址余额 

``` javascript
LocalContext.getBalance(address)
```

4. 获取某合约地址

``` javascript
LocalContext.getContractAddress(Contract1)
```

5. 设置当前区块高度

``` javascript
LocalContext.blockHeight = 1
```

5. 清除本地模拟环境数据

``` javascript
LocalContext.clearData()
```