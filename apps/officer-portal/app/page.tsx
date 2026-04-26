'use client';

import * as React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  CpuIcon,
  SearchIcon,
  FileTextIcon,
  ChevronRightIcon,
  CheckIcon,
  ShieldCheckIcon,
  ClockIcon,
  UsersIcon,
  ArrowRight,
  Sparkles,
  Activity,
  Plug,
} from 'lucide-react';
import { Button } from '@workspace/ui/components/button';
import { Navbar1 } from '~/components/navbar1';
import { SketchUnderline } from '~/components/ui/sketch-underline';
import { AppLogo } from '~/components/ui/app-logo';
import { SketchArrowDown } from '~/components/ui/sketch-arrow';
import { GradientBlurBg } from '~/components/ui/gradient-blur-bg';

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 160, damping: 22 } },
};

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.09 } },
};

const navMenu = [
  {
    title: 'Features',
    url: '#features',
    icon: <CpuIcon className="size-3" />,
    items: [
      {
        title: 'Automated extraction',
        description: 'Gemini-Flash powered criteria mapping from tender documents.',
        icon: <CpuIcon className="size-4" />,
        url: '#features',
      },
      {
        title: 'Multi-engine OCR',
        description: 'Azure and PaddleOCR for scanned and hand-signed documents.',
        icon: <FileTextIcon className="size-4" />,
        url: '#features',
      },
    ],
  },
  { title: 'Security', url: '#workflow', icon: <ShieldCheckIcon className="size-3" /> },
  { title: 'How it works', url: '#workflow', icon: <SearchIcon className="size-3" /> },
];

const heroWords = ['CONSISTENT', 'AUDITABLE', 'PROCUREMENT'];

const heroLabels = [
  { icon: Sparkles, label: 'AI Criteria Extraction' },
  { icon: Plug,     label: 'Hybrid Retrieval' },
  { icon: Activity, label: 'Officer Review Queue' },
];

