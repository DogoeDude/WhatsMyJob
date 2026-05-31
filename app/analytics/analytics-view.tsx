'use client';

import { useEffect, useState } from 'react';
import { PageContent, PageShell } from '@/components/page-shell';
import { PageHeader } from '@/components/page-header';
import { StatCard } from '@/components/stat-card';
import { SectionCard } from '@/components/section-card';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { Briefcase, Building2, MapPin, TrendingUp, DollarSign } from 'lucide-react';

const salaryData = [
  { range: '$50k-$70k', count: 12 },
  { range: '$70k-$90k', count: 28 },
  { range: '$90k-$110k', count: 35 },
  { range: '$110k-$130k', count: 42 },
  { range: '$130k-$150k', count: 38 },
  { range: '$150k+', count: 25 },
];

const jobTrendData = [
  { month: 'Jan', jobs: 145, applications: 420 },
  { month: 'Feb', jobs: 182, applications: 510 },
  { month: 'Mar', jobs: 210, applications: 680 },
  { month: 'Apr', jobs: 198, applications: 640 },
  { month: 'May', jobs: 245, applications: 780 },
  { month: 'Jun', jobs: 287, applications: 920 },
];

const locationData = [
  { name: 'Remote', value: 35, fill: 'oklch(0.48 0.19 275)' },
  { name: 'San Francisco', value: 22, fill: 'oklch(0.55 0.17 250)' },
  { name: 'New York', value: 18, fill: 'oklch(0.62 0.14 195)' },
  { name: 'Austin', value: 15, fill: 'oklch(0.65 0.14 320)' },
  { name: 'Boston', value: 10, fill: 'oklch(0.58 0.14 340)' },
];

const jobTypeDistribution = [
  { name: 'Full-time', value: 65, fill: 'oklch(0.48 0.19 275)' },
  { name: 'Contract', value: 20, fill: 'oklch(0.55 0.17 250)' },
  { name: 'Part-time', value: 10, fill: 'oklch(0.62 0.14 195)' },
  { name: 'Internship', value: 5, fill: 'oklch(0.65 0.14 320)' },
];

const topCompanies = [
  { name: 'TechCorp', openings: 18, trend: '+5' },
  { name: 'InnovateLabs', openings: 14, trend: '+3' },
  { name: 'StartupX', openings: 12, trend: '+2' },
  { name: 'DesignHub', openings: 10, trend: '+1' },
  { name: 'DataCo', openings: 9, trend: '+4' },
];

const regionData = [
  {
    region: 'West Coast',
    jobs: 52,
    avgSalary: '$145k',
    growth: '+12%',
    topRole: 'Frontend Engineer',
  },
  {
    region: 'Northeast',
    jobs: 38,
    avgSalary: '$152k',
    growth: '+8%',
    topRole: 'Product Manager',
  },
  {
    region: 'Central',
    jobs: 28,
    avgSalary: '$128k',
    growth: '+15%',
    topRole: 'Full Stack Developer',
  },
  {
    region: 'South',
    jobs: 22,
    avgSalary: '$118k',
    growth: '+6%',
    topRole: 'UX Designer',
  },
];

type JobStatsResponse = {
  totalJobs: number;
  locationCount: number;
  companyCount: number;
  mode?: 'database' | 'live';
  error?: string;
};

export default function AnalyticsView() {
  const [stats, setStats] = useState<JobStatsResponse | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setStatsLoading(true);
      try {
        const res = await fetch('/api/jobs/stats');
        const data = (await res.json()) as JobStatsResponse;
        if (!cancelled && res.ok) setStats(data);
      } catch {
        if (!cancelled) setStats(null);
      } finally {
        if (!cancelled) setStatsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const statValue = (n: number | undefined) =>
    statsLoading ? '…' : (n ?? 0).toLocaleString();

  const statsHint =
    stats?.mode === 'live' ? 'From live job board APIs' : 'From synced database';

  return (
    <PageShell>
      <PageHeader
        badge="Insights"
        title="Analytics & Insights"
        subtitle="Market trends, regional insights, and job market analytics."
      />

      <PageContent>
        <div className="mb-10 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard
            label="Total jobs"
            value={statValue(stats?.totalJobs)}
            hint={statsHint}
            icon={Briefcase}
          />
          <StatCard
            label="Locations"
            value={statValue(stats?.locationCount)}
            hint={statsHint}
            icon={MapPin}
            iconColor="purple"
          />
          <StatCard
            label="Companies"
            value={statValue(stats?.companyCount)}
            hint={statsHint}
            icon={Building2}
            iconColor="blue"
          />
        </div>

        <div className="mb-10 grid grid-cols-1 gap-4 md:grid-cols-2">
          <StatCard label="Avg. Salary" value="$136k" hint="Sample data" icon={TrendingUp} iconColor="blue" />
          <StatCard label="Job Growth" value="+24%" hint="Sample data" icon={DollarSign} iconColor="amber" />
        </div>

        <div className="mb-10 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <SectionCard title="Salary Distribution">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={salaryData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="range" stroke="var(--color-muted-foreground)" />
                <YAxis stroke="var(--color-muted-foreground)" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--color-card)',
                    border: '1px solid var(--color-border)',
                  }}
                />
                <Bar dataKey="count" fill="var(--color-accent)" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </SectionCard>

          <SectionCard title="Job & Application Trends">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={jobTrendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="month" stroke="var(--color-muted-foreground)" />
                <YAxis stroke="var(--color-muted-foreground)" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--color-card)',
                    border: '1px solid var(--color-border)',
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="jobs"
                  stroke="var(--color-accent)"
                  strokeWidth={2}
                  dot={{ fill: 'var(--color-accent)', r: 4 }}
                />
                <Line
                  type="monotone"
                  dataKey="applications"
                  stroke="#8B5CF6"
                  strokeWidth={2}
                  dot={{ fill: '#8B5CF6', r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </SectionCard>

          <SectionCard title="Jobs by Location">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={locationData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name} ${value}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {locationData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--color-card)',
                    border: '1px solid var(--color-border)',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </SectionCard>

          <SectionCard title="Job Type Distribution">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={jobTypeDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name} ${value}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {jobTypeDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--color-card)',
                    border: '1px solid var(--color-border)',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </SectionCard>
        </div>

        <SectionCard title="Regional Insights" className="mb-10">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {regionData.map((region, idx) => (
              <div
                key={idx}
                className="rounded-xl border border-border/60 bg-muted/20 p-5 transition-colors hover:bg-muted/40"
              >
                <div className="mb-4 flex items-start justify-between">
                  <h4 className="text-lg font-semibold text-foreground">{region.region}</h4>
                  <span className="text-sm font-semibold text-green-600">{region.growth}</span>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Total Jobs</span>
                    <span className="font-semibold text-foreground">{region.jobs}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Average Salary</span>
                    <span className="font-semibold text-foreground">{region.avgSalary}</span>
                  </div>
                  <div className="flex items-center justify-between border-t border-border pt-2">
                    <span className="text-sm text-muted-foreground">Top Role</span>
                    <span className="text-sm font-semibold text-accent">{region.topRole}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard title="Top Hiring Companies">
          <div className="space-y-3">
            {topCompanies.map((company, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between rounded-xl border border-border/60 bg-muted/20 p-4 transition-colors hover:bg-muted/40"
              >
                <div className="flex-1">
                  <h4 className="font-semibold text-foreground">{company.name}</h4>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <p className="text-2xl font-bold text-accent">{company.openings}</p>
                    <p className="text-xs text-green-600">{company.trend} this month</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      </PageContent>
    </PageShell>
  );
}
