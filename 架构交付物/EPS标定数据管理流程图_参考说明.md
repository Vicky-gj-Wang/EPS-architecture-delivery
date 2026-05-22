# EPS 标定数据管理流程图 参考说明

---

## 1. 图表读法

### 结构说明

图采用**"3个入口 + 1个执行层"混合泳道布局**：

| 区域 | 类型 | 颜色 | 内容 | 流向 |
|------|------|------|------|------|
| 应用参数入口 | 纵向泳道 | 暖橙 | PowerOn → SectorInit → Check → LoadDefault → PILearn → AppWrite | 垂直向下 |
| UDS诊断入口 | 纵向泳道 | 靛蓝 | RxFrame → ParseDID → Validate → Apply → WriteDidToFlash | 垂直向下 |
| XCP标定入口 | 纵向泳道 | 蓝色 | OnlineEdit → ShadowUpdate → Preview → Freeze → XcpFreezeToFlash | 垂直向下 |
| DFlash执行层 | 横向泳道 | 明黄 | WriteQueue → Priority → SectorMap → CRC → Flash → Cache → PersistCheck → Notify → Log | 水平向右 |

### 箭头类型

- **实线粗箭头**：3个入口的"触发写入"操作流向执行层
- **实线细箭头**：各入口内部的顺序流、执行层内部的顺序流
- **虚线箭头**：执行层的"完成通知"返回给3个入口

### 阅读方向

1. **竖向阅读**：每个入口泳道代表一个独立的参数修改流程
2. **横向汇总**：所有入口在"触发写入"时汇聚到执行层
3. **返回通知**：执行完成后通知原始入口

---

## 2. 代码映射

### 应用参数入口（Warmth Orange Lane）

| 节点 | 对应函数/模块 | 源文件 | 主要职责 |
|------|-------------|--------|---------|
| 上电触发 | PowerOn / Reset 中断 | 0_App/src/main.c | 系统启动或硬件复位触发 |
| ParamSectorInit() | `ParamSectorInit()` | 2_SRVSW/DFlashBaseInterface.c | 初始化参数存储扇区，建立扇区索引 |
| CheckParamEqual() | `CheckParamEqual()` | 2_SRVSW/DFlashBaseInterface.c | 比对默认值与Flash中的参数版本，判断是否需要回写 |
| LoadDefaultParam() | `LoadDefaultParam()` / `LoadBackDidParam()` | 2_SRVSW/DFlashBaseInterface.c | 默认值回写或参数镜像恢复（上电参数生效） |
| PIAutoTune() | `PIAutoTune()` / 位置学习 | 0_App/src/TaskSchedule.c 或 control_algorithm_module | 初始位置学习、PI参数自适应调整 |
| AppParamWrite() | `AppParamWrite()` / 运行时写入触发 | 2_SRVSW/DFlashBaseInterface.c | 应用参数变化时触发写入队列 |

### UDS诊断入口（Indigo Lane）

| 节点 | 对应函数/模块 | 源文件 | 主要职责 |
|------|-------------|--------|---------|
| 接收UDS请求帧 | CAN接收 + UDS服务解析 | 2_SRVSW/communicate.c | 接收Service 0x22(读DID) / 0x2E(写DID) 请求帧 |
| ParseDID() | `ParseDID()` / DID解析 | 2_SRVSW/communicate.c | 从UDS请求中提取DID标识符和参数值 |
| ValidateDIDParam() | `ValidateDIDParam()` / 参数合法性检查 | 2_SRVSW/communicate.c | 检查参数范围、校验和、数据类型有效性 |
| ApplyDIDParam() | `ApplyDIDParam()` / 应用到镜像 | 2_SRVSW/communicate.c | 参数应用到内存镜像，即时生效 |
| WriteDidToFlash() | `WriteDidToFlash()` / 诊断参数持久化 | 2_SRVSW/communicate.c | UDS诊断服务触发的参数写入队列 |

### XCP标定入口（Blue Lane）

