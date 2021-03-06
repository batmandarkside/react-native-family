import React, {
  Component,
  PanResponder,
  Animated,
  Easing,
  Platform,
  Navigator,
  StyleSheet,
  TouchableOpacity,
  StatusBarIOS,
  Dimensions,
  View,
  Text,
  Image
} from 'react-native';
import store from './store';

import Icon from 'react-native-vector-icons/FontAwesome';
import IndexScreen from './screens/index';
import ArticlesScreen from './screens/articles';
import ArticleItemScreen from './screens/article_item';
import NewsScreen from './screens/news';
import NewsItemScreen from './screens/news_item';
import SearchScreen from './screens/search';
import Menu from './components/menu';
import WebViewScreen from './screens/web_view';
import Link, {SetNavigator} from './components/link';
import styles from './styles/base';
import _ from 'lodash';

import { NAVIGATOR_CHANGE } from './module_dal/actions/actions';

const SCREEN_WIDTH  = Dimensions.get('window').width;
const BaseConfig    = Navigator.SceneConfigs.FloatFromRight;
BaseConfig.gestures = {};

/**
 * Перекрашиваем текст в StatusBarIOS в белый цвет
 * незабыть добавить в info.plist -  UIViewControllerBasedStatusBarAppearance : NO
 */
StatusBarIOS.setStyle(1);

/**
 *
 * @type {{snapVelocity: number, edgeHitWidth: *}}
 */
const CustomLeftToRightGesture = {
  ...BaseConfig.gestures,
  snapVelocity: 8,
  edgeHitWidth: SCREEN_WIDTH
}

/**
 *
 * @type {{springTension: number, springFriction: number, gestures: {pop: {snapVelocity: number, edgeHitWidth: *}}}}
 */
const CustomSceneConfig = {
  ...BaseConfig,
  springTension: 100,
  springFriction: 1,
  gestures: {
    pop: CustomLeftToRightGesture
  }
}

/**
 *
 */
class Router extends Component {

  constructor(props) {
    super(props)

    this.state = {
      x: 0,
      translateX: new Animated.Value(0),
      opacity: 1
    }

    this.dragging    = false;
    this._isOpenMenu = false;
    this._drag       = {
      x: 0,
      y: 0,
      dragX: 115,
      dragY: 100,
      dragBack: 60
    }

    this._currentScreenId = '';

    this.initialRoute = {
      title: 'App Name Test',
      type: 'tab',
      id: 'news',
      navigation_params: {
        title: 'Новости'
      }
    }

    this._panResponder = PanResponder.create({
      onStartShouldSetPanResponder: (evt, gestureState) => false,
      onStartShouldSetPanResponderCapture: this._onStartShouldSetResponder.bind(this),
      onMoveShouldSetPanResponder: this._onResponderMove.bind(this),
      onMoveShouldSetPanResponderCapture: (evt, gestureState) => false
    });
  }

  componentWillMount() {

  }

  /**
   *
   * @param route
   * @param navigator
   * @returns {XML}
   */
  renderScene(route, navigator) {

    SetNavigator(navigator);

    const screenParams = {
      navigator,
      ...route
    }

    this._currentScreenId = route.id;

    switch (route.id) {
      case 'index_screen':
        return <IndexScreen {...screenParams} />
        break;
      case 'articles':
        return <ArticlesScreen {...screenParams} />
        break;
      case 'articles_item':
        return <ArticleItemScreen {...screenParams} />
        break;
      case 'news':
        return <NewsScreen {...screenParams} />
        break;
      case 'news_item':
        return <NewsItemScreen {...screenParams} />
        break;
      case 'search':
        return <SearchScreen {...screenParams} />
        break;
      case 'web_view':
        return <WebViewScreen {...screenParams} />
        break;
      default:
        return <IndexScreen {...screenParams} />
    }
  }


  /**
   *
   * @returns {{LeftButton: LeftButton, Title: Title, RightButton: RightButton}}
   * @private
   */
  _navBarRouteMapper() {
    return {
      LeftButton: (route, navigator) => {
        if (this.initialRoute.id != route.id) {
          return (
            <TouchableOpacity style={styles.crumbIconPlaceholder} onPress={() => { navigator.pop() }}>
              <Icon name="angle-left" style={styles.crumbIconAngle}/>
            </TouchableOpacity>
          )
        } else {
          return (
            <TouchableOpacity style={styles.crumbIconPlaceholder} onPress={() => { this._toggleMenu() }}>
              <Icon name="bars" style={styles.crumbIcon}/>
            </TouchableOpacity>
          )
        }
      },
      Title: (route) => {
        const {navigation_params} = route;
        return (
          <View style={styles.title}>
            <Text style={styles.title_blank}>&nbsp;</Text>
            <Text style={styles.title_item}>{navigation_params.title || 'TITLE'}</Text>
          </View>
        );
      },
      RightButton: (route, navigator) => {

        const nav = {
          id: 'search',
          title: 'Поиск',
          navigation_params: {
            title: 'Поиск'
          }
        };
        return (route.id == 'search' ? null :
            <TouchableOpacity style={styles.crumbIconPlaceholder}
                              onPress={() => { navigator.push(nav)}}>
              <Icon name="search" style={styles.crumbIcon}/>
            </TouchableOpacity>
        )
      }
    }
  }


