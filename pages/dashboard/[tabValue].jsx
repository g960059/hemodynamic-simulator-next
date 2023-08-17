import React, { useRef, useState, useEffect,} from 'react'
import {Box, NoSsr, Grid, Tab,Tabs, Divider,Typography,Stack,Tooltip, Button, Avatar, Menu, IconButton, useMediaQuery} from '@mui/material'
import {Add,FavoriteBorder,ExpandMore,EditOutlined,FeedOutlined,EventNoteOutlined,MenuBookOutlined,PlayArrowOutlined, StoreOutlined, PaidOutlined} from "@mui/icons-material";
import {user$, articles$,cases$,books$, purchases$, salesDetail$, payableHistory$, withdrawals$, favorites$} from '../../src/hooks/usePvLoop'
// import { makeStyles } from '@mui/styles';
import {useTranslation} from '../../src/hooks/useTranslation'
import { FaintNeumoIconButton } from '../../src/components/StyledComponents';
import { useRouter } from 'next/router'
import {formatDateDiff, nanoid} from "../../src/utils/utils"
import {useObservable} from "reactfire"
import Layout from '../../src/components/layout'
import DeleteMenuItemWithDialog from "../../src/components/DeleteMenuItemWithDialog";
import { doc, deleteDoc, writeBatch, collection, getDocs, addDoc, serverTimestamp } from "firebase/firestore";
import {db} from "../../src/utils/firebase";
import isEqual from "lodash/isEqual"
import clsx from 'clsx';
import { format, formatDistanceToNow } from 'date-fns';
import Image from 'next/image';
import Link from 'next/link';
import { ja } from 'date-fns/locale';

// const useStyles = makeStyles((theme) =>(
//   {
//     neumoButton: {
//       transition: "background-color 250ms cubic-bezier(0.4, 0, 0.2, 1) 0ms, box-shadow 250ms cubic-bezier(0.4, 0, 0.2, 1) 0ms, border-color 250ms cubic-bezier(0.4, 0, 0.2, 1) 0ms, color 250ms cubic-bezier(0.4, 0, 0.2, 1) 0ms",
//       color: "rgb(69, 90, 100)",
//       boxShadow: "0 2px 4px -2px #21253840",
//       backgroundColor: "white",
//       border: "1px solid rgba(92, 147, 187, 0.17)",
//       "&:hover":{
//         backgroundColor: "rgba(239, 246, 251, 0.6)",
//         borderColor: "rgb(207, 220, 230)"
//       }
//     },
//     bookCover: {
//       boxShadow: "-6px 6px 10px -2px #001b4440, 0 0 3px #8f9aaf1a",
//       position: "relative",
//       maxWidth: "100%",
//       width: "100px",
//       height: "140px",
//       "&::after": {
//         bottom: 0,
//         content: '""',
//         height: "100%",
//         left: "0",
//         position: "absolute",
//         width: "100%",
//         borderRadius: "5px",
//         background: "linear-gradient(-90deg,#fff0,#ffffff1a 80%,#ffffff4d 95%,#fff6 96.5%,#cbcbcb14 98%,#6a6a6a1a)",
//       }
//     }
//   })
// );

