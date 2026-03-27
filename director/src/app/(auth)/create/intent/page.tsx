'use client';

import Link from 'next/link';

export default function IntentPage() {
  return (
    <div className="bg-surface text-on-surface flex flex-col min-h-screen selection:bg-primary/30">
      {/* TopNavBar */}
      <header className="bg-[#0e0e0e]/70 backdrop-blur-xl top-0 z-50 flex justify-between items-center w-full px-6 py-4 fixed">
        <div className="flex items-center gap-4">
          <span className="text-2xl font-black tracking-tighter text-[#ff9064] font-headline">DIRECTOR</span>
        </div>
        <div className="hidden md:flex items-center space-x-8">
          <nav className="flex gap-6">
            <a className="text-[#adaaaa] hover:text-white transition-colors font-body text-sm font-medium" href="#">Dashboard</a>
            <a className="text-[#ff9064] font-bold border-b-2 border-[#ff9064] pb-1 font-body text-sm" href="#">Projects</a>
            <a className="text-[#adaaaa] hover:text-white transition-colors font-body text-sm font-medium" href="#">Characters</a>
            <a className="text-[#adaaaa] hover:text-white transition-colors font-body text-sm font-medium" href="#">Settings</a>
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <button className="material-symbols-outlined text-on-surface-variant hover:text-primary transition-all duration-300 ease-in-out p-2 hover:bg-[#262626] rounded-full" data-icon="notifications">notifications</button>
          <button className="material-symbols-outlined text-on-surface-variant hover:text-primary transition-all duration-300 ease-in-out p-2 hover:bg-[#262626] rounded-full" data-icon="help">help</button>
          <div className="w-8 h-8 rounded-full overflow-hidden bg-surface-container-highest">
            <img alt="User profile avatar" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDWj2S442AuxlGkRkn666VnifHSdo-CVdAhcVix50WCchIuAfJced7Q6hOns3YufCohmbUEmbCRDxywYkrE-tL6uxhMojgM5UhUCX9noEXJ4bdDX0m_n0sqRa9AZeeo671XBezhiX2G5A7msHxQcZnWeNhjDJzgZM1sJ9enpiXVWs3f_jRgGDzQiN36AD9jHnHlUG3hD-j8k4HARZZE_XWI4yhAm3dK12vhbmi8D3Iz2Bjj9t8b3GUITUsAKYF5t7AJ1o19nFuKNTY" className="w-full h-full object-cover" />
          </div>
        </div>
      </header>

      {/* Main Content: Intent Input */}
      <main className="flex-grow flex flex-col items-center justify-center px-6 relative overflow-hidden pt-20">
        {/* Background Vignette/Ambient Light */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[120px] pointer-events-none"></div>

        <div className="w-full max-w-3xl z-10 space-y-12">
          {/* Header Section */}
          <div className="space-y-4 text-center">
            <span className="text-primary font-headline font-bold text-xs uppercase tracking-[0.2em]">Step 01: Concept</span>
            <h1 className="font-headline font-extrabold text-4xl md:text-5xl tracking-tight text-white leading-tight">
              What&apos;s the <span className="text-gradient-primary">Vision?</span>
            </h1>
          </div>

          {/* Input Area */}
          <div className="group relative">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/20 to-tertiary/20 rounded-xl blur opacity-30 group-focus-within:opacity-100 transition duration-500"></div>
            <div className="relative surface-container-lowest glass-input rounded-xl overflow-hidden border border-outline-variant/15">
              <textarea className="w-full h-48 md:h-64 bg-transparent border-none focus:ring-0 text-on-surface placeholder:text-on-surface-variant/40 font-body text-lg md:text-xl p-8 resize-none leading-relaxed" placeholder="Describe the film you want to make. Don't worry about how — just say what."></textarea>
              {/* Character count or AI Indicator */}
              <div className="absolute bottom-4 right-6 flex items-center gap-2">
                <span className="material-symbols-outlined text-tertiary text-sm" data-icon="auto_awesome" style={{fontVariationSettings: "'FILL' 1"}}>auto_awesome</span>
                <span className="text-on-surface-variant font-label text-[10px] uppercase tracking-widest">AI Intelligence Active</span>
              </div>
            </div>
          </div>

          {/* Example Chips */}
          <div className="flex flex-col items-center space-y-6">
            <div className="flex flex-wrap justify-center gap-3">
              <button className="bg-surface-container-highest text-on-surface-variant hover:text-white hover:bg-surface-bright px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-300 ease-in-out border border-outline-variant/10">
                &quot;A 60-second Instagram ad for my activewear brand...&quot;
              </button>
              <button className="bg-surface-container-highest text-on-surface-variant hover:text-white hover:bg-surface-bright px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-300 ease-in-out border border-outline-variant/10">
                &quot;A product walkthrough...&quot;
              </button>
              <button className="bg-surface-container-highest text-on-surface-variant hover:text-white hover:bg-surface-bright px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-300 ease-in-out border border-outline-variant/10">
                &quot;A real estate walkthrough...&quot;
              </button>
            </div>

            {/* CTA */}
            <Link href="/create/brief" className="group mt-8 flex items-center gap-3 bg-gradient-to-br from-primary to-primary-container text-on-primary-fixed font-headline font-bold px-10 py-4 rounded-xl shadow-[0_10px_30px_rgba(255,144,100,0.2)] hover:shadow-[0_15px_40px_rgba(255,144,100,0.3)] transition-all duration-300 hover:scale-[1.02] active:scale-95">
              <span>Continue</span>
              <span className="material-symbols-outlined transition-transform group-hover:translate-x-1" data-icon="arrow_forward">arrow_forward</span>
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full py-12 px-8 border-t border-[#494847]/15 bg-[#0e0e0e] z-10">
        <div className="flex flex-col md:flex-row justify-between items-center max-w-7xl mx-auto gap-8">
          <div className="text-[#adaaaa] font-body text-xs uppercase tracking-widest">
            &copy; 2024 DIRECTOR AI. All rights reserved.
          </div>
          <nav className="flex gap-8">
            <a className="text-[#adaaaa] hover:text-[#ff9064] transition-colors font-body text-xs uppercase tracking-widest opacity-80 hover:opacity-100" href="#">Terms of Service</a>
            <a className="text-[#adaaaa] hover:text-[#ff9064] transition-colors font-body text-xs uppercase tracking-widest opacity-80 hover:opacity-100" href="#">Privacy Policy</a>
            <a className="text-[#adaaaa] hover:text-[#ff9064] transition-colors font-body text-xs uppercase tracking-widest opacity-80 hover:opacity-100" href="#">Twitter</a>
            <a className="text-[#adaaaa] hover:text-[#ff9064] transition-colors font-body text-xs uppercase tracking-widest opacity-80 hover:opacity-100" href="#">Discord</a>
          </nav>
        </div>
      </footer>
    </div>
  );
}
