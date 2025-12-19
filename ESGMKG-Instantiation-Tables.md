# ESGMKG Instantiation Tables

## Table 1: Reporting Path (from Industry to Metrics)

| Step | Source Entity | Relationship | Target Entity |
|------|---------------|--------------|---------------|
| 1 | Industry: Financial Services | ReportsUsing | Framework: IFRS S1 |
| 2 | Framework: IFRS S1 | Includes | Category: Environmental Risk |
| 3 | Category: Environmental Risk | ConsistsOf | Metric: EnvironmentalRiskMetric1 |
| 4 | Category: Environmental Risk | ConsistsOf | Metric: WaterWithdrawalMetric1 |

---

## Table 2: Calculated Metric Path (Hierarchical Composition)

### Level 1: Aggregate Metric

| Step | Source Entity | Relationship | Target Entity |
|------|---------------|--------------|---------------|
| 5 | Metric: EnvironmentalRiskMetric1 | IsCalculatedBy | Model: EnvironRiskModel1 |
| 6 | Model: EnvironRiskModel1 | ExecutesWith | Impl: ImpleModR1.py |
| 7 | Model: EnvironRiskModel1 | RequiresInputFrom | Metric: CarbonEmissionMetric1 |
| 8 | Model: EnvironRiskModel1 | RequiresInputFrom | Metric: AirQualityPollutantMetric1 |

### Level 2: Carbon Emission Component Metric

| Step | Source Entity | Relationship | Target Entity |
|------|---------------|--------------|---------------|
| 9 | Metric: CarbonEmissionMetric1 | IsCalculatedBy | Model: CarbonEmissionModel1 |
| 10 | Model: CarbonEmissionModel1 | ExecutesWith | Impl: ImpleModR2.py |
| 11 | Model: CarbonEmissionModel1 | RequiresInputFrom | Variable: CO2DirectScope1 |
| 12 | Model: CarbonEmissionModel1 | RequiresInputFrom | Variable: CO2IndirectScope2 |
| 13 | Model: CarbonEmissionModel1 | RequiresInputFrom | Variable: CO2IndirectScope3 |

### Level 2: Air Quality Component Metric

| Step | Source Entity | Relationship | Target Entity |
|------|---------------|--------------|---------------|
| 14 | Metric: AirQualityPollutantMetric1 | IsCalculatedBy | Model: AirQualityModel1 |
| 15 | Model: AirQualityModel1 | ExecutesWith | Impl: ImpleModR3.py |
| 16 | Model: AirQualityModel1 | RequiresInputFrom | Variable: SOXEmissions |
| 17 | Model: AirQualityModel1 | RequiresInputFrom | Variable: NOXEmissions |
| 18 | Model: AirQualityModel1 | RequiresInputFrom | Variable: VOCEmissions |

---

## Table 3: Direct Metric Path (No Computational Model Required)

| Step | Source Entity | Relationship | Target Entity |
|------|---------------|--------------|---------------|
| 19 | Metric: WaterWithdrawalMetric1 | ObtainedFrom | Variable: TotalWaterWithdrawal |

---

## Table 4: Data Provenance (Variables to Data Source)

| Step | Source Entity | Relationship | Target Entity |
|------|---------------|--------------|---------------|
| 20 | Variable: CO2DirectScope1 | SourcesFrom | DataSource: Eurofidai |
| 21 | Variable: CO2IndirectScope2 | SourcesFrom | DataSource: Eurofidai |
| 22 | Variable: CO2IndirectScope3 | SourcesFrom | DataSource: Eurofidai |
| 23 | Variable: SOXEmissions | SourcesFrom | DataSource: Eurofidai |
| 24 | Variable: NOXEmissions | SourcesFrom | DataSource: Eurofidai |
| 25 | Variable: VOCEmissions | SourcesFrom | DataSource: Eurofidai |
| 26 | Variable: TotalWaterWithdrawal | SourcesFrom | DataSource: Eurofidai |

---

## Summary of Coverage

### Entities Covered (8/8):
- Industry: Financial Services
- Reporting Framework: IFRS S1
- Category: Environmental Risk
- Metric: EnvironmentalRiskMetric1, CarbonEmissionMetric1, AirQualityPollutantMetric1, WaterWithdrawalMetric1
- Model: EnvironRiskModel1, CarbonEmissionModel1, AirQualityModel1
- Implementation: ImpleModR1.py, ImpleModR2.py, ImpleModR3.py
- Dataset Variable: CO2DirectScope1, CO2IndirectScope2, CO2IndirectScope3, SOXEmissions, NOXEmissions, VOCEmissions, TotalWaterWithdrawal
- Data Source: Eurofidai

### Relationships Covered (8/8):
- ReportsUsing (Step 1)
- Includes (Step 2)
- ConsistsOf (Steps 3-4)
- IsCalculatedBy (Steps 5, 9, 14)
- ExecutesWith (Steps 6, 10, 15)
- RequiresInputFrom (Steps 7-8, 11-13, 16-18)
- ObtainedFrom (Step 19)
- SourcesFrom (Steps 20-26)

### Key Design Points:
1. **Dual Derivation Paths**: Metrics can be either:
   - Calculated by a Model (IsCalculatedBy) - e.g., EnvironmentalRiskMetric1
   - Obtained directly from a Dataset Variable (ObtainedFrom) - e.g., WaterWithdrawalMetric1

2. **Hierarchical Composition** (within Calculated Path):
   - Level 1: Aggregate metric (EnvironmentalRiskMetric1) depends on component metrics
   - Level 2: Component metrics (CarbonEmissionMetric1, AirQualityPollutantMetric1) depend on dataset variables
   - Level 3: Dataset variables sourced from data providers

3. **All variables source from Eurofidai** (single data source in this example)