const DashBoard = React.memo(() => {
  const t = useTranslation();
  const router = useRouter()
  const user = useObservable("user",user$)
  const cases = useObservable("cases", cases$);
  const articles = useObservable("articles", articles$);
  const books = useObservable("books",books$);
  const purchases = useObservable("purchases",purchases$);
  const sales = useObservable(`sales`,salesDetail$)
  const payableHistory = useObservable(`payable_history`,payableHistory$)
  const withdrawals = useObservable(`withdrawals`,withdrawals$)
  const favorites = useObservable(`favorites`, favorites$)

  const [tabValue, setTabValue] = useState(router.query.tabValue || "cases");
  const isUpMd = useMediaQuery((theme) => theme.breakpoints.up('md'));

  const createWithdrawalRequset = async () => {
    if(user.data?.bank && user.data?.branch && user.data?.account_number && user.data?.account_type && user.data?.beneficiary_name){
      await addDoc(collection(db,'users/'+user.data?.uid+'/withdrawals'),{uid: user.data?.uid, amount: user.data?.balance_payable, status: 'pending',timestamp: serverTimestamp()})
    }else{
      router.push('/settings/bank_account?message=bank_account_required')
    }
  }

  const createNewCase =  async () => {
    const caseId = nanoid()
    router.push({pathname:`/cases/${caseId}`,query:{newItem:true}})
  }
  const createNewArticle =  async () => {
    const articleId = nanoid()
    router.push({pathname:`/articles/${articleId}`,query:{newItem:true}})
  }
  const createNewBook =  async () => {
    const bookId = nanoid()
    router.push({pathname:`/books/${bookId}`,query:{newItem:true}})
  }
  const removeCase = (caseId) => async ()=> {
    await deleteDoc(doc(db, "users", user.data.uid,"cases",caseId));
  }
  const removeArticle = (articleId) => async ()=> {
    await deleteDoc(doc(db, "users", user.data.uid,"articles",articleId));
  }
  const removeBook = (bookId) => async ()=> {
    const chaptersSnap = await getDocs(collection(db,'users',user.data.uid,'books',bookId,'chapters'));
    const batch = writeBatch(db);
    batch.delete(doc(db, "users", user.data.uid,"books",bookId));
    chaptersSnap.forEach(chapterDoc => {
      batch.delete(doc(db, "users", user.data.uid,"books",bookId,"chapters",chapterDoc.id));
    })
    await batch.commit();
  }

  useEffect(() => {
    setTabValue(router.query.tabValue || "cases")
  }, [router.query.tabValue]);

  return <div className='w-full'>
    <Divider flexItem sx={{borderColor:"#5c93bb2b"}}/>
    <div className='w-full max-w-7xl mx-auto md:mt-5'>
      {/* { !isUpMd &&
        <Stack direction="row" width={1} justifyContent="center" alignItems="center" spacing={2} pt={3} className="overflow-x-scroll">
          <Stack onClick={()=>{setTabValue("cases")}} className={`items-center cursor-pointer rounded-xl px-4 py-2 ${tabValue==="cases" ? "bg-blue-50 text-blue-500" : "text-slate-400"}`}>
            <EventNoteOutlined/>
            <Typography variant='subtitle2' fontWeight="bold">Cases</Typography>
          </Stack>
          <Stack onClick={()=>{setTabValue("articles")}} className={`items-center cursor-pointer rounded-xl px-4 py-2 ${tabValue==="articles" ? "bg-blue-50 text-blue-500" : "text-slate-400"}`}>
            <FeedOutlined/>
            <Typography variant='subtitle2' fontWeight="bold">Articles</Typography>
          </Stack>
          <Stack onClick={()=>{setTabValue("books")}} className={`items-center cursor-pointer rounded-xl px-4 py-2 ${tabValue==="books" ? "bg-blue-50 text-blue-500" : "text-slate-400"}`}>
            <MenuBookOutlined/>
            <Typography variant='subtitle2' fontWeight="bold">Books</Typography>
          </Stack>
          <Stack onClick={()=>{setTabValue("purchases")}} className={`items-center cursor-pointer rounded-xl px-4 py-2 ${tabValue==="purchases" ? "bg-blue-50 text-blue-500" : "text-slate-400"}`}>
            <StoreOutlined/>
            <Typography variant='subtitle2' fontWeight="bold">Purchases</Typography>
          </Stack>                    
          <Stack onClick={()=>{setTabValue("favorites")}} className={`items-center cursor-pointer rounded-xl px-4 py-2 ${tabValue==="favorites" ? "bg-blue-50 text-blue-500" : "text-slate-400"}`}>
            <FavoriteBorder/>
            <Typography variant='subtitle2' fontWeight="bold">Favorites</Typography>
          </Stack>
          <Stack onClick={()=>{setTabValue("sales")}} className={`items-center cursor-pointer rounded-xl px-4 py-2 ${tabValue==="sales" ? "bg-blue-50 text-blue-500" : "text-slate-400"}`}>
            <PaidOutlined/>
            <Typography variant='subtitle2' fontWeight="bold">Sales</Typography>
          </Stack>          
        </Stack>
      }
      <div className='w-full px-4 md:px-8 lg:px-12'>
        {isUpMd && <Stack pt={3} sx={{position:"fixed"}}>
            <Typography variant='h6' fontWeight="bold" onClick={()=>{setTabValue("cases")}} className={`font-bold flex items-center mt-1 mb-2 pl-6 pr-8 py-2 cursor-pointer rounded-2xl  ${tabValue==="cases" ? "bg-blue-50 text-blue-500" : "text-slate-400"}`} ><EventNoteOutlined sx={{mr:1}}/> Cases</Typography>
            <Typography variant='h6' fontWeight="bold" onClick={()=>{setTabValue("articles")}} className={`font-bold flex items-center mt-1 mb-2 pl-6 pr-8 py-2 cursor-pointer rounded-2xl  ${tabValue==="articles" ? "bg-blue-50 text-blue-500" : "text-slate-400"}`}><FeedOutlined sx={{mr:1}}/> Articles</Typography>
            <Typography variant='h6' fontWeight="bold" onClick={()=>{setTabValue("books")}} className={`font-bold flex items-center mt-1 mb-2 pl-6 pr-8 py-2 cursor-pointer rounded-2xl  ${tabValue==="books" ? "bg-blue-50 text-blue-500" : "text-slate-400"}`}><MenuBookOutlined sx={{mr:1}}/> Books</Typography>
            <Typography variant='h6' fontWeight="bold" onClick={()=>{setTabValue("purchases")}} className={`font-bold flex items-center mt-1 mb-2 pl-6 pr-8 py-2 cursor-pointer rounded-2xl  ${tabValue==="purchases" ? "bg-blue-50 text-blue-500" : "text-slate-400"}`}><StoreOutlined sx={{mr:1}}/> Purchases</Typography>
            <Typography variant='h6' fontWeight="bold" onClick={()=>{setTabValue("favorites")}} className={`font-bold flex items-center mt-1 mb-2 pl-6 pr-8 py-2 cursor-pointer rounded-2xl  ${tabValue==="favorites" ? "bg-blue-50 text-blue-500" : "text-slate-400"}`}><FavoriteBorder sx={{mr:1}}/> Favorites</Typography>
            <Typography variant='h6' fontWeight="bold" onClick={()=>{setTabValue("sales")}} className={`font-bold flex items-center mt-1 mb-2 pl-6 pr-8 py-2 cursor-pointer rounded-2xl  ${tabValue==="sales" ? "bg-blue-50 text-blue-500" : "text-slate-400"}`}><PaidOutlined sx={{mr:1}}/> Sales</Typography>
        </Stack>}
        <Box p={isUpMd && 2} width={1} pl={isUpMd && 35 } py={2}>
          {user.data?.uid  && tabValue==="cases" && <>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <div className='text-3xl font-bold mt-2 mb-4'>Cases</div>
              {cases?.data?.length>0 && <Button onClick={createNewCase} disableElevation size="small" className={classes.neumoButton} startIcon={<Add/>}>{t["Add"]}</Button>}
            </Stack>
            <Stack width={1} >
              {cases?.data?.sort((a,b)=>a.updatedAt<b.updatedAt ? 1 : -1).map(c => (
                <Box>
                  <CaseListItem caseData={c} removeCase={removeCase(c.id)}/>
                </Box>
              ))}
              {!cases?.data || cases?.data?.length==0 && 
                <div>
                  <Typography variant="h6" sx={{textAlign:"center", my:3,fontWeight:"bold"}} className="text-slate-500">最初の症例を作成しよう</Typography>
                  <Button onClick={createNewCase} color="primary" variant='contained' disableElevation className='font-bold text-white mx-auto block'>新しく作成</Button>
                </div>
              }
            </Stack>
          </>}
          {user.data?.uid  && tabValue==="articles" && <>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <div className='text-3xl font-bold mt-2 mb-4'>Articles</div>
              {
                articles?.data?.length>0 && (<Button onClick={createNewArticle} disableElevation size="small" className={classes.neumoButton} startIcon={<Add/>}>{t["Add"]}</Button>)
              }
            </Stack>
            <Stack width={1} >
              {articles?.data?.sort((a,b)=>a.updatedAt<b.updatedAt ? 1 : -1).map(a => (
                <Box>
                  <ArticleListItem articleData={a} removeArticle={removeArticle(a.id)}/>
                </Box>
              ))}
              {!articles?.data || articles?.data?.length==0 && 
                <div>
                  <Typography variant="h6" sx={{textAlign:"center", my:3,fontWeight:"bold"}} className="text-slate-500">最初の記事を作成しよう</Typography>
                  <Button onClick={createNewArticle} color="primary" variant='contained' disableElevation className='font-bold text-white mx-auto block'>新しく作成</Button>
                </div>
              }              
            </Stack>
          </>}
          {user.data?.uid  && tabValue==="books" && <>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <div className='text-3xl font-bold mt-2 mb-4'>Books</div>
              {
                books?.data?.length>0 && (<Button onClick={createNewBook} disableElevation size="small" className={classes.neumoButton} startIcon={<Add/>}>{t["Add"]}</Button>)
              }
            </Stack>
            <Stack width={1} >
              {books?.data?.sort((a,b)=>a.updatedAt<b.updatedAt ? 1 : -1).map(a => (
                <Box>
                  <BookListItem bookData={a} removeBook={removeBook(a.id)}/>
                </Box>
              ))}
              {!books?.data || books?.data?.length==0 && 
                <div>
                  <Typography variant="h6" sx={{textAlign:"center", my:3,fontWeight:"bold"}} className="text-slate-500">最初の本を作成しよう</Typography>
                  <Button onClick={createNewBook} color="primary" variant='contained' disableElevation className='font-bold text-white mx-auto block'>新しく作成</Button>
                </div>
              }                   
            </Stack>
          </>}
          {
            user.data?.uid  && tabValue==="purchases" &&  <>
              <div className='w-full'>
                <div className='text-3xl font-bold mt-2 mb-4'>購入した本</div>
                <div className='grid grid-cols-4 gap-4 mt-8'>
                  {
                    purchases?.data?.sort((a,b)=>a.timestamp<b.timestamp ? 1 : -1).map(({bookData,timestamp, authorData}) => (
                      <div>
                        {bookData?.coverURL ?
                          <div className="rounded-md cursor-pointer book-cover w-[140px] h-[195px]" onClick={()=>{router.push(`/${bookData.userId}/books/${bookData.id}`)}}>
                            <img src={bookData?.coverURL} width={140} height={195}  className="rounded-md" />
                          </div>  : (
                          <div className="w-56 h-72 bg-blue-50 flex justify-center items-center rounded-md shadow-md cursor-pointer" onClick={()=>{router.push(`/${bookData.userId}/books/${bookData.id}`)}}>
                            <div className='font-bold text-3xl text-slate-400'>表紙</div>
                          </div>
                        )}
                        <div className='font-bold text-sm mt-2 cursor-pointer' onClick={()=>{router.push(`/${bookData.userId}/books/${bookData.id}`)}}>{bookData?.name || "無題の本"}</div>
                        <div className='flex flex-row items-center mt-2'>
                          {authorData.photoURL ?
                            <div className="h-8 w-8 rounded-full overflow-hidden cursor-pointer" onClick={()=>{router.push(`/${authorData.userId}`)}}>
                              <img src={authorData.photoURL} height="28" width="28"/>
                            </div> :  
                            <div className="flex items-center justify-center h-7 w-7 rounded-full bg-slate-500 cursor-pointer" onClick={()=>{router.push(`/${authorData.userId}`)}}>
                              <span className="text-xs font-medium leading-none text-white">{authorData?.displayName[0]}</span>
                            </div>
                          }
                          <a href={`/${authorData?.userId}`} className='text-sm font-medium no-underline hover:no-underline text-slate-500 hover:text-slate-800 ml-2'>{authorData?.displayName}</a> 
                        </div>
                      </div>
                    ))
                  }
                </div>
                {(!purchases?.data || purchases?.data?.length==0) && 
                  <div>
                    <Typography variant="h6" sx={{textAlign:"center", my:3,fontWeight:"bold"}} className="text-slate-500">まだ購入した本はありません</Typography>
                  </div>
                }                      
              </div>
            </>
          }
          {
            user.data?.uid  && tabValue==="favorites" &&  <>
              <div className='w-full'>
                <div className='text-3xl font-bold mt-2 mb-4'>お気に入り</div>
                <div className='grid grid-cols-2 gap-4 mt-8'>
                  {
                    favorites?.data?.sort((a,b)=>a?.timestamp<b?.timestamp ? 1 : -1).map(({bookData: book,articleData: article,timestamp, authorData}) => <div>
                        {book &&
                            <div key={book.id} className="w-full flex flex-row pb-5 md:pb-0">
                              { book?.coverURL ? <Link href={`/${book?.userId}/books/${book?.id}`}>
                                  <a className="cursor-pointer book-cover w-[100px] h-[140px] hover:opacity-70 transition-opacity duration-200 no-underline hover:no-underline">
                                    <img src={book?.coverURL} width={100} height={140} className="object-cover rounded" />
                                  </a>
                                </Link> : 
                                <div className="bg-blue-100 shadow-md cursor-pointer book-cover w-[100px] h-[140px] hover:opacity-70 transition-opacity duration-200 no-underline hover:no-underline">
                                  <div className='flex justify-center items-center w-full h-full' style={{width:"100px"}}>
                                    <div className='font-bold text-xl text-slate-400'>{book?.name || "無題の本"}</div>
                                  </div>
                                </div>
                              }                   
                              <div className='ml-3 flex flex-col'>
                                <Link href={`/${book?.userId}/books/${book?.id}`} >
                                  <a className='font-bold text-slate-800 no-underline hover:no-underline'>
                                    {book?.name || "無題の記事"}
                                  </a>
                                </Link>
                                {book?.premium && <div className='text-blue-500 font-bold'>￥ {book?.amount}</div> }
                                <div style={{flexGrow:1}}/>
                                <div className='flex flex-row items-center'>
                                  {book.photoURL ?
                                    <div className="h-8 w-8 rounded-full overflow-hidden" onClick={()=>{router.push(`/${book.userId}`)}}>
                                      <img src={book.photoURL} height="32" width="32"/>
                                    </div> :  
                                    <div className="flex items-center justify-center h-8 w-8 rounded-full bg-slate-500" onClick={()=>{router.push(`/${book.userId}`)}}>
                                      <span className="text-xs font-medium leading-none text-white">{book?.displayName[0]}</span>
                                    </div>
                                  }
                                  <div className='ml-2 text-slate-500'>
                                    <Link href={`/${book?.userId}`}><a className='text-sm font-medium no-underline hover:no-underline text-slate-500'>{book?.displayName}</a></Link>
                                    <div className='flex flex-row items-center justify-between'>
                                      <span className=' text-sm font-medium '>{ formatDateDiff(new Date(), new Date(book?.updatedAt?.seconds * 1000)) } </span>
                                      <span className=' text-sm ml-3 flex flex-row '>
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                          <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                        </svg>
                                        <span className=' text-sm ml-0.5'>{book?.heartCount || 0}</span>
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                        }
                        {
                          article &&
                          <div key={article.id} className="w-full flex flex-row pb-5 md:pb-0">
                            <Link href={`/${article?.userId}/articles/${article?.id}`} >
                              <a className= "text-slate-900 hover:opacity-70 transition-opacity duration-200 cursor-pointer w-24 h-24 no-underline hover:no-underline">
                                {
                                  article?.coverURL ? <Image src={article?.coverURL} width={96} height={96}/> :
                                  <div className='bg-blue-50 rounded-lg flex justify-center items-center w-24 h-24'>
                                    <span className='text-4xl'>{article?.emoji}</span>
                                  </div>
                                }
                              </a>
                            </Link>
                            <div className='ml-3'>
                              <Link href={`/${article?.userId}/articles/${article?.id}`} >
                                <a className='font-bold text-slate-800 no-underline hover:no-underline'>
                                  {article?.name || "無題の記事"}
                                </a>
                              </Link>
                              <div className='flex flex-row items-center'>
                                {article.photoURL ?
                                  <div className="h-8 w-8 rounded-full overflow-hidden" onClick={()=>{router.push(`/${article.userId}`)}}>
                                    <Image src={article.photoURL} height="32" width="32"/>
                                  </div> :  
                                  <div className="flex items-center justify-center h-8 w-8 rounded-full bg-slate-500" onClick={()=>{router.push(`/${article.userId}`)}}>
                                    <span className="text-xs font-medium leading-none text-white">{article?.displayName[0]}</span>
                                  </div>
                                }
                                <div className='ml-2 text-slate-500'>
                                  <Link href={`/${article?.userId}`}>
                                    <a className='text-sm font-medium no-underline hover:no-underline text-slate-500'>
                                      {article?.displayName}
                                    </a>
                                  </Link>
                                  <div className='flex flex-row items-center justify-between'>
                                    <span className=' text-sm font-medium '>{ formatDateDiff(new Date(), new Date(article?.updatedAt?.seconds * 1000)) } </span>
                                    <span className=' text-sm ml-3 flex flex-row '>
                                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                      </svg>
                                      <span className=' text-sm ml-0.5'>{article?.heartCount || 0}</span>
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        }
                      </div>
                    )
                  }
                  {
                    favorites.length === 0 &&
                      <div className='text-center text-slate-900'>
                        まだお気に入りはありません
                      </div>
                  }  
                </div>
              </div>
          </>}
          {
            user.data?.uid  && tabValue==="sales" && <>
              <div className='w-full'>
                <div className='text-3xl font-bold mt-2 mb-4'>Sales</div>
                <div className='px-4 py-6'>
                  <div className='md:grid md:grid-cols-2 md:gap-6'>
                    <div className="px-6 py-6 bg-slate-100 w-full rounded-xl mx-auto mb-6 md:mb-0">
                      <div className='flex'>
                        <div className="text-sm flex items-center">
                          受取可能な合計残高
                          <span className='text-xs text-slate-500 align-middle ml-3'>(確定額)</span>
                        </div>
                      </div>
                      <h2 className="text-2xl font-bold mt-4 mb-6">￥{user.data?.balance_payable || 0}</h2>
                      { withdrawals.data?.some(({status})=>status=='pending') ? 
                        <Button variant="contained" className='font-bold text-white' disabled>出金申請済み</Button>:
                        <Button variant="contained" className='font-bold text-white' disabled={(user.data?.balance_payable ||0) < 1000} onClick={createWithdrawalRequset}>出金申請をする</Button>
                      }
                    </div>
                    <div className="px-6 py-6 bg-slate-100 w-full rounded-xl mx-auto">
                      <div className='flex'>
                        <div className="text-sm flex items-center">
                          {format(new Date(),'yyyy年M月の収益')}
                          <span className='text-xs text-slate-500 align-middle ml-3'>(見込み額)</span>
                        </div>
                      </div>
                      <h2 className="text-2xl font-bold mt-4 mb-6">￥{user.data?.balance || 0}</h2>
                    </div>            
                  </div>
                  <div className="w-full rounded-xl mx-auto mt-8 overflow-hidden border-solid border border-slate-200">
                    <div className='px-6 py-4 bg-slate-100 w-full text-sm'>
                      収益に関わるイベント
                    </div>
                    <div className='py-4'>
                      {
                        sales.data?.sort((a,b)=>a.saleData.timestamp < b.saleData.timestamp ? 1 : -1)?.map(sale => (
                          <div key={sale.saleData.id}>
                            <div className='flex flex-row items-center px-6 py-2'>
                              <div className={`avatar ${!sale.customerData.photoURL && "placeholder"}`}>
                                <div className={`w-7 h-7 rounded-full ${!sale.customerData.photoURL && "bg-slate-100 text-slate-500 flex justify-center items-center"}`}>
                                  {sale.customerData.photoURL ? <Image src={sale.customerData.photoURL} layout="fill"/> :
                                    <span className='text-xs'>{sale.customerData?.displayName && sale.customerData?.displayName[0].toUpperCase()}</span>
                                  }
                                </div>
                              </div>
                              <div className='text-sm ml-3'><span className='font-bold'>{sale.customerData.displayName}</span>さんが<span className='font-bold'>{sale?.productData?.name}</span>を￥{sale.saleData.amount}で購入しました✨ <span className='text-slate-400 text-xs ml-3'>{formatDistanceToNow(new Date(sale.saleData.timestamp.seconds*1000),{locale: ja})}前</span></div>
                            </div>
                          </div>
                        )) || <div className='text-center text-slate-400 text-sm'>まだ商品は購入されておりません</div>
                      }
                    </div>
                  </div>
                  <div className="w-full rounded-xl mx-auto mt-8 overflow-hidden border-solid border border-slate-200">
                    <div className='px-6 py-4 bg-slate-100 w-full text-sm'>
                      月別の確定した受取金額
                    </div>
                    <div className='py-4'>
                      {
                        payableHistory.data?.sort((a,b)=>a.createdAt.seconds < b.createdAt.seconds ? 1 : -1)?.map(payable => (
                          <div key={payable.id}>
                            <div className='flex flex-row items-center px-6 py-2'>
                              <div className='text-sm ml-3'>{format(payable.createdAt.toDate(), "yyyy年M月")}の収益は<span className='font-bold'>￥{payable.amount}</span>でした🚀</div>
                            </div>
                          </div>
                        ))
                      }
                      {
                        (!payableHistory.data || payableHistory.data?.length==0) && <div className='text-center text-slate-400 text-sm'>まだ確定した売上月はありません</div>
                      }
                    </div>
                  </div>
                  <div className="w-full rounded-xl mx-auto mt-8 overflow-hidden border-solid border border-slate-200">
                    <div className='px-6 py-4 bg-slate-100 w-full text-sm'>
                    出金履歴
                    </div>
                    <div className='py-4'>
                      {
                        withdrawals.data?.sort((a,b)=>a.createdAt.seconds < b.createdAt.seconds ? 1 : -1)?.map(withdrawal => (
                          <div key={withdrawal?.id}>
                            <div className='flex flex-row items-center px-6 py-2'>
                              <div className='text-sm ml-3'>{format(withdrawal.timestamp?.toDate(), "yyyy年M月d日")} <span className='font-bold ml-2'>￥{withdrawal.amount}</span>の出金を申請中です</div>
                            </div>
                          </div>
                        ))
                      }
                      {
                        (!withdrawals.data || withdrawals.data?.length==0) && <div className='text-center text-slate-400 text-sm'>まだ出金申請はありません</div>
                      }
                    </div>
                  </div>          
                </div>
              </div> 
            </>
          }                      
        </Box>      
      </div> */}
    </div>
  </div>
})