| 节点 | 对应函数/模块 | 源文件 | 主要职责 |
|------|-------------|--------|---------|
| 在线修改参数 | XCP客户端标定工具 | external (XCP Master) | CANape / INCA等标定工具在线修改参数 |
| ShadowParamUpdate() | `ShadowParamUpdate()` / 参数镜像实时更新 | 2_SRVSW/xcp.c | XCP每次修改时实时更新内存中的参数镜像 |
| 预览效果 | 闭环验证 | control_algorithm_module | 在线修改后实时验证控制效果（不落盘） |
| Freeze决策 | 用户确认冻结 | XCP Master UI | 用户决定是否将当前参数值冻结保存到Flash |
| XcpFreezeToFlash() | `XcpFreezeToFlash()` / 冻结持久化 | 2_SRVSW/xcp.c | 冻结确认后触发参数写入队列 |

### DFlash持久化执行层（Yellow Lane）

| 节点 | 对应函数/模块 | 源文件 | 主要职责 |
|------|-------------|--------|---------|
| WriteQueue | 写入队列聚合 | 2_SRVSW/DFlashBaseInterface.c | 汇聚3个入口的写入请求，存储到待处理队列 |
| PrioritySort | 优先级排序 | 2_SRVSW/DFlashBaseInterface.c | **优先级**：App > UDS > XCP；同时触发时按此顺序处理 |
| SectorMapping | 扇区映射 | 2_SRVSW/DFlashBaseInterface.c | 根据参数类型映射到对应的DFlash扇区位置 |
| CRC校验 | `CrcCalc()` / 数据完整性标记 | 2_SRVSW/DFlashBaseInterface.c | 计算参数的CRC校验值，用于掉电恢复判断 |
| WriteToFlash | 实际Flash写入 | 4_BSP/Bsp_Flash.c → 5_LLD/IfxDmu | Bsp_Flash.c 调用 IfxDmu 底层接口实现Flash编程 |
| CacheUpdate | 参数镜像同步 | 2_SRVSW/DFlashBaseInterface.c | Flash写入成功后，同步更新内存中的参数缓存 |
| PersistCheck | 掉电保护校验 | 2_SRVSW/DFlashBaseInterface.c | 校验参数持久化完整性，确保掉电可恢复 |
| NotifyDone() | 完成通知回调 | 2_SRVSW/DFlashBaseInterface.c | 向3个入口返回写入完成信号，支持后续逻辑（如ACK帧返回） |
| LogRecord() | 操作日志记录 | 2_SRVSW/DFlashBaseInterface.c (可选) | 记录参数修改的审计日志（谁改、何时、改了什么） |

---

## 3. 关键设计决策

### 3.1 优先级规则（App > UDS > XCP）

**为什么这样排序？**

| 优先级 | 入口 | 特点 | 排序理由 |
|-------|------|------|---------|
| 1（最高） | 应用参数 | 内部逻辑触发（学习、初始化等） | 系统自身业务逻辑，不应被外部诊断/标定打断 |
| 2（中） | UDS诊断 | 外部服务诊断请求 | 诊断优先级低于应用，但高于实验性标定 |
| 3（最低） | XCP标定 | 在线实验性调参 | 标定是实验性操作，可延迟或舍弃 |

**同时触发时的处理**：
- 若App写入进行中，UDS/XCP请求排队等待
- 若UDS写入进行中，XCP请求排队等待
- 单个写入操作应该是原子的，不允许中断

### 3.2 "3个入口 + 1个执行层" 的好处

| 优势 | 说明 |
|------|------|
| **职责分离** | 每个入口只关心自己的数据验证流程，不用相互干扰 |
| **并行开发** | 3个入口可以由不同团队独立开发，最后在执行层统一汇总 |
| **冲突避免** | 优先级+排序机制明确，不会产生参数修改冲突 |
| **易于测试** | 可以分别测试每个入口的数据流，再测试执行层的并发处理 |
| **易于诊断** | 参数写入失败时，可以快速定位是哪个入口或执行层哪个环节出问题 |

