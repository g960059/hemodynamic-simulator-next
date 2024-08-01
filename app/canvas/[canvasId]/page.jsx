import { Metadata, ResolvingMetadata } from 'next'
import { db } from '../../../src/utils/firebaseAdmin'
import ClientPage from './ClientPage'

export async function generateMetadata({ params }, parent) {
  try {
    // canvasIdを使ってFirestoreからデータを取得
    const canvasDoc = await db.collection('canvas').doc(params.canvasId).get()
    const canvas = canvasDoc.data()

    console.log('Canvas data:', canvas) // ログ出力

    // 親のmetadataを読み込む
    const previousImages = (await parent).openGraph?.images || []

    return {
      title: canvas?.name || 'Untitled Canvas',
      description: canvas?.description || 'A CircleHeart canvas',
      openGraph: {
        title: canvas?.name || 'Untitled Canvas',
        description: canvas?.description || 'A CircleHeart canvas',
        images: [
          {
            url: `/canvas/${params.canvasId}/opengraph-image`,
            width: 1200,
            height: 630,
            alt: canvas?.name || 'Untitled Canvas',
          },
          ...previousImages,
        ],
      },
      twitter: {
        card: 'summary_large_image',
        title: canvas?.name || 'Untitled Canvas',
        description: canvas?.description || 'A CircleHeart canvas',
        images: [`/canvas/${params.canvasId}/opengraph-image`],
      },
    }
  } catch (error) {
    console.error('Error generating metadata:', error)
    return {
      title: 'Untitled Canvas',
      description: 'A CircleHeart canvas',
      openGraph: {
        title: 'Untitled Canvas',
        description: 'A CircleHeart canvas',
        images: [
          {
            url: `/canvas/${params.canvasId}/opengraph-image`,
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
        images: [`/canvas/${params.canvasId}/opengraph-image`],
      },
    }
  }
}

export default function Page({ params }) {
  return <ClientPage params={params} />
}