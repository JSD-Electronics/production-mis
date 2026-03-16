"use client";

import { ApexOptions } from "apexcharts";
import React, { useMemo } from "react";
import dynamic from "next/dynamic";

const ReactApexChart = dynamic(() => import("react-apexcharts"), {
  ssr: false,
});

const defaultSeries = [
  {
    name: "Product One",
    data: [23, 11, 22, 27, 13, 22, 37, 21, 44, 22, 30, 45],
  },
  {
    name: "Product Two",
    data: [30, 25, 36, 30, 45, 35, 64, 52, 59, 36, 39, 51],
  },
];

const defaultCategories = [
  "Sep",
  "Oct",
  "Nov",
  "Dec",
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
];

interface ChartOneProps {
  title?: string;
  subtitle?: string;
  series?: { name: string; data: number[] }[];
  categories?: string[];
  height?: number;
  colors?: string[];
  showLegend?: boolean;
}

const ChartOne: React.FC<ChartOneProps> = ({
  title = "Activity Trend",
  subtitle,
  series = defaultSeries,
  categories = defaultCategories,
  height = 350,
  colors = ["#3C50E0", "#80CAEE"],
  showLegend = true,
}) => {
  const options: ApexOptions = useMemo(() => ({
    legend: {
      show: showLegend,
      position: "top",
      horizontalAlign: "left",
    },
    colors,
    chart: {
      fontFamily: "Satoshi, sans-serif",
      height,
      type: "area",
      dropShadow: {
        enabled: true,
        color: "#623CEA14",
        top: 10,
        blur: 4,
        left: 0,
        opacity: 0.1,
      },
      toolbar: {
        show: false,
      },
    },
    responsive: [
      {
        breakpoint: 1024,
        options: {
          chart: {
            height: Math.max(height - 50, 240),
          },
        },
      },
      {
        breakpoint: 1366,
        options: {
          chart: {
            height: Math.max(height + 0, 260),
          },
        },
      },
    ],
    stroke: {
      width: [2, 2],
      curve: "straight",
    },
    grid: {
      xaxis: {
        lines: {
          show: true,
        },
      },
      yaxis: {
        lines: {
          show: true,
        },
      },
    },
    dataLabels: {
      enabled: false,
    },
    markers: {
      size: 4,
      colors: "#fff",
      strokeColors: colors,
      strokeWidth: 3,
      strokeOpacity: 0.9,
      strokeDashArray: 0,
      fillOpacity: 1,
      discrete: [],
      hover: {
        size: undefined,
        sizeOffset: 5,
      },
    },
    xaxis: {
      type: "category",
      categories,
      axisBorder: {
        show: false,
      },
      axisTicks: {
        show: false,
      },
    },
    yaxis: {
      title: {
        style: {
          fontSize: "0px",
        },
      },
      min: 0,
    },
  }), [categories, colors, height, showLegend]);

  return (
    <div className="col-span-12 rounded-sm border border-stroke bg-white px-5 pb-5 pt-6 shadow-default dark:border-strokedark dark:bg-boxdark sm:px-7.5 xl:col-span-8">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h4 className="text-lg font-semibold text-black dark:text-white">
            {title}
          </h4>
          {subtitle && (
            <p className="text-sm font-medium text-gray-500">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      <div id="chartOne" className="-ml-5">
        <ReactApexChart
          options={options}
          series={series}
          type="area"
          height={height}
          width={"100%"}
        />
      </div>
    </div>
  );
};

export default ChartOne;