### 3.3 "掉电保护"机制

**CrcCalc + PersistCheck 的意义**：

1. **CrcCalc**：计算参数的CRC校验值，与参数一起写入Flash
2. **PersistCheck**：下次启动时读出Flash中的参数和CRC，比对校验
3. **恢复策略**：
   - CRC正确 → 使用Flash中的参数
   - CRC错误 → 判定Flash参数受损，回到默认值（由 `CheckParamEqual()` 处理）

**防止的场景**：
- 参数写入到Flash的过程中突然掉电
- Flash某个字节被静电干扰
- 恢复时能确保系统有可用的参数值

---

## 4. 未展开内容

| 未展开项 | 原因 | 详见 |
|---------|------|------|
| DID参数映射表 | 参数太多（通常数百个），详见参数字典 | 参数管理规范文档 |
| CRC校验算法细节 | 属于底层加密/校验专题 | Bsp_Flash.c 中的具体算法实现 |
| 掉电恢复的状态机 | 涉及Flash读写状态转换，较复杂 | EPS安全保护链路流程图 |
| 各入口的详细验证规则 | 应用参数/UDS/XCP各有自己的合法性检查 | 各模块的设计说明文档 |
| DFlash扇区划分方案 | 属于Flash存储架构专题 | EPS_ADC寄存器配置专题图（对标定扇区的参考） |

---

## 5. 与其他交付物的关系

| 关联交付物 | 关联内容 |
|-----------|---------|
| EPS系统启动初始化流程图.drawio | 上电时的 ParamSectorInit → CheckParamEqual → LoadDefaultParam 链路 |
| EPS_UDS参数流程专题图.drawio | UDS诊断入口的详细流程（Service 0x22/0x2E 的完整处理） |
| EPS_XCP标定持久化专题图.drawio | XCP标定入口的详细流程（标定数据在线编辑到冻结的全过程） |
| EPS_ADC寄存器配置专题图.drawio | 应用参数中"PI参数、ADC校准参数"等的配置存储 |
| EPS安全保护链路流程图.drawio | 参数异常时的保护和恢复逻辑 |
| EPS模块依赖关系图.drawio | DFlashBaseInterface.c 与 Bsp_Flash.c、communicate.c、xcp.c 之间的调用关系 |

---

## 6. 开发与测试建议

### 单元测试建议

1. **应用参数入口**
   - 测试 PowerOn 时的参数恢复流程
   - 测试 PIAutoTune 的参数学习与保存

2. **UDS诊断入口**
   - 测试各DID的读写请求处理
   - 测试参数合法性校验（越界、类型不匹配等）

3. **XCP标定入口**
   - 测试参数在线修改
   - 测试Freeze确认后的持久化

4. **执行层**
   - 测试优先级排序（模拟3个入口同时触发）
   - 测试CRC校验和掉电恢复
   - 测试完成通知回调

### 集成测试建议

- **场景1**：应用参数和UDS诊断同时触发写入，验证优先级处理
- **场景2**：参数写入过程中模拟掉电，重启后验证恢复
- **场景3**：修改参数后，验证内存镜像和Flash同步
- **场景4**：Flash扇区满，验证扇区切换逻辑

---

## 7. 常见问题排查

| 问题 | 原因 | 解决方向 |
|------|------|---------|
| 参数写入失败 | DFlash扇区已满 / Flash编程异常 / CRC校验错误 | 检查Bsp_Flash.c的返回值；查看日志记录 |
| 参数启动后没有生效 | CheckParamEqual检测到版本不一致，已回到默认值 | 检查Flash中的参数有效性和CRC校验 |
| XCP冻结后参数仍未保存 | XcpFreezeToFlash()请求未能进入执行队列（可能被App/UDS优先级阻挡） | 查看执行层的优先级排序和队列状态 |
| UDS诊断参数读取异常 | DID映射错误或参数镜像未同步 | 检查DID的扇区映射和CacheUpdate逻辑 |

