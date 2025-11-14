import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Shield, Users, Package, BarChart3, Sun, Moon } from 'lucide-react';
import { apiUrl } from '../utils/api';

const fallbackHeader = 'A PYDAHSOFT product';
const fallbackSubheader = 'Stationery Management System';

const HomePage = () => {
  const [theme, setTheme] = useState(() => {
    if (typeof window === 'undefined') return 'dark';
    return localStorage.getItem('home-theme') || 'dark';
  });
  const [branding, setBranding] = useState({
    header: '',
    subheader: '',
  });

  useEffect(() => {
    localStorage.setItem('home-theme', theme);
  }, [theme]);

  useEffect(() => {
    let isMounted = true;
    const fetchBranding = async () => {
      try {
        const res = await fetch(apiUrl('/api/settings'));
        if (!res.ok) return;
        const data = await res.json();
        if (!isMounted) return;
        // Use appName/appSubheader for application branding, fallback to receipt fields for backward compatibility
        const header = typeof data.appName === 'string' && data.appName.trim() 
          ? data.appName.trim() 
          : (typeof data.receiptHeader === 'string' ? data.receiptHeader.trim() : '');
        const subheader = typeof data.appSubheader === 'string' && data.appSubheader.trim()
          ? data.appSubheader.trim()
          : (typeof data.receiptSubheader === 'string' ? data.receiptSubheader.trim() : '');
        setBranding({
          header,
          subheader,
        });
      } catch (error) {
        console.warn('Failed to load branding settings:', error);
      }
    };

    fetchBranding();
    return () => {
      isMounted = false;
    };
  }, []);

  const isDark = theme === 'dark';

  const backgroundClass = isDark
    ? 'bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950'
    : 'bg-gradient-to-br from-white via-slate-50 to-blue-50';

  const heroBadgeClass = isDark
    ? 'bg-blue-500/10 border border-blue-400/30 text-blue-200'
    : 'bg-blue-100/60 border border-blue-200 text-blue-800';

  const heroTitleClass = isDark ? 'text-white' : 'text-slate-900';
  const heroLeadClass = isDark ? 'text-slate-300/90' : 'text-slate-600';

  const ctaPrimaryClass = isDark
    ? 'text-white bg-gradient-to-r from-blue-600 to-indigo-600 shadow-lg shadow-blue-900/40 hover:shadow-blue-900/60 hover:from-blue-500 hover:to-indigo-500'
    : 'text-white bg-gradient-to-r from-blue-600 to-indigo-600 shadow-lg shadow-blue-300/60 hover:shadow-blue-400/70 hover:from-blue-500 hover:to-indigo-500';

  const ctaSecondaryClass = isDark
    ? 'text-blue-100 border border-white/10 hover:border-blue-400/40 hover:text-white'
    : 'text-blue-700 border border-blue-200 hover:border-blue-400 hover:bg-blue-50';

  const insightOverlayClass = isDark
    ? 'absolute inset-0 blur-3xl bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-cyan-500/25 rounded-3xl'
    : 'absolute inset-0 blur-3xl bg-gradient-to-r from-blue-200/60 via-purple-200/40 to-cyan-200/60 rounded-3xl';

  const insightCardClass = isDark
    ? 'relative bg-slate-900/60 border border-white/5 rounded-3xl p-6 h-full shadow-xl shadow-black/40'
    : 'relative bg-white border border-slate-200 rounded-3xl p-6 h-full shadow-xl shadow-blue-100/60';

  const featureContainerClass = isDark
    ? 'group relative overflow-hidden rounded-2xl border border-white/10 bg-slate-900/50 shadow-xl shadow-black/40 transition-all duration-200 hover:translate-y-[-6px]'
    : 'group relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-200/50 transition-all duration-200 hover:translate-y-[-6px]';

  const featureOverlay = (colorDark, colorLight) =>
    isDark
      ? `absolute inset-0 bg-gradient-to-br ${colorDark} opacity-0 group-hover:opacity-100 transition-opacity`
      : `absolute inset-0 bg-gradient-to-br ${colorLight} opacity-0 group-hover:opacity-100 transition-opacity`;

  const featureTitleClass = isDark ? 'text-white' : 'text-slate-900';
  const featureBodyClass = isDark ? 'text-sm text-slate-300 leading-relaxed' : 'text-sm text-slate-600 leading-relaxed';

  const statsSectionClass = isDark
    ? 'bg-slate-900/70 border border-white/10 rounded-3xl p-10 backdrop-blur-md shadow-2xl shadow-black/50'
    : 'bg-white border border-slate-200 rounded-3xl p-10 shadow-2xl shadow-slate-200/70';

  const statCardVariantsLight = {
    blue: 'bg-blue-50 border border-blue-100',
    purple: 'bg-purple-50 border border-purple-100',
    pink: 'bg-pink-50 border border-pink-100',
    cyan: 'bg-cyan-50 border border-cyan-100',
  };

  const statCardClass = (tone) =>
    `p-4 rounded-2xl ${
      isDark ? 'bg-white/5 border border-white/10' : statCardVariantsLight[tone] || statCardVariantsLight.blue
    }`;

  const statValueClass = isDark ? 'text-3xl font-semibold text-white' : 'text-3xl font-semibold text-slate-900';
  const statLabelClass = isDark ? 'text-xs uppercase tracking-wide text-slate-400 mt-2' : 'text-xs uppercase tracking-wide text-slate-500 mt-2';

  return (
    <div className={`min-h-screen ${backgroundClass} flex items-center justify-center px-4 py-12 transition-colors duration-300`}>
      <div className="w-full max-w-7xl">
        <div className="flex justify-end mb-6">
          <button
            onClick={() => setTheme(isDark ? 'light' : 'dark')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
              isDark
                ? 'bg-white/5 border border-white/10 text-blue-100 hover:bg-white/10'
                : 'bg-blue-50 border border-blue-100 text-blue-700 hover:bg-blue-100'
            }`}
            aria-label="Toggle theme"
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            {isDark ? 'Light mode' : 'Dark mode'}
          </button>
        </div>

        {/* Hero Section */}
        <div className="grid grid-cols-1 lg:grid-cols-[1.05fr_0.95fr] gap-10 items-center mb-16">
          <div>
            <div
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium mb-6 transition-colors duration-300 ${heroBadgeClass}`}
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
              </span>
              Stationery Management Reinvented
            </div>

            <h1
              className={`text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight mb-6 transition-colors duration-300 ${heroTitleClass}`}
            >
              <span className={isDark ? 'text-slate-200' : 'text-slate-800'}>
                {branding.header || fallbackHeader}
              </span>
              {(branding.subheader || fallbackSubheader) && (
                <span className="block text-3xl sm:text-4xl font-semibold bg-gradient-to-r from-blue-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent mt-2">
                  {branding.subheader || fallbackSubheader}
                </span>
              )}
            </h1>

            <p className={`text-lg max-w-2xl leading-relaxed mb-8 transition-colors duration-300 ${heroLeadClass}`}>
              Manage student allocations, inventory intake, and transaction flows with a single cohesive platform.
              Designed for modern institutions that expect fast insights, reliable uptime, and a premium experience for admins and staff alike.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                to="/login"
                className={`inline-flex items-center justify-center gap-3 px-7 py-3.5 rounded-xl text-base font-semibold transition-all duration-200 ${ctaPrimaryClass}`}
              >
                <Shield className="w-5 h-5" />
                Admin Portal Access
                <ArrowRight className="w-5 h-5" />
              </Link>
              <a
                href="#features"
                className={`inline-flex items-center justify-center gap-3 px-7 py-3.5 rounded-xl text-base font-semibold transition-all duration-200 ${ctaSecondaryClass}`}
              >
                Explore Feature Suite
              </a>
            </div>
          </div>

          <div className="relative">
            <div className={insightOverlayClass}></div>
            <div className={insightCardClass}>
              <div className="grid gap-6">
                <div className="p-6 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-700 text-white shadow-lg">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-sm text-blue-100 uppercase tracking-wide">Real-time overview</p>
                      <h3 className="text-2xl font-semibold">Dashboard Insights</h3>
                    </div>
                    <div className="h-12 w-12 rounded-xl bg-white/20 flex items-center justify-center">
                      <BarChart3 className="w-6 h-6" />
                    </div>
                  </div>
                  <p className="text-blue-100/90 text-sm leading-relaxed">
                    Unified KPIs for students, payments, stock valuation, and vendor partnerships. Built to mirror the analytics you see post-login — now previewed upfront.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-5 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-sm text-slate-200 shadow-lg shadow-black/30">
                    <p className="text-xs uppercase tracking-wide text-blue-800/80">Student Allocation</p>
                    <p className={`mt-3 text-xl font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>5000+</p>
                    <p className="text-xs text-slate-400 mt-2">Profiles managed with course & kit tracking</p>
                  </div>
                  <div className="p-5 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-sm text-slate-200 shadow-lg shadow-black/30">
                    <p className="text-xs uppercase tracking-wide text-purple-800/80">Transactions</p>
                    <p className={`mt-3 text-xl font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>₹2.4 Cr</p>
                    <p className="text-xs text-slate-400 mt-2">Recorded with precise audit trails</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-5 bg-gradient-to-br from-purple-500/20 via-purple-500/10 to-purple-500/20 border border-purple-400/20 rounded-2xl text-purple-100 shadow-lg">
                    <p className="text-xs uppercase tracking-wide">Inventory Snapshot</p>
                    <p className={`mt-3 text-xl font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>120+</p>
                    <p className={`text-xs mt-2 ${isDark ? 'text-purple-100/80' : 'text-purple-500'}`}>
                      Configured stationery items
                    </p>
                  </div>
                  <div className="p-5 bg-gradient-to-br from-cyan-500/20 via-blue-500/10 to-indigo-500/20 border border-cyan-400/20 rounded-2xl text-cyan-100 shadow-lg">
                    <p className="text-xs uppercase tracking-wide">Vendor Network</p>
                    <p className={`mt-3 text-xl font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>30+</p>
                    <p className={`text-xs mt-2 ${isDark ? 'text-cyan-100/80' : 'text-cyan-500'}`}>
                      Trusted suppliers integrated
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Feature Highlights */}
        <section id="features" className="mb-16">
          <div className="flex items-center justify-between mb-6">
            <h2 className={`text-2xl font-semibold transition-colors duration-300 ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Why teams rely on PYDAH
            </h2>
            <div className={`hidden sm:flex items-center gap-3 text-sm transition-colors duration-300 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              <span className={`h-px w-12 ${isDark ? 'bg-slate-700' : 'bg-slate-300'}`}></span>
              Tailored for academic stationery operations
              <span className={`h-px w-12 ${isDark ? 'bg-slate-700' : 'bg-slate-300'}`}></span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className={featureContainerClass}>
              <div className={featureOverlay('from-blue-500/10 to-transparent', 'from-blue-100/70 to-transparent')}></div>
              <div className="relative p-8">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white mb-5 shadow-lg shadow-blue-900/40">
                  <Users className="w-6 h-6" />
                </div>
                <h3 className={`text-xl font-semibold mb-3 transition-colors duration-300 ${featureTitleClass}`}>
                  Smart Student Allocation
                </h3>
                <p className={featureBodyClass}>
                  Course and year-wise kit mapping with automated due detection, integrated receipts, and real-time allocation tracking.
                </p>
              </div>
            </div>

            <div className={featureContainerClass}>
              <div className={featureOverlay('from-purple-500/10 to-transparent', 'from-purple-100/70 to-transparent')}></div>
              <div className="relative p-8">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white mb-5 shadow-lg shadow-purple-900/40">
                  <Package className="w-6 h-6" />
                </div>
                <h3 className={`text-xl font-semibold mb-3 transition-colors duration-300 ${featureTitleClass}`}>
                  Inventory Control & Alerts
                </h3>
                <p className={featureBodyClass}>
                  Unified view of stock, vendor purchases, and low-stock signals. Manage core items and kit components effortlessly.
                </p>
              </div>
            </div>

            <div className={featureContainerClass}>
              <div className={featureOverlay('from-green-500/10 to-transparent', 'from-green-100/70 to-transparent')}></div>
              <div className="relative p-8">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center text-white mb-5 shadow-lg shadow-emerald-900/40">
                  <BarChart3 className="w-6 h-6" />
                </div>
                <h3 className={`text-xl font-semibold mb-3 transition-colors duration-300 ${featureTitleClass}`}>
                  Insight-rich Analytics
                </h3>
                <p className={featureBodyClass}>
                  Mirror the dashboard experience with revenue trends, pending payments, and snapshot KPIs even before signing in.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Impact Stats */}
        <section className={statsSectionClass}>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div className={statCardClass('blue')}>
              <p className={statValueClass}>5000+</p>
              <p className={statLabelClass}>Students Managed</p>
            </div>
            <div className={statCardClass('purple')}>
              <p className={statValueClass}>50+</p>
              <p className={statLabelClass}>Programs Covered</p>
            </div>
            <div className={statCardClass('pink')}>
              <p className={statValueClass}>120+</p>
              <p className={statLabelClass}>Inventory SKUs</p>
            </div>
            <div className={statCardClass('cyan')}>
              <p className={statValueClass}>24/7</p>
              <p className={statLabelClass}>Reliable Uptime</p>
            </div>
          </div>
          <div className="mt-8 text-center">
            <p className="text-sm text-slate-400">
              Secure • Reliable • Insight-driven • Built for academic excellence
            </p>
          </div>
        </section>
      </div>
    </div>
  );
};

export default HomePage;