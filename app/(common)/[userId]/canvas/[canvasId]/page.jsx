import { db } from '../../../../../src/utils/firebaseAdmin'
import dynamic from 'next/dynamic'
const ClientPage = dynamic(() => import('./ClientPage'), { ssr: false })


export async function generateMetadata({ params }) {
  try {
    const canvasDoc = await db.collection('canvas').doc(params.canvasId).get()
    const canvas = canvasDoc.data()

    const ogImageUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/canvas/${params.canvasId}/opengraph-image`

    return {
      id: params.canvasId,
      title: canvas?.name || 'Untitled Canvas',
      description: canvas?.description || 'A CircleHeart canvas',
      openGraph: {
        title: canvas?.name || 'Untitled Canvas',
        description: canvas?.description || 'A CircleHeart canvas',
        images: [
          {
            url: ogImageUrl,
            width: 1200,
            height: 630,
            alt: canvas?.name || 'Untitled Canvas',
          },
        ],
      },
      twitter: {
        card: 'summary_large_image',
        title: canvas?.name || 'Untitled Canvas',
        description: canvas?.description || 'A CircleHeart canvas',
        images: [ogImageUrl],
      },
    }
  } catch (error) {
    console.error('Error generating metadata:', error)
    
    // エラー時でも動的に生成されたOGP画像を使用
    const ogImageUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/canvas/${params.canvasId}/opengraph-image`

    return {
      title: 'Untitled Canvas',
      description: 'A CircleHeart canvas',
      openGraph: {
        title: 'Untitled Canvas',
        description: 'A CircleHeart canvas',
        images: [
          {
            url: ogImageUrl,
            width: 1200,
            height: 630,
            alt: 'Untitled Canvas',
          },
        ],
      },
      twitter: {
        card: 'summary_large_image',
        title: 'Untitled Canvas',
        description: 'A CircleHeart canvas',
        images: [ogImageUrl],
      },
    }
  }
}

export default function Page({ params }) {
  return <ClientPage params={params} />
}