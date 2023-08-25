import { Cloudinary } from "@cloudinary/url-gen";
 import { source } from "@cloudinary/url-gen/actions/overlay";
 import { fit } from "@cloudinary/url-gen/actions/resize";
 import { Position } from "@cloudinary/url-gen/qualifiers";
 import { compass } from "@cloudinary/url-gen/qualifiers/gravity";
 import { text } from "@cloudinary/url-gen/qualifiers/source";
 import { TextStyle } from "@cloudinary/url-gen/qualifiers/textStyle";

 const cld = new Cloudinary({
  cloud: {
    cloudName: "drqmm6lsn",
  },
});

export const getOgpImageUrl = (title, userProfileImageURL, userName) => {
  console.log(userProfileImageURL)
  const ogpImage = cld.image("CircleHeartOGP_fm3ixg");
  
  // タイトルのオーバーレイ
  ogpImage
    .resize(fit())
    .overlay(
      source(
        text(title, new TextStyle("zen-maru-gothic.ttf", 30)).textColor("#626161")
      ).position(
        new Position().gravity(compass("west")).offsetX(50).offsetY(-30)
      )
    );

  // ユーザープロフィール画像のオーバーレイ
  ogpImage.overlay(
    source(userProfileImageURL).resize(fit(100, 100))
    .position(
      new Position().gravity(compass("southWest")).offsetX(50).offsetY(-50)
    )
  );

  // ユーザー名のテキストオーバーレイ
  ogpImage.overlay(
    source(
      text(userName, new TextStyle("zen-maru-gothic.ttf", 20)).textColor("#626161")
    ).position(
      new Position().gravity(compass("southWest")).offsetX(160).offsetY(-50)
    )
  );

  return ogpImage.toURL();
};