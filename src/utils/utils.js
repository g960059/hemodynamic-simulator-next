import {useEffect, useRef} from 'react';
import {differenceInDays,differenceInHours,differenceInMinutes,differenceInMonths,differenceInYears} from 'date-fns'
import { customAlphabet } from 'nanoid';
import {usePathname, useRouter} from 'next/navigation';
import { useBeforeUnload } from 'react-use';

const alphabet = '123456789abcdef';
export const nanoid = customAlphabet(alphabet, 14);

export const shallowCompare = (obj1, obj2) =>
  Object.keys(obj1).length === Object.keys(obj2).length &&
  Object.keys(obj1).every(key => obj1[key] === obj2[key]);

const initalEmojiList = ["🤖","📚","👻","🔥","🐧","🧑","👌","🐥"]

export const getRandomEmoji = () =>{
  return initalEmojiList[Math.floor(Math.random()*initalEmojiList.length)]
}

export const objectWithoutKey = (object, key) => {
  if(key){
    const {[key]: deleted, ...rest} = object;
    return rest;
  }else{
    return object;
  }
}
export const objectWithoutKeys = (object, keys) => {
  let {...otherKeys} = object;
  for(let key of keys){
    otherKeys = objectWithoutKey(otherKeys, key);
  }
  return otherKeys;
}

export const formatDateDiff = (date1,date2) => {
  const years = differenceInYears(date1,date2);
  if(years>0){
    return `${years}年前`
  }
  const months = differenceInMonths(date1,date2);
  if(months>0){
    return `${months}ヶ月前`
  }
  const days = differenceInDays(date1,date2);
  if(days>0){
    return `${days}日前`
  }
  const hours = differenceInHours(date1,date2);
  if(hours>0){
    return `${hours}時間前`
  }
  const minutes = differenceInMinutes(date1,date2);
  if(minutes>0){
    return `${minutes}分前`
  }
  return "1分前"
}

export const useNavigationEvent = (onPathnameChange) => {
  const pathname = usePathname(); // Get current route

  // Save pathname on component mount into a REF
  const savedPathNameRef = useRef(pathname);

  useEffect(() => {
    // If REF has been changed, do the stuff
    if (savedPathNameRef.current !== pathname) {
      onPathnameChange();
      // Update REF
      savedPathNameRef.current = pathname;
    }
  }, [pathname, onPathnameChange]);
};

export const useLeavePageConfirmation = (
  showAlert,
  message = '保存せずに終了しますか？',
) => {
  const router = useRouter();
  useBeforeUnload(showAlert, message);
  return {
    ...router,
    push : (...args) => {
      if (showAlert) {
        if(!window.confirm(message)){
          return;
        }
      }
      router.push(...args)
    }
  }
};

export const useRouterConfirmation = (
  showAlert,
  message = '保存せずに終了しますか？',
) => {
  const router = useRouter();
  useBeforeUnload(showAlert, message);
  return {
    ...router,
    push : (...args) => {
      if (showAlert()) {
        if(!window.confirm(message)){
          return;
        }
      }
      router.push(...args)
    }
  }
};


export const getFileExtension = (fileName) => {
  return fileName.split('.').pop();
}
export const getFileName = (fileName) => {
  return fileName.split('.').slice(0,-1).join('.');
}

export const createImage = (url) =>
  new Promise((resolve, reject) => {
    const image = new Image()
    image.addEventListener('load', () => resolve(image))
    image.addEventListener('error', (error) => reject(error))
    image.setAttribute('crossOrigin', 'anonymous') // needed to avoid cross-origin issues on CodeSandbox
    image.src = url
  })

export function getRadianAngle(degreeValue) {
  return (degreeValue * Math.PI) / 180
}


export function rotateSize(width, height, rotation) {
  const rotRad = getRadianAngle(rotation)

  return {
    width:
      Math.abs(Math.cos(rotRad) * width) + Math.abs(Math.sin(rotRad) * height),
    height:
      Math.abs(Math.sin(rotRad) * width) + Math.abs(Math.cos(rotRad) * height),
  }
}


