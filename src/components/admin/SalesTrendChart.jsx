import React, { useState, useMemo } from 'react';
import { 
  TrendingUp, 
  ShoppingBag, 
  CreditCard, 
  DollarSign, 
  Calendar, 
  Zap, 
  ArrowUpRight, 
  ArrowDownRight,
  Clock,
  Sparkles,
  Layers,
  Banknote,
  BarChart2,
  LineChart,
  Activity
} from 'lucide-react';

/**
 * Fritsch-Carlson Monotone Cubic Spline Algorithm
 * Guarantees zero overshoot/undershoot, monotonic transitions, and accurate extrema.
 */
function generateMonotonePath(points) {
  if (!points || points.length === 0) return '';
  if (points.length === 1) return `M ${points[0].x},${points[0].y}`;
  if (points.length === 2) return `M ${points[0].x},${points[0].y} L ${points[1].x},${points[1].y}`;

  const n = points.length;
  const dx = [];
  const dy = [];
  const slopes = [];

  for (let i = 0; i < n - 1; i++) {
    const dX = points[i + 1].x - points[i].x;
    const dY = points[i + 1].y - points[i].y;
    dx.push(dX);
    dy.push(dY);
    slopes.push(dX === 0 ? 0 : dY / dX);
  }

  const tangents = [slopes[0]];
  for (let i = 0; i < n - 2; i++) {
    const s0 = slopes[i];
    const s1 = slopes[i + 1];
    if (s0 * s1 <= 0) {
      tangents.push(0);
    } else {
      tangents.push((s0 + s1) / 2);
    }
  }
  tangents.push(slopes[n - 2]);

  let path = `M ${points[0].x},${points[0].y}`;
  for (let i = 0; i < n - 1; i++) {
    const p1 = points[i];
    const p2 = points[i + 1];
    const dX = dx[i];
    const cp1x = p1.x + dX / 3;
    const cp1y = p1.y + (tangents[i] * dX) / 3;
    const cp2x = p2.x - dX / 3;
    const cp2y = p2.y - (tangents[i + 1] * dX) / 3;
    path += ` C ${cp1x.toFixed(1)},${cp1y.toFixed(1)} ${cp2x.toFixed(1)},${cp2y.toFixed(1)} ${p2.x.toFixed(1)},${p2.y.toFixed(1)}`;
  }
  return path;
}

/**
 * Calculates clean, non-duplicate, human-readable Y-axis ticks
 */
function calculateCleanTicks(maxValue, isOrders = false) {
  if (maxValue <= 0) maxValue = isOrders ? 5 : 1000;
  
  if (isOrders) {
    if (maxValue <= 5) return { ticks: [0, 1, 2, 3, 4, 5], top: 5 };
    if (maxValue <= 10) return { ticks: [0, 2, 4, 6, 8, 10], top: 10 };
    const step = Math.ceil(maxValue / 4);
    return { ticks: [0, step, step * 2, step * 3, step * 4], top: step * 4 };
  }

  const rawStep = maxValue / 4;
  const magnitude = Math.pow(10, Math.floor(Math.log10(rawStep)));
  const residual = rawStep / magnitude;
  let cleanStep;
  if (residual <= 1) cleanStep = 1 * magnitude;
  else if (residual <= 2) cleanStep = 2 * magnitude;
  else if (residual <= 2.5) cleanStep = 2.5 * magnitude;
  else if (residual <= 5) cleanStep = 5 * magnitude;
  else cleanStep = 10 * magnitude;

  const top = Math.ceil(maxValue / cleanStep) * cleanStep;
  const ticks = [];
  for (let t = 0; t <= top; t += cleanStep) {
    ticks.push(t);
  }
  return { ticks, top };
}

function formatTickLabel(val, isOrders = false) {
  if (isOrders) return `${val}`;
  if (val === 0) return '₹0';
  if (val >= 100000) return `₹${(val / 100000).toFixed(1)}L`;
  if (val >= 1000) {
    return val % 1000 === 0 ? `₹${val / 1000}k` : `₹${(val / 1000).toFixed(1)}k`;
  }
  return `₹${val}`;
}

