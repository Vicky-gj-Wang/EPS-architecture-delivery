# EPS 专题-代码入口与验证总清单

- 生成时间: 2026-05-26 11:01:13
- 说明: 本清单从专题页面 TOPIC_META 汇总，供评审与交付冻结使用。

## 软件分层与模块依赖
- 文件: topics/eps-topic-01-layered-architecture.html
- 所属链路: 架构支撑链
- 改动入口: 从接口层与模块依赖图开始。
- 首要函数锚点: 1) Code/EPS Code/asw_interface_module/src/0_App/src/asw_communicate.c :: AswCommunicate_Main
- 首要验证项: 统一清单-1: 接口/配置变更影响面评估并留痕

## 启动初始化与使能链
- 文件: topics/eps-topic-02-startup-init-enable.html
- 所属链路: 实时控制主链
- 改动入口: 从初始化主流程和门控条件切入。
- 首要函数锚点: 1) Code/EPS Code/UAES_BV2_driver_module/src/5_LLD/TC23x/Cpu/CStart/IfxCpu_CStart0.c :: IfxCpu_CStart0_Main
- 首要验证项: 上电冷启动/热启动路径回归

## 主/中断状态机协作
- 文件: topics/eps-topic-03-state-machine-collaboration.html
- 所属链路: 实时控制主链
- 改动入口: 先看迁移矩阵，再看事件写入点。
- 首要函数锚点: 1) Code/EPS Code/UAES_BV2_driver_module/src/0_App/src/TaskSchedule.c :: TaskSchedule_MainTick
- 首要验证项: 覆盖 Init-\u003eRun-\u003eFault-\u003eRecover 全路径迁移

## 初始位置自学习与对齐
- 文件: topics/eps-topic-04-initial-position-learning.html
- 所属链路: 实时控制主链
- 改动入口: 先看学习状态，再看切入条件。
- 首要函数锚点: 1) Code/EPS Code/sensor_driver_module/src/0_App/src/driver/LearnInitPosition.c :: LearnInitPosition_Run
- 首要验证项: 零速/低速学习稳定性回归

## 传感器与信号处理链
- 文件: topics/eps-topic-05-sensor-signal-chain.html
- 所属链路: 实时控制主链
- 改动入口: 先看通道映射，再看滤波与校正。
- 首要函数锚点: 1) Code/EPS Code/UAES_BV2_driver_module/src/4_BSP/TC23x/Driver/src/Bsp_Adc.c :: BspAdc_ReadChannel
- 首要验证项: 通道映射正确性与偏置漂移回归

## 三环控制与 FOC
- 文件: topics/eps-topic-06-three-loop-control-foc.html
- 所属链路: 实时控制主链
- 改动入口: 从环路边界和周期映射入手。
- 首要函数锚点: 1) Code/EPS Code/control_algorithm_module/src/1_LIB/control.c :: Control_PositionLoop / Control_SpeedLoop
- 首要验证项: 稳态误差、上升时间、超调量三指标回归

## PWM 触发与 ADC 采样关系
- 文件: topics/eps-topic-07-pwm-adc-trigger-sampling.html
- 所属链路: 高风险配置链
- 改动入口: 先画触发源，再看通道和相位。
- 首要函数锚点: 1) Code/EPS Code/UAES_BV2_driver_module/src/4_BSP/TC23x/Driver/src/Bsp_Pwm.c :: BspPwm_UpdateTrigger
- 首要验证项: 相位偏移扫描，确认最优采样窗口

## 调度时序与中断优先级
- 文件: topics/eps-topic-08-scheduling-interrupt-priority.html
- 所属链路: 高风险配置链
- 改动入口: 先看高优先级 ISR，再看周期任务。
- 首要函数锚点: 1) Code/EPS Code/UAES_BV2_driver_module/src/0_App/src/TaskSchedule.c :: TaskSchedule_MainTick / TaskSchedule_Dispatch
- 首要验证项: Worst-case execution time（WCET）统计与阈值告警

## 安全保护与故障仲裁
- 文件: topics/eps-topic-09-safety-protection-chain.html
- 所属链路: 实时控制主链
- 改动入口: 先看故障等级，再看动作映射。
- 首要函数锚点: 1) Code/EPS Code/safety_module/src/0_App/src/safety/protect.c :: Protect_FaultDetect / Protect_FaultArbitrate
- 首要验证项: 过流/过温/传感器异常三类注入测试

## 通信诊断（UDS/XCP）
- 文件: topics/eps-topic-10-comm-diagnostics-uds-xcp.html
- 所属链路: 架构支撑链
- 改动入口: 从协议入口和会话控制切入。
- 首要函数锚点: 1) Code/EPS Code/communication_stack_module/src/0_App/src/UDS/DiagnosticService/Diagnostic.c :: Diagnostic_MainProcess
- 首要验证项: 统一清单-1: 接口/配置变更影响面评估并留痕

## 参数一致性与 DFlash 持久化
- 文件: topics/eps-topic-11-parameter-flash-consistency.html
- 所属链路: 高风险配置链
- 改动入口: 先看参数生命周期，再看写入事务。
- 首要函数锚点: 1) Code/EPS Code/UAES_BV2_driver_module/src/2_SRVSW/DFlashASWInterface.c :: DFlashASW_WriteRequest
- 首要验证项: 掉电中断写入恢复一致性测试

## 扭矩请求管理与仲裁
- 文件: topics/eps-topic-12-torque-request-management.html
- 所属链路: 实时控制主链
- 改动入口: 先看请求来源，再看仲裁优先级。
- 首要函数锚点: 1) Code/EPS Code/UAES_BV2_driver_module/src/0_App/src/MotorControlPInterface.c :: TorqueRequest_InputMerge
- 首要验证项: 正常/降级/故障三场景扭矩输出一致性回归

## 验证回归与可观测性
- 文件: topics/eps-topic-13-validation-observability.html
- 所属链路: 架构支撑链
- 改动入口: 先建最小验证闭环，再补完整回归。
- 首要函数锚点: 1) Code/EPS Code/TC233_Module_Test/Source/AswInterfaceTest/src/interface_test.c :: InterfaceTest_RunAll
- 首要验证项: 统一清单-1: 接口/配置变更影响面评估并留痕

## 冻结建议
- 以总览页进度看板为准，当前专题细化完成度应为 100%。
- 执行跨专题联动回归后，冻结本清单与专题页版本。
- 评审顺序: 实时控制主链 -> 高风险配置链 -> 架构支撑链。
