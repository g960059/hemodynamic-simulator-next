import ogs from 'open-graph-scraper';

export async function GET(request) {
  const url = new URL(request.url).searchParams.get('url');

  if (!url) {
    return new Response('URL parameter is missing', { status: 400 });
  }

  try {
    const { result } = await ogs({ url });
    const ogData = {
      url,
      siteName: result.ogSiteName,
      title: result.ogTitle,
      description: result.ogDescription,
      image: result.ogImage && result.ogImage[0] && result.ogImage[0].url ? result.ogImage[0].url : null,
      favicon: result.favicon ? result.favicon : null,
      type: result.ogType,
    };
    return new Response(JSON.stringify(ogData), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'max-age=86400',
      },
    });
  } catch (error) {
    console.error('OGP fetch error', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}