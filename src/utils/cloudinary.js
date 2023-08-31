import { Cloudinary, CloudinaryImage } from "@cloudinary/url-gen";
 import { source } from "@cloudinary/url-gen/actions/overlay";
 import { fit, fill } from "@cloudinary/url-gen/actions/resize";
 import { Position } from "@cloudinary/url-gen/qualifiers";
 import { compass } from "@cloudinary/url-gen/qualifiers/gravity";
 import { text } from "@cloudinary/url-gen/qualifiers/source";
 import { TextStyle } from "@cloudinary/url-gen/qualifiers/textStyle";
 import { fetch } from "@cloudinary/url-gen/qualifiers/source";
 import { format } from "@cloudinary/url-gen/actions/delivery";
import { auto } from "@cloudinary/url-gen/qualifiers/format";

 const cld = new Cloudinary({
  cloud: {
    cloudName: "drqmm6lsn",
  },
});



export const getOgpImageUrl = (title, userProfileImageURL, userName) => {
  const ogpImage = cld.image('CircleHeartOGPBackground.png');
  // タイトルのオーバーレイ
  ogpImage
    .addTransformation(
      `c_scale,w_1200/c_fit,l_text:notosansjpBold.ttf_55_bold:${encodeURIComponent(title)},w_950/fl_layer_apply,g_north,y_150/`
    )
    .overlay(
      source(
        text("@" + userName, new TextStyle('notosansjpMedium.ttf',35))
          .textColor('#000')
      )
      .position(new Position().gravity(compass('south_west')).offsetY(110).offsetX(130))
    )
    .overlay(
      source(
        text("CircleHeart", new TextStyle('notosansjpBold.ttf',35).fontWeight('bold'))
          .textColor('#000')
      )
      .position(new Position().gravity(compass('south_east')).offsetY(110).offsetX(130))
    )
    .overlay(
      source(fetch("https://res.cloudinary.com/drqmm6lsn/image/upload/v1692972758/CircleHeartIcon.png").transformation(fill().width(40).height(40)))
      .position(
        new Position().gravity(compass("south_east")).offsetX(330).offsetY(105)
      )
    )
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