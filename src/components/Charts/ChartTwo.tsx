"use client";

import { ApexOptions } from "apexcharts";
import React, { useMemo } from "react";
import dynamic from "next/dynamic";

const ReactApexChart = dynamic(() => import("react-apexcharts"), {
  ssr: false,
});

const defaultSeries = [
  { name: "Sales", data: [44, 55, 41, 67, 22, 43, 65] },
  { name: "Revenue", data: [13, 23, 20, 8, 13, 27, 15] },
];

const defaultCategories = ["M", "T", "W", "T", "F", "S", "S"];

interface ChartTwoProps {
  title?: string;
  series?: { name: string; data: number[] }[];
  categories?: string[];
  colors?: string[];
  height?: number;
  stacked?: boolean;
}

const ChartTwo: React.FC<ChartTwoProps> = ({
  title = "Performance",
  series = defaultSeries,
  categories = defaultCategories,
  colors = ["#3C50E0", "#80CAEE"],
  height = 350,
  stacked = true,
}) => {
  const options: ApexOptions = useMemo(() => ({
    colors,
    chart: {
      fontFamily: "Satoshi, sans-serif",
      type: "bar",
      height,
      stacked,
      toolbar: {
        show: false,
      },
      zoom: {
        enabled: false,
      },
    },
    responsive: [
      {
        breakpoint: 1536,
        options: {
          plotOptions: {
            bar: {
              borderRadius: 0,
              columnWidth: "35%",
            },
          },
        },
      },
    ],
    plotOptions: {
      bar: {
        horizontal: false,
        borderRadius: 0,
        columnWidth: "35%",
        borderRadiusApplication: "end",
        borderRadiusWhenStacked: "last",
      },
    },
    dataLabels: {
      enabled: false,
    },
    xaxis: {
      categories,
    },
    legend: {
      position: "top",
      horizontalAlign: "left",
      fontFamily: "Satoshi",
      fontWeight: 500,
      fontSize: "14px",
      markers: {
        radius: 99,
      },
    },
    fill: {
      opacity: 1,
    },
  }), [categories, colors, height, stacked]);

  return (
    <div className="col-span-12 rounded-sm border border-stroke bg-white p-6 shadow-default dark:border-strokedark dark:bg-boxdark xl:col-span-4">
      <div className="mb-4 flex items-center justify-between">
        <h4 className="text-lg font-semibold text-black dark:text-white">
          {title}
        </h4>
      </div>

      <div id="chartTwo" className="-mb-9 -ml-5">
        <ReactApexChart
          options={options}
          series={series}
          type="bar"
          height={height}
          width={"100%"}
        />
      </div>
    </div>
  );
};

export default ChartTwo;
