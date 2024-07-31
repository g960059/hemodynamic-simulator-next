import ogs from 'open-graph-scraper';
import { URL } from 'url';



export async function GET(request) {
  const url = new URL(request.url).searchParams.get('url');

  if (!url) {
    return new Response('URL parameter is missing', { status: 400 });
  }

  try {
    const { error, result } = await ogs({ url });
    if (error) {
      throw new Error(result.error);
    }
    const ogData = {
      url: result.ogUrl || url,
      siteName: result.ogSiteName || '',
      title: result.ogTitle || '',
      description: result.ogDescription || '',
      image: result.ogImage && result.ogImage.length > 0 ? result.ogImage[0].url : '',
      type: result.ogType || '',
      favicon: result.favicon || '',
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
    const hostname = new URL(url).hostname;
    const fallbackData = {
      url,
      siteName: hostname,
      title: url,
      description: '',
      image: '',
      type: '',
      favicon: '',
    };
    return new Response(JSON.stringify(fallbackData), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'max-age=86400',
      },
    });
  }
}
