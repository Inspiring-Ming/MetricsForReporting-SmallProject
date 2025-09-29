# ESG Knowledge Graph — Naming Conventions (Aligned to current TTL)

> **Scope**：本规范仅定义 *命名约定*（前缀、局部名 localName 的样式、何时使用全 IRI 等）；不改变你现有的类/属性/实例设计与语义。**一切以现有 TTL 为准**。

## 1. Namespaces & Prefixes

与 TTL 完全一致：

```turtle
@prefix esg:  <http://example.org/esg#> .
@prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> .
@prefix xsd:  <http://www.w3.org/2001/XMLSchema#> .
```

- 统一使用 **`esg:`** 作为自有类、属性、个体的命名空间前缀。
- 允许在必要时使用 **全 IRI**（`<http://example.org/esg#...>`）表示无法作为 QNAME 的局部名（见 §5.3）。

## 2. Resource Types & Allowed LocalName Styles

本节定义**局部名（localName）**的大小写/字符集合。除明确说明外，均使用 **ASCII** 字母数字与下划线 `_`。

### 2.1 Classes（类）
- **样式**：`PascalCase`
- **示例**：`Industry`, `ReportingFramework`, `Category`, `Metric`, `Model`, `Implementation`, `DatasetVariable`, `DataSource`

### 2.2 Object/Data Properties（属性）
- **样式**：`lowerCamelCase`，语义偏“动词 + 宾语”或“has*/is*”模式
- **示例**：  
  `reportsUsing`, `includes`, `consistsOf`,  
  `hasType`, `hasCalculationMethod`, `hasDescription`, `hasMetricType`, `hasUnit`,  
  `isCalculatedBy`, `hasFormula`, `hasMathematicalExpression`, `hasCalculationType`,  
  `requiresInputFrom`, `executesWith`,  
  `hasLanguage`, `hasFilePath`, `hasFunction`, `hasInputParameters`, `hasReturnType`, `hasValidation`,  
  `alignmentReason`, `hasConfidenceScore`, `isUnitCompatible`, `sourceFrom`,  
  `hasFileName`, `hasRecordCount`, `hasCoverage`, `hasDataType`

> 以上属性名均来自现有 TTL；新增属性应保持相同风格。

### 2.3 Individuals（实例）按类型细分

#### A) 行业（`esg:Industry` 的实例）
- **样式**：**全小写**，可为单词或合成词，不带分隔符  
- **示例**：`esg:commercialbanks`, `esg:semiconductors`

> 推荐与 `rdfs:label` 配合：`rdfs:label "Commercial Banks"` / `"Semiconductors"`

#### B) 报告框架（`esg:ReportingFramework` 的实例）
- **样式**：`PascalCase`，可在前缀位置编码框架名 + 行业名
- **示例**：`esg:SASBCommercialBanks`, `esg:SASBSemiconductors`

#### C) 类别（`esg:Category` 的实例）
- **样式**：主要为 `PascalCase` 连写；**允许**在必要时使用**全 IRI**（见 §5.3）
- **示例（QNAME）**：  
  `esg:BusinessEthics`, `esg:DataSecurity`, `esg:EnergyManagementinManufacturing`,  
  `esg:GreenhouseGasEmissions`, `esg:WasteandHazardousMaterialsManagement`,  
  `esg:RecruitingManagingaGlobalSkilledWorkforce`, `esg:WaterManagement`, `esg:SystemicRiskManagement`
- **示例（全 IRI）**：  
  `<http://example.org/esg#IncorporationofEnvironmental,Social,andGovernanceFactorsinCreditAnalysis>`

> 注意：类别命名**允许**在连写中保留连接词（`and/in/of` 等）的小写形式（如 `Wasteand...`、`...in...`），以与现有 TTL 完全一致。

