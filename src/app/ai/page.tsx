"use client";

import { AIAgentDashboard } from '@/components/dashboard/AIAgentDashboard';
import { Header } from '@/components/Header';

export default function AIPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto p-6">
        <AIAgentDashboard />
      </main>
    </div>
  );
}

