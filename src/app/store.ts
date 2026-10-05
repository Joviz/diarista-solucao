import { configureStore } from '@reduxjs/toolkit';
import { atendimentosSlice } from '@/features/atendimentos/atendimentosSlice';
import { api } from '@/app/api';

export const store = configureStore({
  reducer: {
    atendimentos: atendimentosSlice.reducer,
    [api.reducerPath]: api.reducer,
  },
  middleware: (getDefault) => getDefault().concat(api.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
