import { useState, useEffect } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth , functions} from '../utils/firebase';
import { httpsCallable, HttpsCallableResult } from 'firebase/functions'
import { PaymentMethod } from '@stripe/stripe-js';

export const useWallet = () => {
  const [user] = useAuthState(auth);
  const [wallet, setWallet] = useState<PaymentMethod | null>(null);
  const [loading, setLoading] = useState(false);

  const getWallet = async ()=> {
    setLoading(true);
    if(user){
      const listPaymentMethods = httpsCallable(functions, "listPaymentMethods")
      const paymentMethod = await listPaymentMethods() as HttpsCallableResult<{data: PaymentMethod[]}>
      if(paymentMethod.data.data.length>0){
        setWallet(paymentMethod.data.data[0] as PaymentMethod)
      }else{
        setWallet(null)
      }
    }else{
      setWallet(null);
    }
    setLoading(false);
  }

  useEffect(() => {
    getWallet();
  }, [user]);
  
  return {wallet,updateWallet:getWallet, setWallet, loading};
}