export async function getCroppedImg(
  imageSrc,
  pixelCrop,
  rotation = 0,
  flip = { horizontal: false, vertical: false }
) {
  console.log(imageSrc,pixelCrop,rotation,flip)
  const image = await createImage(imageSrc)
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')

  if (!ctx) {
    return null
  }

  const rotRad = getRadianAngle(rotation)

  // calculate bounding box of the rotated image
  const { width: bBoxWidth, height: bBoxHeight } = rotateSize(
    image.width,
    image.height,
    rotation
  )

  // set canvas size to match the bounding box
  canvas.width = bBoxWidth
  canvas.height = bBoxHeight

  // translate canvas context to a central location to allow rotating and flipping around the center
  ctx.translate(bBoxWidth / 2, bBoxHeight / 2)
  ctx.rotate(rotRad)
  ctx.scale(flip.horizontal ? -1 : 1, flip.vertical ? -1 : 1)
  ctx.translate(-image.width / 2, -image.height / 2)

  // draw rotated image
  ctx.drawImage(image, 0, 0)

  // croppedAreaPixels values are bounding box relative
  // extract the cropped image using these values
  const data = ctx.getImageData(
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height
  )

  // set canvas width to final desired crop size - this will clear existing context
  canvas.width = pixelCrop.width
  canvas.height = pixelCrop.height

  // paste generated rotate image at the top left corner
  ctx.putImageData(data, 0, 0)

  // As Base64 string
  return canvas.toDataURL('image/jpeg');
    // console.log(canvas.toDataURL('image/jpeg'))
  // As a blob
  // return new Promise((resolve, reject) => {
  //   canvas.toBlob((file) => {
  //     resolve(URL.createObjectURL(file))
  //   }, 'image/jpeg')
  // })
}

export function readFile(file) {
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.addEventListener('load', () => resolve(reader.result), false)
    reader.readAsDataURL(file)
  })
}


const HALF_KATA = [
  'ｧ','ｱ','ｨ','ｲ','ｩ','ｳ','ｪ','ｴ','ｫ','ｵ',
  'ｶ','ｶﾞ','ｷ','ｷﾞ','ｸ','ｸﾞ','ｹ','ｹﾞ','ｺ','ｺﾞ',
  'ｻ','ｻﾞ','ｼ','ｼﾞ','ｽ','ｽﾞ','ｾ','ｾﾞ','ｿ','ｿﾞ',
  'ﾀ','ﾀﾞ','ﾁ','ﾁﾞ','ｯ','ﾂ','ﾂﾞ','ﾃ','ﾃﾞ','ﾄ','ﾄﾞ',
  'ﾅ','ﾆ','ﾇ','ﾈ','ﾉ',
  'ﾊ','ﾊﾞ','ﾊﾟ','ﾋ','ﾋﾞ','ﾋﾟ','ﾌ','ﾌﾞ','ﾌﾟ','ﾍ','ﾍﾞ','ﾍﾟ','ﾎ','ﾎﾞ','ﾎﾟ',
  'ﾏ','ﾐ','ﾑ','ﾒ','ﾓ',
  'ｬ','ﾔ','ｭ','ﾕ','ｮ','ﾖ',
  'ﾗ','ﾘ','ﾙ','ﾚ','ﾛ',
  'ヮ','ﾜ','ヰ','ヱ','ｦ','ﾝ','ｳﾞ','ヵ','ヶ','ﾜﾞ','ｲﾞ','ｴﾞ','ｦﾞ'
]

const halfKataToWide = (text, hira=false) => {
  const firstCharCode = hira === true ? 12353 : 12449
  return text.replace(/[ﾜｲｴｦ]ﾞ/g, m => 
          'ヷヸヹヺ'.charAt('ﾜﾞｲﾞｴﾞｦﾞ'.indexOf(m) / 2)
      ).replace(/([ｦ-ｯｱｲｴｵﾅ-ﾉﾏ-ﾝ]|[ｳｶ-ﾄ]ﾞ?|[ﾊ-ﾎ][ﾞﾟ]?)/g, m => 
          String.fromCharCode(HALF_KATA.indexOf(m) + firstCharCode)
      ).replace(/[ﾞﾟｰ｡｢｣､･]/g, m => 
          '゛゜ー。「」、・'.charAt('ﾞﾟｰ｡｢｣､･'.indexOf(m))
      )
}

export const toHira = (text) => 
  halfKataToWide(text, true).replace(/[ァ-ヶ]/g, m => String.fromCharCode(m.charCodeAt(0) - 0x60))

const toWideKata = (text) => 
  halfKataToWide(text).replace(/[ぁ-ゖ]/g, m => String.fromCharCode(m.charCodeAt(0) + 0x60))

