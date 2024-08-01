import { ImageResponse } from 'next/og'
import { db } from '../../../../../src/utils/firebaseAdmin'
import { loadGoogleFont } from '../../../../../src/utils/font'

export const runtime = 'nodejs'
export const revalidate = 10;
export const size = {
  width: 1200,
  height: 630,
}

export default async function og({ params: { canvasId } }) {
  try {
    console.log('Generating OG image for canvasId:', canvasId) // ログ出力

    const notoSansArrayBuffer = await loadGoogleFont({
      family: 'Noto Sans JP',
      weight: 700,
    });

    const canvasSnap = await db.doc(`canvas/${canvasId}`).get()
    const canvas = canvasSnap.data()

    console.log('Canvas data for OG image:', canvas) // ログ出力

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
            paddingTop: 32,
            paddingBottom: 48,
            paddingRight: 48,
            paddingLeft: 48,
          }}>
            <h2
              style={{
                fontSize: 64,
                textAlign: 'left',
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
              {canvas?.photoURL && (
                <img 
                  src={canvas.photoURL} 
                  width="60"
                  height="60"
                  style={{ borderRadius: 60, marginRight: 10 }}
                />
              )}
              <div>{canvas?.displayName || "Anonymous"}</div>
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
        ...size,
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
  } catch (error) {
    console.error('Error generating OG image:', error) // エラーログ出力

    // エラー時のデフォルト画像を返す
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
          }}
        >
          <h1 style={{ fontSize: 48, color: 'white' }}>Error generating image</h1>
        </div>
      ),
      {
        ...size,
      }
    )
  }
}