  /**
   * отслеживаем swipe событие
   * сдвигаем главную View и показываем меню
   *
   * Условия по которым происходит анимация смещения View
   *   если swipe по X больше чем 115
   *   если меню еще не открыто
   *   если смещение по Y не больше 100
   *
   *
   * Если смещение по Y больше 100, то прячем меню
   *
   *
   * Смешение слоя и показ меню жестом возможен только на главном экране ->
   * с которого стартануло приложение
   * на всех остальных экранах можно только по клику на иконку меню
   *
   *
   *
   * @param evt
   * @param gestureState
   * @returns {boolean}
   * @private
   */
  _onResponderMove(evt, gestureState) {
    evt = evt.nativeEvent;

    const {x, y, dragX, dragY, dragBack} = this._drag;
    const positionX       = Math.round(this.state.x + (evt.pageX - x));
    const prevPositionX   = Math.round(x);
    const revertPositionX = prevPositionX - (prevPositionX + positionX);
    const isOpen          = this._isOpenMenu;

    function move() {
      if (Math.abs(evt.pageY - y) > dragY && isOpen) {
        this.resetPosition()
      }

      if (positionX > dragX && revertPositionX < 0 && !isOpen && Math.abs(evt.pageY - y) < dragY) {
        this._openMenu()
        this._drag.x = evt.pageX;
      } else if (revertPositionX >= dragBack && isOpen) {
        this.resetPosition()
      }
    }

    setTimeout(move.bind(this), 66);
    return false;
  }


  _onStartShouldSetResponder(evt) {
    this.dragging = true;
    this._drag    = {
      ...this._drag,
      x: evt.nativeEvent.pageX,
      y: evt.nativeEvent.pageY
    }
    return false;
  }

  getStyle() {
    return {
      transform: [{
        translateX: this.state.translateX
      }]
    };
  }

  _toggleMenu() {
    if (this._isOpenMenu) {
      this.resetPosition();
    } else {
      this._openMenu()
    }
  }

  _openMenu() {
    this._isOpenMenu = true;
    Animated.spring(
      this.state.translateX,
      {
        toValue: SCREEN_WIDTH - 100,
        duration: 300,
        easing: Easing.elastic(2)
      }
    ).start();
  }

  resetPosition(evt) {
    this.dragging    = false;
    this._isOpenMenu = false;
    Animated.spring(
      this.state.translateX,
      {
        toValue: 0,
        duration: 300
      }
    ).start();
  }

  /**
   * Событие Navigator, после того как отрисуется view
   * создаем событие NAVIGATOR_CHANGE для меню
   *
   * @param navigator
   * @private
   */
  _onDidFocus(navigator) {

    const lastRoute = _.last(navigator.getCurrentRoutes())
    let routeId     = lastRoute.id;

    if (routeId) {
      if (routeId.indexOf('articles') != -1) {
        routeId = 'articles';
      } else if (routeId.indexOf('news') != -1) {
        routeId = 'news';
      }
    }

    const route = {
      ...lastRoute,
      routeId
    }

    store.dispatch({
      type: NAVIGATOR_CHANGE,
      data: route
    })

    if (this._isOpenMenu) {
      this.resetPosition();
    }
  }

  render() {
    return (
      <View style={styles.root_view}
        {...this._panResponder.panHandlers}>

        <Menu />

        <Animated.View style={[styles.root_view_wrapper, this.getStyle()]}>
          <Navigator
            initialRoute={this.initialRoute}
            ref={navigator => {
              navigator && navigator.navigationContext.addListener('didfocus', this._onDidFocus.bind(this, navigator));
            }}
            renderScene={this.renderScene.bind(this)}
            configureScene={(route, routeStack)=>CustomSceneConfig}
            navigationBar={<Navigator.NavigationBar routeMapper={this._navBarRouteMapper()} />}
            style={styles.navigator}/>
        </Animated.View>
      </View>
    )
  }
}

export default Router;



