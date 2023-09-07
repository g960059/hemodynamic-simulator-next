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
    <div className="bg-gray-100 p-4 rounded-md">Loading...</div>
  ) : (
    <div className="border border-gray-300 p-4 rounded-lg overflow-hidden">
      <a href={state.ogData.url} target="_blank" rel="noopener noreferrer" className="flex items-center">
        {state.ogData.image && (
          <div className="w-1/3 h-24 mr-4">
            <img src={state.ogData.image} alt={state.ogData.title || state.ogData.siteName} className="w-full h-full object-cover" />
          </div>
        )}
        <div className="flex-1">
          <div className="font-bold mb-2 text-gray-900">{state.ogData.title}</div>
          <div className="text-sm text-gray-700">{state.ogData.description}</div>
        </div>
      </a>
    </div>
  );
};

export default LinkCard;