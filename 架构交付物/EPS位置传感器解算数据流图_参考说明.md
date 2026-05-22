# EPS 位置传感器解算数据流图 参考说明

> 配套图文件：`架构交付物/EPS位置传感器解算数据流图.drawio`
> 生成日期：2026-05-20

---

## 7.1 图的阅读方式

### 整体结构

本图为**三列纵向数据流图**，无泳道，从上到下表示数据处理顺序。每列职责如下：

| 列 | 内容 | 颜色 |
|---|---|---|
| 中央列（主链路） | ADC 采样 → 去偏置 → ATAN 四象限解算 → 极对数换算 → 初始补偿 → 输出 MrElePosition | 紫色系 |
| 右侧列（速度支路） | 从 MrRotorPosition 分叉 → 环形缓冲差分 → 过零点修正 → 低通滤波 → 输出 MrMechSpeed | 紫色系 |
| 左侧列（故障支路） | 从去偏置结果分叉 → 幅值计算 → MotorSensorCheck → 输出 FaultIdMSensorErr | 粉红色系 |

**阅读方向：** 从顶部 ADC 采样节点向下，到底部 FOC 输出节点；速度支路和故障支路各自独立向下汇出。

### 连线含义

- **实线箭头（紫色）：** 算法内部数据流，每 100μs 控制周期执行一次
- **实线箭头（粉红色）：** 故障检测链路数据流
- **实线箭头（蓝色）：** 输出到 FOC 控制器
- **虚线箭头（黄色）：** 外部标定参数输入（上电加载，非实时计算）

### 关键分叉点

1. `n_debias` 节点（去偏置）：主链路向下继续，同时向左分叉到故障幅值计算
2. `n_atan` 节点（ATAN 解算）：位置链路向下继续，同时向右分叉到速度计算链路
3. `n_ini` 节点（初始补偿）：接收 EEPROM 的外部参数输入（虚线）

---

## 7.2 节点代码映射表

所有代码均位于：`Code/EPS Code/sensor_driver_module/src/0_App/src/driver/position.c`

