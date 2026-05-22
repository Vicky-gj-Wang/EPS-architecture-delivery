# EPS 模块依赖关系图 参考说明

---

## 1. 图表读法

### 结构说明

图采用**横向分层泳道**布局，从上到下共 4 个层级：

| 层级 | 颜色 | 内容 |
|------|------|------|
| 0_App（应用层） | 蓝色背景 | main.c、TaskSchedule.c、状态机、驱动 App |
| 2_SRVSW（服务层） | 绿色背景 | AswApp、DFlash、communicate、protect、XCP |
| 4_BSP（板级支持层） | 浅黄背景 | ADC/PWM/CAN/GPIO/Flash 各 BSP 驱动 |
| 5_LLD（底层驱动） | 粉红背景 | IfxVadc、IfxGtm、IfxMultican、IfxCpu、IfxDmu |

### 箭头类型

- **实线箭头**：直接调用依赖（`#include` + 函数调用），依赖方向即调用方向
- **虚线箭头**：间接依赖，包括中断驱动触发、共享数据结构读写等

### 原则

所有箭头方向统一为"**调用方 → 被调用方**"，即上层依赖下层，App 层依赖 SRVSW/BSP，BSP 依赖 LLD。

---

## 2. 代码映射

### 0_App 层模块

| 模块 | 源文件路径 | 主要职责 |
|------|-----------|---------|
| main.c | `0_App/src/main.c` | 启动入口：初始化→自检→进入 OS 调度 |
| TaskSchedule.c | `0_App/src/TaskSchedule.c` | 任务调度器：含 1ms/5ms/10ms/50ms 任务分组 |
| stateMachine.c | `0_App/src/stateMachine.c` | 主状态机：INIT→CALIB→RUN→FAULT 状态流转 |
| IntStateMachine.c | `0_App/src/IntStateMachine.c` | FOC 中断状态机：PWM 中断驱动，执行三环控制 |
| MotorControlPInterface.c | `0_App/src/MotorControlPInterface.c` | 电机控制参数接口：向 ASW 层传递电机控制参数 |
| AdcApp.c | `0_App/src/driver/AdcApp.c` | ADC 采样整形：对原始 ADC 值做换算/滤波 |
| SelfTest.c | `0_App/src/SelfTest.c` | 上电自检：MCU、Flash、RAM、外设检查 |
| TrapHandle.c | `0_App/src/TrapHandle.c` | 异常陷阱：TC23x TRAP 中断处理 |
| ResetHandle.c | `0_App/src/driver/ResetHandle.c` | 复位处理：软/硬复位写标志+次数限制 |
| RestorCalData.c | `0_App/src/driver/RestorCalData.c` | 标定数据恢复：从 Flash 加载标定数据 |
| mem_time_prot.c | `0_App/src/mem_time_prot.c` | 内存/时间保护：`cpu_tasktiming_protections()` |

### 2_SRVSW 层模块

| 模块 | 源文件路径 | 主要职责 |
|------|-----------|---------|
| AswApp | `asw_interface_module/src/0_App/` | ASW 接口层：封装应用数据给 AUTOSAR ASW 使用 |
| communicate.c | `0_App/inc/communicate.h` 引用 | 通信协议栈：CAN/J1939/UDS 协议处理 |
| DFlashBaseInterface.c | `2_SRVSW/DFlashBaseInterface.c` | Flash 持久化：标定数据写入/读出接口 |
| protect.c | `safety_module/src/` | 安全保护：故障诊断与 FaultId 管理 |
| xcp.c | `2_SRVSW/XCP/` | XCP 标定：实时在线参数标定 |

### 4_BSP 层模块

| 模块 | 源文件路径 | 主要职责 |
|------|-----------|---------|
| Bsp_Adc.c | `4_BSP/TC23x/Adc/Bsp_Adc.c` | VADC 硬件寄存器配置与触发控制 |
| Bsp_Pwm.c | `4_BSP/TC23x/Pwm/Bsp_Pwm.c` | GTM/TOM PWM 输出及 ADC 触发设置 |
| Bsp_Can.c | `4_BSP/TC23x/Can/Bsp_Can.c` | MultiCAN 收发控制 |
| Bsp_Gpio.c | `4_BSP/TC23x/Gpio/Bsp_Gpio.c` | GPIO 输出（驱动使能、DIO 控制） |
| Bsp_Cpu.c | `4_BSP/TC23x/Cpu/Bsp_Cpu.c` | CPU 频率/保护区配置 |
| Bsp_Flash.c | `4_BSP/TC23x/Flash/Bsp_Flash.c` | Data Flash 读写操作 |
| Bsp_Init.c | `4_BSP/TC23x/Init/Bsp_Init.c` | 统一 BSP 初始化入口（被 main.c 调用） |

