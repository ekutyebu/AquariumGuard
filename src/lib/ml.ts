export interface TelemetryPoint {
  timestamp: Date;
  temperature: number;
  ph: number;
  turbidity: number; // in NTU
}

export interface Thresholds {
  tempMin: number;
  tempMax: number;
  phMin: number;
  phMax: number;
  turbidityMax: number;
}

export interface MLAnalysisResult {
  anomalies: {
    parameter: "TEMPERATURE" | "PH" | "TURBIDITY";
    value: number;
    zScore: number;
    message: string;
  }[];
  predictions: {
    parameter: "TEMPERATURE" | "PH" | "TURBIDITY";
    timeFrameMinutes: number;
    predictedValue: number;
    thresholdCrossed: string; // "MIN", "MAX", or "NONE"
    message: string;
  }[];
  rateOfChangeAlerts: {
    parameter: "TEMPERATURE" | "PH" | "TURBIDITY";
    ratePerHour: number;
    message: string;
  }[];
}

function fitLinearRegression(points: { x: number; y: number }[]) {
  const n = points.length;
  if (n < 3) return null;

  let sumX = 0;
  let sumY = 0;
  let sumXY = 0;
  let sumXX = 0;

  for (let i = 0; i < n; i++) {
    sumX += points[i].x;
    sumY += points[i].y;
    sumXY += points[i].x * points[i].y;
    sumXX += points[i].x * points[i].x;
  }

  const denominator = n * sumXX - sumX * sumX;
  if (denominator === 0) return null;

  const slope = (n * sumXY - sumX * sumY) / denominator;
  const intercept = (sumY - slope * sumX) / n;

  return { slope, intercept };
}

function calculateStats(values: number[]) {
  const n = values.length;
  if (n === 0) return { mean: 0, stdDev: 0 };

  const mean = values.reduce((sum, val) => sum + val, 0) / n;
  if (n < 2) return { mean, stdDev: 0 };

  const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / (n - 1);
  const stdDev = Math.sqrt(variance);

  return { mean, stdDev };
}

export function analyzeTelemetry(
  history: TelemetryPoint[],
  current: TelemetryPoint,
  thresholds: Thresholds
): MLAnalysisResult {
  const result: MLAnalysisResult = {
    anomalies: [],
    predictions: [],
    rateOfChangeAlerts: [],
  };

  if (history.length < 5) return result;

  const parameters = [
    {
      name: "TEMPERATURE" as const,
      currentVal: current.temperature,
      historyVals: history.map((h) => h.temperature),
      minThresh: thresholds.tempMin,
      maxThresh: thresholds.tempMax,
      rocLimit: 2.0, // °C per hour
    },
    {
      name: "PH" as const,
      currentVal: current.ph,
      historyVals: history.map((h) => h.ph),
      minThresh: thresholds.phMin,
      maxThresh: thresholds.phMax,
      rocLimit: 0.8,
    },
    {
      name: "TURBIDITY" as const,
      currentVal: current.turbidity,
      historyVals: history.map((h) => h.turbidity),
      minThresh: 0,
      maxThresh: thresholds.turbidityMax,
      rocLimit: 20.0, // NTU per hour
    },
  ];

  // 1. Z-Score Anomaly Detection
  parameters.forEach((param) => {
    const baselineVals = param.historyVals.slice(-50);
    const { mean, stdDev } = calculateStats(baselineVals);

    if (stdDev > 0.02) {
      const zScore = (param.currentVal - mean) / stdDev;
      if (Math.abs(zScore) > 2.5) {
        result.anomalies.push({
          parameter: param.name,
          value: param.currentVal,
          zScore: parseFloat(zScore.toFixed(2)),
          message: `Statistical Anomaly: ${param.name} is abnormally ${zScore > 0 ? "high" : "low"} at ${param.currentVal.toFixed(1)} (Z-score: ${zScore.toFixed(2)}).`,
        });
      }
    }
  });

  // 2. Linear Regression Trend Forecasting
  const trendWindow = history.slice(-10);
  const oldestTime = trendWindow[0].timestamp.getTime();

  parameters.forEach((param) => {
    const regressionPoints = trendWindow.map((pt) => {
      const elapsedMinutes = (pt.timestamp.getTime() - oldestTime) / 60000;
      let yVal = pt.temperature;
      if (param.name === "PH")        yVal = pt.ph;
      if (param.name === "TURBIDITY") yVal = pt.turbidity;
      return { x: elapsedMinutes, y: yVal };
    });

    const fit = fitLinearRegression(regressionPoints);
    if (fit) {
      const { slope, intercept } = fit;
      const currentElapsed = (current.timestamp.getTime() - oldestTime) / 60000;

      // Project 15, 30, and 60 minutes ahead
      [15, 30, 60].forEach((timeFrame) => {
        const targetElapsed = currentElapsed + timeFrame;
        const predictedVal = slope * targetElapsed + intercept;

        let crossed: "MIN" | "MAX" | "NONE" = "NONE";
        let threshVal = 0;

        if (predictedVal > param.maxThresh) {
          crossed = "MAX";
          threshVal = param.maxThresh;
        } else if (predictedVal < param.minThresh && param.minThresh > 0) {
          crossed = "MIN";
          threshVal = param.minThresh;
        }

        if (crossed !== "NONE") {
          const isAlreadyCrossing =
            param.currentVal < param.minThresh || param.currentVal > param.maxThresh;

          if (!isAlreadyCrossing) {
            const label = param.name === "TURBIDITY" ? "Turbidity" : param.name;
            const unit  = param.name === "TURBIDITY" ? "NTU" : param.name === "TEMPERATURE" ? "°C" : "";
            result.predictions.push({
              parameter: param.name,
              timeFrameMinutes: timeFrame,
              predictedValue: parseFloat(predictedVal.toFixed(2)),
              thresholdCrossed: crossed,
              message: `Predictive Warning: ${label} is estimated to ${crossed === "MAX" ? "exceed" : "drop below"} safe ${crossed === "MAX" ? "maximum" : "minimum"} of ${threshVal.toFixed(1)} ${unit} in ${timeFrame} minutes.`,
            });
          }
        }
      });

      // 3. Rate of Change Alert
      const ratePerHour = slope * 60;
      if (Math.abs(ratePerHour) > param.rocLimit) {
        const label = param.name === "TURBIDITY" ? "Turbidity" : param.name;
        result.rateOfChangeAlerts.push({
          parameter: param.name,
          ratePerHour: parseFloat(ratePerHour.toFixed(2)),
          message: `Rapid Change Warning: ${label} is changing rapidly at ${ratePerHour.toFixed(1)} units/hour.`,
        });
      }
    }
  });

  return result;
}
