'use client';

import { useState } from 'react';

interface TimeSliderProps {
  dates: string[];
  currentDay: number;
  onChange: (day: number) => void;
  onPlayPause: () => void;
  isPlaying: boolean;
  precipitationData?: number[];
  precipitationStats?: {
    totalRain: number;
    rainyDays: number;
    avgDaily: number;
  };
}

export default function TimeSlider({ 
  dates, 
  currentDay, 
  onChange, 
  onPlayPause,
  isPlaying,
  precipitationData = [],
  precipitationStats
}: TimeSliderProps) {
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('ru-RU', { 
      day: 'numeric', 
      month: 'short',
      weekday: 'short'
    });
  };
  
  if (dates.length === 0) {
    return null; // Don't render if no dates available
  }
  
  const todayPrecip = precipitationData[currentDay] || 0;
  
  return (
    <div style={{
      position: 'absolute',
      bottom: 10,
      left: '50%',
      transform: 'translateX(-50%)',
      background: 'white',
      padding: '16px',
      borderRadius: '8px',
      boxShadow: '0 2px 12px rgba(0,0,0,0.2)',
      zIndex: 1000,
      minWidth: '400px',
      maxWidth: '600px'
    }}>
      <div style={{ marginBottom: '12px', textAlign: 'center' }}>
        <strong style={{ fontSize: '16px' }}>
          {currentDay === 0 ? 'Сегодня' : `+${currentDay} дней`}
        </strong>
        <div style={{ fontSize: '14px', color: '#666' }}>
          {formatDate(dates[currentDay])}
        </div>
        
        {/* Show precipitation prediction */}
        {todayPrecip > 0 ? (
          <div style={{ 
            fontSize: '13px', 
            color: '#1E90FF',
            marginTop: '4px',
            fontWeight: 'bold'
          }}>
            ☔ Осадки: {todayPrecip.toFixed(1)} мм
          </div>
        ) : (
          <div style={{ 
            fontSize: '12px', 
            color: '#999',
            marginTop: '4px'
          }}>
            ☀️ Без осадков
          </div>
        )}
      </div>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <button
          onClick={() => onChange(Math.max(0, currentDay - 1))}
          disabled={currentDay === 0}
          style={{
            padding: '8px 12px',
            background: currentDay === 0 ? '#ccc' : '#4169E1',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: currentDay === 0 ? 'not-allowed' : 'pointer',
            fontSize: '16px',
            minWidth: '40px'
          }}
          title="Предыдущий день"
        >
          ◀
        </button>
        
        <button
          onClick={() => onChange(Math.min(dates.length - 1, currentDay + 1))}
          disabled={currentDay === dates.length - 1}
          style={{
            padding: '8px 12px',
            background: currentDay === dates.length - 1 ? '#ccc' : '#4169E1',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: currentDay === dates.length - 1 ? 'not-allowed' : 'pointer',
            fontSize: '16px',
            minWidth: '40px'
          }}
          title="Следующий день"
        >
          ▶
        </button>
        
        <input
          type="range"
          min={0}
          max={dates.length - 1}
          value={currentDay}
          onChange={(e) => onChange(parseInt(e.target.value))}
          style={{
            flex: 1,
            height: '8px',
            cursor: 'pointer',
            accentColor: '#4169E1'
          }}
        />
        
        <div style={{ 
          minWidth: '60px', 
          textAlign: 'right',
          fontSize: '12px',
          color: '#666'
        }}>
          {currentDay + 1} / {dates.length}
        </div>
      </div>
      
      {/* Precipitation visualization bar */}
      {precipitationData.length > 0 && (
        <div style={{ marginTop: '8px' }}>
          <div style={{ 
            fontSize: '10px', 
            color: '#666', 
            marginBottom: '4px',
            textAlign: 'center'
          }}>
            Осадки по дням (мм)
          </div>
          <div style={{ 
            display: 'flex', 
            gap: '2px', 
            alignItems: 'flex-end', 
            height: '30px',
            justifyContent: 'center'
          }}>
            {precipitationData.map((precip, idx) => {
              const maxPrecip = Math.max(...precipitationData, 1);
              const height = Math.max((precip / maxPrecip) * 100, precip > 0 ? 8 : 3);
              const isSelected = idx === currentDay;
              
              return (
                <div
                  key={idx}
                  style={{
                    width: '20px',
                    height: `${height}%`,
                    background: precip > 0 ? '#1E90FF' : '#E0E0E0',
                    borderRadius: '2px 2px 0 0',
                    position: 'relative',
                    cursor: 'pointer',
                    border: isSelected ? '2px solid #333' : 'none',
                    opacity: isSelected ? 1 : 0.7
                  }}
                  onClick={() => onChange(idx)}
                  title={`День ${idx + 1}: ${precip.toFixed(1)}мм`}
                >
                  {precip > 2 && (
                    <div style={{
                      position: 'absolute',
                      top: '-16px',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      fontSize: '8px',
                      whiteSpace: 'nowrap',
                      color: '#333'
                    }}>
                      {precip.toFixed(0)}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div style={{ 
        marginTop: '12px', 
        display: 'flex', 
        justifyContent: 'space-between',
        fontSize: '11px',
        color: '#999'
      }}>
        <span>{formatDate(dates[0])}</span>
        <span>Прогноз на {dates.length} дней</span>
        <span>{formatDate(dates[dates.length - 1])}</span>
      </div>
    </div>
  );
}