const toHalfKata = (text) => 
  text.replace(/[ァ-ヺ]/g, m => HALF_KATA[m.charCodeAt(0) - 12449])
      .replace(/[ぁ-ゖ]/g, m => HALF_KATA[m.charCodeAt(0) - 12353])
      .replace(/[゛゜ー。「」、・]/g, m => 'ﾞﾟｰ｡｢｣､･'.charAt('゛゜ー。「」、・'.indexOf(m)))

export const calculatePosition= (positions, newItem) => {
  let maxYAtX = new Array(12).fill(0);
  for (let position of positions) {
      for (let x = position.x; x < position.x + position.w; x++) {
          maxYAtX[x] = Math.max(maxYAtX[x], position.y + position.h);
      }
  }

  // 次に、新しいアイテムを配置できる最初の位置を探します。
  let bestPosition = {x: 0, y: Infinity};
  for (let x = 0; x <= 12 - newItem.w; x++) {
      // x座標から新しいアイテムの幅だけ右に移動した範囲での最大のy座標を計算します。
      let maxY = Math.max(...maxYAtX.slice(x, x + newItem.w));
      // 新しいアイテムが配置できるかどうかを確認します。
      if (maxY < bestPosition.y) {
          bestPosition = {x: x, y: maxY};
      }
  }

  // 最適な位置を返します。
  return bestPosition;
}

export function deepEqual(a, b, excludeKeys = []) {
  if (a === b) return true;

  if (a && b && typeof a === 'object' && typeof b === 'object') {
    if (a.constructor !== b.constructor) return false;

    let length, i, keys;
    if (Array.isArray(a)) {
      length = a.length;
      if (length !== b.length) return false;
      for (i = length; i-- !== 0;)
        if (!deepEqual(a[i], b[i], excludeKeys)) return false;
      return true;
    }

    if (a instanceof Map && b instanceof Map) {
      if (a.size !== b.size) return false;
      for (i of a.entries())
        if (!b.has(i[0]) || !deepEqual(i[1], b.get(i[0]), excludeKeys)) return false;
      return true;
    }

    if (a instanceof Set && b instanceof Set) {
      if (a.size !== b.size) return false;
      for (i of a.entries())
        if (!b.has(i[0])) return false;
      return true;
    }

    if (ArrayBuffer.isView(a) && ArrayBuffer.isView(b)) {
      length = a.length;
      if (length !== b.length) return false;
      for (i = length; i-- !== 0;)
        if (a[i] !== b[i]) return false;
      return true;
    }

    if (a.constructor === RegExp) return a.source === b.source && a.flags === b.flags;
    if (a.valueOf !== Object.prototype.valueOf) return a.valueOf() === b.valueOf();
    if (a.toString !== Object.prototype.toString) return a.toString() === b.toString();

    keys = Object.keys(a).filter(key => !excludeKeys.includes(key));
    length = keys.length;
    if (length !== Object.keys(b).filter(key => !excludeKeys.includes(key)).length) return false;

    for (i = length; i-- !== 0;)
      if (!Object.hasOwn(b, keys[i])) return false;

    for (i = length; i-- !== 0;) {
      var key = keys[i];
      if (!deepEqual(a[key], b[key], excludeKeys)) return false;
    }

    return true;
  }

  // True if both NaN, false otherwise
  return a !== a && b !== b;
}

export function fastDeepEqual(a, b, excludeKeys = [], includeKeys = null) {
  if (a === b) return true;

  if (a && b && typeof a === 'object' && typeof b === 'object') {
    if (a.constructor !== b.constructor) return false;

    let length, i, keys;
    if (Array.isArray(a)) {
      length = a.length;
      if (length !== b.length) return false;
      for (i = length; i-- !== 0;)
        if (!fastDeepEqual(a[i], b[i], excludeKeys, includeKeys)) return false;
      return true;
    }

    if (a instanceof Map && b instanceof Map) {
      if (a.size !== b.size) return false;
      for (i of a.entries())
        if (!b.has(i[0]) || !fastDeepEqual(i[1], b.get(i[0]), excludeKeys, includeKeys)) return false;
      return true;
    }

    if (a instanceof Set && b instanceof Set) {
      if (a.size !== b.size) return false;
      for (i of a.entries())
        if (!b.has(i[0])) return false;
      return true;
    }

    if (ArrayBuffer.isView(a) && ArrayBuffer.isView(b)) {
      length = a.length;
      if (length !== b.length) return false;
      for (i = length; i-- !== 0;)
        if (a[i] !== b[i]) return false;
      return true;
    }

    if (a.constructor === RegExp) return a.source === b.source && a.flags === b.flags;
    if (a.valueOf !== Object.prototype.valueOf) return a.valueOf() === b.valueOf();
    if (a.toString !== Object.prototype.toString) return a.toString() === b.toString();

    if (includeKeys !== null) {
      keys = includeKeys;
    } else {
      keys = Object.keys(a).filter(key => !excludeKeys.includes(key));
    }

    length = keys.length;
    if (length !== Object.keys(b).filter(key => !excludeKeys.includes(key)).length) return false;

    for (i = length; i-- !== 0;)
      if (!Object.hasOwn(b, keys[i])) return false;

    for (i = length; i-- !== 0;) {
      var key = keys[i];
      if (!fastDeepEqual(a[key], b[key], excludeKeys, includeKeys)) return false;
    }

    return true;
  }

  // True if both NaN, false otherwise
  return a !== a && b !== b;
}

