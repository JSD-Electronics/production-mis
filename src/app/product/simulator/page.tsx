"use client";
import React, { useEffect, useState } from "react";
import StageSimulator from "@/components/product/StageSimulator";
import { Loader2, AlertTriangle } from "lucide-react";

export default function SimulatorPage() {
    const [config, setConfig] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        try {
            const stored = localStorage.getItem("simulationConfig");
            if (stored) {
                const parsed = JSON.parse(stored);
                if (parsed.stages && Array.isArray(parsed.stages)) {
                    setConfig(parsed);
                } else {
                    setError("Invalid configuration found. Please return to the product editor and try again.");
                }
            } else {
                setError("No simulation configuration found. Please launch the simulator from the product editor.");
            }
        } catch (e) {
            setError("Failed to load simulation configuration.");
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, []);

    if (loading) {
        return (
            <div className="flex bg-white dark:bg-black h-screen items-center justify-center flex-col gap-4">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
                <p className="text-gray-500">Loading Configuration...</p>
            </div>
        );
    }

    if (error || !config) {
        return (
            <div className="flex bg-white dark:bg-black h-screen items-center justify-center flex-col gap-4 text-center p-8">
                <div className="h-16 w-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center">
                    <AlertTriangle className="h-8 w-8" />
                </div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Configuration Error</h1>
                <p className="text-gray-500 max-w-md">{error}</p>
                <button
                    onClick={() => window.close()}
                    className="mt-4 px-6 py-2 bg-gray-900 text-white dark:bg-white dark:text-black rounded-lg hover:opacity-90"
                >
                    Close & Return
                </button>
            </div>
        );
    }

    return (
        <StageSimulator
            stages={config.stages}
            initialStageIndex={config.initialStageIndex || 0}
            isOpen={true}
            onClose={() => {
                // In page mode, close might just act as a reset or we can hide the close button entirely.
                // The updated StageSimulator handles isPageMode logic to hide close button.
            }}
            isPageMode={true}
        />
    );
}
