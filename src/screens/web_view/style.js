const { StyleSheet } = React;
import * as device from '_utils/device';
import {baseStyleLayoutsContainer} from '_app/styles/base';

export default StyleSheet.create({
  web_view : {
    flex: 1
  },
  container : {
    ...baseStyleLayoutsContainer
  },
  scrollView : {
    flex: 1,
    marginTop: device.size(39),
    paddingTop: device.size(10),
    paddingBottom: device.size(10),
    paddingLeft: device.size(13),
    paddingRight: device.size(13)
  }
});

