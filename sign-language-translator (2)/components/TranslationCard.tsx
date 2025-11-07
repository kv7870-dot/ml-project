
import React from 'react';
import { Language } from '../types';
import { SpeakerIcon } from './Icons';

interface TranslationCardProps {
  language: Language;
  text: string;
  isLoading: boolean;
  onSpeak: () => void;
  isMuted: boolean;
}

export const TranslationCard: React.FC<TranslationCardProps> = ({
  language,
  text,
  isLoading,
  onSpeak,
  isMuted,
}) => {
  return (
    <div className="bg-base-100 rounded-2xl shadow-lg p-4 transition-all duration-300 ease-in-out">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-brand-primary">{language}</h3>
        <button
          onClick={onSpeak}
          disabled={isLoading || !text || isMuted}
          className={`p-2 rounded-full transition-colors duration-200 
            ${isMuted || !text ? 'text-base-content-secondary/40 cursor-not-allowed' : 'text-base-content-secondary hover:bg-base-300 hover:text-brand-primary'} 
            ${isLoading ? 'animate-pulse-fast' : ''}`}
          aria-label={`Speak ${language} translation`}
        >
          {isLoading ? (
            <div className="w-6 h-6 border-2 border-brand-primary border-t-transparent rounded-full animate-spinner-ease-spin"></div>
          ) : (
            <SpeakerIcon className="w-6 h-6" />
          )}
        </button>
      </div>
      <p className="mt-2 text-base-content text-xl min-h-[28px] break-words">
        {text || <span className="text-base-content-secondary/60">...</span>}
      </p>
    </div>
  );
};
