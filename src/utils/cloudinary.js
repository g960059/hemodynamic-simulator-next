import { Cloudinary } from "@cloudinary/url-gen";
 import { source } from "@cloudinary/url-gen/actions/overlay";
 import { fit, fill } from "@cloudinary/url-gen/actions/resize";
 import { Position } from "@cloudinary/url-gen/qualifiers";
 import { compass } from "@cloudinary/url-gen/qualifiers/gravity";
 import { text } from "@cloudinary/url-gen/qualifiers/source";
 import { TextStyle } from "@cloudinary/url-gen/qualifiers/textStyle";
 import { fetch } from "@cloudinary/url-gen/qualifiers/source";

 const cld = new Cloudinary({
  cloud: {
    cloudName: "drqmm6lsn",
  },
});

export const getOgpImageUrl = (title, userProfileImageURL, userName) => {
  const ogpImage = cld.image('CircleHeartOGPBackground.png');
  // タイトルのオーバーレイ
  ogpImage
    .resize(fit())
    .overlay(
      source(
        text(title, new TextStyle('Sawarabi Gothic',50)
          .fontWeight('bold'))
          .textColor('#000')
      )
      .position(new Position().gravity(compass('north_west')).offsetY(105).offsetX(110)) 
    )
    .overlay(
      source(
        text("@" + userName, new TextStyle('Sawarabi Gothic',30))
          .textColor('#000')
      )
      .position(new Position().gravity(compass('south_west')).offsetY(120).offsetX(110))
    )
    .overlay(
      source(
        text("CircleHeart", new TextStyle('Sawarabi Gothic',35).fontWeight('bold'))
          .textColor('#000')
      )
      .position(new Position().gravity(compass('south_east')).offsetY(120).offsetX(110))
    )
  ogpImage.overlay(
    source(fetch("https://res.cloudinary.com/drqmm6lsn/image/upload/v1692972758/CircleHeartIcon.png").transformation(fill().width(40).height(40)))
    .position(
      new Position().gravity(compass("south_east")).offsetX(295).offsetY(115)
    )
  );

  // ユーザー名のテキストオーバーレイ
  // ogpImage.overlay(
  //   source(
  //     text(userName, new TextStyle("zen-maru-gothic.ttf", 20)).textColor("#626161")
  //   ).position(
  //     new Position().gravity(compass("southWest")).offsetX(160).offsetY(-50)
  //   )
  // );

  return ogpImage.toURL();
};