import * as React from 'react';
import { useSyncExternalStore } from 'react';
import { Observable } from 'rxjs';
import { SuspenseSubject } from './SuspenseSubject';

const DEFAULT_TIMEOUT = 30_000;

const preloadedObservables: Map<string, SuspenseSubject<any>> = new Map();

export function preloadObservable<T>(source: Observable<T>, id: string, suspenseEnabled = false) {
  if (preloadedObservables.has(id)) {
    return preloadedObservables.get(id) as SuspenseSubject<T>;
  } else {
    const observable = new SuspenseSubject(source, DEFAULT_TIMEOUT, suspenseEnabled);
    preloadedObservables.set(id, observable);
    return observable;
  }
}

export function useObservable<T = unknown>(
  observableId: string,
  source: Observable<T>,
  options: { suspenseEnabled?: boolean } = {}
): { data: T | undefined, error: Error | null, status: 'loading' | 'error' | 'success' } {
  if (!observableId) {
    throw new Error('cannot call useObservable without an observableId');
  }

  const { suspenseEnabled = false } = options;
  const observable = preloadObservable(source, observableId, suspenseEnabled);

  const [error, setError] = React.useState<Error | null>(null);

  const subscribe = React.useCallback((onStoreChange: () => void) => {
    const subscription = observable.subscribe({
      next: () => {
        setError(null); // Reset error state on new data
        onStoreChange();
      },
      error: (e) => {
        setError(e); // Set error state
        onStoreChange();
      },
      complete: () => {
        onStoreChange();
        subscription.unsubscribe(); // Clean up on complete
      },
    });

    return () => {
      subscription.unsubscribe(); // Clean up on unmount or re-subscribe
    };
  }, [observable]);

  const getSnapshot = React.useCallback(() => {
    return observable.immutableStatus;
  }, [observable]);

  const update = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  let data: T | undefined = undefined;
  let status: 'loading' | 'error' | 'success' = 'loading';

  if ('data' in update) {
    data = update.data;
    status = 'success';
  }

  if (error) {
    status = 'error';
  }

  return { data, error, status };
}
