"use client";

import { motion } from "framer-motion";
import {
  Shield,
  Smartphone,
  Clock,
  MapPin,
  Fingerprint,
  Zap,
  Lock,
  ArrowRight
} from "lucide-react";
import { cn } from "@/lib/utils";

const features = [
  {
    title: "60-Second QR Rotation",
    description: "Dynamic QR codes that regenerate every minute. Share attempts are instantly invalidated by the system.",
    icon: <Clock className="w-6 h-6 text-indigo-400" />,
    className: "md:col-span-2",
    background: <div className="absolute right-0 top-0 h-full w-1/2 bg-gradient-to-l from-indigo-500/10 to-transparent flex items-center justify-center p-8"><div className="w-24 h-24 rounded-2xl border-4 border-indigo-500/20 border-t-indigo-500/80 animate-spin" /></div>
  },
  {
    title: "GPS Geo-Fencing",
    description: "Verified attendance location within a 50-meter radius of the classroom.",
    icon: <MapPin className="w-6 h-6 text-purple-400" />,
    className: "md:col-span-1",
  },
  {
    title: "Device Fingerprinting",
    description: "Unique identifier for every student device to prevent multiple logins.",
    icon: <Fingerprint className="w-6 h-6 text-pink-400" />,
    className: "md:col-span-1",
  },
  {
    title: "Proxy Detection",
    description: "Advanced pattern analysis to flag suspicious login behaviors and potential proxy attempts.",
    icon: <Shield className="w-6 h-6 text-indigo-400" />,
    className: "md:col-span-2",
    background: <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(79,70,229,0.15),transparent_70%)]" />
  },
  {
    title: "Live Feed",
    description: "Real-time attendance dashboard for faculty with instant risk scoring.",
    icon: <Zap className="w-6 h-6 text-yellow-400" />,
    className: "md:col-span-1",
  },
  {
    title: "2FA Security",
    description: "TOTP-based two-factor authentication for high-privilege accounts.",
    icon: <Lock className="w-6 h-6 text-green-400" />,
    className: "md:col-span-2",
  }
];

export default function Features() {
  return (
    <section id="features" className="py-24 relative overflow-hidden">
      <div className="container mx-auto px-6 relative z-10">
        <div className="text-center mb-16">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl md:text-5xl font-bold text-white mb-4 tracking-tight"
          >
            The Security Protocol
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-white/50 max-w-2xl mx-auto"
          >
            A multi-layered defense system designed to ensure every attendance record is authentic, verified, and tamper-proof.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-6xl mx-auto">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className={cn(
                "group relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-8 transition-all hover:bg-white/[0.08] hover:border-white/20",
                feature.className
              )}
            >
              {feature.background}
              <div className="relative z-10 h-full flex flex-col">
                <div className="mb-4 inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-white/5 border border-white/10 group-hover:scale-110 transition-transform duration-500">
                  {feature.icon}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white mb-2">{feature.title}</h3>
                  <p className="text-white/40 text-sm leading-relaxed">{feature.description}</p>
                </div>
                <div className="mt-auto pt-6 flex items-center gap-2 text-xs font-bold text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  Explore Details <ArrowRight className="w-3 h-3" />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