| 图中节点 | 函数 / 代码段 | 行号 |
|---|---|---|
| ADC 采样 | `MrSampleSin`, `MrSampleCos` 字段赋值（由 ADC 驱动写入 mrCalc 结构） | 结构定义见 [position.h L35-38](../Code/EPS%20Code/Global_Include/position.h#L35) |
| 去直流偏置 | `MrATANPositionSpeedAlgorithm()` 偏置段 | [position.c L96-L115](../Code/EPS%20Code/sensor_driver_module/src/0_App/src/driver/position.c#L96) |
| 大小比较→Tan 计算 | 比较 MrATANSin 与 MrATANCos，计算 MrATANTan | [position.c L117-L127](../Code/EPS%20Code/sensor_driver_module/src/0_App/src/driver/position.c#L117) |
| 幅值计算 (sin²+cos²) | `x->MRATANQuadraticSum = ...` | [position.c L128](../Code/EPS%20Code/sensor_driver_module/src/0_App/src/driver/position.c#L128) |
| 四象限索引合成 | `ATAN_Judge = (flag_ABS) | (flag_Sin<<1) | (flag_Cos<<2)` | [position.c L129](../Code/EPS%20Code/sensor_driver_module/src/0_App/src/driver/position.c#L129) |
| ATAN 查表+象限补偿 | `switch(ATAN_Judge)` 8 分支，`MR_ARCTG()` 宏调用 | [position.c L130-L180](../Code/EPS%20Code/sensor_driver_module/src/0_App/src/driver/position.c#L130) |
| 极对数换算 | `PolarNum = ELE_ROTOR_POLE_PAIR / MRROTOR_POLE_PAIR`; `fCalcTemp = MrRotorPosition * PolarNum * 1024 / ATAN_half_pi` | [position.c L184-L192](../Code/EPS%20Code/sensor_driver_module/src/0_App/src/driver/position.c#L184) |
| 初始位置补偿 | `x->MrElePosition = U_ele_position - x->MrIniPosition`; 越界修正 | [position.c L193-L200](../Code/EPS%20Code/sensor_driver_module/src/0_App/src/driver/position.c#L193) |
| 环形缓冲 Δθ | `s_detal_position = x->MrRotorPosition - s_position_cal[s_filter_counter2]`; 环形写入 | [position.c L202-L225](../Code/EPS%20Code/sensor_driver_module/src/0_App/src/driver/position.c#L202) |
| 过零点换向修正 | `if ((s_detal_position + 1.9F) < FLT_EPSILON)` / `> 1.9F` 两段修正 | [position.c L227-L235](../Code/EPS%20Code/sensor_driver_module/src/0_App/src/driver/position.c#L227) |
| 一阶低通滤波 | `s_speed_1 = ((1024-32)*s_speed_1 + 32*s_detal_position) / 1024` | [position.c L236-L237](../Code/EPS%20Code/sensor_driver_module/src/0_App/src/driver/position.c#L236) |
| MrMechSpeed 输出 | `x->MrMechSpeed = s_speed_1 * 4774.65F` | [position.c L238](../Code/EPS%20Code/sensor_driver_module/src/0_App/src/driver/position.c#L238) |
| MotorSensorCheck | `void MotorSensorCheck(MrATANCalculation_t *x)` 完整函数 | [position.c L700-L737](../Code/EPS%20Code/sensor_driver_module/src/0_App/src/driver/position.c#L700) |
| FaultIdMSensorErr | `SetFaultIdMSensorErr()` / `GetFaultIdMSensorErr()` | [position.c L706, L726](../Code/EPS%20Code/sensor_driver_module/src/0_App/src/driver/position.c#L706) |
| GetRotatrPosition (顶层入口) | `uint8 GetRotatrPosition(pPmsmDrive pDrv)` | [position.c L760](../Code/EPS%20Code/sensor_driver_module/src/0_App/src/driver/position.c#L760) |
| MrIniPosition (EEPROM输入) | 上电加载：`pDrv->pospeMR.mrCalc.MrIniPosition = (sint32)U32CalcTmp` | [communicate.c L407](../Code/EPS%20Code/communication_stack_module/src/0_App/src/communicate.c#L407) |

---

## 7.3 未展开说明

| 未展开内容 | 原因 | 指向 |
|---|---|---|
| `MrPllAlgorithm()` (L245) | 当前代码已注释，未激活。PLL 算法结构独立，展开会增加图的复杂度且无实际运行意义 | 如需查阅见 position.c L245-L330 |
| `ResolverATANPositionSpeedAlgorithm()` (L380) | 由 `#if MOTOR_SENSOR_CHOOSE == 1` 控制，当前工程使用 MR（值为0），Resolver 路径关闭 | 如需 Resolver 专题图，参考 position.c L380-L510 |
| `EncPositionSpeedAlgorithm()` (L510) | 编码器路径，备用方案，当前工程未启用 | position.c L510-L560 |
| MrIniPosition 初始位置学习流程 | 一次性 UDS 标定例程（843步，约 84ms），涉及控制模式切换（OpenMode→TorqueMode→SpeedMode），专题内容量大不适合在数据流图中展开 | `LearnInitPosition.c`（337行）；标定完成后结果写入 EEPROM arg32[50] |
| MrOffsetSin / MrOffsetCos 来源 | 同属标定参数，由学习例程或产线标定写入 EEPROM，本图只体现使用点 | `LearnInitPosition.c` + `communicate.c` |

---

## 7.4 其他补充说明

### 关键设计约束

1. **MrRotorPosition 范围**：始终在 `[0, 2π]`，即 ATAN 四象限覆盖完整一圈（物理上为 MR 传感器的机械极对数圈）。
2. **MrElePosition 范围**：`[0, 4096]`，对应电气角 0°~360°（4096 对应 2π），用定点整数传递给 FOC。
3. **极对数关系**：`PolarNum = ELE_ROTOR_POLE_PAIR / MRROTOR_POLE_PAIR`，要求整除，否则函数直接返回（`#if 0` 下有保护检查，当前代码已关闭，需移植时注意）。
4. **速度滤波延迟**：移动差分深度为 10步，每步 100μs，差分窗口 = 1ms；低通滤波 α=32/1024 ≈ 0.03，截止频率较低，速度信号有约 30ms 延迟，位置用 MrElePosition 无滤波延迟。
5. **故障去抖策略**：连续 10次超限才判故障，但一旦恢复正常立即清零，属于严格故障判断 + 快速恢复设计。

### 调用时序

`GetRotatrPosition()` 在 FOC 中断任务中被调用，周期 100μs。与 FOC 电流环同步执行。

### 版本说明

- 覆盖范围：MOTOR_SENSOR_CHOOSE == 0（MR 磁阻传感器）路径，ATAN 算法
- 已知局限：速度系数 4774.65 = 60×1000/(2π×2)，具体推导依赖极对数配置，移植时需重新验证
- 本图生成背景：EPS 软件架构交付物，用于内部开发交接和平台迁移参考
