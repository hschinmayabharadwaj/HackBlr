'use client';

import { useState, useEffect, useCallback } from 'react';
import { type CheckIn, type Feeling } from '@/lib/types';

const STORAGE_KEY = 'voxnava-checkins';

export function useCheckIns() {
  const [checkIns, setCheckIns] = useState<CheckIn[]>([]);

  useEffect(() => {
    try {
      const storedData = window.localStorage.getItem(STORAGE_KEY);
      if (storedData) {
        setCheckIns(JSON.parse(storedData));
      }
    } catch (error) {
      console.error("Failed to read from local storage", error);
    }
  }, []);

  const addCheckIn = useCallback((newCheckIn: { mood: string; feelings: Feeling[]; details: string }) => {
    setCheckIns((prevCheckIns) => {
      const entry: CheckIn = {
        id: new Date().toISOString(),
        date: new Date().toISOString(),
        ...newCheckIn,
      };
      const updatedCheckIns = [...prevCheckIns, entry];
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedCheckIns));
      } catch (error) {
        console.error("Failed to write to local storage", error);
      }
      return updatedCheckIns;
    });
  }, []);

  return { checkIns, addCheckIn };
}
