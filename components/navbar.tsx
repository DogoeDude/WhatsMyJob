'use client';

import Link from 'next/link';
import { Menu, X, Search, Briefcase } from 'lucide-react';
import { useState } from 'react';

export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-40 border-b border-border bg-card shadow-sm">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent">
              <Briefcase className="h-6 w-6 text-accent-foreground" />
            </div>
            <span className="text-xl font-bold text-foreground">JobFlow</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            <Link
              href="/"
              className="text-foreground hover:text-accent transition-colors font-medium"
            >
              Jobs
            </Link>
            <Link
              href="/analytics"
              className="text-foreground hover:text-accent transition-colors font-medium"
            >
              Analytics
            </Link>
            <Link
              href="/admin"
              className="text-foreground hover:text-accent transition-colors font-medium"
            >
              Admin
            </Link>
          </div>

          {/* Right Section */}
          <div className="hidden md:flex items-center gap-4">
            <button className="p-2 hover:bg-muted rounded-lg transition-colors">
              <Search className="h-5 w-5 text-foreground" />
            </button>
            <button className="px-4 py-2 bg-accent text-accent-foreground rounded-lg font-medium hover:opacity-90 transition-opacity">
              Sign In
            </button>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden pb-4 space-y-3">
            <Link
              href="/"
              className="block text-foreground hover:text-accent py-2 font-medium"
            >
              Jobs
            </Link>
            <Link
              href="/analytics"
              className="block text-foreground hover:text-accent py-2 font-medium"
            >
              Analytics
            </Link>
            <Link
              href="/admin"
              className="block text-foreground hover:text-accent py-2 font-medium"
            >
              Admin
            </Link>
            <button className="w-full px-4 py-2 bg-accent text-accent-foreground rounded-lg font-medium hover:opacity-90 transition-opacity">
              Sign In
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}
