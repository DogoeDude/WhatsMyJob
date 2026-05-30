'use client';

import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
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
import { TrendingUp, Users, MapPin, DollarSign } from 'lucide-react';

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
  { name: 'Remote', value: 35, fill: '#3B82F6' },
  { name: 'San Francisco', value: 22, fill: '#8B5CF6' },
  { name: 'New York', value: 18, fill: '#EC4899' },
  { name: 'Austin', value: 15, fill: '#F59E0B' },
  { name: 'Boston', value: 10, fill: '#10B981' },
];

const jobTypeDistribution = [
  { name: 'Full-time', value: 65, fill: '#3B82F6' },
  { name: 'Contract', value: 20, fill: '#8B5CF6' },
  { name: 'Part-time', value: 10, fill: '#F59E0B' },
  { name: 'Internship', value: 5, fill: '#10B981' },
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

export default function Analytics() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      {/* Header */}
      <section className="border-b border-border bg-card">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
          <h1 className="text-4xl font-bold text-foreground mb-2">Analytics & Insights</h1>
          <p className="text-lg text-muted-foreground">
            Market trends, regional insights, and job market analytics
          </p>
        </div>
      </section>

      {/* Main Content */}
      <div className="flex-1">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
            <div className="bg-card border border-border rounded-lg p-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 bg-blue-500/10 rounded-lg flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-blue-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Avg. Salary</p>
                  <p className="text-2xl font-bold text-foreground">$136k</p>
                  <p className="text-xs text-green-600">+5% from last month</p>
                </div>
              </div>
            </div>

            <div className="bg-card border border-border rounded-lg p-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 bg-purple-500/10 rounded-lg flex items-center justify-center">
                  <Users className="h-6 w-6 text-purple-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Active Jobs</p>
                  <p className="text-2xl font-bold text-foreground">1,284</p>
                  <p className="text-xs text-green-600">+18% growth</p>
                </div>
              </div>
            </div>

            <div className="bg-card border border-border rounded-lg p-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 bg-pink-500/10 rounded-lg flex items-center justify-center">
                  <MapPin className="h-6 w-6 text-pink-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Locations</p>
                  <p className="text-2xl font-bold text-foreground">45+</p>
                  <p className="text-xs text-blue-600">Expanding</p>
                </div>
              </div>
            </div>

            <div className="bg-card border border-border rounded-lg p-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 bg-amber-500/10 rounded-lg flex items-center justify-center">
                  <DollarSign className="h-6 w-6 text-amber-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Job Growth</p>
                  <p className="text-2xl font-bold text-foreground">+24%</p>
                  <p className="text-xs text-green-600">Q2 vs Q1</p>
                </div>
              </div>
            </div>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-12">
            {/* Salary Distribution */}
            <div className="bg-card border border-border rounded-lg p-6">
              <h3 className="text-lg font-semibold text-foreground mb-6">Salary Distribution</h3>
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
            </div>

            {/* Job Trends */}
            <div className="bg-card border border-border rounded-lg p-6">
              <h3 className="text-lg font-semibold text-foreground mb-6">Job & Application Trends</h3>
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
            </div>

            {/* Location Distribution */}
            <div className="bg-card border border-border rounded-lg p-6">
              <h3 className="text-lg font-semibold text-foreground mb-6">Jobs by Location</h3>
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
            </div>

            {/* Job Type Distribution */}
            <div className="bg-card border border-border rounded-lg p-6">
              <h3 className="text-lg font-semibold text-foreground mb-6">Job Type Distribution</h3>
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
            </div>
          </div>

          {/* Regional Insights */}
          <div className="bg-card border border-border rounded-lg p-6 mb-12">
            <h3 className="text-xl font-semibold text-foreground mb-6">Regional Insights</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {regionData.map((region, idx) => (
                <div
                  key={idx}
                  className="border border-border rounded-lg p-5 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start justify-between mb-4">
                    <h4 className="text-lg font-semibold text-foreground">{region.region}</h4>
                    <span className="text-green-600 text-sm font-semibold">{region.growth}</span>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Total Jobs</span>
                      <span className="font-semibold text-foreground">{region.jobs}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Average Salary</span>
                      <span className="font-semibold text-foreground">{region.avgSalary}</span>
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t border-border">
                      <span className="text-sm text-muted-foreground">Top Role</span>
                      <span className="text-sm font-semibold text-accent">{region.topRole}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Top Companies */}
          <div className="bg-card border border-border rounded-lg p-6">
            <h3 className="text-xl font-semibold text-foreground mb-6">Top Hiring Companies</h3>
            <div className="space-y-3">
              {topCompanies.map((company, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors"
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
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
