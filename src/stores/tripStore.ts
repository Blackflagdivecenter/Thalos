import { create } from 'zustand';
import { TripRepository } from '@/src/repositories/TripRepository';
import { Trip, CreateTripInput } from '@/src/models';

const repo = new TripRepository();

interface TripState {
  trips: Trip[];
  loadTrips: () => void;
  createTrip: (input: CreateTripInput) => Trip;
  updateTrip: (id: string, input: Partial<CreateTripInput>) => Trip;
  deleteTrip: (id: string) => void;
}

export const useTripStore = create<TripState>((set, get) => ({
  trips: [],

  loadTrips: () => {
    set({ trips: repo.getAll() });
  },

  createTrip: (input) => {
    const trip = repo.create(input);
    get().loadTrips();
    return trip;
  },

  updateTrip: (id, input) => {
    const trip = repo.update(id, input);
    get().loadTrips();
    return trip;
  },

  deleteTrip: (id) => {
    repo.delete(id);
    get().loadTrips();
  },
}));
