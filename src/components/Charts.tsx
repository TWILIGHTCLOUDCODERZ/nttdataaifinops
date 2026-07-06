import { useMemo, useState, useEffect, useRef } from 'react';
import { ChartDataPoint } from '../types';

interface DonutChartProps {
  data: ChartDataPoint[];
  size?: number;
  thickness?: number;
  showLegend?: boolean;
  centerLabel?: string;
  centerValue?: string | number;
  showHoverTooltip?: boolean;
}

export function DonutChart({
  data,
  size = 160,
  thickness = 24,
  showLegend = true,
  centerLabel,
  centerValue,
  showHoverTooltip = false,
}: DonutChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const { paths, total } = useMemo(() => {
    const total = data.reduce((sum, item) => sum + item.value, 0);
    let currentAngle = -90;
    const paths: { path: string; color: string; name: string; percentage: number; value: number }[] = [];

    data.forEach((item) => {
      const percentage = total > 0 ? (item.value / total) * 100 : 0;
      const angle = (percentage / 100) * 360;
      const startAngle = currentAngle;
      const endAngle = currentAngle + angle;

      const startRad = (startAngle * Math.PI) / 180;
      const endRad = (endAngle * Math.PI) / 180;
      const radius = (size - thickness) / 2;
      const centerX = size / 2;
      const centerY = size / 2;

      const x1 = centerX + radius * Math.cos(startRad);
      const y1 = centerY + radius * Math.sin(startRad);
      const x2 = centerX + radius * Math.cos(endRad);
      const y2 = centerY + radius * Math.sin(endRad);

      const largeArc = angle > 180 ? 1 : 0;
      const path = `M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}`;

      paths.push({
        path,
        color: item.color || '#0ea5e9',
        name: item.name,
        percentage,
        value: item.value,
      });

      currentAngle = endAngle;
    });

    return { paths, total };
  }, [data, size, thickness]);

  const hovered = hoveredIndex !== null ? paths[hoveredIndex] : null;

  const formatValue = (v: number) =>
    v >= 1_000_000
      ? `${(v / 1_000_000).toFixed(2)}M`
      : v >= 1_000
      ? `${(v / 1_000).toFixed(0)}K`
      : `${v.toFixed(0)}`;

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size}>
          {paths.map((item, index) => (
            <path
              key={index}
              d={item.path}
              stroke={item.color}
              strokeWidth={hoveredIndex === index ? thickness + 4 : thickness}
              fill="none"
              strokeLinecap="round"
              className="transition-all duration-200 cursor-pointer"
              style={{ opacity: hoveredIndex !== null && hoveredIndex !== index ? 0.45 : 1 }}
              onMouseEnter={() => showHoverTooltip && setHoveredIndex(index)}
              onMouseLeave={() => showHoverTooltip && setHoveredIndex(null)}
            />
          ))}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center px-2">
          {hovered && showHoverTooltip ? (
            <>
              <span className="text-xs text-navy-400 leading-tight">{hovered.name}</span>
              <span className="text-lg font-bold text-navy-100 leading-tight">{formatValue(hovered.value)}</span>
              <span className="text-xs text-navy-500">{hovered.percentage.toFixed(1)}%</span>
            </>
          ) : centerValue !== undefined ? (
            <>
              <span className="text-2xl font-bold text-navy-100">{centerValue}</span>
              {centerLabel && <span className="text-xs text-navy-500">{centerLabel}</span>}
            </>
          ) : null}
        </div>
      </div>
      {showLegend && (
        <div className="grid grid-cols-2 gap-x-6 gap-y-1 mt-3">
          {paths.map((item, index) => (
            <div key={index} className="flex items-center gap-2">
              <span
                className="w-2 h-2 rounded-sm flex-shrink-0"
                style={{ backgroundColor: item.color }}
              />
              <span className="text-xs text-navy-400">{item.name}</span>
              <span className="text-xs font-medium text-navy-300 ml-auto">
                {item.percentage.toFixed(1)}%
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

interface LineChartProps {
  data: { name: string; value: number }[];
  height?: number;
  showGrid?: boolean;
  gradient?: string;
  lineColor?: string;
}

export function LineChart({
  data,
  height = 200,
  showGrid = true,
  gradient,
  lineColor = '#0ea5e9',
}: LineChartProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [svgWidth, setSvgWidth] = useState(800);

  useEffect(() => {
    const update = () => {
      if (svgRef.current) {
        setSvgWidth(svgRef.current.clientWidth);
      }
    };
    update();
    const observer = new ResizeObserver(update);
    if (svgRef.current) observer.observe(svgRef.current);
    return () => observer.disconnect();
  }, []);

  const { pathD, areaD, points, maxValue, minValue, yAxisLabels } = useMemo(() => {
    if (data.length === 0) return { pathD: '', areaD: '', points: [], maxValue: 0, minValue: 0, yAxisLabels: [] };

    const values = data.map((d) => d.value);
    const maxValue = Math.max(...values);
    const minValue = Math.min(...values);
    const range = maxValue - minValue || 1;
    const padding = 0.1 * range;

    const chartWidth = svgWidth - 60;
    const chartHeight = height - 40;

    const points = data.map((d, i) => {
      const x = 40 + (data.length > 1 ? (i / (data.length - 1)) * chartWidth : chartWidth / 2);
      const y = chartHeight - ((d.value - minValue + padding) / (range + 2 * padding)) * chartHeight;
      return { x, y, value: d.value, name: d.name };
    });

    let pathD = '';
    if (points.length > 0) {
      pathD = `M ${points[0].x} ${points[0].y}`;
      for (let i = 1; i < points.length; i++) {
        const cp1x = points[i - 1].x + (points[i].x - points[i - 1].x) / 3;
        const cp1y = points[i - 1].y;
        const cp2x = points[i - 1].x + 2 * (points[i].x - points[i - 1].x) / 3;
        const cp2y = points[i].y;
        pathD += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${points[i].x} ${points[i].y}`;
      }
    }

    const areaD = points.length > 0
      ? pathD + ` L ${points[points.length - 1].x} ${chartHeight} L ${points[0].x} ${chartHeight} Z`
      : '';

    const yAxisLabels = [0, 0.25, 0.5, 0.75, 1].map((ratio) => {
      const value = minValue + (range + 2 * padding) * (1 - ratio) - padding;
      return { y: ratio * chartHeight, value };
    });

    return { pathD, areaD, points, maxValue, minValue, yAxisLabels };
  }, [data, height, svgWidth]);

  if (data.length === 0) {
    return <div className="text-center text-navy-500 py-8">No data available</div>;
  }

  return (
    <svg
      ref={svgRef}
      width="100%"
      height={height}
      viewBox={`0 0 ${svgWidth} ${height}`}
      preserveAspectRatio="none"
      className="w-full"
    >
      {showGrid && (
        <g>
          {yAxisLabels.map((label, i) => (
            <line
              key={i}
              x1="40"
              y1={label.y + 5}
              x2={svgWidth - 10}
              y2={label.y + 5}
              stroke="rgba(71, 85, 105, 0.2)"
              strokeDasharray="4,4"
            />
          ))}
        </g>
      )}

      {/* Y-axis labels */}
      <g>
        {yAxisLabels.map((label, i) => (
          <text
            key={i}
            x="35"
            y={label.y + 5}
            textAnchor="end"
            dominantBaseline="middle"
            className="text-navy-500"
            fontSize="10"
            fill="currentColor"
          >
            {label.value >= 1000000 ? (label.value / 1000000).toFixed(1) + 'M' : label.value >= 1000 ? (label.value / 1000).toFixed(0) + 'K' : label.value.toFixed(0)}
          </text>
        ))}
      </g>

      {/* X-axis labels */}
      <g>
        {points.filter((_, i) => data.length <= 8 || i % Math.ceil(data.length / 8) === 0).map((point, i) => (
          <text
            key={i}
            x={point.x}
            y={height - 5}
            textAnchor="middle"
            className="text-navy-500"
            fontSize="10"
            fill="currentColor"
          >
            {point.name}
          </text>
        ))}
      </g>

      <defs>
        <linearGradient id={`gradient-${gradient}`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={lineColor} stopOpacity="0.3" />
          <stop offset="100%" stopColor={lineColor} stopOpacity="0" />
        </linearGradient>
      </defs>

      {gradient && (
        <path d={areaD} fill={`url(#gradient-${gradient})`} />
      )}

      <path
        d={pathD}
        fill="none"
        stroke={lineColor}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {points.map((point, i) => (
        <circle
          key={i}
          cx={point.x}
          cy={point.y}
          r="4"
          fill={lineColor}
          className="opacity-0 hover:opacity-100 transition-opacity cursor-pointer"
        />
      ))}
    </svg>
  );
}

interface BarChartProps {
  data: ChartDataPoint[];
  height?: number;
  horizontal?: boolean;
  showValues?: boolean;
}

export function BarChart({
  data,
  height = 200,
  horizontal = false,
  showValues = true,
}: BarChartProps) {
  const [risen, setRisen] = useState(false);

  useEffect(() => {
    if (data.length === 0) {
      setRisen(false);
      return;
    }
    setRisen(false);
    const raf = requestAnimationFrame(() =>
      requestAnimationFrame(() => setRisen(true))
    );
    return () => cancelAnimationFrame(raf);
  }, [data.length]);

  const maxValue = Math.max(...data.map((d) => d.value), 1);

  if (horizontal) {
    return (
      <div className="space-y-2" style={{ height }}>
        {data.map((item, index) => {
          const widthPercent = (item.value / maxValue) * 100;
          return (
            <div key={index} className="flex items-center gap-3 group">
              <span className="w-24 text-xs text-navy-400 truncate">{item.name}</span>
              <div className="flex-1 h-5 bg-navy-800/50 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: risen ? `${widthPercent}%` : '0%',
                    backgroundColor: item.color || '#0ea5e9',
                    transition: `width 0.6s cubic-bezier(0.34, 1.3, 0.64, 1) ${index * 80}ms`,
                  }}
                />
              </div>
              {showValues && (
                <span className="w-16 text-xs text-navy-300 text-right font-medium">
                  ${item.value.toLocaleString()}
                </span>
              )}
            </div>
          );
        })}
      </div>
    );
  }

  const labelH = 20;
  const chartH = height - labelH;
  const gridLines = [0.25, 0.5, 0.75, 1];

  return (
    <div className="relative select-none" style={{ height }}>
      {/* Horizontal grid lines */}
      <div className="absolute inset-x-0 top-0 pointer-events-none" style={{ height: chartH }}>
        {gridLines.map((ratio) => (
          <div
            key={ratio}
            className="absolute inset-x-0 border-t border-dashed border-navy-800/60"
            style={{ bottom: `${ratio * 100}%` }}
          />
        ))}
      </div>

      {/* Bar columns */}
      <div className="absolute inset-x-0 top-0 flex items-end gap-1.5" style={{ height: chartH }}>
        {data.map((item, index) => {
          const barPx = Math.max((item.value / maxValue) * chartH, 3);
          const color = item.color || '#0ea5e9';
          const delay = `${index * 70}ms`;
          return (
            <div
              key={index}
              className="relative flex-1 h-full flex items-end group cursor-pointer"
            >
              {/* Hover tooltip */}
              <div
                className="absolute left-1/2 -translate-x-1/2 px-2 py-1 rounded text-[10px] font-medium text-white whitespace-nowrap pointer-events-none z-10 opacity-0 group-hover:opacity-100"
                style={{
                  bottom: barPx + 6,
                  background: 'rgba(15,23,42,0.95)',
                  border: `1px solid ${color}55`,
                  transition: 'opacity 0.15s ease',
                }}
              >
                ${item.value >= 1000
                  ? `${(item.value / 1000).toFixed(0)}K`
                  : item.value.toLocaleString()}
              </div>

              {/* Bar */}
              <div
                className="w-full rounded-t-md"
                style={{
                  height: barPx,
                  background: `linear-gradient(to top, ${color}dd, ${color}99)`,
                  transformOrigin: 'bottom',
                  transform: risen ? 'scaleY(1)' : 'scaleY(0)',
                  transition: `transform 0.55s cubic-bezier(0.34, 1.4, 0.64, 1) ${delay}`,
                  boxShadow: risen ? `0 -2px 8px ${color}44` : 'none',
                }}
              />

              {/* Top glow cap */}
              <div
                className="absolute left-0 right-0 h-0.5 rounded-full"
                style={{
                  bottom: barPx - 1,
                  backgroundColor: color,
                  opacity: risen ? 0.9 : 0,
                  transition: `opacity 0.3s ease ${delay}`,
                  boxShadow: `0 0 6px 1px ${color}`,
                }}
              />
            </div>
          );
        })}
      </div>

      {/* X-axis labels */}
      <div className="absolute inset-x-0 bottom-0 flex gap-1.5" style={{ height: labelH }}>
        {data.map((item, index) => (
          <div key={index} className="flex-1 flex items-end justify-center pb-0.5">
            <span className="text-[10px] text-navy-500 truncate leading-none text-center block w-full">
              {item.name}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

interface GaugeChartProps {
  value: number;
  max?: number;
  size?: number;
  label?: string;
  color?: string;
}

export function GaugeChart({
  value,
  max = 100,
  size = 120,
  label,
  color = '#0ea5e9',
}: GaugeChartProps) {
  const percentage = Math.min((value / max) * 100, 100);
  const angle = (percentage / 100) * 180 - 90;
  const rad = (angle * Math.PI) / 180;

  // Use a fixed internal coordinate space of 120×80 and scale via viewBox
  const vbW = 120;
  const vbH = 80;
  const cx = vbW / 2;   // 60
  const cy = vbH - 10;  // 70 — anchor the arc near the bottom
  const arcR = 44;
  const sw = 10;        // stroke width (fixed in viewBox units, scales with svg)

  const needleLen = arcR - 8;
  const needleX = cx + needleLen * Math.cos(rad);
  const needleY = cy + needleLen * Math.sin(rad);

  // Value arc endpoint
  const endAngle = Math.PI - (percentage / 100) * Math.PI;
  const endX = cx + arcR * Math.cos(endAngle);
  const endY = cy - arcR * Math.sin(endAngle - Math.PI);

  // Corrected: sweep from left to right along the top
  const bgArcD = `M ${cx - arcR} ${cy} A ${arcR} ${arcR} 0 0 1 ${cx + arcR} ${cy}`;
  const valPercent = percentage / 100;
  const valEndX = cx + arcR * Math.cos(Math.PI - valPercent * Math.PI);
  const valEndY = cy + arcR * Math.sin(Math.PI - valPercent * Math.PI);
  const largeArc = valPercent > 0.5 ? 1 : 0;
  const valArcD = `M ${cx - arcR} ${cy} A ${arcR} ${arcR} 0 ${largeArc} 1 ${valEndX} ${valEndY}`;

  const svgHeight = size * 0.68;

  return (
    <div className="flex flex-col items-center w-full">
      <svg
        width={size}
        height={svgHeight}
        viewBox={`0 0 ${vbW} ${vbH}`}
        preserveAspectRatio="xMidYMid meet"
        style={{ overflow: 'visible', maxWidth: '100%' }}
      >
        <defs>
          <linearGradient id={`gaugeGrad-${color.replace('#', '')}`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#10b981" />
            <stop offset="50%" stopColor="#f59e0b" />
            <stop offset="100%" stopColor="#ef4444" />
          </linearGradient>
        </defs>

        {/* Track */}
        <path d={bgArcD} fill="none" stroke="rgba(71,85,105,0.3)" strokeWidth={sw} strokeLinecap="round" />

        {/* Value arc */}
        {percentage > 0 && (
          <path d={valArcD} fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round" />
        )}

        {/* Needle */}
        <line x1={cx} y1={cy} x2={needleX} y2={needleY} stroke="white" strokeWidth="2.5" strokeLinecap="round" />

        {/* Center dot */}
        <circle cx={cx} cy={cy} r="5" fill="white" />

        {/* Value text inside SVG for crisp scaling */}
        <text
          x={cx}
          y={cy - arcR / 2 - 2}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize="18"
          fontWeight="700"
          fill="white"
          fontFamily="Inter, system-ui, sans-serif"
        >
          {value.toFixed(0)}%
        </text>
      </svg>

      {label && (
        <p className="text-xs text-navy-500 mt-1">{label}</p>
      )}
    </div>
  );
}

interface SparklineProps {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
  showArea?: boolean;
}

export function Sparkline({
  data,
  width = 100,
  height = 30,
  color = '#0ea5e9',
  showArea = true,
}: SparklineProps) {
  if (data.length < 2) return null;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  const points = data.map((value, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((value - min) / range) * height;
    return { x, y };
  });

  let pathD = `M ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length; i++) {
    pathD += ` L ${points[i].x} ${points[i].y}`;
  }

  const areaD = pathD + ` L ${points[points.length - 1].x} ${height} L ${points[0].x} ${height} Z`;

  return (
    <svg width={width} height={height} className="overflow-visible">
      {showArea && (
        <defs>
          <linearGradient id={`sparkline-gradient`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={color} stopOpacity="0.2" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
      )}
      {showArea && <path d={areaD} fill="url(#sparkline-gradient)" />}
      <path d={pathD} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

interface ForecastChartProps {
  data: { name: string; value: number; isForecast: boolean }[];
  height?: number;
}

export function ForecastChart({ data, height = 280 }: ForecastChartProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [svgWidth, setSvgWidth] = useState(800);

  useEffect(() => {
    const update = () => {
      if (svgRef.current) {
        setSvgWidth(svgRef.current.clientWidth);
      }
    };
    update();
    const observer = new ResizeObserver(update);
    if (svgRef.current) observer.observe(svgRef.current);
    return () => observer.disconnect();
  }, []);

  const { historicalData, forecastData, points, maxValue, minValue, yAxisLabels } = useMemo(() => {
    if (data.length === 0) return { historicalData: [], forecastData: [], points: [], maxValue: 0, minValue: 0, yAxisLabels: [] };

    const values = data.map((d) => d.value);
    const maxValue = Math.max(...values);
    const minValue = Math.min(...values);
    const range = maxValue - minValue || 1;
    const padding = 0.15 * range;

    const chartWidth = svgWidth - 80;
    const chartHeight = height - 60;

    const allPoints = data.map((d, i) => {
      const x = 50 + (data.length > 1 ? (i / (data.length - 1)) * chartWidth : chartWidth / 2);
      const y = chartHeight - ((d.value - minValue + padding) / (range + 2 * padding)) * chartHeight;
      return { x, y, value: d.value, name: d.name, isForecast: d.isForecast };
    });

    const historicalData = data.filter((d) => !d.isForecast);
    const forecastData = data.filter((d) => d.isForecast);

    const yAxisLabels = [0, 0.25, 0.5, 0.75, 1].map((ratio) => {
      const value = minValue + (range + 2 * padding) * (1 - ratio) - padding;
      return { y: ratio * chartHeight, value };
    });

    return { historicalData, forecastData, points: allPoints, maxValue, minValue, yAxisLabels };
  }, [data, height, svgWidth]);

  if (data.length === 0) {
    return <div className="text-center text-navy-500 py-8">No data available</div>;
  }

  const chartHeight = height - 60;

  // Find the transition point between historical and forecast
  const transitionIndex = data.findIndex((d) => d.isForecast);
  const hasTransition = transitionIndex > 0;

  // Generate path for historical line (solid)
  const historicalPoints = points.filter((p) => !p.isForecast);
  let historicalPath = '';
  if (historicalPoints.length > 0) {
    historicalPath = `M ${historicalPoints[0].x} ${historicalPoints[0].y}`;
    for (let i = 1; i < historicalPoints.length; i++) {
      const cp1x = historicalPoints[i - 1].x + (historicalPoints[i].x - historicalPoints[i - 1].x) / 3;
      const cp1y = historicalPoints[i - 1].y;
      const cp2x = historicalPoints[i - 1].x + 2 * (historicalPoints[i].x - historicalPoints[i - 1].x) / 3;
      const cp2y = historicalPoints[i].y;
      historicalPath += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${historicalPoints[i].x} ${historicalPoints[i].y}`;
    }
  }

  // Generate path for forecast line (dashed) - starts from last historical point
  const forecastPoints = points.filter((p) => p.isForecast);
  let forecastPath = '';
  if (forecastPoints.length > 0 && historicalPoints.length > 0) {
    const lastHistorical = historicalPoints[historicalPoints.length - 1];
    forecastPath = `M ${lastHistorical.x} ${lastHistorical.y}`;
    for (let i = 0; i < forecastPoints.length; i++) {
      const prev = i === 0 ? lastHistorical : forecastPoints[i - 1];
      const curr = forecastPoints[i];
      const cp1x = prev.x + (curr.x - prev.x) / 3;
      const cp1y = prev.y;
      const cp2x = prev.x + 2 * (curr.x - prev.x) / 3;
      const cp2y = curr.y;
      forecastPath += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${curr.x} ${curr.y}`;
    }
  }

  // Area fill for historical
  const historicalArea = historicalPoints.length > 0
    ? historicalPath + ` L ${historicalPoints[historicalPoints.length - 1].x} ${chartHeight} L ${historicalPoints[0].x} ${chartHeight} Z`
    : '';

  // Forecast zone (semi-transparent)
  const forecastArea = forecastPoints.length > 0 && historicalPoints.length > 0
    ? forecastPath + ` L ${forecastPoints[forecastPoints.length - 1].x} ${chartHeight} L ${historicalPoints[historicalPoints.length - 1].x} ${chartHeight} Z`
    : '';

  const lastHistorical = historicalPoints[historicalPoints.length - 1];
  const firstForecast = forecastPoints[0];

  return (
    <svg
      ref={svgRef}
      width="100%"
      height={height}
      viewBox={`0 0 ${svgWidth} ${height}`}
      preserveAspectRatio="none"
      className="w-full"
    >
      <defs>
        <linearGradient id="historicalGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#0ea5e9" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#0ea5e9" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="forecastGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#14b8a6" stopOpacity="0.15" />
          <stop offset="100%" stopColor="#14b8a6" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Grid lines */}
      {yAxisLabels.map((label, i) => (
        <line
          key={i}
          x1="50"
          y1={label.y + 20}
          x2={svgWidth - 20}
          y2={label.y + 20}
          stroke="rgba(71, 85, 105, 0.15)"
          strokeDasharray="4,4"
        />
      ))}

      {/* Y-axis labels */}
      {yAxisLabels.map((label, i) => (
        <text
          key={i}
          x="45"
          y={label.y + 20}
          textAnchor="end"
          dominantBaseline="middle"
          className="text-navy-500"
          fontSize="11"
          fill="currentColor"
        >
          {label.value >= 1000000 ? `$${(label.value / 1000000).toFixed(1)}M` : label.value >= 1000 ? `$${(label.value / 1000).toFixed(0)}K` : `$${label.value.toFixed(0)}`}
        </text>
      ))}

      {/* forecast zone background */}
      {hasTransition && lastHistorical && (
        <rect
          x={lastHistorical.x}
          y={20}
          width={svgWidth - lastHistorical.x - 30}
          height={chartHeight}
          fill="rgba(20, 184, 166, 0.03)"
        />
      )}

      {/* Historical area fill */}
      {historicalArea && <path d={historicalArea} fill="url(#historicalGradient)" />}

      {/* Forecast area fill */}
      {forecastArea && <path d={forecastArea} fill="url(#forecastGradient)" />}

      {/* Transition zone indicator */}
      {hasTransition && lastHistorical && (
        <line
          x1={lastHistorical.x}
          y1={20}
          x2={lastHistorical.x}
          y2={chartHeight + 20}
          stroke="rgba(20, 184, 166, 0.3)"
          strokeDasharray="6,4"
          strokeWidth="1"
        />
      )}

      {/* Historical line (solid) */}
      {historicalPath && (
        <path
          d={historicalPath}
          fill="none"
          stroke="#0ea5e9"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}

      {/* Forecast line (dashed) */}
      {forecastPath && (
        <path
          d={forecastPath}
          fill="none"
          stroke="#14b8a6"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray="8,4"
          opacity="0.8"
        />
      )}

      {/* Historical points */}
      {historicalPoints.map((point, i) => (
        <g key={`hist-${i}`}>
          <circle
            cx={point.x}
            cy={point.y}
            r="5"
            fill="#0ea5e9"
            className="transition-all hover:r-6"
            style={{ filter: 'drop-shadow(0 0 4px rgba(14, 165, 233, 0.4))' }}
          />
          <circle
            cx={point.x}
            cy={point.y}
            r="2.5"
            fill="#0c1829"
          />
        </g>
      ))}

      {/* Forecast points */}
      {forecastPoints.map((point, i) => (
        <g key={`fcst-${i}`}>
          <circle
            cx={point.x}
            cy={point.y}
            r="5"
            fill="#14b8a6"
            opacity="0.7"
            style={{ filter: 'drop-shadow(0 0 4px rgba(20, 184, 166, 0.4))' }}
          />
          <circle
            cx={point.x}
            cy={point.y}
            r="2.5"
            fill="#0c1829"
            opacity="0.7"
          />
        </g>
      ))}

      {/* X-axis labels */}
      {points.filter((_, i) => data.length <= 10 || i % Math.ceil(data.length / 10) === 0).map((point, i) => (
        <text
          key={i}
          x={point.x}
          y={height - 10}
          textAnchor="middle"
          className="text-navy-500"
          fontSize="10"
          fill="currentColor"
        >
          {point.name}
        </text>
      ))}
    </svg>
  );
}
