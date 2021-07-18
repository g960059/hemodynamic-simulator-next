import React from 'react';

import useEventListener from './useEventListener';

export function getVisibilityPropertyNames() {
  // Opera 12.10 and Firefox 18 and later support
  if (typeof document.hidden !== 'undefined') {
    return ['hidden', 'visibilitychange'];
  }
  if (typeof document.msHidden !== 'undefined') {
    return ['msHidden', 'msvisibilitychange'];
  }
  if (typeof document.webkitHidden !== 'undefined') {
    return ['webkitHidden', 'webkitvisibilitychange'];
  }
  return ['hidden', 'visibilitychange'];
}

export function useDocumentVisibilityChange(callback) {
  if(typeof window !== "undefined"){
    const [hidden, visibilityChange] = getVisibilityPropertyNames();
    const onChange = React.useCallback(() => {
      callback(document[hidden]);
    }, [callback]);
    useEventListener(visibilityChange, onChange, document);    
  }
}

export function useDocumentVisibility() {
  if(typeof window !== "undefined"){
    const [hidden, visibilityChange] = getVisibilityPropertyNames();
    const [isHidden, setHidden] = React.useState(document[hidden]);
    const onChange = React.useCallback(state => setHidden(state), [setHidden]);
    useDocumentVisibilityChange(onChange);
    return isHidden;
  }
}