DashBoard.getLayout = (page) => {
  return (
    <Layout>
      {page}
    </Layout>
  )
}

export default DashBoard


// export const CaseListItem = ({caseData: c, removeCase}) => {
//   const router = useRouter()
//   const [caseMenuAnchorEl, setCaseMenuAnchorEl] = useState(null);
//   const selectNewCase = (id)=>() => {
//     router.push(`/cases/${id}`)
//   }
//   return <Stack sx={{pb:2,pt:1.5, borderBottom:"1px solid #5c93bb2b"}}>
//     <Stack direction="row" alignItems="center">
//       <div onClick={selectNewCase(c.id)} className={`font-bold text-base md:text-lg flex-grow cursor-pointer ${!c.name && "text-slate-500"}`}>{c.name || "無題の症例"}</div>
//       <Tooltip title="編集する">
//         <FaintNeumoIconButton  onClick={selectNewCase(c.id)} size="small"  className='h-8 w-8'><EditOutlined/></FaintNeumoIconButton>
//       </Tooltip>
//       <FaintNeumoIconButton  onClick={e=>{setCaseMenuAnchorEl(e.currentTarget)}} size="small" sx={{ml:{xs:.5, md:1},backgroundColor:"transparent !important"}}><ExpandMore/></FaintNeumoIconButton>
//       <Menu anchorEl={caseMenuAnchorEl} open={Boolean(caseMenuAnchorEl)} onClose={()=>{setCaseMenuAnchorEl(null)}} MenuListProps={{dense:true}}>
//         <DeleteMenuItemWithDialog onDelete={()=>{removeCase();setCaseMenuAnchorEl(null)}} message={"症例「"+(c?.name||"無題の症例") +"」を削除しようとしています。\nこの操作は戻すことができません。"} onClose={()=>{setCaseMenuAnchorEl(null)}} />
//       </Menu>
//     </Stack>
//     <Stack direction="row" sx={{justifyContent:"flex-start",alignItems:"center", mt:.8}}>
//       <Box sx={{mr:2,alignItems:"center",justifyContent:"center",display:"flex", border:"1px solid",borderColor: (c.visibility =="public" ? '#3ea8ff': "#d6e3ed"), borderRadius:"3px",padding:".1em .35em"}}><Typography  fontSize="11px" fontWeight='bold' color={c.visibility =="public" ? "primary" : 'secondary'}>{c.visibility =="public" ? "公開中" : "非公開"}</Typography></Box>
//       <Typography  variant="caption" sx={{color:"#6e7b85"}}>{formatDateDiff(new Date(),c.updatedAt?.toDate()) + (isEqual(c.updatedAt,c.createdAt) ? "に作成":"に更新")}</Typography>
//     </Stack>
//   </Stack>
// }

