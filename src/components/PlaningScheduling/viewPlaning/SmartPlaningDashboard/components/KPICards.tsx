"use client";
import React from "react";
import {
    FiClock,
    FiCheckCircle,
    FiAlertCircle,
    FiActivity,
    FiServer
} from "react-icons/fi";

interface KPICardsProps {
    stats: {
        totalPlanned: number;
        running: number;
        completed: number;
        delayed: number;
        utilization: number;
    };
}

const KPICards: React.FC<KPICardsProps> = ({ stats }) => {
    const cards = [
        {
            title: "Total Planned",
            value: stats.totalPlanned,
            icon: <FiServer className="text-primary" />,
            color: "bg-blue-50 dark:bg-blue-900/20",
            textColor: "text-blue-600",
            indicator: "Items"
        },
        {
            title: "Running Jobs",
            value: stats.running,
            icon: <FiActivity className="text-meta-3" />,
            color: "bg-green-50 dark:bg-green-900/20",
            textColor: "text-green-600",
            indicator: "Active"
        },
        {
            title: "Completed",
            value: stats.completed,
            icon: <FiCheckCircle className="text-meta-3" />,
            color: "bg-teal-50 dark:bg-teal-900/20",
            textColor: "text-teal-600",
            indicator: "Finished"
        },
        {
            title: "Delayed Jobs",
            value: stats.delayed,
            icon: <FiAlertCircle className="text-meta-1" />,
            color: "bg-red-50 dark:bg-red-900/20",
            textColor: "text-red-600",
            indicator: "Urgent"
        },
        {
            title: "Utilization",
            value: `${stats.utilization}%`,
            icon: <FiClock className="text-meta-6" />,
            color: "bg-orange-50 dark:bg-orange-900/20",
            textColor: "text-orange-600",
            indicator: "Load"
        }
    ];

    return (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            {cards.map((card, idx) => (
                <div
                    key={idx}
                    className="bg-white dark:bg-boxdark rounded-2xl border border-stroke dark:border-strokedark p-4 shadow-sm hover:shadow-md transition-all flex flex-col gap-2 relative overflow-hidden group"
                >
                    <div className={`p-2 rounded-lg w-fit ${card.color}`}>
                        {React.cloneElement(card.icon as React.ReactElement, { size: 20 })}
                    </div>

                    <div className="z-10">
                        <h3 className="text-2xl font-bold text-black dark:text-white mt-1 group-hover:scale-105 transition-transform origin-left">
                            {card.value}
                        </h3>
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                            {card.title}
                        </p>
                    </div>

                    <div className={`absolute top-4 right-4 text-[10px] font-bold px-1.5 py-0.5 rounded ${card.color} ${card.textColor}`}>
                        {card.indicator}
                    </div>

                    {/* Subtle background decoration */}
                    <div className={`absolute -right-2 -bottom-2 w-16 h-16 rounded-full opacity-10 ${card.color}`} />
                </div>
            ))}
        </div>
    );
};

export default React.memo(KPICards);
