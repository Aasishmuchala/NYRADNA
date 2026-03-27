'use client';

import Link from 'next/link';

export default function Page() {
  return (
    <div className="bg-surface text-on-surface font-body overflow-x-hidden selection:bg-primary selection:text-on-primary">
      {/* Hero Section */}
      <section className="relative h-screen w-full flex flex-col justify-center items-center overflow-hidden">
        {/* Background Video Placeholder UI */}
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 hero-vignette z-10"></div>
          <img
            alt="Cinematic production background"
            className="w-full h-full object-cover opacity-40"
            data-alt="Cinematic wide shot of a high-end film production set at night with moody orange and blue lighting and anamorphic lens flares"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuDpSSEHe72-5nXMDt9yxMtWjO4eQmksHwYyy7nlqF6unSJrIYlOv8G-zXAlgK7x9I1N_zGdbO7J8myDAN2kgrQaVzwTrFFb2Orx2ES0CynJABdqcHjy4tC88-6nclqwaIAcdJYOwYPeLvNqtJC2ggOm5doZUuSNrpDifq_OYOZ3bjTPVDi97Wie5tKpBejUsODO3oI2quWbPe2xgoMEhXl-MBkAZ1Op7gVjD_njtwsC5fCYf7yOGaBAiNIDs8JSwLH5bTMbvS212Tc"
          />
        </div>

        {/* Hero Content (12-column Grid Alignment) */}
        <div className="relative z-20 max-w-7xl w-full px-6 grid grid-cols-12 gap-6 text-center md:text-left">
          <div className="col-span-12 lg:col-span-8 lg:col-start-3 text-center">
            {/* Branding Anchor */}
            <div className="mb-12 flex justify-center">
              <span className="text-2xl font-black tracking-tighter text-primary font-headline">DIRECTOR</span>
            </div>

            <h1 className="text-5xl md:text-7xl lg:text-8xl font-black font-headline tracking-tighter leading-[0.9] mb-8">
              Direct your brand film with AI.
            </h1>

            {/* Split View Visual Concept (Intent to Clip) */}
            <div className="relative max-w-2xl mx-auto mb-12 p-1 bg-surface-container-low rounded-xl shadow-[0_20px_40px_rgba(0,0,0,0.6)] group">
              <div className="aspect-video rounded-lg overflow-hidden relative">
                <img
                  alt="AI Video Demo"
                  className="w-full h-full object-cover"
                  data-alt="High-end fashion commercial scene showing a model in minimalist desert landscape with hyper-realistic textures and cinematic motion blur"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuCiVQaydChmf5TVaGxYPMsedO6oqW6gXEWT6vgB4hrlNgaU5bdFyRgNz6_uzJpcbzmGrWGdwnpLb26Auu14asthvMBSrpr0CtySyGFIGSfBSP_p0hSfcRVm84m6OjudpxhHLNIv_iLMw3yJzq56zWXVw0vJA25_oyeqjTdY9P-z-oFbP8MI0kc6MBUs1h2r8dSET9ssFZ64Uk-gDbNpxJGA59DAnPv5kyNj46XjE0XzK9dP6Qdp2coIXWmrRpqURYcYKwA-Y6qu9XE"
                />
                <div className="absolute bottom-6 left-6 right-6 bg-surface-container-highest/90 backdrop-blur-md p-4 rounded-lg border border-outline-variant/15 flex items-center gap-4">
                  <span className="material-symbols-outlined text-primary" data-icon="auto_awesome">auto_awesome</span>
                  <p className="text-sm font-medium tracking-tight text-on-surface-variant italic">
                    &quot;A luxury watch rising through liquid obsidian, dramatic side lighting...&quot;
                  </p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row justify-center gap-6">
              <Link
                href="/create/intent"
                className="group relative px-10 py-5 bg-gradient-to-br from-primary to-primary-container text-on-primary font-bold rounded-lg overflow-hidden transition-all duration-300 hover:scale-105 active:scale-95 flex items-center justify-center gap-2"
              >
                <span>Start for free</span>
                <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform" data-icon="arrow_forward">arrow_forward</span>
              </Link>
              <Link
                href="/dashboard"
                className="px-10 py-5 bg-surface-container-highest text-on-surface font-bold rounded-lg transition-all duration-300 hover:bg-surface-bright active:scale-95 flex items-center justify-center"
              >
                Sign in
              </Link>
            </div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 text-on-surface-variant flex flex-col items-center gap-2 opacity-50">
          <span className="text-[0.6rem] uppercase tracking-[0.3em] font-bold">Showcase</span>
          <div className="w-[1px] h-12 bg-gradient-to-b from-primary to-transparent"></div>
        </div>
      </section>

      {/* Trust Signals Section */}
      <section className="py-32 px-6 bg-surface-container-low">
        <div className="max-w-7xl mx-auto">
          <div className="mb-20 text-center">
            <h2 className="font-headline text-3xl font-bold tracking-tight mb-4">Trusted by Indian D2C Disruptors</h2>
            <div className="h-1 w-20 bg-primary mx-auto rounded-full"></div>
          </div>

          {/* Asymmetric Bento-style Trust Grid */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
            {/* Case Study 1 */}
            <div className="md:col-span-7 group cursor-pointer">
              <div className="relative aspect-[16/9] rounded-xl overflow-hidden mb-6">
                <img
                  alt="Sample D2C Film 1"
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  data-alt="Modern organic skincare product on a volcanic rock base with natural morning sunlight and soft shadows from palm leaves"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuDcvPClk03faenJuFFHWnfrjioEUk21OVnCcAoI32CVNrYUUNI7aieefkBWCQN0uFERGbZrlizqVjniwZCzQvmlqG5B8u8wEEdf6_SjCwrPvlCgY8fGUDtwNu_WORnM-yADwUxaah5i0Vy_jvogmfac8DEa7lqheRARTSkOnodMBtkEBlxolYAfNNIeTHE_KYjpRSrN4V9pjcYP8DJlrUuTasn2rv9LYMX9HUgz8lFM-yqSrIDGDntpQOs3KIgRCKhNh0feMpAdfB0"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-surface-container-lowest/80 to-transparent"></div>
                <div className="absolute bottom-6 left-6">
                  <span className="text-xs font-bold uppercase tracking-widest text-primary mb-2 block">Premium Wellness</span>
                  <h3 className="text-xl font-bold font-headline">The Earth Collective</h3>
                </div>
                <div className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-xl flex items-center justify-center">
                    <span className="material-symbols-outlined" data-icon="play_arrow">play_arrow</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Case Study 2 */}
            <div className="md:col-span-5 group cursor-pointer pt-0 md:pt-12">
              <div className="relative aspect-square rounded-xl overflow-hidden mb-6">
                <img
                  alt="Sample D2C Film 2"
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  data-alt="Close-up of premium headphones with metallic textures and studio lighting against a dark charcoal background"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuDhogYu4bTNj_LLVsC08x6vb4jfYL8UuMgUMKTErowVUczdqpv4rbNRXFgtUxvTIYLfnTclm2VQlC2-DDVgDaBfkbEQBT13YlBiGdjeR66A1ppRTfWR70oCpjtj5bNRFCrbtW2UeqboB02mP5aiU0wF3CesBIiB6nrF0hbPzQ9_PCwc9rHdGw1N31LT4EvWOKmGKFhgGjeDYG_HTl89Li8ffJUdRYY_ctrg9NgBavnmnAR4_LehpvxC9wirKlb8SI3C9_VmaRpLmkA"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-surface-container-lowest/80 to-transparent"></div>
                <div className="absolute bottom-6 left-6">
                  <span className="text-xs font-bold uppercase tracking-widest text-tertiary mb-2 block">Tech Lifestyle</span>
                  <h3 className="text-xl font-bold font-headline">Sonic Audio</h3>
                </div>
              </div>
            </div>

            {/* Case Study 3 */}
            <div className="md:col-span-4 group cursor-pointer">
              <div className="relative aspect-square rounded-xl overflow-hidden mb-6">
                <img
                  alt="Sample D2C Film 3"
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  data-alt="Professional sports shoe levitating in a neon-lit urban environment at night with blurred city lights in background"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuBxHsXZKQaTcJlZZPbk7kLybCPXlJdfFcYcYr5z4stRVdFPl1Yk7KeSKOg8sE35tbM-BpTKn7rPx5Jw_KoXpFCYqWXTrWq2SUArl7RxsqtLfs8oRG4tcxUFel-u0VWcRQdfnM8FbGa6okyauCOEeGP2jNnsbX-6aN880apVZ5qRL1wvIcz121D2cB6MDKasPKlYzLYkCZ9uBxjBu0SLN-YEdI68E8NSxjnub2J1uhwYHOjV5j9NsvIAu-6lon7v8DRs9d6RHOjbx3Y"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-surface-container-lowest/80 to-transparent"></div>
                <div className="absolute bottom-6 left-6">
                  <span className="text-xs font-bold uppercase tracking-widest text-primary mb-2 block">Performance Wear</span>
                  <h3 className="text-xl font-bold font-headline">Velocity Sports</h3>
                </div>
              </div>
            </div>

            {/* Call to Action Module */}
            <div className="md:col-span-8 flex flex-col justify-center items-center md:items-start p-12 bg-surface-container-highest rounded-xl border border-outline-variant/15">
              <h3 className="font-headline text-4xl font-black tracking-tight mb-4">Ready to produce?</h3>
              <p className="text-on-surface-variant text-lg max-w-md mb-8">Join the next generation of creative directors. Turn your intent into a cinematic reality in seconds.</p>
              <Link
                href="/create/intent"
                className="px-8 py-4 bg-primary text-on-primary font-bold rounded-lg transition-transform hover:scale-105 active:scale-95"
              >
                Claim Your First Render
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="w-full py-12 px-8 border-t border-[#494847]/15 bg-[#0e0e0e]">
        <div className="flex flex-col md:flex-row justify-between items-center max-w-7xl mx-auto gap-8">
          <div className="text-[#adaaaa] font-label text-xs uppercase tracking-widest">
            © 2024 DIRECTOR AI. All rights reserved.
          </div>
          <nav className="flex flex-wrap justify-center gap-8">
            <a className="text-[#adaaaa] hover:text-[#ff9064] transition-colors font-label text-xs uppercase tracking-widest opacity-80 hover:opacity-100" href="/terms">Terms of Service</a>
            <a className="text-[#adaaaa] hover:text-[#ff9064] transition-colors font-label text-xs uppercase tracking-widest opacity-80 hover:opacity-100" href="/privacy">Privacy Policy</a>
            <a className="text-[#adaaaa] hover:text-[#ff9064] transition-colors font-label text-xs uppercase tracking-widest opacity-80 hover:opacity-100" href="https://twitter.com" target="_blank" rel="noopener noreferrer">Twitter</a>
            <a className="text-[#adaaaa] hover:text-[#ff9064] transition-colors font-label text-xs uppercase tracking-widest opacity-80 hover:opacity-100" href="https://discord.com" target="_blank" rel="noopener noreferrer">Discord</a>
          </nav>
        </div>
      </footer>
    </div>
  );
}
