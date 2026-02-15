import { Platform, View } from 'react-native';
import React from 'react';

let Swipeable: any;
if (Platform.OS !== 'web') {
  Swipeable = require('react-native-gesture-handler').Swipeable;
}

const WebSwipeable = React.forwardRef((props: any, ref: any) => {
  if (Platform.OS === 'web') {
    return <View>{props.children}</View>;
  }
  return <Swipeable {...props} ref={ref}>{props.children}</Swipeable>;
});

export default WebSwipeable;
