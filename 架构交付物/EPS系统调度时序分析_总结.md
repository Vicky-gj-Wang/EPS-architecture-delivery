# EPS 系统调度时序分析总结

> 平台：Infineon AURIX TC233 @ 200MHz（PLL）/ 20MHz 晶振  
> RTOS：Erika OS（AUTOSAR OSEK ECC2 兼容）  
> 电机控制：FOC，PWM 10kHz（GTM 模块）  
> 分析时间：2026-05

---

## 1. 优先级体系总览

| 层级 | 类型 | 优先级范围 | 说明 |
|------|------|-----------|------|
| 硬件中断层 | ISR1 / ISR2 | P1 ~ P255（越大越高） | 可随时打断任何 OS 任务 |
| OS 任务层 | Erika OS Task | Prio1 ~ Prio16（越大越高） | 软件调度，受硬件中断抢占 |

**ISR1 vs ISR2 区别：**

- **ISR1**：退出后直接返回被打断处，OS 完全不感知，延迟极低。用于 FOC、WD 喂狗、STM 节拍等对实时性要求极高的场景。
- **ISR2**：退出时触发 OS 重新调度（调用 `EE_ISR2_WRAPPER_BODY`），可唤醒等待任务。用于 CAN、SPI、ADC 等需要通知上层软件的场景。

---

## 2. 硬件中断完整列表

| 优先级 | 中断名称 | 类型 | 周期/触发 | 功能说明 |
|--------|---------|------|---------|---------|
| P62 | CAN BASEFIO_AG RX | ISR2 | 事件触发 | AG 标定工具（HYCET）CAN 报文接收 |
| P61 | SMU 安全告警 | ISR2 | 事件触发 | 硬件安全监控单元告警，触发安全响应 |
| P60 | GTM WD 喂狗 | ISR1 | 1kHz（1ms） | 切换 GPIO 电平喂 4912 看门狗芯片 |
| P59 | CAN ASW TX | ISR2 | 事件触发 | 应用层 CAN 报文发送完成通知 |
| P58 | CAN BaseFio TX | ISR2 | 事件触发 | 基础 IO 层 CAN 报文发送完成通知 |
| P57 | CAN ASW RX | ISR2 | 事件触发 | 接收整车控制指令（转矩请求等） |
| P56 | CAN XCP TX | ISR2 | 事件触发 | XCP 标定数据 CAN 发送完成 |
| P55 | ADC 校准 | ISR2 | 事件触发 | ADC 校准完成，仅标定阶段使用，正常运行不活跃 |
| P54 | CAN BaseFio RX | ISR2 | 事件触发 | 接收 UDS/FIO 诊断报文 |
| P53 | CCU6 ICU | ISR1 | 事件触发 | PWM 捕获输入（角度信号备用通道），正常运行活跃度低 |
| P50/51 | QSPI A4412 TX/RX | ISR2 | ~1ms（每任务触发） | 与电源管理芯片 A4412 的 SPI 通信 |
| P40/41 | QSPI 4911 TX/RX | ISR2 | ~1ms（每任务触发） | 与 MOSFET 驱动芯片 4911 的 SPI 通信 |
| **P30** | **FOC PWM ISR ★** | **ISR1** | **10kHz（100μs）** | **FOC 电流环核心：`IntStateMachineHndl()`** |
| P23 | SENT CH1 位置传感器 | ISR2 | ~1kHz | SENT 协议位置/扭矩传感器数据就绪 |
| P20 | STM 500μs 节拍 | ISR1* | 500μs | `CounterTick()` 驱动 OS 定时触发任务 |

> **ISR1\*** ：STM 中断本身是 ISR1（OS 不感知），但其内部调用 `CounterTick()` 间接激活 OS 的 Counter，从而驱动 Alarm 定时触发各 OS 任务，是连接硬件定时器与 OS 软件调度的桥梁。

---

## 3. OS 任务列表