#### D) 指标（`esg:Metric` 的实例）
- **样式**：多为 `PascalCase` 英文短语连写，可包含数字（如 Scope1）
- **示例**：  
  直接度量：`esg:AccountHoldersAffected`, `esg:GrossGlobalScope1Emissions`, `esg:TotalEnergyConsumed`,  
  计算度量：`esg:GHGEmissionIntensity`, `esg:PercentageGridElectricity`, `esg:PercentageRenewableEnergy`,  
  水相关：`esg:TotalWaterConsumed`, `esg:PercentageWaterConsumedHighStress`, `esg:TotalWaterWithdrawn`

> 输入指标（用于模型）也按 `PascalCase`：`esg:Scope1Emission`, `esg:Scope2Emission`, `esg:Revenue`, `esg:GridElectricity`, `esg:RenewableEnergy`, `esg:TotalEnergy` 等。

#### E) 模型 & 实现（`esg:Model` / `esg:Implementation` 的实例）
- **样式**：`PascalCase`，模型通常以 `...Model` 结尾；实现以 `...Implementation` 结尾
- **示例**：`esg:GHGEmissionIntensityModel`, `esg:GridElectricityRateModel`, `esg:GHGEmissionIntensityImplementation`

#### F) 数据集变量（`esg:DatasetVariable` 的实例）
- **样式**：**全大写 + 下划线**（`UPPER_SNAKE_CASE`）或全大写连写（与 TTL 一致）
- **示例**：  
  `esg:CO2DIRECTSCOPE1`, `esg:CO2INDIRECTSCOPE2`, `esg:ENERGYUSETOTAL`,  
  `esg:ELECTRICITYPURCHASED`, `esg:RENEWENERGYPURCHASED`,  
  `esg:WATERCONSUMPTIONTOTAL`, `esg:WATERWITHDRAWALTOTAL`,  
  `esg:RECYCLEDHAZARDOUSWASTE`, `esg:TARGETS_EMISSIONS`,  
  `esg:BRIBERYANDCORRUPTIONPAIINSUFFICIENTACTIONS`, `esg:ANALYTICESTIMATEDCO2TOTAL`, `esg:revt`（保留小写变量名的原样）

> 说明：`esg:revt` 在 TTL 中为小写，**保留源数据代号原样**；若新增变量，建议优先 `UPPER_SNAKE_CASE`，但允许保留真实字段大小写以便追溯。

#### G) 数据源（`esg:DataSource` 的实例）
- **样式**：`PascalCase` 组合词
- **示例**：  
  `esg:SemiconductorsEurofidaiEnvironmentDataset`,  
  `esg:CommercialBanksEurofidaiEnvironmentDataset`,  
  `esg:SemiconductorWRDSFinancialDataset`

## 3. Human Labels（rdfs:label）

- **样式**：**可读的英文标题**，允许空格与符号（如 `&`、括号等）。
- **做法**：`localName` 负责兼容性与可编程性，`rdfs:label` 提供对外显示；两者**不必完全一致**。
- **示例**：  
  `esg:FinancialInclusionCapacityBuilding` → `rdfs:label "Financial Inclusion & Capacity Building"`  
  `esg:GHGEmissionIntensity` → `rdfs:label "GHGEmissionIntensity"`（与 localName 一致亦可）

## 4. Property Naming Rules（属性命名）

- **通用规则**：`lowerCamelCase`；优先使用领域动作词或 `has*/is*` 前缀  
- **组合用法**（与 TTL 一致）：
  - 结构/从属：`reportsUsing`, `includes`, `consistsOf`
  - 语义元信息：`hasType`, `hasDescription`, `hasMetricType`, `hasUnit`, `hasDataType`
  - 计算关系：`isCalculatedBy`, `requiresInputFrom`, `executesWith`, `hasFormula`, `hasMathematicalExpression`, `hasCalculationType`
  - 映射/来源：`obtainedFrom`, `sourceFrom`, `alignmentReason`, `hasConfidenceScore`, `isUnitCompatible`
  - 实现细节：`hasLanguage`, `hasFilePath`, `hasFunction`, `hasInputParameters`, `hasReturnType`, `hasValidation`
  - 数据源元数据：`hasFileName`, `hasRecordCount`, `hasCoverage`

> 新增属性时请复用上述风格，以确保 API/查询层稳定。

