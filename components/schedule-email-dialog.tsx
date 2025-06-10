'use client';

import { useState, useEffect } from 'react';
import { Calendar, Clock, Send, X, AlertCircle } from 'lucide-react';

interface ScheduleEmailDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSchedule: (scheduledDate: Date) => void;
  onSendNow: () => void;
  defaultTimeStart?: string;
  defaultTimeEnd?: string;
  skipWeekends?: boolean;
}

export default function ScheduleEmailDialog({
  isOpen,
  onClose,
  onSchedule,
  onSendNow,
  defaultTimeStart = '09:00',
  defaultTimeEnd = '17:00',
  skipWeekends = true
}: ScheduleEmailDialogProps) {
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [useBusinessHours, setUseBusinessHours] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      // Set default date to tomorrow
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      // Skip weekends if enabled
      if (skipWeekends) {
        while (tomorrow.getDay() === 0 || tomorrow.getDay() === 6) {
          tomorrow.setDate(tomorrow.getDate() + 1);
        }
      }
      
      setSelectedDate(tomorrow.toISOString().split('T')[0]);
      setSelectedTime(defaultTimeStart);
      setError('');
    }
  }, [isOpen, defaultTimeStart, skipWeekends]);

  const handleSchedule = () => {
    if (!selectedDate || !selectedTime) {
      setError('Please select both date and time');
      return;
    }

    const scheduledDateTime = new Date(`${selectedDate}T${selectedTime}`);
    const now = new Date();

    if (scheduledDateTime <= now) {
      setError('Scheduled time must be in the future');
      return;
    }

    // Check if it's within business hours
    if (useBusinessHours) {
      const hours = scheduledDateTime.getHours();
      const startHour = parseInt(defaultTimeStart.split(':')[0]);
      const endHour = parseInt(defaultTimeEnd.split(':')[0]);
      
      if (hours < startHour || hours >= endHour) {
        setError(`Please select a time between ${defaultTimeStart} and ${defaultTimeEnd}`);
        return;
      }
    }

    // Check if it's a weekend
    if (skipWeekends) {
      const dayOfWeek = scheduledDateTime.getDay();
      if (dayOfWeek === 0 || dayOfWeek === 6) {
        setError('Weekends are not allowed. Please select a weekday.');
        return;
      }
    }

    onSchedule(scheduledDateTime);
  };

  const getMinDate = () => {
    const today = new Date();
    today.setDate(today.getDate() + 1); // Tomorrow
    return today.toISOString().split('T')[0];
  };

  const getMaxDate = () => {
    const maxDate = new Date();
    maxDate.setMonth(maxDate.getMonth() + 3); // 3 months from now
    return maxDate.toISOString().split('T')[0];
  };

  const getQuickScheduleOptions = () => {
    const options = [];
    const now = new Date();
    
    // Tomorrow morning
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    if (skipWeekends) {
      while (tomorrow.getDay() === 0 || tomorrow.getDay() === 6) {
        tomorrow.setDate(tomorrow.getDate() + 1);
      }
    }
    tomorrow.setHours(9, 0, 0, 0);
    options.push({ label: 'Tomorrow 9 AM', date: tomorrow });

    // In 3 hours (if within business hours)
    const in3Hours = new Date(now);
    in3Hours.setHours(in3Hours.getHours() + 3);
    const hours = in3Hours.getHours();
    if (hours >= 9 && hours < 17 && (in3Hours.getDay() !== 0 && in3Hours.getDay() !== 6)) {
      options.push({ label: 'In 3 hours', date: in3Hours });
    }

    // Next Monday 9 AM
    const nextMonday = new Date(now);
    const daysUntilMonday = (8 - nextMonday.getDay()) % 7 || 7;
    nextMonday.setDate(nextMonday.getDate() + daysUntilMonday);
    nextMonday.setHours(9, 0, 0, 0);
    options.push({ label: 'Next Monday 9 AM', date: nextMonday });

    return options;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Schedule Email</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md flex items-start">
            <AlertCircle className="w-5 h-5 text-red-600 mr-2 flex-shrink-0" />
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Quick Schedule Options */}
        <div className="mb-6">
          <p className="text-sm font-medium text-gray-700 mb-2">Quick Schedule</p>
          <div className="space-y-2">
            {getQuickScheduleOptions().map((option, index) => (
              <button
                key={index}
                onClick={() => {
                  setSelectedDate(option.date.toISOString().split('T')[0]);
                  setSelectedTime(option.date.toTimeString().substring(0, 5));
                  setError('');
                }}
                className="w-full text-left px-3 py-2 text-sm bg-gray-50 hover:bg-gray-100 rounded-md"
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          {/* Date Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Calendar className="w-4 h-4 inline mr-1" />
              Select Date
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => {
                setSelectedDate(e.target.value);
                setError('');
              }}
              min={getMinDate()}
              max={getMaxDate()}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Time Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Clock className="w-4 h-4 inline mr-1" />
              Select Time
            </label>
            <input
              type="time"
              value={selectedTime}
              onChange={(e) => {
                setSelectedTime(e.target.value);
                setError('');
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Business Hours Toggle */}
          <div className="flex items-center">
            <input
              type="checkbox"
              id="useBusinessHours"
              checked={useBusinessHours}
              onChange={(e) => setUseBusinessHours(e.target.checked)}
              className="mr-2"
            />
            <label htmlFor="useBusinessHours" className="text-sm text-gray-700">
              Restrict to business hours ({defaultTimeStart} - {defaultTimeEnd})
            </label>
          </div>
        </div>

        {/* Selected DateTime Display */}
        {selectedDate && selectedTime && (
          <div className="mt-4 p-3 bg-blue-50 rounded-md">
            <p className="text-sm text-blue-800">
              Scheduled for: <strong>{new Date(`${selectedDate}T${selectedTime}`).toLocaleString()}</strong>
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="mt-6 flex gap-3">
          <button
            onClick={onSendNow}
            className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
          >
            <Send className="w-4 h-4 inline mr-1" />
            Send Now
          </button>
          <button
            onClick={handleSchedule}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            <Calendar className="w-4 h-4 inline mr-1" />
            Schedule
          </button>
        </div>
      </div>
    </div>
  );
}