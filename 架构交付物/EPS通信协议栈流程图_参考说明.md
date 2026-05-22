# EPS通信协议栈流程图 参考说明（左右分支版）

## 1. 图的阅读方式

- 左分支：整车通信链路（J1939 BAM）
- 右分支：诊断通信链路（ISO15765 + UDS）
- 实线：业务报文数据流（payload）
- 虚线：控制流/状态流（NM使能、关闭、BusOff恢复）

## 2. 左分支（J1939整车链路）代码映射

1. TP收包（J1939 BAM RX）
- 节点：J1939TPReceiveData
- 代码：[Code/EPS Code/communication_stack_module/src/0_App/src/UDS/TransferProtocal/J1939TP.c](Code/EPS%20Code/communication_stack_module/src/0_App/src/UDS/TransferProtocal/J1939TP.c#L44)

2. E2E收方向校验
- 节点：E2E_P01Check
- 代码：[Code/EPS Code/communication_stack_module/src/0_App/src/E2EProtocol/E2E_P0xProtocol.c](Code/EPS%20Code/communication_stack_module/src/0_App/src/E2EProtocol/E2E_P0xProtocol.c#L74)

3. 应用层收包处理
- 节点：RecieveAppHandleFunc
- 代码：[Code/EPS Code/communication_stack_module/src/0_App/src/AppComProtocol.c](Code/EPS%20Code/communication_stack_module/src/0_App/src/AppComProtocol.c#L354)

4. 应用层路由刷新
- 节点：消息路由与变量刷新
- 代码：[Code/EPS Code/communication_stack_module/src/0_App/src/AppComProtocol.c](Code/EPS%20Code/communication_stack_module/src/0_App/src/AppComProtocol.c#L809)

5. 应用层发包打包
- 节点：App TX打包
- 代码：[Code/EPS Code/communication_stack_module/src/0_App/src/AppComProtocol.c](Code/EPS%20Code/communication_stack_module/src/0_App/src/AppComProtocol.c#L134)

6. E2E发方向保护
- 节点：E2E_P01Protect
- 代码：[Code/EPS Code/communication_stack_module/src/0_App/src/E2EProtocol/E2E_P0xProtocol.c](Code/EPS%20Code/communication_stack_module/src/0_App/src/E2EProtocol/E2E_P0xProtocol.c#L254)

7. TP发包（J1939 BAM TX）
- 节点：TPCMRequestBAM
- 代码：[Code/EPS Code/communication_stack_module/src/0_App/src/UDS/TransferProtocal/J1939TP.c](Code/EPS%20Code/communication_stack_module/src/0_App/src/UDS/TransferProtocal/J1939TP.c#L79)

## 3. 右分支（ISO15765 + UDS链路）代码映射

1. TP收包（ISO15765 RX）
- 节点：NetworkLayer接收缓存
- 代码：[Code/EPS Code/communication_stack_module/src/0_App/src/UDS/TransferProtocal/NetworkLayer.c](Code/EPS%20Code/communication_stack_module/src/0_App/src/UDS/TransferProtocal/NetworkLayer.c#L32)

2. UDS入口
- 节点：UDS请求入口
- 代码：[Code/EPS Code/communication_stack_module/src/0_App/src/UDS/DiagnosticService/Diagnostic.c](Code/EPS%20Code/communication_stack_module/src/0_App/src/UDS/DiagnosticService/Diagnostic.c#L2607)

3. Service分发表
- 节点：Service分发表
- 代码：[Code/EPS Code/communication_stack_module/src/0_App/src/UDS/DiagnosticService/Diagnostic.c](Code/EPS%20Code/communication_stack_module/src/0_App/src/UDS/DiagnosticService/Diagnostic.c#L140)

4. 关键Service处理函数
- Service10: [Code/EPS Code/communication_stack_module/src/0_App/src/UDS/DiagnosticService/Diagnostic.c](Code/EPS%20Code/communication_stack_module/src/0_App/src/UDS/DiagnosticService/Diagnostic.c#L393)
- Service19: [Code/EPS Code/communication_stack_module/src/0_App/src/UDS/DiagnosticService/Diagnostic.c](Code/EPS%20Code/communication_stack_module/src/0_App/src/UDS/DiagnosticService/Diagnostic.c#L1468)
- Service27: [Code/EPS Code/communication_stack_module/src/0_App/src/UDS/DiagnosticService/Diagnostic.c](Code/EPS%20Code/communication_stack_module/src/0_App/src/UDS/DiagnosticService/Diagnostic.c#L579)
- Service2E: [Code/EPS Code/communication_stack_module/src/0_App/src/UDS/DiagnosticService/Diagnostic.c](Code/EPS%20Code/communication_stack_module/src/0_App/src/UDS/DiagnosticService/Diagnostic.c#L1229)
- Service34: [Code/EPS Code/communication_stack_module/src/0_App/src/UDS/DiagnosticService/Diagnostic.c](Code/EPS%20Code/communication_stack_module/src/0_App/src/UDS/DiagnosticService/Diagnostic.c#L1892)
- Service37: [Code/EPS Code/communication_stack_module/src/0_App/src/UDS/DiagnosticService/Diagnostic.c](Code/EPS%20Code/communication_stack_module/src/0_App/src/UDS/DiagnosticService/Diagnostic.c#L1995)

5. TP发包（ISO15765 TX）
- 节点：NetworkSend发送
- 代码：[Code/EPS Code/communication_stack_module/src/0_App/src/UDS/TransferProtocal/NetworkLayer.c](Code/EPS%20Code/communication_stack_module/src/0_App/src/UDS/TransferProtocal/NetworkLayer.c#L743)

## 4. NM控制平面映射（虚线）

1. NM状态机主状态
- CommInit: [Code/EPS Code/communication_stack_module/src/0_App/src/NM.c](Code/EPS%20Code/communication_stack_module/src/0_App/src/NM.c#L215)
- Active: [Code/EPS Code/communication_stack_module/src/0_App/src/NM.c](Code/EPS%20Code/communication_stack_module/src/0_App/src/NM.c#L228)
- Shutdown: [Code/EPS Code/communication_stack_module/src/0_App/src/NM.c](Code/EPS%20Code/communication_stack_module/src/0_App/src/NM.c#L275)

2. BusOff与恢复事件
- SetEvent定义: [Code/EPS Code/communication_stack_module/src/0_App/src/NM.c](Code/EPS%20Code/communication_stack_module/src/0_App/src/NM.c#L63)
- BusOff触发: [Code/EPS Code/communication_stack_module/src/0_App/src/NM.c](Code/EPS%20Code/communication_stack_module/src/0_App/src/NM.c#L142)
- BusOff恢复: [Code/EPS Code/communication_stack_module/src/0_App/src/NM.c](Code/EPS%20Code/communication_stack_module/src/0_App/src/NM.c#L184)

3. 图中虚线含义
- NM Active -> J1939/ISO发送链路：通信使能
- NM Shutdown -> 发送链路：通信关闭或降级
- TP/CAN错误 -> NM BusOff：异常事件上报

## 5. 补充说明（未展开范围）

- 未展开对象：DID明细、例程内部判据、Flash持久化细节
- 未展开原因：保持主路径可读性，避免线交叉和信息过密
- 详细去向：后续“Flash/标定数据管理专题图”与诊断配置专题说明
