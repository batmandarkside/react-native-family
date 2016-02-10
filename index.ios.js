/**
 * React Native Webpack Starter Kit
 * https://github.com/jhabdas/react-native-webpack-starter-kit
 */
import React, {AppRegistry, Component} from 'react-native';
//import { Provider } from 'react-redux';
//import store from './src/store';
import Raven from 'raven-js';
import Router from './src/router';

/*Raven.config('http://6f138f13e4754b139769570b528c0220@sentry01.family.rambler.ru/8', {
 logger: 'javascript',
 whitelistUrls: [
 /rambler\.ru/,
 /letidor\.lh\.ru/,
 /\.family\.rambler\.ru/
 ],
 ignoreErrors: [
 'fb_xd_fragment'
 ]
 }).install()*/


class Root extends Component {

  componentDidMount() {

  }

  render() {
    return (
      <Router {...this.props} />
    );
  }
}


AppRegistry.registerComponent('App', () => Root);
