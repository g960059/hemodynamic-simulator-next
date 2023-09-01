import { Button, Dialog, DialogContent, DialogContentText, Theme, Typography, useMediaQuery } from "@mui/material";
import { CardElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { PaymentIntent } from "@stripe/stripe-js";
import { getFunctions, httpsCallable, HttpsCallableResult } from "firebase/functions";
import { NextPage } from "next";
import Image from "next/image";
import { useRouter } from "next/router";
import { useState } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { useWallet } from "../hooks";
import { StyledAuth } from "../utils/firebase";
import toast, { Toaster } from 'react-hot-toast';
import { Box } from "@mui/system";
import { useTranslation } from "../hooks/useTranslation";
import { getAuth } from "firebase/auth";

interface Item {
  id:string;
  uid: string;
  userId: string;
  photoURL: string;
  displayName: string;
  amount: number;
  name: string;
}
type Props = {
  item: Item;
  size: "small" | "medium" | "large";
  fullWidth?: boolean;
}

const Checkout: NextPage<Props> = ({item, size="medium", fullWidth=false}) =>{
  const {wallet,setWallet,updateWallet} = useWallet();
  const auth = getAuth()
  const functions = getFunctions()
  const [user] = useAuthState(auth);
  const stripe = useStripe()
  const elements = useElements();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [loginDialogOpen, setLoginDialogOpen] = useState(false);
  const [loadingCheckout, setLoadingCheckout] = useState(false);
  const router = useRouter();
  const isUpMd = useMediaQuery((theme: Theme) => theme.breakpoints.up('md'));
  const t = useTranslation()

  const createPaymentIntent = httpsCallable(functions, "createPaymentIntent")

  const startPayment = async () => {
    setLoadingCheckout(true);
    if(!stripe || !elements || !user || !item) return;
    const {data: pi}= await createPaymentIntent({sellerId:item.uid,itemId:item.id}) as HttpsCallableResult<PaymentIntent>

    if(pi){
      const {paymentIntent, error} = await stripe?.confirmCardPayment(pi.client_secret!, {
        payment_method: wallet?.id ?? {card: elements?.getElement(CardElement)!},
        setup_future_usage: 'off_session',
      })!
      if(error){
        console.log(error.message)
        toast.error("Error: "+ error.message)
      }else if(paymentIntent && paymentIntent.status === 'succeeded'){
        toast.success("Payment succeeded")
        router.push(`/${item.userId}/books/${item.id}`)
      }
    }
    setLoadingCheckout(false)
  }

  return <>
    <Button onClick={()=>{
      if(user?.uid){
        setDialogOpen(true)
      }else{
        setLoginDialogOpen(true)
        }
      }} 
      variant='contained' color="primary" size={size} 
      className='font-bold md:w-full text-white' disableElevation fullWidth={fullWidth}>
        {item.amount}円で購入する
    </Button>
    <Dialog open={dialogOpen} onClose={()=>{setDialogOpen(false);updateWallet()}} maxWidth='sm' fullWidth fullScreen={!isUpMd}>  
      <DialogContent className="px-0 py-0  w-full" >
        <div className='bg-blue-50 px-5 py-4'>
          <div className='flex flex-row items-center justify-between'>
            <div className='flex items-center justify-between'>
              <div className={`avatar ${!item?.photoURL && "placeholder"}`}>
                <div className={`w-6 h-6 rounded-full ${!item?.photoURL && "bg-slate-100 text-slate-500 flex items-center justify-center border-solid border border-slate-300"}`}>
                  {item?.photoURL ? <Image src={item?.photoURL} layout="fill" alt="userPhoto"/> :
                    <span className='text-sm'>{item?.displayName && item?.displayName[0].toUpperCase()}</span>
                  }
                </div>
              </div>
              <span className="text-sm ml-2 align-middle py-0.5">{item?.displayName}さんの本を購入する</span>
            </div>
            <span className="text-slate-500 cursor-pointer bg-white rounded-full h-10 w-10 flex items-center justify-center hover:text-slate-900" onClick={()=>{setDialogOpen(false);updateWallet()}}>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </span>
          </div>
          <h3 className='font-bold text-lg mt-3'>{item?.name}</h3>
          <h3 className='font-bold text-blue-500 text-base mt-3'>お支払い金額: {item?.amount}円</h3>
        </div>
        {wallet ? <div>
          <h3 className='font-bold text-center text-sm my-4'>登録済みのクレジットカードでお支払い</h3>
          <div className="px-4 py-6 bg-slate-100 max-w-xs rounded-lg shadow-md mx-auto">
            <div className='flex flex-row align-middle justify-start'>
              <div className='bg-slate-400 text-slate-100 px-2 py text-lg font-bold mr-4 rounded-md'>{wallet?.card?.brand}</div>
              <h4 className='font-bold text-md text-slate-400'>**** **** **** {wallet?.card?.last4}</h4>
            </div>
            <div className='text-slate-400 text-sm mt-4'>有効期限 : {wallet?.card?.exp_year}年{wallet?.card?.exp_month}月</div>
            <div className='flex justify-end'>
              <button className='btn-neumorphic' onClick={()=>{setWallet(null)}}>変更する</button>
            </div>
          </div>
        </div>  
        :<form className="md:bg-slate-100 px-6 py-6 md:mt-6 max-w-lg mx-auto rounded-md">
          <h2 className='text-sm md:text-md  font-bold mb-4'>カード情報の入力</h2>
          <CardElement className='bg-base-100 py-3 px-3 border border-solid border-slate-200 rounded-md bg-white'/>
          <div className='mt-2'>
            <p className='text-sm text-slate-500 md:py-0.5 flex flex-row items-center'>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 stroke-primary inline-block" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              カード情報はStripeにのみ送信・保存されます
            </p>
            <p className='text-sm text-slate-500 md:py-0.5 flex flex-row items-center'>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 stroke-primary inline-block" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>                
              著者は購入者のユーザー名を知ることができます
            </p>
            <p className='text-sm text-slate-500 md:py-0.5 flex flex-row items-center'>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 stroke-primary inline-block" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>                
              お支払いに関するQ & A
            </p>
          </div>
        </form>                        
        }
        <div className='flex justify-center mt-5 md:py-8'>
          <Button variant="contained" className={`font-bold text-white ${loadingCheckout && "loading"}`} onClick={startPayment} disabled={loadingCheckout} disableElevation>本を購入する</Button>
        </div>
      </DialogContent>
    </Dialog> 
    <Dialog open={loginDialogOpen} onClose={()=>{setLoginDialogOpen(false)}} sx={{'& .firebaseui-idp-button':{borderRadius: "0.45em"}, '& .MuiDialog-paper':{borderRadius: '9px'},'& .MuiDialogContent-root':{maxWidth:"400px"}, '& .MuiBackdrop-root':{background:"rgba(0, 0, 0, 0.2)"}}}>
      <DialogContent>
        <Box width={1} display='flex' justifyContent='center' alignItems='center' sx={{mt:2,mb:3}}>
          <Image src="/HeaderIcon.png" width={40} height={40} alt="headerIcon"/>
          <Typography variant="h5" noWrap component="div" sx={{fontFamily: "GT Haptik Regular",fontWeight: 'bold', fontSize:{xs:'h6.fontSize',sm:'h5.fontSize'}}}>
            {t['Title']}
          </Typography>
        </Box>
        <DialogContentText variant="body2">
          循環動態シミュレーターで様々な病態や治療法への理解を深めていきましょう。
        </DialogContentText>
        <Box width={1} display='flex' justifyContent='center' alignItems='center' 
          sx={{"& .firebaseui-idp-button":{
            transition: "background-color 250ms cubic-bezier(0.4, 0, 0.2, 1) 0ms, box-shadow 250ms cubic-bezier(0.4, 0, 0.2, 1) 0ms, border-color 250ms cubic-bezier(0.4, 0, 0.2, 1) 0ms, color 250ms cubic-bezier(0.4, 0, 0.2, 1) 0ms",
            boxShadow: "rgb(0 0 0 / 10%) 0px 2px 4px -2px",
            backgroundColor: "#EFF6FB99",
            border: "1px solid rgba(92, 147, 187, 0.17)",
            "&:hover":{
                backgroundColor: "rgba(239, 246, 251, 0.6)",
                borderColor: "rgb(207, 220, 230)"
            },
            "& .firebaseui-idp-text":{
              fontSize: "1rem",
              color:"black"
            }
          }}}>
          <StyledAuth/>
        </Box>
        <DialogContentText sx={{mt:.5}} variant="body2">
          利用規約、プライバシーポリシーに同意したうえでログインしてください。
        </DialogContentText>
      </DialogContent>
    </Dialog>    
    <Toaster position='bottom-right' toastOptions={{style:{background:"black", color:"white"}}} containerStyle={{ bottom: 60, right:50}}/>
  </>
}

export default Checkout