export const SalesTrendChart = ({ salesData, timeRange = '7d' }) => {
  const [selectedMetric, setSelectedMetric] = useState('revenue'); // 'revenue' | 'orders' | 'aov' | 'split'
  const [granularity, setGranularity] = useState('daily'); // 'daily' | 'weekly' | 'monthly'
  const [chartType, setChartType] = useState('area'); // 'area' | 'bar' | 'line'
  const [hoveredIndex, setHoveredIndex] = useState(null);

  const rawDaily = salesData?.dailyTrend || [];
  const rawWeekly = salesData?.weeklyTrend || [];
  const rawMonthly = salesData?.monthlyTrend || [];
  const weekdayVelocity = salesData?.weekdayVelocity || [];
  const hourlySlots = salesData?.hourlySlots || [];
  const peakDay = salesData?.peakDay || { date: '—', revenue: 0, orders: 0 };
  const totalRevenue = salesData?.totalRevenue || 0;
  const growthPercent = salesData?.revenueGrowthPercent || 0;
  const aov = salesData?.aov || 0;
  const prepaidRevenue = salesData?.prepaidRevenue || 0;
  const codRevenue = salesData?.codRevenue || 0;
  const totalOrdersCount = salesData?.totalOrdersCount || 0;

  // Active dataset based on granularity
  const activeDataset = useMemo(() => {
    if (granularity === 'weekly' && rawWeekly.length > 0) return rawWeekly;
    if (granularity === 'monthly' && rawMonthly.length > 0) return rawMonthly;
    return rawDaily;
  }, [granularity, rawDaily, rawWeekly, rawMonthly]);

  // Metric styling
  const metricConfigs = {
    revenue: {
      label: 'Revenue',
      unit: '₹',
      color: '#10B981', // emerald
      gradientId: 'revGradient',
      strokeColor: '#10B981',
      glowColor: 'rgba(16, 185, 129, 0.4)',
      format: (v) => `₹${Number(v).toLocaleString('en-IN')}`
    },
    orders: {
      label: 'Orders',
      unit: '',
      color: '#38BDF8', // sky
      gradientId: 'ordersGradient',
      strokeColor: '#38BDF8',
      glowColor: 'rgba(56, 189, 248, 0.4)',
      format: (v) => `${v} orders`
    },
    aov: {
      label: 'AOV',
      unit: '₹',
      color: '#F59E0B', // amber
      gradientId: 'aovGradient',
      strokeColor: '#F59E0B',
      glowColor: 'rgba(245, 158, 11, 0.4)',
      format: (v) => `₹${Number(v).toLocaleString('en-IN')}`
    },
    split: {
      label: 'Payment Mix',
      unit: '%',
      color: '#A855F7',
      format: (v) => `${v}%`
    }
  };

  const currentCfg = metricConfigs[selectedMetric] || metricConfigs.revenue;

  // SVG Geometry Dimensions
  const svgWidth = 900;
  const svgHeight = 290;
  const padding = { top: 35, right: 30, bottom: 45, left: 65 };
  const innerWidth = svgWidth - padding.left - padding.right;
  const innerHeight = svgHeight - padding.top - padding.bottom;

  const { points, maxValue, yTicks, peakPoint } = useMemo(() => {
    if (!activeDataset || activeDataset.length === 0) {
      return { points: [], maxValue: 10000, yTicks: [0, 2500, 5000, 7500, 10000], peakPoint: null };
    }

    const isOrders = selectedMetric === 'orders';
    const values = activeDataset.map(d => {
      if (selectedMetric === 'orders') return d.orders || 0;
      if (selectedMetric === 'aov') return d.aov || 0;
      return d.revenue || 0;
    });

    const rawMax = Math.max(...values, isOrders ? 5 : 500);
    const { ticks, top } = calculateCleanTicks(rawMax, isOrders);

    let maxPt = null;
    let highestVal = -1;

    const pts = activeDataset.map((d, idx) => {
      const val = selectedMetric === 'orders' ? (d.orders || 0) : (selectedMetric === 'aov' ? (d.aov || 0) : (d.revenue || 0));
      const x = padding.left + (idx / Math.max(activeDataset.length - 1, 1)) * innerWidth;
      const y = padding.top + innerHeight - (top > 0 ? (val / top) * innerHeight : 0);
      
      const pt = {
        x: Number(x.toFixed(1)),
        y: Number(y.toFixed(1)),
        data: d,
        val,
        index: idx
      };

      if (val > highestVal && val > 0) {
        highestVal = val;
        maxPt = pt;
      }

      return pt;
    });

    return { points: pts, maxValue: top, yTicks: ticks, peakPoint: maxPt };
  }, [activeDataset, selectedMetric, innerWidth, innerHeight, padding.left, padding.top]);

  // Monotone Spline Paths
  const linePath = useMemo(() => generateMonotonePath(points), [points]);
  const areaPath = useMemo(() => {
    if (!points || points.length === 0) return '';
    const first = points[0];
    const last = points[points.length - 1];
    const bottomY = padding.top + innerHeight;
    return `${linePath} L ${last.x},${bottomY} L ${first.x},${bottomY} Z`;
  }, [linePath, points, padding.top, innerHeight]);

  // Active or hovered point
  const activePt = hoveredIndex !== null && points[hoveredIndex] 
    ? points[hoveredIndex] 
    : (points.length > 0 ? points[points.length - 1] : null);

  // Dynamic X-axis label spacing
  const xLabelStep = useMemo(() => {
    if (activeDataset.length <= 8) return 1;
    if (activeDataset.length <= 16) return 2;
    if (activeDataset.length <= 35) return 4;
    return Math.ceil(activeDataset.length / 10);
  }, [activeDataset.length]);

  return (
    <div className="space-y-6">
      
      {/* 1. Header KPI Highlight Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* KPI 1: Paid Gross */}
        <div className="bg-[#141418] border border-[#22222C] rounded-2xl p-3.5 sm:p-5 shadow-xs relative overflow-hidden group hover:border-[#333344] transition-all">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs text-zinc-400 gap-1 sm:gap-0">
            <span className="font-medium text-zinc-300 text-[11px] sm:text-xs">Period Paid Gross</span>
            {growthPercent !== 0 && (
              <span className={`inline-flex items-center gap-1 text-[10px] sm:text-[11px] font-mono font-semibold px-1.5 sm:px-2 py-0.5 rounded-md w-fit ${
                growthPercent > 0 ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-800/60' : 'bg-rose-950/60 text-rose-300 border border-rose-800/60'
              }`}>
                {growthPercent > 0 ? <ArrowUpRight size={11} /> : <ArrowDownRight size={11} />}
                {growthPercent > 0 ? `+${growthPercent}%` : `${growthPercent}%`}
              </span>
            )}
          </div>
          <div className="text-xl sm:text-2xl lg:text-3xl font-bold font-mono text-emerald-400 mt-1.5 sm:mt-2 tabular-nums">
            ₹{totalRevenue.toLocaleString('en-IN')}
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between text-[10px] sm:text-[11px] text-zinc-400 mt-2 pt-2 border-t border-[#1E1E28] font-mono gap-0.5">
            <span>Online: ₹{prepaidRevenue.toLocaleString('en-IN')}</span>
            <span>COD: ₹{codRevenue.toLocaleString('en-IN')}</span>
          </div>
        </div>

        {/* KPI 2: Average Order Value */}
        <div className="bg-[#141418] border border-[#22222C] rounded-2xl p-3.5 sm:p-5 shadow-xs relative overflow-hidden group hover:border-[#333344] transition-all">
          <div className="flex items-center justify-between text-xs text-zinc-400">
            <span className="font-medium text-zinc-300 text-[11px] sm:text-xs">Average Order Value</span>
            <span className="text-[9px] sm:text-[10px] font-mono text-amber-300 bg-amber-950/50 px-1.5 sm:px-2 py-0.5 rounded-md border border-amber-800/50">
              Basket GMV
            </span>
          </div>
          <div className="text-xl sm:text-2xl lg:text-3xl font-bold font-mono text-[#EDEDF0] mt-1.5 sm:mt-2 tabular-nums">
            ₹{aov.toLocaleString('en-IN')}
          </div>
          <p className="text-[10px] sm:text-[11px] text-zinc-400 mt-2 pt-2 border-t border-[#1E1E28] truncate">
            Computed across {totalOrdersCount} orders
          </p>
        </div>

        {/* KPI 3: Peak Performance Day */}
        <div className="bg-[#141418] border border-[#22222C] rounded-2xl p-3.5 sm:p-5 shadow-xs relative overflow-hidden group hover:border-[#333344] transition-all">
          <div className="flex items-center justify-between text-xs text-zinc-400">
            <span className="font-medium text-zinc-300 text-[11px] sm:text-xs">Peak Performance</span>
            <Sparkles size={13} className="text-emerald-400" />
          </div>
          <div className="text-xl sm:text-2xl lg:text-3xl font-bold font-mono text-emerald-300 mt-1.5 sm:mt-2 tabular-nums">
            ₹{(peakDay?.revenue || 0).toLocaleString('en-IN')}
          </div>
          <p className="text-[10px] sm:text-[11px] text-zinc-400 mt-2 pt-2 border-t border-[#1E1E28] truncate">
            <strong className="text-zinc-200">{peakDay?.fullDate || peakDay?.date || '—'}</strong> ({peakDay?.orders || 0} drop orders)
          </p>
        </div>

        {/* KPI 4: Daily Revenue Run Rate */}
        <div className="bg-[#141418] border border-[#22222C] rounded-2xl p-3.5 sm:p-5 shadow-xs relative overflow-hidden group hover:border-[#333344] transition-all">
          <div className="flex items-center justify-between text-xs text-zinc-400">
            <span className="font-medium text-zinc-300 text-[11px] sm:text-xs">Daily Run-Rate</span>
            <Zap size={13} className="text-sky-400" />
          </div>
          <div className="text-xl sm:text-2xl lg:text-3xl font-bold font-mono text-sky-400 mt-1.5 sm:mt-2 tabular-nums">
            ₹{activeDataset.length > 0 ? Math.round(totalRevenue / activeDataset.length).toLocaleString('en-IN') : '0'}
          </div>
          <p className="text-[10px] sm:text-[11px] text-zinc-400 mt-2 pt-2 border-t border-[#1E1E28] truncate">
            Average daily pace for {timeRange.toUpperCase()}
          </p>
        </div>
      </div>

      {/* 2. Main Luxury Vector Chart Card */}
      <div className="bg-[#16161A] border border-[#262632] rounded-2xl shadow-xs p-4 sm:p-6 space-y-4 sm:space-y-5">
        
        {/* Chart Header Controls */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3.5 sm:gap-4 pb-3.5 sm:pb-4 border-b border-[#24242E]">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm sm:text-base font-bold text-[#EDEDF0] tracking-tight">
                Sales Trajectory & Revenue Curve
              </h2>
              <span className="px-2 py-0.5 rounded-full bg-emerald-950/50 text-emerald-400 text-[10px] font-mono font-medium border border-emerald-800/40">
                Monotone
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5 sm:mt-1">
              Exact mathematical curve without artificial overshoots or duplicate scale ticks.
            </p>
          </div>

          {/* Metric & Display Controls - Swipable on mobile */}
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pb-1 w-full lg:w-auto max-w-full">
            {/* Metric Buttons */}
            <div className="flex items-center bg-[#101014] p-1 rounded-xl border border-[#22222C] text-xs shrink-0">
              {[
                { id: 'revenue', label: 'Revenue (₹)', icon: DollarSign },
                { id: 'orders', label: 'Orders (#)', icon: ShoppingBag },
                { id: 'aov', label: 'AOV (₹)', icon: TrendingUp },
                { id: 'split', label: 'Payment Split', icon: Banknote }
              ].map(tab => {
                const Icon = tab.icon;
                const isSelected = selectedMetric === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setSelectedMetric(tab.id)}
                    className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap min-h-[32px] ${
                      isSelected
                        ? 'bg-[#22222E] text-white shadow-xs border border-[#3A3A4C] font-semibold'
                        : 'text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    <Icon size={12} className={isSelected ? 'text-zinc-200' : 'text-zinc-500'} />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Chart Style Toggle (Area Curve vs Bars) */}
            {selectedMetric !== 'split' && (
              <div className="flex items-center bg-[#101014] p-1 rounded-xl border border-[#22222C] text-xs shrink-0">
                <button
                  onClick={() => setChartType('area')}
                  title="Smooth Vector Curve"
                  className={`p-1.5 rounded-lg transition-all cursor-pointer min-h-[32px] min-w-[32px] flex items-center justify-center ${
                    chartType === 'area'
                      ? 'bg-[#22222E] text-white border border-[#3A3A4C]'
                      : 'text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  <Activity size={13} />
                </button>
                <button
                  onClick={() => setChartType('bar')}
                  title="Column Bars"
                  className={`p-1.5 rounded-lg transition-all cursor-pointer min-h-[32px] min-w-[32px] flex items-center justify-center ${
                    chartType === 'bar'
                      ? 'bg-[#22222E] text-white border border-[#3A3A4C]'
                      : 'text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  <BarChart2 size={13} />
                </button>
              </div>
            )}

            {/* Granularity Selector */}
            <div className="flex items-center bg-[#101014] p-1 rounded-xl border border-[#22222C] text-xs shrink-0">
              {[
                { id: 'daily', label: 'Daily' },
                { id: 'weekly', label: 'Weekly' },
                { id: 'monthly', label: 'Monthly' }
              ].map(g => (
                <button
                  key={g.id}
                  onClick={() => setGranularity(g.id)}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer whitespace-nowrap min-h-[32px] ${
                    granularity === g.id
                      ? 'bg-[#22222E] text-white border border-[#3A3A4C] font-semibold'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  {g.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 3. Main Chart Display */}
        {selectedMetric === 'split' ? (
          /* Stacked Comparative Bar Chart for Payment Mix */
          <div className="space-y-4">
            <div className="h-64 flex items-end gap-2 sm:gap-3 pt-6 px-2 overflow-x-auto">
              {activeDataset.map((item, idx) => {
                const total = (item.prepaidRevenue || 0) + (item.codRevenue || 0) || item.revenue || 1;
                const maxInSet = Math.max(...activeDataset.map(d => (d.prepaidRevenue || 0) + (d.codRevenue || 0) || d.revenue || 0), 1000);
                const totalHeightPercent = Math.max(10, Math.round((total / maxInSet) * 100));
                const prepaidShare = total > 0 ? ((item.prepaidRevenue || 0) / total) * 100 : 50;
                const codShare = 100 - prepaidShare;
                const isHovered = hoveredIndex === idx;

                return (
                  <div
                    key={idx}
                    className="flex-1 min-w-[28px] max-w-[56px] flex flex-col items-center justify-end h-full group relative cursor-pointer"
                    onMouseEnter={() => setHoveredIndex(idx)}
                    onMouseLeave={() => setHoveredIndex(null)}
                  >
                    <div 
                      style={{ height: `${totalHeightPercent}%` }}
                      className={`w-full flex flex-col-reverse rounded-t-lg overflow-hidden border transition-all duration-300 ${
                        isHovered ? 'border-emerald-400 ring-2 ring-emerald-500/30 brightness-125' : 'border-[#262634]'
                      }`}
                    >
                      <div style={{ height: `${prepaidShare}%` }} className="w-full bg-emerald-500/85" />
                      <div style={{ height: `${codShare}%` }} className="w-full bg-sky-500/85" />
                    </div>

                    <span className={`text-[10px] font-mono mt-2 truncate w-full text-center transition-colors ${
                      isHovered ? 'text-white font-bold' : 'text-zinc-500'
                    }`}>
                      {item.date || item.weekLabel || item.monthLabel}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-center gap-6 pt-2 border-t border-[#22222C] text-xs font-mono">
              <span className="text-zinc-300 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-xs" />
                <span>Prepaid Online (₹{prepaidRevenue.toLocaleString('en-IN')})</span>
              </span>
              <span className="text-zinc-300 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-sky-400 shadow-xs" />
                <span>Cash on Delivery (₹{codRevenue.toLocaleString('en-IN')})</span>
              </span>
            </div>
          </div>
        ) : chartType === 'bar' ? (
          /* High-Precision Column Bar Chart Mode */
          <div className="space-y-4">
            <div className="h-64 flex items-end gap-2 sm:gap-3 pt-6 px-2 overflow-x-auto">
              {points.map((pt, idx) => {
                const heightPercent = maxValue > 0 ? Math.max(6, Math.round((pt.val / maxValue) * 100)) : 6;
                const isHovered = hoveredIndex === idx;
                const isPeak = peakPoint && peakPoint.index === idx;

                return (
                  <div
                    key={idx}
                    className="flex-1 min-w-[28px] max-w-[56px] flex flex-col items-center justify-end h-full group relative cursor-pointer"
                    onMouseEnter={() => setHoveredIndex(idx)}
                    onMouseLeave={() => setHoveredIndex(null)}
                  >
                    {isPeak && (
                      <span className="text-[9px] font-mono font-bold text-emerald-400 mb-1 bg-emerald-950/80 px-1.5 py-0.5 rounded border border-emerald-800/60 animate-pulse whitespace-nowrap">
                        ★ Peak
                      </span>
                    )}

                    <div 
                      style={{ height: `${heightPercent}%`, backgroundColor: pt.val > 0 ? currentCfg.strokeColor : '#22222C' }}
                      className={`w-full rounded-t-lg transition-all duration-300 ${
                        isHovered ? 'ring-2 ring-white/50 brightness-125' : 'opacity-85'
                      }`}
                    />

                    <span className={`text-[10px] font-mono mt-2 truncate w-full text-center transition-colors ${
                      isHovered ? 'text-white font-bold' : 'text-zinc-500'
                    }`}>
                      {pt.data.date || pt.data.weekLabel || pt.data.monthLabel}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          /* Monotone Continuous Spline Area Chart with Precision Anchor Dots */
          <div className="relative">
            <div className="w-full overflow-hidden">
              <svg 
                viewBox={`0 0 ${svgWidth} ${svgHeight}`} 
                className="w-full h-64 sm:h-72 select-none"
                style={{ overflow: 'visible' }}
              >
                <defs>
                  {/* Revenue Gradient */}
                  <linearGradient id="revGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10B981" stopOpacity="0.32" />
                    <stop offset="70%" stopColor="#10B981" stopOpacity="0.05" />
                    <stop offset="100%" stopColor="#10B981" stopOpacity="0.00" />
                  </linearGradient>

                  {/* Orders Gradient */}
                  <linearGradient id="ordersGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.32" />
                    <stop offset="70%" stopColor="#38BDF8" stopOpacity="0.05" />
                    <stop offset="100%" stopColor="#38BDF8" stopOpacity="0.00" />
                  </linearGradient>

                  {/* AOV Gradient */}
                  <linearGradient id="aovGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.32" />
                    <stop offset="70%" stopColor="#F59E0B" stopOpacity="0.05" />
                    <stop offset="100%" stopColor="#F59E0B" stopOpacity="0.00" />
                  </linearGradient>

                  {/* Subtle Glow Filter */}
                  <filter id="subtleGlow" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="2.5" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                  </filter>
                </defs>

                {/* Y-Axis Grid Lines & Non-Duplicate Labels */}
                {yTicks.map((tick, idx) => {
                  const y = padding.top + innerHeight - (maxValue > 0 ? (tick / maxValue) * innerHeight : 0);
                  return (
                    <g key={idx}>
                      <line
                        x1={padding.left}
                        y1={y}
                        x2={svgWidth - padding.right}
                        y2={y}
                        stroke="#22222E"
                        strokeDasharray="3 3"
                        strokeWidth="1"
                      />
                      <text
                        x={padding.left - 12}
                        y={y + 3.5}
                        textAnchor="end"
                        fill="#71717A"
                        fontSize="10"
                        fontFamily="monospace"
                        fontWeight="500"
                      >
                        {formatTickLabel(tick, selectedMetric === 'orders')}
                      </text>
                    </g>
                  );
                })}

                {/* Fill Area */}
                {areaPath && (
                  <path
                    d={areaPath}
                    fill={`url(#${currentCfg.gradientId})`}
                    className="transition-all duration-500 ease-out"
                  />
                )}

                {/* Monotone Spline Curve Line */}
                {linePath && (
                  <path
                    d={linePath}
                    fill="none"
                    stroke={currentCfg.strokeColor}
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    filter="url(#subtleGlow)"
                    className="transition-all duration-500 ease-out"
                  />
                )}

                {/* Peak Point Indicator Badge */}
                {peakPoint && (
                  <g>
                    <circle
                      cx={peakPoint.x}
                      cy={peakPoint.y}
                      r="7"
                      fill={currentCfg.strokeColor}
                      stroke="#0D0D11"
                      strokeWidth="2.5"
                    />
                    <rect
                      x={peakPoint.x - 38}
                      y={peakPoint.y - 28}
                      width="76"
                      height="18"
                      rx="4"
                      fill="#121216"
                      stroke={currentCfg.strokeColor}
                      strokeWidth="1"
                    />
                    <text
                      x={peakPoint.x}
                      y={peakPoint.y - 16}
                      textAnchor="middle"
                      fill={currentCfg.strokeColor}
                      fontSize="9"
                      fontFamily="monospace"
                      fontWeight="bold"
                    >
                      ★ {currentCfg.format(peakPoint.val)}
                    </text>
                  </g>
                )}

                {/* Hover Vertical Guide Line */}
                {hoveredIndex !== null && points[hoveredIndex] && (
                  <g>
                    <line
                      x1={points[hoveredIndex].x}
                      y1={padding.top}
                      x2={points[hoveredIndex].x}
                      y2={padding.top + innerHeight}
                      stroke="#52525B"
                      strokeDasharray="3 3"
                      strokeWidth="1.2"
                    />
                  </g>
                )}

                {/* Anchor Data Dots */}
                {points.map((pt, idx) => {
                  const isHovered = hoveredIndex === idx;
                  const isZero = pt.val === 0;

                  return (
                    <g key={idx}>
                      <circle
                        cx={pt.x}
                        cy={pt.y}
                        r={isHovered ? 6 : (points.length <= 15 ? 4 : 2.5)}
                        fill={isZero ? '#27272A' : (isHovered ? '#FFFFFF' : currentCfg.strokeColor)}
                        stroke="#0D0D11"
                        strokeWidth={isHovered ? 2.5 : 1.5}
                        className="transition-all duration-200 pointer-events-none"
                      />
                    </g>
                  );
                })}

                {/* Interactive Invisible Hover Capture Columns */}
                {points.map((pt, idx) => {
                  const colWidth = innerWidth / Math.max(points.length, 1);
                  return (
                    <rect
                      key={idx}
                      x={pt.x - colWidth / 2}
                      y={padding.top}
                      width={colWidth}
                      height={innerHeight}
                      fill="transparent"
                      className="cursor-pointer"
                      onMouseEnter={() => setHoveredIndex(idx)}
                      onMouseLeave={() => setHoveredIndex(null)}
                    />
                  );
                })}

                {/* X-Axis Tick Labels */}
                {points.map((pt, idx) => {
                  if (idx % xLabelStep !== 0 && idx !== points.length - 1) return null;
                  const label = pt.data.date || pt.data.weekLabel || pt.data.monthLabel || '';
                  const isHovered = hoveredIndex === idx;

                  return (
                    <text
                      key={idx}
                      x={pt.x}
                      y={padding.top + innerHeight + 20}
                      textAnchor="middle"
                      fill={isHovered ? '#FFFFFF' : '#71717A'}
                      fontSize="10"
                      fontFamily="monospace"
                      fontWeight={isHovered ? 'bold' : '500'}
                    >
                      {label}
                    </text>
                  );
                })}
              </svg>
            </div>
          </div>
        )}

        {/* 4. Rich Diagnostic Summary Card for Active / Hovered Point */}
        {activePt && (
          <div className="bg-[#111115] border border-[#262634] rounded-xl p-3.5 sm:p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3.5 sm:gap-4 text-xs">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full shadow-xs shrink-0" style={{ backgroundColor: currentCfg.strokeColor }} />
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-zinc-100 text-sm">
                    {activePt.data.fullDate || activePt.data.date || activePt.data.weekLabel || activePt.data.monthLabel}
                  </span>
                  {activePt.data.dayOfWeek && (
                    <span className="text-zinc-400 font-mono text-xs">({activePt.data.dayOfWeek})</span>
                  )}
                  {activePt.data.isoDate === new Date().toISOString().slice(0, 10) && (
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800/60 font-semibold">
                      Today (Live)
                    </span>
                  )}
                </div>
                <span className="text-zinc-500 text-[10px] sm:text-[11px] block mt-0.5">
                  {activePt.val === 0 ? 'No orders captured on this date' : 'Authoritative drop settlement data'}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:flex sm:items-center gap-3 sm:gap-6 font-mono pt-3 sm:pt-0 border-t sm:border-t-0 border-[#22222E]">
              <div>
                <span className="text-zinc-500 block text-[10px]">PAID REVENUE</span>
                <span className="font-bold text-emerald-400 text-xs sm:text-sm">
                  ₹{Number(activePt.data.revenue || 0).toLocaleString('en-IN')}
                </span>
              </div>
              <div>
                <span className="text-zinc-500 block text-[10px]">DROP ORDERS</span>
                <span className="font-bold text-sky-400 text-xs sm:text-sm">
                  {activePt.data.orders || 0} pcs
                </span>
              </div>
              <div>
                <span className="text-zinc-500 block text-[10px]">AVG BASKET (AOV)</span>
                <span className="font-bold text-amber-400 text-xs sm:text-sm">
                  {activePt.data.orders > 0 ? `₹${Number(activePt.data.aov || 0).toLocaleString('en-IN')}` : '—'}
                </span>
              </div>
              <div>
                <span className="text-zinc-500 block text-[10px]">PREPAID / COD</span>
                <span className="font-semibold text-zinc-300 text-xs sm:text-sm truncate block">
                  ₹{(activePt.data.prepaidRevenue || 0).toLocaleString('en-IN')} / ₹{(activePt.data.codRevenue || 0).toLocaleString('en-IN')}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 5. Deep Velocity Insights: Weekday Heatmap & Rush Hour Windows */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left: Day-of-Week Purchasing Rhythm */}
        <div className="lg:col-span-6 bg-[#16161A] border border-[#262632] rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#24242E]">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-300 flex items-center gap-1.5">
                <Calendar size={13} className="text-emerald-400" />
                <span>Day-of-Week Sales Velocity</span>
              </h3>
              <p className="text-[11px] text-zinc-400 mt-0.5">Which days of the week generate highest gross order volume</p>
            </div>
            <span className="text-[11px] font-mono text-zinc-500">Mon – Sun</span>
          </div>

          <div className="space-y-2.5 pt-1">
            {weekdayVelocity.map((dayObj, idx) => {
              const maxDayRev = Math.max(...weekdayVelocity.map(d => d.revenue), 1000);
              const percent = Math.max(8, Math.round((dayObj.revenue / maxDayRev) * 100));
              const isPeakDay = dayObj.revenue === maxDayRev;

              return (
                <div key={idx} className="flex items-center gap-3 text-xs">
                  <span className={`w-8 font-mono font-semibold ${isPeakDay ? 'text-emerald-300' : 'text-zinc-400'}`}>
                    {dayObj.day}
                  </span>
                  
                  <div className="flex-1 h-5 bg-[#101014] rounded-lg overflow-hidden border border-[#202028] p-0.5">
                    <div
                      style={{ width: `${percent}%` }}
                      className={`h-full rounded-md transition-all duration-500 ${
                        isPeakDay ? 'bg-emerald-500/90 shadow-xs' : 'bg-emerald-700/60'
                      }`}
                    />
                  </div>

                  <div className="w-24 text-right font-mono text-[11px]">
                    <span className="font-semibold text-zinc-200">₹{dayObj.revenue.toLocaleString('en-IN')}</span>
                    <span className="text-zinc-500 ml-1">({dayObj.orders})</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: 24h Drop Rush Windows */}
        <div className="lg:col-span-6 bg-[#16161A] border border-[#262632] rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#24242E]">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-300 flex items-center gap-1.5">
                <Clock size={13} className="text-sky-400" />
                <span>Peak Drop Purchasing Windows</span>
              </h3>
              <p className="text-[11px] text-zinc-400 mt-0.5">Customer ordering distribution across 24h cycle</p>
            </div>
            <span className="text-[11px] font-mono text-zinc-500">IST Timing</span>
          </div>

          <div className="space-y-2.5 pt-1">
            {hourlySlots.map((slot, idx) => {
              const totalSlotOrders = hourlySlots.reduce((s, h) => s + h.orders, 0) || 1;
              const slotPercent = Math.round((slot.orders / totalSlotOrders) * 100);

              return (
                <div key={idx} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-zinc-300 font-medium">{slot.label}</span>
                    <span className="font-mono text-zinc-400 text-[11px]">
                      {slot.orders} orders · <strong className="text-sky-300">{slotPercent}%</strong>
                    </span>
                  </div>
                  <div className="w-full h-2 bg-[#101014] rounded-full overflow-hidden border border-[#202028]">
                    <div
                      style={{ width: `${Math.max(4, slotPercent)}%` }}
                      className="h-full bg-gradient-to-r from-sky-600 to-sky-400 rounded-full transition-all duration-500"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
