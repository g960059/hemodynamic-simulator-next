import { ImageResponse } from 'next/og'
import { db } from '../../../src/utils/firebaseAdmin'
import { loadGoogleFont } from '../../../src/utils/font'

export const runtime = 'edge'

export async function generateImageMetadata({ params: { canvasId } }) {
  const canvasSnap = await db.doc(`canvas/${canvasId}`).get()
  const canvas = canvasSnap.data()

  return [
    {
      contentType: 'image/png',
      size: { width: 1200, height: 630 },
      alt: canvas?.name || 'Untitled Canvas',
    },
  ]
}

export default async function og({ params: { canvasId } }) {
  const notoSansArrayBuffer = await loadGoogleFont({
    family: 'Noto Sans JP',
    weight: 700,
  });

  const canvasSnap = await db.doc(`canvas/${canvasId}`).get()
  const canvas = canvasSnap.data()
  
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(-225deg, #a1c4fd 0%, #c2e9fb 100%)',
          padding: 40,
          position: 'relative',
        }}    
      >
        <div style={{
          width: '100%',
          height: '100%',
          background: 'white',
          borderRadius: 16,
          boxShadow: '0 0 16px rgba(0,0,0,0.1)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingTop:32,
          paddingBottom:48,
          paddingRight: 48,
          paddingLeft: 48,
        }}>
          <h2
            style={{
              fontSize: 64,
              textAlign: 'left' ,
              width: '100%',      
            }}
          >
            {canvas?.name || "Untitled"}
          </h2>
          <div style={{flexGrow:1}}></div>
          <div style={{
            fontSize: 32,
            width: '100%',
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <img 
              src={canvas?.photoURL} 
              width="60"
              height="60"
              style={{ borderRadius: 60, marginRight: 10 }}
            />
            <div>{canvas?.displayName}</div>
            <div style={{flexGrow:1}}></div>
            <img 
              src="https://www.circleheart.dev/favicons/favicon_256x256.png"
              width="48"
              height="48"
              style={{ borderRadius: 48, marginRight: 10 }}
            />          
            <div style={{ fontWeight: "bold", fontSize: 36}}>CircleHeart</div>
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      fonts: [
        {
          name: 'NotoSansJP',
          data: notoSansArrayBuffer,
          style: 'normal',
          weight: 700,
        },
      ],      
    }
  )
}