// export const ArticleListItem = ({articleData: c, removeArticle}) => {
//   const router = useRouter()
//   const [anchorEl, setAnchorEl] = useState(null);
//   const selectNewArticle = (id)=>() => {
//     router.push(`/articles/${id}`)
//   }
//   return <Stack sx={{pb:2,pt:1.5, borderBottom:"1px solid #5c93bb2b"}}>
//     <Stack direction="row" alignItems="center">
//       <div onClick={selectNewArticle(c.id)} className={`font-bold text-base md:text-lg flex-grow cursor-pointer ${!c.name && "text-slate-500"}`}>{c.name || "無題の記事"}</div>
//       <Tooltip title="編集する">
//         <FaintNeumoIconButton onClick={selectNewArticle(c.id)} size="small" className='h-8 w-8'><EditOutlined/></FaintNeumoIconButton>
//       </Tooltip>
//       <FaintNeumoIconButton  onClick={e=>{setAnchorEl(e.currentTarget)}} size="small" sx={{ml:{xs:.5, md:1},backgroundColor:"transparent !important"}}><ExpandMore/></FaintNeumoIconButton>
//       <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={()=>{setAnchorEl(null)}} MenuListProps={{dense:true}}>
//         <DeleteMenuItemWithDialog onDelete={()=>{removeArticle();setAnchorEl(null)}} message={"記事「"+(c?.name||"無題の記事") +"」を削除しようとしています。\nこの操作は戻すことができません。"} onClose={()=>{setAnchorEl(null)}} />
//       </Menu>
//     </Stack>
//     <Stack direction="row" sx={{justifyContent:"flex-start",alignItems:"center", mt:.8}}>
//       <Box sx={{mr:2,alignItems:"center",justifyContent:"center",display:"flex", border:"1px solid",borderColor: (c.visibility =="public" ? '#3ea8ff': "#d6e3ed"), borderRadius:"3px",padding:".1em .35em"}}><Typography  fontSize="11px" fontWeight='bold' color={c.visibility =="public" ? "primary" : 'secondary'}>{c.visibility =="public" ? "公開中" : "非公開"}</Typography></Box>
//       <Typography  variant="caption" sx={{color:"#6e7b85"}}>{formatDateDiff(new Date(),c.updatedAt?.toDate()) + (isEqual(c.updatedAt,c.createdAt) ? "に作成":"に更新")}</Typography>
//     </Stack>
//   </Stack>
// }

