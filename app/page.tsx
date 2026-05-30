'use client';

import { useState } from 'react';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { JobCard } from '@/components/job-card';
import { JobDetailsModal } from '@/components/job-details-modal';
import { Search, Filter, MapPin, Briefcase } from 'lucide-react';

const mockJobs = [
  {
    id: '1',
    title: 'Senior Frontend Engineer',
    company: 'TechCorp',
    location: 'San Francisco, CA',
    salary: '$120k - $160k',
    type: 'Full-time',
    tags: ['React', 'TypeScript', 'Next.js'],
    description:
      'We\'re looking for an experienced Frontend Engineer to join our growing team. You\'ll work on cutting-edge web applications using modern technologies and collaborate with talented designers and engineers.',
    requirements: [
      '5+ years of frontend development experience',
      'Expert knowledge of React and TypeScript',
      'Experience with Next.js and modern tooling',
      'Strong understanding of web performance optimization',
      'Experience with responsive design and accessibility',
    ],
    benefits: [
      'Competitive salary and equity package',
      'Comprehensive health insurance',
      '401(k) matching',
      'Remote work options',
      'Professional development budget',
    ],
    postedDate: '2 days ago',
  },
  {
    id: '2',
    title: 'Product Manager',
    company: 'InnovateLabs',
    location: 'New York, NY',
    salary: '$140k - $180k',
    type: 'Full-time',
    tags: ['Product Strategy', 'Analytics', 'Leadership'],
    description:
      'Lead the vision and strategy for our flagship product. Work closely with engineering, design, and marketing teams to deliver features that delight our users.',
    requirements: [
      '4+ years of product management experience',
      'Track record of shipping successful products',
      'Strong analytical and communication skills',
      'Experience with B2B SaaS products',
    ],
    benefits: [
      'Competitive salary and bonus',
      'Equity package',
      'Unlimited PTO',
      'Work-life balance culture',
      'Professional development',
    ],
    postedDate: '5 days ago',
  },
  {
    id: '3',
    title: 'Full Stack Developer',
    company: 'StartupX',
    location: 'Remote',
    salary: '$90k - $130k',
    type: 'Full-time',
    tags: ['Node.js', 'PostgreSQL', 'AWS'],
    description:
      'Build scalable backend systems and modern frontends. You\'ll have the opportunity to work across the full stack and influence product direction.',
    requirements: [
      '3+ years of full stack development',
      'Proficiency in Node.js and JavaScript',
      'PostgreSQL or similar database experience',
      'AWS or cloud platform experience',
    ],
    benefits: [
      'Competitive compensation',
      'Remote first',
      'Health insurance',
      'Stock options',
      'Learning budget',
    ],
    postedDate: '1 week ago',
  },
  {
    id: '4',
    title: 'UX/UI Designer',
    company: 'DesignHub',
    location: 'Austin, TX',
    salary: '$85k - $120k',
    type: 'Full-time',
    tags: ['Figma', 'User Research', 'Web Design'],
    description:
      'Create beautiful and intuitive user experiences for our suite of products. Collaborate with product and engineering teams to bring designs to life.',
    requirements: [
      '4+ years of UX/UI design experience',
      'Proficiency in Figma or similar tools',
      'Strong portfolio demonstrating web design skills',
      'Experience with user research and testing',
    ],
    benefits: [
      'Creative work environment',
      'Flexible schedule',
      'Design tools and resources',
      'Team lunches and culture',
      'Career growth opportunities',
    ],
    postedDate: '3 days ago',
  },
  {
    id: '5',
    title: 'Data Scientist',
    company: 'DataCo',
    location: 'Boston, MA',
    salary: '$130k - $170k',
    type: 'Full-time',
    tags: ['Python', 'Machine Learning', 'Data Analysis'],
    description:
      'Work with large-scale datasets and build machine learning models that drive business impact. Join a team of talented data scientists and engineers.',
    requirements: [
      '3+ years of data science experience',
      'Strong Python and SQL skills',
      'Experience with machine learning frameworks',
      'Statistical analysis expertise',
    ],
    benefits: [
      'Competitive salary',
      'Stock options',
      'Training budget',
      'Collaborative team',
      'Cutting-edge tools',
    ],
    postedDate: '1 day ago',
  },
];

export default function Home() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedJob, setSelectedJob] = useState<(typeof mockJobs)[0] | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const filteredJobs = mockJobs.filter(
    (job) =>
      job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.location.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-accent/5 to-accent/10 border-b border-border">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4 text-balance">
            Find Your Next Opportunity
          </h1>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl">
            Browse thousands of job listings aggregated from top companies and startups. Find the role that matches your skills and ambitions.
          </p>

          {/* Search Bar */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search jobs, companies, locations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-lg border border-border bg-card text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
              />
            </div>
            <button className="px-6 py-3 bg-accent text-accent-foreground rounded-lg font-semibold hover:opacity-90 transition-opacity flex items-center justify-center gap-2">
              <Filter className="h-5 w-5" />
              <span>Filters</span>
            </button>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <div className="flex-1">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <div className="bg-card border border-border rounded-lg p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="h-10 w-10 bg-accent/10 rounded-lg flex items-center justify-center">
                  <Briefcase className="h-6 w-6 text-accent" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Jobs</p>
                  <p className="text-2xl font-bold text-foreground">{mockJobs.length}</p>
                </div>
              </div>
            </div>
            <div className="bg-card border border-border rounded-lg p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="h-10 w-10 bg-accent/10 rounded-lg flex items-center justify-center">
                  <MapPin className="h-6 w-6 text-accent" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Locations</p>
                  <p className="text-2xl font-bold text-foreground">8</p>
                </div>
              </div>
            </div>
            <div className="bg-card border border-border rounded-lg p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="h-10 w-10 bg-accent/10 rounded-lg flex items-center justify-center">
                  <Briefcase className="h-6 w-6 text-accent" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Companies</p>
                  <p className="text-2xl font-bold text-foreground">5</p>
                </div>
              </div>
            </div>
          </div>

          {/* Results Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-foreground">
              {filteredJobs.length} Jobs Found
            </h2>
          </div>

          {/* Job Listings */}
          {filteredJobs.length > 0 ? (
            <div className="grid grid-cols-1 gap-4">
              {filteredJobs.map((job) => (
                <JobCard
                  key={job.id}
                  job={job}
                  onJobSelect={() => {
                    setSelectedJob(job);
                    setIsModalOpen(true);
                  }}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground text-lg">
                No jobs found matching your search. Try adjusting your filters.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Job Details Modal */}
      {selectedJob && (
        <JobDetailsModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          job={selectedJob}
        />
      )}

      <Footer />
    </div>
  );
}
