import React, { useEffect, useMemo, useState, useRef } from 'react';
import { useStore } from '../store';
import { motion } from 'framer-motion';
import {
  Card, CardContent, CardHeader, Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
  Badge, EmptyState, useRoleTheme, cn
} from '../components/UI';
import { Tilt3DCard } from '../components/animations/Tilt3DCard';
import { CountUpNumber } from '../components/animations/CountUpNumber';
import { StaggerContainer, StaggerItem } from '../components/animations/StaggerContainer';
import {
  ClipboardList, CheckCircle2, Clock, AlertTriangle, Loader2, TrendingUp
} from 'lucide-react';

// ============ Animated SVG Donut Chart ============
interface DonutSegment {
  label: string;
  value: number;
  color: string;
}

function AnimatedDonutChart({ segments, size = 200 }: { segments: DonutSegment[]; size?: number }) {
  const theme = useRoleTheme();
  const [animated, setAnimated] = useState(false);
  const chartRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Trigger animation after mount
    const timer = setTimeout(() => setAnimated(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const total = segments.reduce((sum, s) => sum + s.value, 0);
  if (total === 0) {
    return (
      <div className="flex items-center justify-center" style={{ width: size, height: size }}>
        <p className={cn("text-sm", theme.textMuted)}>No data</p>
      </div>
    );
  }

  const center = size / 2;
  const radius = size * 0.38;
  const strokeWidth = size * 0.1;
  const circumference = 2 * Math.PI * radius;

  // Calculate each segment's offset and dash
  let cumulativeOffset = 0;
  const arcs = segments.map((seg) => {
    const ratio = seg.value / total;
    const dashLength = circumference * ratio;
    const gapLength = circumference - dashLength;
    const offset = -cumulativeOffset + circumference * 0.25; // Start from top
    cumulativeOffset += dashLength;

    return {
      ...seg,
      dashArray: `${animated ? dashLength : 0} ${animated ? gapLength : circumference}`,
      dashOffset: offset,
      percentage: Math.round(ratio * 100),
    };
  });

  return (
    <div ref={chartRef} className="flex flex-col items-center gap-4">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          {/* Background circle */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            strokeWidth={strokeWidth}
            className="stroke-white/5"
          />

          {/* Segments */}
          {arcs.map((arc, idx) => (
            <circle
              key={arc.label}
              cx={center}
              cy={center}
              r={radius}
              fill="none"
              strokeWidth={strokeWidth}
              stroke={arc.color}
              strokeDasharray={arc.dashArray}
              strokeDashoffset={arc.dashOffset}
              strokeLinecap="round"
              style={{
                transition: `stroke-dasharray 1s ease-out ${idx * 0.15}s`,
                filter: `drop-shadow(0 0 4px ${arc.color}40)`,
              }}
            />
          ))}
        </svg>

        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-bold text-[#E8E8FF]">
            <CountUpNumber end={total} duration={1000} />
          </span>
          <span className={cn("text-xs", theme.textMuted)}>Total Tasks</span>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
        {arcs.map((arc) => (
          <div key={arc.label} className="flex items-center gap-2">
            <span
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: arc.color, boxShadow: `0 0 8px ${arc.color}40` }}
            />
            <span className={cn("text-xs", theme.textMuted)}>
              {arc.label}
              <span className="ml-1 text-[#E8E8FF] font-medium">{arc.value}</span>
              <span className="ml-0.5 opacity-60">({arc.percentage}%)</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============ Main Reports Page ============
export const Reports = () => {
  const { reports, fetchReports, tasks } = useStore();
  const theme = useRoleTheme();

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const stats = useMemo(() => {
    if (!reports) return null;
    return {
      total: reports.total,
      pending: reports.pending,
      inProgress: reports.inProgress,
      completed: reports.completed,
      overdue: reports.overdue,
      completionRate: reports.total > 0 ? Math.round((reports.completed / reports.total) * 100) : 0,
    };
  }, [reports]);

  const chartSegments: DonutSegment[] = useMemo(() => {
    if (!stats) return [];
    return [
      { label: 'Pending', value: stats.pending, color: '#f59e0b' },
      { label: 'In Progress', value: stats.inProgress, color: '#3b82f6' },
      { label: 'Completed', value: stats.completed, color: '#10b981' },
      { label: 'Overdue', value: stats.overdue, color: '#ef4444' },
    ];
  }, [stats]);

  const statCards = useMemo(() => {
    if (!stats) return [];
    return [
      { title: 'Total Tasks', value: stats.total, icon: <ClipboardList className="w-5 h-5" />, color: 'blue' },
      { title: 'Completed', value: stats.completed, icon: <CheckCircle2 className="w-5 h-5" />, color: 'emerald' },
      { title: 'Pending', value: stats.pending, icon: <Clock className="w-5 h-5" />, color: 'amber' },
      { title: 'In Progress', value: stats.inProgress, icon: <Loader2 className="w-5 h-5" />, color: 'blue' },
      { title: 'Overdue', value: stats.overdue, icon: <AlertTriangle className="w-5 h-5" />, color: 'red' },
      { title: 'Completion Rate', value: stats.completionRate, icon: <TrendingUp className="w-5 h-5" />, color: 'emerald', suffix: '%' },
    ];
  }, [stats]);

  if (!reports || !stats) {
    return (
      <div className="space-y-4">
        <div className="skeleton h-10 w-48" />
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map(i => <div key={i} className="skeleton h-28" />)}
        </div>
        <div className="skeleton h-64" />
      </div>
    );
  }

  const colorMap: Record<string, { bg: string; text: string }> = {
    blue: { bg: 'bg-blue-500/15', text: 'text-blue-400' },
    emerald: { bg: 'bg-emerald-500/15', text: 'text-emerald-400' },
    amber: { bg: 'bg-amber-500/15', text: 'text-amber-400' },
    red: { bg: 'bg-red-500/15', text: 'text-red-400' },
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[#E8E8FF]">Analytics & Reports</h1>
        <p className={cn("text-sm mt-1", theme.textMuted)}>
          Task overview and performance metrics
        </p>
      </div>

      {/* Stat Cards */}
      <StaggerContainer className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4" staggerDelay={0.08}>
        {statCards.map((card) => {
          const colors = colorMap[card.color] || colorMap.blue;
          return (
            <StaggerItem key={card.title} animation="scaleUp">
              <Tilt3DCard>
                <Card variant="elevated" className={cn("p-5 h-full", card.color === 'red' && card.value > 0 && "animate-overdue-pulse border-red-500/30")}>
                  <div className="flex items-start justify-between mb-2">
                    <span className={cn("p-2 rounded-lg", colors.bg, colors.text)}>{card.icon}</span>
                  </div>
                  <p className="text-2xl font-bold text-[#E8E8FF] tracking-tight">
                    <CountUpNumber end={card.value} suffix={card.suffix} />
                  </p>
                  <p className={cn("text-xs mt-1", theme.textMuted)}>{card.title}</p>
                </Card>
              </Tilt3DCard>
            </StaggerItem>
          );
        })}
      </StaggerContainer>

      {/* Chart + Table Row */}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
        {/* Donut Chart */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="xl:col-span-2"
        >
          <Card className="p-6 flex items-center justify-center">
            <AnimatedDonutChart segments={chartSegments} size={220} />
          </Card>
        </motion.div>

        {/* Overdue Tasks Table */}
        <div className="xl:col-span-3">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-[#E8E8FF]">Overdue Tasks</h2>
                {reports.overdueTasks && reports.overdueTasks.length > 0 && (
                  <Badge variant="danger">{reports.overdueTasks.length} tasks</Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {(!reports.overdueTasks || reports.overdueTasks.length === 0) ? (
                <div className="p-8"><EmptyState title="All clear!" description="No overdue tasks. Great job!" /></div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Task</TableHead>
                      <TableHead>Assignee</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>Days Overdue</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reports.overdueTasks.map((task) => {
                      const daysOverdue = task.dueDate
                        ? Math.max(0, Math.floor((Date.now() - new Date(task.dueDate).getTime()) / (1000 * 60 * 60 * 24)))
                        : 0;
                      const isSevere = daysOverdue > 7;
                      return (
                        <TableRow
                          key={task.id}
                          className={cn(
                            "table-row-hover",
                            isSevere && "bg-red-500/5"
                          )}
                        >
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {isSevere && <AlertTriangle className="w-3.5 h-3.5 text-red-400 shrink-0" />}
                              <span className="text-[#E8E8FF] font-medium">{task.title}</span>
                            </div>
                          </TableCell>
                          <TableCell>{task.assignedUser?.name || 'Unassigned'}</TableCell>
                          <TableCell>
                            <Badge variant={task.priority === 'HIGH' ? 'danger' : task.priority === 'MEDIUM' ? 'warning' : 'default'}>
                              {task.priority}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <span className={cn(
                              "text-sm font-medium",
                              isSevere ? "text-red-400" : "text-amber-400"
                            )}>
                              {daysOverdue}d
                            </span>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