## 5. Special Characters & Full IRIs（特殊字符与全 IRI）

### 5.1 QNAME（前缀名）可用字符
- **推荐正则**：`^[A-Za-z][A-Za-z0-9_]*$`
- 不允许空格与逗号；如需保留原标点/符号，请使用 **全 IRI**。

### 5.2 允许的词间处理
- `PascalCase` 连写，连接词（`and/in/of` 等）可**保持小写并直接连写**（符合你现有 TTL；例如 `WasteandHazardousMaterialsManagement`、`EnergyManagementinManufacturing`）。
- 数字直接嵌入（如 `Scope1`、`Scope2`）。

### 5.3 必须使用全 IRI的场景
- 需要保留**标点符号**（如逗号`,`）或其他 QNAME 不允许的字符。
- **示例**（TTL 已使用）：  
  `<http://example.org/esg#IncorporationofEnvironmental,Social,andGovernanceFactorsinCreditAnalysis>`
- 建议与 `rdfs:label` 配对，保证 UI/报表可读性。

## 6. Alignment to Data & Calculations（与数据/计算的对齐）

- **直接度量**（`hasCalculationMethod "direct_measurement"`）使用映射属性 `obtainedFrom` 指向 `esg:DatasetVariable`。  
  例：`esg:TotalEnergyConsumed  esg:obtainedFrom  esg:ENERGYUSETOTAL .`
- **计算度量**（`hasCalculationMethod "calculation_model"`）通过 `isCalculatedBy` 关联到 `esg:Model`，模型以 `requiresInputFrom` 声明输入指标，并以 `executesWith` 关联 `esg:Implementation`。
- **实现信息**（语言、路径、函数、校验等）通过 `hasLanguage/hasFilePath/hasFunction/hasValidation` 等属性给出，便于治理与可执行映射。

## 7. Labels vs LocalName（一致性建议）

- **标签**（`rdfs:label`）可含空格与符号，用于对外展示；**局部名**用于技术引用。
- 允许：`rdfs:label` 与 `localName` 不一致（例如 `Financial Inclusion & Capacity Building` ↔︎ `FinancialInclusionCapacityBuilding`）。
- 对于**保留源字段名**的变量（如 `revt`），`rdfs:label` 可与源一致以便审计。

## 8. Quick Reference（速查）

| 类型 | 例子 | 命名风格 |
|---|---|---|
| Class | `esg:Metric` | PascalCase |
| Property | `esg:hasCalculationMethod` | lowerCamelCase（含 has/is） |
| Industry instance | `esg:commercialbanks` | 全小写无分隔 |
| Framework instance | `esg:SASBCommercialBanks` | PascalCase |
| Category instance | `esg:DataSecurity` / `<http://example.org/esg#IncorporationofEnvironmental,Social,andGovernanceFactorsinCreditAnalysis>` | PascalCase 连写；遇标点用全 IRI |
| Metric instance | `esg:GHGEmissionIntensity`, `esg:TotalWaterWithdrawn` | PascalCase，可含数字 |
| Model / Implementation | `esg:...Model`, `esg:...Implementation` | PascalCase，后缀固定 |
| DatasetVariable | `esg:CO2DIRECTSCOPE1`, `esg:TARGETS_EMISSIONS`, `esg:revt` | 以 **UPPER_SNAKE_CASE** 为主；允许保留真实代号大小写 |
| DataSource | `esg:SemiconductorWRDSFinancialDataset` | PascalCase |

## 9. Validation Hints（可选校验建议，不改变既有数据）

- **QNAME 检查**：`^[A-Za-z][A-Za-z0-9_]*$`（不含标点/空格）；否则改用全 IRI。  
- **DatasetVariable** 优先 `^[A-Z0-9_]+$`；若来源代号非此样式（如 `revt`），**保留原样**。  
- **Industry 实例**：`^[a-z]+$`（与现有 `commercialbanks/semiconductors` 一致）。  
- **rdfs:label** 可自由书写，建议保持英文可读标题。

---

**Version**: 1.0
**Last Updated**: 2025-09-29
