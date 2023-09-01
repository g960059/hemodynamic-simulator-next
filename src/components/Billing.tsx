import React, { useState,  FormEvent } from 'react';
import { NextPage } from 'next';
import { CardElement, useElements, useStripe } from '@stripe/react-stripe-js';
import { getFunctions, httpsCallable, HttpsCallableResult, } from 'firebase/functions'
import { SetupIntent } from '@stripe/stripe-js';
import toast, { Toaster } from 'react-hot-toast';
import {useWallet} from "../hooks"
import { CircularProgress, Typography } from '@mui/material';
import { Check} from '@mui/icons-material';
import {LoadingButton} from '@mui/lab'
import { Box } from '@mui/system';
import {NeumoLoadingButton} from "./StyledComponents"


const Billing: NextPage = () => {
  const stripe = useStripe();
  const elements = useElements();  
  const functions = getFunctions()

  const {wallet,updateWallet, loading:walletLoading} = useWallet();
  const [attaching, setAttaching] = useState(false);

  const detachCard = async () => {
    setAttaching(true)
    if(wallet){
      const detachPaymentMethod = httpsCallable(functions, "detachPaymentMethod")
      await detachPaymentMethod(wallet?.id)
      updateWallet()
      toast.success("カードを削除しました")
    }
    setAttaching(false)
  }

  const attachCard = async (e: FormEvent) => {
    e.preventDefault();
    setAttaching(true)
    if(!stripe || !elements) return;
    const createSetupIntent = httpsCallable(functions, "setupIntent")
    const cardElement = elements.getElement(CardElement);
    const {data: si} = await createSetupIntent() as HttpsCallableResult<SetupIntent>
    const {error} = await stripe.confirmCardSetup(si.client_secret!,{
      payment_method: {
        card: cardElement!,
      }
    })
    if(error) {
      toast.error("Error: "+error.message)
    }else {
     updateWallet()
     toast.success("カードを保存しました！")
    }
    setAttaching(false)
  }
  if(walletLoading){
    return  <div className='py-14 w-full flex justify-center'><CircularProgress/></div> 
  }
  return <>
    {!wallet ? 
      <div className="bg-slate-100 px-6 py-6 mt-6 rounded-t-lg max-w-xl mx-auto" >
        <h2 className='px-4 text-lg font-bold text-center mb-4'>支払いカードを登録する</h2>
        <Box sx={{"& .StripeElement":{border: "solid 2px #5c93bb2b",borderRadius:"0.5rem"}, "& .StripeElement--focus":{border: "2px solid #3ea8ff !important"}}}>
          <CardElement className='bg-white py-3 px-3 hover:border-2 hover:border-blue-300'/>
        </Box>
        <div className='mt-4 flex flex-col gap-2'>
          <div className='flex flex-row items-center gap-1'>
            <Check fontSize='small'/>
            <Typography variant="body1">
              カード情報はStripeにのみ送信・保存されます
            </Typography>
          </div>
          <div className='flex flex-row items-center gap-1'>
            <Check fontSize='small'/>
            <Typography variant="body1">
              著者は購入者のユーザー名を知ることができます
            </Typography>
          </div>
          <div className='flex flex-row items-center gap-1'>
            <Check fontSize='small'/>
            <Typography variant="body1">
              お支払いに関するQ & A
            </Typography>
          </div>
        </div>
        <div className='w-full text-center mt-4'>
          <LoadingButton className='font-bold text-white' variant='contained' disableElevation onClick={attachCard} loading={attaching}>登録する</LoadingButton>
        </div>
      </div> : 
      <div className="px-4 py-4">
        <h2 className='px-4 text-lg font-bold text-center mb-4'>登録カード</h2>
        <div className="px-4 py-6 bg-slate-100 max-w-xs rounded-lg shadow-md mx-auto">
          <div className='flex flex-row align-middle justify-start'>
            <div className='bg-slate-400 text-slate-100 px-2 py text-lg font-bold mr-4 rounded-md'>{wallet.card?.brand}</div>
            <Typography className='font-bold text-md text-slate-400'>**** **** **** {wallet.card?.last4}</Typography>
          </div>
          <div className='text-slate-400 text-sm mt-4'>有効期限 : {wallet.card?.exp_year}年{wallet.card?.exp_month}月</div>
          <div className='flex justify-end mt-2 '>
            <NeumoLoadingButton onClick={detachCard} loading={attaching}>削除する</NeumoLoadingButton>
          </div>
        </div>
      </div>
    }
    <Toaster position='bottom-right' toastOptions={{style:{background:"black", color:"white"}}} containerStyle={{ bottom: 60, right:50}}/>
  </>
}

export default Billing