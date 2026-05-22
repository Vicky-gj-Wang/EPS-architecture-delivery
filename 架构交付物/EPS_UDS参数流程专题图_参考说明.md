# EPS_UDS参数流程专题图_参考说明

## 7.1 图的阅读方式

### 整体结构

本图采用教学型时序泳道布局，共 6 条泳道：

1. 诊断仪 Tester
2. CAN/ISO-TP 传输层
3. UDS 会话与安全层
4. DID 参数管理层
5. DFlash 持久化层
6. RAM 参数镜像

时间方向为自上而下。左侧偏协议门控，右侧偏数据写入与持久化。

### 连线语义

- 实线箭头：同步请求/响应
- 黄色虚线箭头：异步持久化触发
- 红色虚线箭头：门控失败返回 NRC
- 绿色语义节点：RAM 镜像实时生效（先于 DFlash 完成）

---

## 7.2 节点代码映射表

### 协议入口与会话门控

| 节点 | 说明 | 代码映射 |
|---|---|---|
| 请求 0x10 | 会话切换入口 | 协议行为节点（通信协议栈实现，未在本图源码展开） |
| 进入扩展会话 | Session=Extended | 协议行为节点（通信协议栈实现，未在本图源码展开） |
| 请求 0x27 Seed / 发送 0x27 Key | 安全鉴权入口 | 协议行为节点（通信协议栈实现，未在本图源码展开） |
| 安全解锁通过 | 写 DID 前门槛 | 协议行为节点（通信协议栈实现，未在本图源码展开） |
| 会话/安全门控检查 | 2E 前校验，不满足返回 NRC | 协议行为节点（通信协议栈实现，未在本图源码展开） |

### DID 写入与读取链路

| 节点 | 说明 | 代码 |
|---|---|---|
| WriteEepromDiagData | 更新 DID 镜像 | [Code/EPS Code/UAES_BV2_driver_module/src/2_SRVSW/DFlashBaseInterface.c#L607](../Code/EPS%20Code/UAES_BV2_driver_module/src/2_SRVSW/DFlashBaseInterface.c#L607) |
| ParamDIDRestortEeprom | 触发 DID 区持久化 | [Code/EPS Code/UAES_BV2_driver_module/src/2_SRVSW/DFlashBaseInterface.c#L191](../Code/EPS%20Code/UAES_BV2_driver_module/src/2_SRVSW/DFlashBaseInterface.c#L191) |
| ParamDIDWrite | DID 扇区擦除+写入 | [Code/EPS Code/UAES_BV2_driver_module/src/2_SRVSW/DFlashBaseInterface.c#L148](../Code/EPS%20Code/UAES_BV2_driver_module/src/2_SRVSW/DFlashBaseInterface.c#L148) |
| ReadEepromDiagData | UDS 22 读取链路 | [Code/EPS Code/UAES_BV2_driver_module/src/2_SRVSW/DFlashBaseInterface.c#L553](../Code/EPS%20Code/UAES_BV2_driver_module/src/2_SRVSW/DFlashBaseInterface.c#L553) |
| BSWParamSectorRead | BSW 参数读取 | [Code/EPS Code/UAES_BV2_driver_module/src/2_SRVSW/DFlashBaseInterface.c#L650](../Code/EPS%20Code/UAES_BV2_driver_module/src/2_SRVSW/DFlashBaseInterface.c#L650) |
| BSWParamSectorWrite | 诊断参数持久化补充路径 | [Code/EPS Code/UAES_BV2_driver_module/src/2_SRVSW/DFlashBaseInterface.c#L722](../Code/EPS%20Code/UAES_BV2_driver_module/src/2_SRVSW/DFlashBaseInterface.c#L722) |
| ParamSectorRead | 参数区读取补充路径 | [Code/EPS Code/UAES_BV2_driver_module/src/2_SRVSW/DFlashBaseInterface.c#L277](../Code/EPS%20Code/UAES_BV2_driver_module/src/2_SRVSW/DFlashBaseInterface.c#L277) |
| ParamSectorWrite | 参数区写入补充路径 | [Code/EPS Code/UAES_BV2_driver_module/src/2_SRVSW/DFlashBaseInterface.c#L351](../Code/EPS%20Code/UAES_BV2_driver_module/src/2_SRVSW/DFlashBaseInterface.c#L351) |

### 响应节点

| 节点 | 说明 | 代码映射 |
|---|---|---|
| 0x6E 正响应 / NRC 负响应 | 写 DID 响应出口 | 协议行为节点（通信协议栈实现，未在本图源码展开） |
| 0x62 响应 DID 数据 | 读 DID 响应出口 | 协议行为节点（通信协议栈实现，未在本图源码展开） |

---

## 7.3 未展开说明

| 未展开内容 | 原因 | 去向 |
|---|---|---|
| ISO-TP 首帧/流控/连续帧细节 | 若展开会显著增加跨泳道回环，降低交接可读性 | 通信协议栈专题图 |
| 0x10 子功能全列表、NRC 全量码表 | 非参数存储主链路，教学第一层不必全部展开 | 诊断协议设计说明 |
| 0x27 算法细节（Seed/Key 计算） | 涉及安全策略，不适合放在主交接图 | 安全策略专项文档 |

---

## 7.4 其他补充说明

1. 本图刻意区分“镜像更新成功”和“DFlash 持久化完成”，用于避免新同事误把 2E 正响应理解为“已永久存储”。
2. 图中函数节点不显示行号，符合团队规则；行号仅在本参考文档保留。
3. 若后续要深化教学，建议在本图基础上追加“常见 NRC 故障定位子图”（例如会话不对、未解锁、长度错误）。