export default function Page(): React.JSX.Element {
  return (
    <main className="min-h-screen bg-background overflow-x-hidden">
      <Navbar1
        menu={navMenu}
        auth={{
          login: { text: 'Sign in', url: '/auth/sign-in' },
          signup: { text: 'Get started', url: '/auth/sign-in' },
        }}
      />

      {/* ── Hero ── */}
      <section className="relative min-h-[calc(100svh-64px)] flex items-center justify-center px-6 py-10 overflow-hidden">
        {/* Gradient blur background with purple corner glows */}
        <GradientBlurBg variant="both" />
        {/* Fade edges into background */}
        <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-transparent to-background pointer-events-none z-[1]" aria-hidden="true" />

        <div className="relative z-10 flex flex-col items-center text-center max-w-5xl mx-auto w-full">

          {/* Logo */}
          <motion.div
            initial={{ filter: 'blur(8px)', opacity: 0, y: -16 }}
            animate={{ filter: 'blur(0px)', opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-10"
          >
            <AppLogo size={96} />
          </motion.div>

          {/* Animated title words */}
          <motion.h1
            initial={{ filter: 'blur(10px)', opacity: 0, y: 50 }}
            animate={{ filter: 'blur(0px)', opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="font-sans text-2xl font-bold tracking-tight sm:text-3xl md:text-4xl max-w-4xl leading-tight"
          >
            {heroWords.map((word, i) => (
              <motion.span
                key={word}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.12, duration: 0.5 }}
                className="inline-block mx-2 md:mx-3"
              >
                {word}
              </motion.span>
            ))}
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.6 }}
            className="mx-auto mt-8 max-w-2xl text-lg text-muted-foreground leading-relaxed"
          >
            AI extracts criteria, maps bidder submissions, and flags ambiguous cases for officer review.
            Consistent. Auditable. Fast.
          </motion.p>

          {/* Feature labels */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2, duration: 0.6 }}
            className="mt-10 flex flex-wrap justify-center gap-6"
          >
            {heroLabels.map((item, i) => (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.2 + i * 0.15, duration: 0.5, type: 'spring', stiffness: 100, damping: 10 }}
                className="flex items-center gap-2 px-4 py-2 rounded-full border border-border bg-background/60 backdrop-blur-sm"
              >
                <item.icon className="size-4 text-primary shrink-0" />
                <span className="text-sm font-medium">{item.label}</span>
              </motion.div>
            ))}
          </motion.div>

          {/* CTA buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.7, duration: 0.6, type: 'spring', stiffness: 100, damping: 10 }}
            className="mt-12 flex flex-col sm:flex-row items-center gap-4"
          >
            <Button asChild size="lg" className="gap-2 px-8 rounded-none font-accent text-base">
              <Link href="/auth/sign-in">
                GET STARTED <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="rounded-none font-accent text-base">
              <Link href="#features">SEE HOW IT WORKS</Link>
            </Button>
          </motion.div>

          {/* Trust strip */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2.0, duration: 0.6 }}
            className="mt-10 flex flex-wrap justify-center gap-x-8 gap-y-2"
          >
            {['Immutable audit log', 'Officer review queue', 'Hash chain verified'].map((item) => (
              <span key={item} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <CheckIcon className="size-3 text-success shrink-0" aria-hidden="true" />
                {item}
              </span>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── Stats strip ── */}
      <section className="border-y border-border bg-muted/20 py-10 px-6">
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          variants={stagger}
          className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center"
        >
          {[
            { value: '~30s', label: 'Criteria extraction', icon: <ClockIcon className="size-4" /> },
            { value: '99%', label: 'OCR accuracy', icon: <FileTextIcon className="size-4" /> },
            { value: '100%', label: 'Audit coverage', icon: <ShieldCheckIcon className="size-4" /> },
            { value: 'Zero', label: 'Auto-fail on missing docs', icon: <UsersIcon className="size-4" /> },
          ].map((stat) => (
            <motion.div key={stat.label} variants={fadeUp} className="space-y-1">
              <div className="flex items-center justify-center gap-1.5 text-muted-foreground mb-2">
                {stat.icon}
              </div>
              <div className="font-accent text-3xl font-bold text-foreground">{stat.value}</div>
              <div className="text-xs text-muted-foreground">{stat.label}</div>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* ── Features ── */}
      <section id="features" className="py-24 px-6 relative overflow-hidden">
        {/* Grid + radial glow background */}
        <div
          className="absolute inset-0 z-0"
          style={{
            background: 'hsl(var(--background))',
            backgroundImage: `
              linear-gradient(to right, rgba(71,85,105,0.15) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(71,85,105,0.15) 1px, transparent 1px),
              radial-gradient(circle at 50% 50%, oklch(0.72 0.14 80 / 0.18) 0%, oklch(0.72 0.14 80 / 0.07) 40%, transparent 75%)
            `,
            backgroundSize: '32px 32px, 32px 32px, 100% 100%',
          }}
          aria-hidden="true"
        />
        <div className="max-w-5xl mx-auto relative z-10">
          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: '-80px' }}
            variants={stagger}
            className="mb-14"
          >
            <motion.p variants={fadeUp} className="font-accent text-base text-muted-foreground mb-2">
              — what it does —
            </motion.p>
            <motion.h2 variants={fadeUp} className="text-3xl font-bold tracking-tight mb-3">
              Built for procurement officers
            </motion.h2>
            <motion.p variants={fadeUp} className="text-muted-foreground max-w-lg">
              TenderEval automates the most time-consuming parts of tender evaluation — so officers can focus on decisions, not paperwork.
            </motion.p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: '-60px' }}
            variants={stagger}
            className="grid gap-px bg-border border border-border rounded-xl overflow-hidden md:grid-cols-3"
          >
            <FeatureItem
              icon={<CpuIcon className="size-5" />}
              number="01"
              title="Automated criteria extraction"
              description="Powered by Google Gemini, the system parses tender documents to identify financial, technical, and compliance requirements."
              note="reads the docs for you"
            />
            <FeatureItem
              icon={<FileTextIcon className="size-5" />}
              number="02"
              title="Multi-engine OCR"
              description="Azure Document Intelligence and PaddleOCR handle scanned PDFs, hand-signed certificates, and official stamps."
              note="even messy scans"
            />
            <FeatureItem
              icon={<SearchIcon className="size-5" />}
              number="03"
              title="Hybrid retrieval"
              description="Combines dense vector search with BM25 keyword matching to accurately map bidder submissions to evaluation criteria."
              note="finds the evidence"
            />
          </motion.div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section id="workflow" className="py-24 px-6 border-t border-border bg-muted/20">
        <div className="max-w-5xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-start">
            <motion.div
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: '-80px' }}
              variants={stagger}
              className="space-y-6 lg:sticky lg:top-24"
            >
              <motion.p variants={fadeUp} className="font-accent text-base text-muted-foreground">
                — the process —
              </motion.p>
              <motion.h2 variants={fadeUp} className="text-3xl font-bold tracking-tight leading-tight">
                From raw documents to{' '}
                <SketchUnderline color="oklch(0.72 0.14 80)">
                  evaluation results
                </SketchUnderline>
              </motion.h2>
              <motion.p variants={fadeUp} className="text-muted-foreground leading-relaxed">
                Missing evidence never triggers an automatic failure. Ambiguous cases are routed to officers for review — keeping humans in control of every decision.
              </motion.p>
              <motion.div variants={fadeUp}>
                <Button asChild className="gap-2">
                  <Link href="/auth/sign-in">
                    Sign in to get started
                    <ChevronRightIcon className="size-4" aria-hidden="true" />
                  </Link>
                </Button>
              </motion.div>
            </motion.div>

            <motion.div
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: '-60px' }}
              variants={stagger}
            >
              {[
                { n: '01', title: 'Upload documents', desc: 'Securely upload scanned PDFs and hand-signed tender documents.', note: 'drag & drop works' },
                { n: '02', title: 'Extract criteria', desc: 'AI identifies mandatory criteria and threshold specifications.', note: '~30 seconds' },
                { n: '03', title: 'Match submissions', desc: 'Bidder submissions are mapped to each criterion using hybrid retrieval.', note: 'fully automated' },
                { n: '04', title: 'Review results', desc: 'Automated pass/fail with a review queue for ambiguous cases.', note: 'you stay in control' },
              ].map((step, i, arr) => (
                <React.Fragment key={step.n}>
                  <motion.div
                    variants={{
                      hidden: { opacity: 0, x: 20 },
                      show: { opacity: 1, x: 0, transition: { type: 'spring' as const, stiffness: 160, damping: 22 } },
                    }}
                    className="relative flex gap-4 p-5 rounded-xl border border-border bg-card hover:shadow-sm transition-shadow"
                  >
                    <div className="font-accent text-3xl text-muted-foreground/20 tabular-nums shrink-0 leading-none pt-1">
                      {step.n}
                    </div>
                    <div className="space-y-1 flex-1">
                      <h4 className="text-sm font-semibold">{step.title}</h4>
                      <p className="text-sm text-muted-foreground leading-relaxed">{step.desc}</p>
                    </div>
                    {/* Sticky-note annotation */}
                    <span className="absolute -top-2.5 right-4 font-accent text-xs text-muted-foreground/50 bg-background px-1.5 py-0.5 border border-dashed border-border rounded-sm">
                      {step.note}
                    </span>
                  </motion.div>
                  {i < arr.length - 1 && <SketchArrowDown />}
                </React.Fragment>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-24 px-6 border-t border-border text-center">
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-80px' }}
          variants={stagger}
          className="max-w-xl mx-auto space-y-6"
        >
          <motion.div variants={fadeUp} className="flex justify-center">
            <AppLogo size={64} />
          </motion.div>
          <motion.h2 variants={fadeUp} className="text-3xl font-bold tracking-tight">
            Consistent, auditable{' '}
            <SketchUnderline color="oklch(0.72 0.14 80)">tender evaluation</SketchUnderline>
          </motion.h2>
          <motion.p variants={fadeUp} className="text-muted-foreground">
            Standardized evaluation for procurement teams that need accuracy and accountability.
          </motion.p>
          <motion.div variants={fadeUp} className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Button asChild size="lg" className="px-10">
              <Link href="/auth/sign-in">Sign in to the portal</Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="#features">Learn more</Link>
            </Button>
          </motion.div>
        </motion.div>
      </section>

      {/* ── Footer ── */}
      <footer className="py-8 px-6 border-t border-border bg-muted/20">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <AppLogo size={28} showName nameClassName="text-sm text-muted-foreground" />
          <div className="flex gap-6 text-xs text-muted-foreground">
            <a href="#" className="hover:text-foreground transition-colors">Security</a>
            <a href="#" className="hover:text-foreground transition-colors">Privacy</a>
            <a href="#" className="hover:text-foreground transition-colors">Terms</a>
          </div>
        </div>
      </footer>
    </main>
  );
}

// ── Feature item ──
function FeatureItem({
  icon, number, title, description, note,
}: {
  icon: React.ReactNode;
  number: string;
  title: string;
  description: string;
  note: string;
}) {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 16 },
        show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 160, damping: 22 } },
      }}
      className="bg-background p-7 space-y-4 hover:bg-muted/30 transition-colors relative group"
    >
      {/* Ghost number */}
      <div className="font-accent text-5xl text-muted-foreground/8 absolute top-4 right-5 select-none group-hover:text-muted-foreground/15 transition-colors">
        {number}
      </div>
      <div className="size-10 rounded-lg bg-muted flex items-center justify-center border border-border">
        {icon}
      </div>
      <h3 className="text-sm font-semibold pr-8">{title}</h3>
      <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
      {/* Sketch note */}
      <div className="flex items-center gap-1.5 pt-1">
        <svg width="14" height="10" viewBox="0 0 14 10" fill="none" aria-hidden="true">
          <path d="M1 5 C4 3, 9 7, 12 4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" className="text-muted-foreground/30" />
          <path d="M10 2 L12 4 L10 7" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground/30" />
        </svg>
        <span className="font-accent text-xs text-muted-foreground/40">{note}</span>
      </div>
    </motion.div>
  );
}

