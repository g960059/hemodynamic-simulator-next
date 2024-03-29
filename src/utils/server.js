import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

if (!getApps()?.length) {
  initializeApp({
    credential: cert({
      "type": "service_account",
      "project_id": "hemodynamic-simulator",
      "private_key_id": "048a018e361942d827a957496740f6731cf09f95",
      "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAoIBAQDMIknPwdc98ICp\nFZHyYMp5ymRQ8rpYm4MHCx86SIRI+usjcVfKXtFFowYZkTm0oyIuo7cb4B0cYeaQ\nRGqLlkD43Izc9dVtuCAbgBXMyg2iylrHnEBg4Y7RDvbyjtWlBsOHdkoaVBpagxkm\nuFxBzv0g56bBm8dtIzGyiDY1xaCtkBNsArB2+zt+N4h+HP2AYtGvB+pElJIAsUI4\nhY8ehlnt6aGqQgmc6gDdQA4IJl/QyaDoNYyp56idiViLfoMHsW7dguO6xLCWR7ix\nWNelynT0TzLVK07ceO9dZ7V1ERmo1l+2ubBBBcfDwPYDoqXCghP1gEtgXRWbanpt\nVl82douZAgMBAAECggEACMFzvwiGbe6x5g65ytah+KVYtiwjGAfbj+LHPR29JtA0\nY7nJ1TFJ8p2ydkhHXFse7TcydGyhcwUz+X4lv8T7FnGHTTbyJ5mdLvDIfpcwDIp3\naFZoYH9sO8VTjEXaHhDzNA070nNHChjTbFi+BEiXjODCw00mOaUnzYuQH7BRWwBe\nYpXTI4BIM+LN2ap7Ta1SdP1IDFQi3rGXyF81+ZYF6CoDlkFqXpZoay3a4Q/vKiF0\nuFucs/25VQ+BgI3EstgqYU6gb4UicoAJ9wv2abEmT/gR9tdzSF8hgJ0bHY9CKwrp\nU+6y+mxqiHPcagBhyLuMIzh4IM7vedqrWnXTzuCn8QKBgQDwEy7plgpp9I4iB59l\nX1LvK4j+qAjzCv9CngtXJuEjLlSsiMt1Wl4nuHK3ox6BwPCAl5PiNu2lFtVRqkru\nkgFwDEclQ23MwFjudjnUndu38oYHzijhJHeFARmGh5sRfI3/fEuaSoRh/Yc1AL43\nALZuT7q+y5mWNTB4PHhfemPA/QKBgQDZrMaBc/tRkWbxTZHQlB5aVZ6zXYHzCJiL\n2wwVGxJ0NEAxfHFUyIgdHsQ5n7KDcMgzXZ/WvuQJSIRBKNl86FuktIui8w19ag+I\neFPKgeqMdJdbwh9JZdJvNejBTw4Nyr0YS+nEoCJqKF0xUGmBsHY8BsxBshUpienB\nnCHSf9VVzQKBgDHTqW7tpyeqjD1f26NMj4f4Pyyrb4ASDjyjVLM37I5CtWxB0AiB\nQv13eMfIYTKI+uGVlCnlQJl9DbUvZPHy971rrvB6+DUAzvRfMU2BnfKlsU+5aB6i\nVPQT8FpNls+gTFB0WbSiNqun1QIZL2F3EmX+wkGLPEtCqtappkoaus15AoGAO3uo\nXzXHhrm6LNSqtRnU1ZCyJoe1/CjsLsO0IIxeVZz1sdA01BtcfsCqlKicSqjmPIso\nI7HUdOj5Iyk7jZOdf3vK8MOEezIhfoSLOTqZUrqFphB9JjyJ7dQIf9LPn1s4o0wT\nXKT54pKXLOOxgTwsgyjEZmt4tvo2A69b2r8OGD0CgYAEhRiMUNsHEhiKTvvz/DU1\n2PshY49SZ50apOVpexKRmqo6UQDtKtDaErKKfJOxP4CGEhOtUvxJ2qMASuwbqQq+\n5JZ2+W2hdI1nZKLVJbA0WrshsXwIVWG7KGkWbh77KocGm8sx4F5ccLcia56gIEy0\nNrtKHDmnhSf09oRGZ5n4qg==\n-----END PRIVATE KEY-----\n",
      "client_email": "firebase-adminsdk-w4f3i@hemodynamic-simulator.iam.gserviceaccount.com",
      "client_id": "115737869529677260955",
      "auth_uri": "https://accounts.google.com/o/oauth2/auth",
      "token_uri": "https://oauth2.googleapis.com/token",
      "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
      "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-w4f3i%40hemodynamic-simulator.iam.gserviceaccount.com"
    }),
  });
}

export const adminDB = getFirestore();