### 5_LLD 层模块

| 模块 | 来源 | 主要职责 |
|------|------|---------|
| IfxVadc | Infineon iLLD | VADC 寄存器级操作 |
| IfxGtm | Infineon iLLD | GTM/TOM PWM 时基与输出 |
| IfxMultican | Infineon iLLD | MultiCAN 控制器 |
| IfxCpu | Infineon iLLD | CPU 复位、保护、时钟 |
| IfxDmu | Infineon iLLD | Data Flash 底层读写 |

---

## 3. 关键依赖链路（调用路径说明）

### 启动链路
```
main.c
  → Bsp_Init.c（BSP 统一初始化）
      → Bsp_Adc / Bsp_Pwm / Bsp_Can / Bsp_Gpio / Bsp_Flash / Bsp_Cpu
  → SelfTest.c（上电自检）
  → ResetHandle.c（读软复位标志）
  → RestorCalData.c（Flash 加载标定数据）
  → TaskSchedule.c（进入 OS 周期调度）
```

### 周期控制链路（1ms 快速任务）
```
TaskSchedule.c → StateMachineHndl()
                   → stateMachine.c（主状态机流转）
                       → AswApp（参数透传到 ASW 层）
PWM 中断（100µs）→ IntStateMachine.c（FOC 三环控制）
                       → AdcApp.c（读取电流/位置 ADC 整形值）
                       → MotorControlPInterface.c（输出控制量）
```

### 数据持久链路
```
stateMachine.c → DFlashBaseInterface.c → Bsp_Flash.c → IfxDmu（LLD）
RestorCalData.c → Bsp_Flash.c → IfxDmu（LLD）
```

### 通信链路
```
TaskSchedule.c → communicate.c → Bsp_Can.c → IfxMultican（LLD）
               → xcp.c（标定帧处理）
```

### 安全保护链路
```
TaskSchedule.c → protect.c（故障检测 / FaultId 管理）
ResetHandle.c  → protect.c（SetFaultIdResetOverCuntError）
protect.c → Bsp_Gpio.c（驱动使能硬件关断）
```

---

## 4. 未展开内容

| 未展开项 | 原因 |
|---------|------|
| OS（ErikaOS）内核调度 | 属于第三方 AUTOSAR OS，内部调度细节不在本图范围；任务触发关系已通过各任务函数体现 |
| 各模块内部子函数依赖 | 展开会导致连线密度过高，可读性大幅下降；已有专题流程图覆盖（状态机图、ADC 采样链路图、三环闭环数据流图等） |
| signal_process_module | 模块结构待补充，信号处理链路待确认 |
| control_algorithm_module 内部子模块 | 算法内部调用层次详见《三环闭环数据流图》 |

---

## 5. 与其他交付物的关系

| 关联交付物 | 关联内容 |
|-----------|---------|
| EPS软件分层架构图.drawio | 本图是其的细化展开，层次结构一致 |
| EPS主状态机流程图_事件表版.drawio | stateMachine.c 的内部状态流转详图 |
| EPS中断状态机流程图_事件表版.drawio | IntStateMachine.c 的内部 FOC 流程详图 |
| EPS三环闭环数据流图_纵向泳道版.drawio | IntStateMachine → MotorControlPInterface 链路的数据流详图 |
| EPS_ADC采样链路专题图.drawio | AdcApp → Bsp_Adc → IfxVadc 链路的详细时序与配置 |
| EPS_ADC寄存器配置专题图.drawio | Bsp_Adc → IfxVadc 中 VADC 寄存器配置树 |
| EPS安全保护链路流程图.drawio | protect.c + ResetHandle.c 链路的保护判断流程 |
| EPS_XCP标定持久化专题图.drawio | xcp.c → DFlash → Bsp_Flash 链路的详细流程 |
| EPS系统启动初始化流程图.drawio | main.c 启动链路的详细初始化步骤 |
