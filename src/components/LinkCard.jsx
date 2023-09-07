import { useEffect, useState } from 'react';

const LinkCard = ({ href }) => {
  const [state, setState] = useState({
    ogData: undefined,
    isCompleted: false,
    error: null,
  });

  useEffect(() => {
    fetch(`/api/ogp?url=${encodeURIComponent(href)}`)
      .then((response) => {
        if (!response.ok) {
          throw new Error('Network response was not ok ' + response.statusText);
        }
        return response.json();
      })
      .then((data) => {
        setState({
          ogData: data,
          isCompleted: true,
        });
      })
      .catch((error) => {
        setState({
          error: error.message,
          isCompleted: true,
        });
      });
  }, [href]);

  if (state.error) {
    return <div className="bg-red-100 p-4 rounded-md">Error: {state.error}</div>;
  }

  return !state.isCompleted ? (
    <div className="bg-slate-100 p-4 rounded-md">Loading...</div>
  ) : (
    <div className="border border-blue-300 p-0 rounded-lg overflow-hidden">
      <a href={state.ogData.url} target="_blank" rel="noopener noreferrer" className="flex items-center text-slate-800 transition-colors duration-200 ease-in-out hover:bg-blue-100 p-0 group">
        <div className="flex-1 p-4 min-w-0">
          <h1 className="m-0 text-base font-bold leading-tight truncate-2-lines group-hover:no-underline">{state.ogData.title}</h1>
          <div className="mt-2 text-xs text-slate-600 leading-tight truncate-2-lines overflow-hidden">{state.ogData.description}</div>
          <div className="mt-2 flex items-center text-xs text-slate-600 truncate">
            {state.ogData.favicon && <img src={state.ogData.favicon} alt={`${state.ogData.siteName} favicon`} className="mr-1.5 flex-shrink-0" width="14" height="14" />}
            {state.ogData.siteName}
          </div>
        </div>
        {state.ogData.image && (
          <div className="w-[230px] h-[120px] flex-shrink-0 overflow-hidden bg-slate-100">
            <img src={state.ogData.image} alt={`${state.ogData.title} thumbnail`} className="w-full h-full object-cover" />
          </div>
        )}
      </a>
    </div>
  );
};

export default LinkCard;