| OS 优先级 | 任务名称 | 周期 | 核心功能 |
|-----------|---------|------|---------|
| Prio 16 | OSTASK_INIT | 启动时执行一次 | 系统初始化：`Bsp_Init()` → `PowerManagerInit()` → `StartOS()` |
| **Prio 8** | **OSTASK_1MS** | **1ms** | `StateMachine()` + `UDS NetworkLayer` + ADC 滤波 + XCP 命令处理 |
| Prio 4 | OSTASK_2x5MS | 2.5ms（即每 1ms 交替执行两个 5ms 任务之一） | `Asw_2x5ms()`（主控制逻辑）+ XCP DAQ 采集 |
| Prio 2 | OSTASK_10MS | 10ms | `UDS` 诊断更新 + `Asw_5ms()` + 故障恢复 + 软件看门狗喂狗 |
| Prio 1 | OSTASK_BACKGROUND | 持续运行 | DFlash 参数扇区擦除（readyState 执行一次），其余时间填充 CPU 空闲 |

**OS 时钟驱动链：**

```
STM 硬件定时器（500μs）
  └─ ISR1 中调用 CounterTick()
       └─ 驱动 OS Counter（每 2 次 = 1ms）
            ├─ Alarm_1ms   → 激活 OSTASK_1MS
            ├─ Alarm_2x5ms → 激活 OSTASK_2x5MS（每 2.5ms）
            └─ Alarm_10ms  → 激活 OSTASK_10MS
```

---

## 4. 时序关键参数

| 参数 | 数值 |
|------|------|
| FOC PWM 频率 | 10kHz（周期 100μs） |
| 看门狗 PWM 频率 | 1kHz（实际 GPIO 切换输出约 500Hz 方波） |
| STM 中断周期 | 500μs（2次 = 1ms OS Counter Tick） |
| 1ms 任务最大积压激活数 | 5（`rnact_max` 配置） |
| CAN 通道数 | 4 路（ASW / XCP / BaseFio / BASEFIO_AG） |
| SPI 通道数 | 2 路（A4412 电源管理 / 4911 MOSFET 驱动） |

---

## 5. 实时性风险分析

### ⚠ 关键风险：FOC ISR 优先级低于 CAN/SPI 中断

**现象：**  
FOC PWM ISR 优先级为 **P30**，而所有 CAN（P54~P62）和 SPI（P40~P51）中断优先级均高于 P30。

**影响：**  
当 CAN 报文到达或 SPI 传输完成时，会**中断正在执行的 FOC 电流环计算**（`IntStateMachineHndl()`），导致：
- FOC 计算延迟不确定
- 电流环输出时序抖动
- 在高负载通信时（如 XCP 标定期间大量 DAQ 采集），抖动加剧

**EPS 应用风险等级：** 高（电流环抖动直接影响转向手感和 NVH 性能）

**可能的改进方向：**
1. 将 FOC ISR 优先级提升至高于所有 CAN/SPI 中断（P63+）
2. 在 FOC ISR 内部增加执行时间监控，超时触发诊断
3. XCP DAQ 采集频率在高转速/高电流工况下降级

### STM 节拍与 FOC PWM 的相位关系

- STM 500μs 与 FOC 100μs 存在整数倍关系（1:5），理论上不存在频率干拍
- 但 STM ISR1 触发后 OS 任务激活需要调度延迟，1ms 任务实际执行时刻相对 FOC 帧存在 0~100μs 的不确定偏移

---

## 6. 启动流程

```
core0_main()
  ├─ Bsp_Init()              ← 外设初始化（GTM/CAN/SPI/ADC/STM 等）
  ├─ PowerManagerInit()      ← 电源管理初始化
  ├─ TaskInit() → StartOS()  ← 启动 Erika OS，激活 OSTASK_INIT
  └─ TaskRun()               ← 进入无限循环（OS 调度接管）
```

---

## 7. 产出物

| 文件 | 说明 |
|------|------|
| `EPS调度时序图_完整版.drawio` | Draw.io 可视化时序图，包含所有中断和 OS 任务的时间轴波形 |
| `EPS系统调度时序分析_总结.md` | 本文档，文字总结 |

---

## 8. 待继续分析的内容（Layer 2+）

- [ ] **Layer 2 状态机**：读取 `stateMachine.c` / `IntStateMachine.c`，梳理系统状态与转换条件
- [ ] **Layer 3 数据流**：`g_motorDrv`（`pmsmDrive` 结构体）字段分配与各模块读写关系
- [ ] **Layer 4 控制算法**：FOC 电流环、速度环、位置环的具体实现（PI/PID 参数、前馈、解耦）
- [ ] **Layer 5 外设服务**：ADC 采样链路、SENT 解码、CAN 报文帧格式
