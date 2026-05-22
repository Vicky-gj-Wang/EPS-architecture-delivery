# EPS_XCP标定持久化专题图_参考说明

## 7.1 图的阅读方式

### 整体结构

本图采用教学型时序泳道布局，共 7 条泳道：

1. 标定工具 INCA/CANape
2. XCP 会话层
3. 鉴权 Seed/Key
4. CAL/PAG 页管理
5. RAM 标定页
6. 冻结/回写控制层
7. DFlash 持久化执行层

时间方向自上而下。上半段是在线标定实时链路，下半段是冻结回写持久化链路。

### 连线语义

- 实线箭头：协议请求/函数调用主链
- 绿色虚线箭头：从实时生效到冻结动作的跨阶段触发
- 橙色虚线箭头：后台异步落盘（非立即写完）

---

## 7.2 节点代码映射表

### 会话与鉴权阶段

| 节点 | 说明 | 代码 |
|---|---|---|
| XCP_Init | 建立 XCP 会话上下文 | [Code/EPS Code/UAES_BV2_driver_module/src/2_SRVSW/XCP/xcp_callbacks.c#L429](../Code/EPS%20Code/UAES_BV2_driver_module/src/2_SRVSW/XCP/xcp_callbacks.c#L429) |
| XcpApp_GetSeed | 获取 Seed | [Code/EPS Code/UAES_BV2_driver_module/src/2_SRVSW/XCP/xcp_callbacks.c#L1029](../Code/EPS%20Code/UAES_BV2_driver_module/src/2_SRVSW/XCP/xcp_callbacks.c#L1029) |
| XcpApp_GetKeyBuffer | Key 校验缓冲处理 | [Code/EPS Code/UAES_BV2_driver_module/src/2_SRVSW/XCP/xcp_callbacks.c#L1074](../Code/EPS%20Code/UAES_BV2_driver_module/src/2_SRVSW/XCP/xcp_callbacks.c#L1074) |

### 页管理与在线标定阶段

| 节点 | 说明 | 代码 |
|---|---|---|
| XcpApp_GetEcuCalPage | 读取当前 ECU 标定页 | [Code/EPS Code/UAES_BV2_driver_module/src/2_SRVSW/XCP/xcp_callbacks.c#L692](../Code/EPS%20Code/UAES_BV2_driver_module/src/2_SRVSW/XCP/xcp_callbacks.c#L692) |
| Overlay_Init | 建立 Overlay 映射 | [Code/EPS Code/UAES_BV2_driver_module/src/2_SRVSW/XCP/xcp_callbacks.c#L381](../Code/EPS%20Code/UAES_BV2_driver_module/src/2_SRVSW/XCP/xcp_callbacks.c#L381) |
| XcpApp_CalMemWrite | 将 DOWNLOAD/PROGRAM 数据写入 RAM 标定页 | [Code/EPS Code/UAES_BV2_driver_module/src/2_SRVSW/XCP/xcp_callbacks.c#L719](../Code/EPS%20Code/UAES_BV2_driver_module/src/2_SRVSW/XCP/xcp_callbacks.c#L719) |

### 冻结与持久化阶段

| 节点 | 说明 | 代码 |
|---|---|---|
| Update_WriteData | 整理待回写数据页 | [Code/EPS Code/UAES_BV2_driver_module/src/0_App/src/driver/RestorCalData.c#L26](../Code/EPS%20Code/UAES_BV2_driver_module/src/0_App/src/driver/RestorCalData.c#L26) |
| RestorClaDataPowerOff | 冻结回写触发 | [Code/EPS Code/UAES_BV2_driver_module/src/0_App/src/driver/RestorCalData.c#L53](../Code/EPS%20Code/UAES_BV2_driver_module/src/0_App/src/driver/RestorCalData.c#L53) |
| 扇区擦除+512页搬运写入 | 后端 DFlash 落盘动作 | [Code/EPS Code/UAES_BV2_driver_module/src/0_App/src/driver/RestorCalData.c#L53](../Code/EPS%20Code/UAES_BV2_driver_module/src/0_App/src/driver/RestorCalData.c#L53) |

---

## 7.3 未展开说明

| 未展开内容 | 原因 | 去向 |
|---|---|---|
| DAQ/STIM 周期采集全链路 | 与标定写入主链路正交，展开会造成图面噪声 | 通信协议栈专题图 |
| Seed/Key 算法实现细节 | 安全策略内容，不适合在交接主图暴露实现细节 | 安全策略专项文档 |
| 多 dataSegment/多标定块切换 | 细节较多，初学者优先理解单链路模型 | XCP 深化培训文档 |

---

## 7.4 其他补充说明

1. 本图核心教学点是区分“在线实时生效（RAM）”与“掉电保持（DFlash）”两阶段。
2. 工具侧完成 DOWNLOAD 后，参数立即影响控制环，但若不触发冻结/回写，掉电后会丢失。
3. 图中函数节点不显示行号，符合团队规则；行号仅在本参考文档保留。
