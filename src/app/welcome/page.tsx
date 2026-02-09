import Image from "next/image";
import Link from "next/link";
import { GlassCard, NeumorphicCard, NeumorphicCircle } from "@/components/ui/PremiumCards";


export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground animate-in fade-in duration-700 overflow-x-hidden">
      {/* Mobile-First Header: Optimized Height */}
      <header className="fixed top-0 w-full z-50 glass px-5 py-4 flex justify-between items-center border-b border-charcoal/5">
        <div className="flex items-center gap-3">
          <div className="relative w-10 h-10 overflow-hidden rounded-xl shadow-lg border-2 border-white p-1 bg-white">
            <Image
              src="/icon.png"
              alt="NeyborHuud Logo"
              fill
              className="object-cover"
            />
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-black tracking-tighter leading-none italic uppercase text-charcoal">
              NEYBOR<span className="text-primary">HUUD</span>
            </span>
            <span className="text-[8px] font-black tracking-[0.2em] text-charcoal/30 uppercase">
              Fortress OS
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/signup" className="group relative bg-white/10 text-white px-5 py-2.5 rounded-full text-[10px] font-black border border-white/20 hover:border-primary/50 hover:bg-primary/10 active:scale-95 transition-all uppercase tracking-widest overflow-hidden">
            <span className="relative z-10 flex items-center gap-2">
              <span className="material-symbols-outlined text-sm">rocket_launch</span>
              GET STARTED
            </span>
          </Link>
          <Link href="/login" className="group relative bg-primary text-surface-base-dark px-5 py-2.5 rounded-full text-[10px] font-black shadow-lg shadow-primary/30 hover:shadow-primary/50 hover:shadow-xl active:scale-95 transition-all uppercase tracking-widest overflow-hidden">
            <span className="relative z-10 flex items-center gap-2">
              <span className="material-symbols-outlined text-sm">lock_open</span>
              LOGIN
            </span>
            <span className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-500 skew-x-[-20deg]"></span>
          </Link>
        </div>
      </header>

      <main className="flex-grow pt-28 pb-32 px-5 max-w-md mx-auto w-full">
        {/* Mobile Hero: Compact & Architectural */}
        <section className="relative neumorphic rounded-[3rem] p-8 mb-12 overflow-hidden border border-white/40">
          <div className="relative z-10 flex flex-col gap-8">
            <div className="inline-flex items-center gap-2 glass px-4 py-2 rounded-full w-fit border border-white/50">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
              <span className="text-[9px] font-black uppercase tracking-[0.2em] text-charcoal/50">Zone 1 Secure</span>
            </div>

            <h1 className="text-5xl font-black leading-[0.9] tracking-tighter italic uppercase text-charcoal">
              OWN YOUR <br />
              <span className="text-primary">HUUD.</span> <br />
              <span className="text-3xl opacity-20">VIGILANCE.</span>
            </h1>

            <p className="text-charcoal/40 text-base leading-snug font-bold italic pr-4">
              Premium safety and local economics through a clean architectural interface.
            </p>

            <div className="flex flex-col gap-4 mt-2">
              <Link
                href="/login"
                className="bg-primary text-charcoal px-8 py-4 rounded-[2rem] font-black shadow-xl shadow-primary/20 active:scale-95 transition-all text-sm tracking-tight uppercase text-center"
              >
                AUTHENTICATE
              </Link>
              <Link
                href="/feed"
                className="glass text-charcoal px-8 py-4 rounded-[2rem] font-black text-sm border border-white/60 active:scale-95 transition-all uppercase text-center"
              >
                EXPLORE
              </Link>
            </div>
          </div>

          <div className="absolute top-[-20%] right-[-10%] w-64 h-64 bg-primary/10 rounded-full blur-3xl"></div>
        </section>

        {/* Features Preview: Mobile-Optimized Grid */}
        <div className="flex flex-col gap-10">
          <h2 className="text-3xl font-black italic uppercase tracking-tighter border-l-8 border-primary pl-5 text-charcoal">Global Core</h2>

          <div className="flex flex-col gap-8">
            {/* Sentinel Feature */}
            <NeumorphicCard className="flex flex-col gap-6 border border-white/40 p-8">
              <div className="w-16 h-16 rounded-2xl glass flex items-center justify-center text-primary shadow-inner">
                <i className="bi bi-shield-fill-check text-3xl"></i>
              </div>
              <div className="flex flex-col gap-2">
                <h3 className="text-xl font-black uppercase tracking-tight italic text-charcoal">Sentinel AI</h3>
                <p className="text-charcoal/40 text-xs font-bold leading-relaxed">
                  Military-grade threat detection monitoring your zone.
                </p>
              </div>
            </NeumorphicCard>

            {/* Pulse Metric */}
            <GlassCard className="flex flex-col gap-6 shadow-inner border-white/60 p-8" intensity="high">
              <div className="flex justify-between items-center">
                <span className="text-[9px] font-black uppercase tracking-widest text-charcoal/20">Sector Pulse</span>
                <div className="w-2 h-2 rounded-full bg-primary"></div>
              </div>
              <div className="flex items-end gap-2 text-charcoal">
                <span className="text-5xl font-black leading-none tracking-tighter">98<span className="text-xl ml-0.5">%</span></span>
                <span className="text-primary font-black text-[8px] uppercase mb-1 tracking-widest italic">OPTIMAL</span>
              </div>
              <div className="w-full h-3 neumorphic-inset rounded-full overflow-hidden p-0.5 mt-2">
                <div className="w-3/4 h-full bg-primary rounded-full"></div>
              </div>
            </GlassCard>

            {/* Hub Location */}
            <NeumorphicCard className="flex gap-6 items-center border border-white/40 p-8">
              <NeumorphicCircle className="w-16 h-16 text-primary flex-shrink-0">
                <i className="bi bi-geo-alt-fill text-2xl"></i>
              </NeumorphicCircle>
              <div>
                <p className="text-[9px] font-black uppercase tracking-widest opacity-20 mb-1">Hub Location</p>
                <h4 className="text-xl font-black uppercase italic tracking-tighter text-charcoal leading-none">SURULERE CORE</h4>
              </div>
            </NeumorphicCard>
          </div>
        </div>
      </main>

      {/* Mobile Bottom Nav: Native Ergonomics */}
      <nav className="fixed bottom-6 left-6 right-6 z-50">
        <div className="glass border border-white/60 p-3 flex justify-between items-center rounded-[2rem] shadow-2xl backdrop-blur-3xl px-8">
          <Link href="/feed" className="text-primary flex flex-col items-center">
            <i className="bi bi-grid-fill text-2xl"></i>
          </Link>

          {/* Center Call to Action */}
          <Link href="/gossip" className="w-14 h-14 rounded-full bg-brand-red flex items-center justify-center text-white shadow-xl -translate-y-6 border-[6px] border-background active:scale-90 transition-all">
            <i className="bi bi-megaphone-fill text-xl"></i>
          </Link>

          <Link href="/login" className="text-charcoal/20 flex flex-col items-center">
            <i className="bi bi-person-fill text-2xl"></i>
          </Link>
        </div>
      </nav>
    </div>
  );
}
