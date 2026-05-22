# EPS ASW 接口层流程图 参考说明

> 配套图文件：`架构交付物/EPSASW接口层流程图.drawio`
> 生成日期：2026-05-20

---

## 7.1 图的阅读方式

### 整体结构

本图采用三列纵向编排，表示 ASW 接口层的三条主链路：

| 列 | 内容 | 颜色 |
|---|---|---|
| 左列 | 下行命令链：外部命令进入 ASW 后，映射到控制模式、目标值、功率级、故障清除 | 暖橙 |
| 中列 | 上行状态链：从控制内核采集反馈并做状态门控，再输出标准状态 | 蓝 |
| 右列 | 通信发送链：发送使能门控、CAN_TX_MODE 分发、队列轮询、ISR 回调、总线发送 | 靛蓝 |

阅读顺序：每列自上而下；跨列连线表示链路间耦合（命令/反馈进入发送入口，控制执行结果回读到状态采集）。

### 连线含义

- 橙色实线：下行命令处理流程
- 蓝色实线：反馈数据处理与状态判定
- 靛蓝实线：CAN 发送路径
- 菱形节点：条件门控或分发（发送使能、状态有效性）

---

## 7.2 节点代码映射表

### A. 下行命令链（asw_mode.c）

| 图中节点 | 函数 | 行号 |
|---|---|---|
| 模式设置 | `SetCtrlModeTgt_Hw` | [asw_mode.c#L58](../Code/EPS%20Code/asw_interface_module/src/0_App/src/asw_mode.c#L58) |
| 目标值设置 | `SetTgtValue_Hw` | [asw_mode.c#L107](../Code/EPS%20Code/asw_interface_module/src/0_App/src/asw_mode.c#L107) |
| 扭矩请求接口 | `SetMtrDmdTq_Nm` | [asw_mode.c#L149](../Code/EPS%20Code/asw_interface_module/src/0_App/src/asw_mode.c#L149) |
| 功率级开关 | `SetModePwrSt_Hw` | [asw_mode.c#L218](../Code/EPS%20Code/asw_interface_module/src/0_App/src/asw_mode.c#L218) |
| 功率级读取 | `GetModePwrStage_Hw` | [asw_mode.c#L267](../Code/EPS%20Code/asw_interface_module/src/0_App/src/asw_mode.c#L267) |
| 故障清除 | `ClearFaultStateCmd` | [asw_mode.c#L284](../Code/EPS%20Code/asw_interface_module/src/0_App/src/asw_mode.c#L284) |
| 控制激活标志 | `GetCtrlActiveFlag_Hw` | [asw_mode.c#L180](../Code/EPS%20Code/asw_interface_module/src/0_App/src/asw_mode.c#L180) |

### B. 上行状态链（asw_position.c）

| 图中节点 | 函数 | 行号 |
|---|---|---|
| 反馈聚合 | `HoldDataValue` | [asw_position.c#L56](../Code/EPS%20Code/asw_interface_module/src/0_App/src/asw_position.c#L56) |
| 位置反馈（度） | `GetMtrPos_deg_Hw` | [asw_position.c#L184](../Code/EPS%20Code/asw_interface_module/src/0_App/src/asw_position.c#L184) |
| 位置反馈（接口值） | `GetMtrPos_Hw` | [asw_position.c#L202](../Code/EPS%20Code/asw_interface_module/src/0_App/src/asw_position.c#L202) |
| 转速反馈 | `GetMtrSpd_rpm_Hw` | [asw_position.c#L230](../Code/EPS%20Code/asw_interface_module/src/0_App/src/asw_position.c#L230) |
| 平均电流 | `GetIMotAvg_Hw` | [asw_position.c#L261](../Code/EPS%20Code/asw_interface_module/src/0_App/src/asw_position.c#L261) |
| 供电电压 | `GetPwrSupyVolt_V_Hw` | [asw_position.c#L303](../Code/EPS%20Code/asw_interface_module/src/0_App/src/asw_position.c#L303) |
| 电压反馈 | `GetUAct_Hw` | [asw_position.c#L346](../Code/EPS%20Code/asw_interface_module/src/0_App/src/asw_position.c#L346) |
| PCB 温度 | `GetTcPcb_Hw` | [asw_position.c#L389](../Code/EPS%20Code/asw_interface_module/src/0_App/src/asw_position.c#L389) |
| MOS 温度 | `GetECUMosTem_DegC_Hw` | [asw_position.c#L432](../Code/EPS%20Code/asw_interface_module/src/0_App/src/asw_position.c#L432) |
| 位置到位标志 | `GetPosCtrlFinished_Hw` | [asw_position.c#L477](../Code/EPS%20Code/asw_interface_module/src/0_App/src/asw_position.c#L477) |
| D 轴电流 | `GetMtrCurD_A_Hw` | [asw_position.c#L529](../Code/EPS%20Code/asw_interface_module/src/0_App/src/asw_position.c#L529) |
| Q 轴电流 | `GetMtrCurQ_A_Hw` | [asw_position.c#L571](../Code/EPS%20Code/asw_interface_module/src/0_App/src/asw_position.c#L571) |

### C. 通信发送链（asw_communicate.c）

| 图中节点 | 函数 | 行号 |
|---|---|---|
| 发送使能写入 | `Enable_ASW_CANTX` | [asw_communicate.c#L43](../Code/EPS%20Code/asw_interface_module/src/0_App/src/asw_communicate.c#L43) |
| 发送使能读取 | `GetEnable_ASW_CANTX` | [asw_communicate.c#L51](../Code/EPS%20Code/asw_interface_module/src/0_App/src/asw_communicate.c#L51) |
| ASW 发送入队 | `AswAswCANBaseTx` | [asw_communicate.c#L83](../Code/EPS%20Code/asw_interface_module/src/0_App/src/asw_communicate.c#L83) |
| BSW 发送入队 | `AswBswCANBaseTx` | [asw_communicate.c#L134](../Code/EPS%20Code/asw_interface_module/src/0_App/src/asw_communicate.c#L134) |
| ASW 轮询发送 | `ASWFioAswCANBasePoll` | [asw_communicate.c#L184](../Code/EPS%20Code/asw_interface_module/src/0_App/src/asw_communicate.c#L184) |
| BSW 轮询发送 | `ASWFioBswCANBasePoll` | [asw_communicate.c#L234](../Code/EPS%20Code/asw_interface_module/src/0_App/src/asw_communicate.c#L234) |
| ISR 回调（ASW） | `ASWBaseTxAswCANISRCallback` | [asw_communicate.c#L283](../Code/EPS%20Code/asw_interface_module/src/0_App/src/asw_communicate.c#L283) |
| ISR 回调（BSW） | `ASWBaseTxBswCANISRCallback` | [asw_communicate.c#L309](../Code/EPS%20Code/asw_interface_module/src/0_App/src/asw_communicate.c#L309) |
| 统一发送入口 | `TransmitCAN` | [asw_communicate.c#L340](../Code/EPS%20Code/asw_interface_module/src/0_App/src/asw_communicate.c#L340) |

---

## 7.3 未展开说明

| 未展开内容 | 原因 | 指向 |
|---|---|---|
| CAN 接收解包链路 | 当前文件主要是发送侧与缓存/回调，接收解包在其他通信模块，不在本图主范围 | communication_stack_module 相关接收处理 |
| `asw_pwmcap.c` | 属于 ASW 接口并列能力，但与本图三主链路耦合较弱，展开会增加复杂度 | `asw_pwmcap.c` |
| `asw_eeprom.c` | 侧重存储管理流程，建议放到 Flash/标定数据管理专题图 | `asw_eeprom.c` |
| 更深层状态机跳转细节 | 本图定位接口编排，不展开内部状态机所有事件边界 | 主状态机图与中断状态机图 |

---

## 7.4 其他补充说明

### 关键设计约束

1. 下行命令值存在统一符号方向处理（多处接口使用负号变换），移植或联调时必须统一坐标系定义。
2. 上行状态接口大量复用 `GetCurrentState()` 做状态码门控，`readyState` 是有效反馈门槛。
3. 发送链在 `TransmitCAN` 内由 `CAN_TX_MODE` 决定具体路径，调试时必须先确认编译配置。
4. 发送缓冲入队与指针更新使用关中断保护，涉及并发一致性，不能随意改成无保护写法。

### 调用关系建议

- 周期任务：`HoldDataValue` + 各 Get* 反馈接口
- 事件任务：`SetCtrlModeTgt_Hw` / `SetTgtValue_Hw` / `ClearFaultStateCmd`
- 通信任务：`TransmitCAN` + `ASWFio*Poll` + `ASWBaseTx*ISRCallback`

### 版本说明

- 覆盖范围：ASW 接口层三文件主链路（mode/position/communicate）
- 已知局限：未展开 CAN 接收解包和 EEPROM 专题逻辑
- 交付目的：内部开发交接与接口联调定位
