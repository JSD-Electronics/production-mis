'use client';
import React, { useState } from "react";
import ViewTaskDetailsComponent from "@/components/Operators/viewTask/index";
import DefaultLayout from "@/components/Layouts/DefaultLayout";

const ViewOperatorPage = () => {
  const [isFullScreenMode, setIsFullScreenMode] = useState(true);
  const [isAnimating, setIsAnimating] = useState(false);

  const toggleFullScreenMode = () => {
    setIsAnimating(true);
    setTimeout(() => {
      setIsFullScreenMode((prev) => !prev);
      setIsAnimating(false);
    }, 300); // Duration matches the animation timing
  };

  return (
    <div className="animation-container">
      {!isAnimating && isFullScreenMode && (
        <div className="animated fadeIn">
          <DefaultLayout>
            <ViewTaskDetailsComponent
              isFullScreenMode={isFullScreenMode}
              setIsFullScreenMode={toggleFullScreenMode}
            />
          </DefaultLayout>
        </div>
      )}
      {!isAnimating && !isFullScreenMode && (
        <div className="animated fadeIn">
          <ViewTaskDetailsComponent
            isFullScreenMode={isFullScreenMode}
            setIsFullScreenMode={toggleFullScreenMode}
          />
        </div>
      )}
    </div>
  );
};

export default ViewOperatorPage;