// export const BookListItem = ({bookData: c, removeBook}) => {
//   const router = useRouter()
//   const classes = useStyles()
//   const [anchorEl, setAnchorEl] = useState(null);
//   const selectNewBook = (id)=>() => {
//     router.push(`/books/${id}`)
//   }
//   return (
//     <div className="flex flex-row justify-center py-4 border-0 border-b border-solid border-slate-200">
//       { c?.coverURL ? <div className={clsx("rounded-md cursor-pointer hidden md:block",classes.bookCover) }>
//           <img src={c?.coverURL} width={100} height={140} className="object-cover rounded" />
//         </div> : 
//         <div className={clsx("bg-blue-50 rounded-md shadow-md cursor-pointer",classes.bookCover)}>
//           <div className='flex justify-center items-center w-full h-full' style={{width:"100px"}}>
//             <div className='font-bold text-xl text-slate-400'>{c.name}</div>
//           </div>
//         </div>
//       }          
//       <div className='flex flex-col w-full md:pl-6'>
//         <Stack direction="row" alignItems="center">
//           <div onClick={selectNewBook(c.id)} className={`font-bold text-base md:text-lg flex-grow cursor-pointer ${!c.name && "text-slate-500"}`}>{c.name || "無題の本"}</div>
//           <Tooltip title="表示を確認する">
//             <FaintNeumoIconButton onClick={()=>{router.push(`/${c?.userId}/books/${c.id}`)}} size="small" className='h-8 w-8'><PlayArrowOutlined/></FaintNeumoIconButton>
//           </Tooltip>          
//           <Tooltip title="編集する">
//             <FaintNeumoIconButton onClick={selectNewBook(c.id)} size="small"  className='h-8 w-8 ml-2 md:ml-4'><EditOutlined/></FaintNeumoIconButton>
//           </Tooltip>
//           <FaintNeumoIconButton  onClick={e=>{setAnchorEl(e.currentTarget)}} size="small" sx={{ml:{xs:.5, md:1},backgroundColor:"transparent !important"}}><ExpandMore/></FaintNeumoIconButton>
//           <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={()=>{setAnchorEl(null)}} MenuListProps={{dense:true}}>
//             <DeleteMenuItemWithDialog onDelete={()=>{removeBook();setAnchorEl(null)}} message={"本「"+(c?.name||"無題の本") +"」を削除しようとしています。\nこの操作は戻すことができません。"} onClose={()=>{setAnchorEl(null)}} />
//           </Menu>
//         </Stack>
//         <Stack direction="row" sx={{justifyContent:"flex-start",alignItems:"center", mt:.8}}>
//           <Box sx={{mr:1,alignItems:"center",justifyContent:"center",display:"flex", border:"1px solid",borderColor: (c.visibility =="public" ? '#3ea8ff': "#d6e3ed"), borderRadius:"3px",padding:".1em .35em"}}><Typography  fontSize="11px" fontWeight='bold' color={c.visibility =="public" ? "primary" : 'secondary'}>{c.visibility =="public" ? (c.premium ? "販売中": "無料公開中") : "非公開"}</Typography></Box>
//           {c.premium && <Typography variant="body2" fontWeight='bold' color= "primary" sx={{mr:2}}>{c.amount}円</Typography>}
//           <Typography  variant="caption" sx={{color:"#6e7b85"}}>{formatDateDiff(new Date(),c.updatedAt?.toDate()) + (isEqual(c.updatedAt,c.createdAt) ? "に作成":"に更新")}</Typography>
//         </Stack>
//       </div>
//     </div>
//   )
// }