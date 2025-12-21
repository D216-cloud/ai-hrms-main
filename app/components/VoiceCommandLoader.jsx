"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

// Dynamically import the heavy client component to avoid SSR issues
const VoiceCommand = dynamic(() => import("@/components/VoiceCommand"), { ssr: false });

export default function VoiceCommandLoader() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;
  return <VoiceCommand autoStart={false} />;
}
