"use client";

import { motion } from "framer-motion";
import { Lock, MapPin, Smartphone, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

const features = [
  {
    title: "Edge Verification.",
    subtitle: "Instant presence.",
    description: "Verification happens in under 1 second. Our advanced architecture processes proxy patterns instantly.",
    icon: <Zap className="w-10 h-10 text-[#f5f5f7] mb-6" />,
    className: "md:col-span-2 md:row-span-2 bg-[#1d1d1f]",
    large: true
  },
  {
    title: "Geo-Fencing.",
    description: "50-meter accuracy. Pinpoint precision for every single class.",
    icon: <MapPin className="w-8 h-8 text-[#f5f5f7] mb-4" />,
    className: "md:col-span-1 bg-[#1d1d1f]"
  },
  {
    title: "Device ID.",
    description: "One student. One device. No exceptions.",
    icon: <Smartphone className="w-8 h-8 text-[#f5f5f7] mb-4" />,
    className: "md:col-span-1 bg-[#1d1d1f]"
  },
  {
    title: "End-to-End Encryption.",
    description: "Your data is yours. Protected by industry-leading cryptography.",
    icon: <Lock className="w-8 h-8 text-[#f5f5f7] mb-4" />,
    className: "md:col-span-2 bg-[#1d1d1f]"
  }
];

export default function Features() {
  return (
    <section className="py-32 bg-black">
      <div className="container mx-auto px-4 md:px-8 max-w-[1024px]">
        <div className="mb-24 text-center">
          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
            className="text-5xl md:text-7xl lg:text-[80px] font-bold tracking-tighter text-white leading-none"
          >
            Security. <br /><span className="text-[#86868b]">It's built in.</span>
          </motion.h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 md:grid-rows-2 gap-6 auto-rows-[300px]">
          {features.map((feature, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.95, y: 30 }}
              whileInView={{ opacity: 1, scale: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 1, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] }}
              className={cn(
                "rounded-[2.5rem] p-10 flex flex-col justify-end relative overflow-hidden group transition-all duration-300 hover:scale-[1.02]",
                feature.className
              )}
            >
              <div className="relative z-10">
                {feature.icon}
                <h3 className={cn(
                  "font-semibold tracking-tight text-[#f5f5f7] mb-2",
                  feature.large ? "text-4xl md:text-5xl" : "text-2xl md:text-3xl"
                )}>
                  {feature.title}
                </h3>
                <p className={cn(
                  "text-[#86868b] font-medium tracking-tight",
                  feature.large ? "text-xl md:text-2xl max-w-md" : "text-lg"
                )}>
                  {feature.subtitle && <span className="block text-[#f5f5f7] mb-1">{feature.subtitle}</span>}
                  {feature.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
