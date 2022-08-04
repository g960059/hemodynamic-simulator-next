import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

if (!getApps()?.length) {
  initializeApp({
    credential: cert(
      {
        "type": "service_account",
        "project_id": "hemodynamic-simulator",
        "private_key_id": "fec27da9674cc4cb8d32bc5a251aca06f8a49371",
        "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvwIBADANBgkqhkiG9w0BAQEFAASCBKkwggSlAgEAAoIBAQCwPPVHCMI7ndEI\n229c06dcZWdUPMwHS1SnnaK/cxvppPzwOaMBSwP89RdBLXcoqNST8OoxNK3J/saK\n4+nhsbwLZhk5HwDo3RVdTZMS8zOBlj+hptmdbz6Xveb71Td2ikfHeVOzkGvZMpE9\nR8Ae1F40RXLzr+gWM2N0E5sksh8E8wdkxoVnsmBX5uWusI6t2a+RPj2HM6xmdNmp\n/6R/XwsVevA/XFyyS0UgXJitJYH3XTDaE0OHEoDeT14YB2vlbjAl0YW5wfKgrBQo\no4agJfof9Jxm4fn++izEQ0zQ0LRAo5B7UnuVz2c352TKSBM8XcL+yYWVLwzzIgua\nbWdJjlbBAgMBAAECggEAAXFWTrEPKf7GPczSEg/3gEWiPWnL/8lJlZ+wO+H82gJM\nQckvAO00yKbW/GUbYx1StC1WNXXpcExiIrPv77WNRQiebz3GO6HHsX5XlGGiS87H\nkZK0mFnXSNW4pNoffJxwLv1axo8JmvsTfk1ukLILXWEuKjmH7FqaV1JrxDajE17I\ncFqWEeVxRuZL4re8gEgddw6Yxdprb1EL+HaRUcQa+KnpgMAZbsrb0ABdGQeY2Zs8\n3K4Ow7Qj89MMp7wNHeDFOZbJMT4yhs5eRySmDfiDlwf1VmZ86hp+ccTn3sa90Bbt\nPQ3OEKiIhfQnAt8m8aCGj7II7MZ+iqxT4wdlE9iBowKBgQDx+bsZeOYAIYvM7PjH\nQOQvrE8XyyIrbgpPW8gtRF2mjjlfEJ8kYiKb56ASbtP3ZN/9z5Ow6QFrj1bTf6IH\nw31yqyyu2i+iv2x5nKS7c1P0CuRDWw4s4HW21iOvA1wnLcyTqAOtcW7DuhDSQra8\nGuysRW5543qou2fTDk7CzBbJjwKBgQC6c9w37hOhLq+oYI5mUEYF5WG/pRKPLDKT\nIN4ZyP+b/WkXqoPfX4cXCWmwSPY4pBozy8oJi72+PgfSCOiu18t41Yn71wj/ecDg\nNS+b4OsLyWjsy/hkk3eN5syF23p5HPwM0dsJFvhKgZJasIaxLpQSFeFPitqm8O40\nFSu2vwmSrwKBgQDApsWR6DGmlQ7LHziK211Rn2xxUydnUHsg58AeWjn9q2p+B6vM\nud04J1fIlThp1YSIfUXnKfwZeMv2I74LVFeCfkpbBBe9CY8B2/dDzvRebnWCMvK8\nRBE0epV6d8Bc6Rfhz3juFEvNxUwzOy5l4UHhfn4QyU4VHO/yl4eZjAfwfQKBgQCW\n0DRmgQobq/mlhkRoebHJ/xoru8fhSuy1mTZNQQmQEU+6NtBoE4rflVuJndqbQhF3\np/UJ96BIi0AkIdSj6CTK3l63991tV/ws3phdy3YTmJxoPSvznlxryS3RcBAGeu1d\nKTm0hoHbMidBd9va4UQfxNb0Ueo+ck8aja1IKgoCPQKBgQCbIH9h0LiW6Ya0fMI/\nRkZvFZ8n9tD4JE5F0HglCQtzJWWyNVVfq6A9VwJTsZxjTZJPd841ijnpIn/lGUhO\nC8471kXrIDJUicX/vXDhV2Sn6CnWWeznqvuv2j57PgWU0CiSQgMTGa2Xwokripov\nSe6uXaxErWwOIGjiKJRdtxBD3w==\n-----END PRIVATE KEY-----\n",
        "client_email": "firebase-adminsdk-w4f3i@hemodynamic-simulator.iam.gserviceaccount.com",
        "client_id": "115737869529677260955",
        "auth_uri": "https://accounts.google.com/o/oauth2/auth",
        "token_uri": "https://oauth2.googleapis.com/token",
        "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
        "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-w4f3i%40hemodynamic-simulator.iam.gserviceaccount.com"
      }
    )
  });
}

export const adminDB = getFirestore();