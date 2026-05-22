# EPS安全保护链路流程图 参考说明

对应图片：EPS安全保护链路流程图.drawio  
适用对象：新同事快速理解、评审对齐、对管理层汇报

## 1. 先看结论（给非代码同事）

这张图表达的是：

1. 系统有四类异常入口（Trap、保护故障、自检失败、PowerManager/功率级相关异常）。
2. 四类入口都会汇聚到故障处理主链。
3. 主链先做复位限次仲裁，再决定是执行软复位，还是锁存故障等待人工/诊断恢复。
4. 复位执行后回到启动入口，形成闭环。

## 2. 建议阅读顺序（看图不迷路）

1. 先看顶部四个入口框，理解“谁会触发保护”。
2. 再看中间菱形“故障汇聚与仲裁”。
3. 再看“ResetCount限次判断”的是/否两条路径。
4. 最后看右侧“等待清故障重试”与左下“诊断上报通道”。

## 3. 四入口与代码对应（含行号）

### 3.1 TrapHandle 异常入口

1. Trap统一分发入口：
[Code/EPS Code/UAES_BV2_driver_module/src/0_App/src/TrapHandle.c#L171](Code/EPS%20Code/UAES_BV2_driver_module/src/0_App/src/TrapHandle.c#L171)
2. 内部保护类Trap处理：
[Code/EPS Code/UAES_BV2_driver_module/src/0_App/src/TrapHandle.c#L179](Code/EPS%20Code/UAES_BV2_driver_module/src/0_App/src/TrapHandle.c#L179)
3. OS保护异常进入Shutdown链：
[Code/EPS Code/UAES_BV2_driver_module/src/0_App/src/TrapHandle.c#L68](Code/EPS%20Code/UAES_BV2_driver_module/src/0_App/src/TrapHandle.c#L68)
4. ShutdownHook最终触发软复位：
[Code/EPS Code/UAES_BV2_driver_module/src/0_App/src/TrapHandle.c#L205](Code/EPS%20Code/UAES_BV2_driver_module/src/0_App/src/TrapHandle.c#L205)
[Code/EPS Code/UAES_BV2_driver_module/src/0_App/src/TrapHandle.c#L212](Code/EPS%20Code/UAES_BV2_driver_module/src/0_App/src/TrapHandle.c#L212)

### 3.2 protect.c 保护故障入口

1. 保护逻辑置位进入故障标志（示例：过压）：
[Code/EPS Code/safety_module/src/0_App/src/safety/protect.c#L933](Code/EPS%20Code/safety_module/src/0_App/src/safety/protect.c#L933)
2. 中断状态机按故障掩码汇聚判断：
[Code/EPS Code/UAES_BV2_driver_module/src/0_App/src/IntStateMachine.c#L36](Code/EPS%20Code/UAES_BV2_driver_module/src/0_App/src/IntStateMachine.c#L36)
[Code/EPS Code/UAES_BV2_driver_module/src/0_App/src/IntStateMachine.c#L246](Code/EPS%20Code/UAES_BV2_driver_module/src/0_App/src/IntStateMachine.c#L246)
3. 命中后切到evntFault：
[Code/EPS Code/UAES_BV2_driver_module/src/0_App/src/IntStateMachine.c#L250](Code/EPS%20Code/UAES_BV2_driver_module/src/0_App/src/IntStateMachine.c#L250)

### 3.3 StateInit + SelfTestRun 失败入口

1. SelfTestRun定义：
[Code/EPS Code/UAES_BV2_driver_module/src/0_App/src/SelfTest.c#L83](Code/EPS%20Code/UAES_BV2_driver_module/src/0_App/src/SelfTest.c#L83)
2. StateInit中调用SelfTestRun：
[Code/EPS Code/UAES_BV2_driver_module/src/0_App/src/stateMachine.c#L615](Code/EPS%20Code/UAES_BV2_driver_module/src/0_App/src/stateMachine.c#L615)
3. 自检失败触发限次复位：
[Code/EPS Code/UAES_BV2_driver_module/src/0_App/src/SelfTest.c#L108](Code/EPS%20Code/UAES_BV2_driver_module/src/0_App/src/SelfTest.c#L108)

### 3.4 PowerManager 触发保护入口（说明）

这一路在代码中是“初始化入口 + 功率级保护语义入口”，不是PowerManager.c单点直接置Fault位：

1. 启动阶段调用PowerMannagerInit：
[Code/EPS Code/UAES_BV2_driver_module/src/0_App/src/main.c#L66](Code/EPS%20Code/UAES_BV2_driver_module/src/0_App/src/main.c#L66)
2. PowerManager初始化函数：
[Code/EPS Code/safety_module/src/0_App/src/safety/PowerManager.c#L53](Code/EPS%20Code/safety_module/src/0_App/src/safety/PowerManager.c#L53)
3. 与功率级保护联动的实际触发语义（示例）：
[Code/EPS Code/safety_module/src/0_App/src/safety/protect.c#L1201](Code/EPS%20Code/safety_module/src/0_App/src/safety/protect.c#L1201)
[Code/EPS Code/safety_module/src/0_App/src/safety/protect.c#L1238](Code/EPS%20Code/safety_module/src/0_App/src/safety/protect.c#L1238)
4. ASW侧“因错误关断功率级”的接口语义：
[Code/EPS Code/asw_interface_module/src/0_App/src/asw_protection.c#L66](Code/EPS%20Code/asw_interface_module/src/0_App/src/asw_protection.c#L66)

建议口径：图中该入口可命名为“PowerManager/功率级相关保护触发”，语义更精确。

## 4. 汇聚、仲裁、复位执行对应代码

1. 进入Fault状态处理：
[Code/EPS Code/UAES_BV2_driver_module/src/0_App/src/stateMachine.c#L736](Code/EPS%20Code/UAES_BV2_driver_module/src/0_App/src/stateMachine.c#L736)
2. 启动前故障场景触发限次复位：
[Code/EPS Code/UAES_BV2_driver_module/src/0_App/src/stateMachine.c#L755](Code/EPS%20Code/UAES_BV2_driver_module/src/0_App/src/stateMachine.c#L755)
3. 复位上限常量：
[Code/EPS Code/UAES_BV2_driver_module/src/0_App/src/driver/ResetHandle.c#L32](Code/EPS%20Code/UAES_BV2_driver_module/src/0_App/src/driver/ResetHandle.c#L32)
4. 限次复位判断：
[Code/EPS Code/UAES_BV2_driver_module/src/0_App/src/driver/ResetHandle.c#L166](Code/EPS%20Code/UAES_BV2_driver_module/src/0_App/src/driver/ResetHandle.c#L166)
[Code/EPS Code/UAES_BV2_driver_module/src/0_App/src/driver/ResetHandle.c#L170](Code/EPS%20Code/UAES_BV2_driver_module/src/0_App/src/driver/ResetHandle.c#L170)
5. 软复位执行点：
[Code/EPS Code/UAES_BV2_driver_module/src/0_App/src/driver/ResetHandle.c#L57](Code/EPS%20Code/UAES_BV2_driver_module/src/0_App/src/driver/ResetHandle.c#L57)
[Code/EPS Code/UAES_BV2_driver_module/src/0_App/src/driver/ResetHandle.c#L63](Code/EPS%20Code/UAES_BV2_driver_module/src/0_App/src/driver/ResetHandle.c#L63)

## 5. 汇报可直接用的三句话

1. 这张图把保护链路统一成“四入口、一汇聚、两分支”的故障闭环。  
2. 代码上Trap、protect、自检失败都能直接落到故障事件和复位执行链。  
3. PowerManager入口属于“电源与功率级保护语义入口”，建议按该口径对外表述，避免误解为单函数直接触发Fault。

## 6. 术语对照表（给非嵌入式同事）

| 术语 | 通俗解释 | 图中位置 | 代码锚点 |
|---|---|---|---|
| TrapHandle 异常 | CPU或OS级异常，属于高优先级错误入口 | 左侧入口 | [Code/EPS Code/UAES_BV2_driver_module/src/0_App/src/TrapHandle.c#L171](Code/EPS%20Code/UAES_BV2_driver_module/src/0_App/src/TrapHandle.c#L171) |
| protect 触发保护 | 运行时检测到过压过流过温等故障，置位故障状态 | 中间入口 | [Code/EPS Code/safety_module/src/0_App/src/safety/protect.c#L933](Code/EPS%20Code/safety_module/src/0_App/src/safety/protect.c#L933) |
| SelfTestRun 失败 | 启动自检未通过，进入故障处置 | 右侧入口 | [Code/EPS Code/UAES_BV2_driver_module/src/0_App/src/SelfTest.c#L108](Code/EPS%20Code/UAES_BV2_driver_module/src/0_App/src/SelfTest.c#L108) |
| PowerManager/功率级相关保护 | 电源与功率级相关的保护语义入口，不是单函数直接置故障位 | 最右入口 | [Code/EPS Code/UAES_BV2_driver_module/src/0_App/src/main.c#L66](Code/EPS%20Code/UAES_BV2_driver_module/src/0_App/src/main.c#L66) |
| FaultState | 控制进入故障态，停驱动并转入故障流程 | 汇聚后主链 | [Code/EPS Code/UAES_BV2_driver_module/src/0_App/src/stateMachine.c#L736](Code/EPS%20Code/UAES_BV2_driver_module/src/0_App/src/stateMachine.c#L736) |
| evntFault | 状态机故障事件，驱动状态从正常转入故障链 | 汇聚判定处 | [Code/EPS Code/UAES_BV2_driver_module/src/0_App/src/IntStateMachine.c#L250](Code/EPS%20Code/UAES_BV2_driver_module/src/0_App/src/IntStateMachine.c#L250) |
| FAULT_ID_MASK | 故障掩码，决定哪些故障会触发故障事件 | 汇聚判定条件 | [Code/EPS Code/UAES_BV2_driver_module/src/0_App/src/IntStateMachine.c#L36](Code/EPS%20Code/UAES_BV2_driver_module/src/0_App/src/IntStateMachine.c#L36) |
| ControllerSoftwareResetWithLimit | 带限次的软件复位入口，避免复位风暴 | 仲裁后动作 | [Code/EPS Code/UAES_BV2_driver_module/src/0_App/src/driver/ResetHandle.c#L166](Code/EPS%20Code/UAES_BV2_driver_module/src/0_App/src/driver/ResetHandle.c#L166) |
| MAX_SOFTWARERESET_COUNT | 软件复位上限阈值，超过后进入锁存路径 | 仲裁判断条件 | [Code/EPS Code/UAES_BV2_driver_module/src/0_App/src/driver/ResetHandle.c#L32](Code/EPS%20Code/UAES_BV2_driver_module/src/0_App/src/driver/ResetHandle.c#L32) |
| IfxCpu_triggerSwReset | 实际触发芯片软件复位的底层调用 | 复位执行框 | [Code/EPS Code/UAES_BV2_driver_module/src/0_App/src/driver/ResetHandle.c#L63](Code/EPS%20Code/UAES_BV2_driver_module/src/0_App/src/driver/ResetHandle.c#L63) |
| FaultClear | 通过UDS或维护操作清故障，进入重试路径 | 右侧恢复链 | [Code/EPS Code/UAES_BV2_driver_module/src/0_App/src/IntStateMachine.c#L631](Code/EPS%20Code/UAES_BV2_driver_module/src/0_App/src/IntStateMachine.c#L631) |

补充说明：

1. 图中“PowerManager 触发保护”建议统一口径为“PowerManager/功率级相关保护触发”，对代码语义更准确。
2. 对新人培训时，建议先讲表中前6项，再讲复位仲裁与恢复链，可在15分钟内完成入门。
