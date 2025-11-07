
import React from 'react';
import { CameraIcon, StopIcon } from './Icons';

interface StartStopButtonProps {
  isCameraOn: boolean;
  onClick: () => void;
}

export const StartStopButton: React.FC<StartStopButtonProps> = ({ isCameraOn, onClick }) => {
  const bgColor = isCameraOn ? 'bg-red-600 hover:bg-red-700' : 'bg-brand-primary hover:bg-brand-secondary';
  const text = isCameraOn ? 'Stop Camera' : 'Start Camera';
  const Icon = isCameraOn ? StopIcon : CameraIcon;

  return (
    <button
      onClick={onClick}
      className={`flex items-center justify-center px-8 py-4 text-lg font-semibold text-white rounded-full shadow-lg transform transition-all duration-300 ease-in-out hover:scale-105 focus:outline-none focus:ring-4 focus:ring-opacity-50 ${isCameraOn ? 'focus:ring-red-400' : 'focus:ring-brand-secondary/50'} ${bgColor}`}
    >
      <Icon className="w-6 h-6 mr-3" />
      <span>{text}</span>
    </button>
  );
};