export function deepEqual2(a, b, excludeKeys = [], ignoreArrayOrder = false) {
  if (a === b) return true;

  if (a && b && typeof a === 'object' && typeof b === 'object') {
    if (a.constructor !== b.constructor) return false;

    let length, i, keys;
    if (Array.isArray(a)) {
      length = a.length;
      if (length !== b.length) return false;

      if (ignoreArrayOrder) {
        // Sort both arrays based on the 'i' property before comparing
        const sortedA = [...a].sort((x, y) => (x.i > y.i ? 1 : -1));
        const sortedB = [...b].sort((x, y) => (x.i > y.i ? 1 : -1));
        for (i = length; i-- !== 0;)
          if (!deepEqual2(sortedA[i], sortedB[i], excludeKeys, ignoreArrayOrder)) return false;
      } else {
        for (i = length; i-- !== 0;)
          if (!deepEqual2(a[i], b[i], excludeKeys, ignoreArrayOrder)) return false;
      }
      return true;
    }

    keys = Object.keys(a).filter(key => !excludeKeys.includes(key));
    length = keys.length;
    if (length !== Object.keys(b).filter(key => !excludeKeys.includes(key)).length) return false;

    for (i = length; i-- !== 0;)
      if (!Object.hasOwn(b, keys[i])) return false;

    for (i = length; i-- !== 0;) {
      var key = keys[i];
      if (!deepEqual2(a[key], b[key], excludeKeys, ignoreArrayOrder)) return false;
    }

    return true;
  }

  // True if both NaN, false otherwise
  return a !== a && b !== b;
}



export function deepEqual3(a, b, excludeKeys = [], ignoreArrayOrder = false, ignoreUndefined = false) {
  if (a === b) return true;

  if (a && b && typeof a === 'object' && typeof b === 'object') {
    if (a.constructor !== b.constructor) return false;

    let length, i, keys;
    if (Array.isArray(a)) {
      length = a.length;
      if (length !== b.length) return false;

      if (ignoreArrayOrder) {
        const sortedA = [...a].sort((x, y) => (x.i > y.i ? 1 : -1));
        const sortedB = [...b].sort((x, y) => (x.i > y.i ? 1 : -1));
        for (i = length; i-- !== 0;)
          if (!deepEqual3(sortedA[i], sortedB[i], excludeKeys, ignoreArrayOrder, ignoreUndefined)) return false;
      } else {
        for (i = length; i-- !== 0;)
          if (!deepEqual3(a[i], b[i], excludeKeys, ignoreArrayOrder, ignoreUndefined)) return false;
      }
      return true;
    }

    keys = Object.keys(a).filter(key => !excludeKeys.includes(key));
    if (ignoreUndefined) {
      keys = keys.filter(key => a[key] !== undefined);
    }
    length = keys.length;

    const bKeys = Object.keys(b).filter(key => !excludeKeys.includes(key));
    if (ignoreUndefined) {
      if (length !== bKeys.filter(key => b[key] !== undefined).length) return false;
    } else {
      if (length !== bKeys.length) return false;
    }

    for (i = length; i-- !== 0;)
      if (!Object.hasOwn(b, keys[i])) return false;

    for (i = length; i-- !== 0;) {
      var key = keys[i];
      if (!deepEqual3(a[key], b[key], excludeKeys, ignoreArrayOrder, ignoreUndefined)) return false;
    }

    return true;
  }

  // True if both NaN, false otherwise
  return a !== a && b !== b;
}

