"use client";

import { ApexOptions } from "apexcharts";
import React, { useMemo } from "react";
import dynamic from "next/dynamic";

const ReactApexChart = dynamic(() => import("react-apexcharts"), {
  ssr: false,
});

const defaultSeries = [65, 34, 12, 56];
const defaultLabels = ["Desktop", "Tablet", "Mobile", "Unknown"];

interface ChartThreeProps {
  title?: string;
  series?: number[];
  labels?: string[];
  colors?: string[];
}

const ChartThree: React.FC<ChartThreeProps> = ({
  title = "Distribution",
  series = defaultSeries,
  labels = defaultLabels,
  colors = ["#3C50E0", "#6577F3", "#8FD0EF", "#0FADCF"],
}) => {
  const options: ApexOptions = useMemo(() => ({
    chart: {
      fontFamily: "Satoshi, sans-serif",
      type: "donut",
    },
    colors,
    labels,
    legend: {
      show: false,
      position: "bottom",
    },
    plotOptions: {
      pie: {
        donut: {
          size: "65%",
          background: "transparent",
        },
      },
    },
    dataLabels: {
      enabled: false,
    },
    responsive: [
      {
        breakpoint: 2600,
        options: {
          chart: {
            width: 380,
          },
        },
      },
      {
        breakpoint: 640,
        options: {
          chart: {
            width: 220,
          },
        },
      },
    ],
  }), [colors, labels]);

  return (
    <div className="col-span-12 rounded-sm border border-stroke bg-white px-5 pb-5 pt-6 shadow-default dark:border-strokedark dark:bg-boxdark sm:px-7.5 xl:col-span-5">
      <div className="mb-3">
        <h5 className="text-lg font-semibold text-black dark:text-white">
          {title}
        </h5>
      </div>

      <div className="mb-2">
        <div id="chartThree" className="mx-auto flex justify-center">
          <ReactApexChart options={options} series={series} type="donut" />
        </div>
      </div>
    </div>
  );
};

export default ChartThree;
