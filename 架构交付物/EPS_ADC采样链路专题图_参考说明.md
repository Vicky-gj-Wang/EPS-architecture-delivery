# EPS_ADC采样链路专题图_参考说明

## 1. 图的阅读方式
- 图结构：采用纵向参与者泳道，时间自上而下，按 触发源 -> BSP配置 -> LLD/VADC执行 -> APP采样整形 -> 消费端（FOC/Safety） 阅读。
- 主阅读目标：说明 ADC 从 PWM/TOM 触发到采样结果被 FOC 和 Safety 消费的完整链路。
- 线型含义：
  - 实线：本图已展开并可追踪的主链路/关键子链路。
  - 虚线：本图未展开或跨专题链路（本版仅在说明中声明，未绘制具体虚线分支）。

## 2. 节点代码映射表
节点：TimerInit()
代码：[Code/EPS Code/UAES_BV2_driver_module/src/4_BSP/TC23x/Driver/src/Bsp_Init.c](../Code/EPS%20Code/UAES_BV2_driver_module/src/4_BSP/TC23x/Driver/src/Bsp_Init.c#L70)

节点：ADCInit()
代码：[Code/EPS Code/UAES_BV2_driver_module/src/4_BSP/TC23x/Driver/src/Bsp_Adc.c](../Code/EPS%20Code/UAES_BV2_driver_module/src/4_BSP/TC23x/Driver/src/Bsp_Adc.c#L65)

节点：GroupInit()
代码：[Code/EPS Code/UAES_BV2_driver_module/src/4_BSP/TC23x/Driver/src/Bsp_Adc.c](../Code/EPS%20Code/UAES_BV2_driver_module/src/4_BSP/TC23x/Driver/src/Bsp_Adc.c#L95)

节点：G0_ChannelInit()
代码：[Code/EPS Code/UAES_BV2_driver_module/src/4_BSP/TC23x/Driver/src/Bsp_Adc.c](../Code/EPS%20Code/UAES_BV2_driver_module/src/4_BSP/TC23x/Driver/src/Bsp_Adc.c#L127)

节点：G1_ChannelInit()
代码：[Code/EPS Code/safety_module/src/0_App/src/safety/protect.c](../Code/EPS%20Code/safety_module/src/0_App/src/safety/protect.c#L2985)

节点：ADThreePhaseQueue()
代码：[Code/EPS Code/UAES_BV2_driver_module/src/0_App/src/driver/AdcApp.c](../Code/EPS%20Code/UAES_BV2_driver_module/src/0_App/src/driver/AdcApp.c#L1138)

节点：ADC0TriggerPointSet()
代码：[Code/EPS Code/UAES_BV2_driver_module/src/4_BSP/TC23x/Driver/src/Bsp_Pwm.c](../Code/EPS%20Code/UAES_BV2_driver_module/src/4_BSP/TC23x/Driver/src/Bsp_Pwm.c#L461)

节点：ADC1TriggerPointSet()
代码：[Code/EPS Code/UAES_BV2_driver_module/src/4_BSP/TC23x/Driver/src/Bsp_Pwm.c](../Code/EPS%20Code/UAES_BV2_driver_module/src/4_BSP/TC23x/Driver/src/Bsp_Pwm.c#L531)

节点：GROUP_CONFIG_TABLE(queueRequest.triggerConfig)
代码：[Code/EPS Code/UAES_BV2_driver_module/src/4_BSP/TC23x/Config/Adc_Config.h](../Code/EPS%20Code/UAES_BV2_driver_module/src/4_BSP/TC23x/Config/Adc_Config.h#L737)

节点：GetCurrentAdcVal()
代码：[Code/EPS Code/UAES_BV2_driver_module/src/0_App/src/driver/AdcApp.c](../Code/EPS%20Code/UAES_BV2_driver_module/src/0_App/src/driver/AdcApp.c#L337)

节点：GetDcBusVltgVal()
代码：[Code/EPS Code/UAES_BV2_driver_module/src/0_App/src/driver/AdcApp.c](../Code/EPS%20Code/UAES_BV2_driver_module/src/0_App/src/driver/AdcApp.c#L716)

节点：GetBridgeVltgVal()
代码：[Code/EPS Code/UAES_BV2_driver_module/src/0_App/src/driver/AdcApp.c](../Code/EPS%20Code/UAES_BV2_driver_module/src/0_App/src/driver/AdcApp.c#L759)

节点：GetAdcSaftyCheckState()
代码：[Code/EPS Code/UAES_BV2_driver_module/src/0_App/src/driver/AdcApp.c](../Code/EPS%20Code/UAES_BV2_driver_module/src/0_App/src/driver/AdcApp.c#L992)

节点：IntStateMachineHndl() 中 FOC 消费链路
代码：[Code/EPS Code/UAES_BV2_driver_module/src/0_App/src/IntStateMachine.c](../Code/EPS%20Code/UAES_BV2_driver_module/src/0_App/src/IntStateMachine.c#L138)

节点：AdcSaftyCheck_D() 中 Safety 消费链路
代码：[Code/EPS Code/safety_module/src/0_App/src/safety/protect.c](../Code/EPS%20Code/safety_module/src/0_App/src/safety/protect.c#L2983)

## 3. 未展开说明
- 未展开对象范围：
  - VADC/EVADC 寄存器位级配置细节。
  - DMA 模式分支（ADC_DMA_Init）及其完整缓冲策略。
  - FOC 下游控制环（Clarke/Park、电流环调制等）的后续算法链路。
- 未展开原因：
  - 当前专题聚焦“ADC 触发-采样-整形-消费”的主链路，若全部展开会造成连线交叉与阅读跳跃。
- 详细信息去向：
  - 可在后续专题图补充《ADC寄存器配置专题图》《FOC控制环专题图》。

## 4. 其他补充说明
- 方向选型说明：本图核心是跨参与者的请求-响应时序关系，因此采用纵向参与者泳道，不采用横向分层主图。
- 约束边界：根据本轮确认，消费端只保留到 FOC/Safety，不继续展开到更下游执行策略。
- 版本说明：
  - 生成背景：在“信号处理模块跳过”后，按优先级推进 BSP/LLD 硬件链路专题。
  - 覆盖范围：ADC 主链 + 电流/母线电压子链。
  - 已知局限：未覆盖平台差异分支（例如非 TC23x 下的 ADC 路径细节）。
