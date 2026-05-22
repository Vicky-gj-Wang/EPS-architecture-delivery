# EPS_ADC寄存器配置专题图_参考说明

## 1. 图的阅读方式

### 整体结构
本图展示了 ADC（VADC）寄存器配置的**三层参数组织结构**：

```
ADC_CONFIG_TABLE (全局模块配置)
├── GROUP_CONFIG_TABLE[0] (Group 0 组级配置)
│   ├── 仲裁器配置
│   ├── 队列请求配置（关键触发点）
│   ├── 输入类配置
│   └── 通道分配表
└── GROUP_CONFIG_TABLE[1] (Group 1 组级配置)
    ├── 仲裁器配置
    ├── 队列请求配置（关键触发点）
    ├── 输入类配置
    └── 通道分配表
```

### 阅读方向
- **纵向**：从上到下展示参数从全局→组级→通道级的细化过程
- **并行**：左右两侧分别展示 Group 0 和 Group 1 的独立配置

### 颜色含义
| 颜色 | 含义 |
|---|---|
| 黄色（#fff9c4） | ADC 配置容器（GROUP_CONFIG_TABLE） |
| 深黄（#fff3e0） | 组内配置参数块 |
| 蓝色（#e3f2fd） | **关键触发配置**（蓝框标记重点） |

### 关键设计点（蓝框突出）
- **触发模式**：`IfxVadc_TriggerMode_uponRisingEdge` —— PWM 上升沿触发采样
- **触发源**：`IfxVadc_TriggerSource_15` —— 对应 GTM TOM 模块的 PWM 输出
- **优先级**：`high` —— 确保队列请求相对其他请求有优先执行权
- **队列使能**：`TRUE` —— 启用多通道队列采样机制

---

## 2. 节点代码映射表

### 顶层全局配置

