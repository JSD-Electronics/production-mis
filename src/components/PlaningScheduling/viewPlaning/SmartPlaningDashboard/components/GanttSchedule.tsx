"use client";
import React, { useMemo } from "react";
import dynamic from "next/dynamic";
const ReactApexChart = dynamic(() => import("react-apexcharts"), { ssr: false });

interface GanttScheduleProps {
    data: any[];
}

const GanttSchedule: React.FC<GanttScheduleProps> = ({ data }) => {
    const series = useMemo(() => {
        if (!data || data.length === 0) return [];

        const stages: { [key: string]: any[] } = {};
        const today = new Date().toISOString().split('T')[0];

        data.forEach((row) => {
            if (row.isBreak || row.hour.includes("Total") || row.hour.includes("Avg")) return;

            const [startTime, endTime] = row.hour.split(" - ");
            const start = new Date(`${today}T${startTime}:00`).getTime();
            const end = new Date(`${today}T${endTime}:00`).getTime();

            row.values.forEach((v: any) => {
                if (!stages[v.stage]) stages[v.stage] = [];

                // Only show if there is some activity or it's a planned slot
                // For visual representation, we show the whole slot
                let color = "#00E396"; // Default running
                if (row.status === "past") color = "#008FFB"; // Completed
                if (row.status === "future") color = "#FEB019"; // Pending

                stages[v.stage].push({
                    x: v.stage,
                    y: [start, end],
                    fillColor: color,
                    pass: v.Pass,
                    target: v.targetUPH
                });
            });
        });

        return [{
            data: Object.values(stages).flat()
        }];
    }, [data]);

    const options: any = {
        chart: {
            height: 450,
            type: 'rangeBar',
            toolbar: {
                show: true
            }
        },
        plotOptions: {
            bar: {
                horizontal: true,
                barHeight: '70%',
                rangeBarGroupRows: true
            }
        },
        xaxis: {
            type: 'datetime',
            labels: {
                datetimeUTC: false
            }
        },
        tooltip: {
            custom: function ({ series, seriesIndex, dataPointIndex, w }: any) {
                const d = w.globals.initialSeries[seriesIndex].data[dataPointIndex];
                return '<div class="p-2 bg-white dark:bg-boxdark border border-stroke shadow-lg rounded-lg">' +
                    '<p class="font-bold text-sm">' + d.x + '</p>' +
                    '<p class="text-xs">Pass: ' + d.pass + ' / ' + d.target + '</p>' +
                    '</div>';
            }
        },
        legend: {
            position: 'top',
            horizontalAlign: 'left'
        }
    };

    return (
        <div className="p-4 bg-white dark:bg-boxdark rounded-2xl">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-black dark:text-white">Production Allocation Timeline</h3>
                <div className="flex gap-4">
                    {["Completed", "Running", "Pending"].map((status, i) => (
                        <div key={i} className="flex items-center gap-2 text-xs font-semibold">
                            <span className={`w-3 h-3 rounded-full ${status === "Completed" ? "bg-[#008FFB]" : status === "Running" ? "bg-[#00E396]" : "bg-[#FEB019]"}`}></span>
                            {status}
                        </div>
                    ))}
                </div>
            </div>
            <div id="chart" className="min-h-[400px]">
                {series.length > 0 ? (
                    <ReactApexChart options={options} series={series} type="rangeBar" height={450} />
                ) : (
                    <div className="h-[400px] flex items-center justify-center text-gray-400 italic">
                        No scheduling data available for the current selection
                    </div>
                )}
            </div>
        </div>
    );
};

export default React.memo(GanttSchedule);
