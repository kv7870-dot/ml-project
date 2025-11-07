
import React, { forwardRef } from 'react';
import { CameraIcon } from './Icons';

interface CameraFeedProps {
  isCameraOn: boolean;
}

export const CameraFeed = forwardRef<HTMLVideoElement, CameraFeedProps>(
  ({ isCameraOn }, ref) => {
    return (
      <div className="aspect-video bg-gray-900 rounded-xl overflow-hidden relative flex items-center justify-center">
        <video
          ref={ref}
          autoPlay
          playsInline
          muted
          className={`w-full h-full object-cover transition-opacity duration-300 ${isCameraOn ? 'opacity-100' : 'opacity-0'}`}
        ></video>
        {!isCameraOn && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-500">
            <CameraIcon className="w-16 h-16 mb-4" />
            <span className="text-lg font-medium">Camera is off</span>
          </div>
        )}
      </div>
    );
  }
);

CameraFeed.displayName = 'CameraFeed';
