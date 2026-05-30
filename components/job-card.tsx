'use client';

import { MapPin, DollarSign, Briefcase, Heart } from 'lucide-react';
import { useState } from 'react';

interface JobCardProps {
  job: {
    id: string;
    title: string;
    company: string;
    location: string;
    salary: string;
    type: string;
    logo?: string;
    tags?: string[];
  };
  onJobSelect: () => void;
}

export function JobCard({ job, onJobSelect }: JobCardProps) {
  const [isSaved, setIsSaved] = useState(false);

  return (
    <div
      className="bg-card border border-border rounded-lg p-6 hover:shadow-md transition-all cursor-pointer hover:border-accent/50"
      onClick={onJobSelect}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-foreground mb-1">{job.title}</h3>
          <p className="text-sm text-muted-foreground">{job.company}</p>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsSaved(!isSaved);
          }}
          className="p-2 hover:bg-muted rounded-lg transition-colors"
        >
          <Heart
            className={`h-5 w-5 ${
              isSaved ? 'fill-red-500 text-red-500' : 'text-muted-foreground'
            }`}
          />
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <MapPin className="h-4 w-4 text-accent" />
          {job.location}
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <DollarSign className="h-4 w-4 text-accent" />
          {job.salary}
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Briefcase className="h-4 w-4 text-accent" />
          {job.type}
        </div>
      </div>

      {job.tags && job.tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {job.tags.map((tag, idx) => (
            <span
              key={idx}
              className="px-2 py-1 bg-accent/10 text-accent text-xs font-medium rounded"
            >
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
