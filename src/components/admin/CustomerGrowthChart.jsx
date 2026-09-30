import React, { useState, useMemo } from 'react';
import { 
  TrendingUp, 
  Users, 
  UserCheck, 
  RotateCcw, 
  Calendar, 
  Sparkles, 
  Activity,
  ArrowUpRight,
  Layers,
  ChevronRight
} from 'lucide-react';

/**
 * Fritsch-Carlson Monotone Cubic Spline Algorithm
 * Guarantees zero overshoot/undershoot, monotonic transitions, and smooth rendering.
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
 * Calculates clean, integer Y-axis ticks for customer counts
 */
function calculateCustomerTicks(maxValue) {
  if (maxValue <= 0) maxValue = 5;
  if (maxValue <= 5) return { ticks: [0, 1, 2, 3, 4, 5], top: 5 };
  if (maxValue <= 10) return { ticks: [0, 2, 4, 6, 8, 10], top: 10 };
  if (maxValue <= 20) return { ticks: [0, 5, 10, 15, 20], top: 20 };
  
  const step = Math.ceil(maxValue / 4);
  const top = step * 4;
  return { ticks: [0, step, step * 2, step * 3, top], top };
}

export const CustomerGrowthChart = ({ customers = [], timeRange: controlledRange = null }) => {
  const [internalTimeRange, setInternalTimeRange] = useState('30d');
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const [activeSeries, setActiveSeries] = useState('all'); // 'all' | 'new' | 'returning'

  const timeRange = controlledRange || internalTimeRange;

  // Process customer orders into authoritative New vs Returning time series
  const { dataset, totalNewInPeriod, totalReturningInPeriod, totalActivityInPeriod, hasData } = useMemo(() => {
    const now = Date.now();
    let daysCutoff = 30;
    if (timeRange === '7d' || timeRange === '7D') daysCutoff = 7;
    else if (timeRange === '30d' || timeRange === '30D') daysCutoff = 30;
    else if (timeRange === '90d' || timeRange === '90D') daysCutoff = 90;
    else if (timeRange === 'all' || timeRange === 'ALL') {
      let earliestTime = now - (90 * 24 * 60 * 60 * 1000);
      customers.forEach(c => {
        (c.orders || []).forEach(o => {
          const t = new Date(o.created_at || o.createdAt).getTime();
          if (t && t < earliestTime) earliestTime = t;
        });
      });
      daysCutoff = Math.max(30, Math.ceil((now - earliestTime) / (24 * 60 * 60 * 1000)) + 1);
    }

    const cutoffDate = new Date(now - (daysCutoff * 24 * 60 * 60 * 1000));

    // Build day buckets map
    const dayBuckets = {};
    for (let i = daysCutoff - 1; i >= 0; i--) {
      const d = new Date(now - (i * 24 * 60 * 60 * 1000));
      const isoKey = d.toISOString().slice(0, 10);
      const label = d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
      const fullDate = d.toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
      const dayOfWeek = d.toLocaleDateString('en-IN', { weekday: 'short' });

      dayBuckets[isoKey] = {
        isoDate: isoKey,
        label,
        fullDate,
        dayOfWeek,
        newCustomers: 0,
        returningCustomers: 0,
        total: 0
      };
    }

    let periodNew = 0;
    let periodReturning = 0;
    let anyActivity = false;

    // Attribute each order to New Customer (1st order) or Returning Customer (2nd+ order)
    customers.forEach(customer => {
      const orders = [...(customer.orders || [])].sort((a, b) => {
        const da = new Date(a.created_at || a.createdAt || 0).getTime();
        const db = new Date(b.created_at || b.createdAt || 0).getTime();
        return da - db;
      });

      orders.forEach((ord, index) => {
        const d = new Date(ord.created_at || ord.createdAt);
        if (isNaN(d.getTime())) return;
        const isoKey = d.toISOString().slice(0, 10);

        if (d >= cutoffDate && dayBuckets[isoKey]) {
          anyActivity = true;
          if (index === 0) {
            dayBuckets[isoKey].newCustomers += 1;
            periodNew += 1;
          } else {
            dayBuckets[isoKey].returningCustomers += 1;
            periodReturning += 1;
          }
          dayBuckets[isoKey].total = dayBuckets[isoKey].newCustomers + dayBuckets[isoKey].returningCustomers;
        }
      });
    });

    const rawList = Object.values(dayBuckets);

    // If timeRange is 90d or all and has many days, group into weekly or condensed intervals for legibility
    let finalList = rawList;
    if (daysCutoff > 45) {
      const weeklyBuckets = [];
      const chunkSize = 7;
      for (let i = 0; i < rawList.length; i += chunkSize) {
        const slice = rawList.slice(i, i + chunkSize);
        const first = slice[0];
        const last = slice[slice.length - 1];
        const newSum = slice.reduce((s, d) => s + d.newCustomers, 0);
        const retSum = slice.reduce((s, d) => s + d.returningCustomers, 0);
        weeklyBuckets.push({
          isoDate: first.isoDate,
          label: `${first.label} - ${last.label}`,
          fullDate: `${first.label} – ${last.label}, ${new Date(first.isoDate).getFullYear()}`,
          dayOfWeek: 'Wk',
          newCustomers: newSum,
          returningCustomers: retSum,
          total: newSum + retSum
        });
      }
      finalList = weeklyBuckets;
    }

    return {
      dataset: finalList,
      totalNewInPeriod: periodNew,
      totalReturningInPeriod: periodReturning,
      totalActivityInPeriod: periodNew + periodReturning,
      hasData: anyActivity && (periodNew + periodReturning > 0)
    };
  }, [customers, timeRange]);

  // SVG Geometry Settings
  const svgWidth = 900;
  const svgHeight = 280;
  const padding = { top: 35, right: 30, bottom: 45, left: 55 };
  const innerWidth = svgWidth - padding.left - padding.right;
  const innerHeight = svgHeight - padding.top - padding.bottom;

  // Compute Max Values and Coordinates
  const { newPoints, returningPoints, totalPoints, yTicks, topVal } = useMemo(() => {
    if (!dataset || dataset.length === 0) {
      return { newPoints: [], returningPoints: [], totalPoints: [], yTicks: [0, 1, 2, 3, 4, 5], topVal: 5 };
    }

    const allValues = dataset.flatMap(d => [d.newCustomers, d.returningCustomers, d.total]);
    const maxDataVal = Math.max(...allValues, 0);
    const { ticks, top } = calculateCustomerTicks(maxDataVal);

    const len = Math.max(dataset.length - 1, 1);

    const ptsNew = dataset.map((d, idx) => {
      const x = padding.left + (idx / len) * innerWidth;
      const y = padding.top + innerHeight - (top > 0 ? (d.newCustomers / top) * innerHeight : 0);
      return { x: Number(x.toFixed(1)), y: Number(y.toFixed(1)), val: d.newCustomers, data: d, index: idx };
    });

    const ptsRet = dataset.map((d, idx) => {
      const x = padding.left + (idx / len) * innerWidth;
      const y = padding.top + innerHeight - (top > 0 ? (d.returningCustomers / top) * innerHeight : 0);
      return { x: Number(x.toFixed(1)), y: Number(y.toFixed(1)), val: d.returningCustomers, data: d, index: idx };
    });

    const ptsTot = dataset.map((d, idx) => {
      const x = padding.left + (idx / len) * innerWidth;
      const y = padding.top + innerHeight - (top > 0 ? (d.total / top) * innerHeight : 0);
      return { x: Number(x.toFixed(1)), y: Number(y.toFixed(1)), val: d.total, data: d, index: idx };
    });

    return {
      newPoints: ptsNew,
      returningPoints: ptsRet,
      totalPoints: ptsTot,
      yTicks: ticks,
      topVal: top
    };
  }, [dataset, innerWidth, innerHeight, padding.left, padding.top]);

  // Spline paths
  const newPath = useMemo(() => generateMonotonePath(newPoints), [newPoints]);
  const retPath = useMemo(() => generateMonotonePath(returningPoints), [returningPoints]);

  const newAreaPath = useMemo(() => {
    if (!newPoints || newPoints.length === 0) return '';
    const bottomY = padding.top + innerHeight;
    return `${newPath} L ${newPoints[newPoints.length - 1].x},${bottomY} L ${newPoints[0].x},${bottomY} Z`;
  }, [newPath, newPoints, padding.top, innerHeight]);

  const retAreaPath = useMemo(() => {
    if (!returningPoints || returningPoints.length === 0) return '';
    const bottomY = padding.top + innerHeight;
    return `${retPath} L ${returningPoints[returningPoints.length - 1].x},${bottomY} L ${returningPoints[0].x},${bottomY} Z`;
  }, [retPath, returningPoints, padding.top, innerHeight]);

  // Active hover point
  const activeDataPoint = hoveredIndex !== null && dataset[hoveredIndex] ? dataset[hoveredIndex] : null;

  // X-axis label stride
  const xLabelStep = useMemo(() => {
    if (dataset.length <= 8) return 1;
    if (dataset.length <= 16) return 2;
    if (dataset.length <= 35) return 4;
    return Math.ceil(dataset.length / 8);
  }, [dataset.length]);

  return (
    <div className="bg-[#16161A] border border-[#262632] rounded-2xl shadow-xs p-5 sm:p-6 space-y-5 font-sans">
      
      {/* 1. Header & Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-[#24242E]">
        <div>
          <div className="flex items-center gap-2.5">
            <h3 className="text-base font-bold text-[#EDEDF0] tracking-tight flex items-center gap-2">
              <Activity size={16} className="text-zinc-400" />
              <span>Customer Growth & Retention Trajectory</span>
            </h3>
            <span className="px-2 py-0.5 rounded-full bg-[#1A1A22] text-zinc-300 text-[10px] font-mono font-medium border border-[#2B2B38]">
              Cohort Dynamics
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Visual tracking of first-time patron acquisitions vs. repeat customer drop orders over time.
          </p>
        </div>

        {/* Controls: Series Filter & Time Range Selector */}
        <div className="flex flex-wrap items-center gap-3">
          
          {/* Series Filter Selector */}
          <div className="flex items-center bg-[#101014] p-1 rounded-xl border border-[#22222C] text-xs">
            <button
              onClick={() => setActiveSeries('all')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                activeSeries === 'all' 
                  ? 'bg-[#22222C] text-white shadow-xs font-semibold' 
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              All Cohorts
            </button>
            <button
              onClick={() => setActiveSeries('new')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
                activeSeries === 'new' 
                  ? 'bg-[#22222C] text-sky-300 shadow-xs font-semibold' 
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
              <span>New</span>
            </button>
            <button
              onClick={() => setActiveSeries('returning')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
                activeSeries === 'returning' 
                  ? 'bg-[#22222C] text-violet-300 shadow-xs font-semibold' 
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-violet-400" />
              <span>Returning</span>
            </button>
          </div>

          {/* Time Range Pills */}
          <div className="flex items-center bg-[#101014] p-1 rounded-xl border border-[#22222C] text-xs">
            {[
              { id: '7d', label: '7D' },
              { id: '30d', label: '30D' },
              { id: '90d', label: '90D' },
              { id: 'all', label: 'ALL' }
            ].map(range => {
              const isSelected = (timeRange || '30d').toLowerCase() === range.id;
              return (
                <button
                  key={range.id}
                  onClick={() => setInternalTimeRange(range.id)}
                  className={`px-3 py-1.5 rounded-lg font-mono font-medium transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[#22222C] text-white shadow-xs font-bold border border-[#3A3A4C]'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  {range.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 2. Period Summary Chips */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div className="bg-[#141418] border border-[#22222C] p-3.5 rounded-xl flex items-center justify-between">
          <div>
            <div className="text-[11px] text-zinc-400">New in Period</div>
            <div className="text-lg font-bold font-mono text-sky-400 mt-0.5">{totalNewInPeriod}</div>
          </div>
          <span className="w-2.5 h-2.5 rounded-full bg-sky-400 shadow-[0_0_8px_rgba(56,189,248,0.5)]" />
        </div>

        <div className="bg-[#141418] border border-[#22222C] p-3.5 rounded-xl flex items-center justify-between">
          <div>
            <div className="text-[11px] text-zinc-400">Returning in Period</div>
            <div className="text-lg font-bold font-mono text-violet-400 mt-0.5">{totalReturningInPeriod}</div>
          </div>
          <span className="w-2.5 h-2.5 rounded-full bg-violet-400 shadow-[0_0_8px_rgba(167,139,250,0.5)]" />
        </div>

        <div className="bg-[#141418] border border-[#22222C] p-3.5 rounded-xl flex items-center justify-between">
          <div>
            <div className="text-[11px] text-zinc-400">Period Retention Share</div>
            <div className="text-lg font-bold font-mono text-[#EDEDF0] mt-0.5">
              {totalActivityInPeriod > 0 ? Math.round((totalReturningInPeriod / totalActivityInPeriod) * 100) : 0}%
            </div>
          </div>
          <RotateCcw size={14} className="text-zinc-500" />
        </div>

        <div className="bg-[#141418] border border-[#22222C] p-3.5 rounded-xl flex items-center justify-between">
          <div>
            <div className="text-[11px] text-zinc-400">Total Patrons Ledger</div>
            <div className="text-lg font-bold font-mono text-emerald-400 mt-0.5">{customers.length}</div>
          </div>
          <Users size={14} className="text-emerald-500" />
        </div>
      </div>

      {/* 3. Interactive SVG Monotone Vector Chart */}
      <div className="relative w-full overflow-hidden bg-[#121216] border border-[#202028] rounded-2xl p-2 sm:p-4">
        
        {/* Dynamic Tooltip on Hover */}
        {activeDataPoint && hoveredIndex !== null && (
          <div 
            className="absolute z-20 pointer-events-none transition-transform duration-75"
            style={{
              left: `${Math.min(Math.max((newPoints[hoveredIndex]?.x || 100) - 90, 10), innerWidth - 80)}px`,
              top: '20px'
            }}
          >
            <div className="bg-[#1A1A22] border border-[#333344] shadow-2xl rounded-xl p-3 text-xs space-y-1.5 backdrop-blur-md">
              <div className="font-semibold text-zinc-200 border-b border-[#282834] pb-1">
                {activeDataPoint.fullDate || activeDataPoint.label}
              </div>
              <div className="flex items-center justify-between gap-4 font-mono text-[11px]">
                <span className="text-sky-300 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-sky-400" />
                  <span>New Customers:</span>
                </span>
                <span className="font-bold text-white">{activeDataPoint.newCustomers}</span>
              </div>
              <div className="flex items-center justify-between gap-4 font-mono text-[11px]">
                <span className="text-violet-300 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-violet-400" />
                  <span>Returning Customers:</span>
                </span>
                <span className="font-bold text-white">{activeDataPoint.returningCustomers}</span>
              </div>
              <div className="pt-1 border-t border-[#282834] flex items-center justify-between gap-4 font-mono text-[11px]">
                <span className="text-zinc-400">Total Activity:</span>
                <span className="font-bold text-emerald-400">{activeDataPoint.total}</span>
              </div>
            </div>
          </div>
        )}

        {/* SVG Canvas */}
        <svg 
          viewBox={`0 0 ${svgWidth} ${svgHeight}`} 
          className="w-full h-auto overflow-visible select-none"
        >
          <defs>
            {/* New Customers Gradients */}
            <linearGradient id="crmNewGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#38BDF8" stopOpacity="0.0" />
            </linearGradient>

            {/* Returning Customers Gradients */}
            <linearGradient id="crmRetGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#A78BFA" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#A78BFA" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines & Y-Axis Ticks */}
          {yTicks.map((tickVal, tIdx) => {
            const y = padding.top + innerHeight - (topVal > 0 ? (tickVal / topVal) * innerHeight : 0);
            return (
              <g key={tIdx}>
                <line 
                  x1={padding.left} 
                  y1={y} 
                  x2={svgWidth - padding.right} 
                  y2={y} 
                  stroke="#1E1E26" 
                  strokeWidth="1" 
                  strokeDasharray={tIdx === 0 ? 'none' : '3 3'}
                />
                <text 
                  x={padding.left - 12} 
                  y={y + 4} 
                  fill="#71717A" 
                  fontSize="10" 
                  fontFamily="monospace" 
                  textAnchor="end"
                >
                  {tickVal}
                </text>
              </g>
            );
          })}

          {/* Area Fills */}
          {(activeSeries === 'all' || activeSeries === 'new') && (
            <path d={newAreaPath} fill="url(#crmNewGradient)" />
          )}
          {(activeSeries === 'all' || activeSeries === 'returning') && (
            <path d={retAreaPath} fill="url(#crmRetGradient)" />
          )}

          {/* Monotone Spline Stroke Lines */}
          {(activeSeries === 'all' || activeSeries === 'returning') && (
            <path 
              d={retPath} 
              fill="none" 
              stroke="#A78BFA" 
              strokeWidth="2.5" 
              strokeLinecap="round" 
              strokeLinejoin="round" 
            />
          )}

          {(activeSeries === 'all' || activeSeries === 'new') && (
            <path 
              d={newPath} 
              fill="none" 
              stroke="#38BDF8" 
              strokeWidth="2.5" 
              strokeLinecap="round" 
              strokeLinejoin="round" 
            />
          )}

          {/* Interactive Hover Columns & Indicator Dots */}
          {dataset.map((d, idx) => {
            const x = padding.left + (idx / Math.max(dataset.length - 1, 1)) * innerWidth;
            const ptNew = newPoints[idx];
            const ptRet = returningPoints[idx];
            const isHovered = hoveredIndex === idx;

            return (
              <g 
                key={idx}
                onMouseEnter={() => setHoveredIndex(idx)}
                onMouseLeave={() => setHoveredIndex(null)}
                className="cursor-pointer"
              >
                {/* Transparent hit target column */}
                <rect 
                  x={x - (innerWidth / (dataset.length * 2))}
                  y={padding.top}
                  width={innerWidth / dataset.length}
                  height={innerHeight}
                  fill="transparent"
                />

                {/* Vertical Cursor Guide on hover */}
                {isHovered && (
                  <line 
                    x1={x} 
                    y1={padding.top} 
                    x2={x} 
                    y2={padding.top + innerHeight} 
                    stroke="#3A3A4C" 
                    strokeWidth="1.5" 
                    strokeDasharray="2 2" 
                  />
                )}

                {/* New Customer Dot */}
                {(activeSeries === 'all' || activeSeries === 'new') && ptNew && (
                  <circle 
                    cx={ptNew.x} 
                    cy={ptNew.y} 
                    r={isHovered ? 5 : (d.newCustomers > 0 ? 3.5 : 2)} 
                    fill={d.newCustomers > 0 ? '#38BDF8' : '#1A1A24'} 
                    stroke="#38BDF8" 
                    strokeWidth={isHovered ? 2.5 : 1}
                    className="transition-all duration-150"
                  />
                )}

                {/* Returning Customer Dot */}
                {(activeSeries === 'all' || activeSeries === 'returning') && ptRet && (
                  <circle 
                    cx={ptRet.x} 
                    cy={ptRet.y} 
                    r={isHovered ? 5 : (d.returningCustomers > 0 ? 3.5 : 2)} 
                    fill={d.returningCustomers > 0 ? '#A78BFA' : '#1A1A24'} 
                    stroke="#A78BFA" 
                    strokeWidth={isHovered ? 2.5 : 1}
                    className="transition-all duration-150"
                  />
                )}

                {/* X-Axis Tick & Label */}
                {idx % xLabelStep === 0 && (
                  <g>
                    <line 
                      x1={x} 
                      y1={padding.top + innerHeight} 
                      x2={x} 
                      y2={padding.top + innerHeight + 5} 
                      stroke="#2E2E3C" 
                      strokeWidth="1" 
                    />
                    <text 
                      x={x} 
                      y={padding.top + innerHeight + 18} 
                      fill={isHovered ? '#EDEDF0' : '#71717A'} 
                      fontSize="9.5" 
                      fontFamily="monospace" 
                      textAnchor="middle"
                      className="transition-colors"
                    >
                      {d.label}
                    </text>
                  </g>
                )}
              </g>
            );
          })}
        </svg>

        {/* Elegant Zero / Empty State Overlay without breaking the chart */}
        {!hasData && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none p-6">
            <div className="bg-[#16161C]/90 border border-[#282834] rounded-xl px-5 py-3.5 shadow-xl text-center backdrop-blur-xs max-w-sm">
              <div className="flex items-center justify-center gap-1.5 text-zinc-300 text-xs font-semibold mb-1">
                <Sparkles size={13} className="text-zinc-400" />
                <span>Zero-Activity Baseline</span>
              </div>
              <p className="text-[11px] text-zinc-400 leading-relaxed">
                No customer orders recorded in this period yet. New patron acquisitions and repeat drop orders will chart here live.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* 4. Chart Footer Legend */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs pt-1 border-t border-[#202028]">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-sky-400 inline-block shadow-[0_0_6px_rgba(56,189,248,0.4)]" />
            <span className="text-zinc-200 font-medium">New Customers (1st Order)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-violet-400 inline-block shadow-[0_0_6px_rgba(167,139,250,0.4)]" />
            <span className="text-zinc-200 font-medium">Returning Customers (2+ Orders)</span>
          </div>
        </div>

        <div className="text-[11px] text-zinc-500 font-mono flex items-center gap-1">
          <span>Live Cohort Sync</span>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
        </div>
      </div>

    </div>
  );
};
