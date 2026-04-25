"use client";
 
import { SunIcon as Sunburst, ShieldCheckIcon } from "lucide-react";
import { useState } from "react";
import { cn } from "../../lib/utils";

export const FullScreenSignup = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [submitted, setSubmitted] = useState(false);
 
  const validateEmail = (value: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  };
 
  const validatePassword = (value: string) => {
    return value.length >= 8;
  };
 
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    let valid = true;
 
    if (!validateEmail(email)) {
      setEmailError("Please enter a valid email address.");
      valid = false;
    } else {
      setEmailError("");
    }
 
    if (!validatePassword(password)) {
      setPasswordError("Password must be at least 8 characters.");
      valid = false;
    } else {
      setPasswordError("");
    }
 
    setSubmitted(true);
 
    if (valid) {
      console.log("Form submitted!");
      console.log("Email:", email);
      alert("Form submitted!");
      setEmail("");
      setPassword("");
      setSubmitted(false);
    }
  };
 
  return (
    <div className="min-h-screen bg-background flex items-center justify-center overflow-hidden p-4 animate-in fade-in duration-1000">
      <div className="w-full relative max-w-5xl overflow-hidden flex flex-col md:flex-row glass-card border-white/5 shadow-2xl rounded-3xl">
        <div className="w-full h-full z-[2] absolute bg-gradient-to-t from-background to-transparent opacity-80 pointer-events-none"></div>
        
        {/* Cybernetic Mesh Decoration */}
        <div className="flex absolute z-[1] overflow-hidden opacity-20 pointer-events-none">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-[40rem] w-[4rem] bg-gradient-to-b from-primary/30 via-transparent to-transparent rotate-12 -translate-y-20"></div>
          ))}
        </div>

        <div className="bg-black/40 text-white p-8 md:p-16 md:w-1/2 relative flex flex-col justify-between border-r border-white/5">
          <div>
            <div className="size-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-10 shadow-[0_0_20px_rgba(0,209,255,0.1)]">
               <ShieldCheckIcon className="size-6 text-primary" />
            </div>
            <h1 className="text-3xl md:text-5xl font-light leading-tight tracking-tighter mb-6">
              AI-Powered <span className="text-primary font-bold">Procurement</span> Intelligence.
            </h1>
            <p className="text-muted-foreground text-sm max-w-[300px] leading-relaxed">
              Join the elite circle of procurement officers leveraging neural analysis for clinical precision.
            </p>
          </div>
          
          <div className="mt-12 flex items-center gap-4 text-[10px] uppercase tracking-[0.2em] text-muted-foreground/50 font-bold">
             <div className="h-px flex-1 bg-white/5" />
             EST. 2026
          </div>
        </div>
 
        <div className="p-8 md:p-16 md:w-1/2 flex flex-col bg-card/50 backdrop-blur-xl z-[10] text-card-foreground">
          <div className="flex flex-col mb-10">
            <h2 className="text-4xl font-bold mb-2 tracking-tighter text-white">
              Secure Login
            </h2>
            <p className="text-sm text-muted-foreground opacity-80">
              Enter your credentials to access the TenderVault
            </p>
          </div>
 
          <form
            className="flex flex-col gap-6"
            onSubmit={handleSubmit}
            noValidate
          >
            <div className="space-y-2">
              <label htmlFor="email" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
                Official Email
              </label>
              <input
                type="email"
                id="email"
                placeholder="officer@agency.gov"
                className={cn(
                  "w-full h-12 px-4 rounded-xl border bg-white/[0.02] text-white placeholder:text-white/20 transition-all outline-none focus:ring-1 focus:ring-primary/50",
                  emailError ? "border-destructive/50" : "border-white/10 hover:border-white/20"
                )}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              {emailError && (
                <p className="text-destructive text-[10px] font-bold uppercase tracking-wide mt-1">
                  {emailError}
                </p>
              )}
            </div>
 
            <div className="space-y-2">
              <label htmlFor="password" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
                Access Token
              </label>
              <input
                type="password"
                id="password"
                placeholder="••••••••"
                className={cn(
                  "w-full h-12 px-4 rounded-xl border bg-white/[0.02] text-white placeholder:text-white/20 transition-all outline-none focus:ring-1 focus:ring-primary/50",
                  passwordError ? "border-destructive/50" : "border-white/10 hover:border-white/20"
                )}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              {passwordError && (
                <p className="text-destructive text-[10px] font-bold uppercase tracking-wide mt-1">
                  {passwordError}
                </p>
              )}
            </div>
 
            <button
              type="submit"
              className="w-full premium-button bg-primary text-primary-foreground font-bold py-4 rounded-xl shadow-[0_0_20px_rgba(0,209,255,0.2)] hover:shadow-[0_0_30px_rgba(0,209,255,0.4)] transition-all"
            >
              AUTHENTICATE
            </button>
 
            <div className="text-center text-[10px] font-bold uppercase tracking-widest text-muted-foreground/40 mt-4">
              Need Assistance?{" "}
              <a href="/support" className="text-primary hover:underline">
                Contact Admin
              </a>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