| 配置项 | 源文件 | 代码位置 | 说明 |
|---|---|---|---|
| ADC_CONFIG_TABLE | [Adc_Config.h](Code/EPS%20Code/UAES_BV2_driver_module/src/4_BSP/TC23x/Config/Adc_Config.h#L81) | L81-92 | 全局 VADC 模块配置表 |
| globalInputClass[0].resolution | [Adc_Config.h](Code/EPS%20Code/UAES_BV2_driver_module/src/4_BSP/TC23x/Config/Adc_Config.h#L84) | L84 | 输入类 0 分辨率（12bit） |
| globalInputClass[0].sampleTime | [Adc_Config.h](Code/EPS%20Code/UAES_BV2_driver_module/src/4_BSP/TC23x/Config/Adc_Config.h#L85) | L85 | 采样时间 0.5µs |
| ADC_PRECISION_FACTOR | [Adc_Config.h](Code/EPS%20Code/UAES_BV2_driver_module/src/4_BSP/TC23x/Config/Adc_Config.h#L55) | L55 | 2^12 = 4096（12bit 精度因子） |
| ADC_SAMPLE_TIME | [Adc_Config.h](Code/EPS%20Code/UAES_BV2_driver_module/src/4_BSP/TC23x/Config/Adc_Config.h#L51) | L51 | 0.5e-6F（秒） |

### Group 0 配置

| 配置项 | 源文件 | 代码位置 | 说明 |
|---|---|---|---|
| GROUP_CONFIG_TABLE[0] | [Adc_Config.h](Code/EPS%20Code/UAES_BV2_driver_module/src/4_BSP/TC23x/Config/Adc_Config.h#L737) | L737-801（第一个Group） | Group 0 完整配置块 |
| groupId | [Adc_Config.h](Code/EPS%20Code/UAES_BV2_driver_module/src/4_BSP/TC23x/Config/Adc_Config.h#L738) | L738 | IfxVadc_GroupId_0 |
| module | [Adc_Config.h](Code/EPS%20Code/UAES_BV2_driver_module/src/4_BSP/TC23x/Config/Adc_Config.h#L739) | L739 | &g_App_Vadc.vadc（VADC 模块实例引用） |
| master | [Adc_Config.h](Code/EPS%20Code/UAES_BV2_driver_module/src/4_BSP/TC23x/Config/Adc_Config.h#L740) | L740 | IfxVadc_GroupId_0（主组 ID） |
| disablePostCalibration | [Adc_Config.h](Code/EPS%20Code/UAES_BV2_driver_module/src/4_BSP/TC23x/Config/Adc_Config.h#L741) | L741 | FALSE（启用校准） |
| arbiterRoundLength | [Adc_Config.h](Code/EPS%20Code/UAES_BV2_driver_module/src/4_BSP/TC23x/Config/Adc_Config.h#L746) | L746 | 4-slot 仲裁轮转 |
| requestSlotQueueEnabled | [Adc_Config.h](Code/EPS%20Code/UAES_BV2_driver_module/src/4_BSP/TC23x/Config/Adc_Config.h#L747) | L747 | TRUE（启用队列） |
| queueRequest.triggerConfig | [Adc_Config.h](Code/EPS%20Code/UAES_BV2_driver_module/src/4_BSP/TC23x/Config/Adc_Config.h#L758) | L758-762 | 队列触发配置块 |
| triggerMode (uponRisingEdge) | [Adc_Config.h](Code/EPS%20Code/UAES_BV2_driver_module/src/4_BSP/TC23x/Config/Adc_Config.h#L760) | L760 | 上升沿触发 |
| triggerSource (TriggerSource_15) | [Adc_Config.h](Code/EPS%20Code/UAES_BV2_driver_module/src/4_BSP/TC23x/Config/Adc_Config.h#L761) | L761 | PWM/TOM 触发源 |
| requestSlotPrio (high) | [Adc_Config.h](Code/EPS%20Code/UAES_BV2_driver_module/src/4_BSP/TC23x/Config/Adc_Config.h#L763) | L763 | 队列优先级 |
| requestSlotStartMode | [Adc_Config.h](Code/EPS%20Code/UAES_BV2_driver_module/src/4_BSP/TC23x/Config/Adc_Config.h#L764) | L764 | cancelInjectRepeat（队列启动模式） |
| inputClass[0/1] | [Adc_Config.h](Code/EPS%20Code/UAES_BV2_driver_module/src/4_BSP/TC23x/Config/Adc_Config.h#L774) | L774-782 | Group 0 输入类参数 |

### Group 1 配置

| 配置项 | 源文件 | 代码位置 | 说明 |
|---|---|---|---|
| GROUP_CONFIG_TABLE[1] | [Adc_Config.h](Code/EPS%20Code/UAES_BV2_driver_module/src/4_BSP/TC23x/Config/Adc_Config.h#L802) | L802-840（第二个Group） | Group 1 完整配置块 |
| groupId | [Adc_Config.h](Code/EPS%20Code/UAES_BV2_driver_module/src/4_BSP/TC23x/Config/Adc_Config.h#L803) | L803 | IfxVadc_GroupId_1 |
| module | [Adc_Config.h](Code/EPS%20Code/UAES_BV2_driver_module/src/4_BSP/TC23x/Config/Adc_Config.h#L804) | L804 | &g_App_Vadc.vadc（VADC 模块实例引用） |
| master | [Adc_Config.h](Code/EPS%20Code/UAES_BV2_driver_module/src/4_BSP/TC23x/Config/Adc_Config.h#L805) | L805 | IfxVadc_GroupId_1（主组 ID） |
| disablePostCalibration | [Adc_Config.h](Code/EPS%20Code/UAES_BV2_driver_module/src/4_BSP/TC23x/Config/Adc_Config.h#L806) | L806 | FALSE（启用校准） |
| queueRequest.triggerConfig | [Adc_Config.h](Code/EPS%20Code/UAES_BV2_driver_module/src/4_BSP/TC23x/Config/Adc_Config.h#L823) | L823-827 | 队列触发配置块 |
| triggerMode (uponRisingEdge) | [Adc_Config.h](Code/EPS%20Code/UAES_BV2_driver_module/src/4_BSP/TC23x/Config/Adc_Config.h#L825) | L825 | 上升沿触发 |
| triggerSource (TriggerSource_15) | [Adc_Config.h](Code/EPS%20Code/UAES_BV2_driver_module/src/4_BSP/TC23x/Config/Adc_Config.h#L826) | L826 | PWM/TOM 触发源 |
| requestSlotPrio (high) | [Adc_Config.h](Code/EPS%20Code/UAES_BV2_driver_module/src/4_BSP/TC23x/Config/Adc_Config.h#L828) | L828 | 队列优先级 |
| requestSlotStartMode | [Adc_Config.h](Code/EPS%20Code/UAES_BV2_driver_module/src/4_BSP/TC23x/Config/Adc_Config.h#L829) | L829 | cancelInjectRepeat（队列启动模式） |

### 通道配置表

| 配置项 | 源文件 | 代码位置 | 说明 |
|---|---|---|---|
| s_G0_CHANNEL_CONFIG_TABLE[12] | [Adc_Config.h](Code/EPS%20Code/UAES_BV2_driver_module/src/4_BSP/TC23x/Config/Adc_Config.h#L98) | L98-405 | Group 0 通道表（12个元素） |
| CHANNEL_CURRENT_A | [Adc_Config.h](Code/EPS%20Code/UAES_BV2_driver_module/src/4_BSP/TC23x/Config/Adc_Config.h#L101) | L101-126 | I_A 三相电流第一路 |
| CHANNEL_CURRENT_B | [Adc_Config.h](Code/EPS%20Code/UAES_BV2_driver_module/src/4_BSP/TC23x/Config/Adc_Config.h#L129) | L129-154 | I_B 三相电流第二路 |
| CHANNEL_MR_SIN1 | [Adc_Config.h](Code/EPS%20Code/UAES_BV2_driver_module/src/4_BSP/TC23x/Config/Adc_Config.h#L157) | L157-183 | 位置反馈 SIN 信号 |
| s_G1_CHANNEL_CONFIG_TABLE[12] | [Adc_Config.h](Code/EPS%20Code/UAES_BV2_driver_module/src/4_BSP/TC23x/Config/Adc_Config.h#L430) | L430-665 | Group 1 通道表（12个元素） |
| CHANNEL_CURRENT_C | [Adc_Config.h](Code/EPS%20Code/UAES_BV2_driver_module/src/4_BSP/TC23x/Config/Adc_Config.h#L433) | L433-457 | I_C 三相电流第三路 |
| CHANNEL_4911_OOS | [Adc_Config.h](Code/EPS%20Code/UAES_BV2_driver_module/src/4_BSP/TC23x/Config/Adc_Config.h#L460) | L460-484 | 4911 芯片 OOS 偏置输出 |
| CHANNEL_MOTOR_POWER | [Adc_Config.h](Code/EPS%20Code/UAES_BV2_driver_module/src/4_BSP/TC23x/Config/Adc_Config.h#L547) | L547-571 | 电机电源电压（UPower） |
| CHANNEL_BATTERY_POWER | [Adc_Config.h](Code/EPS%20Code/UAES_BV2_driver_module/src/4_BSP/TC23x/Config/Adc_Config.h#L574) | L574-598 | 电池供电电压（VBAT） |
| CHANNEL_A6862_DIAG | [Adc_Config.h](Code/EPS%20Code/UAES_BV2_driver_module/src/4_BSP/TC23x/Config/Adc_Config.h#L601) | L601-625 | 6862 门极驱动芯片诊断信号 |
| CHANNEL_BR_EN | [Adc_Config.h](Code/EPS%20Code/UAES_BV2_driver_module/src/4_BSP/TC23x/Config/Adc_Config.h#L628) | L628-651 | 制动继电器使能状态读取 |

### 初始化调用链

| 函数 | 源文件 | 代码位置 | 说明 |
|---|---|---|---|
| ADCInit() | [Bsp_Adc.c](Code/EPS%20Code/UAES_BV2_driver_module/src/4_BSP/TC23x/Driver/src/Bsp_Adc.c#L162) | L162 | ADC 初始化入口，调用 IfxVadc_Adc_initModule() |
| GroupInit() | [Bsp_Adc.c](Code/EPS%20Code/UAES_BV2_driver_module/src/4_BSP/TC23x/Driver/src/Bsp_Adc.c#L65) | L65 | 调用 IfxVadc_Adc_initGroup()，传入 GROUP_CONFIG_TABLE |
| G0_ChannelInit() | [Bsp_Adc.c](Code/EPS%20Code/UAES_BV2_driver_module/src/4_BSP/TC23x/Driver/src/Bsp_Adc.c#L95) | L95-126 | Group 0 通道循环初始化，调用 Adc_ChannelAddToGroup() |
| G1_ChannelInit() | [Bsp_Adc.c](Code/EPS%20Code/UAES_BV2_driver_module/src/4_BSP/TC23x/Driver/src/Bsp_Adc.c#L127) | L127-157 | Group 1 通道循环初始化 |

---

## 3. 未展开说明

### 3.1 后台扫描请求配置
- **范围**：`GROUP_CONFIG_TABLE[0/1].backgroundScanRequest`
- **未展开原因**：当前禁用（`autoBackgroundScanEnabled=FALSE`），不属于主采样链路
- **用途**：可用于非实时、低优先级的通道采样（如温度监测）
- **详细信息**：见 [Adc_Config.h L749-756](Code/EPS%20Code/UAES_BV2_driver_module/src/4_BSP/TC23x/Config/Adc_Config.h#L749)

### 3.2 扫描请求配置
- **范围**：`GROUP_CONFIG_TABLE[0/1].scanRequest`
- **未展开原因**：当前禁用（`autoscanEnabled=FALSE`），不属于核心采样机制
- **用途**：按序列连续扫描多个通道
- **详细信息**：见 [Adc_Config.h L765-772](Code/EPS%20Code/UAES_BV2_driver_module/src/4_BSP/TC23x/Config/Adc_Config.h#L765)

### 3.3 限值检查与FIFO
- **范围**：通道级配置中的 `limitCheck`、`lowerBoundary`、`upperBoundary` 字段
- **未展开原因**：当前配置为 `noCheck`，不涉及硬件限值监控
- **用途**：可用于硬件级过流、过压检测
- **详细信息**：见各通道配置结构的 `limitCheck` 成员

### 3.4 DMA 数据搬运
- **范围**：通道配置中 `ADC_DMA_ENABLE` 条件编译分支
- **未展开原因**：当前禁用（`ADC_DMA_ENABLE=0`），直接用 CPU 中断处理
- **启用条件**：若需高频采样减轻 CPU 负担，可改为 `ADC_DMA_ENABLE=1`
- **影响**：通道中断源从 `IfxSrc_Tos_cpu0` 改为 `IfxSrc_Tos_dma`
- **相关代码**：[Adc_Config.h L117-124](Code/EPS%20Code/UAES_BV2_driver_module/src/4_BSP/TC23x/Config/Adc_Config.h#L117)

---

## 4. 其他补充说明

### 架构约束与设计决策

#### 4.1 双组独立触发的必要性
- **Group 0** 负责三相电流（I_A、I_B）+ 位置信号，必须与 PWM 同步
- **Group 1** 负责电压采样（VBAT、UPower）+ 其他诊断信号，同样需 PWM 同步
- 两个组共享 **TriggerSource_15（PWM）**，但各自独立执行队列采样
- 这保证了三相电流和电压的相干性，提高了 FOC 控制精度

#### 4.2 队列请求优先级为 "high" 的意义
- 确保周期性的电流/电压采样不被其他请求（扫描、后台扫描）打断
- 实现 10kHz（或更高频率）的实时采样保障

#### 4.3 4-slot 仲裁轮转设置
- 仲裁器每个轮转周期可处理最多 4 个通道采样
- Group 0 实际用 7 个通道，需要至少 2 轮才能完成
- 这影响了采样的吞吐率和延迟特性

#### 4.4 0.5µs 采样时间含义
- 对应 VADC 模块的采样阶段时长（不含转换时间）
- 转换阶段固定约 15 个 ADC 时钟周期
- 总采样周期 ≈ 0.5µs（采样）+ 0.75µs（转换） ≈ 1.25µs

### 与 ADC 采样链路图的关系
本图是 [EPS_ADC采样链路专题图](EPS_ADC采样链路专题图.drawio) 的 **细节下钻图**，专注于寄存器配置层面。  
- 采样链路图展示的是**功能流程**（Trigger → VADC执行 → APP整形 → FOC/Safety）
- 本图展示的是**硬件配置**（参数表 → 寄存器初始化）

### 参数修改影响清单

| 修改项 | 影响范围 | 修改文件 | 注意事项 |
|---|---|---|---|
| 采样时间 | 新增/减少 ADC 采样延迟 | [Adc_Config.h L51](Code/EPS%20Code/UAES_BV2_driver_module/src/4_BSP/TC23x/Config/Adc_Config.h#L51) | 变化影响 FOC 控制延迟 |
| 分辨率（12→10→8 bit） | 精度降低、转换速度提升 | [Adc_Config.h L54-62](Code/EPS%20Code/UAES_BV2_driver_module/src/4_BSP/TC23x/Config/Adc_Config.h#L54) | 需同步修改 ADC_PRECISION_FACTOR 和转换函数 |
| 触发源（改为 other） | 破坏 PWM 同步 | [Adc_Config.h L761, L826](Code/EPS%20Code/UAES_BV2_driver_module/src/4_BSP/TC23x/Config/Adc_Config.h#L761) | **不建议修改**，会导致采样时序错误 |
| 通道分配 | 改变结果寄存器位置 | [Adc_Config.h s_G0/G1_CHANNEL_CONFIG_TABLE](Code/EPS%20Code/UAES_BV2_driver_module/src/4_BSP/TC23x/Config/Adc_Config.h#L98) | 需同步更新 [AdcApp.c](Code/EPS%20Code/UAES_BV2_driver_module/src/2_SRVSW/AppLayer/AdcApp/src/AdcApp.c) 中的读取代码 |

### 版本说明
- **生成日期**：2026-05-21
- **覆盖范围**：ADC_CONFIG_TABLE 及其下属 GROUP_CONFIG_TABLE、CHANNEL_CONFIG_TABLE 的完整参数
- **关注点**：主采样链路的寄存器配置，未展开的可选特性详见表 3
- **相关文件**：
  - [Adc_Config.h](Code/EPS%20Code/UAES_BV2_driver_module/src/4_BSP/TC23x/Config/Adc_Config.h)（配置表）
  - [Bsp_Adc.c](Code/EPS%20Code/UAES_BV2_driver_module/src/4_BSP/TC23x/Driver/src/Bsp_Adc.c)（初始化实现）
  - [AdcApp.c](Code/EPS%20Code/UAES_BV2_driver_module/src/2_SRVSW/AppLayer/AdcApp/src/AdcApp.c)（采样消费端）
