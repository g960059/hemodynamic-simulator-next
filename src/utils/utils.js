import {useEffect} from 'react';
import {differenceInDays,differenceInHours,differenceInMinutes,differenceInMonths,differenceInYears} from 'date-fns'
import { customAlphabet } from 'nanoid';
import Router from 'next/router';
import { useBeforeUnload } from 'react-use';

const alphabet = '123456789abcdef';
export const nanoid = customAlphabet(alphabet, 14);

export const shallowCompare = (obj1, obj2) =>
  Object.keys(obj1).length === Object.keys(obj2).length &&
  Object.keys(obj1).every(key => obj1[key] === obj2[key]);

const initalEmojiList = ["π€","π","π»","π₯","π§","π§","π","π₯"]

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
    return `${years}εΉ΄ε`
  }
  const months = differenceInMonths(date1,date2);
  if(months>0){
    return `${months}γΆζε`
  }
  const days = differenceInDays(date1,date2);
  if(days>0){
    return `${days}ζ₯ε`
  }
  const hours = differenceInHours(date1,date2);
  if(hours>0){
    return `${hours}ζιε`
  }
  const minutes = differenceInMinutes(date1,date2);
  if(minutes>0){
    return `${minutes}εε`
  }
  return "1εε"
}


export const useLeavePageConfirmation = (
  showAlert,
  message = 'δΏε­γγγ«η΅δΊγγΎγγοΌ',
) => {
  useBeforeUnload(showAlert, message);

  useEffect(() => {
    const handler = () => {
      console.log(showAlert)
      if (showAlert) {
        if(!window.confirm(message)){
          throw 'γ­γ£γ³γ»γ«';
        }
      }
    };
    Router.events.on('routeChangeStart', handler);

    return () => {
      Router.events.off('routeChangeStart', handler);
    };
  }, [showAlert, message]);
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
  'ο½§','ο½±','ο½¨','ο½²','ο½©','ο½³','ο½ͺ','ο½΄','ο½«','ο½΅',
  'ο½Ά','ο½ΆοΎ','ο½·','ο½·οΎ','ο½Έ','ο½ΈοΎ','ο½Ή','ο½ΉοΎ','ο½Ί','ο½ΊοΎ',
  'ο½»','ο½»οΎ','ο½Ό','ο½ΌοΎ','ο½½','ο½½οΎ','ο½Ύ','ο½ΎοΎ','ο½Ώ','ο½ΏοΎ',
  'οΎ','οΎοΎ','οΎ','οΎοΎ','ο½―','οΎ','οΎοΎ','οΎ','οΎοΎ','οΎ','οΎοΎ',
  'οΎ','οΎ','οΎ','οΎ','οΎ',
  'οΎ','οΎοΎ','οΎοΎ','οΎ','οΎοΎ','οΎοΎ','οΎ','οΎοΎ','οΎοΎ','οΎ','οΎοΎ','οΎοΎ','οΎ','οΎοΎ','οΎοΎ',
  'οΎ','οΎ','οΎ','οΎ','οΎ',
  'ο½¬','οΎ','ο½­','οΎ','ο½?','οΎ',
  'οΎ','οΎ','οΎ','οΎ','οΎ',
  'γ?','οΎ','γ°','γ±','ο½¦','οΎ','ο½³οΎ','γ΅','γΆ','οΎοΎ','ο½²οΎ','ο½΄οΎ','ο½¦οΎ'
]

const halfKataToWide = (text, hira=false) => {
  const firstCharCode = hira === true ? 12353 : 12449
  return text.replace(/[οΎο½²ο½΄ο½¦]οΎ/g, m => 
          'γ·γΈγΉγΊ'.charAt('οΎοΎο½²οΎο½΄οΎο½¦οΎ'.indexOf(m) / 2)
      ).replace(/([ο½¦-ο½―ο½±ο½²ο½΄ο½΅οΎ-οΎοΎ-οΎ]|[ο½³ο½Ά-οΎ]οΎ?|[οΎ-οΎ][οΎοΎ]?)/g, m => 
          String.fromCharCode(HALF_KATA.indexOf(m) + firstCharCode)
      ).replace(/[οΎοΎο½°ο½‘ο½’ο½£ο½€ο½₯]/g, m => 
          'γγγΌγγγγγ»'.charAt('οΎοΎο½°ο½‘ο½’ο½£ο½€ο½₯'.indexOf(m))
      )
}

export const toHira = (text) => 
  halfKataToWide(text, true).replace(/[γ‘-γΆ]/g, m => String.fromCharCode(m.charCodeAt(0) - 0x60))

const toWideKata = (text) => 
  halfKataToWide(text).replace(/[γ-γ]/g, m => String.fromCharCode(m.charCodeAt(0) + 0x60))

const toHalfKata = (text) => 
  text.replace(/[γ‘-γΊ]/g, m => HALF_KATA[m.charCodeAt(0) - 12449])
      .replace(/[γ-γ]/g, m => HALF_KATA[m.charCodeAt(0) - 12353])
      .replace(/[γγγΌγγγγγ»]/g, m => 'οΎοΎο½°ο½‘ο½’ο½£ο½€ο½₯'.charAt('γγγΌγγγγγ»'.indexOf(m)))
