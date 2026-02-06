import Link from 'next/link';

export default function JoinUsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 text-white">
      <div className="container mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto rounded-3xl border border-white/10 bg-white/5 p-10 shadow-[0_30px_80px_rgba(0,0,0,0.35)]">
          <div className="flex flex-col gap-6">
            <span className="uppercase tracking-[0.3em] text-xs text-white/60">Join Us</span>
            <h1 className="text-4xl sm:text-5xl font-semibold">
              Your unified access to AI CMS starts here.
            </h1>
            <p className="text-lg text-white/70">
              Create an account or sign in to manage content, review drafts, and unlock enterprise-grade workflows.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/auth?mode=signup"
                className="inline-flex items-center justify-center rounded-lg bg-white text-slate-900 px-6 py-3 text-sm font-semibold shadow-md transition hover:-translate-y-0.5"
              >
                Create account
              </Link>
              <Link
                href="/auth?mode=login"
                className="inline-flex items-center justify-center rounded-lg border border-white/30 px-6 py-3 text-sm font-semibold text-white/90 transition hover:bg-white/10"
              >
                Sign in
              </Link>
            </div>
            <div className="grid gap-4 sm:grid-cols-3 text-sm text-white/70">
              <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                <p className="font-semibold text-white">Unified access</p>
                <p className="mt-1">One hub for admins, editors, and subscribers.</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                <p className="font-semibold text-white">Secure by design</p>
                <p className="mt-1">Enterprise password rules and session controls.</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                <p className="font-semibold text-white">Instant routing</p>
                <p className="mt-1">Admins go to the dashboard, users to the homepage.</p>
              </div>
            </div>
            <p className="text-xs text-white/50">
              Already verified? You can jump straight into the unified auth hub any time.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
